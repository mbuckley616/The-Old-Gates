
// ═══════════════════════════════════════════════════════════════════════
// v80 — STREAMED WORLD (Sessions 1–55 · forts)
//
// One continuous exterior scene. Terrain is a pure function of (x,z) — no
// stored heightmap — so any point is computable from the seed. A chunk
// streamer keeps a ring of terrain tiles + instanced scatter loaded around
// the player. Settlements, forts and dungeon doors are "stamps" at fixed
// world coordinates that flatten the terrain under them.
//
// This registers as a single zone, id 'world', using the existing zone
// contract (ZONES[id] = {scene, getY, portals, enemies, ...}) so combat,
// dungeons, herbs, day/night and the render loop need no changes. The
// zone-cell system (gates, placeholders, buildVillage etc.) is left in
// place and unreachable; it is retired in later sessions as pieces port
// over as stamps.
//
// Coordinates: world is SIZE×SIZE units, x east, z south (yaw 0 = north = -Z,
// matching the engine convention). Mountains are the north wall (low z),
// sea on west/south/east edges.
// ═══════════════════════════════════════════════════════════════════════
var WORLD=(()=>{
  const VC_MAT=new THREE.MeshLambertMaterial({vertexColors:true}); // one shared material for every vertex-coloured (non-instanced) mesh
  const HERB_MAT=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}); // instanced without instance colour: its own program; both sides, for the plants' flat leaves (S167)
  const SIZE=2400;        // world side length
  const CHUNK=64;         // chunk side length
  const SEGS=16;          // terrain segments per chunk (4u per vertex)
  let RADIUS=4;           // chunks loaded each side of the player (9×9); WORLD.setRadius(n) to tune
  const SEA_Y=0;          // sea level
  const SEED=(()=>{try{const c=JSON.parse(localStorage.getItem('og_carry')||'null');if(c&&c.seed)return 8080+(c.seed%90000);}catch(e){}return (typeof window!=='undefined'&&window.OG_SEED)||8080;})();
  const FAR_STEP=16;      // far-terrain vertex spacing
  const BUILD_PER_FRAME=1;// chunk builds per frame after initial load

  // ── Regions ──────────────────────────────────────────────────────────
  // Lore cardinal layout: Windward Coast far west, Deepwood/Ashen SW-center,
  // Bealach center-west, Ferrous Reach center-north, Wastes dead center,
  // Greywood center-east, Gilded Coast far east. Each region is a soft
  // radial field; weights blend so borders are gradients, not seams.
  // biome keys reference BIOME_PROFILES (forest/plains/coast/wastes).
  // Layout follows the lore map grid (MAP_LAYOUT col/row → world): mountains
  // and foothill villages along the north wall, the Royale/capital in the
  // north-east, An Bealach Mór through the centre, the coast down the west,
  // Ashenmoor in the south-west, the Wastes in the south-east, the Greywood
  // between Wastes and Royale, the Deepwood on the Thorngate→La Porte Grise
  // corridor.
  const HOME_REGIONS=[
    {id:'coastal',   x:250,  z:1750, r:620, biome:'coast',  amp:7, trees:'scrub',    density:.10, rocks:1.4, music:'coast',     enc:.08},
    {id:'ashen',     x:850,  z:1950, r:520, biome:'plains', amp:8, trees:'broadleaf',density:.42, rocks:.5,  music:'overworld', enc:.16},
    {id:'bealach',   x:1200, z:1450, r:560, biome:'plains', amp:5, trees:'broadleaf',density:.20, rocks:.4,  music:'road',      enc:.14},
    {id:'deepwood',  x:1330, z:920,  r:400, biome:'forest', amp:9, trees:'conifer',  density:.85, rocks:.5,  music:'forest',    enc:.22},
    {id:'foothills', x:1500, z:330,  r:640, biome:'forest', amp:16,  trees:'conifer',  density:.50, rocks:1.8, music:'forest',    enc:.18},
    {id:'royale',    x:1800, z:780,  r:560, biome:'plains', amp:5, trees:'broadleaf',density:.20, rocks:.4,  music:'road',      enc:.08},
    {id:'wastes',    x:1750, z:1850, r:440, biome:'wastes', amp:4, trees:'dead',     density:.12, rocks:1.0, music:'wastes',    enc:.2},
    {id:'greywood',  x:2120, z:1420, r:400, biome:'forest', amp:10, trees:'broadleaf',density:.72, rocks:.6,  music:'forest',    enc:.2},
  ];
  const REGIONS=[]; // live: regions of loaded cells
  const BIOME_TREE={forest:'conifer',plains:'broadleaf',coast:'scrub',wastes:'dead',tundra:'snowpine',fen:'willow',moor:'scrub',autumn:'autumn',dunes:'scrub',swamp:'mushroom',wasteland:'dead'};
  // new ground profiles (the engine's table only knows the original four)
  // Full profiles (sky, fog colour, fog density, ground) — a partial one makes the atmosphere NaN and the whole scene renders black.
  if(typeof BIOME_PROFILES!=='undefined'){const base=BIOME_PROFILES.plains||BIOME_PROFILES.forest||{};const mk=(o)=>Object.assign({},base,o);Object.assign(BIOME_PROFILES,{
    tundra:mk({groundBase:'#cfd6d8',bgCol:0xa8bcd0,fogCol:0xc4d0dc,fogDen:.011}),fen:mk({groundBase:'#4a5a34',bgCol:0x7a8a7a,fogCol:0x8a9a86,fogDen:.016}),moor:mk({groundBase:'#6a5a4e',bgCol:0x8a96a8,fogCol:0x9aa4b0,fogDen:.010}),
    autumn:mk({groundBase:'#8a6a34',bgCol:0xa8b8d0,fogCol:0xc8b8a0,fogDen:.009}),dunes:mk({groundBase:'#d8c48c',bgCol:0x9cc0e8,fogCol:0xe0d4b8,fogDen:.007}),swamp:mk({groundBase:'#3a4a2a',bgCol:0x6a7a68,fogCol:0x707e68,fogDen:.018}),wasteland:mk({groundBase:'#4e4a46',bgCol:0x6a6260,fogCol:0x76706a,fogDen:.014})});}

  // Region weights at a point. Returns array of {r,w} with w summing to 1.
  const _rwBuf=[];
  function regionWeights(x,z){
    while(_rwBuf.length<REGIONS.length)_rwBuf.push({r:null,w:0});_rwBuf.length=REGIONS.length;
    for(let i=0;i<REGIONS.length;i++)_rwBuf[i].r=REGIONS[i];
    let sum=0;
    for(let i=0;i<REGIONS.length;i++){
      const r=REGIONS[i];
      const d=Math.hypot(x-r.x,z-r.z);
      let w=Math.max(0,1-d/r.r); w=w*w;
      _rwBuf[i].w=w; sum+=w;
    }
    if(!REGIONS.length){return _rwBuf;}
    if(sum<1e-6){
      // Outside every field — nearest region wins.
      let best=0,bd=Infinity;
      for(let i=0;i<REGIONS.length;i++){const r=REGIONS[i];const d=Math.hypot(x-r.x,z-r.z)/r.r;if(d<bd){bd=d;best=i;}}
      for(let i=0;i<REGIONS.length;i++)_rwBuf[i].w=(i===best)?1:0;
      return _rwBuf;
    }
    for(let i=0;i<REGIONS.length;i++)_rwBuf[i].w/=sum;
    return _rwBuf;
  }
  const _fallbackRegion={id:'sea',biome:'coast',amp:3,trees:'scrub',density:.28,rocks:.5,music:'coast',enc:0};
  function dominantRegion(x,z){
    const ws=regionWeights(x,z);if(!ws.length)return {r:_fallbackRegion,w:1};let best=ws[0];
    for(const e of ws)if(e.w>best.w)best=e;
    return best;
  }
  // Weighted scalar over regions.
  function regionScalar(x,z,key){
    const ws=regionWeights(x,z);let v=0;
    for(const e of ws)v+=e.w*e.r[key];
    return v;
  }

  // ── Noise ────────────────────────────────────────────────────────────
  // Uses the engine's _smoothNoise (value noise, smoothstep fade). fbm
  // stacks octaves; the (x,z) offsets per octave decorrelate them.
  function fbm(x,z,scale,seed,oct){
    let a=1,s=scale,sum=0,norm=0;
    for(let i=0;i<oct;i++){
      sum+=a*_smoothNoise(x+i*173.1,z-i*91.7,seed+i*7919,s);
      norm+=a;a*=.5;s*=.5;
    }
    return sum/norm; // 0..1
  }
  function sstep(e0,e1,v){const t=Math.max(0,Math.min(1,(v-e0)/(e1-e0)));return t*t*(3-2*t);}

  // ── Height ───────────────────────────────────────────────────────────
  // rawH: the land before stamps. worldH: with stamp flattening.
  function rawH(x,z){
    let h=landH(x,z);
    for(const rv of RIVERS){
      const d=polyDist(rv.pts,x,z);if(d>=rv.w+rv.blend)continue;
      const t=d<=rv.w?1:1-(d-rv.w)/rv.blend,e=t*t*(3-2*t);
      const bed=Math.min(h,rv.depth);h=h*(1-e)+bed*e;
    }
    for(const lk of LAKES){
      const d=Math.hypot(x-lk.x,z-lk.z);if(d>=lk.r+lk.blend)continue;
      const t=d<=lk.r?1:1-(d-lk.r)/lk.blend,e=t*t*(3-2*t);
      h=h*(1-e)+lk.depth*e;
    }
    for(const inl of INLETS){
      const d=polyDist(inl.pts,x,z);if(d>=inl.w+inl.blend)continue;
      const t=d<=inl.w?1:1-(d-inl.w)/inl.blend,e=t*t*(3-2*t);
      h=h*(1-e)+inl.depth*e;
    }
    return h;
  }

  // ═══ LANDMARKS ═══════════════════════════════════════════════════════
  // Two named peaks you can climb; rivers with fords where roads cross;
  // a lake in the west; a sea inlet that brings the coast to the capital.
  const HOME_PEAKS=[
    {id:'sliabh_mor',name:'Sliabh Mór',x:1010,z:900,r:300,h:150,kind:'peak'},
    {id:'the_cinder',name:'The Cinder',x:1820,z:1600,r:190,h:95,kind:'peak'},
  ];
  const HOME_RIVERS=[
    {id:'redwater',pts:[[1200,300],[1150,700],[1220,1100],[1245,1510],[1200,1800],[1060,2100],[1000,2330]],w:5,depth:-2.6,blend:22},
    {id:'westwater',pts:[[930,1010],[880,1150],[640,1230],[520,1310],[350,1400],[120,1420]],w:4,depth:-2.2,blend:18},
  ];
  const HOME_LAKES=[{id:'loch_liath',name:'Loch Liath',x:560,z:1250,r:105,depth:-4,blend:70}];
  const HOME_INLETS=[{id:'gilded_bay',pts:[[2420,1140],[2150,1125],[1960,1065]],w:44,depth:-7,blend:36}];
  const PEAKS=[],RIVERS=[],LAKES=[],INLETS=[],DOORS=[]; // live: landmarks/doors of loaded cells
  function polyDist(pts,x,z){ // nearest distance to a polyline, with bbox reject
    let best=1e9;
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1];
      if(x<Math.min(a[0],b[0])-80||x>Math.max(a[0],b[0])+80||z<Math.min(a[1],b[1])-80||z>Math.max(a[1],b[1])+80)continue;
      const vx=b[0]-a[0],vz=b[1]-a[1],l2=vx*vx+vz*vz||1;
      let t=((x-a[0])*vx+(z-a[1])*vz)/l2;t=t<0?0:t>1?1:t;
      const d=Math.hypot(x-(a[0]+vx*t),z-(a[1]+vz*t));if(d<best)best=d;
    }
    return best;
  }
  function ridged(x,z,scale,seed){const v=fbm(x,z,scale,seed,3);return 1-Math.abs(v*2-1);}
  // Land without water carving — what pads and road beds are measured from.
  function landH(x,z){
    const amp=regionScalar(x,z,'amp');
    const cont=(fbm(x,z,420,SEED+1,3)-.5)*2*11+7;
    const hills=(fbm(x,z,110,SEED+2,3)-.5)*2*amp;
    const rg=(ridged(x,z,60,SEED+7)-.5)*amp*.55;         // ridgelines
    const det=(_smoothNoise(x,z,SEED+3,24)-.5)*1.4+(_smoothNoise(x,z,SEED+4,8)-.5)*.4;
    let h=cont+hills+rg+det;
    const mt=ridgeAt(x,z);
    if(mt>0)h+=mt*mt*(70+fbm(x,z,70,SEED+5,3)*60);
    for(const p of PEAKS){
      const d=Math.hypot(x-p.x,z-p.z);if(d>=p.r)continue;
      const t=1-d/p.r;const prof=Math.pow(t,1.35);
      h+=p.h*prof*(.7+.6*ridged(x,z,45,SEED+8))+p.h*.08*t;
    }
    const sea=seaAt(x,z);
    if(sea>0)h=h*(1-sea)+(-8)*sea;
    if(sea<.02&&h<1.6)h=1.6-.6*(1-Math.exp((h-1.6)/1.5));
    return h;
  }
  const STAMPS=[]; // {id,x,z,r,blend,y}
  function addStamp(s){
    if(s.y==null)s.y=landH(s.x,s.z);
    if(s.blend==null)s.blend=Math.max(10,s.r*.6);
    if(!s.cell)s.cell=cellKey(...cellOf(s.x,s.z));
    STAMPS.push(s);sgAdd(s);return s;
  }
  function stampAt(x,z){ // stamp whose core radius contains the point, or null
    const arr=stampsNear(x,z);
    for(let i=0;i<arr.length;i++){const s=arr[i];if(Math.hypot(x-s.x,z-s.z)<s.r)return s;}
    return null;
  }
  // baseH: land + stamp pads. worldH: baseH + road bed. Roads are built
  // after stamps, so a road crossing a site pad sits at pad height.
  function baseH(x,z){
    let h=rawH(x,z);
    const arr=stampsNear(x,z);
    for(let i=0;i<arr.length;i++){
      const s=arr[i];
      const dx=x-s.x,dz=z-s.z;
      const R=s.r+s.blend;
      if(dx>R||dx<-R||dz>R||dz<-R)continue;
      const d=Math.hypot(dx,dz);
      if(d>=R)continue;
      const t=d<=s.r?1:1-(d-s.r)/s.blend;
      const e=t*t*(3-2*t);
      h=h*(1-e)+s.y*e;
    }
    return h;
  }
  const ROAD_HALF=2.6,ROAD_BLEND=9.5;
  // v80 S132 — F8: a survey of everything built within 60u, written to the log, so a playtest can say what is actually there
  function devSurvey(){const lines=[];const R=60;
    for(const S of SETTLE.values()){const d=Math.hypot(S.site.x-px,S.site.z-pz);if(d>R+ (S.site.pad||30))continue;lines.push(`settlement ${S.site.id} (${S.site.kind}) at ${d.toFixed(0)}u — ${S.sol.length} solids, ${S.houses.length} houses, group of ${S.group.children.length}`);}
    const st=STATIC_SOL.filter(r=>Math.hypot(r.cx-px,r.cz-pz)<R);const big=st.filter(r=>Math.max(r.rx,r.rz)>=3);lines.push(`static solids within ${R}u: ${st.length} (${big.length} large: ${big.map(r=>`${(r.rx*2).toFixed(0)}×${(r.rz*2).toFixed(0)} at ${Math.hypot(r.cx-px,r.cz-pz).toFixed(0)}u`).join(', ')})`);
    const ks=STAMPS.filter(t=>String(t.id||'').startsWith('keep_')&&Math.hypot(t.x-px,t.z-pz)<R);lines.push(`keeps within ${R}u: ${ks.length}`);
    const ds=DOORS.filter(e=>{const p=dungeonWorldPos[e.seed];return p&&Math.hypot(p.x-px,p.z-pz)<R;});lines.push(`doors within ${R}u: ${ds.map(e=>`${e.canonicalName||e.seed} [${e.kind}]`).join(', ')||'none'}`);
    let meshes=0,tris=0,inst=0;sc.updateMatrixWorld(true);sc.traverse(o=>{if(!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const c=g.boundingSphere.center.clone().applyMatrix4(o.matrixWorld);if(Math.hypot(c.x-px,c.z-pz)>R)return;if(o.isInstancedMesh){inst++;return;}meshes++;tris+=g.index?g.index.count/3:g.attributes.position.count/3;});lines.push(`meshes centred within ${R}u: ${meshes} (${tris|0} triangles), instanced ${inst}`);
    if(typeof addLog==='function')lines.forEach(l=>addLog('🔎',l));showMsg('Survey written to the log (Character tab).','#c8b880');console.log('SURVEY\n'+lines.join('\n'));return lines;}
  function propH(x,z){const g=CHUNK/SEGS;const x0=Math.floor(x/g)*g,z0=Math.floor(z/g)*g;const u=(x-x0)/g,v=(z-z0)/g;const h00=worldH(x0,z0),h10=worldH(x0+g,z0),h01=worldH(x0,z0+g),h11=worldH(x0+g,z0+g);const bil=h00*(1-u)*(1-v)+h10*u*(1-v)+h01*(1-u)*v+h11*u*v;const tri=(u+v<1)?(h00+(h10-h00)*u+(h01-h00)*v):(h11+(h01-h11)*(1-u)+(h10-h11)*(1-v));return Math.max(worldH(x,z),bil,tri)+.06;}
  window.propH=propH;
  function meshH(x,z){const g=CHUNK/SEGS;const x0=Math.floor(x/g)*g,z0=Math.floor(z/g)*g;const u=(x-x0)/g,v=(z-z0)/g;const h00=worldH(x0,z0),h10=worldH(x0+g,z0),h01=worldH(x0,z0+g),h11=worldH(x0+g,z0+g);return (u+v<1)?(h00+(h10-h00)*u+(h01-h00)*v):(h11+(h01-h11)*(1-u)+(h10-h11)*(1-v));}
  function worldH(x,z){
  // v80 S132 — the height of the drawn ground: the chunk mesh is worldH sampled every 4u and interpolated, so between vertices it can sit above the analytic surface; small props sit on the drawn ground
    let h=baseH(x,z);
    const ri=roadInfo(x,z);
    if(ri){
      const t=1-sstep(ROAD_HALF,ROAD_BLEND,ri.d);
      if(t>0)h=h*(1-t)+ri.y*t;
    }
    return h;
  }
  function slopeNormalY(x,z){
    const e=1.5;
    const hx=worldH(x+e,z)-worldH(x-e,z);
    const hz=worldH(x,z+e)-worldH(x,z-e);
    const len=Math.sqrt(hx*hx+hz*hz+(2*e)*(2*e));
    return (2*e)/len; // normal.y
  }

  // ── Ground colour ────────────────────────────────────────────────────
  const _tmpC=new THREE.Color(),_tmpC2=new THREE.Color();
  const _bioCol={};
  function biomeGround(b){
    if(_bioCol[b])return _bioCol[b];
    const p=BIOME_PROFILES[b]||BIOME_PROFILES.plains;
    const c=new THREE.Color(p.groundBase);
    // Lift the authored ground bases a touch — they were tuned for a
    // texture that darkened them; here vertex colour × detail map.
    c.multiplyScalar(1.25);
    _bioCol[b]=c;return c;
  }
  const ROCK_C=new THREE.Color(0x6a655c),SNOW_C=new THREE.Color(0xd8dce0),SAND_C=new THREE.Color(0xb8ac88),DEEP_C=new THREE.Color(0x36485a);
  function groundColor(x,z,h,ny,out){
    const ws=regionWeights(x,z);
    out.setRGB(0,0,0);
    for(const e of ws){if(e.w<=0)continue;const c=biomeGround(e.r.biome);out.r+=c.r*e.w;out.g+=c.g*e.w;out.b+=c.b*e.w;}
    if(dominantRegion(x,z).r.biome==='autumn'){const lit=_smoothNoise(x,z,SEED+14,2.2);_tmpC2.setHex(lit>.55?0xb85a24:0xc8902c);out.lerp(_tmpC2,.35*sstep(.4,.8,lit));} // leaf litter
    // Micro variation so a flat field isn't a flat colour.
    const v=(_smoothNoise(x,z,SEED+11,13)-.5)*.16+(_smoothNoise(x,z,SEED+12,3.5)-.5)*.08;
    out.r*=1+v;out.g*=1+v*.9;out.b*=1+v*.7;
    // Road verge: worn ground beside the ribbon.
    const ri=roadInfo(x,z);
    if(ri&&ri.d<ROAD_BLEND){_tmpC2.setHex(0x8a7a5a);out.lerp(_tmpC2,.35*(1-sstep(ROAD_HALF,ROAD_BLEND,ri.d)));}
    // Steep = rock.
    const rock=sstep(.86,.62,ny);
    if(rock>0)out.lerp(ROCK_C,rock);
    // High = snow / scree.
    const sl=snowLineAt(x,z);const snow=sstep(sl,sl+20,h+_smoothNoise(x,z,SEED+13,20)*8);
    if(snow>0)out.lerp(SNOW_C,snow);
    // v80 S146 — snow that has settled. Flat ground holds it, steep ground sheds it, and it thickens
    // with altitude. Blended here so a chunk built during a snowfall looks like one recoloured by it.
    if(WX.cover>0&&h>SEA_Y+.4){
      const flat=Math.max(0,(ny-.70)/.30);
      const amt=Math.min(1,WX.cover*flat*(.72+.55*sstep(0,70,h)));
      if(amt>.01)out.lerp(SNOW_C,amt*.94);
    }
    // Shore = sand, then deep water bed.
    if(h<3.2){
      const sand=sstep(3.2,.6,h);out.lerp(SAND_C,sand);
      if(h<-1.0)out.lerp(DEEP_C,sstep(-1.0,-6,h));
    }
    return out;
  }

  // ── Scene / rig state ────────────────────────────────────────────────
  let sc=null,sun=null,sunTarget=null,amb=null,hemi=null,skyDome=null,skyMat=null,water=null,farMesh=null;
  let terrainTex=null,terrainMat=null;
  const chunks=new Map(); // key -> {cx,cz,group,sol,terrain}
  const buildQueue=[];
  let lastCX=null,lastCZ=null;
  const STATIC_SOL=[]; // solids from stamps (portal doors etc.)
  const portals=[]; // live, mutated in place (PORTALS aliases it)

  function chunkKey(cx,cz){return cx+','+cz;}

  // ── Detail texture ───────────────────────────────────────────────────
  function makeTerrainTex(){
    const t=mkTex((ctx,w,h)=>{
      ctx.fillStyle='#b4b4b4';ctx.fillRect(0,0,w,h);
      // Dense fine grain (grass blades / grit) plus sparse dark flecks and a
      // few pale patches; multiplied against the vertex colour. Crisp, not
      // blurry — the blotches are small and hard-edged.
      for(let i=0;i<26000;i++){
        const l=120+Math.random()*120|0;ctx.fillStyle=`rgb(${l},${l},${l})`;
        const x=Math.random()*w,y=Math.random()*h;
        ctx.fillRect(x,y,1,1+Math.random()*3);
      }
      for(let i=0;i<900;i++){
        const l=70+Math.random()*50|0;ctx.fillStyle=`rgb(${l},${l},${l})`;
        ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);
      }
      for(let i=0;i<120;i++){
        const l=175+Math.random()*40|0;ctx.fillStyle=`rgba(${l},${l},${l},.5)`;
        ctx.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*4,1+Math.random()*2);
      }
    },512,512);
    if(REN&&REN.capabilities)t.anisotropy=Math.min(8,REN.capabilities.getMaxAnisotropy());
    return t;
  }

  // ── Prototype geometry (built once, vertex-coloured, non-indexed) ────
  // Merged from primitives without BufferGeometryUtils (not bundled with
  // r128 on the CDN): everything is converted to non-indexed and the
  // attribute arrays are concatenated.
  function mergeParts(parts,ao){ // parts: [{geo, color:THREE.Color, x,y,z, rx,ry,rz, sx,sy,sz}]; ao: shade the creases (personAO's options)
    const pos=[],nor=[],col=[],PR=[];
    const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),n=new THREE.Vector3(),nm=new THREE.Matrix3();
    parts.forEach(p=>{
      const g=p.geo.index?p.geo.toNonIndexed():p.geo;
      e.set(p.rx||0,p.ry||0,p.rz||0);q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x||0,p.y||0,p.z||0),q,new THREE.Vector3(p.sx==null?1:p.sx,p.sy==null?1:p.sy,p.sz==null?1:p.sz));
      nm.getNormalMatrix(m);
      const pa=g.attributes.position,na=g.attributes.normal;
      for(let i=0;i<pa.count;i++){
        v.set(pa.getX(i),pa.getY(i),pa.getZ(i)).applyMatrix4(m);pos.push(v.x,v.y,v.z);
        n.set(na.getX(i),na.getY(i),na.getZ(i)).applyMatrix3(nm).normalize();nor.push(n.x,n.y,n.z);
        // per-vertex jitter keeps big flat colour fields from reading as plastic
        const j=1+(Math.random()-.5)*(p.jitter==null?.08:p.jitter);
        col.push(p.color.r*j,p.color.g*j,p.color.b*j);
      }
      PR.push([pos.length/3-pa.count,pa.count]);
      if(g!==p.geo)g.dispose();
    });
    const raw=ao&&ao.keep?{pos:pos.slice(),nor:nor.slice(),col:col.slice(),PR}:null; // a comparison's copy, before the shading
    if(ao){const t0=performance.now();personAO(pos,nor,col,PR,ao);HAO.ms+=performance.now()-t0;HAO.n++;}
    const out=new THREE.BufferGeometry();if(raw)out.userData.raw=raw;
    out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
    out.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    out.computeBoundingSphere();
    return out;
  }
  const PROTO={};
  // S192 — the species that grow among each biome's main tree, and how often (the rest is the main tree)
  const TREE_MIX={conifer:[['spruce',.2],['broadleaf',.1],['pine',.1],['birch',.06]],broadleaf:[['oak',.25],['birch',.14],['conifer',.08]],
    autumn:[['birch',.14],['oak',.12],['conifer',.12]],snowpine:[['spruce',.16],['dead',.08]],willow:[['birch',.25],['dead',.1]]};
  function buildProtos(){
    const bark=new THREE.Color(0x4a3220),barkDk=new THREE.Color(0x3a2618);
    // Conifer: tapered trunk + three stacked cones, each slightly offset.
    // Old forest: conifers ~15u, broadleafs ~12u at scale 1 (player 1.7u).
    PROTO.conifer=mergeParts([
      {geo:new THREE.CylinderGeometry(.34,.62,6.5,7),color:bark,y:3.25},
      {geo:new THREE.ConeGeometry(3.4,5.6,8),color:new THREE.Color(0x2f6a2a),y:7.2,ry:.3},
      {geo:new THREE.ConeGeometry(2.7,5.0,8),color:new THREE.Color(0x357a30),y:10.0,ry:.9,x:.15},
      {geo:new THREE.ConeGeometry(1.9,4.6,8),color:new THREE.Color(0x3e8a38),y:12.6,ry:1.5,z:.1},
    ]);
    // Broadleaf: trunk + three low-poly blobs.
    PROTO.broadleaf=mergeParts([
      {geo:new THREE.CylinderGeometry(.38,.7,6.0,7),color:barkDk,y:3.0},
      {geo:new THREE.CylinderGeometry(.12,.22,3.2,5),color:barkDk,y:6.6,x:1.2,rz:-.7,jitter:.05},
      {geo:new THREE.CylinderGeometry(.12,.22,3.0,5),color:barkDk,y:6.4,x:-1.1,z:.4,rz:.75,jitter:.05},
      {geo:new THREE.IcosahedronGeometry(3.6,1),color:new THREE.Color(0x4f8a34),y:8.6,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(2.8,1),color:new THREE.Color(0x5a9a3a),y:9.6,x:2.2,z:.8,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(2.6,1),color:new THREE.Color(0x45803a),y:9.4,x:-2.0,z:-1.0,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(2.2,1),color:new THREE.Color(0x559040),y:11.4,x:.3,z:.3,jitter:.14},
    ]);
    // Dead tree: bare trunk + two bent limbs.
    PROTO.dead=mergeParts([
      {geo:new THREE.CylinderGeometry(.22,.55,8.0,6),color:new THREE.Color(0x3a3028),y:4.0},
      {geo:new THREE.CylinderGeometry(.09,.22,4.0,4),color:new THREE.Color(0x3a3028),y:7.2,x:1.2,rz:-.9},
      {geo:new THREE.CylinderGeometry(.08,.2,3.2,4),color:new THREE.Color(0x342a22),y:5.6,x:-1.0,z:.4,rz:.95,rx:.3},
      {geo:new THREE.CylinderGeometry(.06,.14,2.4,4),color:new THREE.Color(0x342a22),y:8.8,x:.3,z:-.7,rz:.4,rx:-.8},
    ]);
    // Coastal scrub: one squat wind-stunted blob.
    // autumn broadleaf (tinted per instance), snow-capped pine, mushroom, willow
    const c=x=>new THREE.Color(x);
    PROTO.autumn=PROTO.broadleaf;
    PROTO.snowpine=mergeParts([
      {geo:new THREE.CylinderGeometry(.22,.4,6.5,7),color:c(0x4a3018),y:3.25},
      {geo:new THREE.ConeGeometry(3.4,4.2,8),color:c(0x2a4a2c),y:6.6},{geo:new THREE.ConeGeometry(2.7,3.9,8),color:c(0x2e5030),y:9.0},{geo:new THREE.ConeGeometry(1.8,3.6,8),color:c(0x325434),y:11.2},
      {geo:new THREE.ConeGeometry(3.45,.9,8),color:c(0xf0f2f4),y:8.35},{geo:new THREE.ConeGeometry(2.75,.8,8),color:c(0xf0f2f4),y:10.6},{geo:new THREE.ConeGeometry(1.85,1.2,8),color:c(0xf4f6f8),y:12.6}]);
    PROTO.mushroom=mergeParts([
      {geo:new THREE.CylinderGeometry(.9,1.3,5.2,8),color:c(0xd8cfa8),y:2.6},
      {geo:new THREE.SphereGeometry(3.6,10,6,0,Math.PI*2,0,Math.PI/2),color:c(0x9a3a2a),y:5.0},
      {geo:new THREE.CylinderGeometry(3.6,3.2,.5,10),color:c(0xe8dcc0),y:4.85}]);
    PROTO.willow=mergeParts([
      {geo:new THREE.CylinderGeometry(.3,.55,4.4,7),color:c(0x4a3a24),y:2.2},
      {geo:new THREE.ConeGeometry(3.2,5.0,9),color:c(0x5a7a3a),y:5.5,rx:Math.PI},
      {geo:new THREE.ConeGeometry(2.2,3.5,9),color:c(0x6a8a44),y:7.6,rx:Math.PI}]);
    // S192 — more species (Michael, playtest s162: variety, not density): birch, oak, spruce, Scots pine
    const birchBark=c(0xdcd8cc),mark=c(0x2a2622);
    PROTO.birch=mergeParts([
      {geo:new THREE.CylinderGeometry(.14,.26,7.6,7),color:birchBark,y:3.8,jitter:.05},
      ...[[1.1,.3],[2.0,2.1],[2.9,4.0],[3.8,1.2],[4.9,3.3],[5.9,.6]].map(([y,a])=>({geo:new THREE.CylinderGeometry(.262-.0155*y,.262-.0155*y,.09,7,1,true,a,1.1),color:mark,y,jitter:.02})),
      {geo:new THREE.CylinderGeometry(.05,.09,2.6,4),color:birchBark,y:6.2,x:.7,rz:-.6,jitter:.05},
      {geo:new THREE.CylinderGeometry(.05,.08,2.2,4),color:birchBark,y:5.8,x:-.6,z:.3,rz:.65,jitter:.05},
      {geo:new THREE.IcosahedronGeometry(1.7,1),color:c(0x7aa84a),y:7.2,x:1.3,sy:1.2,jitter:.16},
      {geo:new THREE.IcosahedronGeometry(1.5,1),color:c(0x86b050),y:6.6,x:-1.2,z:.4,sy:1.2,jitter:.16},
      {geo:new THREE.IcosahedronGeometry(1.6,1),color:c(0x72a044),y:8.6,z:-.2,sy:1.3,jitter:.16}]);
    PROTO.oak=mergeParts([
      {geo:new THREE.CylinderGeometry(.6,1.0,4.4,8),color:c(0x3a2a1a),y:2.2,jitter:.1},
      {geo:new THREE.CylinderGeometry(.22,.42,3.6,6),color:c(0x3a2a1a),y:4.9,x:1.3,rz:-.85,jitter:.08},
      {geo:new THREE.CylinderGeometry(.2,.4,3.4,6),color:c(0x362618),y:4.8,x:-1.2,z:.5,rz:.8,rx:.2,jitter:.08},
      {geo:new THREE.CylinderGeometry(.18,.34,3.0,6),color:c(0x362618),y:5.2,z:-1.1,rx:-.8,jitter:.08},
      {geo:new THREE.IcosahedronGeometry(3.3,1),color:c(0x3f6f2a),y:7.0,x:2.4,z:.4,sy:.78,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(3.1,1),color:c(0x467a30),y:6.9,x:-2.3,z:.9,sy:.78,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(3.0,1),color:c(0x3a6a28),y:7.1,z:-2.2,sy:.78,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(3.4,1),color:c(0x4a7e34),y:8.4,x:.2,z:.2,sy:.72,jitter:.14}]);
    PROTO.spruce=mergeParts([
      {geo:new THREE.CylinderGeometry(.2,.42,8,6),color:c(0x3a2818),y:4},
      {geo:new THREE.ConeGeometry(2.6,3.4,8),color:c(0x1f4430),y:4.4,ry:.2},{geo:new THREE.ConeGeometry(2.2,3.2,8),color:c(0x234a32),y:6.4,ry:.7},
      {geo:new THREE.ConeGeometry(1.8,3.0,8),color:c(0x26503a),y:8.3,ry:1.2},{geo:new THREE.ConeGeometry(1.3,2.8,7),color:c(0x2a5638),y:10.1,ry:1.7},
      {geo:new THREE.ConeGeometry(.8,2.4,7),color:c(0x2e5c3c),y:11.8}]);
    PROTO.pine=mergeParts([
      {geo:new THREE.CylinderGeometry(.3,.5,3.6,7),color:c(0x4a3020),y:1.8},
      {geo:new THREE.CylinderGeometry(.22,.3,7.2,7),color:c(0x9a5a30),y:7.2,jitter:.06},
      {geo:new THREE.CylinderGeometry(.07,.12,2.4,4),color:c(0x8a5030),y:10.4,x:.9,rz:-1.0},
      {geo:new THREE.CylinderGeometry(.07,.12,2.2,4),color:c(0x8a5030),y:9.9,x:-.8,z:.4,rz:1.0},
      {geo:new THREE.IcosahedronGeometry(2.2,1),color:c(0x2f5a2a),y:11.2,x:1.4,sy:.5,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(2.0,1),color:c(0x355f2e),y:10.6,x:-1.4,z:.5,sy:.5,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(2.4,1),color:c(0x2c5528),y:12.1,z:-.3,sy:.55,jitter:.14}]);
    PROTO.ember=mergeParts([{geo:new THREE.DodecahedronGeometry(.6,0),color:c(0x2a2220),y:.35},{geo:new THREE.DodecahedronGeometry(.32,0),color:c(0xff6a20),y:.55}]);
    PROTO.scrub=mergeParts([
      {geo:new THREE.CylinderGeometry(.08,.14,.5,5),color:bark,y:.25},
      {geo:new THREE.IcosahedronGeometry(.9,1),color:new THREE.Color(0x5c6e3e),y:.85,sy:.7,jitter:.16},
    ]);
    PROTO.bush=mergeParts([
      {geo:new THREE.IcosahedronGeometry(.75,1),color:new THREE.Color(0x4a7a2c),y:.45,sy:.75,jitter:.18},
      {geo:new THREE.IcosahedronGeometry(.55,1),color:new THREE.Color(0x558a34),y:.55,x:.5,sy:.7,jitter:.18},
    ]);
    PROTO.rock=mergeParts([
      {geo:new THREE.DodecahedronGeometry(1,0),color:new THREE.Color(0x77726a),jitter:.12},
      {geo:new THREE.DodecahedronGeometry(.7,0),color:new THREE.Color(0x6a655c),x:.7,y:-.2,z:.3,jitter:.12},
    ]);
  }
  const SCATTER_MAT=new THREE.MeshLambertMaterial({vertexColors:true}); // instanced with per-instance colour: its own program
  // S264 — the world's rocks (Michael's A on Session 228: all three kinds, dressed by biome, mixed by the ground's dice): an
  // icosphere pushed out by noise, cut by fracture planes (flat faces and hard edges where it split), its normals smoothed
  // only across faces within 38°, darker in its hollows; an outcrop is a tilted slab in strata; a cluster a boulder with three
  // smaller stones half sunk round it. Each dressed by where it lies: lichen on the moor and the plains, moss on the forest's
  // and the fen's tops, sandstone in the dunes, basalt in the wastes, snow on the tundra's tops. One geometry per dressing
  // and kind, built on first use and instanced as the old rock was.
  const ROCK_DRESS={moor:{base:0x7a766c,lichen:0xb8b060,band:0x5a564c},forest:{base:0x6a6860,top:0x3e5a24,topCover:.38,lichen:0x8a9a6a,band:0x4a4840},
    fen:{base:0x5a5a50,top:0x4a6a2a,topCover:.3,band:0x3a3a30},dunes:{base:0xc0a070,band:0x9a7040},wastes:{base:0x3a3634,band:0x2a2624},
    tundra:{base:0x6e7278,top:0xeef2f6,topCover:.25,lichen:0x9aa4a0,band:0x50545a}};
  const ROCK_OF_BIOME={plains:'moor',coast:'moor',moor:'moor',forest:'forest',autumn:'forest',fen:'fen',swamp:'fen',dunes:'dunes',wasteland:'wastes',wastes:'wastes',tundra:'tundra'};
  function rockBake(o){const hsh=(x,y,z,s)=>{const v=Math.sin(x*127.1+y*311.7+z*74.7+s*17.3)*43758.5453;return v-Math.floor(v);};
    const vn=(x,y,z,s)=>{const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),fx=x-X,fy=y-Y,fz=z-Z;const u=t=>t*t*(3-2*t);let r=0;
      for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)r+=hsh(X+i,Y+j,Z+k,s)*(i?u(fx):1-u(fx))*(j?u(fy):1-u(fy))*(k?u(fz):1-u(fz));return r;};
    const fb=(x,y,z,s)=>vn(x,y,z,s)*.55+vn(x*2.1,y*2.1,z*2.1,s+3)*.3+vn(x*4.3,y*4.3,z*4.3,s+7)*.15;
    const g0=new THREE.IcosahedronGeometry(1,3),g1=g0.index?g0.toNonIndexed():g0,p=g1.attributes.position,disp=new Float32Array(p.count),cuts=[];
    for(let c=0;c<6;c++){const th=hsh(c,1,2,o.seed)*Math.PI*2,ph=(hsh(c,3,4,o.seed)-.35)*2.2;cuts.push([Math.cos(th)*Math.cos(ph),Math.sin(ph),Math.sin(th)*Math.cos(ph),.55+hsh(c,5,6,o.seed)*.22]);}
    const sx=o.sx||1,sy=o.sy||.7,sz=o.sz||1;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const big=fb(x*1.3+5,y*1.3,z*1.3,o.seed)-.5,crack=Math.abs(vn(x*5,y*5,z*5,o.seed+9)-.5)*2;
      let k=1+big*(o.lump||.7)-(1-crack)*(1-crack)*.08;for(const [dx,dy,dz,off] of cuts){const d=(x*dx+y*dy+z*dz)*k;if(d>off)k*=off/d;}
      if(o.layers){const t=(y+1)*o.layers/2,f=t-Math.floor(t);k*=1-.13*Math.max(0,(f-.65)/.35)+.04*(Math.floor(t)%2);}
      disp[i]=k;p.setXYZ(i,x*k*sx,y*k*sy,z*k*sz);}
    {const fn=[],at=new Map(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();const key=i=>Math.round(p.getX(i)*1e4)+','+Math.round(p.getY(i)*1e4)+','+Math.round(p.getZ(i)*1e4);
      for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);const n0=new THREE.Vector3().subVectors(c,b).cross(a.clone().sub(b)).normalize();fn.push(n0);for(let j=0;j<3;j++){const kk=key(i+j);(at.get(kk)||at.set(kk,[]).get(kk)).push(n0);}}
      const nn=new Float32Array(p.count*3),v=new THREE.Vector3();for(let i=0;i<p.count;i++){const own=fn[Math.floor(i/3)];v.set(0,0,0);for(const f of at.get(key(i)))if(f.dot(own)>.79)v.add(f);v.normalize();nn[i*3]=v.x;nn[i*3+1]=v.y;nn[i*3+2]=v.z;}
      g1.setAttribute('normal',new THREE.BufferAttribute(nn,3));}
    const n=g1.attributes.normal,col=new Float32Array(p.count*3),cc=new THREE.Color();
    for(let i=0;i<p.count;i++){const y=p.getY(i),ny=n.getY(i);cc.set(o.base);const sp=fb(p.getX(i)*3,y*3,p.getZ(i)*3,o.seed+1);
      cc.multiplyScalar(.82+sp*.36);if(disp[i]<1)cc.multiplyScalar(.7+disp[i]*.3);if(y<-.1)cc.multiplyScalar(.85);
      if(o.layers){const bb=Math.floor((y/sy+1)*o.layers/2)%2;cc.lerp(new THREE.Color(o.band),bb*.75);}
      if(o.top&&ny>.45){const m=(ny-.45)/.55*(fb(p.getX(i)*2.5,y,p.getZ(i)*2.5,o.seed+4)>(o.topCover||.45)?1:0);cc.lerp(new THREE.Color(o.top),Math.min(1,m));}
      if(o.lichen&&ny>-.2){const l=vn(p.getX(i)*9,y*9,p.getZ(i)*9,o.seed+5);if(l>.8)cc.lerp(new THREE.Color(o.lichen),.4);}
      col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b;}
    g1.setAttribute('color',new THREE.BufferAttribute(col,3));g1.translate(0,sy*.55,0);if(g1!==g0)g0.dispose();return g1;}
  // one rock geometry per dressing and kind (the key the scatter instances by), made on first use
  function rockProto(dress,kind){const key='rock_'+dress+'_'+kind;if(PROTO[key])return key;const D=ROCK_DRESS[dress]||ROCK_DRESS.moor,sd=pHash(key)%997;
    const one=(o,s,x,y,z,rz)=>{const g=rockBake(Object.assign({},D,o));if(rz)g.rotateZ(rz);g.scale(s,s,s);g.translate(x||0,y||0,z||0);return g;};
    let parts;if(kind==='outcrop')parts=[one({seed:sd,sy:.6,sx:1.4,sz:1,layers:6,lump:.4},1,0,-.08,0,.22)];
    else if(kind==='cluster')parts=[one({seed:sd},1),...[[1.05,.1,.35,.42],[-.8,-.1,.6,.3],[.3,-.15,-.95,.36]].map(([x,y,z,r],i)=>one({seed:sd+i*11+1,sy:.75},r,x,y*r,z))];
    else parts=[one({seed:sd},1)];
    const P=[],N=[],C=[];for(const g of parts){const a=g.attributes;P.push(...a.position.array);N.push(...a.normal.array);C.push(...a.color.array);g.dispose();}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
    g.computeBoundingBox();g.translate(0,-g.boundingBox.min.y-.32,0);g.computeBoundingSphere(); // seated by its own lowest point, .32 into the ground (the old rock sank .35) (the fracture cuts flatten the underside)
    PROTO[key]=g;return key;}

  // ── Deterministic per-chunk scatter ──────────────────────────────────
  function hash01(a,b,c){return _nrand(a*3+c*17,b*5-c*29,SEED*31+c*101);}
  let _treePts=[];
  function scatterChunk(cx,cz,group,sol){
    _treePts=[];
    const ox=cx*CHUNK,oz=cz*CHUNK;
    const trees={},bushes=[],rocks=[],embers=[];
    // Candidate lattice at 4u; each cell rolls against local density.
    const STEP=6;
    for(let iz=0;iz<CHUNK/STEP;iz++)for(let ix=0;ix<CHUNK/STEP;ix++){
      const gx=cx*CHUNK/STEP+ix,gz=cz*CHUNK/STEP+iz;
      const x=ox+(ix+.15+hash01(gx,gz,1)*.7)*STEP;
      const z=oz+(iz+.15+hash01(gx,gz,2)*.7)*STEP;
      if(x<2||z<2||x>SIZE*GRID-2||z>SIZE*GRID-2)continue;
      const h0=worldH(x,z);
      if(h0<1.6)continue;
      if(stampAt(x,z))continue;
      const h=meshH(x,z)-.04; // v80 S133 — trees, rocks and bushes stand on the drawn ground, not the analytic one (trunks floated, bushes sank)
      const _ri=roadInfo(x,z);if(_ri&&_ri.d<ROAD_HALF+3)continue;
      const ny=slopeNormalY(x,z);
      const roll=hash01(gx,gz,3);
      const dom=dominantRegion(x,z);
      // Trees: density × clumping noise (clearings and thickets).
      const dens=regionScalar(x,z,'density');
      const clump=fbm(x,z,60,SEED+21,2);
      const p=dens*(.5+clump*1.3)*sstep(.55,.8,ny)*(1-sstep(30,44,h));
      if(roll<p){
        // Species by dominant biome, with a broadleaf minority in conifer land and vice versa.
        // S192 — each biome's own mix: its main tree and the species that grow among it
        let sp=dom.r.trees;const base=sp;
        const mix=hash01(gx,gz,4);const MX=TREE_MIX[sp];if(MX){let acc=0;for(const [k,w] of MX){acc+=w;if(mix<acc){sp=k;break;}}}
        if(h>26&&sp!=='dead'&&sp!=='snowpine'&&sp!=='spruce')sp=(snowLineAt(x,z)<30?'snowpine':'conifer');
        const sc_=hash01(gx,gz,5);const gi=.84+hash01(gx,gz,12)*.34;(trees[sp]=trees[sp]||[]).push({x,z,h,s:sc_<.06?1.7+sc_*3:.8+sc_*.7,r:hash01(gx,gz,6)*Math.PI*2,t:hash01(gx,gz,7),g:gi,sy:1+(1-gi)*.7,au:base==='autumn'}); // .8–1.5, rare giants; the girth (S192) a squat tree wider, a tall one slimmer
        _treePts.push(x,z);
        continue;
      }
      // Rocks: more on slopes and in rocky regions.
      if(dom.r.biome==='wasteland'&&roll<.9&&hash01(gx,gz,9)<.045){embers.push({x,z,h,s:.7+hash01(gx,gz,10)*.8,r:hash01(gx,gz,6)*Math.PI*2,t:0});continue;}
      const rockP=.012*regionScalar(x,z,'rocks')*(1+sstep(.9,.6,ny)*4);
      if(roll<p+rockP){const kr=hash01(gx,gz,13),kind=ny<.8&&kr<.55?'outcrop':kr<.5?'boulder':kr<.8?'outcrop':'cluster';rocks.push({x,z,h,s:.5+hash01(gx,gz,8)*1.3,r:hash01(gx,gz,9)*Math.PI*2,ny,proto:rockProto(ROCK_OF_BIOME[dom.r.biome]||'moor',kind)});continue;} // S264 — its kind by the ground's dice (outcrops likelier on a slope), dressed by its biome
      // Bushes: open ground only.
      const bushP=(dom.r.biome==='wastes'?.02:.06)*(1-dens)*sstep(.7,.9,ny);
      if(roll<p+rockP+bushP)bushes.push({x,z,h,s:.7+hash01(gx,gz,10)*.7,r:hash01(gx,gz,11)*Math.PI*2});
    }
    const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),s3=new THREE.Vector3(),c=new THREE.Color();
    function place(list,proto,tint,castShadow,solR){
      if(!list.length)return;
      // Per-mesh geometry clone with a chunk-sized bounding sphere. r128
      // frustum-culls an InstancedMesh by its geometry's bounding sphere
      // (the prototype's, at the origin), which silently drops every chunk
      // from the shadow pass and mis-culls the main pass. A clone is a few
      // KB; the sphere covers the chunk plus tree height.
      const geo=PROTO[proto].clone();
      geo.boundingSphere=new THREE.Sphere(new THREE.Vector3(ox+CHUNK/2,worldH(ox+CHUNK/2,oz+CHUNK/2),oz+CHUNK/2),CHUNK*.75+14);
      const im=new THREE.InstancedMesh(geo,SCATTER_MAT,list.length);
      list.forEach((t,i)=>{
        e.set(0,t.r,0);q.setFromEuler(e);
        v.set(t.x,t.h+(t.sink||0),t.z);s3.set(t.s*(t.g||1),t.s*(t.sy||1),t.s*(t.g||1));
        m4.compose(v,q,s3);im.setMatrixAt(i,m4);
        tint(t,c);im.setColorAt(i,c);
        if(solR)sol.push({cx:t.x,cz:t.z,rx:solR*t.s*(t.g||1),rz:solR*t.s*(t.g||1)});
      });
      im.instanceMatrix.needsUpdate=true;
      if(im.instanceColor)im.instanceColor.needsUpdate=true;
      im.castShadow=castShadow;im.receiveShadow=true;im.userData.scatter=proto; // S192 — which prototype (tests and the frame check read it)
      im.frustumCulled=true;
      group.add(im);
    }
    for(const sp in trees){
      const dead=sp==='dead';
      place(trees[sp],sp,(t,c)=>{
        // Whole-tree tint: hue drift + brightness, warmer in wastes/coast.
        // S192 — a wider spread of greens tree to tree, and the new species' own
        let hue=dead?.06:(sp==='conifer'||sp==='snowpine'?.30:.24)+(t.t-.5)*.09,sat=dead?.15:.3+t.t*.3,lig=.47+(t.t-.5)*.18;
        if(sp==='birch'){hue=t.au?.1+t.t*.04:.2+t.t*.06;sat=t.au?.8:.45;lig=.55+(t.t-.5)*.1;}
        if(sp==='oak'){hue=t.au?.05+t.t*.07:.25+(t.t-.5)*.08;sat=t.au?.7:.3+t.t*.2;lig=.44+(t.t-.5)*.12;}
        if(sp==='spruce'){hue=.37+(t.t-.5)*.05;sat=.3;lig=.42+(t.t-.5)*.1;}
        if(sp==='pine'){hue=.28+(t.t-.5)*.06;sat=.35;lig=.47+(t.t-.5)*.1;}
        if(sp==='autumn'){hue=.02+t.t*.10;sat=.75;lig=.5+(t.t-.5)*.1;}   // reds through oranges to gold
        if(sp==='mushroom'){hue=.02+t.t*.08;sat=.35;lig=.55;}
        if(sp==='willow'){hue=.22+t.t*.05;sat=.3;lig=.42;}
        c.setHSL(hue,sat,lig);
        // Vertex colour already carries the base; the tint is a multiplier
        // around white, so normalise toward 1.
        c.r=.72+c.r*.5;c.g=.72+c.g*.5;c.b=.72+c.b*.5;
      },true,sp==='scrub'?0:({oak:.85,birch:.35,spruce:.45,pine:.45}[sp]||.5));
    }
    {const by={};rocks.forEach(r=>{r.sink=0;(by[r.proto]||(by[r.proto]=[])).push(r);});for(const k in by)place(by[k],k,(t,c)=>{c.setRGB(.9+t.ny*.1,.9+t.ny*.08,.9);},true,.55);} // S264 — one instanced mesh per kind of rock in the chunk
    place(bushes,'bush',(t,c)=>{c.setRGB(.92+(t.s-1)*.2,1,.9);},false,0);
    if(embers.length){place(embers,'ember',(t,c)=>{c.setRGB(1,1,1);},false,0);const gl=group.children[group.children.length-1];if(gl&&gl.isInstancedMesh){gl.material=new THREE.MeshBasicMaterial({vertexColors:true});}}
  }

  // ── Chunk terrain ────────────────────────────────────────────────────
  // v80 S134 — a chunk built before a neighbouring cell's rivers, lakes and inlets were loaded has uncarved ground
  // over them (a green sheet at a river's end, no collision under it). When a cell's water arrives, the chunks it
  // touches take their heights and colours again.
  function refreshChunkTerrain(ch){const geo=ch.terrain;const pa=geo.attributes.position;const col=geo.attributes.color;const ox=ch.cx*CHUNK,oz=ch.cz*CHUNK;const c=_tmpC;
    for(let i=0;i<pa.count;i++){const x=pa.getX(i)+ox+CHUNK/2,z=pa.getZ(i)+oz+CHUNK/2;const h=worldH(x,z);pa.setY(i,h);const ny=slopeNormalY(x,z);groundColor(x,z,h,ny,c);col.setXYZ(i,c.r,c.g,c.b);}
    pa.needsUpdate=true;col.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();}
  // S252 — stamps that arrive after a chunk was built (a cell placing its doors and pads after you jumped, fast-travelled
  // or loaded a save into it) left the chunk's trees, bushes and rocks standing on them: a forest in a fort's courtyard.
  // Scatter skips a stamp's core, so take out what stands in one now (the mesh's last instance fills the gap), drop its
  // collider and tree point, and refresh the ground so the stamp's flattening shows. Nothing is rebuilt or respawned.
  function clearScatterUnder(stamps){let n=0;const m=new THREE.Matrix4(),v=new THREE.Vector3(),c=new THREE.Color();
    for(const ch of chunks.values()){const x0=ch.cx*CHUNK,z0=ch.cz*CHUNK;const hit=stamps.filter(st=>st.x+st.r>x0&&st.x-st.r<x0+CHUNK&&st.z+st.r>z0&&st.z-st.r<z0+CHUNK);if(!hit.length)continue;
      const gone=[];for(const o of ch.group.children){if(!o.isInstancedMesh||!o.userData.scatter)continue;let k=0;
        for(let i=0;i<o.count;){o.getMatrixAt(i,m);v.setFromMatrixPosition(m);if(!hit.some(st=>Math.hypot(v.x-st.x,v.z-st.z)<st.r)){i++;continue;}
          gone.push(v.x,v.z);k++;const last=o.count-1;if(i<last){o.getMatrixAt(last,m);o.setMatrixAt(i,m);if(o.instanceColor){o.getColorAt(last,c);o.setColorAt(i,c);}}o.count=last;} // the last instance takes the gap
        if(k){o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;n+=k;}}
      if(gone.length){const at=(x,z)=>{for(let i=0;i<gone.length;i+=2)if(Math.abs(gone[i]-x)<.05&&Math.abs(gone[i+1]-z)<.05)return true;return false;}; // float32 positions against the colliders' own
        for(let i=ch.sol.length-1;i>=0;i--)if(at(ch.sol[i].cx,ch.sol[i].cz))ch.sol.splice(i,1);
        if(ch.treePts){const tp=[];for(let i=0;i<ch.treePts.length;i+=2)if(!hit.some(st=>Math.hypot(ch.treePts[i]-st.x,ch.treePts[i+1]-st.z)<st.r))tp.push(ch.treePts[i],ch.treePts[i+1]);ch.treePts=tp;}}
      refreshChunkTerrain(ch);}
    return n;}
  function refreshChunksNearWater(feats){let n=0;for(const ch of chunks.values()){const cx0=ch.cx*CHUNK,cz0=ch.cz*CHUNK;let hit=false;
      for(const f of feats){const reach=(f.w!=null?f.w:f.r||0)+(f.blend||0)+CHUNK;if(f.pts){for(const p of f.pts){if(p[0]>cx0-reach&&p[0]<cx0+CHUNK+reach&&p[1]>cz0-reach&&p[1]<cz0+CHUNK+reach){hit=true;break;}}}else if(f.x!=null&&f.x>cx0-reach&&f.x<cx0+CHUNK+reach&&f.z>cz0-reach&&f.z<cz0+CHUNK+reach)hit=true;if(hit)break;}
      if(hit){refreshChunkTerrain(ch);n++;}}return n;}
  function buildChunk(cx,cz){
    const key=chunkKey(cx,cz);
    if(chunks.has(key))return;
    const ox=cx*CHUNK,oz=cz*CHUNK;
    const geo=new THREE.PlaneGeometry(CHUNK,CHUNK,SEGS,SEGS);
    geo.rotateX(-Math.PI/2);
    const pa=geo.attributes.position;
    const colArr=new Float32Array(pa.count*3);
    const c=_tmpC;
    for(let i=0;i<pa.count;i++){
      const x=pa.getX(i)+ox+CHUNK/2,z=pa.getZ(i)+oz+CHUNK/2;
      const h=worldH(x,z);
      pa.setY(i,h);
      const ny=slopeNormalY(x,z);
      groundColor(x,z,h,ny,c);
      colArr[i*3]=c.r;colArr[i*3+1]=c.g;colArr[i*3+2]=c.b;
    }
    geo.setAttribute('color',new THREE.BufferAttribute(colArr,3));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    const mesh=new THREE.Mesh(geo,terrainMat);
    mesh.position.set(ox+CHUNK/2,0,oz+CHUNK/2);
    mesh.receiveShadow=true;
    const group=new THREE.Group();
    group.add(mesh);
    const sol=[];
    scatterChunk(cx,cz,group,sol);
    buildRoadRibbons(cx,cz,group);
    sc.add(group);
    const ch={cx,cz,group,sol,terrain:geo,enemies:[],herbs:[],treePts:_treePts.slice()};
    chunks.set(key,ch);
    spawnChunkEncounters(ch);
    spawnChunkHerbs(ch);spawnSeaHerbs(ch);spawnWreck(ch);spawnFishSchool(ch);
  }
  function dropChunk(key){
    const ch=chunks.get(key);if(!ch)return;
    despawnChunkEncounters(ch);
    if(ch.fish){const i=LIFE.fish.indexOf(ch.fish);if(i>=0)LIFE.fish.splice(i,1);}
    ch.herbs.forEach(h=>{if(h.g&&h.g.parent)h.g.parent.remove(h.g);const i=ZONES.world.herbs.indexOf(h);if(i>=0)ZONES.world.herbs.splice(i,1);});ch.herbs.length=0;
    if(ch.loot&&typeof ZONE_CORPSES!=='undefined')ch.loot.forEach(c=>{const i=ZONE_CORPSES.indexOf(c);if(i>=0)ZONE_CORPSES.splice(i,1);});
    sc.remove(ch.group);
    ch.terrain.dispose();
    ch.group.traverse(o=>{if(o.isInstancedMesh){o.geometry.dispose();o.dispose();}});
    chunks.delete(key);
  }
  // Keep the ring around (x,z) current. `sync` builds everything now
  // (used on entry, behind the fade); otherwise builds are time-sliced.
  function stream(x,z,sync){
    const cx=Math.floor(x/CHUNK),cz=Math.floor(z/CHUNK);
    if(cx!==lastCX||cz!==lastCZ){
      lastCX=cx;lastCZ=cz;
      // Drop far chunks.
      for(const key of Array.from(chunks.keys())){
        const ch=chunks.get(key);
        if(Math.abs(ch.cx-cx)>RADIUS+1||Math.abs(ch.cz-cz)>RADIUS+1)dropChunk(key);
      }
      // Queue missing chunks nearest-first.
      buildQueue.length=0;
      const maxC=Math.ceil(SIZE*GRID/CHUNK)-1;
      for(let dz=-RADIUS;dz<=RADIUS;dz++)for(let dx=-RADIUS;dx<=RADIUS;dx++){
        const qx=cx+dx,qz=cz+dz;
        if(qx<0||qz<0||qx>maxC||qz>maxC)continue;
        if(!chunks.has(chunkKey(qx,qz)))buildQueue.push({cx:qx,cz:qz,d:dx*dx+dz*dz});
      }
      buildQueue.sort((a,b)=>a.d-b.d);
    }
    if(sync){while(buildQueue.length){const b=buildQueue.shift();buildChunk(b.cx,b.cz);}return;}
    const t0=performance.now();while(buildQueue.length&&performance.now()-t0<4){const b=buildQueue.shift();buildChunk(b.cx,b.cz);} // budgeted: light chunks batch, heavy ones go one per frame
  }

  // ── Far terrain (coarse, whole world, sits just under the near tiles) ─
  function buildFar(){}
  function buildFarFor(cell){
    const n=Math.floor(SIZE/(cell.home?FAR_STEP:FAR_STEP*2));
    const geo=new THREE.PlaneGeometry(SIZE,SIZE,n,n);
    geo.rotateX(-Math.PI/2);
    const pa=geo.attributes.position;
    const colArr=new Float32Array(pa.count*3);
    const c=_tmpC;
    for(let i=0;i<pa.count;i++){
      const x=pa.getX(i)+cell.ox+SIZE/2,z=pa.getZ(i)+cell.oz+SIZE/2;
      const h=worldH(x,z);
      pa.setY(i,h-3.0); // horizon only: sits well under the near tiles so it never pokes through
      const ny=slopeNormalY(x,z);
      groundColor(x,z,h,ny,c);
      // Forested regions read as canopy from afar — darken/green the far
      // mesh by tree density so the treeline pop-in is less abrupt.
      const dens=regionScalar(x,z,'density');
      if(h>1.6&&h<30){_tmpC2.setRGB(.22,.36,.18);c.lerp(_tmpC2,Math.min(.75,dens*.9));}
      c.multiplyScalar(.72); // match the near tiles, whose detail texture averages ~0.72
      colArr[i*3]=c.r;colArr[i*3+1]=c.g;colArr[i*3+2]=c.b;
    }
    geo.setAttribute('color',new THREE.BufferAttribute(colArr,3));
    geo.computeVertexNormals();
    const fm=new THREE.Mesh(geo,VC_MAT);
    fm.position.set(cell.ox+SIZE/2,0,cell.oz+SIZE/2);
    sc.add(fm);return fm;
  }

  // ── Sky, water, sun ──────────────────────────────────────────────────
  function buildSky(){
    const cv=document.createElement('canvas');cv.width=8;cv.height=256;
    const ctx=cv.getContext('2d');
    const g=ctx.createLinearGradient(0,0,0,256);
    // Luminance gradient only; material.color carries the hue per frame.
    g.addColorStop(0,'#6f7f92');g.addColorStop(.45,'#b9c3cc');g.addColorStop(.62,'#ffffff');g.addColorStop(1,'#ffffff');
    ctx.fillStyle=g;ctx.fillRect(0,0,8,256);
    const tex=new THREE.CanvasTexture(cv);
    skyMat=new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,fog:false,depthWrite:false});
    skyDome=new THREE.Mesh(new THREE.SphereGeometry(2900,24,12,0,Math.PI*2,0,Math.PI*.62),skyMat);
    skyDome.renderOrder=-1;
    sc.add(skyDome);
    sc.userData.skyRingMat=skyMat; // lets the engine's night tint reach it if it ever runs
  }
  function buildWater(){
    const wmat=new THREE.MeshLambertMaterial({color:0x2f7fb2,emissive:0x0a2a40,transparent:true,opacity:.8});
    wmat.onBeforeCompile=sh=>{waterShader(sh);wmat.userData.shader=sh;};
    water=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000,140,140),wmat);
    water.rotation.x=-Math.PI/2;
    water.position.y=SEA_Y;
    water.receiveShadow=true;
    sc.add(water);
  }
  // ═══ LIGHT POOL ════════════════════════════════════════════════════
  // A fixed set of point lights lives in the scene for the whole session;
  // the world registers virtual light *sources* (lamps, fires, torches,
  // glows) and the nearest ones are mapped onto the pool every quarter
  // second. The light count never changes, so three.js never recompiles
  // every material — which is what froze the game whenever a settlement,
  // camp or torch appeared or vanished.
  const LPOOL=[],LSRC=[];const LPOOL_N=24;
  class VLight{constructor(color,intensity,distance,owner){this.color=new THREE.Color(color);this.intensity=intensity;this.distance=distance;this.position=new THREE.Vector3();this.follow=null;this.owner=owner||null;this.visible=true;}}
  function regLight(color,intensity,distance,owner){const v=new VLight(color,intensity,distance,owner);LSRC.push(v);return v;}
  function unregLights(owner){for(let i=LSRC.length-1;i>=0;i--)if(LSRC[i].owner===owner)LSRC.splice(i,1);}
  function unregLight(v){const i=LSRC.indexOf(v);if(i>=0)LSRC.splice(i,1);}
  // a real PointLight the engine keeps mutating (enemy glows): register a source that copies it each tick
  function mirrorLight(el){const v=regLight(el.color.getHex(),el.intensity,el.distance,'mirror');v.mirror=el;return v;}
  const _lwp=new THREE.Vector3();let _lpT=0;
  // Sweep: any real PointLight that isn't the pool (engine-made door glows, fort torches, herb
  // glows, enemy lights) becomes a virtual source following its parent, and leaves the scene.
  // Runs every tick so the scene's light count never changes after build.
  const _poolSet=new Set();
  function sweepLights(){
    if(!_poolSet.size)LPOOL.forEach(L=>_poolSet.add(L));
    const found=[];sc.traverse(o=>{if(o.isPointLight&&!_poolSet.has(o))found.push(o);});
    const now=performance.now();
    for(const l of found){const par=l.parent;
      if(l._swept){ /* the engine re-added a light we already mirror (the torch does this every frame) */ l._swept._seen=now;par&&par.remove(l);continue;}
      l.getWorldPosition(_lwp);const v=regLight(l.color.getHex(),l.intensity,l.distance||10,'swept');v.mirror=l;v.position.copy(_lwp);v._seen=now;
      if(par&&par!==sc){v.follow=par;v.offset=l.position.clone();}else{v.loose=true;}
      par&&par.remove(l);l._swept=v;}
  }
  function inScene(o){let p=o;while(p){if(p===sc)return true;p=p.parent;}return false;}
  function tickLightPool(dt){
    _lpT-=dt;if(_lpT>0&&LSRC.length>40)return;_lpT=.12;
    const cand=[];
    const nowMs=performance.now();
    for(let i=LSRC.length-1;i>=0;i--){const v=LSRC[i];if(v.mirror){const m=v.mirror;v.intensity=m.intensity;v.color.copy(m.color);
      if(v.follow){if(!inScene(v.follow)){LSRC.splice(i,1);continue;}v.follow.getWorldPosition(_lwp);if(v.offset)_lwp.add(v.offset);v.position.copy(_lwp);}
      else{v.position.copy(m.position);if(v.loose&&nowMs-(v._seen||0)>1200){LSRC.splice(i,1);continue;} /* a loose light the engine stopped re-adding is gone */}
      if(m.intensity===0&&v._zeroT>20){LSRC.splice(i,1);continue;}v._zeroT=m.intensity===0?(v._zeroT||0)+.25:0;}}
    for(const v of LSRC){if(!v.visible||v.intensity<=0)continue;if(v.follow&&!v.mirror){v.follow.getWorldPosition(_lwp);v.position.copy(_lwp);}const d=Math.hypot(v.position.x-px,v.position.z-pz);if(d>v.distance+90)continue;cand.push([d,v]);}
    cand.sort((a,b)=>a[0]-b[0]);
    for(let i=0;i<LPOOL.length;i++){const L=LPOOL[i];const c=cand[i];if(!c){L.intensity=0;continue;}const v=c[1];L.position.copy(v.position);L.color.copy(v.color);L.intensity=v.intensity;L.distance=v.distance;}
  }
  function buildLights(){
    for(let i=0;i<LPOOL_N;i++){const L=new THREE.PointLight(0xffffff,0,10);L.position.set(0,-100,0);sc.add(L);LPOOL.push(L);}
    sun=new THREE.DirectionalLight(0xfff0d0,1.15);
    sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);
    const S=70;
    sun.shadow.camera.left=-S;sun.shadow.camera.right=S;sun.shadow.camera.top=S;sun.shadow.camera.bottom=-S;
    sun.shadow.camera.near=1;sun.shadow.camera.far=420;
    sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.6;
    sun.shadow.camera.updateProjectionMatrix(); // bounds above don't apply until this runs
    sunTarget=new THREE.Object3D();
    sc.add(sunTarget);sun.target=sunTarget;sc.add(sun);
    amb=new THREE.AmbientLight(0x90a0c0,.55);sc.add(amb);
    hemi=new THREE.HemisphereLight(0xbcd6ff,0x6b7a48,.55);sc.add(hemi);
  }

  // ── v80 S148: what's in the sky ──────────────────────────────────────
  // The dome was flat colour. A sun and a moon now ride the same angle the sun *light* uses, so the
  // disc is where the shadows say it is; stars come up with the existing night factor; and the
  // weather draws a curtain over all three — a storm has no stars.
  const SKY={built:false,sun:null,moon:null,moonDark:null,stars:null,R:620};
  function buildSkyBodies(){
    if(SKY.built||!sc)return;SKY.built=true;
    const sunGeo=new THREE.CircleGeometry(26,28);
    SKY.sun=new THREE.Mesh(sunGeo,new THREE.MeshBasicMaterial({color:0xfff3c8,transparent:true,opacity:0,fog:false,depthWrite:false}));
    SKY.sun.renderOrder=-3;sc.add(SKY.sun);
    SKY.moon=new THREE.Mesh(new THREE.CircleGeometry(17,26),new THREE.MeshBasicMaterial({color:0xe8ecf2,transparent:true,opacity:0,fog:false,depthWrite:false}));
    SKY.moon.renderOrder=-3;sc.add(SKY.moon);
    // the phase is a second disc in the sky's own colour, slid across the face
    SKY.moonDark=new THREE.Mesh(new THREE.CircleGeometry(17.4,26),new THREE.MeshBasicMaterial({color:0x0b1020,transparent:true,opacity:0,fog:false,depthWrite:false}));
    SKY.moonDark.renderOrder=-2;sc.add(SKY.moonDark);
    const N=760,pos=new Float32Array(N*3),sz=new Float32Array(N);
    for(let i=0;i<N;i++){
      const u=Math.random()*Math.PI*2,v=Math.random();const el=Math.asin(.06+v*.94); // upper sky only
      pos[i*3]=Math.cos(u)*Math.cos(el);pos[i*3+1]=Math.sin(el);pos[i*3+2]=Math.sin(u)*Math.cos(el);
      sz[i]=.6+Math.random()*Math.random()*2.4;
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aSize',new THREE.BufferAttribute(sz,1));
    SKY.stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xf2f4ff,size:2.4,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));
    SKY.stars.renderOrder=-4;SKY.stars.frustumCulled=false;sc.add(SKY.stars);
  }
  function skyBodies(dt){
    buildSkyBodies();if(!SKY.sun)return;
    const hr=(typeof gameHour==='function')?gameHour():12;
    const t=(typeof _nightFactor==='function')?_nightFactor():0;
    const dayAng=Math.PI*(hr-6)/12;                 // the same angle the sun light rides
    const az=-.6+Math.cos(dayAng)*.9;
    const place=(o,e,R)=>{const c=Math.sqrt(Math.max(0,1-e*e));
      o.position.set(px+Math.sin(az)*R*c,worldH(px,pz)+e*R,pz+Math.cos(az)*R*c);
      o.lookAt(px,worldH(px,pz)+1.6,pz);};
    // weather draws the curtain: cloud from rain/storm/overcast/snow, plus fog
    const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?WX.k:0;
    const amt=k=>(cur===k?1:0)*(1-mix)+(nxt===k?1:0)*mix;
    const cloud=Math.min(1,amt('overcast')*.75+amt('rain')*.9+amt('storm')*1+amt('snow')*.85+amt('fog')*.95);
    const clear=1-cloud;
    const eSun=Math.sin(dayAng);
    place(SKY.sun,eSun,SKY.R);
    const horizon=sstep(-.06,.10,eSun);            // fades as it sets, gone below
    SKY.sun.material.opacity=horizon*clear*.95;
    SKY.sun.material.color.setRGB(1,.95-.12*(1-horizon),.78-.22*(1-horizon)); // redder on the horizon
    SKY.sun.visible=SKY.sun.material.opacity>.01;
    const eMoon=Math.sin(dayAng+Math.PI);
    place(SKY.moon,eMoon,SKY.R-40);
    const mUp=sstep(-.04,.12,eMoon);
    SKY.moon.material.opacity=mUp*clear*(.30+.62*t); // pale by day, bright at night
    SKY.moon.visible=SKY.moon.material.opacity>.01;
    // phase: 0 new, .5 full — the shadow disc slides off the face over a month
    const day=Math.floor((worldState.gameTimeAbsMinutes||0)/1440);
    const ph=((day+14)%29)/29;                       // day 0 is a full moon, not a dark sky
    const lit=(1-Math.cos(ph*Math.PI*2))/2;          // 0 new, 1 full
    const off=lit*34.8*(ph<.5?1:-1);                 // the shadow slides off the face and back, waxing then waning
    SKY.moonDark.position.copy(SKY.moon.position);
    SKY.moonDark.quaternion.copy(SKY.moon.quaternion);
    SKY.moonDark.translateX(off);SKY.moonDark.translateZ(.6);
    SKY.moonDark.material.color.copy(sc.background);
    SKY.moonDark.material.opacity=SKY.moon.material.opacity;
    SKY.moonDark.visible=SKY.moon.visible&&Math.abs(off)<33;
    SKY.stars.position.set(px,worldH(px,pz),pz);
    SKY.stars.scale.setScalar(SKY.R+60);
    SKY.stars.material.opacity=t*clear*.9;
    SKY.stars.visible=SKY.stars.material.opacity>.01;
  }
  // ── Atmosphere per frame (sky/fog/lights blend by region + time) ─────
  const _atm={sky:new THREE.Color(),fog:new THREE.Color(),cur:null};
  const NIGHT_SKY=new THREE.Color(0x0b1020),NIGHT_FOG=new THREE.Color(0x0e1420);
  const _dayC=new THREE.Color();
  function atmosphere(dt){
    const ws=regionWeights(px,pz);
    _atm.sky.setRGB(0,0,0);_atm.fog.setRGB(0,0,0);let den=0;
    for(const e of ws){
      if(e.w<=0)continue;
      const b=BIOME_PROFILES[e.r.biome];
      _dayC.setHex(b.bgCol);_atm.sky.r+=_dayC.r*e.w;_atm.sky.g+=_dayC.g*e.w;_atm.sky.b+=_dayC.b*e.w;
      _dayC.setHex(b.fogCol);_atm.fog.r+=_dayC.r*e.w;_atm.fog.g+=_dayC.g*e.w;_atm.fog.b+=_dayC.b*e.w;
      den+=e.w*b.fogDen;
    }
    // The authored forest sky is very dark (it was a canopy-ceiling reading);
    // in an open world the sky above a forest is still sky. Lift toward the
    // plains sky so the dome stays plausible.
    _dayC.setHex(BIOME_PROFILES.plains.bgCol);_atm.sky.lerp(_dayC,.55);
    const t=(typeof _nightFactor==='function')?_nightFactor():0;
    _atm.sky.lerp(NIGHT_SKY,t);_atm.fog.lerp(NIGHT_FOG,t*.92);
    WX.fogMul=1;WX.sunMul=1;WX.fogFloor=0;applyWeather();den*=WX.fogMul;if(WX.fogFloor>0)den=Math.max(den,WX.fogFloor); // v80 S145
    if(cameraUnderwater()){_atm.sky.setHex(0x1a4a6a);_atm.fog.setHex(0x1a4a6a);den=.06;}
    // Ease toward target so region borders never snap.
    const k=Math.min(1,dt*1.5);
    sc.background.lerp(_atm.sky,k);
    sc.fog.color.lerp(_atm.fog,k);
    // Haze thins as you climb: from a summit the whole country is in view.
    const altK=Math.max(.22,1-Math.max(0,worldH(px,pz))/130);
    // v80 S145 — the floor is clamped on the final density: the .55 × altitude scaling below was
    // swallowing four fifths of it, which is why 'fog' looked like a clear day with a tint.
    let _fogTarget=cameraUnderwater()?den:den*.55*altK*(1+t*.5);
    if(!cameraUnderwater()&&WX.fogFloor>0)_fogTarget=Math.max(_fogTarget,WX.fogFloor);
    sc.fog.density+=(_fogTarget-sc.fog.density)*Math.min(1,cameraUnderwater()?dt*6:k);
    skyMat.color.copy(sc.background).multiplyScalar(1.15);
    skyBodies(dt); // v80 S148 — sun, moon and stars
    // Sun: elevation by hour, dimmed and cooled at night.
    const hr=(typeof gameHour==='function')?gameHour():12;
    const dayAng=Math.PI*(hr-6)/12; // 0 at 6h, π at 18h
    const elev=Math.max(.32,Math.sin(dayAng));
    const az=-.6+Math.cos(dayAng)*.9;
    sunTarget.position.set(px,worldH(px,pz),pz);
    sun.position.set(px+Math.sin(az)*260*(1-elev*.5),sunTarget.position.y+elev*260,pz+Math.cos(az)*260*(1-elev*.5));
    sun.intensity=(1.15*(1-t)+.16*t)*(WX.sunMul||1);
    sun.color.setRGB(1-.02*t,.94-.35*t,.82-.3*t);
    amb.intensity=(.55*(1-t)+.16*t)*((typeof fxOn==='function'&&fxOn('nighteye'))?1+t*2.2:1);
    hemi.intensity=.55*(1-t)+.13*t;
    // Water and sky follow the camera; grid-snap so nothing swims.
    water.position.x=Math.round(px/8)*8;water.position.z=Math.round(pz/8)*8;
    if(water.material.userData.shader)water.material.userData.shader.uniforms.uTime.value=performance.now()*.001;
    skyDome.position.set(px,-60,pz);
    // Music by dominant region, with hysteresis.
    const dom=dominantRegion(px,pz);
    if(dom.w>.62&&_atm.cur!==dom.r.id){
      _atm.cur=dom.r.id;
      if(typeof startMusic==='function')startMusic(dom.r.music||'road');
    }
  }

  // ── Solids ───────────────────────────────────────────────────────────
  // v80 S126 — the camera ignores posts, trunks and stakes; walls, rocks and houses pull it in
  function camSolid(x,z){const R=.12,MIN=.55;const cx=Math.floor(x/CHUNK),cz=Math.floor(z/CHUNK);
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const ch=chunks.get(chunkKey(cx+dx,cz+dz));if(!ch)continue;const sol=ch.sol;for(let i=0;i<sol.length;i++){const s=sol[i];if(Math.max(s.rx,s.rz)<MIN)continue;if(Math.abs(x-s.cx)<s.rx+R&&Math.abs(z-s.cz)<s.rz+R)return true;}}
    for(let i=0;i<STATIC_SOL.length;i++){const s=STATIC_SOL[i];if(Math.max(s.rx,s.rz)<MIN)continue;if(Math.abs(x-s.cx)<s.rx+R&&Math.abs(z-s.cz)<s.rz+R)return true;}
    if(settleSolid(x,z,R,MIN))return true;return false;}
  function solidAt(x,z){
    const R=.3;
    const WMAX=SIZE*GRID;if(x<R||z<R||x>WMAX-R||z>WMAX-R)return true; // continent edge
    // deep water is swimmable (groundY lifts the ground to the surface); nothing to block here
    const cx=Math.floor(x/CHUNK),cz=Math.floor(z/CHUNK);
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      const ch=chunks.get(chunkKey(cx+dx,cz+dz));if(!ch)continue;
      const sol=ch.sol;
      for(let i=0;i<sol.length;i++){const s=sol[i];if(Math.abs(x-s.cx)<s.rx+R&&Math.abs(z-s.cz)<s.rz+R)return true;}
    }
    for(let i=0;i<STATIC_SOL.length;i++){const s=STATIC_SOL[i];if(Math.abs(x-s.cx)<s.rx+R&&Math.abs(z-s.cz)<s.rz+R)return true;}
    if(settleSolid(x,z,R))return true;
    return false;
  }

  // ═══ CONTINENT (Session A) ══════════════════════════════════════════
  // The world is a GRID×GRID lattice of cells, each SIZE across, in one
  // absolute coordinate space (28,800u across — well inside float
  // precision, so no rebasing). Cell (i,j) sits at [i·SIZE,(i+1)·SIZE) ×
  // [j·SIZE,(j+1)·SIZE). A coarse MASK gives the continent its shape:
  // sea, coast, inland, island. Each cell's content (regions, sites, roads,
  // doors, landmarks, ridges) is a deterministic function of its seed and
  // is generated when the cell is first loaded (player within one cell)
  // and dropped when far. The authored world is the home cell.
  const GRID=12,HOME_I=5,HOME_J=10;
  function cellHash(i,j,k){let h=(i*73856093)^(j*19349663)^((k||0)*83492791)^SEED;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
  function cellRng(i,j,k){let s=(cellHash(i,j,k)*4294967296)>>>0||1;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
  // ── mask ──
  const MASK=[];
  (function buildMask(){
    const r=cellRng(99,99,1);
    for(let j=0;j<GRID;j++){MASK[j]=[];for(let i=0;i<GRID;i++){
      const u=(i+.5)/GRID-.5,v=(j+.5)/GRID-.5;
      // a lumpy continent slightly north of centre, sea around it
      // three islands: north-west, north-east, and the southern one the home province sits on
      const isl=[[-.27,-.23,.21],[.25,-.21,.22],[.0,.24,.23]];
      let best=1e9;for(const [cu,cv,cr] of isl){best=Math.min(best,Math.hypot((u-cu)*1.0,(v-cv)*1.05)/cr);}
      const d=best+(r()-.5)*.10;
      let t=d<1?'land':'sea';
      if(i===0||j===0||i===GRID-1||j===GRID-1)t='sea';
      MASK[j][i]=t;
    }}
    // a gulf biting in from the east, a strait in the west
    // islands in the outer sea
    [[1,3],[2,8],[10,2],[9,9],[7,1],[1,9]].forEach(([i,j])=>{if(MASK[j][i]==='sea')MASK[j][i]='island';});
    // the home cell is a peninsula tip: land, sea west/south/east, land north
    MASK[HOME_J][HOME_I]='land';MASK[HOME_J][HOME_I-1]='sea';MASK[HOME_J][HOME_I+1]='sea';MASK[HOME_J+1][HOME_I]='sea';MASK[HOME_J-1][HOME_I]='land';
    for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){if(MASK[j][i]==='land'){const nb=[[1,0],[-1,0],[0,1],[0,-1]].some(([di,dj])=>{const a=MASK[j+dj]&&MASK[j+dj][i+di];return a==='sea'||a==='island'||a==null;});if(nb)MASK[j][i]='coast';}}
  })();
  function maskAt(i,j){return (MASK[j]&&MASK[j][i])||'sea';}
  function isLandCell(i,j){const t=maskAt(i,j);return t==='land'||t==='coast'||t==='island';}
  function cellOf(x,z){return [Math.floor(x/SIZE),Math.floor(z/SIZE)];}
  // shared border "portal" point on the edge between (i,j) and its neighbour
  function edgePortal(i,j,side){ // side:'E'|'S' — W/N are the neighbour's E/S
    if(side==='W')return edgePortal(i-1,j,'E');if(side==='N')return edgePortal(i,j-1,'S');
    const k=side==='E'?11:13;const t=.25+cellHash(i,j,k)*.5;
    return side==='E'?{x:(i+1)*SIZE,z:(j+t)*SIZE}:{x:(i+t)*SIZE,z:(j+1)*SIZE};
  }
  function riverOnEdge(i,j,side){ // symmetric: a river crosses this border
    if(side==='W')return riverOnEdge(i-1,j,'E');if(side==='N')return riverOnEdge(i,j-1,'S');
    const ni=side==='E'?i+1:i,nj=side==='S'?j+1:j;if(!isLandCell(i,j)||!isLandCell(ni,nj))return false;
    if(ridgeOnEdge(i,j,side))return false;return cellHash(i,j,side==='E'?25:27)<.28;
  }
  function ridgeOnEdge(i,j,side){ // symmetric: both cells agree
    if(side==='W')return ridgeOnEdge(i-1,j,'E');if(side==='N')return ridgeOnEdge(i,j-1,'S');
    const ni=side==='E'?i+1:i,nj=side==='S'?j+1:j;
    if(!isLandCell(i,j)||!isLandCell(ni,nj))return false;
    const mx=(side==='E'?(i+1)*SIZE:(i+.5)*SIZE),mz=(side==='E'?(j+.5)*SIZE:(j+1)*SIZE);
    return _smoothNoise(mx,mz,SEED+80,3600)<.30; // a slow field: neighbouring edges share it, so ranges chain across several cells
  }
  // ── names (Session B generalises this into cultures) ──
  const SYL={
    irish:[['Bally','Kil','Dun','Carrig','Glen','Rath','Cnoc','Inis','Cluain','Lis','Ard','Tully'],['more','beg','ard','ross','owen','shane','derry','carra','ree','lough','nagh','keel']],
    french:[['Saint-','Mont','Ville','Château','Pont','Val','Beau','Fort','Bel','Clair'],['ferrand','rouge','clair','neuf','ancy','argent','brun','vert','mont','lac']],
    anglo:[['Ash','Wulf','Ealdor','Grim','Stan','Wood','Hag','Black','Ox','Bran'],['ford','ham','wick','thorpe','burgh','mere','stead','ley','worth','den']],
  };
  function genName(r,reg){const s=SYL[reg]||SYL.irish;return s[0][Math.floor(r()*s[0].length)]+s[1][Math.floor(r()*s[1].length)];}
  const REGION_NAMES={forest:['Wood','Weald','Holt','Shaw'],plains:['Vale','Downs','Reach','March'],coast:['Strand','Shore','Coast','Haven'],wastes:['Waste','Barrens','Scar','Heath'],tundra:['Tundra','Snows','Whites','Frost'],fen:['Fen','Marsh','Mire','Carr'],moor:['Moor','Heath','Tops','Rise'],autumn:['Rust','Amber Wood','Gold Weald','Fall'],dunes:['Dunes','Sands','Shingle','Wash'],swamp:['Swamp','Bog','Sump','Drowned Wood'],wasteland:['Cinders','Blight','Ash','Burn']};
  // ── cell data ──
  const CELLS=new Map();
  function cellKey(i,j){return i+','+j;}
  function getCell(i,j){
    const key=cellKey(i,j);if(CELLS.has(key))return CELLS.get(key);
    const c=(i===HOME_I&&j===HOME_J)?homeCellData():genCellData(i,j);
    c.sites.forEach(t=>{if(t.kind==='lair'&&!c.doors.some(d=>d.lairDoor&&d.lairSite===t.id)){const e=lairDoorFor(t,c);e.lairSite=t.id;c.doors.push(e);}}); // v80 — lair caverns
    CELLS.set(key,c);return c;
  }
  function genCellData(i,j){
    const type=maskAt(i,j),ox=i*SIZE,oz=j*SIZE,r=cellRng(i,j,0);
    const reg=cultureOfCell(i,j),climate=climateOfCell(i,j),polity=polityOfCell(i,j);
    const c={i,j,type,ox,oz,reg,climate,polity,regions:[],sites:[],roadDefs:[],doors:[],peaks:[],lakes:[],rivers:[],ridges:[],sea:{},islets:[],name:genName(r,reg)+' '+(polity==='realm'?'Realm':polity==='marches'?'Marches':'Wilds')};
    // sea edges from the mask; ridges on some land borders
    ['W','E','N','S'].forEach(sd=>{const ni=i+(sd==='E'?1:sd==='W'?-1:0),nj=j+(sd==='S'?1:sd==='N'?-1:0);c.sea[sd]=!isLandCell(ni,nj);if(ridgeOnEdge(i,j,sd))c.ridges.push(sd);});
    if(type==='sea'){const n=1+Math.floor(r()*3);for(let k=0;k<n;k++)c.islets.push({x:ox+400+r()*(SIZE-800),z:oz+400+r()*(SIZE-800),r:60+r()*80});
      // half the islets carry something: mostly small places, now and then a village or a harbour
      c.islets.forEach((il,k)=>{if(r()<.5)return;const q=r();let kind=q<.24?'shrine':q<.44?'tower':q<.58?'lair':q<.72?'glade':q<.84?'bcamp':(il.r>=95?(q<.93?'village':'port'):'shrine');
        const pad=kind==='village'?45:kind==='port'?70:POI_PAD[kind];if(pad>il.r*.62)kind='shrine';const pd=kind==='village'?45:kind==='port'?70:POI_PAD[kind];
        const site={id:`c${i}_${j}_i${k}`,name:kind==='village'||kind==='port'?genName(r,reg):poiName(kind,r,reg),kind,x:il.x,z:il.z,pad:pd,cell:key(i,j),reg,islet:true};
        if(kind==='port'){site.shore=[1,0];site.x=il.x-il.r*.35;}c.sites.push(site);});
      c.sites.forEach(t=>{if(t.kind==='village'||t.kind==='port')t.lordless=true;});
      return c;}
    if(type==='island')c.islets.push({x:ox+SIZE/2+(r()-.5)*300,z:oz+SIZE/2+(r()-.5)*300,r:SIZE*.3+r()*200});
    const isIsland=type==='island';
    // regions: soft fields
    const nR=isIsland?2:4+Math.floor(r()*3);
    const coastW=c.type==='coast'||isIsland?.2:.05;
    const biomesW=climate==='cold'?[['forest',.3],['tundra',.3],['moor',.18],['plains',.1],['coast',coastW]]:climate==='warm'?[['plains',.25],['dunes',.18],['swamp',.17],['wasteland',.15],['wastes',.1],['coast',coastW]]:[['forest',.26],['plains',.24],['autumn',.18],['fen',.12],['moor',.1],['coast',coastW]];
    for(let k=0;k<nR;k++){
      let pick_=r()*biomesW.reduce((a,b)=>a+b[1],0),b='plains';for(const [bb,w] of biomesW){pick_-=w;if(pick_<=0){b=bb;break;}}
      const rr=isIsland?520:480+r()*360;
      const DENS={forest:.7+r()*.25,plains:.18+r()*.12,coast:.1,wastes:.12,tundra:.14,fen:.4,moor:.08,autumn:.62,dunes:.03,swamp:.5,wasteland:.1}[b];
      const AMP={forest:7+r()*4,plains:4+r()*3,coast:5,wastes:3,tundra:6,fen:1.6,moor:9,autumn:6,dunes:5,swamp:1.4,wasteland:4}[b];
      c.regions.push({id:`c${i}_${j}_r${k}`,name:`${genName(r,reg)} ${(REGION_NAMES[b]||REGION_NAMES.plains)[Math.floor(r()*4)]}`,x:ox+300+r()*(SIZE-600),z:oz+300+r()*(SIZE-600),r:rr,biome:b,amp:AMP,trees:BIOME_TREE[b],density:DENS,rocks:b==='wastes'||b==='wasteland'||b==='moor'?1.2:.6,music:b==='forest'||b==='autumn'||b==='swamp'?'forest':b==='coast'||b==='dunes'?'coast':b==='wastes'||b==='wasteland'||b==='tundra'?'wastes':'road',enc:.1+r()*.1});
    }
    // sites on a jittered lattice, kinds by weight; ports on sea-facing edges
    const N=isIsland?2:4,step=SIZE/N,margin=260;
    const cand=[];
    for(let a=0;a<N;a++)for(let b=0;b<N;b++){
      const x=ox+margin+(a+.5)*(SIZE-2*margin)/N+(r()-.5)*220,z=oz+margin+(b+.5)*(SIZE-2*margin)/N+(r()-.5)*220;
      if(r()<(isIsland?.5:polity==='wilds'?.55:.8))cand.push({x,z});
    }
    let townDone=false,cityRoll=cellHash(i,j,5)<(polity==='realm'?.38:polity==='marches'?.15:.05);
    cand.forEach((p,k)=>{
      let kind='village';const q=r();
      if(!townDone&&(k===Math.floor(cand.length/2))){kind=cityRoll?'city':'town';townDone=true;}
      else if(polity==='marches'){if(q<.28)kind='outpost';else if(q<.34)kind='camp';else if(q<.4)kind='ruin';}
      else if(polity==='wilds'){if(q<.12)kind='outpost';else if(q<.3)kind='camp';else if(q<.5)kind='ruin';else if(q<.56)kind='poi';}
      else{if(q<.1)kind='outpost';else if(q<.15)kind='camp';else if(q<.2)kind='ruin';else if(q<.23)kind='poi';}
      // near a sea edge → port (a town on the shore)
      const dE=c.sea.E?(ox+SIZE)-p.x:1e9,dW=c.sea.W?p.x-ox:1e9,dS=c.sea.S?(oz+SIZE)-p.z:1e9,dN=c.sea.N?p.z-oz:1e9;
      const dSea=Math.min(dE,dW,dS,dN);
      if(dSea<900&&(kind==='village'||kind==='outpost')&&r()<.85){
        // walk toward that sea edge to the real (warped) shoreline; the port sits just behind it
        const dir=dSea===dE?[1,0]:dSea===dW?[-1,0]:dSea===dS?[0,1]:[0,-1];let found=null;
        for(let d=0;d<=1300;d+=20){const x=p.x+dir[0]*d,z=p.z+dir[1]*d;if(seaBare(x,z,c.islets)>.5){found=d;break;}}
        if(found!=null&&found>=40){kind='port';p.x+=dir[0]*(found-62);p.z+=dir[1]*(found-62);p.shore=dir;}
      }
      const pad={village:45,town:95,city:135,outpost:26,camp:16,ruin:45,poi:35,port:80}[kind];
      // nothing stands in the sea: nudge inland (away from the nearest sea edge) until the ground is dry
      if(kind!=='port'){let tries=0;const away=dSea===dE?[-1,0]:dSea===dW?[1,0]:dSea===dS?[0,-1]:[0,1];
        while(tries++<30&&seaBare(p.x,p.z,c.islets)>.12){p.x+=away[0]*40+(r()-.5)*20;p.z+=away[1]*40+(r()-.5)*20;}
        if(seaBare(p.x,p.z,c.islets)>.12)return; // still wet: no settlement here
      }
      c.sites.push({id:`c${i}_${j}_s${k}`,name:kind==='camp'?`${genName(r,reg)} Camp`:kind==='ruin'?`Ruins of ${genName(r,reg)}`:genName(r,reg),kind,x:p.x,z:p.z,pad,cell:key(i,j),reg,shore:p.shore||null});
    });
    // points of interest: one to three per province, on dry ground away from the others
    {const nPoi=3+Math.floor(r()*4);for(let k=0;k<nPoi;k++){const POI_W=['glade','glade','glade','shrine','shrine','shrine','tower','tower','lair','bcamp'];const kind=POI_W[Math.floor(r()*POI_W.length)];let x=ox+220+r()*(SIZE-440),z=oz+220+r()*(SIZE-440),ok=false;
      for(let t2=0;t2<14&&!ok;t2++){x=ox+220+r()*(SIZE-440);z=oz+220+r()*(SIZE-440);ok=seaBare(x,z,c.islets)<.08&&!c.sites.some(t=>Math.hypot(t.x-x,t.z-z)<t.pad+POI_PAD[kind]+40);}
      if(ok)c.sites.push({id:`c${i}_${j}_p${k}`,name:poiName(kind,r,reg),kind,x,z,pad:POI_PAD[kind],cell:key(i,j),reg});}}
    // roads: MST + a couple of extras; portals on every land border
    const S_=c.sites.filter(s=>s.pad>0&&!['shrine','glade','tower','lair','camp','bcamp','ruin'].includes(s.kind)); // v80 S134 — roads join settlements; shrines, glades and spires sit off the beaten path
    if(S_.length>1){
      const inT=[S_[0]];const out=S_.slice(1);
      while(out.length){let bi=-1,bj=-1,bd=1e18;inT.forEach((a,ia)=>out.forEach((b,ib)=>{const d=(a.x-b.x)**2+(a.z-b.z)**2;if(d<bd){bd=d;bi=ia;bj=ib;}}));c.roadDefs.push({a:inT[bi].id,b:out[bj].id,via:`${genName(r,reg)} Road`});inT.push(out.splice(bj,1)[0]);}
      for(let k=0;k<2&&S_.length>3;k++){const a=S_[Math.floor(r()*S_.length)],b=S_[Math.floor(r()*S_.length)];if(a!==b&&!c.roadDefs.some(d=>(d.a===a.id&&d.b===b.id)||(d.a===b.id&&d.b===a.id))&&Math.hypot(a.x-b.x,a.z-b.z)<1400)c.roadDefs.push({a:a.id,b:b.id,via:`${genName(r,reg)} Way`});}
    }
    addPortals(c,S_);
    // doors
    const nD=isIsland?4:10+Math.floor(r()*8);
    const EXT=[['gatehouse','fort_tee'],['watchtower','fort_tee'],['palisade','fort_linear'],['earthwork','fort_linear'],['keep','fort_courtyard'],['monastery','fort_courtyard'],['ruined_gatehouse','fort_tee'],['watchtower_canopy','fort_linear']];
    const THEMES=['undead','goblin','elemental','deep','haunted','ruins'];
    for(let k=0;k<nD;k++){
      const seed=100000+((cellHash(i,j,100+k)*899999)|0);const fort=r()<(polity==='marches'?.45:polity==='wilds'?.15:.25);const th=THEMES[Math.floor(r()*THEMES.length)];
      let dx_=ox+200+r()*(SIZE-400),dz_=oz+200+r()*(SIZE-400);
      for(let t2=0;t2<12;t2++){const near=c.sites.find(t=>t.pad>0&&Math.hypot(t.x-dx_,t.z-dz_)<t.pad+(fort?110:60));if(!near&&seaBare(dx_,dz_,c.islets)<.1)break;dx_=ox+200+r()*(SIZE-400);dz_=oz+200+r()*(SIZE-400);}
      const e={zone:'gen',x:dx_,z:dz_,seed,size:['small','medium','large'][Math.floor(r()*3)],theme:th,diff:'normal',kind:fort?'fort_door':'cave_door',cell:key(i,j),sigil:fort||cellHash(seed%9973,seed%7919,9)<.25};
      e.canonicalName=canonicalGateName(e,c);
      if(fort){const ex=EXT[Math.floor(r()*EXT.length)];e.exterior=ex[0];e.interior=ex[1];e.canonicalName=`${genName(r,reg)} ${['Hold','Keep','Watch','Gate','Tower'][Math.floor(r()*5)]}`;}
      c.doors.push(e);
    }
    // landmarks
    if(!isIsland&&r()<.55)c.peaks.push({id:`c${i}_${j}_pk`,name:`${['Sliabh','Mont','Ben','Cnoc'][Math.floor(r()*4)]} ${genName(r,reg)}`,x:ox+500+r()*(SIZE-1000),z:oz+500+r()*(SIZE-1000),r:200+r()*120,h:90+r()*70,kind:'peak'});
    if(r()<.45)c.lakes.push({id:`c${i}_${j}_lk`,name:`${['Loch','Lac','Mere'][['irish','french','anglo'].indexOf(reg)]} ${genName(r,reg)}`,x:ox+450+r()*(SIZE-900),z:oz+450+r()*(SIZE-900),r:70+r()*60,depth:-4,blend:60});
    // rivers: enter at river borders, leave at another river border or the nearest sea edge
    const rivEdges=['E','W','S','N'].filter(sd=>riverOnEdge(i,j,sd));
    const seaSides=['E','W','S','N'].filter(sd=>c.sea[sd]);
    const edgePt=sd=>{const p=edgePortal(i,j,sd);const o=cellHash(i,j,sd==='E'?31:sd==='W'?33:sd==='S'?35:37)*.5+.25;return sd==='E'?[ox+SIZE+40,oz+o*SIZE]:sd==='W'?[ox-40,oz+o*SIZE]:sd==='S'?[ox+o*SIZE,oz+SIZE+40]:[ox+o*SIZE,oz-40];};
    const mkRiver=(a,b,w)=>{const pts=[a];for(let k=1;k<6;k++){const t=k/6;pts.push([a[0]+(b[0]-a[0])*t+(r()-.5)*260,a[1]+(b[1]-a[1])*t+(r()-.5)*260]);}pts.push(b);c.rivers.push({id:`c${i}_${j}_rv${c.rivers.length}`,pts,w,depth:-2.4,blend:20});};
    if(rivEdges.length>=2){for(let k=0;k+1<rivEdges.length;k+=2)mkRiver(edgePt(rivEdges[k]),edgePt(rivEdges[k+1]),4.5);if(rivEdges.length%2&&seaSides.length)mkRiver(edgePt(rivEdges[rivEdges.length-1]),edgePt(seaSides[0]),4);}
    else if(rivEdges.length===1){const src=edgePt(rivEdges[0]);const dst=seaSides.length?edgePt(seaSides[Math.floor(r()*seaSides.length)]):(c.lakes[0]?[c.lakes[0].x,c.lakes[0].z]:null);if(dst)mkRiver(src,dst,4.5);}
    else if(seaSides.length&&r()<.45){const sd=seaSides[Math.floor(r()*seaSides.length)];const src=c.peaks[0]?[c.peaks[0].x,c.peaks[0].z]:[ox+600+r()*1200,oz+600+r()*1200];mkRiver(src,edgePt(sd),3.5);}
    return c;
  }
  function key(i,j){return cellKey(i,j);}
  function addPortals(c,S_){const {i,j}=c;
    ['E','S','W','N'].forEach(sd=>{
      const ni=i+(sd==='E'?1:sd==='W'?-1:0),nj=j+(sd==='S'?1:sd==='N'?-1:0);
      if(!isLandCell(ni,nj)||!S_.length)return;
      const pp=edgePortal(i,j,sd);const ps={id:`c${i}_${j}_p${sd}`,name:'',kind:'portal',x:pp.x,z:pp.z,pad:0,cell:key(i,j)};c.sites.push(ps);
      let best=S_[0],bd=1e18;S_.forEach(s=>{const d=(s.x-pp.x)**2+(s.z-pp.z)**2;if(d<bd){bd=d;best=s;}});
      c.roadDefs.push({a:best.id,b:ps.id,via:'the Border Road',portal:true});
    });}
  // the authored world, offset into its cell
  function homeCellData(){
    const ox=HOME_I*SIZE,oz=HOME_J*SIZE;
    const c={i:HOME_I,j:HOME_J,type:'coast',ox,oz,reg:'irish',regions:[],sites:[],roadDefs:[],doors:[],peaks:[],lakes:[],rivers:[],ridges:['N'],sea:{W:true,S:true,E:true,N:false},name:'The Home Province',home:true,inlets:[],climate:'temperate',polity:'realm'};
    HOME_REGIONS.forEach(r_=>c.regions.push(Object.assign({},r_,{x:r_.x+ox,z:r_.z+oz})));
    HOME_SITES.forEach(t=>c.sites.push(Object.assign({},t,{x:t.x+ox,z:t.z+oz,cell:key(HOME_I,HOME_J),reg:REGISTER[dominantRegionOf(c.regions,t.x+ox,t.z+oz).id]||'irish'})));
    c.roadDefs=HOME_ROAD_DEFS.slice();
    WORLD_DUNGEONS.forEach(e=>c.doors.push(Object.assign({},e,{cell:key(HOME_I,HOME_J)})));
    HOME_PEAKS.forEach(p=>c.peaks.push(Object.assign({},p,{x:p.x+ox,z:p.z+oz})));
    HOME_LAKES.forEach(l=>c.lakes.push(Object.assign({},l,{x:l.x+ox,z:l.z+oz})));
    HOME_RIVERS.forEach(rv=>c.rivers.push(Object.assign({},rv,{pts:rv.pts.map(p=>[p[0]+ox,p[1]+oz])})));
    HOME_INLETS.forEach(inl=>c.inlets.push(Object.assign({},inl,{pts:inl.pts.map(p=>[p[0]+ox,p[1]+oz])})));
    addPortals(c,c.sites.filter(t=>t.pad>0&&t.kind!=='poi'));
    return c;
  }
  function dominantRegionOf(regs,x,z){let best=regs[0],bw=-1;for(const r_ of regs){const d=Math.hypot(x-r_.x,z-r_.z);const w=Math.max(0,1-d/r_.r);if(w>bw){bw=w;best=r_;}}return best;}

  // ── sea / ridges by cell (replaces the single-map edge sea and north wall) ──
  // A continuous land field: the mask sampled at cell centres, smoothly
  // interpolated, then warped by two octaves of noise. Coasts curve and
  // cross borders; island cells and open-sea islets are blobs on top;
  // every settlement pad pushes the sea back so nothing authored drowns.
  function landField(x,z){
    const u=x/SIZE-.5,v=z/SIZE-.5;const i0=Math.floor(u),j0=Math.floor(v);const fu=u-i0,fv=v-j0;
    const L=(i,j)=>{const t=maskAt(i,j);return (t==='sea'||t==='island')?0:1;};
    const a=L(i0,j0),b=L(i0+1,j0),c=L(i0,j0+1),d=L(i0+1,j0+1);
    return (a*(1-fu)+b*fu)*(1-fv)+(c*(1-fu)+d*fu)*fv;
  }
  // sea without stamps — safe to call while a cell is being generated (pass its islets)
  function seaBare(x,z,islets){
    const wx=(fbm(x,z,2600,SEED+75,2)-.5)*1900+(fbm(x,z,900,SEED+77,2)-.5)*600,wz=(fbm(x+3000,z-3000,2600,SEED+76,2)-.5)*1900+(fbm(x-3000,z+3000,900,SEED+78,2)-.5)*600;
    let f=landField(x+wx,z+wz)+(fbm(x,z,560,SEED+70,3)-.5)*.5+(fbm(x,z,150,SEED+71,2)-.5)*.16;
    let sea=sstep(.5,.41,f);
    for(const il of (islets||[])){const d=Math.hypot(x-il.x,z-il.z)/il.r+(_smoothNoise(x,z,SEED+62,40)-.5)*.3;sea=Math.min(sea,sstep(.7,1.45,d));}
    return sea;
  }
  function seaAt(x,z){
    const [i,j]=cellOf(x,z);const c=getCell(i,j);
    let sea=seaBare(x,z,c.islets);
    if(sea>0){const arr=stampsNear(x,z);for(let k=0;k<arr.length;k++){const st=arr[k];if(st.kind!=='site')continue;const d=Math.hypot(x-st.x,z-st.z);
      if(st.port){const R=st.r*.95;if(d<R)sea*=sstep(st.r*.7,R,d);} // ports: the water line sits at the quay
      else{const R=st.r+st.blend;if(d<R)sea*=sstep(st.r,R,d);}}}
    return sea;
  }
  function ridgeAt(x,z){
    const i=Math.floor(x/SIZE),j=Math.floor(z/SIZE);const lx=x-i*SIZE,lz=z-j*SIZE;let m=0;
    const wob=(_smoothNoise(x,z,SEED+72,190)-.5)*170;                      // the range wanders ±85u
    const vary=.5+fbm(x,z,240,SEED+73,2)*1.0;                                // peaks and shoulders along it
    const pass=sstep(.2,.36,fbm(x,z,320,SEED+74,2));                         // gaps in the range
    const band=d=>sstep(340,70,d+wob)*vary*pass;
    if(ridgeOnEdge(i,j,'N'))m=Math.max(m,band(lz));if(ridgeOnEdge(i,j,'S'))m=Math.max(m,band(SIZE-lz));
    if(ridgeOnEdge(i,j,'W'))m=Math.max(m,band(lx));if(ridgeOnEdge(i,j,'E'))m=Math.max(m,band(SIZE-lx));
    return Math.min(1,m);
  }


  // ── stamp spatial grid (worldH is called a lot) ──
  const SGRID=new Map();const SG=160;
  function sgKey(gx,gz){return gx*100003+gz;}
  function stampsNear(x,z){return SGRID.get(sgKey(Math.floor(x/SG),Math.floor(z/SG)))||[];}
  function sgAdd(s){const R=s.r+s.blend;for(let gz=Math.floor((s.z-R)/SG);gz<=Math.floor((s.z+R)/SG);gz++)for(let gx=Math.floor((s.x-R)/SG);gx<=Math.floor((s.x+R)/SG);gx++){const k=sgKey(gx,gz);let a=SGRID.get(k);if(!a){a=[];SGRID.set(k,a);}a.push(s);}}
  function sgRemove(s){const R=s.r+s.blend;for(let gz=Math.floor((s.z-R)/SG);gz<=Math.floor((s.z+R)/SG);gz++)for(let gx=Math.floor((s.x-R)/SG);gx<=Math.floor((s.x+R)/SG);gx++){const a=SGRID.get(sgKey(gx,gz));if(a){const i=a.indexOf(s);if(i>=0)a.splice(i,1);}}}

  // ── job budget: heavy work spreads across frames ──
  const JOBS=[];let JOB_BUDGET_MS=6;
  function addJob(fn,prio){JOBS.push({fn,prio:prio||0});JOBS.sort((a,b)=>b.prio-a.prio);}
  function runJobs(){const t0=performance.now();let ran=0;while(JOBS.length&&performance.now()-t0<JOB_BUDGET_MS&&ran<2){const j=JOBS.shift();ran++;let more=false;try{more=j.fn();}catch(e){console.warn('job failed',e);}if(more)JOBS.push(j);}}

  // ── cell load / unload ──
  const LOADED=new Map(); // key -> {cell, statics:[], solStart, solEnd, roads:[], stamps:[], portals:[]}
  // Loading is sliced into steps so a cell never lands in one frame.
  // loadCell(i,j) runs every step now (home cell, restores); loadCellSteps
  // returns the steps for the job queue.
  function loadCellSteps(i,j){
    const k=cellKey(i,j);if(LOADED.has(k))return null;
    const c=getCell(i,j);const L={cell:c,statics:[],stamps:[],roads:[],portals:[],solN:0,doorSeeds:[],pending:true};LOADED.set(k,L);
    let solStart=0;const track=fn=>{const before=sc.children.length;fn();for(let n=before;n<sc.children.length;n++)L.statics.push(sc.children[n]);};
    const steps=[
      ()=>{c.regions.forEach(r_=>REGIONS.push(r_));c.peaks.forEach(p=>PEAKS.push(p));c.lakes.forEach(l=>LAKES.push(l));c.rivers.forEach(rv=>RIVERS.push(rv));(c.inlets||[]).forEach(inl=>INLETS.push(inl));try{refreshChunksNearWater([...c.rivers,...c.lakes,...(c.inlets||[]),...c.peaks]);}catch(e){console.warn('refresh',e);}
           c.sites.forEach(t=>{SITES.push(t);SITE[t.id]=t;});if(c.home&&SITE.ashenmoor){ASH_X=SITE.ashenmoor.x;ASH_Z=SITE.ashenmoor.z;}c.sites.forEach(t=>{if(t.pad>0){const s=addStamp({id:'site_'+t.id,kind:'site',port:t.kind==='port',x:t.x,z:t.z,r:t.kind==='port'?t.pad*.72:t.pad,blend:t.kind==='port'?t.pad*.3:Math.max(30,t.pad*.7),y:t.kind==='port'?Math.max(SEA_Y+1.3,Math.min(landH(t.x,t.z),3.0)):Math.max(SEA_Y+1.6,landH(t.x,t.z))});L.stamps.push(s);}});
           // ports: the shore shelf that meets the quay, stamped now so the chunks are built with it
           c.sites.forEach(t=>{if(t.kind!=='port')return;const sd=shoreDir(t);if(!sd)return;let x=t.x+sd.dx*t.pad,z=t.z+sd.dz*t.pad,n=0;while(worldH(x,z)>1.3&&n<80){x+=sd.dx*3;z+=sd.dz*3;n++;}t.quayStart={x,z};const q=addStamp({id:'quay_'+t.id,kind:'door',x:x-sd.dx*6,z:z-sd.dz*6,r:9,blend:16,y:1.05,cell:cellKey(c.i,c.j)});L.stamps.push(q);
             // the shipwright's own flat pad at the quay head
             const lx=x-sd.dx*9-sd.dz*11,lz=z-sd.dz*9+sd.dx*11;t.shipwrightLot={x:lx,z:lz};const q2=addStamp({id:'swpad_'+t.id,kind:'door',x:lx,z:lz,r:8,blend:12,y:1.05,cell:cellKey(c.i,c.j)});L.stamps.push(q2);});},
      ()=>{c.roadDefs.forEach(def=>{const rd=buildRoad(def);if(rd){rd.cell=k;L.roads.push(rd);}});try{track(()=>buildBridges(c,k,L));}catch(e){console.warn('bridges',e);}},
      ()=>{solStart=STATIC_SOL.length;c.doors.forEach(e=>{const w=placeDoor(e,k);if(w)L.doorSeeds.push(e.seed);});c.doors.forEach(e=>{if(e.kind==='fort_door'&&dungeonWorldPos[e.seed])addFortSpur(e,k);});L.stamps.push(...STAMPS.filter(s=>s.cell===k&&s.kind==='door'));try{L.cleared=clearScatterUnder(L.stamps);}catch(e){console.warn('clear',e);}},
      ()=>track(()=>buildImpostorsFor(c)),
      ()=>track(()=>buildFarFor(c)),
      ()=>{for(let n=solStart;n<STATIC_SOL.length;n++)STATIC_SOL[n].cell=k;L.pending=false;if(c.home)homeLoaded();},
    ];
    return steps;
  }
  // ── fort compounds: a curtain wall with corner towers, a gate on the road
  // side, two barracks, banners and torches around every fort exterior.
  // S256 — the fort's keep in detail: a battered plinth, walls of coursed rubble on a mortar core, stepped buttresses, a
  // string course, dressed arrow slits, a corbelled crenellated parapet over a hipped lead roof, coursed round turrets
  // with slated caps, a round-arched doorway of voussoirs with its two plank leaves standing open, round-headed windows
  // with sills, torch brackets and the nation's banner on a pole. The old keep's footprint (11 by 9, 7.2 to the walk),
  // door, windows and lights are where they were; y 0 at the ground, the south face at +D/2.
  function fortKeepGeoHi(W,D,H,banner,rr){const P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+rr()*a*2).getHex(),wc=0x5a4a40,pale=0xc8b8a0,dk=0x2a2622,mortar=0x3e342e,iron=0x2a2624,wood=0x5a3d22;
    const frustum=(w0,d0,w1,d1,h)=>{const g=new THREE.BoxGeometry(1,h,1),p=g.attributes.position;for(let i=0;i<p.count;i++){const up=p.getY(i)>0;p.setX(i,p.getX(i)*(up?w1:w0));p.setZ(i,p.getZ(i)*(up?d1:d0));}g.computeVertexNormals();return g;};
    const PL=1.0,DW=1.2,DY=3.0; // the plinth's height; the doorway's half-width and the arch's springing
    // the plinth splays out at the foot and runs a metre into the ground for a slope; the core behind the courses
    add(frustum(W+1.0,D+1.0,W+.3,D+.3,PL+1.0),vary(0x4a3e36,.04),0,PL/2-.5,0,0,0,0,.06);
    add(new THREE.BoxGeometry(W+.5,.18,D+.5),vary(pale,.04),0,PL+.02,0,0,0,0,.03);
    add(new THREE.BoxGeometry(W-.1,H-PL,D-1.0),mortar,0,(H+PL)/2,-.5,0,0,0,.02);
    add(new THREE.BoxGeometry(W/2-DW-.05,H-PL,1.0),mortar,-(W/2+DW)/2,(H+PL)/2,D/2-.55,0,0,0,.02);
    add(new THREE.BoxGeometry(W/2-DW-.05,H-PL,1.0),mortar,(W/2+DW)/2,(H+PL)/2,D/2-.55,0,0,0,.02);
    {const top=DY+DW+.6,s=new THREE.Shape();s.moveTo(-DW,DY);s.lineTo(-DW,top);s.lineTo(DW,top);s.lineTo(DW,DY);s.absarc(0,DY,DW,0,Math.PI,false);
      add(new THREE.ExtrudeGeometry(s,{depth:1.0,bevelEnabled:false,curveSegments:10}),mortar,0,0,D/2-1.05,0,0,0,.02);
      add(new THREE.BoxGeometry(2*DW+.1,H-top,1.0),mortar,0,(H+top)/2,D/2-.55,0,0,0,.02);
      const b=new THREE.Shape();b.moveTo(-DW,0);b.lineTo(DW,0);b.lineTo(DW,DY);b.absarc(0,DY,DW,0,Math.PI,false);b.lineTo(-DW,0);add(new THREE.ShapeGeometry(b,10),0x0c0908,0,0,D/2-.95,0,0,0,0);}
    // courses of rubble on each face, laid broken-joint, leaving the doorway and the windows open
    const WINX=3.4,WY=H*.62,faces=[[0,D/2,W,0],[0,-D/2,W,Math.PI],[W/2,0,D,Math.PI/2],[-W/2,0,D,-Math.PI/2]];
    for(const [fx,fz,L,ry] of faces){const south=ry===0,nx=Math.sin(ry),nz=Math.cos(ry),tx=Math.cos(ry),tz=-Math.sin(ry);
      const gaps=south?[[-DW-.25,DW+.25,0,DY+DW+.4],[-WINX-.55,-WINX+.55,WY-.7,WY+.85],[WINX-.55,WINX+.55,WY-.7,WY+.85]]:[];
      for(let y=PL+.12;y<H-.05;){const ch=Math.min(H-y,.48+rr()*.26);let x=-L/2+.2;
        while(x<L/2-.25){let bl=Math.min(L/2-.2-x,.8+rr()*1.3);const g=gaps.find(q=>y+ch>q[2]&&y<q[3]&&x+bl>q[0]&&x<q[1]);
          if(g){if(x<g[0]-.05)bl=g[0]-x;else{x=g[1];continue;}}
          const t=.14+(rr()-.5)*.06,cx=x+bl/2;add(new THREE.BoxGeometry(bl-.05,ch-.05,t),vary(wc,.16),fx+tx*cx+nx*(t/2-.04),y+ch/2,fz+tz*cx+nz*(t/2-.04),0,ry,0,.05);x+=bl;}
        y+=ch;}}
    // stepped buttresses on the long sides, the string course, arrow slits in dressed surrounds
    for(const k of [-1,1])for(const q of [-1,1]){const bz=q*D*.28,bx=k*(W/2+.35);add(SK.rbox(.8,H*.5,.9,.06,1),vary(pale,.06),bx,H*.25,bz,0,0,0,.05);add(SK.rbox(.6,H*.3,.75,.06,1),vary(pale,.06),bx-k*.1,H*.62,bz,0,0,0,.05);add(new THREE.BoxGeometry(.6,.4,.8),vary(pale,.05),bx-k*.12,H*.78,bz,0,0,k*.7,.04);}
    add(SK.rbox(W+.34,.24,D+.34,.06,1),vary(pale,.04),0,H*.55,0,0,0,0,.03);
    const slit=(x,y,z,ry)=>{const nx=Math.sin(ry),nz=Math.cos(ry),tx=Math.cos(ry),tz=-Math.sin(ry);add(new THREE.BoxGeometry(.14,1.0,.1),0x100c0a,x+nx*.06,y,z+nz*.06,0,ry,0,0);
      for(const s of [-1,1])add(new THREE.BoxGeometry(.2,1.3,.18),vary(pale,.06),x+tx*s*.17+nx*.06,y,z+tz*s*.17+nz*.06,0,ry,0,.04);add(new THREE.BoxGeometry(.56,.2,.2),vary(pale,.06),x+nx*.07,y+.72,z+nz*.07,0,ry,0,.04);add(new THREE.BoxGeometry(.56,.14,.22),vary(pale,.06),x+nx*.07,y-.68,z+nz*.07,0,ry,0,.04);};
    for(let k=0;k<3;k++){slit(-3.5+k*3.5,H*.8,-D/2,Math.PI);slit(W/2,H*.72,-3+k*3,Math.PI/2);slit(-W/2,H*.72,-3+k*3,-Math.PI/2);}
    // the parapet: corbels carry a projecting walk, merlons on the old spacing, a hipped lead roof inside it
    for(const [fx,fz,L,ry] of faces){const nx=Math.sin(ry),nz=Math.cos(ry),tx=Math.cos(ry),tz=-Math.sin(ry);
      for(let t=-L/2+.5;t<L/2-.3;t+=1.1)add(new THREE.BoxGeometry(.26,.42,.34),vary(pale,.05),fx+tx*t+nx*.14,H-.2,fz+tz*t+nz*.14,0,ry,0,.04);
      add(SK.rbox(L+.6,.34,.46,.06,1),vary(pale,.04),fx+nx*.2,H+.1,fz+nz*.2,0,ry,0,.03);}
    for(let k=0;k<Math.floor(W/1.4);k++)for(const s of [1,-1])add(SK.rbox(.8,.8,.46,.07,1),vary(pale,.08),-W/2+.7+k*1.4,H+.66,s*(D/2-.06),0,0,0,.05);
    for(let k=0;k<Math.floor(D/1.4);k++)for(const s of [1,-1])add(SK.rbox(.46,.8,.8,.07,1),vary(pale,.08),s*(W/2-.06),H+.66,-D/2+.7+k*1.4,0,0,0,.05);
    {const g=new THREE.ConeGeometry(Math.SQRT1_2,1,4,1);g.rotateY(Math.PI/4);g.scale(W-1.4,1.3,D-1.4);add(g,0x4a4c52,0,H+.65,0,0,0,0,.04);add(SK.rbox(W-.6,.12,D-.6,.04,1),0x6a6258,0,H+.02,0,0,0,0,.03);}
    // corner turrets: coursed round towers on a battered foot, slits, a corbelled crenellated top, a slated cone and finial
    const TT=H+2.4,R0=1.2,R1=1.4;for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=sx*(W/2-.2),z=sz*(D/2-.2),out=Math.atan2(sx,sz);
      add(new THREE.CylinderGeometry(R1+.05,R1+.22,PL+1.0,12),vary(0x4a3e36,.04),x,PL/2-.5,z,0,0,0,.05);
      add(new THREE.CylinderGeometry(R0,R1,TT-PL,12,2),vary(pale,.05),x,(TT+PL)/2,z,0,0,0,.08);
      for(let y=PL+.8;y<TT-.6;y+=1.3){const rad=R1-(R1-R0)*((y-PL)/(TT-PL))+.01;add(SK.torus(rad,.045,3,10),0x8a7c68,x,y,z,Math.PI/2,0,0,.03);}
      for(let q=0;q<2;q++){const a=out+(q-.5)*1.1,y=3.0+q*2.4,rad=R1-(R1-R0)*((y-PL)/(TT-PL))+.02;add(new THREE.BoxGeometry(.13,.8,.1),0x100c0a,x+Math.sin(a)*rad,y,z+Math.cos(a)*rad,0,a,0,0);}
      for(let k=0;k<7;k++){const a=k/7*Math.PI*2;add(new THREE.BoxGeometry(.26,.34,.3),vary(pale,.05),x+Math.sin(a)*(R0+.08),TT-.25,z+Math.cos(a)*(R0+.08),0,a,0,.04);}
      add(new THREE.CylinderGeometry(R0+.32,R0+.32,.3,12),vary(pale,.04),x,TT+.05,z);
      for(let k=0;k<6;k++){const a=k/6*Math.PI*2+.3;add(new THREE.BoxGeometry(.62,.55,.3),vary(pale,.07),x+Math.sin(a)*(R0+.16),TT+.47,z+Math.cos(a)*(R0+.16),0,a,0,.05);}
      for(let k=0;k<4;k++){const r1=(R0+.18)*(1-k/4),r2=(R0+.18)*(1-(k+1)/4);add(new THREE.CylinderGeometry(Math.max(.03,r2),r1,.45,12,1,true),vary(dk,.1),x,TT+.35+k*.45+.22,z,0,0,0,.05);}
      add(SK.cyl(.04,.04,.5,4),0x8a7a4a,x,TT+2.35,z);add(SK.ball(.1,6,5),0xc8a850,x,TT+2.62,z);}
    // the doorway: dressed jambs in long and short stones, a ring of voussoirs with a keystone, the leaves open against
    // the reveals, a threshold and the old two steps
    for(const s of [-1,1]){let y=0,k=0;while(y<DY-.02){const h=Math.min(DY-y,.5+rr()*.12),long=k++%2===0;add(SK.rbox(long?.62:.42,h-.04,.34,.05,1),vary(pale,.07),s*(DW+(long?.29:.19)),y+h/2,D/2+.03,0,0,0,.05);y+=h;}}
    for(let k=0;k<=10;k++){const a=k/10*Math.PI,key=k===5,rad=DW+(key?.36:.3);add(SK.rbox(.34,key?.72:.6,.36,.05,1),vary(pale,.07),Math.cos(a)*rad,DY+Math.sin(a)*rad,D/2+(key?.06:.03),0,0,a-Math.PI/2,.05);}
    for(const s of [-1,1]){const lx=s*(DW-.06),z0=D/2-.9,lw=DW-.05;
      for(let k=0;k<5;k++)add(new THREE.BoxGeometry(.07,DY-.1,lw/5-.015),vary(wood,.12),lx,(DY-.1)/2+.05,z0+(k+.5)*lw/5,0,0,0,.06);
      for(const y of [.5,DY-.6])add(new THREE.BoxGeometry(.03,.1,lw-.08),iron,lx-s*.05,y,z0+lw/2,0,0,0,.03);
      add(SK.torus(.09,.018,4,8),iron,lx-s*.06,1.25,z0+lw-.2,0,Math.PI/2,0,.02);}
    add(SK.rbox(2*DW+.3,.12,.9,.04,1),vary(pale,.05),0,.02,D/2-.4,0,0,0,.03);
    add(SK.rbox(3.6,.3,1.6,.06,1),vary(pale,.06),0,.15,D/2+1.0,0,0,0,.04);add(SK.rbox(4.4,.3,1.2,.06,1),vary(pale,.06),0,-.05,D/2+2.2,0,0,0,.04);
    // windows: a dark recess, dressed jambs, a round head and a sill on the string course; the lit panes stay the old planes
    for(const s of [-1,1]){const x=s*WINX;add(new THREE.BoxGeometry(.8,1.0,.1),0x14100c,x,WY,D/2-.06,0,0,0,0);
      for(const q of [-1,1])add(SK.rbox(.2,1.1,.24,.04,1),vary(pale,.06),x+q*.5,WY-.02,D/2+.04,0,0,0,.04);
      add(SK.torus(.5,.1,4,10,Math.PI),vary(pale,.05),x,WY+.52,D/2+.04,0,0,0,.04);add(new THREE.BoxGeometry(.8,.4,.06),0x14100c,x,WY+.55,D/2-.04,0,0,0,0);
      add(SK.rbox(1.24,.14,.4,.04,1),vary(pale,.05),x,WY-.6,D/2+.12,0,0,0,.03);}
    // torch brackets under the old flames, and the banner on a pole with its finials, cut to a point
    for(const s of [-1,1]){const x=s*2.2;add(SK.cyl(.03,.03,.55,5),iron,x,2.58,D/2+.26,Math.PI/2,0,0,.02);add(SK.lathe([[.001,0],[.06,0],[.1,.14],[.001,.14]],8),iron,x,2.6,D/2+.5,0,0,0,.02);add(SK.cyl(.02,.02,.3,4),iron,x,2.45,D/2+.36,-.8,0,0,.02);}
    add(SK.cyl(.04,.04,1.6,6),iron,0,7.02,D/2+.14,0,0,Math.PI/2,.02);for(const s of [-1,1]){add(SK.ball(.06,6,4),0xa89048,s*.82,7.02,D/2+.14);add(SK.cyl(.025,.025,.2,4),iron,s*.55,7.02,D/2+.06,Math.PI/2,0,0,.02);}
    {const b=new THREE.Shape();b.moveTo(-.6,0);b.lineTo(.6,0);b.lineTo(.6,-1.7);b.lineTo(0,-2.05);b.lineTo(-.6,-1.7);b.lineTo(-.6,0);const g=new THREE.ExtrudeGeometry(b,{depth:.03,bevelEnabled:false});add(g,banner,0,6.98,D/2+.1,0,0,0,.04);
      add(new THREE.BoxGeometry(1.2,.12,.045),new THREE.Color(banner).multiplyScalar(.6).getHex(),0,6.9,D/2+.13,0,0,0,.02);}
    return mergeParts(P);}
  const FORT_KEEP={}; // S256 — a fort keep's pieces, left by buildFortKeep (the doors step) for its compound (the next step)
  function buildFortKeep(p){
    // a stone keep whose door is the portal: a recessed arched doorway in the south face, buttresses, arrow slits,
    // a crenellated parapet, corner turrets, a banner — and solid all the way through (no corridor inside the face)
    const r=(function(){let q=(p.seed||7)%2147483647;return()=>{q=(q*48271)%2147483647;return q/2147483647;};})();
    // v80 S132 — a keep at the player's scale, with a door you can see from the gate
    const W_=11,D_=9,H_=7.2;const cx=p.x,cz=p.z-D_/2;const y=worldH(cx,cz);const c=x=>new THREE.Color(x);const parts=[];
    const wallC=c(0x5a4a40),wall2=c(0xc8b8a0),dark=c(0x2a2622); // v80 S132 — the keep in warm dark stone with pale quoins; the ring stays grey, so the two never read as one wall
    parts.push({geo:new THREE.BoxGeometry(W_,H_,D_),color:wallC,y:H_/2,jitter:.02});
    // buttresses on the long sides, a string course, arrow slits, the parapet
    for(let k=-1;k<=1;k+=2){for(let q=-1;q<=1;q+=2)parts.push({geo:new THREE.BoxGeometry(.9,H_*.8,.9),color:wall2,x:k*(W_/2+.3),z:q*(D_*.28),y:H_*.4});}
    parts.push({geo:new THREE.BoxGeometry(W_+.4,.3,D_+.4),color:wall2,y:H_*.55});
    for(let k=0;k<3;k++){parts.push({geo:new THREE.BoxGeometry(.25,1.1,.2),color:dark,x:-3.5+k*3.5,z:D_/2+.02,y:H_*.72});parts.push({geo:new THREE.BoxGeometry(.2,1.1,.25),color:dark,x:W_/2+.02,z:-3+k*3,y:H_*.72});parts.push({geo:new THREE.BoxGeometry(.2,1.1,.25),color:dark,x:-W_/2-.02,z:-3+k*3,y:H_*.72});}
    for(let k=0;k<Math.floor(W_/1.4);k++){parts.push({geo:new THREE.BoxGeometry(.8,.8,.5),color:wall2,x:-W_/2+.7+k*1.4,z:D_/2-.25,y:H_+.4});parts.push({geo:new THREE.BoxGeometry(.8,.8,.5),color:wall2,x:-W_/2+.7+k*1.4,z:-D_/2+.25,y:H_+.4});}
    for(let k=0;k<Math.floor(D_/1.4);k++){parts.push({geo:new THREE.BoxGeometry(.5,.8,.8),color:wall2,x:W_/2-.25,z:-D_/2+.7+k*1.4,y:H_+.4});parts.push({geo:new THREE.BoxGeometry(.5,.8,.8),color:wall2,x:-W_/2+.25,z:-D_/2+.7+k*1.4,y:H_+.4});}
    // corner turrets with caps
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{parts.push({geo:new THREE.CylinderGeometry(1.2,1.4,H_+2.4,8),color:wall2,x:sx*(W_/2-.2),z:sz*(D_/2-.2),y:(H_+2.4)/2,jitter:.03});parts.push({geo:new THREE.ConeGeometry(1.5,1.6,8),color:dark,x:sx*(W_/2-.2),z:sz*(D_/2-.2),y:H_+2.4+.8});});
    // the doorway: a recess in the south face with an arch, and the dark of the door itself
    parts.push({geo:new THREE.BoxGeometry(2.6,3.4,.9),color:c(0x100c0a),z:D_/2-.3,y:1.7});
    parts.push({geo:new THREE.BoxGeometry(3.6,.3,1.6),color:wall2,z:D_/2+1.0,y:.15});parts.push({geo:new THREE.BoxGeometry(4.4,.3,1.2),color:wall2,z:D_/2+2.2,y:-.05}); // steps
    for(let k=-1;k<=1;k+=2)parts.push({geo:new THREE.BoxGeometry(.8,1.0,.15),color:c(0x2a2010),x:k*3.4,z:D_/2+.05,y:H_*.62}); // windows
    parts.push({geo:new THREE.TorusGeometry(1.5,.28,6,10,Math.PI),color:wall2,z:D_/2+.15,y:3.3,rx:0});
    parts.push({geo:new THREE.BoxGeometry(.35,3.4,.7),color:wall2,x:-1.55,z:D_/2+.15,y:1.7});parts.push({geo:new THREE.BoxGeometry(.35,3.4,.7),color:wall2,x:1.55,z:D_/2+.15,y:1.7});
    // a banner over the door, and torches either side
    parts.push({geo:new THREE.BoxGeometry(1.2,2.0,.06),color:c(nationOf(...cellOf(cx,cz)).banner),z:D_/2+.1,y:6.0});
    // S256 — the keep's meshes go into the compound's group (buildFortCompound), in detail near and these boxes far
    FORT_KEEP[p.seed]={lo:parts,x:cx,z:cz,y:y-.06,banner:nationOf(...cellOf(cx,cz)).banner};
    // the doorway glows warm and the windows are lit, so the door reads from the gate at night
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(2.2,3.0),new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:.55}));glow.position.set(cx,y+1.5,cz+D_/2+.02);sc.add(glow);
    for(let k=-1;k<=1;k+=2){const w=new THREE.Mesh(new THREE.PlaneGeometry(.6,.8),new THREE.MeshBasicMaterial({color:0xffc870}));w.position.set(cx+k*3.4,y+H_*.62,cz+D_/2+.14);sc.add(w);const fl=new THREE.Mesh(new THREE.ConeGeometry(.12,.35,6),new THREE.MeshBasicMaterial({color:0xffa030}));fl.position.set(cx+k*2.2,y+2.9,cz+D_/2+.5);sc.add(fl);}
    for(let k=-1;k<=1;k+=2){const l=regLight(0xffb060,1.4,9,'keep:'+p.seed);l.position.set(cx+k*2.2,y+2.8,cz+D_/2+.7);}
    // solids: the whole keep is a mass — the door is the portal, not a way in
    STATIC_SOL.push({cx,cz,rx:W_/2+.5,rz:D_/2+.5});
    addStamp({id:'keep_'+p.seed,kind:'site',x:cx,z:cz,r:Math.max(W_,D_)*.9,blend:6,y});
  }
  function buildFortCompound(e,p,cellK){
    const cx=p.x,cz=p.z+4,R=27;const st=STYLE.garrison;const c=x=>new THREE.Color(x);const wallC=c(st.wall),capC=c(st.wall2);
    const r=(function(){let q=e.seed%2147483647;return()=>{q=(q*48271)%2147483647;return q/2147483647;};})();
    const group=new THREE.Group();const sol=[];const y0=worldH(cx,cz);
    const gateAng=Math.PI/2; // the door faces +z; the spur leaves south
    const segs=Math.round(2*Math.PI*R/3.2);
    for(let i=0;i<segs;i++){
      const a0=i/segs*Math.PI*2,a1=(i+1)/segs*Math.PI*2,am=(a0+a1)/2;
      let d=am-gateAng;d=Math.atan2(Math.sin(d),Math.cos(d));
      if(Math.abs(d)<.16)continue; // the gate gap
      const mx=cx+Math.cos(am)*R,mz=cz+Math.sin(am)*R;const len=2*R*Math.sin(Math.PI/segs)+.3;const wry=-am-Math.PI/2;
      // S251 — each segment coursed stone near (the town walls' builder, no buttresses on so short a run), its old box and
      // three caps (v80 S132: 3.4 tall, a wall, not a cliff) the distant copy
      {const lp=[{geo:new THREE.BoxGeometry(len,3.4,1.0),color:wallC,y:1.7,jitter:.06}];for(let k=-1;k<=1;k++)lp.push({geo:new THREE.BoxGeometry(.8,.55,1.1),color:capC,x:k*len*.3,y:3.65,jitter:.05});
        const tx_=-Math.sin(am)*len/2,tz_=Math.cos(am)*len/2;const hiG=wallSegHi('stone',len,3.4,1.0,wallC,capC,worldH(mx-tx_,mz-tz_)-y0,worldH(mx+tx_,mz+tz_)-y0,pRng(pHash('fort|'+e.seed+'|'+i)),true);
        for(const [geo,lod] of [[hiG,'hi'],[mergeParts(lp),'lo']]){const m=new THREE.Mesh(geo,VC_MAT);m.position.set(mx,y0,mz);m.rotation.y=wry;m.castShadow=true;m.receiveShadow=true;m.userData.lod=lod;group.add(m);}}
      sol.push({cx:mx,cz:mz,rx:len/2,rz:.8,c:Math.cos(wry),s:Math.sin(wry),bt:'wall'});
    }
    // corner towers and gate towers
    const towers=[Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4,gateAng-.24,gateAng+.24];
    towers.forEach((a,i)=>{const tx=cx+Math.cos(a)*R,tz=cz+Math.sin(a)*R;const gate=i>=4;const h=gate?5.6:4.8;sol.push({cx:tx,cz:tz,rx:2.0,rz:2.0});
      // S251 — a coursed round tower near, the old tower its distant copy, both where the tower stands
      for(const [geo,lod] of [[gateTowerHi('stone',h-2.4,capC,c(st.roof),pRng(pHash('fortT|'+e.seed+'|'+i))),'hi'],[mergeParts([{geo:new THREE.CylinderGeometry(1.4,1.6,h,8),color:capC,y:h/2,jitter:.05},{geo:new THREE.ConeGeometry(1.7,1.4,8),color:c(st.roof),y:h+.8,jitter:.05}]),'lo']]){const m=new THREE.Mesh(geo,VC_MAT);m.position.set(tx,y0,tz);m.castShadow=true;m.receiveShadow=true;m.userData.lod=lod;group.add(m);}
      if(gate){ /* S251 — the banner hangs clear of the wider tower */ const pole=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,1.0),new THREE.MeshLambertMaterial({color:0x2a2622}));pole.position.set(tx,y0+h+.4,tz+2.05);group.add(pole);const cloth=new THREE.Mesh(new THREE.PlaneGeometry(.9,2.6),new THREE.MeshLambertMaterial({color:nationOf(...cellOf(cx,cz)).banner,side:THREE.DoubleSide}));cloth.position.set(tx,y0+h-.9,tz+2.3);group.add(cloth);}});
    // S256 — the keep, in detail near and its old boxes far, both where the keep stands so they share a bake cluster
    {const K=FORT_KEEP[e.seed];if(K){delete FORT_KEEP[e.seed];for(const [geo,lod] of [[fortKeepGeoHi(11,9,7.2,K.banner,pRng(pHash('fortK|'+e.seed))),'hi'],[mergeParts(K.lo),'lo']]){const m=new THREE.Mesh(geo,VC_MAT);m.position.set(K.x,K.y,K.z);m.castShadow=true;m.receiveShadow=true;m.userData.lod=lod;m.userData.keep=true;group.add(m);}}}
    // barracks either side of the yard, doors toward the keep
    const S={site:{id:'fort_'+e.seed,x:cx,z:cz,pad:R+2,kind:'fort'},group,sol,houses:[],npcs:[],reg:'anglo',residents:[],lamps:[],_gates:[],reach:R+6,chimneys:[]};
    [[-1,0],[1,0]].forEach(([sx])=>{const bx=cx+sx*15,bz=cz+9;const geo=buildingGeo(7,5,STYLE.garrison,r,{chimney:true,twoStory:false,h:2.8,rise:1.2});const m=new THREE.Mesh(geo,VC_MAT);m.position.set(bx,worldH(bx,bz)-.06,bz);m.rotation.y=sx>0?Math.PI/2:-Math.PI/2;{const ch=chimneyAt(geo,m,'barracks');if(ch)S.chimneys.push(ch);} /* S345 — the barracks' smoke */m.castShadow=true;m.receiveShadow=true;group.add(m);if(geo.userData.lo){m.userData.lod='hi';const l=new THREE.Mesh(geo.userData.lo,VC_MAT);l.position.copy(m.position);l.rotation.y=m.rotation.y;l.castShadow=true;l.userData.lod='lo';group.add(l);} /* S202 — its distant copy, baked into the POI's clusters */sol.push({cx:bx,cz:bz,rx:2.7,rz:3.7,c:Math.cos(m.rotation.y),s:Math.sin(m.rotation.y),bt:'barracks'});});
    // v80 S132 — a paved way from the gate to the keep's steps, so the courtyard reads as a courtyard
    {const z0=cz+R-1,z1=cz-8.5+4.5+2.4;const segs2=Math.max(4,Math.round(Math.abs(z0-z1)/3));for(let i=0;i<segs2;i++){const zz=z0+(z1-z0)*(i+.5)/segs2;const m=new THREE.Mesh(new THREE.BoxGeometry(2.6,.12,Math.abs(z1-z0)/segs2+.1),new THREE.MeshLambertMaterial({color:0x8a8078}));m.position.set(cx,worldH(cx,zz)+.05,zz);group.add(m);}}
    // torches on the gate towers
    towers.slice(4).forEach(a=>{const tx=cx+Math.cos(a)*R*.86,tz=cz+Math.sin(a)*R*.86;const glass=new THREE.Group();const fl=new THREE.Mesh(new THREE.ConeGeometry(.12,.35,6),new THREE.MeshBasicMaterial({color:0xffa030}));glass.add(fl);glass.position.set(tx,y0+5.4,tz);group.add(glass);const l=regLight(0xffb050,0,14,S.site.id);l.position.copy(glass.position);S.lamps.push({glass,light:l});});
    bakeSettlement(S);if(S.chimneys.length)try{smokeFor(S);}catch(err){console.warn('smoke',err);}sc.add(group);SETTLE.set(S.site.id,S);if(IMPOSTORS['door_'+e.seed])IMPOSTORS['door_'+e.seed].visible=false; // v80 S132 — the fort's stand-in (a 48u grey cylinder) was never hidden: it was the "ring inside the fort"
    S.impostorId='door_'+e.seed;return S;
  }
  // Heavy statics (door rocks, fort exteriors, signposts, camps) only for a
  // cell the player is in or within NEAR_STATIC of — ~9 cells of them is
  // thousands of draw calls.
  const NEAR_STATIC=420,FAR_STATIC=900;
  function cellRectDist(c){const dx=Math.max(c.ox-px,0,px-(c.ox+SIZE)),dz=Math.max(c.oz-pz,0,pz-(c.oz+SIZE));return Math.hypot(dx,dz);}
  function staticSteps(L){
    const c=L.cell,k=cellKey(c.i,c.j);let solStart=0;L.statics2=[];
    const track=fn=>{const before=sc.children.length;fn();for(let n=before;n<sc.children.length;n++)L.statics2.push(sc.children[n]);};
    return [
      ()=>{solStart=STATIC_SOL.length;track(()=>{const pts=c.doors.filter(e=>dungeonWorldPos[e.seed]).map(e=>{const p=makePortalDef(e);const w=dungeonWorldPos[e.seed];p.x=w.x;p.z=w.z;p.zone='world';p.cell=k;p.sigil=!!(e.sigil||e.kind==='fort_door');p.theme=p.theme||e.theme;if(e.lair)p.lair=e.lair;return p;});
        // caves get the engine's door rocks; forts get our keep (the exterior kit had stray shells and walk-through walls)
        spawnPortalMeshes(sc,pts.filter(p=>p.kind!=='fort_door'),STATIC_SOL,worldH);pts.filter(p=>p.kind==='fort_door').forEach(p=>buildFortKeep(p));pts.forEach(p=>{portals.push(p);L.portals.push(p);});});},
      ()=>{L.forts=[];c.doors.filter(e=>e.kind==='fort_door'&&dungeonWorldPos[e.seed]).forEach(e=>{const S=buildFortCompound(e,dungeonWorldPos[e.seed],k);L.forts.push(S);});},
      ()=>track(()=>buildSiteMarkersFor(c)),
      ()=>track(()=>buildCampsFor(c,k)),
      ()=>{for(let n=solStart;n<STATIC_SOL.length;n++)STATIC_SOL[n].cell=k;L.staticsBuilt=true;L.staticsPending=false;
        // bake: every plain top-level static mesh in this cell into cluster meshes
        const flat=[];(L.statics2||[]).forEach(o=>{if(o.isMesh&&!o.userData.noBake)flat.push(o);else if(o.isGroup)o.children.filter(c=>c.isMesh).forEach(c=>{c.userData.parentGroup=o;});});
        const baked=bakeMeshes(flat,sc,new Set());L.statics2=(L.statics2||[]).filter(o=>o.parent).concat(baked);},
    ];
  }
  function dropStatics(L){
    const k=cellKey(L.cell.i,L.cell.j);
    (L.statics2||[]).forEach(o=>sc.remove(o));L.statics2=[];
    (L.forts||[]).forEach(S=>{sc.remove(S.group);SETTLE.delete(S.site.id);unregLights(S.site.id);if(S.impostorId&&IMPOSTORS[S.impostorId])IMPOSTORS[S.impostorId].visible=true;});L.forts=[];unregLights('cell:'+k);
    L.portals.forEach(p=>{const i=portals.indexOf(p);if(i>=0)portals.splice(i,1);});L.portals=[];
    for(let i=STATIC_SOL.length-1;i>=0;i--)if(STATIC_SOL[i].cell===k&&STATIC_SOL[i].rx!==undefined)STATIC_SOL.splice(i,1);
    for(let i=beds.length-1;i>=0;i--)if(beds[i].cell===k)beds.splice(i,1);
    for(let i=STAMPS.length-1;i>=0;i--)if(STAMPS[i].cell===k&&String(STAMPS[i].id).startsWith('camp_')){sgRemove(STAMPS[i]);STAMPS.splice(i,1);}
    L.staticsBuilt=false;
  }
  function loadCell(i,j){const st=loadCellSteps(i,j);if(st){st.forEach(f=>f());const L=LOADED.get(cellKey(i,j));if(L&&!L.staticsBuilt){L.staticsPending=true;staticSteps(L).forEach(f=>f());}}}
  function unloadCell(k){
    const L=LOADED.get(k);if(!L)return;const c=L.cell;
    // settlements in this cell go first
    c.sites.forEach(t=>{if(SETTLE.has(t.id))disposeSettlement(t.id);});
    if(L.staticsBuilt||L.staticsPending)dropStatics(L);
    L.statics.forEach(o=>{sc.remove(o);});
    c.regions.forEach(r_=>{const i=REGIONS.indexOf(r_);if(i>=0)REGIONS.splice(i,1);});
    c.peaks.forEach(p=>{const i=PEAKS.indexOf(p);if(i>=0)PEAKS.splice(i,1);});c.lakes.forEach(l=>{const i=LAKES.indexOf(l);if(i>=0)LAKES.splice(i,1);});c.rivers.forEach(rv=>{const i=RIVERS.indexOf(rv);if(i>=0)RIVERS.splice(i,1);});(c.inlets||[]).forEach(inl=>{const i=INLETS.indexOf(inl);if(i>=0)INLETS.splice(i,1);});
    c.sites.forEach(t=>{const i=SITES.indexOf(t);if(i>=0)SITES.splice(i,1);delete SITE[t.id];});
    L.stamps.forEach(s=>{const i=STAMPS.indexOf(s);if(i>=0)STAMPS.splice(i,1);sgRemove(s);});
    L.portals.forEach(p=>{const i=portals.indexOf(p);if(i>=0)portals.splice(i,1);});
    L.doorSeeds.forEach(sd=>{delete dungeonWorldPos[sd];const i=DOORS.findIndex(e=>e.seed===sd);if(i>=0)DOORS.splice(i,1);});
    for(let i=STATIC_SOL.length-1;i>=0;i--)if(STATIC_SOL[i].cell===k)STATIC_SOL.splice(i,1);
    for(let i=beds.length-1;i>=0;i--)if(beds[i].cell===k)beds.splice(i,1);
    for(let i=impostorList.length-1;i>=0;i--)if(impostorList[i].cell===k){delete IMPOSTORS[impostorList[i].id];impostorList.splice(i,1);}
    // roads: drop this cell's segments and rebuild the grid
    L.roads.forEach(rd=>{const i=ROADS.indexOf(rd);if(i>=0)ROADS.splice(i,1);});
    rebuildRoadGrid();
    LOADED.delete(k);
  }
  let _cellT=0;
  function tickCells(dt,force){
    _cellT+=dt;if(!force&&_cellT<.75)return;_cellT=0;
    const [pi,pj]=cellOf(px,pz);
    // unload far cells
    for(const k of Array.from(LOADED.keys())){const L=LOADED.get(k);if(Math.abs(L.cell.i-pi)>1||Math.abs(L.cell.j-pj)>1)unloadCell(k);}
    // load the 3×3, nearest first, through the job queue
    const want=[];for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=pi+di,j=pj+dj;if(i<0||j<0||i>=GRID||j>=GRID)continue;if(!LOADED.has(cellKey(i,j)))want.push([i,j,di*di+dj*dj]);}
    want.sort((a,b)=>a[2]-b[2]);
    if(force)want.forEach(([i,j])=>loadCell(i,j));
    else want.forEach(([i,j])=>{if(!JOBS.some(x=>x.cellKey===cellKey(i,j))){let steps=null;const job={fn:()=>{if(!steps){steps=loadCellSteps(i,j);if(!steps)return false;}const f=steps.shift();if(f)f();return steps.length>0;},prio:5,cellKey:cellKey(i,j)};JOBS.push(job);}});
    // statics near the player, dropped when far
    for(const L of LOADED.values()){if(L.pending)continue;const d=cellRectDist(L.cell);
      if(d<NEAR_STATIC&&!L.staticsBuilt&&!L.staticsPending){L.staticsPending=true;if(force){staticSteps(L).forEach(f=>f());}else{let st=null;JOBS.push({fn:()=>{if(!st)st=staticSteps(L);const f=st.shift();if(f)f();return st.length>0;},prio:6});}}
      else if(d>FAR_STATIC&&L.staticsBuilt)dropStatics(L);}
  }

  // ═══ SITES ═══════════════════════════════════════════════════════════
  // Settlement / POI table. Positions follow MAP_LAYOUT's col/row grid so
  // the world matches the lore map. `r` is the flattened pad radius (the
  // Session 3 settlement generator builds inside it). Nothing is built on
  // a site yet except a cairn + signpost (and the trader tent at Ashenmoor).
  const GX=c=>250+c*270, GZ=r=>330+r*295;
  const HOME_SITES=[
    {id:'mur_pierre',    name:'Mur Pierre',      kind:'garrison', x:800,z:700, pad:70},
    {id:'colmans_rest',  name:"Colmán's Rest",   kind:'village',  x:1000,z:1250, pad:45},
    {id:'la_grise',      name:'La Grise',        kind:'village',  x:1350,z:1050, pad:45},
    {id:'la_porte_grise',name:'La Porte Grise',  kind:'outpost',  x:450,z:350, pad:26},
    {id:'vieux_marche',  name:'Vieux Marché',    kind:'town',     x:1500,z:800, pad:95},
    {id:'ironhaven',     name:'Ironhaven',       kind:'town',     x:1900,z:450, pad:100},
    {id:'dunmore',       name:'Dunmore',         kind:'town',     x:1550,z:1400, pad:95},
    {id:'portclare',     name:'Portclare',       kind:'port',     x:1950,z:1250, pad:90},
    {id:'coeur_de_vie',  name:'Coeur de Vie',    kind:'city',     x:1150,z:380, pad:135},
    {id:'thorngate',     name:'The Thorngate',   kind:'outpost',  x:450,z:800, pad:26},
    {id:'salthaven',     name:'Salthaven',       kind:'village',  x:350,z:1050, pad:45},
    {id:'hearthwick',    name:'Hearthwick',      kind:'village',  x:1100,z:1450, pad:45},
    {id:'droichead',     name:'Droichead',       kind:'village',  x:1250,z:1200, pad:45},
    {id:'cill_beag',     name:'Cill Beag',       kind:'village',  x:1350,z:1650, pad:40},
    {id:'carraig_mor',   name:'Carraig Mór',     kind:'town',     x:450,z:1800, pad:90},
    {id:'ashenmoor',     name:'Ashenmoor',       kind:'village',  x:800,z:1750, pad:58},
    {id:'hermit_camp',   name:"Hermit's Camp",   kind:'camp',     x:1750,z:1000, pad:16},
    {id:'caer_uaigneach',name:'Caer Uaigneach',  kind:'ruin',     x:2100,z:900, pad:45},
    {id:'inis_rua',      name:'Inis Rua',        kind:'poi',      x:150,z:2050, pad:0},
    {id:'ashfeld',       name:'The Ashfeld',     kind:'poi',      x:600,z:2000, pad:35},
    {id:'redwater_ford', name:'Redwater Ford',   kind:'village',  x:950,z:2050, pad:45},
  ];
  HOME_SITES.forEach(t=>{if(t.x==null){t.x=GX(t.c);t.z=GZ(t.r);}}); // v80 S134 — the province laid out by hand (x,z), the grid kept for anything still on it
  const SITES=[],SITE={}; // live: sites of loaded cells
  let ASH_X=0,ASH_Z=0; // set when the home cell loads
  const ASH_LOCAL=60; // old overworld zone content centre (local coords)

  // Roads: settlement pairs. `via` names the lore corridor (for signposts
  // later); `fort` places that fort a little off the road's midpoint.
  const HOME_ROAD_DEFS=[
    {a:'ashenmoor',b:'hearthwick',   via:'An Bealach Mór'},
    {a:'ashenmoor',b:'ashfeld',      via:'South Road'},
    {a:'ashfeld',b:'redwater_ford',  via:'South Road'},
    {a:'ashenmoor',b:'salthaven',    via:'West Track'},
    {a:'salthaven',b:'carraig_mor',  via:'Coastal Road'},
    {a:'hearthwick',b:'thorngate',   via:'An Bealach Mór'},
    {a:'thorngate',b:'la_porte_grise',via:'The Deepwood Road', fort:7106, fortAt:.55, fortOff:90},
    {a:'la_porte_grise',b:'vieux_marche',via:'La Route Royale'},
    {a:'vieux_marche',b:'ironhaven', via:'La Route Royale', fort:7104},
    {a:'vieux_marche',b:'dunmore',   via:'La Route Royale'},
    {a:'dunmore',b:'portclare',      via:'Coastal Road', fort:7103},
    {a:'ironhaven',b:'portclare',    via:'Garrison Road'},
    {a:'portclare',b:'coeur_de_vie', via:'Capital Road'},
    {a:'hearthwick',b:'droichead',   via:'An Bealach Mór', fort:7100},
    {a:'thorngate',b:'droichead',    via:'The North Approach', fort:7099},
    {a:'droichead',b:'cill_beag',    via:'Cill Beag Path'},
    {a:'vieux_marche',b:'la_grise',  via:'Northern Road', fort:7105},
    {a:'la_grise',b:'colmans_rest',  via:'Foothill Track'},
    {a:'colmans_rest',b:'mur_pierre',via:'Mountain Pass', fort:7102, fortAt:.5},
    {a:'cill_beag',b:'hermit_camp',  via:'The Wastes'},
    {a:'hermit_camp',b:'caer_uaigneach',via:'The Wastes', fort:7101},
  ];
  const ROAD_DEFS=[]; // live

  // ═══ ROADS ═══════════════════════════════════════════════════════════
  // Each road is a Catmull-Rom spline through its two sites and three
  // interior points pushed sideways by hashed noise, sampled every 6u.
  // Sample heights are baseH smoothed along the spline so the road bed
  // rolls with the land instead of stair-stepping. Segments are indexed in
  // a 32u grid so roadInfo() is one lookup.
  const ROADS=[];            // {def, pts:[{x,z,y}]}
  const RSEG=[];             // {ax,az,bx,bz,ay,by,len2,road}
  const RGRID=new Map();     // cellId -> [segIdx]
  const RCELL=32;
  const RREACH=ROAD_BLEND+2;
  function rcell(x,z){return (Math.floor(x/RCELL)+1)*4096+(Math.floor(z/RCELL)+1);} // x up to 28,800 → cx ≤ 900, fits
  function catmull(p0,p1,p2,p3,t){
    const t2=t*t,t3=t2*t;
    return {x:.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
            z:.5*((2*p1.z)+(-p0.z+p2.z)*t+(2*p0.z-5*p1.z+4*p2.z-p3.z)*t2+(-p0.z+3*p1.z-3*p2.z+p3.z)*t3)};
  }
  function buildRoads(){/* superseded by buildRoad(def) per cell */}
  function buildRoad(def){
      const A=SITE[def.a],B=SITE[def.b];if(!A||!B)return null;
      ROAD_DEFS.push(def);
      const ri=ROAD_DEFS.length;
      const dx=B.x-A.x,dz=B.z-A.z,L=Math.hypot(dx,dz);
      const nx=-dz/L,nz=dx/L; // left normal
      const ctrl=[{x:A.x,z:A.z}];
      for(let k=1;k<=3;k++){
        const t=k/4;
        const off=(_smoothNoise(ri*37+k*11,ri*5,SEED+40,1)-.5)*2*L*.11;
        ctrl.push({x:A.x+dx*t+nx*off,z:A.z+dz*t+nz*off});
      }
      ctrl.push({x:B.x,z:B.z});
      // sample
      const pts=[];
      const n=ctrl.length;
      for(let i=0;i<n-1;i++){
        const p0=ctrl[Math.max(0,i-1)],p1=ctrl[i],p2=ctrl[i+1],p3=ctrl[Math.min(n-1,i+2)];
        const segL=Math.hypot(p2.x-p1.x,p2.z-p1.z);
        const steps=Math.max(2,Math.round(segL/6));
        for(let sI=0;sI<steps;sI++){pts.push(catmull(p0,p1,p2,p3,sI/steps));}
      }
      pts.push({x:B.x,z:B.z});
      return registerRoad(def,pts);
  }
  function rebuildRoadGrid(){
    RSEG.length=0;RGRID.clear();ROAD_DEFS.length=0;
    ROADS.forEach(road=>{ROAD_DEFS.push(road.def);indexRoad(road);});
  }
  function indexRoad(road){
    const pts=road.pts;
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1];
      const seg={ax:a.x,az:a.z,bx:b.x,bz:b.z,ay:a.y,by:b.y,len2:(b.x-a.x)**2+(b.z-a.z)**2,road};
      const idx=RSEG.push(seg)-1;
      const x0=Math.min(a.x,b.x)-RREACH,x1=Math.max(a.x,b.x)+RREACH,z0=Math.min(a.z,b.z)-RREACH,z1=Math.max(a.z,b.z)+RREACH;
      for(let cz=Math.floor(z0/RCELL);cz<=Math.floor(z1/RCELL);cz++)for(let cx=Math.floor(x0/RCELL);cx<=Math.floor(x1/RCELL);cx++){
        const id=(cx+1)*4096+(cz+1);let arr=RGRID.get(id);if(!arr){arr=[];RGRID.set(id,arr);}arr.push(idx);}
    }
  }
  function registerRoad(def,pts){
    {
      // heights: baseH smoothed over ±5 samples (~30u each way)
      const raw=pts.map(p=>baseH(p.x,p.z));
      for(let i=0;i<pts.length;i++){
        let acc=0,w=0;
        for(let k=-5;k<=5;k++){const j=i+k;if(j<0||j>=raw.length)continue;const wt=6-Math.abs(k);acc+=raw[j]*wt;w+=wt;}
        pts[i].y=Math.max(SEA_Y+.6,acc/w);
        // inside a site pad the bed is the pad — no smoothed-in dip from outside
        const st=stampAt(pts[i].x,pts[i].z);
        if(st&&st.kind==='site'){const d=Math.hypot(pts[i].x-st.x,pts[i].z-st.z);const t=1-sstep(st.r-14,st.r,d);pts[i].y=pts[i].y*(1-t)+st.y*t;}
      }
      const road={def,pts};
      ROADS.push(road);indexRoad(road);
      return road;
    }
  }
  // Spur paths from each fort's gate to the nearest point on its road.
  // v80 S134 — a stone bridge where a road crosses a river: a deck above the ford, parapets, piers; a named place on the map
  // S248 — a stone bridge in one vertex-coloured mesh, along local z, the deck's top at .22 where the old deck's was .25
  // and its width, rails and piers where they were (the collision is unchanged). The side's profile is extruded across
  // the bridge with the arches cut out of it, so the piers, spandrels and barrel vaults are one solid; a ring of arch
  // stones stands proud on each face, the piers get pointed cutwaters up- and downstream, a string course runs under
  // the rails, the deck is paved in setts, and the rails are two courses of blocks on a mortar core with a coping and
  // a post at each end. drop: from the deck down to the river bed.
  function bridgeGeo(len,drop,seed){const r=pRng(seed>>>0),P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+r()*a*2).getHex();
    const W=2.6,top=.22,crown=-.6,yb=-drop+.15,piers=Math.max(1,Math.round(len/9)),pz=[];for(let q=0;q<piers;q++)pz.push(-len/2+len*(q+.5)/piers);
    const spans=[];const edges=[-len/2+2,...pz.flatMap(z=>[z-1.1,z+1.1]),len/2-2];for(let q=0;q<edges.length;q+=2){const z0=edges[q],z1=edges[q+1],sp=z1-z0;if(sp<2)continue;
      const ys=Math.max(yb+.4,crown-sp/2),h=Math.max(.3,Math.min(sp/2,crown-ys)),R=(sp*sp/4+h*h)/(2*h);spans.push({z0,z1,ys,h,R,zc:(z0+z1)/2,yc:ys+h-R,al:Math.asin(Math.min(1,sp/2/R))});}
    const sh=new THREE.Shape();sh.moveTo(-len/2,-drop);sh.lineTo(len/2,-drop);sh.lineTo(len/2,top);sh.lineTo(-len/2,top);sh.lineTo(-len/2,-drop);
    for(const a of spans){const h=new THREE.Path();h.moveTo(a.z0,yb);h.lineTo(a.z1,yb);h.lineTo(a.z1,a.ys);const N=14;for(let i=1;i<N;i++){const t=Math.PI/2-a.al+2*a.al*i/N;h.lineTo(a.zc+a.R*Math.cos(t),a.yc+a.R*Math.sin(t));}h.lineTo(a.z0,a.ys);h.lineTo(a.z0,yb);sh.holes.push(h);}
    const body=new THREE.ExtrudeGeometry(sh,{depth:W*2,bevelEnabled:false,curveSegments:4});body.translate(0,0,-W);add(body,0x8a8078,0,0,0,0,Math.PI/2,0,.02);
    // the arch stones: a ring on each face, the keystone a little larger (local z is minus the profile's u)
    for(const a of spans){const N=Math.max(7,Math.round(a.R*2*a.al/.55));for(let i=0;i<N;i++){const t=Math.PI/2+a.al-2*a.al*(i+.5)/N,rr=a.R+.22,key=i===(N>>1);
      const L=a.R*2*a.al/N-.05;for(const sx of [-1,1])add(new THREE.BoxGeometry(.14,key?.56:.44,L),vary(0x9a9084,.08),sx*(W+.05),a.yc+rr*Math.sin(t)+(key?.04:0),-(a.zc+rr*Math.cos(t)),t-Math.PI/2,0,0,.04);}}
    // cutwaters, pointed up- and downstream, to the arches' springing, capped with a stone pyramid
    const yCut=Math.min(...spans.map(a=>a.ys),crown-.4),ch=yCut+drop;
    if(ch>.3)for(const z of pz)for(const sx of [-1,1]){const rr=1.27;add(new THREE.CylinderGeometry(rr,rr,ch,3),0x6e675e,sx*(W+rr*.5-.02),-drop+ch/2,z,0,sx*Math.PI/2,0,.08);add(SK.cone(rr,.9,3),0x7a7268,sx*(W+rr*.5-.02),yCut+.45,z,0,sx*Math.PI/2,0,.06);}
    // a string course under the rails, the deck paved in rows of slabs laid broken-joint
    for(const sx of [-1,1])add(SK.rbox(.24,.18,len,.05,1),0x7a7268,sx*(W-.02),.04,0,0,0,0,.05);
    for(let z=-len/2+.45;z<len/2-.3;z+=.9){let x=-2.15;while(x<2.1){const w=Math.min(2.15-x,.9+r()*.9);if(w>.2)add(new THREE.BoxGeometry(w-.05,.06,.84),vary(0x736c62,.12),x+w/2,top+.03,z,0,0,0,.05);x+=w;}}
    // the rails: a mortar core, two courses of blocks laid broken-joint, a coping, a post at each end
    for(const sx of [-1,1]){const x=sx*2.45;add(new THREE.BoxGeometry(.26,.78,len-.6),0x4e4940,x,top+.39,0,0,0,0,.03);
      for(let c=0;c<2;c++){let z=-len/2+.6,L=c?.5+r()*.5:1.1+r()*.5;while(z<len/2-.65){L=Math.min(len/2-.6-z,L);add(new THREE.BoxGeometry(.34,.36,L-.05),vary(0x8e8478,.12),x,top+.2+c*.39,z+L/2,0,0,0,.05);z+=L;L=1.1+r()*.5;}}
      for(let z=-len/2+.6;z<len/2-.65;){const L=Math.min(len/2-.6-z,2.4);add(SK.rbox(.44,.14,L-.03,.05,1),vary(0xa0978a,.06),x,top+.86,z+L/2,0,0,0,.04);z+=L;}
      for(const e of [-1,1]){add(SK.rbox(.6,1.3,.6,.08,1),vary(0x8a8078,.06),x,top+.65,e*(len/2-.3),0,0,0,.05);add(SK.cone(.43,.35,4),0x9a9084,x,top+1.47,e*(len/2-.3),0,Math.PI/4,0,.04);}}
    return mergeParts(P);}
  function buildBridges(c,k,L){const rivers=RIVERS.filter(rv=>rv.w);if(!rivers.length)return;const built=new Set();
    for(const rd of L.roads){if(!rd.pts||rd.pts.length<4)continue;
      for(const rv of rivers){let run=[];const runs=[];for(let i=0;i<rd.pts.length;i++){const p=rd.pts[i];if(polyDist(rv.pts,p.x,p.z)<rv.w+1.5)run.push(i);else if(run.length){runs.push(run);run=[];}}if(run.length)runs.push(run);
        for(const rn of runs){if(rn.length<2)continue;if(Math.min(...rn.map(i=>rd.pts[i].y))>(rv.depth||-1.5)+5)continue; /* on a bank, not a crossing */ const i0=rn[0],i1=rn[rn.length-1];const a=rd.pts[Math.max(0,i0-1)],b=rd.pts[Math.min(rd.pts.length-1,i1+1)];const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
          // S248 — a crossing already bridged in this pass is skipped; one bridged when the cell last loaded keeps its site
          // (the cell is cached with it) and is built again: the old test skipped it, so a reloaded cell lost its bridges
          const prev=c.sites.find(t=>t.kind==='bridge'&&Math.hypot(t.x-mx,t.z-mz)<40);if(prev&&built.has(prev))continue;
          const len=Math.hypot(b.x-a.x,b.z-a.z)+6;const ang=Math.atan2(b.x-a.x,b.z-a.z);const y=Math.max(a.y,b.y,SEA_Y+.9)+.25;
          const g=new THREE.Mesh(bridgeGeo(len,y-(rv.depth||-1.5)+.05,Math.round(mx)*31+Math.round(mz)),VC_MAT);g.position.set(mx,y,mz);g.rotation.y=ang;g.castShadow=true;g.receiveShadow=true;g.userData.bridge=true; // S248 — a stone arch bridge on the kit (it was a deck, two rails and piers as boxes)
          sc.add(g);const s_=Math.sin(ang),c_=Math.cos(ang);for(const sx of [-1,1]){STATIC_SOL.push({cx:mx+c_*sx*2.45,cz:mz-s_*sx*2.45,rx:.2,rz:len/2,c:Math.cos(ang),s:Math.sin(ang),cell:k});}
          const name=`${(rv.name||rd.def.via||'the river').replace(/^the /,'')} Bridge`;if(prev){built.add(prev);continue;}const site={id:`bridge_${k}_${c.sites.length}`,name,kind:'bridge',x:mx,z:mz,pad:0,cell:k,bridge:{y,len,ang}};c.sites.push(site);SITES.push(site);SITE[site.id]=site;built.add(site);
        }}}}
  function addFortSpurs(){}
  function addFortSpur(e,cellK){
    {
      const p=dungeonWorldPos[e.seed];if(!p)return;const gx=p.x,gz=p.z+33; // just outside the compound gate
      let best=null,bd=1e9;
      for(const r of ROADS){if(r.def.via==='spur')continue;for(const q of r.pts){const d=Math.hypot(q.x-gx,q.z-gz);if(d<bd){bd=d;best=q;}}}
      if(!best)return;
      const n=Math.max(2,Math.round(bd/6));const pts=[];
      for(let i=0;i<=n;i++){const t=i/n;pts.push({x:gx+(best.x-gx)*t,z:gz+(best.z-gz)*t});}
      const rd=registerRoad({a:'door_'+e.seed,b:'road',via:'spur'},pts);if(rd){rd.cell=cellK;const L=LOADED.get(cellK);if(L)L.roads.push(rd);}
    }
  }
  // Nearest road within RREACH: {d, y, seg} or null.
  function roadInfo(x,z){
    const arr=RGRID.get(rcell(x,z));
    if(!arr)return null;
    let best=null,bd=RREACH;
    for(let i=0;i<arr.length;i++){
      const s=RSEG[arr[i]];
      const vx=s.bx-s.ax,vz=s.bz-s.az;
      let t=s.len2>0?((x-s.ax)*vx+(z-s.az)*vz)/s.len2:0;
      t=t<0?0:t>1?1:t;
      const px_=s.ax+vx*t,pz_=s.az+vz*t;
      const d=Math.hypot(x-px_,z-pz_);
      if(d<bd){bd=d;best={d,y:s.ay+(s.by-s.ay)*t,seg:s,t};}
    }
    return best;
  }
  // Point on a road at parameter u (0..1 along its samples) plus its left normal.
  function roadPoint(road,u){
    const i=Math.min(road.pts.length-2,Math.max(0,Math.floor(u*(road.pts.length-1))));
    const a=road.pts[i],b=road.pts[i+1];
    const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1;
    return {x:(a.x+b.x)/2,z:(a.z+b.z)/2,nx:-dz/L,nz:dx/L,dx:dx/L,dz:dz/L};
  }
  // Road ribbon per chunk: a quad strip along every segment whose midpoint
  // is inside the chunk, laid on the (already flattened) terrain.
  const ROAD_MAT=VC_MAT;
  const _roadTone={};
  function roadTone(x,z){
    const ws=regionWeights(x,z);_tmpC2.setRGB(0,0,0);
    for(const e of ws){if(e.w<=0)continue;let c=_roadTone[e.r.biome];if(!c){c=_roadTone[e.r.biome]=new THREE.Color((BIOME_PROFILES[e.r.biome]||BIOME_PROFILES.plains).pathCol);}_tmpC2.r+=c.r*e.w;_tmpC2.g+=c.g*e.w;_tmpC2.b+=c.b*e.w;}
    return _tmpC2;
  }
  function buildRoadRibbons(cx,cz,group){
    const ox=cx*CHUNK,oz=cz*CHUNK;
    const pos=[],col=[];
    const W=ROAD_HALF*.85;
    function addQuad(a,b){
      const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1,nx=-dz/L*W,nz=dx/L*W;
      const c=roadTone((a.x+b.x)/2,(a.z+b.z)/2);
      const y=(x,z)=>worldH(x,z)+.07;
      const v=[[a.x+nx,a.z+nz],[a.x-nx,a.z-nz],[b.x-nx,b.z-nz],[b.x+nx,b.z+nz]];
      // Winding: counter-clockwise seen from above (+y), whichever way the road runs.
      const cross=(v[1][0]-v[0][0])*(v[2][1]-v[0][1])-(v[1][1]-v[0][1])*(v[2][0]-v[0][0]);
      const tri=cross<0?[0,1,2,0,2,3]:[0,2,1,0,3,2];
      for(const k of tri){
        const [x,z]=v[k];pos.push(x,y(x,z),z);
        // darker, worn edges; a little grain
        const edge=(k===0||k===3)?.82:(k===1||k===2)?.82:1;
        const g=1+(Math.random()-.5)*.14;
        const mid=(k===0||k===1)?1.0:1.0;
        col.push(c.r*edge*g*mid,c.g*edge*g*mid,c.b*edge*g*mid);
      }
    }
    for(const road of ROADS){
      const pts=road.pts;
      for(let i=0;i<pts.length-1;i++){
        const mx=(pts[i].x+pts[i+1].x)/2,mz=(pts[i].z+pts[i+1].z)/2;
        if(mx<ox||mx>=ox+CHUNK||mz<oz||mz>=oz+CHUNK)continue;
        addQuad(pts[i],pts[i+1]);
      }
    }
    if(!pos.length)return;
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    // Road beds are near-flat: straight-up normals (the quad winding varies
    // with road direction, so computed normals could face down and get culled).
    const nor=new Float32Array(pos.length);for(let i=1;i<nor.length;i+=3)nor[i]=1;
    g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
    g.computeBoundingSphere();
    const m=new THREE.Mesh(g,ROAD_MAT);m.receiveShadow=true;
    snowWatch(g); // v80 S147 — a road takes snow too, but trodden: half of what the fields take
    group.add(m);
  }

  // ═══ STAMPS: sites, dungeon doors, forts ═════════════════════════════
  // Old zone-local dungeon coords → world. Each old zone maps to an anchor
  // site and a scale; entries are spread around that anchor.
  const ZONE_ANCHOR={
    overworld:{x:()=>ASH_X,z:()=>ASH_Z,local:60,scale:3.4}, // v80 S134 — the seven gates that ringed Ashenmoor at 75u now lie within ~200u
    forest:{x:()=>(SITE.thorngate.x+SITE.la_porte_grise.x)/2+40,z:()=>(SITE.thorngate.z+SITE.la_porte_grise.z)/2,local:150,scale:1.5},
    ironhaven:{x:()=>SITE.ironhaven.x,z:()=>SITE.ironhaven.z,local:100,scale:2.6},
  };
  let dungeonWorldPos={}; // seed -> {x,z}
  function placeDungeons(){}
  function placeDoor(e,cellK){
    const fortRoad={};ROAD_DEFS.forEach(d=>{if(d.fort)fortRoad[d.fort]=d;});
    {
      let wx,wz;
      if(e.kind==='fort_door'&&fortRoad[e.seed]){
        const d=fortRoad[e.seed];
        const road=ROADS.find(r=>r.def===d);
        // Pick the point on the road farthest from any settlement, then
        // push 120u off it into the wilderness (north side of E–W roads so
        // the south-facing gate looks back toward the road). A spur path
        // links gate and road (addFortSpurs).
        let bestU=.5,bestD=-1;
        for(let u=.2;u<=.8;u+=.05){const q=roadPoint(road,u);let md=1e9;for(const t of SITES){if(t.pad<=0)continue;md=Math.min(md,Math.hypot(q.x-t.x,q.z-t.z));}if(md>bestD){bestD=md;bestU=u;}}
        const p=roadPoint(road,d.fortAt==null?bestU:d.fortAt);
        const nx=p.nx!=null?p.nx:Math.cos(p.ang),nz=p.nz!=null?p.nz:-Math.sin(p.ang); // v80 S131 — roadPoint gives an angle now; the old normal fields made every fort NaN
        const autoSide=nz>0?-1:1;
        const off=(d.fortOff==null?120:d.fortOff)*(d.fortSide==null?autoSide:d.fortSide);
        wx=p.x+nx*off;wz=p.z+nz*off;
        for(const t of SITES){if(t.pad<=0)continue;const dd=Math.hypot(wx-t.x,wz-t.z);const min=t.pad+120;if(dd<min){const dx=wx-t.x,dz=wz-t.z,L=Math.hypot(dx,dz)||1;wx=t.x+dx/L*min;wz=t.z+dz/L*min;}}
      } else if(e.zone==='gen'){
        wx=e.x;wz=e.z;
        for(let k=0;k<10;k++){const ri=roadInfo(wx,wz);const st=stampAt(wx,wz);
          if(ri&&ri.d<=16){const sg=ri.seg,vx=sg.bx-sg.ax,vz=sg.bz-sg.az,L=Math.hypot(vx,vz)||1;const side=(hash01(e.seed,1,77)<.5?-1:1);wx+=(-vz/L)*side*(18-ri.d+4);wz+=(vx/L)*side*(18-ri.d+4);continue;}
          if(st&&st.kind!=='door'){const dx=wx-st.x,dz=wz-st.z,L=Math.hypot(dx,dz)||1;wx=st.x+dx/L*(st.r+14);wz=st.z+dz/L*(st.r+14);continue;}
          let near=null,nd=1e9;for(const o of stampsNear(wx,wz)){if(o.kind!=='door')continue;const d=Math.hypot(wx-o.x,wz-o.z);if(d<nd){nd=d;near=o;}}
          const minD=near&&near.r>10?near.r+22:30;if(near&&nd<minD){const dx=wx-near.x,dz=wz-near.z,L=Math.hypot(dx,dz)||1e-3;const ang=L<1?hash01(e.seed,k,78)*Math.PI*2:Math.atan2(dz,dx);wx=near.x+Math.cos(ang)*(minD+2);wz=near.z+Math.sin(ang)*(minD+2);continue;}
          break;}
        if(worldH(wx,wz)<1.5)return null;
      } else {
        const an=ZONE_ANCHOR[e.zone]||ZONE_ANCHOR.overworld;
        wx=an.x()+(e.x-an.local)*an.scale;wz=an.z()+(e.z-an.local)*an.scale;
        // Keep cave doors off the road bed (push straight away from the
        // road) and out of site pads (push away from the pad centre).
        for(let k=0;k<10;k++){
          const ri=roadInfo(wx,wz);const st=stampAt(wx,wz);
          if(ri&&ri.d<=16){
            const sg=ri.seg,vx=sg.bx-sg.ax,vz=sg.bz-sg.az,L=Math.hypot(vx,vz)||1;
            const side=(hash01(e.seed,1,77)<.5?-1:1);
            wx+=(-vz/L)*side*(18-ri.d+4);wz+=(vx/L)*side*(18-ri.d+4);continue;
          }
          if(st&&st.kind!=='door'){
            const dx=wx-st.x,dz=wz-st.z,L=Math.hypot(dx,dz)||1;
            wx=st.x+dx/L*(st.r+14);wz=st.z+dz/L*(st.r+14);continue;
          }
          // Minimum spacing from any other door / fort.
          // v80 S134 — never inside a settlement's pad
          {let ps=null,pd=1e9;for(const t of SITES){if(!t.pad)continue;const d=Math.hypot(wx-t.x,wz-t.z);if(d<t.pad+18&&d<pd){pd=d;ps=t;}}if(ps){const dx=wx-ps.x,dz=wz-ps.z,L=Math.hypot(dx,dz)||1e-3;const ang=L<1?hash01(e.seed,k,79)*Math.PI*2:Math.atan2(dz,dx);wx=ps.x+Math.cos(ang)*(ps.pad+20);wz=ps.z+Math.sin(ang)*(ps.pad+20);continue;}}
          let near=null,nd=1e9;
          for(const o of STAMPS){if(o.kind!=='door')continue;const d=Math.hypot(wx-o.x,wz-o.z);if(d<nd){nd=d;near=o;}}
          const minD=near&&near.r>10?near.r+22:30;
          if(near&&nd<minD){
            const dx=wx-near.x,dz=wz-near.z,L=Math.hypot(dx,dz)||1e-3;
            const ang=L<1?hash01(e.seed,k,78)*Math.PI*2:Math.atan2(dz,dx);
            wx=near.x+Math.cos(ang)*(minD+2);wz=near.z+Math.sin(ang)*(minD+2);continue;
          }
          break;
        }
      }
      if(e.zone==='gen'&&(worldH(wx,wz)<1.2||seaAt(wx,wz)>.05))return null; // never in the surf
      dungeonWorldPos[e.seed]={x:wx,z:wz};DOORS.push(e);
      const isFort=e.kind==='fort_door';
      addStamp({id:'door_'+e.seed,kind:'door',x:wx,z:wz,r:isFort?46:7,blend:isFort?34:12,cell:cellK});
      return dungeonWorldPos[e.seed];
    }
  }
  function defineSiteStamps(){}
  function definePortals(){}

  // ═══ SITE MARKERS: cairn + signpost, and the Ashenmoor trader ═════════
  // Trade sign: painted board with a symbol per business and the name below.
  const SIGN_STYLE={shipwright:{bg:'#1e3040',fg:'#d8e8f0'},guild_f:{bg:'#4a1818',fg:'#f0d8b0'},guild_m:{bg:'#182a4a',fg:'#d8e0f8'},weapon:{bg:'#3a2a1a',fg:'#e8d8b0'},armor:{bg:'#2a3040',fg:'#d8dce8'},potion:{bg:'#2e4a2a',fg:'#dce8c0'},misc:{bg:'#4a3a22',fg:'#f0e0b8'},inn:{bg:'#5a2a1e',fg:'#f2dcb0'},church:{bg:'#3a3230',fg:'#f4e8c8'},castle:{bg:'#2a2430',fg:'#e0d0a0'}};
  const _signCache={};
  function signTexture(type,name){
    const key=type+'|'+name;if(_signCache[key])return _signCache[key];
    const cv=document.createElement('canvas');cv.width=256;cv.height=256;const ctx=cv.getContext('2d');
    const st=SIGN_STYLE[type]||SIGN_STYLE.misc;
    ctx.fillStyle=st.bg;ctx.fillRect(0,0,256,256);
    ctx.strokeStyle=st.fg;ctx.lineWidth=6;ctx.strokeRect(10,10,236,236);
    ctx.fillStyle=st.fg;ctx.strokeStyle=st.fg;ctx.lineWidth=10;ctx.lineJoin='round';ctx.lineCap='round';
    ctx.save();ctx.translate(128,104);
    if(type==='weapon'){ // hammer over anvil
      ctx.fillRect(-52,18,104,14);ctx.fillRect(-34,32,68,10);ctx.fillRect(-12,42,24,18);
      ctx.save();ctx.rotate(-.7);ctx.fillRect(-6,-70,12,70);ctx.fillRect(-26,-84,52,26);ctx.restore();
    } else if(type==='armor'){ // shield
      ctx.beginPath();ctx.moveTo(-50,-50);ctx.lineTo(50,-50);ctx.lineTo(50,10);ctx.quadraticCurveTo(50,50,0,64);ctx.quadraticCurveTo(-50,50,-50,10);ctx.closePath();ctx.fill();
      ctx.fillStyle=st.bg;ctx.fillRect(-6,-36,12,80);ctx.fillRect(-36,-8,72,12);
    } else if(type==='potion'){ // bottle with leaf
      ctx.fillRect(-12,-62,24,18);ctx.beginPath();ctx.moveTo(-14,-44);ctx.lineTo(14,-44);ctx.lineTo(38,10);ctx.quadraticCurveTo(44,56,0,60);ctx.quadraticCurveTo(-44,56,-38,10);ctx.closePath();ctx.fill();
      ctx.fillStyle=st.bg;ctx.beginPath();ctx.ellipse(6,18,14,26,-.6,0,Math.PI*2);ctx.fill();
    } else if(type==='misc'){ // sack
      ctx.beginPath();ctx.moveTo(-20,-56);ctx.lineTo(20,-56);ctx.lineTo(26,-40);ctx.quadraticCurveTo(58,20,40,58);ctx.lineTo(-40,58);ctx.quadraticCurveTo(-58,20,-26,-40);ctx.closePath();ctx.fill();
      ctx.strokeStyle=st.bg;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-30,-42);ctx.lineTo(30,-42);ctx.stroke();
    } else if(type==='inn'){ // tankard
      ctx.fillRect(-40,-50,64,100);ctx.beginPath();ctx.arc(30,0,26,-Math.PI/2,Math.PI/2);ctx.lineWidth=14;ctx.stroke();
      ctx.fillStyle=st.bg;ctx.fillRect(-32,-42,48,16);ctx.fillRect(-32,-18,48,10);
    } else if(type==='church'){ // candle flame over a cross
      ctx.fillRect(-8,-10,16,70);ctx.fillRect(-36,10,72,14);ctx.beginPath();ctx.moveTo(0,-64);ctx.quadraticCurveTo(26,-36,0,-14);ctx.quadraticCurveTo(-26,-36,0,-64);ctx.fill();
    } else if(type==='shipwright'){ // anchor
      ctx.beginPath();ctx.arc(0,-44,12,0,Math.PI*2);ctx.lineWidth=10;ctx.stroke();ctx.fillRect(-6,-32,12,88);ctx.fillRect(-34,-18,68,10);ctx.beginPath();ctx.arc(0,18,40,.15*Math.PI,.85*Math.PI);ctx.lineWidth=12;ctx.stroke();
    } else if(type==='guild_f'){ // crossed swords
      ctx.save();ctx.rotate(.78);ctx.fillRect(-8,-62,16,110);ctx.fillRect(-28,10,56,10);ctx.restore();ctx.save();ctx.rotate(-.78);ctx.fillRect(-8,-62,16,110);ctx.fillRect(-28,10,56,10);ctx.restore();
    } else if(type==='guild_m'){ // six-point star
      for(let k=0;k<2;k++){ctx.save();ctx.rotate(k*Math.PI);ctx.beginPath();ctx.moveTo(0,-60);ctx.lineTo(52,30);ctx.lineTo(-52,30);ctx.closePath();ctx.fill();ctx.restore();}ctx.fillStyle=st.bg;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();
    } else { // tower
      ctx.fillRect(-30,-30,60,90);for(let i=-30;i<30;i+=20)ctx.fillRect(i,-48,12,18);
    }
    ctx.restore();
    ctx.fillStyle=st.fg;ctx.font='bold 22px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
    const words=name.split(' ');let lines=[''];words.forEach(w=>{if((lines[lines.length-1]+' '+w).trim().length>16)lines.push(w);else lines[lines.length-1]=(lines[lines.length-1]+' '+w).trim();});
    lines.slice(0,2).forEach((ln,i)=>ctx.fillText(ln,128,196+i*26,230));
    const tex=new THREE.CanvasTexture(cv);_signCache[key]=tex;return tex;
  }
  // Bracket from the wall above the door, board hanging beneath it, both faces painted.
  // S258 — a town's ironwork on the kit, each piece one vertex-coloured mesh in its own frame (local +z out from the wall or
  // towards the street, y 0 at the ground or the lantern's middle); the lit glass and flames stay the old groups.
  const IRON=0x2a2622,IRON2=0x3a3430;
  const ironAdd=P=>(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.04:j});
  // a lantern's housing round its middle: a base plate, four ribs, a pyramid cap with a ring on top (s the half-width)
  function lanternCage(add,s,h,z,y){y=y||0;add(SK.rbox(2*s+.04,.035,2*s+.04,.012,1),IRON,0,y-h/2-.02,z);for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])add(SK.cyl(.012,.012,h,4),IRON,a*s,y,z+b*s);
    add(SK.cone(s*1.55,h*.45,4),IRON,0,y+h/2+h*.2,z,0,Math.PI/4,0);add(SK.torus(.035,.01,3,8),IRON2,0,y+h/2+h*.48,z);}
  // a lamp post: a stone footing, a lathed iron post with collars and a finial, a scrolled arm and the lantern hung at .42
  function lampPostGeo(){const P=[],add=ironAdd(P);
    add(SK.rbox(.46,.22,.46,.05,1),0x7a746a,0,.09,0,0,0,0,.06);
    add(SK.lathe([[.001,.2],[.12,.2],[.12,.3],[.085,.38],[.07,1.15],[.095,1.2],[.07,1.26],[.055,3.18],[.085,3.22],[.085,3.31],[.001,3.35]],8),IRON,0,0,0);
    add(SK.ball(.055,6,4),IRON2,0,3.4,0);
    add(SK.cyl(.022,.022,.5,5),IRON,0,3.26,.25,Math.PI/2,0,0);add(SK.ball(.035,5,4),IRON2,0,3.26,.5);
    add(SK.torus(.13,.015,3,10,Math.PI*1.1),IRON,0,3.13,.14,0,Math.PI/2,-.1);
    add(SK.cyl(.012,.012,.08,4),IRON,0,3.23,.42);lanternCage(add,.13,.36,.42,2.85);
    return mergeParts(P);}
  // a door lantern: a wall plate, a bracket with a scroll under it, the lantern hung at .25 out, its middle at y 0
  function doorLanternGeo(){const P=[],add=ironAdd(P);
    add(SK.rbox(.1,.26,.03,.01,1),IRON,0,.12,.015);add(SK.cyl(.016,.016,.3,4),IRON,0,.14,.15,Math.PI/2,0,0);
    add(SK.torus(.08,.01,3,8,Math.PI),IRON,0,.06,.08,0,Math.PI/2,Math.PI/2);lanternCage(add,.08,.24,.25);return mergeParts(P);}
  // a hanging trade sign: a wall plate, the arm out to 1.3 with a finial, a scrolled brace below it, rings and short chains,
  // and a framed board round the old painted faces (1.0 square at x ±.035, its middle 1.15 out and 2.1 up)
  function tradeSignGeo(){const P=[],add=ironAdd(P);
    add(SK.rbox(.12,.5,.035,.012,1),IRON,0,2.55,.018);add(SK.cyl(.028,.028,1.3,5),IRON,0,2.65,.65,Math.PI/2,0,0);
    add(SK.ball(.045,6,4),IRON2,0,2.65,1.32);
    for(const [r_,y,z] of [[.36,2.32,.34],[.16,2.52,.72]])add(SK.torus(r_,.016,3,10,Math.PI/2),IRON,0,y,z,0,Math.PI/2,Math.PI/2);
    add(SK.cyl(.018,.018,.7,4),IRON,0,2.36,.27,.95,0,0);
    for(const s of [-1,1]){const z=1.15+s*.38;add(SK.torus(.03,.008,3,6),IRON2,0,2.62,z);add(SK.torus(.025,.007,3,6),IRON2,0,2.64,z,0,Math.PI/2,0);}
    add(SK.rbox(.06,1.02,1.02,.015,1),0x4a3a26,0,2.1,1.15,0,0,0,.06);
    for(const [w,h,y,dz] of [[1.12,.06,2.63,0],[1.12,.06,1.57,0],[.06,1.12,2.1,-.53],[.06,1.12,2.1,.53]])add(SK.rbox(.078,h,w===1.12?1.12:.06,.012,1),0x3a2a1a,0,y,1.15+dz,0,0,0,.06);
    return mergeParts(P);}
  function buildTradeSign(group,type,name,doorX,doorZ,tx,tz,ry,y){
    const armLen=1.3;const bx=doorX+tx*(armLen-.15),bz=doorZ+tz*(armLen-.15);
    {const m=new THREE.Mesh(tradeSignGeo(),VC_MAT);m.position.set(doorX,y,doorZ);m.rotation.y=ry;m.castShadow=true;group.add(m);} // S258 — the arm, brace, chains and framed board on the kit
    const tex=signTexture(type,name);
    [1,-1].forEach(sd=>{const f=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.0),new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide}));
      // board faces along the wall: normal = wall tangent
      f.position.set(bx+(-tz)*sd*.035,y+2.1,bz+(tx)*sd*.035);f.rotation.y=ry-Math.PI/2*sd;f.userData.sign=name;group.add(f);}); // front of each face points away from the board
  }
  const _txtCache={};
  function textPlane(str,w,h,fg,bg){
    const key=str+'|'+w+'|'+h;
    let tex=_txtCache[key];
    if(!tex){
      const cv=document.createElement('canvas');cv.width=256;cv.height=64;
      const ctx=cv.getContext('2d');ctx.fillStyle=bg||'#6b4a26';ctx.fillRect(0,0,256,64);
      ctx.fillStyle=fg||'#f0e0b8';ctx.font='bold 34px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(str,128,34,240);
      tex=new THREE.CanvasTexture(cv);_txtCache[key]=tex;
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:tex}));
  }
  // S253 — the signpost and the town's name boards on the kit, each one vertex-coloured mesh (they were boxes): a
  // round weathered post with a cap on a little cairn, arms of plank cut to a point; the name board framed on two round
  // posts with caps and stone footings. The lettering stays the textured planes it was, on the planks' faces.
  function signpostGeo(angs,seed){const r=pRng(seed>>>0),P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+r()*a*2).getHex();
    for(let k=0;k<5;k++){const a=k/5*Math.PI*2+r(),d=.22+r()*.1;add(SK.rbox(.26+r()*.12,.2+r()*.1,.24+r()*.1,.05,1),vary(0x7a746a,.12),Math.cos(a)*d,.06,Math.sin(a)*d,r()*.3,r()*3,r()*.3,.08);}
    add(SK.cyl(.1,.12,3.3,8),vary(0x5a3d1e,.06),0,1.6,0,0,0,0,.08);add(SK.cone(.14,.2,8),0x4a3018,0,3.35,0);
    const sh=new THREE.Shape();sh.moveTo(.1,-.15);sh.lineTo(1.45,-.15);sh.lineTo(1.72,0);sh.lineTo(1.45,.15);sh.lineTo(.1,.15);sh.lineTo(.1,-.15);
    angs.forEach((ang,i)=>{const g=new THREE.ExtrudeGeometry(sh,{depth:.12,bevelEnabled:false});g.rotateY(-Math.PI/2);g.translate(.06,0,0);const y=2.7-i*.42;
      add(g,vary(0x7a5a36,.1),0,y,0,0,ang,0,.07);add(SK.cyl(.025,.025,.2,5),0x2a2622,Math.sin(ang)*.2,y,Math.cos(ang)*.2,0,ang,Math.PI/2,.02);});
    return mergeParts(P);}
  function nameBoardGeo(seed){const r=pRng(seed>>>0),P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});
    for(const sx of [-1.25,1.25]){add(SK.cyl(.08,.1,2.45,8),new THREE.Color(0x4a3018).multiplyScalar(.92+r()*.16).getHex(),sx,1.12,0,0,0,0,.08);add(SK.cone(.11,.14,8),0x3a2412,sx,2.42,0);add(SK.rbox(.36,.2,.34,.05,1),0x7a746a,sx,.06,0,0,r()*2,0,.08);}
    add(SK.rbox(2.7,.62,.08,.02,1),0x5a3d20,0,2.0,0,0,0,0,.06);
    for(const y of [2.345,1.655])add(new THREE.BoxGeometry(2.84,.07,.11),0x3a2412,0,y,0,0,0,0,.04);for(const x of [1.385,-1.385])add(new THREE.BoxGeometry(.07,.76,.11),0x3a2412,x,2.0,0,0,0,0,.04);
    return mergeParts(P);}
  function buildSignpost(x,z,arms){ // arms: [{label, tx, tz}]
    const y=worldH(x,z);const angs=arms.map(a=>Math.atan2(a.tx-x,a.tz-z)); // yaw toward target (+z forward)
    const post=new THREE.Mesh(signpostGeo(angs,Math.round(x)*7+Math.round(z)),VC_MAT);post.position.set(x,y,z);post.castShadow=true;post.receiveShadow=true;post.userData.signpost=true;sc.add(post);
    arms.forEach((a,i)=>{
      const g=new THREE.Group();g.position.set(x,y+2.7-i*.42,z);g.rotation.y=angs[i];
      const t1=textPlane(a.label,1.3,.26);t1.position.set(.068,0,.85);t1.rotation.y=Math.PI/2;g.add(t1);
      const t2=textPlane(a.label,1.3,.26);t2.position.set(-.068,0,.85);t2.rotation.y=-Math.PI/2;g.add(t2);
      sc.add(g);
    });
    STATIC_SOL.push({cx:x,cz:z,rx:.25,rz:.25});
  }
  function buildSiteMarkers(){}
  function buildSiteMarkersFor(c){
    const stone=new THREE.MeshLambertMaterial({color:0x7a746a});
    c.sites.forEach(t=>{
      if(t.pad<=0)return;
      // a wooden name board on two posts beside each road in, facing the road
      const outs=ROAD_DEFS.filter(d=>d.a===t.id||d.b===t.id).map(d=>SITE[d.a===t.id?d.b:d.a]).filter(Boolean);
      if(!outs.length)return;
      outs.slice(0,3).forEach(o=>{const dx=o.x-t.x,dz=o.z-t.z,L=Math.hypot(dx,dz)||1;const ux=dx/L,uz=dz/L;const bx=t.x+ux*(t.pad+3)-uz*3.4,bz=t.z+uz*(t.pad+3)+ux*3.4;const y=worldH(bx,bz);const ang=Math.atan2(ux,uz);
        const board=new THREE.Mesh(nameBoardGeo(Math.round(bx)*7+Math.round(bz)),VC_MAT);board.position.set(bx,y,bz);board.rotation.y=ang;board.castShadow=true;board.receiveShadow=true;board.userData.nameBoard=true;sc.add(board); // S253 — framed, on round posts (it was three boxes)
        [1,-1].forEach(sd=>{const nb=textPlane(t.name,2.5,.5,'#f4e6c0','#3a2a16');nb.position.set(bx+ux*sd*.05,y+2.0,bz+uz*sd*.05);nb.rotation.y=ang+(sd<0?Math.PI:0);sc.add(nb);});
        STATIC_SOL.push({cx:bx,cz:bz,rx:1.4,rz:.3});});
      const o=outs[0];const dx=o.x-t.x,dz=o.z-t.z,L=Math.hypot(dx,dz);
      const sx=t.x+dx/L*(t.pad+4)+(-dz/L)*4,sz=t.z+dz/L*(t.pad+4)+(dx/L)*4;
      buildSignpost(sx,sz,outs.map(s=>({label:s.name,tx:s.x,tz:s.z})));
    });
  }
  // Roadside camps (Session 9): every ~260u along a road, 16u off to one side —
  // two tents, a fire, a bedroll you can rest on (and take a banked level).
  const beds=[];
  function buildCamps(){}
  function buildCampsFor(c,k){
    let n=0;const LD=LOADED.get(k);if(!LD)return 0;
    LD.roads.forEach((rd,ri)=>{
      if(rd.def.via==='spur')return;
      let acc=120+hash01(ri,3,201)*120;
      for(let i=1;i<rd.pts.length;i++){
        const a=rd.pts[i-1],b=rd.pts[i];acc+=Math.hypot(b.x-a.x,b.z-a.z);
        if(acc<260)continue;acc=0;
        const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1,side=hash01(ri,i,202)<.5?-1:1;
        const cx=b.x+(-dz/L)*side*16,cz=b.z+(dx/L)*side*16;
        if(worldH(cx,cz)<1.5||slopeNormalY(cx,cz)<.75)continue;
        if(SITES.some(t=>t.pad>0&&Math.hypot(cx-t.x,cz-t.z)<t.pad+60))continue;
        if(stampAt(cx,cz))continue;
        const cs=addStamp({id:'camp_'+k+'_'+ri+'_'+i,kind:'door',x:cx,z:cz,r:7,blend:9,cell:k});LD.stamps.push(cs);
        const y=worldH(cx,cz);
        [[-2.6,-1.2,.4],[2.4,-1.6,2.6]].forEach(([ox,oz,ry],ti)=>{const t=new THREE.Mesh(campTentGeo(ri+i+ti),VC_MAT);t.position.set(cx+ox,worldH(cx+ox,cz+oz),cz+oz);t.rotation.y=ry;t.castShadow=true;t.receiveShadow=true;t.userData.roadCamp=true;sc.add(t); // S254 — the bandit camp's ridge tent (it was an open cone on a pole)
          STATIC_SOL.push({cx:cx+ox,cz:cz+oz,rx:1.4,rz:1.4});});
        {const q=x=>new THREE.Color(x),P=[];for(let s=0;s<9;s++){const a=s/9*Math.PI*2;P.push({geo:cragGeo(.24,s+ri+3),color:q(0x5a5650).multiplyScalar(.85+(s%3)*.12),x:Math.cos(a)*.85,z:1.2+Math.sin(a)*.85,y:.1,ry:-a,jitter:.06});} // S254 — the bandit camp's fire ring and logs (seven dodecahedra), a blanket with its head rolled and a pack (two boxes)
          for(let s=0;s<3;s++){const a=s/3*Math.PI*2+.4;P.push({geo:SK.cyl(.07,.09,.9,6),color:q(0x3a2818),x:Math.cos(a)*.22,z:1.2+Math.sin(a)*.22,y:.18,rx:Math.PI/2-.35,ry:-a+Math.PI/2,jitter:.08});}
          const bx0=-.2,bz0=3.6,cr=Math.cos(.3),sr=Math.sin(.3),at=(u,w)=>[bx0+u*cr+w*sr,bz0-u*sr+w*cr];
          {const [x,z]=at(0,.1);P.push({geo:SK.rbox(.72,.06,1.4,.025,1),color:q(0x6a5a3a),x,z,y:worldH(cx+x,cz+z)-y+.04,ry:.3,jitter:.1});}
          {const [x,z]=at(0,-.72);P.push({geo:SK.cyl(.11,.11,.74,8),color:q(0x7a6a48),x,z,y:worldH(cx+x,cz+z)-y+.11,ry:.3,rz:Math.PI/2,jitter:.08});}
          {const [x,z]=at(-.62,-.5);P.push({geo:SK.rbox(.34,.4,.26,.06,1),color:q(0x5a3a1e),x,z,y:worldH(cx+x,cz+z)-y+.2,ry:.3+.4,jitter:.06});}
          const m=new THREE.Mesh(mergeParts(P),VC_MAT);m.position.set(cx,y,cz);m.castShadow=true;m.receiveShadow=true;m.userData.roadCamp=true;sc.add(m);}
        const ember=new THREE.Mesh(new THREE.SphereGeometry(.24,6,6),new THREE.MeshBasicMaterial({color:0xff7a22}));ember.position.set(cx,y+.2,cz+1.2);sc.add(ember);
        const fl=regLight(0xff8a30,1.1,9,'cell:'+k);fl.position.set(cx,y+.9,cz+1.2);STATIC_SOL.push({cx,cz:cz+1.2,rx:.8,rz:.8});
        const bx=cx-.2,bz=cz+3.6;
        beds.push({x:bx,z:bz,cell:k});n++;
      }
    });
    return n;
  }
  function homeLoaded(){
    const A=SITE.ashenmoor;if(!A)return;ASH_X=A.x;ASH_Z=A.z;
    const rd=ROADS.find(r=>r.def.a==='ashenmoor'&&r.def.b==='hearthwick');
    if(rd){let i=rd.pts.findIndex(q=>Math.hypot(q.x-ASH_X,q.z-ASH_Z)>62);if(i<1)i=1;const q=rd.pts[i],n=rd.pts[Math.min(rd.pts.length-1,i+2)];spawn.x=q.x;spawn.z=q.z;spawn.yaw=Math.atan2(-(n.x-q.x),-(n.z-q.z));}
    else{spawn.x=ASH_X;spawn.z=ASH_Z-62;}
  }
  function buildTrader(){
    // A canvas tent, a fire, and Fen the trader — the stopgap merchant until
    // the settlement generator lands in Session 3. Interact opens the
    // general-goods shop directly (see talkNPC hook).
    const x=ASH_X+18,z=ASH_Z-12,y=worldH(x,z);
    const canvas=new THREE.MeshLambertMaterial({color:0xb8a880,side:THREE.DoubleSide});
    const tent=new THREE.Mesh(new THREE.ConeGeometry(3.2,3.4,4,1,true),canvas);tent.rotation.y=Math.PI/4;tent.position.set(x,y+1.7,z);tent.castShadow=true;sc.add(tent);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,3.6,5),new THREE.MeshLambertMaterial({color:0x4a3018}));pole.position.set(x,y+1.8,z);sc.add(pole);
    STATIC_SOL.push({cx:x,cz:z,rx:2.4,rz:2.4});
    // fire
    const fx=x+4.5,fz=z+1.5,fy=worldH(fx,fz);
    const stone=new THREE.MeshLambertMaterial({color:0x5a5450});
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.28,0),stone);m.position.set(fx+Math.cos(a)*.75,fy+.18,fz+Math.sin(a)*.75);sc.add(m);}
    const ember=new THREE.Mesh(new THREE.SphereGeometry(.28,6,6),new THREE.MeshBasicMaterial({color:0xff7a22}));ember.position.set(fx,fy+.22,fz);sc.add(ember);
    const fl=regLight(0xff8a30,1.4,12,'trader');fl.position.set(fx,fy+1,fz);
    STATIC_SOL.push({cx:fx,cz:fz,rx:.9,rz:.9});
    // Fen
    const def={name:'Fen',role:'trader',x:x+2.6,z:z+3.4,bCol:0x6a4a2a,sCol:0xd4a878,
      shop:{id:'trader_fen',name:"Fen's Wagon",keeper:'Fen',type:'misc',tagline:'"Anything you\'re carrying, I\'ll price. Anything I\'m carrying, you\'ll want."'}};
    const g=buildNPCMesh(def);g.position.set(def.x,worldH(def.x,def.z),def.z);g.rotation.y=Math.PI*.8;sc.add(g);
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),new THREE.MeshBasicMaterial({color:0xffdd00}));dot.position.set(def.x,worldH(def.x,def.z)+1.5,def.z);dot.visible=false;sc.add(dot);
    npcs.push({g,dot,def,wa:0,wt:0,ph:0,_static:true});
    STATIC_SOL.push({cx:def.x,cz:def.z,rx:.35,rz:.35});
  }
  const npcs=[];let _curSettle=null;
  // ═══ NPC SCHEDULES (Session 10) ══════════════════════════════════════
  // One person, one life: the street mesh and the interior mesh are the
  // same character at different hours. Keepers are behind their counter
  // 8–18, out to the inn in the evening, home at night; residents wander
  // the plaza by day, drink in the evening, sleep at night; villagers roam
  // by day; guards patrol gate ↔ plaza around the clock.
  const HRS={shopOpen:8,shopClose:18,eve:18,night:21,dawn:7};
  function hourNow(){return (typeof gameHour==='function')?gameHour():12;}
  function npcInsideNow(house){
    const h=hourNow(),t=house.type;
    if(house.siteId==='ashenmoor'&&storyRuin('ashenmoor')&&ASH_SURVIVORS.includes(house.keeper))return true; // S269 — Edna can't walk; Oswin won't leave
    if(t==='inn')return h>=6||h<2;
    if(t==='church')return h>=6&&h<21;
    if(t==='castle')return h>=8&&h<20;
    if(t==='guild_f'||t==='guild_m')return true;
    if(t==='cabin'||t==='cellar'||t==='tower'||t==='chapel')return false;
    if(t==='home'){if(house.shuttered)return false;if(house.ownedByPlayer||ownedHouse(house.id))return false;return h>=HRS.night||h<HRS.dawn;}
    return h>=HRS.shopOpen&&h<HRS.shopClose; // shops
  }
  function shopClosedNow(house){const t=house.type;if(t==='home'||t==='inn'||t==='church'||t==='castle'||t==='guild_f'||t==='guild_m'||t==='cabin'||t==='cellar'||t==='tower'||t==='chapel')return false;return !npcInsideNow(house);}
  function scheduleFor(n,h){
    try{if(typeof QUEST_DEFS!=='undefined'&&n.def&&QUEST_DEFS.some(q=>q.giver===n.def.name&&(qState(q.id)==='available'||qState(q.id)==='active'||qState(q.id)==='reward')||qState(q.id)==='active'&&(q.objectives||[]).some(o=>o.type==='talk_to'&&o.npc===n.def.name)))return {go:(n.sched&&n.sched.door)||{x:n.def.x,z:n.def.z},idle:true};}catch(e){} // v80 — a quest giver is always findable (S236: and whoever an active quest sends you to)
    const sc_=n.sched;if(!sc_)return {idle:true};
    const eve=h>=HRS.eve&&h<HRS.night,night=h>=HRS.night||h<HRS.dawn,day=!eve&&!night;
    switch(sc_.type){
      case 'keeper':
        if(h>=HRS.shopOpen&&h<HRS.shopClose)return {hide:true};
        // S273 — the sea tutorial sends you to buy a ship: until you have one, the shipwright waits at his door out of hours (S236's rule)
        if(sc_.shop==='shipwright'&&!worldState.ship&&TUT().sea&&TUT().sea.step==='ship')return {go:sc_.door,idle:true};
        if(eve)return sc_.inn?{go:sc_.inn,thenHide:true}:{go:sc_.door,idle:true};
        if(night)return {hide:true};
        return {go:sc_.door,idle:true}; // dawn: at the door before opening
      case 'innkeeper': return {hide:true};
      case 'harbour': return night?{hide:true}:{go:sc_.door,idle:true}; // v80 S235 — at his post on the quay from 7 to 21
      case 'resident':
        if(night)return {hide:true};
        if(eve)return sc_.inn?{go:sc_.inn,thenHide:true}:{go:sc_.door,idle:true};
        return {wander:sc_.plaza,r:sc_.padR||14};
      case 'villager':
        if(night||eve&&h>=20)return {hide:true};
        return {wander:sc_.plaza,r:sc_.padR||14};
      case 'guard': {const B=(h>=19||h<6.5)&&beatOf(n._settle);return B?{beat:B}:{patrol:[sc_.a,sc_.b]};} // v80 S166 — the lantern beat after dark
      case 'constable': return (h>=19||h<6.5)?{hide:true}:{patrol:[sc_.a,sc_.b]}; // S268 — the day constable, the watchman's other half
      case 'watch': {if(!(h>=19||h<6.5))return {hide:true};const B=beatOf(n._settle);return B?{beat:B}:{patrol:[sc_.a,sc_.b]};}
      case 'lost': return {idle:true};
      default: return {idle:true};
    }
  }
  // The watch goes by the streets: a breadth-first search over a one-unit grid of the pad (built once per town), the
  // path pulled straight wherever the line is clear. Returns the turning points from a to b, not b itself; [] when
  // the line is clear or no way is found (he walks the direct line as before).
  function townRoute(S){if(S._route)return S._route;const cx=S.site.x,cz=S.site.z;
    const R=Math.ceil((S.site.pad||40)+8),N=2*R+1,sol=new Uint8Array(N*N);
    const fill=()=>{for(let j=0;j<N;j++)for(let i=0;i<N;i++)sol[j*N+i]=solidAt(cx-R+i,cz-R+j)?1:0;};fill();
    const cel=p=>[Math.max(0,Math.min(N-1,Math.round(p.x-cx+R))),Math.max(0,Math.min(N-1,Math.round(p.z-cz+R)))];
    const find=(s0,g0)=>{const prev=new Int32Array(N*N).fill(-1);prev[s0]=s0;const q=[s0];
      for(let h=0;h<q.length&&prev[g0]<0;h++){const c=q[h],ci=c%N,cj=(c-ci)/N;
        for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=N||nj>=N)continue;const k=nj*N+ni;
          if(prev[k]>=0||(sol[k]&&k!==g0))continue;if(di&&dj&&(sol[cj*N+ni]||sol[nj*N+ci]))continue;prev[k]=c;q.push(k);}}
      if(prev[g0]<0)return null;const ks=[];for(let c=g0;c!==s0;c=prev[c])ks.push(c);ks.push(s0);return ks.reverse();};
    // S378 — the grid is read once, but solids go on arriving after the town is built (the chunks' trees and rocks, the
    // town's own later pieces): 3,710 solid cells at Dunmore's build, 3,928 six minutes on. A way through a cell gone solid
    // since held a guard against it for good, and asking again gave him the same way. Each way is checked against the
    // world as it is now: a cell gone solid is marked and the way found again; no way at all reads the whole grid afresh, once.
    S._route=(a,b,raw)=>{const [ai,aj]=cel(a),[bi,bj]=cel(b),s0=aj*N+ai,g0=bj*N+bi;let ks=null,fresh=false;
      for(let tries=0;tries<12;tries++){ks=find(s0,g0);
        if(!ks){if(fresh)break;fill();fresh=true;continue;}
        let stale=false;for(let i=1;i<ks.length-1;i++){const k=ks[i];if(solidAt(cx-R+k%N,cz-R+Math.floor(k/N))){sol[k]=1;stale=true;}}
        if(!stale)break;ks=null;}
      if(!ks)return [];const cells=ks.map(c=>({x:cx-R+c%N,z:cz-R+Math.floor(c/N)})); // S247 — his own cell first: from a corner the line to the first turn can cut the wall
      if(raw)return cells; // S247 — every cell of the way, for a man the pulled-straight path has already failed
      const out=[];let from=a;for(let i=0;i<cells.length-1;i++){if(!clearLine(from.x,from.z,cells[i+1].x,cells[i+1].z)){out.push(cells[i]);from=cells[i];}}return out;};
    return S._route;}
  // v80 S166 — the night watch's beat: a loop through the street in front of every shop door, in order round the
  // town's centre, so a lantern passes each locked shop in turn. Built once per settlement; null where there are no shops.
  function beatOf(S){if(!S||!S.site)return null;if(S._beat!==undefined)return S._beat;
    const cx=S.site.x,cz=S.site.z;const P=(S.houses||[]).filter(x=>/weapon|armor|potion|misc/.test(x.type)&&x.keeper&&x.exitX!=null).map(x=>({x:x.exitX,z:x.exitZ,house:x.id}));
    P.sort((a,b)=>Math.atan2(a.z-cz,a.x-cx)-Math.atan2(b.z-cz,b.x-cx));if(P.length===1)P.push({x:cx+4,z:cz+4});
    const route=townRoute(S);
    const B=[];for(let i=0;i<P.length;i++){B.push(P[i]);if(P.length>1)B.push(...route(P[i],P[(i+1)%P.length]));}
    S._beat=B.length?B:null;return S._beat;}
  // With the town's favour at −2 or worse (canon §12), the nearest guard on duty trails you while you are on its pad
  // and out of doors; one per town, kept until he goes off duty or you leave.
  function pickFollowers(h,now){const out=!((typeof isInterior==='function')&&isInterior());
    for(const S of SETTLE.values()){if(!S.site)continue;const G=guardsOf(S);let f=null;
      if(out&&favor(S.site)<=-2&&Math.hypot(px-S.site.x,pz-S.site.z)<(S.site.pad||40)){
        const ok=n=>n.g.visible&&!n._drawn&&!(n._scared&&now<n._scared)&&!scheduleFor(n,h).hide;
        if(S._follower&&G.includes(S._follower)&&ok(S._follower))f=S._follower;
        else{let bd=1e9;for(const n of G){if(!ok(n))continue;const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);if(d<bd){bd=d;f=n;}}}}
      S._follower=f;for(const n of G)n._follow=(n===f);}}
  // Guards carry a torch after dark: stick + flame + a small point light.
  function ensureTorch(n){
    if(n._torch)return n._torch;
    const t=new THREE.Group();
    const stick=new THREE.Mesh(new THREE.CylinderGeometry(.03,.035,.5,5),new THREE.MeshLambertMaterial({color:0x4a3018}));stick.position.y=.25;t.add(stick);
    const head=new THREE.Mesh(new THREE.CylinderGeometry(.05,.04,.1,6),new THREE.MeshLambertMaterial({color:0x2a2018}));head.position.y=.53;t.add(head);
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.06,.16,6),new THREE.MeshBasicMaterial({color:0xffa030}));flame.position.y=.66;t.add(flame);
    const l=regLight(0xff9a40,1.1,7,'npc');l.follow=t;t.userData.light=l;
    t.scale.set(.55,.55,.55);const rig=n.g.userData.rig;
    if(rig&&rig.B.wrL){t.position.set(0,-.05,.05);t.rotation.x=-.45;rig.B.wrL.add(t);} // S153 — in the left hand
    else{t.position.set(-.26,.42,.14);t.rotation.z=.3;n.g.add(t);}
    n._torch=t;return t;
  }
  // A few words when two of them meet: bubbles over both heads for a moment.
  const PLEASANTRIES=["Morning.","Fine day for it.","Mind the road after dark.","Any news from the coast?","Heard the wolves again last night.","Keep well.","The smith's prices, eh?","Rain's coming, I can feel it.","Good to see you.","Aye.","Watch yourself out there.","Bread's dear this week."];
  const _bubbleTex={};
  function bubbleFor(text){
    if(_bubbleTex[text])return _bubbleTex[text];
    const cv=document.createElement('canvas');cv.width=256;cv.height=64;const ctx=cv.getContext('2d');
    ctx.fillStyle='rgba(240,228,200,.92)';ctx.strokeStyle='#4a3a26';ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect?ctx.roundRect(4,4,248,44,10):ctx.rect(4,4,248,44);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(118,48);ctx.lineTo(128,60);ctx.lineTo(138,48);ctx.fill();
    ctx.fillStyle='#2a1c10';ctx.font='20px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,27,236);
    const tex=new THREE.CanvasTexture(cv);_bubbleTex[text]=tex;return tex;
  }
  function sayBubble(n,text){
    if(n._bubble){n.g.remove(n._bubble);}
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:bubbleFor(text),transparent:true,depthTest:false}));sp.scale.set(1.6,.4,1);sp.position.set(0,1.95,0);n.g.add(sp);n._bubble=sp;n._bubbleT=3.2;
  }
  let _chatT=0;
  function tickChatter(dt){
    for(const n of npcs){if(n._bubble){n._bubbleT-=dt;if(n._bubbleT<=0){n.g.remove(n._bubble);n._bubble=null;}}}
    _chatT-=dt;if(_chatT>0)return;_chatT=1.2;
    const near=npcs.filter(n=>n.g.visible&&!n._bubble&&Math.hypot(px-n.g.position.x,pz-n.g.position.z)<45);
    for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++){
      const a=near[i],b=near[j];if(a._bubble||b._bubble)continue;
      const d=Math.hypot(a.g.position.x-b.g.position.x,a.g.position.z-b.g.position.z);
      if(d<2.4&&Math.random()<.35){
        a.g.rotation.y=Math.atan2(b.g.position.x-a.g.position.x,b.g.position.z-a.g.position.z);b.g.rotation.y=a.g.rotation.y+Math.PI;
        sayBubble(a,pick(Math.random,PLEASANTRIES));setTimeout(()=>{if(b.g.visible)sayBubble(b,pick(Math.random,PLEASANTRIES));},900);
        a.wt=Math.max(a.wt||0,4);b.wt=Math.max(b.wt||0,4);a._tgt=null;b._tgt=null;
      }
    }
  }
  function npcStep(n,tx,tz,spd,dt,near){
    const gx=n.g.position.x,gz=n.g.position.z,dx=tx-gx,dz=tz-gz,d=Math.hypot(dx,dz);
    if(d<(near||.8))return true;
    if(near&&d<spd*dt){n.g.position.x=tx;n.g.position.z=tz;return true;}
    const mx=dx/d*spd*dt,mz=dz/d*spd*dt;
    const try_=(x,z)=>!solidAt(x,z);
    if(try_(gx+mx,gz+mz)){n.g.position.x+=mx;n.g.position.z+=mz;}
    else if(try_(gx+mx,gz))n.g.position.x+=mx;
    else if(try_(gx,gz+mz))n.g.position.z+=mz;
    else{n._stuck=(n._stuck||0)+1;if(n._stuck>40){n._stuck=0;return true;}return false;}
    n._stuck=0;n.g.rotation.y=Math.atan2(dx,dz);
    return false;
  }
  // S357 — a guard walking you down (trailing you at favour −2, or sent after you): the pulled-straight way by the streets,
  // and when he has gained nothing on you for a second and a half (a corner the straight line misses, where npcStep gives
  // up and he stood for good), every cell of the way, as the night beat does (S247)
  function trailStep(n,spd,dt,every){const gx=n.g.position.x,gz=n.g.position.z,fd=Math.hypot(px-gx,pz-gz);
    if(n._twBest==null||fd<n._twBest-.5){n._twBest=fd;n._twS=0;}else n._twS+=dt;
    if(n._twS>1.5){n._twS=0;n._twBest=fd;n._twRaw=townRoute(n._settle)({x:gx,z:gz},{x:px,z:pz},true);}
    if(n._twRaw&&n._twRaw.length){const w=n._twRaw[0];npcStep(n,w.x,w.z,spd,dt,.2);if(Math.hypot(w.x-n.g.position.x,w.z-n.g.position.z)<.3)n._twRaw.shift();return;}
    n._fwT=(n._fwT||0)-dt;if(n._fwT<=0){n._fwT=every;const w=townRoute(n._settle)({x:gx,z:gz},{x:px,z:pz});n._fw=w.length?w[0]:null;}
    const t=n._fw&&Math.hypot(n._fw.x-gx,n._fw.z-gz)>.9?n._fw:{x:px,z:pz};npcStep(n,t.x,t.z,spd,dt);}
  // Filled in by build() from the road geometry; the fallback is the pad edge.
  const spawn={x:ASH_X,z:ASH_Z-62,yaw:0};
  function tickNPCs(dt,now){
    const h=hourNow();
    try{pickFollowers(h,now);}catch(e){}
    for(const n of npcs){
      const gx=n.g.position.x,gz=n.g.position.z;
      const plan=(n._settle&&n._settle.raid)?{hide:true}:scheduleFor(n,h);
      // hidden = indoors somewhere; the interior generator spawns them there
      if(plan.hide||(n._arrivedHide)){if(n.g.visible){n.g.visible=false;n.dot.visible=false;}if(n._torch&&n._torch.visible){n._torch.visible=false;n._torch.userData.light.intensity=0;}n._retreated=true;if(plan.hide)n._arrivedHide=false;continue;}
      if(n._drawn)continue; // S157 — drawn against you; the enemy stands in
      if(!n.g.visible){n.g.visible=true;n._retreated=false;n.g.position.set(n.home.x,worldH(n.home.x,n.home.z),n.home.z);}
      n._retreated=false;
      if(n._scared&&now<n._scared){const a=Math.atan2(n.g.position.x-px,n.g.position.z-pz);npcStep(n,n.g.position.x+Math.sin(a)*6,n.g.position.z+Math.cos(a)*6,1.3,dt);n.g.position.y=worldH(n.g.position.x,n.g.position.z);n.dot.position.set(n.g.position.x,n.g.position.y+1.52,n.g.position.z);continue;} // S157 — struck: runs
      const spd=n.sched&&n.sched.type==='guard'?.95:.7;
      let moving=false;
      if(n._chase){const fd=Math.hypot(px-n.g.position.x,pz-n.g.position.z); // S239 — sent after you: he runs you down by the streets
        if(fd>1.4){trailStep(n,CHASE_SPD,dt,.6);moving=true;}
        else{n._twBest=null;n._twRaw=null;n.g.rotation.y=Math.atan2(px-n.g.position.x,pz-n.g.position.z);}}
      else if(n._follow){const fd=Math.hypot(px-n.g.position.x,pz-n.g.position.z); // S166 — trailing you at six to eight units
        if(fd>8){trailStep(n,Math.min(3.4,spd+(fd-8)*.6),dt,1);moving=true;}
        else{n._twBest=null;n._twRaw=null;n.g.rotation.y=Math.atan2(px-n.g.position.x,pz-n.g.position.z);}}
      else if(plan.beat){const B=plan.beat;
        if(n._beatI==null||n._beatI>=B.length){const G=guardsOf(n._settle).filter(g=>g.sched.type!=='constable');const k=Math.max(0,G.indexOf(n));n._beatI=Math.floor(k*B.length/Math.max(1,G.length))%B.length;}
        if(n._beatWait>0){n._beatWait-=dt;}
        else{const t=B[n._beatI]; // S247 — a beat point he can't walk straight to (he joins the beat anywhere, or a house is in the way) is reached by the streets
          const td=Math.hypot(t.x-n.g.position.x,t.z-n.g.position.z);if(n._bwT!==t||td<n._bwBest-.5){n._bwT=t;n._bwBest=td;n._bwS=0;}else n._bwS+=dt;
          if(n._bwS>2.5&&!(n._bwp&&n._bwp.length)){n._bwS=0;n._bwp=townRoute(n._settle)({x:n.g.position.x,z:n.g.position.z},t);}
          const w=n._bwp&&n._bwp.length?n._bwp[0]:null;const next=()=>{n._beatI=(n._beatI+1)%B.length;n._beatWait=2+Math.random()*2;n._bwp=null;n._bwTry=null;};
          if(w){if(npcStep(n,w.x,w.z,spd,dt,.2)){if(Math.hypot(w.x-n.g.position.x,w.z-n.g.position.z)<.3)n._bwp.shift();else next();}moving=true;}
          else{let arrived=npcStep(n,t.x,t.z,spd,dt); // blocked for good (npcStep gives up) is not arriving: once more cell by cell, then on to the next point
            if(arrived&&Math.hypot(t.x-n.g.position.x,t.z-n.g.position.z)>=.8&&n._bwTry!==t){n._bwTry=t;n._bwp=townRoute(n._settle)({x:n.g.position.x,z:n.g.position.z},t,true);arrived=!n._bwp.length;}
            if(arrived)next();moving=!arrived;}}}
      else if(plan.go){const arrived=npcStep(n,plan.go.x,plan.go.z,spd,dt);if(arrived&&plan.thenHide)n._arrivedHide=true;moving=!arrived;}
      else if(plan.wander){
        n.wt-=dt;
        if(!n._tgt||n.wt<=0){const a=Math.random()*Math.PI*2,r=Math.random()*plan.r;n._tgt={x:plan.wander.x+Math.cos(a)*r,z:plan.wander.z+Math.sin(a)*r};n.wt=10+Math.random()*12;}
        const arrived=npcStep(n,n._tgt.x,n._tgt.z,spd*.75,dt);if(arrived){n._tgt=null;n.wt=3+Math.random()*6;}moving=!arrived;
      }
      else if(plan.patrol){n._leg=n._leg||0;const t=plan.patrol[n._leg];const arrived=npcStep(n,t.x,t.z,spd,dt);if(arrived){n._leg=1-n._leg;}moving=!arrived;}
      if(n.sched&&(n.sched.type==='guard'||n.sched.type==='watch')){const dark=isNight()||h<6.5||h>=19;const t=ensureTorch(n);t.visible=dark;t.userData.light.intensity=dark?1.1:0;}
      const cy=worldH(n.g.position.x,n.g.position.z);
      n.g.position.y=cy; // S153 — the rig carries its own breath and stride
      n.dot.position.set(n.g.position.x,cy+1.52,n.g.position.z);
      const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);
      if(d<5&&!moving){const target=Math.atan2(px-n.g.position.x,pz-n.g.position.z);let diff=target-n.g.rotation.y;diff=Math.atan2(Math.sin(diff),Math.cos(diff));n.g.rotation.y+=diff*Math.min(1,dt*4);}
    }
  }


  // ═══ HERBS ═══════════════════════════════════════════════════════════
  // Harvestables scattered per chunk from HERB_DEF, keyed by the old zone
  // each herb was authored for: forest herbs in forest regions, ironhaven
  // herbs in the foothills/royale, overworld herbs elsewhere. Glow lights
  // are not added to the scene (a ring of 80 chunks would be ~120 point
  // lights); the mesh keeps its emissive read.
  const HERB_ZONE={coastal:'overworld',ashen:'overworld',bealach:'overworld',deepwood:'forest',foothills:'ironhaven',royale:'ironhaven',wastes:'overworld',greywood:'forest'};
  let _herbPool=null;
  function herbPool(){if(_herbPool)return _herbPool;_herbPool={};if(typeof HERB_DEF==='undefined')return _herbPool;for(const k in HERB_DEF){const z=HERB_DEF[k].zone||'overworld';(_herbPool[z]=_herbPool[z]||[]).push(k);}return _herbPool;}
  // Placement contexts: each herb prefers some ground. 'tree' = within 4u of a
  // trunk, 'water' = the shore band, 'sand' = beach, 'house' = beside a
  // building, 'rock' = steep ground, 'open' = anywhere else.
  const HERB_PLACE={
    firemoss:{ctx:['rock','open'],biomes:['wastes','wasteland','plains','moor']},silverleaf:{ctx:['tree','open'],biomes:['plains','autumn','forest']},heartroot:{ctx:['tree'],biomes:['forest','autumn','fen']},ashwort:{ctx:['rock','open'],biomes:['wastes','wasteland','dunes']},
    muirfhear:{ctx:['water','sand'],biomes:['coast','dunes','fen']},goldenrod:{ctx:['open','house'],biomes:['plains','autumn','moor','coast']},thornberry:{ctx:['tree','house'],biomes:['plains','forest','autumn']},coldmoss:{ctx:['rock','tree'],biomes:['tundra','moor','forest']},
    fearnog:{ctx:['tree'],biomes:['forest','autumn']},shadowcap:{ctx:['tree'],biomes:['forest','swamp','fen']},caorthann:{ctx:['tree','open'],biomes:['forest','autumn','plains']},deepmoss:{ctx:['tree','rock'],biomes:['forest','swamp']},briarweed:{ctx:['open','house'],biomes:['forest','plains','moor']},luibhuisce:{ctx:['water'],biomes:['forest','fen','swamp','coast']},
    ferrousweed:{ctx:['rock'],biomes:['moor','wastes','wasteland','tundra']},graywort:{ctx:['rock','open'],biomes:['moor','wastes','tundra']},caordubh:{ctx:['tree','rock'],biomes:['wastes','wasteland','swamp']},mistfern:{ctx:['water','tree'],biomes:['fen','swamp','forest']},stonecress:{ctx:['rock'],biomes:['moor','tundra','plains']},veilwort:{ctx:['house','open'],biomes:['plains','coast','autumn']},credearg:{ctx:['rock','open'],biomes:['wasteland','wastes','dunes']},duilleogghorm:{ctx:['water','sand'],biomes:['coast','dunes','fen']},
  };
  function placeCtx(x,z,h,ch){
    if(h<-1.2)return 'sea';
    const ny=slopeNormalY(x,z);if(ny<.84)return 'rock';
    if(h<2.6){const sea=seaAt(x,z);if(sea>.02||h<1.6)return h<2.0?'sand':'water';}
    // near water: a river or lake within a short walk (bed below 0 within 6u)
    for(const [dx,dz] of [[6,0],[-6,0],[0,6],[0,-6]])if(worldH(x+dx,z+dz)<0)return 'water';
    if(ch.treePts)for(let i=0;i<ch.treePts.length;i+=2){if(Math.abs(ch.treePts[i]-x)<4&&Math.abs(ch.treePts[i+1]-z)<4)return 'tree';}
    for(const S of SETTLE.values()){if(Math.abs(S.site.x-x)>S.site.pad+30||Math.abs(S.site.z-z)>S.site.pad+30)continue;for(const hh of S.houses){if(Math.hypot(hh.doorX-x,hh.doorZ-z)<11)return 'house';}}
    return 'open';
  }
  function herbCandidates(biome,ctx){const out=[];for(const k in HERB_PLACE){const p=HERB_PLACE[k];if(!HERB_DEF[k])continue;if(!p.biomes.includes(biome))continue;const w=p.ctx.indexOf(ctx);if(w<0)continue;out.push([k,w===0?3:1]);}return out;}
  const HERB_GEO={};
  function herbGeoFor(type,def){
    if(HERB_GEO[type])return HERB_GEO[type];
    {const pg=plantGeo(type,false);if(pg)return (HERB_GEO[type]=pg);} // v80 S167 — the plant's own bake
    const {g,gl}=mkHerbMesh(0,0,def,sc);if(gl&&gl.parent)gl.parent.remove(gl);sc.remove(g);g.updateMatrixWorld(true);
    const list=[];g.traverse(o=>{if(!o.isMesh)return;const mat=o.material;if(!mat||mat.isMeshBasicMaterial||mat.map)return;const geo=o.geometry;if(!geo||!geo.attributes.position)return;const src=geo.index?geo.toNonIndexed():geo;list.push([src,o.matrixWorld.clone(),(mat.vertexColors?new THREE.Color(1,1,1):mat.color)||new THREE.Color(1,1,1)]);});
    HERB_GEO[type]=list.length?mergeGeos(list):null;return HERB_GEO[type];
  }
  const _hm=new THREE.Matrix4(),_hq=new THREE.Quaternion(),_hp=new THREE.Vector3(),_hs=new THREE.Vector3();
  function herbInstances(ch){
    // build one InstancedMesh per type from the chunk's herb records
    const byType={};ch.herbs.forEach(h=>{if(!h.bed){(byType[h.type]||(byType[h.type]=[])).push(h);}});
    for(const type in byType){const list=byType[type];const geo=herbGeoFor(type,HERB_DEF[type]);if(!geo)continue;
      herbIM(type,geo,list,ch.group,h=>propH(h.x,h.z));}
  }
  // one InstancedMesh per kind, and for a plant that stays when picked (a bush, a sapling) a second of its picked
  // copy: each herb shows in one of the two, the other holding it at a thousandth of its size (syncHerbInstance)
  function herbIM(type,geo,list,group,yOf){const kind=PLANT_KIND[type];const pg=plantGeo(type,true);
    const mk=(g,picked)=>{const im=new THREE.InstancedMesh(g,HERB_MAT,list.length);im.castShadow=false;im.receiveShadow=true;im.userData.noBake=true;
      list.forEach((h,i)=>{if(picked)h.instP=im;else{h.inst=im;h.idx=i;}const show=picked?h.harvested:!h.harvested;_hp.set(h.x,yOf(h),h.z);_hq.setFromAxisAngle(_hy,h.ph);_hs.setScalar(show?1:.001);_hm.compose(_hp,_hq,_hs);im.setMatrixAt(i,_hm);});
      im.instanceMatrix.needsUpdate=true;group.add(im);return im;};
    const a=mk(geo,false),b=pg?mk(pg,true):null;let cx=0,cz=0;list.forEach(h=>{cx+=h.x;cz+=h.z;});cx/=list.length;cz/=list.length;
    const rec={ims:b?[a,b]:[a],x:cx,z:cz,shadow:!!kind&&PLANT_SHADOW.has(kind),list,picked:list.some(h=>h.harvested)};list.forEach(h=>{h._imr=rec;});HERB_IMS.push(rec);} // S263 — the picked copy is drawn only while one is picked (every kind has one now)
  // A plant a third of a unit tall is under a pixel past about seventy units, and a chunk's herbs are one mesh per kind,
  // so each chunk's herb meshes are drawn only within HERB_LOD.far of the player, and the tall kinds cast shadows only
  // within HERB_LOD.shadow (S167: all 81 loaded chunks' herbs were 1.8M triangles, and their shadows another .9M)
  const HERB_IMS=[],HERB_LOD={far:100,shadow:45};
  function tickHerbLod(){for(let i=HERB_IMS.length-1;i>=0;i--){const r=HERB_IMS[i],im=r.ims[0];if(!im.parent||!im.parent.parent){HERB_IMS.splice(i,1);continue;}
      const d=Math.hypot(px-r.x,pz-r.z),vis=d<HERB_LOD.far,cast=r.shadow&&d<HERB_LOD.shadow;for(let k=0;k<r.ims.length;k++){const m=r.ims[k];m.visible=vis&&(k===0||r.picked);m.castShadow=cast;}}}
  function syncHerbInstance(h){if(!h.inst)return;const hidden=h.harvested||!h.g.visible;_hp.set(h.x,propH(h.x,h.z),h.z);_hq.setFromAxisAngle(_hy,h.ph);_hs.set(hidden?.001:1,hidden?.001:1,hidden?.001:1);_hm.compose(_hp,_hq,_hs);h.inst.setMatrixAt(h.idx,_hm);h.inst.instanceMatrix.needsUpdate=true;
    if(h.instP){_hs.setScalar(h.harvested?1:.001);_hm.compose(_hp,_hq,_hs);h.instP.setMatrixAt(h.idx,_hm);h.instP.instanceMatrix.needsUpdate=true;}
    if(h._imr){h._imr.picked=h._imr.list.some(q=>q.harvested);if(h._imr.picked&&h.instP)h.instP.visible=h.inst.visible;}} // the picked bush stands where the whole one did
  const _hy=new THREE.Vector3(0,1,0);
  let _herbSyncT=0;
  function tickHerbSync(dt){_herbSyncT-=dt;if(_herbSyncT>0)return;_herbSyncT=.5;tickHerbLod();for(const h of ZONES.world.herbs){if(!h.inst)continue;const hidden=h.harvested||!h.g.visible;const y=propH(h.x,h.z);if(hidden!==h._shownHidden||Math.abs((h._y==null?-1e9:h._y)-y)>.05){h._shownHidden=hidden;h._y=y;syncHerbInstance(h);}}} // v80 S132 — re-seat when the ground under a herb changes (a pad stamped after it was placed)
  function spawnChunkHerbs(ch){
    if(typeof mkHerbMesh!=='function'||typeof HERB_DEF==='undefined')return;
    const cxw=ch.cx*CHUNK+CHUNK/2,czw=ch.cz*CHUNK+CHUNK/2;
    if(worldH(cxw,czw)<-2)return;
    const dom=dominantRegion(cxw,czw).r;const biome=dom.biome;
    const dens={forest:1.3,autumn:1.3,fen:1.2,swamp:1.2,plains:1.0,coast:.9,moor:.8,tundra:.6,dunes:.5,wastes:.7,wasteland:.6}[biome]||1;
    // a hotspot: one herb, many of it, clustered
    const hot=hash01(ch.cx,ch.cz,124)<.14;
    let n=Math.floor((8+hash01(ch.cx,ch.cz,120)*8)*dens); // v80 — denser: 8–16 a chunk before the biome factor
    const put=(hx,hz,type)=>{const def=HERB_DEF[type];if(!def)return false;const g=new THREE.Group();g.position.set(hx,worldH(hx,hz),hz);const gl={intensity:0,parent:null};const h={x:hx,z:hz,type,def,g,gl,harvested:false,respawnT:0,ph:Math.random()*Math.PI*2};ZONES.world.herbs.push(h);ch.herbs.push(h);return true;};
    const okSpot=(hx,hz)=>{if(solidAt(hx,hz))return false;const ri=roadInfo(hx,hz);if(ri&&ri.d<ROAD_HALF+1.2)return false;const st=stampAt(hx,hz);if(st&&st.kind==='site'&&Math.hypot(hx-st.x,hz-st.z)<st.r-6)return false;return true;};
    let placed=0;
    for(let i=0;i<n*3&&placed<n;i++){
      const hx=ch.cx*CHUNK+3+hash01(ch.cx+i,ch.cz,121)*(CHUNK-6),hz=ch.cz*CHUNK+3+hash01(ch.cz,ch.cx+i,122)*(CHUNK-6);
      const h=worldH(hx,hz);if(h<1.0||!okSpot(hx,hz))continue;
      const ctx=placeCtx(hx,hz,h,ch);if(ctx==='sea')continue;
      const cands=herbCandidates(biome,ctx);if(!cands.length)continue;
      let tw=0;cands.forEach(c=>tw+=c[1]);let pk=hash01(ch.cx,ch.cz,123+i)*tw,type=cands[0][0];for(const c of cands){pk-=c[1];if(pk<=0){type=c[0];break;}}
      if(put(hx,hz,type))placed++;
    }
    // v80 — the verge: herbs grow along the sides of roads, just off the surface
    {let vp=0;for(let i=0;i<40&&vp<6;i++){const hx=ch.cx*CHUNK+1+hash01(ch.cx+i,ch.cz+7,131)*(CHUNK-2),hz=ch.cz*CHUNK+1+hash01(ch.cz+i,ch.cx+3,132)*(CHUNK-2);const ri=roadInfo(hx,hz);if(!ri||ri.d<ROAD_HALF+1.0||ri.d>ROAD_HALF+3.2)continue;const h=worldH(hx,hz);if(h<1.0||solidAt(hx,hz))continue;const st=stampAt(hx,hz);if(st&&st.kind==='site'&&Math.hypot(hx-st.x,hz-st.z)<st.r)continue;const cands=herbCandidates(biome,'open');if(!cands.length)continue;const type=cands[Math.floor(hash01(ch.cx+i,ch.cz,133)*cands.length)][0];if(put(hx,hz,type))vp++;}
    }
    if(hot){
      const hx0=ch.cx*CHUNK+10+hash01(ch.cx,ch.cz,125)*(CHUNK-20),hz0=ch.cz*CHUNK+10+hash01(ch.cz,ch.cx,126)*(CHUNK-20);const h0=worldH(hx0,hz0);if(h0<1)return;
      const ctx=placeCtx(hx0,hz0,h0,ch);const cands=herbCandidates(biome,ctx==='sea'?'open':ctx);if(!cands.length)return;
      const type=cands[Math.floor(hash01(ch.cx,ch.cz,127)*cands.length)][0];const m=8+Math.floor(hash01(ch.cx,ch.cz,128)*9);
      for(let i=0;i<m;i++){const a=hash01(ch.cx+i,ch.cz,129)*Math.PI*2,rr=1.5+hash01(ch.cz+i,ch.cx,130)*7;const hx=hx0+Math.cos(a)*rr,hz=hz0+Math.sin(a)*rr;if(worldH(hx,hz)<1||!okSpot(hx,hz))continue;put(hx,hz,type);}
    }
    herbInstances(ch);
  }


  // ═══ ENCOUNTERS ══════════════════════════════════════════════════════
  // Per-region spawn tables. Each chunk rolls once against the region's
  // `enc` density when it builds; a hit picks one group and spawns 2–4 of
  // it at random open points in the chunk. Night groups only roll at
  // night. Enemies are tagged with their chunk and removed when it drops;
  // a chunk whose spawns all died is "cleared" for RESPAWN_H in-game hours.
  const ENC={
    coastal:  [{name:'Wolf',w:3,n:[2,3]},{name:'Bandit',w:2,n:[1,2],road:true}],
    ashen:    [{name:'Wolf',w:4,n:[2,4]},{name:'Spider',w:2,n:[2,3]},{name:'Bandit',w:2,n:[1,2],road:true},{name:'Goblin',w:3,n:[2,4]}],
    bealach:  [{name:'Bandit',w:4,n:[2,3],road:true},{name:'Wolf',w:3,n:[2,3]},{name:'Goblin',w:2,n:[2,3]},{name:'Skeleton',w:2,n:[2,3],night:true}],
    deepwood: [{name:'Wolf',w:3,n:[3,4]},{name:'Spider',w:3,n:[2,4]},{name:'Forest Troll',w:2,n:[1,2]}],
    foothills:[{name:'Wolf',w:3,n:[2,3]},{name:'Cave Bear',w:2,n:[1,1]},{name:'Bandit',w:2,n:[2,3],road:true},{name:'Ogre',w:1,n:[1,1]}],
    royale:   [{name:'Bandit',w:3,n:[1,2],road:true},{name:'Wolf',w:2,n:[2,2]}],
    wastes:   [{name:'Ash Hound',w:4,n:[2,4]},{name:'Hollowed',w:3,n:[2,3]},{name:'Hollowed',w:4,n:[3,5],night:true}],
    greywood: [{name:'Wolf',w:3,n:[2,4]},{name:'Spider',w:3,n:[3,4]},{name:'Forest Troll',w:2,n:[1,2]},{name:'Ogre',w:1,n:[1,1]},{name:'Skeleton',w:2,n:[2,4],night:true}],
  };
  const ENC_BIOME={
    plains:  [{name:'Wolf',w:3,n:[2,3]},{name:'Boar',w:3,n:[1,2],day:true},{name:'Bandit',w:3,n:[2,3],road:true},{name:'Bandit Archer',w:2,n:[1,2],road:true},{name:'Goblin Slinger',w:1,n:[1,2]},{name:'Highwayman',w:2,n:[1,2],road:true},{name:'Kobold',w:2,n:[2,4]},{name:'Skeleton',w:2,n:[2,3],night:true},{name:'Ghoul',w:2,n:[1,2],night:true}],
    forest:  [{name:'Wolf',w:4,n:[2,4]},{name:'Spider',w:3,n:[2,4]},{name:'Boar',w:2,n:[1,2],day:true},{name:'Forest Troll',w:2,n:[1,2]},{name:'Dire Wolf',w:2,n:[1,2],night:true},{name:'Bandit',w:2,n:[2,3],road:true}],
    coast:   [{name:'Wolf',w:2,n:[2,2]},{name:'Bandit',w:3,n:[1,3],road:true},{name:'Bandit Archer',w:2,n:[1,2],road:true},{name:'Deserter',w:2,n:[1,2],road:true},{name:'Ghoul',w:2,n:[1,3],night:true}],
    wastes:  [{name:'Ash Hound',w:4,n:[2,4]},{name:'Hollowed',w:3,n:[2,3]},{name:'Hollowed',w:4,n:[3,5],night:true},{name:'Cultist',w:2,n:[2,3],night:true}],
    tundra:  [{name:'Dragon',w:.35,n:[1,1]},{name:'Snow Wolf',w:4,n:[2,4]},{name:'Frost Troll',w:2,n:[1,1]},{name:'Deserter',w:2,n:[1,2],road:true},{name:'Wraith',w:2,n:[1,2],night:true}],
    fen:     [{name:'Bog Crawler',w:4,n:[2,4]},{name:'Ghoul',w:2,n:[1,3],night:true},{name:'Marsh Hag',w:2,n:[1,1],night:true},{name:'Bandit',w:2,n:[1,2],road:true}],
    moor:    [{name:'Kobold',w:3,n:[2,4]},{name:'Wolf',w:3,n:[2,3]},{name:'Highwayman',w:3,n:[1,3],road:true},{name:'Wraith',w:2,n:[1,1],night:true},{name:'Skeleton',w:2,n:[2,3],night:true}],
    autumn:  [{name:'Boar',w:3,n:[1,3],day:true},{name:'Wolf',w:3,n:[2,3]},{name:'Dire Wolf',w:2,n:[1,2],night:true},{name:'Bandit',w:3,n:[2,3],road:true},{name:'Cultist',w:1,n:[2,2],night:true}],
    dunes:   [{name:'Sand Scorpion',w:4,n:[1,3]},{name:'Bandit',w:3,n:[2,3],road:true},{name:'Highwayman',w:2,n:[1,2],road:true},{name:'Ghoul',w:2,n:[2,3],night:true}],
    swamp:   [{name:'Bog Crawler',w:4,n:[2,4]},{name:'Marsh Hag',w:2,n:[1,2]},{name:'Ghoul',w:3,n:[2,3],night:true},{name:'Cultist',w:2,n:[2,3],night:true}],
    wasteland:[{name:'Dragon',w:.35,n:[1,1]},{name:'Ash Hound',w:3,n:[2,3]},{name:'Ash Wight',w:2,n:[1,1]},{name:'Hollowed',w:3,n:[2,4]},{name:'Cultist',w:2,n:[2,3]},{name:'Wraith',w:2,n:[1,2],night:true}],
  };
  const NIGHT_EXTRA={cold:[{name:'Wraith',w:1,n:[1,1]},{name:'Snow Wolf',w:1,n:[2,3]}],temperate:[{name:'Skeleton',w:1,n:[2,3]},{name:'Ghoul',w:1,n:[1,2]}],warm:[{name:'Ghoul',w:1,n:[2,3]},{name:'Cultist',w:1,n:[2,2]}]};
  const RESPAWN_H=48;
  const cleared=new Proxy({},{get:(_,k)=>(worldState.wcleared||{})[k],set:(_,k,v)=>{(worldState.wcleared||(worldState.wcleared={}))[k]=v;return true;},ownKeys:()=>Object.keys(worldState.wcleared||{}),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})}); // chunkKey -> hours-at-clear, lives in worldState so it saves
  function nowHours(){return ((worldState&&(worldState.gameTimeAbsMinutes!=null?worldState.gameTimeAbsMinutes:worldState.gameTimeMinutes))||0)/60;}
  function isNight(){return (typeof _nightFactor==='function')&&_nightFactor()>.5;}
  function spawnChunkEncounters(ch){
    const key=chunkKey(ch.cx,ch.cz);
    if(cleared[key]!=null&&nowHours()-cleared[key]<RESPAWN_H)return;
    const cxw=ch.cx*CHUNK+CHUNK/2,czw=ch.cz*CHUNK+CHUNK/2;
    const dom=dominantRegion(cxw,czw);
    if(worldH(cxw,czw)<-3){ // open water: sharks, occasionally
      if(hash01(ch.cx,ch.cz,170)>.06)return;const ex=cxw+(hash01(ch.cx,ch.cz,171)-.5)*20,ez=czw+(hash01(ch.cz,ch.cx,172)-.5)*20;
      const e=buildZoneEnemy(sc,STATIC_SOL,ex,ez,'Shark',null);e._chunk=key;e.homeX=ex;e.homeZ=ez;ZONES.world.enemies.push(e);ch.enemies.push(e);return;}
    if(worldH(cxw,czw)<1.5)return;
    // Deterministic per chunk per "spawn epoch" so re-entering doesn't reroll every time.
    const epoch=Math.floor(nowHours()/RESPAWN_H);
    const roll=hash01(ch.cx*7+epoch,ch.cz*13-epoch,91);
    let dens=dom.r.enc*3.4*(isNight()?1.7:1); // dense; more at night
    // No spawns inside site pads.
    for(const t of SITES){if(t.pad>0&&Math.hypot(cxw-t.x,czw-t.z)<t.pad+70)return;}
    const [ci,cj]=cellOf(cxw,czw);
    const nearRoad=(()=>{const ri=roadInfo(cxw,czw);return ri&&ri.d<40;})();
    const patrolled=nationKeyOf(ci,cj)==='gatelands'&&roadInfo(cxw,czw)&&roadInfo(cxw,czw).d<40; // the Crown patrols its roads
    const ambush=nearRoad&&hash01(ch.cx*3+epoch,ch.cz*5+epoch,96)<(patrolled?.12:nationKeyOf(ci,cj)==='mark'?.34:.26); // bandits work the roads; more in the Mark
    if(roll>dens&&!ambush)return;
    const night=isNight();const cl=climateOfCell(ci,cj);
    let table=(ENC[dom.r.id]||ENC_BIOME[dom.r.biome]||ENC_BIOME.plains).filter(g=>(!g.night||night)&&(!g.day||!night));
    if(night)table=table.concat(NIGHT_EXTRA[cl]||NIGHT_EXTRA.temperate);
    // marauders everywhere: a human band is always on the table
    table=table.concat([{name:'Bandit',w:2,n:[2,4]},{name:'Highwayman',w:1,n:[1,3]},{name:'Deserter',w:1,n:[2,3]}]);
    if(ambush)table=[{name:'Bandit',w:3,n:[2,4],road:true},{name:'Highwayman',w:2,n:[2,3],road:true},{name:'Deserter',w:1,n:[2,3],road:true},{name:'Bandit Archer',w:2,n:[1,2],road:true}];
    let tw=0;table.forEach(g=>tw+=g.w);
    let pick=hash01(ch.cx,ch.cz,92+epoch)*tw,grp=table[0];
    for(const g of table){pick-=g.w;if(pick<=0){grp=g;break;}}
    let count=grp.n[0]+Math.floor(hash01(ch.cx,ch.cz,93+epoch)*(grp.n[1]-grp.n[0]+1));
    if(level>=6&&count>1&&hash01(ch.cx,ch.cz,97+epoch)<.35)count++;
    const leader=(grp.name==='Bandit'||grp.name==='Highwayman')&&level>=5&&count>=2&&hash01(ch.cx,ch.cz,98+epoch)<.5?'Bandit Captain':null;
    // Anchor: near the road for road groups, else anywhere open.
    let ax=cxw,az=czw;
    if(grp.road){
      let best=null,bd=1e9;
      for(let k=0;k<12;k++){const tx=ch.cx*CHUNK+hash01(k,ch.cx,94)*CHUNK,tz=ch.cz*CHUNK+hash01(k,ch.cz,95)*CHUNK;const ri=roadInfo(tx,tz);if(ri&&ri.d<bd){bd=ri.d;best={x:tx,z:tz};}}
      if(!best)return; // road groups don't spawn away from roads
      ax=best.x;az=best.z;
    } else {
      ax=ch.cx*CHUNK+8+hash01(ch.cx,ch.cz,96)*(CHUNK-16);az=ch.cz*CHUNK+8+hash01(ch.cz,ch.cx,97)*(CHUNK-16);
    }
    for(let i=0;i<count;i++){
      let ex=ax,ez=az,ok=false;
      for(let k=0;k<8;k++){
        ex=ax+(hash01(i,k,98)-.5)*14;ez=az+(hash01(k,i,99)-.5)*14;
        if(worldH(ex,ez)>1.5&&slopeNormalY(ex,ez)>.6&&!solidAt(ex,ez)&&!(stampAt(ex,ez)&&stampAt(ex,ez).kind==='site')){ok=true;break;}
      }
      if(!ok)continue;
      const variant=(typeof pickVariant==='function')?pickVariant(grp.name,typeof level!=='undefined'?level:1,'normal'):null;
      const e=buildZoneEnemy(sc,STATIC_SOL,ex,ez,(i===0&&leader)?leader:grp.name,variant);
      e._chunk=key;
      ZONES.world.enemies.push(e);ch.enemies.push(e);
    }
  }
  function despawnChunkEncounters(ch){
    if(!ch.enemies.length)return;
    const key=chunkKey(ch.cx,ch.cz);
    let alive=0;
    for(const e of ch.enemies){
      if(e.dead){continue;}
      alive++;
      if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);
      if(e.el&&e.el.parent)e.el.parent.remove(e.el);
      const i=ZONES.world.enemies.indexOf(e);if(i>=0)ZONES.world.enemies.splice(i,1);
    }
    if(alive===0)cleared[key]=nowHours();
    ch.enemies.length=0;
  }
  // Called each tick: mark chunks whose spawns have all died as cleared so
  // a corpse field doesn't refill the moment the player steps out and back.
  function tickCleared(){
    for(const [key,ch] of chunks){
      if(!ch.enemies.length||ch._clearedChecked)continue;
      if(ch.enemies.every(e=>e.dead)){cleared[key]=nowHours();ch._clearedChecked=true;}
    }
  }

  // ═══ SETTLEMENTS (Session 3) ═════════════════════════════════════════
  // Every site with a pad generates a settlement from (seed, region, kind):
  // streets along the roads that cross the pad, lots on both sides, a plaza
  // at the centre (well, stalls), walls with gates for towns/cities/garrisons,
  // palisades for outposts, tents for camps, broken walls for ruins. Shops
  // get interiors via ZONES.world.houses; keepers stand at their doors;
  // villagers wander the plaza by day. Dialog is pooled by role and
  // region and carries the ambient lore: what the place is, where the roads
  // go, which doors nearby swallow patrols. Settlements stream in within
  // SETTLE_IN and out beyond SETTLE_OUT so the scene holds one or two at a
  // time. Hero sites (Ashenmoor, Ironhaven) pass their authored shop rosters
  // through the same generator.
  const SETTLE_IN=480,SETTLE_OUT=580;
  const SETTLE=new Map(); // siteId -> {group, sol, houses:[], npcs:[]}
  const REGISTER={coastal:'irish',ashen:'irish',bealach:'irish',deepwood:'irish',foothills:'french',royale:'french',wastes:'anglo',greywood:'anglo'};
  const NAMES={
    irish:{m:['Cormac','Fionn','Tadhg','Niall','Donnacha','Eoin','Ruairí','Cathal','Oisín','Pádraig','Lorcan','Séamus'],
           f:['Aoife','Gráinne','Niamh','Sorcha','Bríd','Órla','Maeve','Clodagh','Róisín','Eilís','Sinéad','Caoimhe']},
    french:{m:['Étienne','Guillaume','Thibault','Renaud','Mathieu','Olivier','Aymeric','Gaspard','Bertrand','Loïc','Rémi','Amaury'],
            f:['Isabeau','Margaux','Aliénor','Ysolde','Clémence','Blanche','Héloïse','Odile','Sabine','Adèle','Mireille','Colette']},
    anglo:{m:['Wulfstan','Eadric','Godwin','Leofric','Eadwulf','Osric','Cuthbert','Hereward','Beorn','Wigmund','Wilfrid','Dunstan'],
           f:['Æthelflæd','Eadgyth','Hilda','Wynflæd','Mildrith','Godgifu','Ealhswith','Leofgifu','Cynethryth','Eanflæd','Elfrida','Osgyth']},
  };
  const SHOP_NOUN={
    weapon:{irish:'Forge',french:'Forge',anglo:'Smithy'},
    armor:{irish:'Armoury',french:'Armurerie',anglo:'Armoury'},
    potion:{irish:'Apothecary',french:'Herboristerie',anglo:'Physic'},
    misc:{irish:'Goods',french:'Comptoir',anglo:'Stores'},
    shipwright:{irish:'Boatyard',french:'Chantier',anglo:'Shipwright'},
    church:{irish:'Oratory',french:'Chapelle',anglo:'Chapel'},
  };
  const INN_NAMES={
    irish:['The Grey Heron','The Salt Hound','The Wandering Ram','The Broken Oar','The Rowan Cup','The Bramble Hearth'],
    french:['Auberge du Cerf','Le Coq Doré','Auberge de la Grise','La Lanterne','Le Vieux Pressoir','Auberge du Pont'],
    anglo:['The Ash and Bone','The Hollow Lamp','The Crooked Gate','The Last Ember','The Black Ram','The Wayfarer'],
  };
  const SHOP_ROLE={weapon:'Smith',armor:'Armourer',potion:'Apothecary',misc:'Merchant',inn:'Innkeeper',church:'Priest',castle:'Steward',guild_f:'Guildmaster',guild_m:'Archmage',shipwright:'Shipwright'};
  const TAGLINES={
    weapon:['"Edges kept keen, prices kept fair."','"Steel for the road ahead."','"If it bends, I did not make it."'],
    armor:['"Padding first, then plate."','"Walk out heavier, walk back at all."','"Nothing fancy. Everything tested."'],
    potion:['"Roots, tinctures, and honest advice."','"Bitter cures for bitter roads."','"Ask before you drink."'],
    misc:['"Odds, ends, and things that fell off carts."','"Rope, salt, candles, and questions."','"I buy what you carry."'],
    inn:['"A bed, a bowl, and no questions."','"Fire\'s lit. Door\'s open."','"Travellers welcome. Trouble isn\'t."'],
    church:['"The door is always open."','"Come in out of the dark."','"Rest a moment. It costs nothing."'],
  };
  // Per-kind plan: building count, shop set, extras.
  const KIND_PLAN={
    village: {n:[10,14], shops:['weapon','potion','misc','inn'],   optional:['church'], rows:1, walls:false, stalls:0},
    town:    {n:[60,85], shops:['guild_f','guild_m','weapon','armor','potion','misc','misc','misc','inn','inn','inn','church'], optional:['weapon','potion','inn'], rows:2, walls:true, stalls:4},
    city:    {n:[150,190],shops:['castle','guild_f','guild_m','church','church','weapon','weapon','weapon','armor','armor','potion','potion','potion','misc','misc','misc','misc','misc','inn','inn','inn','inn','inn'], optional:['inn','misc','armor'], rows:2, walls:true, stalls:8},
    garrison:{n:[24,32], shops:['weapon','armor','potion','inn','inn','misc'],  optional:[], rows:1, walls:true, stalls:0},
    outpost: {n:[3,4],  shops:['misc','inn'],                     optional:[], rows:1, walls:'palisade', stalls:0},
    port:    {n:[30,45], shops:['shipwright','weapon','potion','misc','misc','inn','inn','church'], optional:['misc'], rows:2, walls:false, stalls:3},
    camp:    {n:[0,0],  shops:[],                                 optional:[], rows:0, walls:false, stalls:0, tents:3},
    ruin:    {n:[0,0],  shops:[],                                 optional:[], rows:0, walls:false, stalls:0, ruins:7},
    poi:     {n:[0,0],  shops:[],                                 optional:[], rows:0, walls:false, stalls:0, stones:6},
    glade:{n:[0,0],shops:[],optional:[],rows:0,walls:false,stalls:0},shrine:{n:[0,0],shops:[],optional:[],rows:0,walls:false,stalls:0},lair:{n:[0,0],shops:[],optional:[],rows:0,walls:false,stalls:0},tower:{n:[0,0],shops:[],optional:[],rows:0,walls:false,stalls:0},bcamp:{n:[0,0],shops:[],optional:[],rows:0,walls:false,stalls:0},
  };
  // Region build register: wall/roof colours and framing.
  // Biome builders: whole-building shapes for the wilder regions.
  function mushroomGeo(w,d,st,r){
    const c=x=>new THREE.Color(x);const R=Math.max(w,d)/2;const parts=[];
    parts.push({geo:new THREE.CylinderGeometry(R*.62,R*.75,2.6,10),color:c(0xd8cfa8),y:1.3,jitter:.04});
    parts.push({geo:new THREE.SphereGeometry(R*1.15,12,7,0,Math.PI*2,0,Math.PI/2),color:c([0x9a3a2a,0xb04a30,0x8a5a2a,0x7a3a5a][Math.floor(r()*4)]),y:2.6,jitter:.05});
    parts.push({geo:new THREE.CylinderGeometry(R*1.15,R*1.0,.4,12),color:c(0xe8dcc0),y:2.5,jitter:.03});
    for(let k=0;k<5;k++){const a=r()*Math.PI*2,rr=R*(.35+r()*.6);parts.push({geo:new THREE.SphereGeometry(.28+r()*.2,6,5),color:c(0xf0e8d8),x:Math.cos(a)*rr,z:Math.sin(a)*rr,y:2.6+Math.sqrt(Math.max(0,(R*1.15)**2-rr*rr))*.95,jitter:0});}
    parts.push({geo:new THREE.BoxGeometry(.9,1.7,.1),color:c(0x3a2a1a),x:0,y:.85,z:R*.72,jitter:0});
    [-1,1].forEach(sd=>parts.push({geo:new THREE.BoxGeometry(.5,.5,.1),color:c(0x2a2622),x:sd*R*.4,y:1.6,z:R*.68,jitter:0}));
    return mergeParts(parts);
  }
  function iceGeo(w,d,st,r){
    const c=x=>new THREE.Color(x);const R=Math.max(w,d)/2;const parts=[];
    parts.push({geo:new THREE.SphereGeometry(R,12,8,0,Math.PI*2,0,Math.PI/2),color:c(0xdce9f2),y:0,jitter:.03});
    for(let k=0;k<3;k++)parts.push({geo:new THREE.TorusGeometry(R*Math.cos((k+1)*.35),.06,5,16),color:c(0xb8cddc),y:R*Math.sin((k+1)*.35),rx:Math.PI/2,jitter:0});
    parts.push({geo:new THREE.BoxGeometry(1.4,1.2,1.6),color:c(0xcfe0ec),z:R*.85,y:.6,jitter:.03});
    parts.push({geo:new THREE.BoxGeometry(.9,1.0,.1),color:c(0x3a4a5a),x:0,y:.5,z:R*.85+.8,jitter:0});
    parts.push({geo:new THREE.CylinderGeometry(.18,.22,.6,6),color:c(0x6a7a86),y:R,jitter:0});
    return mergeParts(parts);
  }
  // Regional build styles. h = wall height, rise = roof pitch height,
  // thatch = thick rounded overhanging roof layer, twoStory = chance of
  // an upper floor with a jetty band, door = door colour.
  const STYLE={
    // whitewashed lime, dark stone footing, straw thatch, low and squat
    irish:{wall:0xe6e0d0,wall2:0xd4ccb8,roof:0xb8925a,roof2:0x9a7844,plinth:0x565048,frame:0x3a2a1a,framed:false,h:2.4,rise:1.5,thatch:true,twoStory:0,door:0x2f5e3a},
    // cream plaster, dark half-timbering, steep slate, tall, jettied
    french:{wall:0xdccfb0,wall2:0xc8ba98,roof:0x55596a,roof2:0x43475a,plinth:0x7a746a,frame:0x3e2c1c,framed:true,h:3.1,rise:2.3,thatch:false,twoStory:.55,door:0x5a3820},
    // grey rubble stone, dark timber, low shingle roofs, moss-dark
    anglo:{wall:0x7f7666,wall2:0x6a6256,roof:0x3a3430,roof2:0x2c2824,plinth:0x4e4840,frame:0x221a12,framed:true,h:2.5,rise:1.15,thatch:false,twoStory:.15,door:0x3a2a1a},
    // pale ashlar, terracotta tile, tall city blocks with cornice bands
    stone:{wall:0xb9b3a4,wall2:0xa59f90,roof:0x9a5a3a,roof2:0x7e482e,plinth:0x8a857a,frame:0x6a655c,framed:false,h:3.3,rise:1.5,thatch:false,twoStory:.7,door:0x3e2a16},
    // the Mark: dark timber longhouses, dark shingle, steep; nothing decorative
    mark:{wall:0x4a3826,wall2:0x3a2c1e,roof:0x26221e,roof2:0x1c1815,plinth:0x55524c,frame:0x2a1a10,framed:false,h:2.6,rise:2.3,thatch:false,twoStory:.15,door:0x1a1612},
    // Aurenne: cream plaster, terracotta tile, low pitch, painted doors
    aurenne:{wall:0xf0e4cc,wall2:0xe2d4b6,roof:0xb86a3a,roof2:0xa05a30,plinth:0x8a7a6a,frame:0x8a6a4a,framed:false,h:3.1,rise:.9,thatch:false,twoStory:.6,door:0x3a5a8a},
    // Bavarian: cream render, dark timber, very steep roofs, painted shutters
    bavarian:{wall:0xf0e6d0,wall2:0xdccfb4,roof:0x5a3a2a,roof2:0x4a2e20,plinth:0x6a665e,frame:0x3a2412,framed:true,h:3.0,rise:2.9,thatch:false,twoStory:.75,door:0x7a2a1a},
    // garrison: same ashlar, slate roofs, squat
    garrison:{wall:0x8f8b82,wall2:0x7c7870,roof:0x4a4c56,roof2:0x3a3c46,plinth:0x5a5650,frame:0x4a4a4a,framed:false,h:2.9,rise:1.2,thatch:false,twoStory:.25,door:0x2e2418},
  };
  function rngFor(a,b){let s=(a*73856093^b*19349663^SEED)>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
  function pick(r,arr){return arr[Math.floor(r()*arr.length)%arr.length];}
  // v80 S172 — the same single draw as pick(); if that one is taken in this town, the next free one along the list (so a
  // town's draws, and every name that did not collide, stay as they were). Taken by everyone: the draw stands.
  let _townNames=null,_curNM=null,_twinUsed=null,_roleNames=null; // S248 — how many hold each name, and the names held by someone with a post
  function pickFor(r,arr,post){const v=pickFree(r,arr,_townNames);if(!post||!_townNames||!_townNames.has(v)||!_roleNames||!_roleNames.has(v))return v; // S248 — a bank used up: a man with a post takes a name no other post-holder has
    const i=arr.indexOf(v);for(let k=1;k<arr.length;k++){const c=arr[(i+k)%arr.length];if(!_roleNames.has(c))return c;}return v;}
  function noteName(name,post,fixed){if(!_townNames)return 0;_townNames.add(name);if(post&&_roleNames)_roleNames.add(name);if(!_twinUsed)return 0; // S250 — a kept number, or the lowest one nobody on the town's record holds
    let u=_twinUsed.get(name);if(!u)_twinUsed.set(name,u=new Set());let t=fixed!=null&&fixed!==''&&!isNaN(+fixed)?+fixed:null;if(t==null){t=0;while(u.has(t))t++;}u.add(t);return t;}
  function twinsFromRecord(NM){const m=new Map();for(const k in NM){const p=String(NM[k]).split('|');const nm=p[0],t=k.startsWith('tw:')?p[1]:p[6];if(t==null||t===''||isNaN(+t))continue;let u=m.get(nm);if(!u)m.set(nm,u=new Set());u.add(+t);}return m;}
  function pickFree(r,arr,used){const v=pick(r,arr);if(!used||!used.has(v))return v;const i=arr.indexOf(v);for(let k=1;k<arr.length;k++){const c=arr[(i+k)%arr.length];if(!used.has(c))return c;}return v;}
  function cardinalFace(tx,tz){ // unit vector → 'N' (−z) 'S' (+z) 'E' 'W'
    if(Math.abs(tx)>Math.abs(tz))return tx>0?'E':'W';
    return tz>0?'S':'N';
  }
  // Hero rosters: authored shops for Ashenmoor and Ironhaven.
  function heroShops(site){
    if(site.id==='ashenmoor'&&typeof HOUSES!=='undefined')return HOUSES.map(h=>({name:h.name,keeper:h.keeper,type:h.type,tagline:h.tagline,bCol:h.bCol,sCol:h.sCol}));
    if(site.id==='ironhaven'&&typeof IRONHAVEN_HOUSES!=='undefined')return IRONHAVEN_HOUSES.filter(h=>h.id!=='ih7').map(h=>({name:h.name,keeper:h.keeper,type:h.type,tagline:h.tagline,bCol:h.bCol,sCol:h.sCol}));
    if(site.id==='hearthwick'&&typeof HEARTHWICK_HOUSES!=='undefined')return HEARTHWICK_HOUSES.map(h=>({name:h.name,keeper:h.keeper,type:h.type,tagline:h.tagline,bCol:h.bCol,sCol:h.sCol}));
    return null;
  }

  // ── Building geometry (merged, vertex-coloured; one mesh per building) ──
  // ── S194: the house in detail (backlog H.5; Michael's decision A on Session 179's prototype) ──
  // buildingGeo builds today's house (buildingGeoLo, on the town's own dice, exactly as before, so every town keeps
  // its layout and its people) and a detailed one beside it, which rolls its own dice from what the plain one picked.
  // The detailed house is what you see near; the plain one is its distant copy (houseLod, per baked cluster).
  // Parts: a footing ringed with rough stones; walls; half-timbering with braces and a jetty where the style frames;
  // recessed windows with sills, lintels, mullions and shutters, kept under the eaves; a framed plank door with hinges
  // and a step; a roof with thickness, eaves on rafter ends, bargeboards, and its covering in courses (slate, shingle,
  // half-round tile), or a rounded, lumpy thatch; a coursed chimney with a cap; by the house's dice a lean-to, a
  // woodpile, a water butt. Each culture draws variants from its neighbours (Michael: Nordic into the Mark, the
  // Mediterranean into Aurenne, Irish, Celtic and Western European into the Irish).
  const HOUSE_VARIANTS={
    irish:[{},{},{thatch:false,slate:true,roof:0x4a4e58,roof2:0x3a3e48,wall:0xb8b0a0,wall2:0xa49c8c,rubble:true},{wall:0xf0e8d8,door:0xa02a2a},{thatch:false,slate:true,roof:0x3e4450,roof2:0x30343e,framed:true,frame:0x2a2018,wall:0xe8e0cc,twoStoryAdd:.3}],
    anglo:[{},{shingle:true},{rubble:true}],
    french:[{shutter:0x3a5a4a},{shutter:0x6a3a2a},{shutter:0x4a5a7a,wall:0xe8dcc0}],
    bavarian:[{shutter:0x2a5a2a},{shutter:0x7a2a1a},{shutter:0x2a3a6a,wall:0xf4ecd8}],
    mark:[{long:true,shingle:true},{long:true,turf:true},{long:true,shingle:true,wall:0x5a4430},{long:true,turf:true,wall:0x3e2e20}],
    aurenne:[{tile:true,shutter:0x3a6a9a},{tile:true,shutter:0x3a7a5a,wall:0xecc89a},{tile:true,shutter:0x8a4a3a,wall:0xf2d8c8},{tile:true,shutter:0x3a6a9a,wall:0xfaf6ee}],
    stone:[{tile:true},{tile:true,shutter:0x4a5a3a}],
    garrison:[{slate:true}]};
  let _houseN=0;
  function houseKey(st){for(const k in STYLE)if(STYLE[k]===st)return k;return null;}
  function buildingGeoHi(w,d,st0,r,opts,lo){
    const key=houseKey(st0)||opts.styleKey||'irish';const V=HOUSE_VARIANTS[key]||[{}];
    const r0=pRng((Math.round(w*7)*131+Math.round(d*7)*977+lo.wallHex+lo.roofHex*3+(_houseN++)*7919)>>>0);
    const st=Object.assign({},st0,V[Math.floor(r0()*V.length)%V.length]);if(key==='french'&&st.slate==null)st.slate=true;if(key==='bavarian'||key==='garrison')st.slate=true;
    const P=[];const c=x=>new THREE.Color(x);const add=(geo,col,x,y,z,rx,ry,rz,j)=>{P.push({geo,color:c(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});};
    const two=lo.two,H=(opts.h||st.h||2.6)+(two?2.2:0),pl=.3,fr=st.frame,dark=0x1e1a18;
    const wallC=st0.wall===st.wall?lo.wallHex:c(st.wall).lerp(c(st.wall2||st.wall),r0()*.4).getHex();
    const stoneC=st.plinth;
    add(new THREE.BoxGeometry(w+.2,pl,d+.2),stoneC,0,pl/2,0,0,0,0,.1);
    for(let i=0;i<Math.floor((w+d)*1.6);i++){const t=r0(),side=r0()<.5;const x=side?(t-.5)*w:(r0()<.5?-1:1)*(w/2+.08),z=side?(r0()<.5?-1:1)*(d/2+.08):(t-.5)*d;const s=.16+r0()*.14;
      add(SK.bumpy(SK.ball(s,6,4),.03,9,r0()*9),c(stoneC).multiplyScalar(.85+r0()*.3).getHex(),x,.12,z,0,r0()*3,0,.05);}
    add(new THREE.BoxGeometry(w,H,d),wallC,0,pl+H/2,0,0,0,0,.05);
    // rubble-stone walls (Celtic and upland variants): stones proud of the face in rough courses
    if(st.rubble)for(const fz of [1,-1])for(let y=pl+.25;y<pl+H-.2;y+=.42)for(let x=-w/2+.3+(Math.round(y*10)%2)*.25;x<w/2-.2;x+=.55+r0()*.2){if(fz>0&&Math.abs(x)<.75&&y<pl+2.1)continue;
      add(new THREE.BoxGeometry(.4+r0()*.16,.26+r0()*.08,.08),c(wallC).lerp(c(stoneC),.35).multiplyScalar(.68+r0()*.3).getHex(),x+(r0()-.5)*.08,y+(r0()-.5)*.05,fz*(d/2+.02),0,0,(r0()-.5)*.12,.06);}
    if(st.framed){for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])add(new THREE.BoxGeometry(.2,H,.2),fr,sx*w/2,pl+H/2,sz*d/2,0,0,0,.04);
      for(const fz of [1,-1]){for(const y of [pl+.08,pl+H-.08,two?pl+H-2.3:null])if(y!=null)add(new THREE.BoxGeometry(w+.04,.16,.08),fr,0,y,fz*(d/2+.03),0,0,0,.04);
        const n=Math.max(2,Math.round(w/1.1));for(let k=1;k<n;k++){const x=-w/2+k*w/n;if(Math.abs(x)<.7)continue;add(new THREE.BoxGeometry(.12,H,.07),fr,x,pl+H/2,fz*(d/2+.03),0,0,0,.04);}
        for(const sx of [-1,1]){const hh=Math.min(H,2.2)*.9,L=Math.hypot(w/n,hh);add(new THREE.BoxGeometry(.1,L,.06),fr,sx*(w/2-w/n/2),pl+Math.min(H,2.2)*.5,fz*(d/2+.035),0,0,sx*fz*Math.atan2(w/n,hh),.04);}}}
    if(two&&st.framed){add(new THREE.BoxGeometry(w+.5,.24,d+.5),fr,0,pl+H-2.25,0);for(let k=0;k<Math.round(w/.5);k++)add(new THREE.BoxGeometry(.12,.12,.3),fr,-w/2+.25+k*.5,pl+H-2.42,d/2+.15);}
    // the roof's numbers first: the windows are kept under its eaves (Michael: the Irish eaves covered the window heads)
    const rise=opts.rise||st.rise||1.6,thatch=!!(st.thatch||st.turf),over=thatch?.45:.55,run=d/2+over,slope=Math.atan2(rise,d/2),len=Math.hypot(run,rise*run/(d/2)),th=thatch?.46:.14;
    const yb=pl+H,eaveLow=yb-over*rise/(d/2)-th/2/Math.cos(slope);
    const win=(x,y,z,fz,wd,ht)=>{add(new THREE.BoxGeometry(wd,ht,.08),0x2a3038,x,y,z-fz*.06,0,0,0,0);add(new THREE.BoxGeometry(wd+.24,.1,.24),stoneC,x,y-ht/2-.05,z+fz*.04);add(new THREE.BoxGeometry(wd+.2,.12,.14),st.framed?fr:stoneC,x,y+ht/2+.06,z+fz*.02);
      add(new THREE.BoxGeometry(.05,ht,.06),fr,x,y,z-fz*.02);add(new THREE.BoxGeometry(wd,.05,.06),fr,x,y+.05,z-fz*.02);for(const s of [-1,1])add(new THREE.BoxGeometry(.06,ht,.1),fr,x+s*wd/2,y,z);
      if(st.shutter)for(const s of [-1,1])add(new THREE.BoxGeometry(wd/2,ht+.04,.05),st.shutter,x+s*(wd*.75+.06),y,z+fz*.03,0,s*fz*.25,0,.06);};
    const wh=.78,wy=Math.min(pl+Math.min(H,st.h||2.6)*.58,(two?yb-2.2:eaveLow)-.22-wh/2-.06),nw=st.long?3:2;
    for(let k=0;k<nw;k++){const x=(k-(nw-1)/2)*w/nw*1.05;if(Math.abs(x)<.8)continue;win(x,wy,d/2,1,.62,wh);}
    win(0,wy,-d/2,-1,.62,wh);if(two)for(const x of [-w*.28,0,w*.28])win(x,Math.min(pl+H-1.1,eaveLow-.22-.35-.06),d/2+(st.framed?.25:0),1,.56,.7);
    add(new THREE.BoxGeometry(1.2,2.05,.12),st.framed?fr:stoneC,0,pl+1.02,d/2+.01);add(new THREE.BoxGeometry(.92,1.85,.08),st.door||0x3e2a16,0,pl+.93,d/2-.02,0,0,0,.03);
    for(let k=-2;k<=2;k++)add(new THREE.BoxGeometry(.02,1.8,.02),c(st.door||0x3e2a16).multiplyScalar(.7).getHex(),k*.18,pl+.93,d/2+.025,0,0,0,0);
    for(const y of [.5,1.4])add(new THREE.BoxGeometry(.5,.05,.03),dark,-.18,pl+y,d/2+.03,0,0,0,0);add(SK.ball(.04,6,4),0x8a7a4a,.3,pl+.95,d/2+.05);
    add(new THREE.BoxGeometry(1.4,.16,.55),stoneC,0,.08,d/2+.35,0,0,0,.08);
    const rc=st0.roof===st.roof?lo.roofHex:c(st.roof).lerp(c(st.roof2||st.roof),r0()*.4).getHex();
    const turfC=0x5a7a3a;
    for(const s of [1,-1]){const cz=s*(run/2),cy=yb+rise/2-(over/(d/2))*rise/2;
      if(thatch){// a rounded, lumpy slab (it read as a board) with a rolled lip along the eaves
        const g=SK.bumpy(SK.rbox(w+over*2,th,len,.16,2),.05,7,s*3+r0()*5);add(g,st.turf?turfC:rc,0,cy,cz,s*slope,0,0,.07);
        const ex=-Math.cos(slope)*len/2,lipY=cy-Math.sin(slope)*len/2*1,lipZ=cz+s*Math.cos(slope)*len/2;
        add(SK.bumpy(SK.cyl(.2,.2,w+over*2,8),.03,9,s),st.turf?turfC:c(rc).multiplyScalar(.9).getHex(),0,lipY,lipZ,0,0,Math.PI/2,.06);}
      else{add(new THREE.BoxGeometry(w+over*2,th,len),c(rc).multiplyScalar(.8).getHex(),0,cy,cz,s*slope,0,0,.04);
        const rows=Math.round(len/(st.tile?.4:.26));for(let k=0;k<rows;k++){const t=(k+.5)/rows-.5;const y=cy-Math.sin(slope)*t*len+th*.6*Math.cos(slope),z=cz+s*Math.cos(slope)*t*len+s*th*.6*Math.sin(slope);
          if(st.tile){for(let q=0;q<Math.round((w+over*2)/.3);q++){const g=SK.cyl(.12,.12,.42,4,1,true,-Math.PI/2,Math.PI);add(g,c(rc).multiplyScalar(.85+r0()*.3).getHex(),-(w/2+over)+.15+q*.3,y,z,s*(Math.PI/2+slope),0,0,.05);}}
          else add(new THREE.BoxGeometry(w+over*2,.05,len/rows*1.08),c(rc).multiplyScalar(.82+r0()*.3).getHex(),0,y,z,s*slope,0,0,.08);}
        for(let k=0;k<Math.round((w+over*2)/.6);k++)add(new THREE.BoxGeometry(.1,.12,over+.1),fr,-(w/2+over)+.3+k*.6,yb-.08-(over/2)*rise/(d/2),s*(d/2+over/2),s*slope,0,0,.04);}}
    if(thatch)add(SK.bumpy(new THREE.CylinderGeometry(.44,.44,w+over*2+.3,10,1),.05,8,2),st.turf?turfC:c(st.roof2||st.roof).getHex(),0,yb+rise+.02,0,0,0,Math.PI/2,.05);
    else add(SK.cyl(.12,.12,w+over*2+.1,6),st.roof2||st.roof,0,yb+rise+.08,0,0,0,Math.PI/2,.04);
    for(const gx of [1,-1]){const gt=new THREE.Shape();gt.moveTo(-d/2,0);gt.lineTo(d/2,0);gt.lineTo(0,rise-.02);gt.closePath();add(new THREE.ShapeGeometry(gt),wallC,gx*(w/2+.001),yb,0,0,gx*Math.PI/2,0,.04);
      if(!thatch)for(const s of [1,-1]){const L=Math.hypot(run,rise*run/(d/2));add(new THREE.BoxGeometry(.06,.26,L),fr,gx*(w/2+over+.02),yb+rise/2-(over/(d/2))*rise/2+.06,s*run/2,s*slope,0,0,.04);}
      if(st.long)for(const s of [1,-1])add(new THREE.BoxGeometry(.08,.9,.14),fr,gx*(w/2+over+.02),yb+rise+.3,s*.18,s*.5,0,0,.04);}
    let chTop=null;if(opts.chimney){const chx=w*.3*(r0()<.5?1:-1),chz=-d*.18;for(let k=0;k<6;k++)add(new THREE.BoxGeometry(.56,.24,.56),c(stoneC).multiplyScalar(.85+r0()*.25).getHex(),chx,yb+rise*.4+k*.25,chz,0,(r0()-.5)*.08,0,.06);
      add(new THREE.BoxGeometry(.7,.1,.7),stoneC,chx,yb+rise*.4+1.55,chz);chTop=[chx,yb+rise*.4+1.62,chz];}
    // a lean-to against a gable end (it was a box): two posts, a sloping roof with thickness on a plate, plank walls
    // at the back and one side, a woodpile under it
    if(!opts.noYard&&r0()<.55){const s=r0()<.5?1:-1,lw=1.5,ld=Math.min(d*.8,3.2),lz=-d*.08,hi_=Math.min(2.1,H-.2),lo_=1.45,x0=s*w/2,x1=s*(w/2+lw);
      for(const z of [lz-ld/2+.1,lz+ld/2-.1])add(new THREE.BoxGeometry(.14,lo_,.14),fr,x1-s*.07,pl+lo_/2,z,0,0,0,.05);
      add(new THREE.BoxGeometry(.14,.14,ld),fr,x1-s*.07,pl+lo_,lz,0,0,0,.04);
      const ang=Math.atan2(hi_-lo_,lw),rl=Math.hypot(lw,hi_-lo_)+.25;add(new THREE.BoxGeometry(rl,.08,ld+.3),c(rc).multiplyScalar(.85).getHex(),(x0+x1)/2+s*.08,pl+(hi_+lo_)/2+.1,lz,0,0,-s*ang,.06);
      for(let k=0;k<Math.floor(lw/.3);k++)add(new THREE.BoxGeometry(.28,1.35,.05),c(0x6a4a2a).multiplyScalar(.8+r0()*.3).getHex(),x0+s*(.17+k*.3),pl+.68,lz-ld/2+.06,0,0,0,.05);
      for(let k=0;k<12;k++)add(SK.cyl(.08,.08,.8,6),0x7a5a3a,(x0+x1)/2+s*.1+(k%4)*.17*s-s*.3,pl+.1+Math.floor(k/4)*.15,lz+ld*.1,Math.PI/2,0,0,.1);}
    if(!opts.noYard&&r0()<.5){const x=(r0()<.5?1:-1)*(w/2-.6);for(let k=0;k<9;k++)add(SK.cyl(.08,.08,.7,6),0x7a5a3a,x+(k%3)*.17-.17,.1+Math.floor(k/3)*.15,d/2+.4,0,0,Math.PI/2,.1);}
    if(!opts.noYard&&r0()<.5)add(SK.lathe([[.001,0],[.25,0],[.28,.3],[.26,.6],[.001,.6]],10),0x6a4a2a,-w/2+.5,0,d/2+.45);
    const g=mergeParts(P,HAO);g.userData.variant=key;g.userData.thatch=thatch;g.userData.winTop=wy+wh/2+.12;g.userData.eaveLow=eaveLow;g.userData.chimney=chTop;return g;}
  function buildingGeo(w,d,st,r,opts){opts=opts||{};const lo=buildingGeoLo(w,d,st,r,opts);if(opts.plain)return lo;
    const hi=buildingGeoHi(w,d,st,r,opts,lo.userData.picks);hi.userData.lo=lo;return hi;}
  function buildingGeoLo(w,d,st,r,opts){
    const parts=[];const c=x=>new THREE.Color(x);
    const two=opts.twoStory!=null?opts.twoStory:(r()<(st.twoStory||0));
    const H=(opts.h||st.h||2.6)+(two?2.2:0), plinthH=.22;
    const wallC=c(st.wall).lerp(c(st.wall2),r()*.6);
    // stone plinth, slightly wider
    parts.push({geo:new THREE.BoxGeometry(w+.12,plinthH+.3,d+.12),color:c(st.plinth),y:plinthH/2-.15,jitter:.10});
    // body
    parts.push({geo:new THREE.BoxGeometry(w,H,d),color:wallC,y:plinthH+H/2,jitter:.05});
    // timber framing: corner posts + a mid rail
    if(st.framed||opts.framed){
      const fc=c(st.frame);
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>parts.push({geo:new THREE.BoxGeometry(.16,H,.16),color:fc,x:sx*(w/2),z:sz*(d/2),y:plinthH+H/2,jitter:.04}));
      parts.push({geo:new THREE.BoxGeometry(w+.02,.12,d+.02),color:fc,y:plinthH+H*.55,jitter:.04});
    }
    // jetty band between storeys
    if(two){parts.push({geo:new THREE.BoxGeometry(w+.3,.22,d+.3),color:c(st.frame),y:plinthH+H-2.2,jitter:.04});
      [-w*.28,w*.28].forEach(wx=>{parts.push({geo:new THREE.BoxGeometry(.6,.7,.08),color:c(0x2a2622),x:wx,y:plinthH+H-1.1,z:d/2+.02,jitter:0});});}
    // gable roof: a triangular prism along x (ridge along x), with eaves
    const rise=opts.rise||st.rise||1.6, over=st.thatch?.7:.45;
    const tri=new THREE.Shape();tri.moveTo(-(d/2+over),0);tri.lineTo(d/2+over,0);tri.lineTo(0,rise);tri.closePath();
    const roofG=new THREE.ExtrudeGeometry(tri,{depth:w+over*2,bevelEnabled:false});
    // extrude is along +z; rotate so the ridge runs along x
    const roofC=c(st.roof).lerp(c(st.roof2),r()*.5);parts.push({geo:roofG,color:roofC,x:-(w/2+over),y:plinthH+H-.05,z:0,ry:Math.PI/2,jitter:.08});
    // ridge beam (thatch gets a thick rounded ridge cap instead)
    if(st.thatch)parts.push({geo:new THREE.CylinderGeometry(.34,.34,w+over*2+.2,7),color:c(st.roof2),y:plinthH+H+rise-.1,rz:Math.PI/2,jitter:.08});
    else parts.push({geo:new THREE.BoxGeometry(w+over*2+.1,.14,.22),color:c(st.roof2),y:plinthH+H+rise-.05,jitter:.05});
    // stone city blocks: cornice band under the eaves
    if(st===STYLE.stone)parts.push({geo:new THREE.BoxGeometry(w+.25,.18,d+.25),color:c(st.plinth),y:plinthH+H-.1,jitter:.04});
    // chimney
    if(opts.chimney){parts.push({geo:new THREE.BoxGeometry(.5,1.3,.5),color:c(st.plinth),x:w*.3,y:plinthH+H+rise*.5+.5,z:d*.2,jitter:.08});}
    // windows: two dark insets on the front face (+z), one on the back
    const winC=c(0x2a2622);
    [-w*.28,w*.28].forEach(wx=>{parts.push({geo:new THREE.BoxGeometry(.6,.7,.08),color:winC,x:wx,y:plinthH+H*.6,z:d/2+.02,jitter:0});});
    parts.push({geo:new THREE.BoxGeometry(.6,.7,.08),color:winC,x:0,y:plinthH+H*.6,z:-d/2-.02,jitter:0});
    // door on the front face (+z)
    parts.push({geo:new THREE.BoxGeometry(.9,1.7,.1),color:c(st.door||0x3e2a16),x:0,y:plinthH+.85,z:d/2+.03,jitter:.04});
    parts.push({geo:new THREE.BoxGeometry(1.1,.14,.16),color:c(st.frame),x:0,y:plinthH+1.78,z:d/2+.04,jitter:0});
    const g=mergeParts(parts);g.userData.picks={wallHex:wallC.getHex(),roofHex:roofC.getHex(),two};return g;
  }
  // ── S195: churches and keeps in detail (H.5, Michael's A: buildings and structures, with a distant copy) ──
  // The old builders stay as the distant copies; neither took the town's dice, so the detailed ones roll their own.
  let _civN=0;
  function churchGeoHi(w,d,st){const r0=pRng((Math.round(w*13)+Math.round(d*29)*7+(_civN++)*7919)>>>0);const P=[];const c=x=>new THREE.Color(x);
    const add=(geo,col,x,y,z,rx,ry,rz,j)=>{P.push({geo,color:c(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});};
    const S=STYLE.stone,wallC=c(S.wall).lerp(c(S.wall2),r0()*.4).getHex(),dk=c(wallC).multiplyScalar(.82).getHex(),roofC=S.roof,H=4.2,b=.5;
    // stepped plinth
    add(new THREE.BoxGeometry(w+.6,.28,d+.6),st.plinth,0,.14,0,0,0,0,.08);add(new THREE.BoxGeometry(w+.3,.3,d+.3),st.plinth,0,.4,0,0,0,0,.08);
    add(new THREE.BoxGeometry(w,H,d),wallC,0,b+H/2,0);
    // string course and cornice; quoins up every corner
    add(new THREE.BoxGeometry(w+.14,.12,d+.14),dk,0,b+H*.42,0);add(new THREE.BoxGeometry(w+.3,.22,d+.3),dk,0,b+H-.05,0);
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])for(let k=0;k<Math.floor(H/.45);k++){const L=k%2?.5:.32;add(new THREE.BoxGeometry(k%2?L:.34,.4,k%2?.34:L),c(wallC).multiplyScalar(1.05+r0()*.1).getHex(),sx*(w/2-(k%2?L/2-.14:0)),b+.22+k*.45,sz*(d/2-(k%2?0:L/2-.14)),0,0,0,.04);}
    // buttresses along the sides, stepped back twice, and lancet windows between them
    const nb=Math.max(2,Math.round(d/2.6));for(let k=0;k<=nb;k++){const z=-d/2+k*d/nb;if(Math.abs(z)>d/2-.2&&k>0&&k<nb)continue;
      for(const sx of [-1,1]){add(new THREE.BoxGeometry(.6,H*.62,.5),dk,sx*(w/2+.3),b+H*.31,z,0,0,0,.05);add(new THREE.BoxGeometry(.4,H*.3,.46),dk,sx*(w/2+.2),b+H*.62+H*.15,z,0,0,0,.05);add(new THREE.BoxGeometry(.62,.1,.52),S.plinth,sx*(w/2+.3),b+H*.62,z,0,0,-sx*.4);}
      if(k<nb)for(const sx of [-1,1]){const zc=z+d/nb/2;add(new THREE.BoxGeometry(.08,1.7,.48),0x2a2a36,sx*(w/2+.01),b+H*.55,zc,0,0,0,0);add(SK.cone(.3,.5,4),0x2a2a36,sx*(w/2+.01),b+H*.55+1.1,zc,0,Math.PI/4,0,0);
        add(new THREE.BoxGeometry(.14,.1,.6),S.plinth,sx*(w/2+.05),b+H*.55-.9,zc);}}
    // the roof: two slabs with thickness, courses of slate, a ridge
    const rise=2.4,over=.4,run=w/2+over,slope=Math.atan2(rise,w/2),len=Math.hypot(run,rise*run/(w/2)),yb=b+H;
    for(const s of [1,-1]){const cx=s*run/2,cy=yb+rise/2-(over/(w/2))*rise/2;add(new THREE.BoxGeometry(len,.16,d+over*2),c(roofC).multiplyScalar(.8).getHex(),cx,cy,0,0,0,-s*slope,.04);
      const rows=Math.round(len/.32);for(let k=0;k<rows;k++){const t=(k+.5)/rows-.5;add(new THREE.BoxGeometry(len/rows*1.08,.05,d+over*2),c(roofC).multiplyScalar(.82+r0()*.3).getHex(),cx+s*Math.cos(slope)*t*len-s*.1*Math.sin(slope),cy-Math.sin(slope)*t*len+.1*Math.cos(slope),0,0,0,-s*slope,.06);}}
    add(SK.cyl(.13,.13,d+over*2+.1,6),S.roof2,0,yb+rise+.08,0,Math.PI/2,0,0,.04);
    for(const gz of [1,-1]){const gt=new THREE.Shape();gt.moveTo(-w/2,0);gt.lineTo(w/2,0);gt.lineTo(0,rise-.02);gt.closePath();add(new THREE.ShapeGeometry(gt),wallC,0,yb,gz*(d/2+.001),0,gz>0?0:Math.PI,0,.04);}
    // the west front: a rose window, a gabled porch with an arch over the door, and a cross on the gable
    add(new THREE.CylinderGeometry(.6,.6,.1,14),0x2a2a36,0,yb+.7,d/2+.02,Math.PI/2,0,0,0);add(SK.torus(.62,.08,6,16),S.plinth,0,yb+.7,d/2+.05,0,0,0);
    for(let k=0;k<6;k++)add(new THREE.BoxGeometry(.04,1.1,.04),S.plinth,0,yb+.7,d/2+.06,0,0,k*Math.PI/6,0);
    const pw=2.2,pd=1.3,ph=2.8;add(new THREE.BoxGeometry(pw,ph,pd),wallC,0,b+ph/2,d/2+pd/2);
    const pg=new THREE.Shape();pg.moveTo(-pw/2-.15,0);pg.lineTo(pw/2+.15,0);pg.lineTo(0,1.1);pg.closePath();add(new THREE.ExtrudeGeometry(pg,{depth:pd+.2,bevelEnabled:false}),S.roof,0,b+ph,d/2-.1,0,0,0,.05);
    add(new THREE.BoxGeometry(1.2,1.9,.1),0x3e2a16,0,b+.95,d/2+pd+.01,0,0,0,.03);add(SK.torus(.6,.1,6,12,Math.PI),S.plinth,0,b+1.9,d/2+pd+.04,0,0,0,.04);
    add(new THREE.BoxGeometry(.12,.9,.12),0x8a7a5a,0,yb+rise+.5,d/2-.1);add(new THREE.BoxGeometry(.5,.12,.12),0x8a7a5a,0,yb+rise+.68,d/2-.1);
    // the bell tower at the east end: quoined, a belfry with an opening each way, a cornice, a slated spire and a cross
    const tz=-d/2+1.1,TH=H+3.2,tw=2.4;add(new THREE.BoxGeometry(tw,TH,tw),c(wallC).multiplyScalar(.95).getHex(),0,b+TH/2,tz);
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])add(new THREE.BoxGeometry(.3,TH,.3),dk,sx*tw/2,b+TH/2,tz+sz*tw/2,0,0,0,.05);
    for(let q=0;q<4;q++){const a=q*Math.PI/2,ox=Math.sin(a)*(tw/2+.01),oz=Math.cos(a)*(tw/2+.01);add(new THREE.BoxGeometry(.7,1.2,.1),0x16141a,ox,b+TH-1,tz+oz,0,a,0,0);add(SK.cone(.35,.4,4),0x16141a,ox,b+TH-.2,tz+oz,0,a+Math.PI/4,0,0);}
    add(new THREE.BoxGeometry(tw+.4,.25,tw+.4),dk,0,b+TH+.1,tz);add(SK.cone(1.75,4.2,8),S.roof2,0,b+TH+.2+2.1,tz,0,Math.PI/8,0,.05);
    add(new THREE.BoxGeometry(.12,1.1,.12),0x8a7a5a,0,b+TH+4.8,tz);add(new THREE.BoxGeometry(.6,.12,.12),0x8a7a5a,0,b+TH+5.0,tz);
    // a few graves in the yard
    for(let k=0;k<4;k++)if(r0()<.7){const gx=(r0()<.5?-1:1)*(w/2+1.4+r0()*.8),gz=-d/2+1+r0()*(d-2);add(SK.rbox(.5,.8,.14,.08,2),0x7a7a74,gx,.4,gz,0,Math.PI/2+(r0()-.5)*.3,(r0()-.5)*.15,.08);}
    return mergeParts(P);}
  function keepGeoHi(w,d,st){const r0=pRng((Math.round(w*17)+Math.round(d*31)*5+(_civN++)*104729)>>>0);const P=[];const c=x=>new THREE.Color(x);
    const add=(geo,col,x,y,z,rx,ry,rz,j)=>{P.push({geo,color:c(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});};
    const S=STYLE.stone,wallC=S.wall,w2=S.wall2,dk=c(w2).multiplyScalar(.85).getHex(),H=6.5,b=.35;
    // a battered base (the wall's foot splays out), the wall, courses of stone proud of it
    add(new THREE.CylinderGeometry(Math.hypot(w,d)/2*.72,Math.hypot(w,d)/2*.78,1.2,4,1),dk,0,.25,0,0,Math.PI/4,0,.06);
    add(new THREE.BoxGeometry(w+.5,1,d+.5),dk,0,.2,0,0,0,0,.08);add(new THREE.BoxGeometry(w,H,d),wallC,0,b+H/2,0);
    for(let y=b+.6;y<b+H;y+=.55)add(new THREE.BoxGeometry(w+.06,.06,d+.06),dk,0,y,0,0,0,0,.03);
    // a machicolated parapet all round: corbels, the walk's overhang, merlons on every side
    const top=b+H;for(const [lx,lz,L,ax] of [[0,d/2,w,1],[0,-d/2,w,1],[w/2,0,d,0],[-w/2,0,d,0]]){const n=Math.floor(L/.8);
      for(let k=0;k<n;k++){const t=-L/2+.4+k*L/n;const x=ax?t:lx,z=ax?lz:t;add(new THREE.BoxGeometry(.3,.5,.3),dk,x+(ax?0:Math.sign(lx)*.2),top-.2,z+(ax?Math.sign(lz)*.2:0),0,0,0,.05);}
      add(new THREE.BoxGeometry(ax?L+.6:.5,.7,ax?.5:L+.6),w2,lx+(ax?0:Math.sign(lx)*.25),top+.3,lz+(ax?Math.sign(lz)*.25:0));
      for(let k=0;k<Math.floor(L/1.2);k++){const t=-L/2+.6+k*1.2;add(new THREE.BoxGeometry(ax?.7:.5,.7,ax?.5:.7),w2,ax?t:lx+Math.sign(lx)*.25,top+1,ax?lz+Math.sign(lz)*.25:t,0,0,0,.05);}}
    // corner towers: round, a battered foot, arrow slits, a corbelled ring and a conical cap with a finial
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=sx*w/2,z=sz*d/2,TH=H+2.2;add(new THREE.CylinderGeometry(1.4,1.75,1.4,10),dk,x,.5,z,0,0,0,.05);
      add(new THREE.CylinderGeometry(1.4,1.5,TH,12),w2,x,.8+TH/2,z,0,0,0,.05);add(new THREE.CylinderGeometry(1.7,1.45,.5,12),dk,x,.8+TH+.1,z);
      for(let q=0;q<3;q++){const a=Math.atan2(sz,sx)+(q-1)*.9;add(new THREE.BoxGeometry(.12,.8,.1),0x14121a,x+Math.cos(a)*1.46,2+q*1.6,z+Math.sin(a)*1.46,0,-a+Math.PI/2,0,0);}
      add(SK.cone(1.85,2.4,12),S.roof2,x,.8+TH+.35+1.2,z,0,0,0,.05);add(SK.ball(.14,6,4),0x8a7a4a,x,.8+TH+.35+2.45,z);}
    // arrow slits in the curtain, the gate: a round arch, a portcullis, a stone surround
    for(const fz of [1,-1])for(let k=-1;k<=1;k++){if(fz>0&&k===0)continue;add(new THREE.BoxGeometry(.12,.9,.1),0x14121a,k*w/3.2,b+H*.6,fz*(d/2+.01),0,0,0,0);}
    add(new THREE.BoxGeometry(2.4,3.3,.3),dk,0,.8+1.65,d/2+.08);add(new THREE.BoxGeometry(1.6,2.6,.2),0x1a140e,0,.8+1.3,d/2+.15);add(SK.torus(.82,.14,6,14,Math.PI),w2,0,.8+2.6,d/2+.22);
    for(let k=-3;k<=3;k++)add(new THREE.BoxGeometry(.05,2.2,.05),0x3a3a3a,k*.22,.8+1.5,d/2+.28,0,0,0,0);for(let k=0;k<5;k++)add(new THREE.BoxGeometry(1.5,.05,.05),0x3a3a3a,0,.8+.6+k*.45,d/2+.28,0,0,0,0);
    // a flag pole on the roof
    add(SK.cyl(.06,.06,3.2,5),0x4a3018,w*.2,top+1.6,-d*.2);add(new THREE.BoxGeometry(1.1,.7,.03),0x8a2a2a,w*.2+.58,top+2.8,-d*.2,0,0,0,.08);
    return mergeParts(P);}
  function churchGeo(w,d,st,r){const lo=churchGeoLo(w,d,st,r);const hi=churchGeoHi(w,d,st);hi.userData.lo=lo;return hi;}
  function churchGeoLo(w,d,st,r){
    const parts=[];const c=x=>new THREE.Color(x);
    const H=4.2;
    parts.push({geo:new THREE.BoxGeometry(w+.3,.5,d+.3),color:c(st.plinth),y:.25,jitter:.1});
    parts.push({geo:new THREE.BoxGeometry(w,H,d),color:c(STYLE.stone.wall),y:.5+H/2,jitter:.06});
    const rise=2.2,over=.4;
    const tri=new THREE.Shape();tri.moveTo(-(w/2+over),0);tri.lineTo(w/2+over,0);tri.lineTo(0,rise);tri.closePath();
    parts.push({geo:new THREE.ExtrudeGeometry(tri,{depth:d+over*2,bevelEnabled:false}),color:c(STYLE.stone.roof),x:0,y:.5+H-.05,z:-(d/2+over),jitter:.08});
    // bell tower at the back
    parts.push({geo:new THREE.BoxGeometry(2.2,H+3.2,2.2),color:c(STYLE.stone.wall2),x:0,y:.5+(H+3.2)/2,z:-d/2+1.1,jitter:.06});
    parts.push({geo:new THREE.ConeGeometry(1.7,2.2,4),color:c(STYLE.stone.roof2),x:0,y:.5+H+3.2+1.1,z:-d/2+1.1,ry:Math.PI/4,jitter:.06});
    // tall arched-ish windows
    [-w*.3,w*.3].forEach(wx=>{parts.push({geo:new THREE.BoxGeometry(.6,1.8,.08),color:c(0x3a3020),x:wx,y:.5+H*.55,z:d/2+.02,jitter:0});});
    parts.push({geo:new THREE.BoxGeometry(1.2,2.2,.12),color:c(0x3e2a16),x:0,y:.5+1.1,z:d/2+.03,jitter:.04});
    return mergeParts(parts);
  }
  function keepGeo(w,d,st,r){const lo=keepGeoLo(w,d,st,r);const hi=keepGeoHi(w,d,st);hi.userData.lo=lo;return hi;}
  function keepGeoLo(w,d,st,r){
    const parts=[];const c=x=>new THREE.Color(x);
    const H=6.5;
    parts.push({geo:new THREE.BoxGeometry(w+.3,.9,d+.3),color:c(st.plinth),y:-.1,jitter:.1}); // mostly buried
    parts.push({geo:new THREE.BoxGeometry(w,H,d),color:c(STYLE.stone.wall),y:.35+H/2,jitter:.05});
    parts.push({geo:new THREE.BoxGeometry(w+.4,.5,d+.4),color:c(STYLE.stone.wall2),y:.8+H+.25,jitter:.05});
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
      parts.push({geo:new THREE.CylinderGeometry(1.4,1.6,H+2.2,8),color:c(STYLE.stone.wall2),x:sx*w/2,z:sz*d/2,y:.8+(H+2.2)/2,jitter:.05});
      parts.push({geo:new THREE.ConeGeometry(1.7,1.8,8),color:c(STYLE.stone.roof2),x:sx*w/2,z:sz*d/2,y:.8+H+2.2+.9,jitter:.05});
    });
    for(let i=0;i<Math.floor(w/1.6);i++){parts.push({geo:new THREE.BoxGeometry(.7,.7,.5),color:c(STYLE.stone.wall),x:-w/2+1+i*1.6,y:.8+H+.85,z:d/2,jitter:.05});}
    parts.push({geo:new THREE.BoxGeometry(1.6,2.6,.2),color:c(0x2e2016),x:0,y:.8+1.3,z:d/2+.05,jitter:.03});
    return mergeParts(parts);
  }
  function tentGeoLo(r){
    const parts=[];const c=x=>new THREE.Color(x);
    const tc=c(0xa89878).lerp(c(0x8a7a5a),r());parts.push({geo:new THREE.ConeGeometry(2.4,2.8,5,1,false),color:tc,y:1.4,jitter:.08});parts.tc=tc.getHex();
    parts.push({geo:new THREE.CylinderGeometry(.06,.06,3,5),color:c(0x4a3018),y:1.5});
    const g=mergeParts(parts);g.userData.picks={tc:parts.tc};return g;
  }
  function stallGeoLo(r){
    const parts=[];const c=x=>new THREE.Color(x);
    const cloth=pick(r,[0x9a3a2a,0x2a5a8a,0x8a7a2a,0x4a7a3a,0x7a3a6a]);const goods=[];
    [[-1.4,-.9],[1.4,-.9],[-1.4,.9],[1.4,.9]].forEach(([x,z])=>parts.push({geo:new THREE.BoxGeometry(.12,2.2,.12),color:c(0x5a3d1e),x,z,y:1.1}));
    parts.push({geo:new THREE.BoxGeometry(3.2,.08,2.2),color:c(cloth),y:2.25,jitter:.1});
    parts.push({geo:new THREE.BoxGeometry(3.0,.9,.9),color:c(0x6a4a2a),y:.45,z:.5,jitter:.06});
    for(let i=0;i<3;i++){const gc=pick(r,[0xc8a040,0x8a3a2a,0x5a8a3a,0xd8d0b0,0x6a4a8a]);goods.push(gc);parts.push({geo:new THREE.BoxGeometry(.5,.35,.4),color:c(gc),x:-1+i*1,y:1.05,z:.5,jitter:.1});}
    const g=mergeParts(parts);g.userData.picks={cloth,goods};return g;
  }
  function wellGeoLo(){
    const parts=[];const c=x=>new THREE.Color(x);
    parts.push({geo:new THREE.CylinderGeometry(1.1,1.2,1.0,10),color:c(0x7a746a),y:.5,jitter:.1});
    parts.push({geo:new THREE.CylinderGeometry(.75,.75,1.02,10),color:c(0x1a2028),y:.5});
    [[-1,0],[1,0]].forEach(([x])=>parts.push({geo:new THREE.BoxGeometry(.14,2.4,.14),color:c(0x5a3d1e),x:x*.9,y:1.2}));
    parts.push({geo:new THREE.BoxGeometry(2.2,.12,.14),color:c(0x5a3d1e),y:2.4});
    parts.push({geo:new THREE.BoxGeometry(2.6,.5,1.6),color:c(0x6b5a3a),y:2.7,jitter:.06});
    return mergeParts(parts);
  }
  function ruinGeoLo(r){
    const parts=[];const c=x=>new THREE.Color(x);
    const n=2+Math.floor(r()*3);
    const picks=[];for(let i=0;i<n;i++){const w=2+r()*4,h=.6+r()*2.4,col=c(0x6a6258).lerp(c(0x4a443c),r()),x=(r()-.5)*5,z=(r()-.5)*5,ry=r()*Math.PI;picks.push({w,h,col:col.getHex(),x,z,ry});parts.push({geo:new THREE.BoxGeometry(w,h,.6),color:col,x,z,y:.6,ry,jitter:.12});}
    const g=mergeParts(parts);g.userData.picks=picks;return g;
  }
  function standingStoneGeoLo(r){
    const w=.9+r()*.6,h=2.6+r()*1.8,ry=r()*.6,rz=(r()-.5)*.15;const g=mergeParts([{geo:new THREE.BoxGeometry(w,h,.6),color:new THREE.Color(0x5a5852),y:1.6,ry,rz,jitter:.12}]);g.userData.picks={w,h,ry,rz};return g;
  }
  // ── S203: the town's furniture and the POIs' structures in detail (H.5, Michael's A), each with its old self as the
  // distant copy. The old builders take the town's dice as before and report what they picked; the detailed ones
  // follow those picks (a ruin's walls stand where they stood) and roll the rest on their own dice.
  // ── S249: a town's walls and gate towers in detail (H.5, Michael's A), the old boxes as the distant copy. A wall
  // segment is built along local x (len long, the outer face at -z), its foot at 0 in the middle; gA and gB are the
  // ground at its two ends against the middle, so posts, logs and footings follow a slope where the box floated.
  function wallSegHi(WT,len,H,d,wallC,capC,gA,gB,rr,noButt){const P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+rr()*a*2).getHex(),gAt=x=>gA+(gB-gA)*(x/len+.5),foot=Math.min(0,gA,gB)-.5,slope=Math.atan2(gB-gA,len);
    const wc=wallC.getHex(),cc=capC.getHex();
    if(WT==='fence'){const n=Math.max(2,Math.round(len/2.4));for(let i=0;i<=n;i++){const x=-len/2+i*len/n,g=gAt(x);add(SK.cyl(.065,.085,1.6,6),vary(cc,.12),x,g+.5,0,(rr()-.5)*.06,0,(rr()-.5)*.06,.04);}
      for(let i=0;i<n;i++){const x0=-len/2+i*len/n,x1=x0+len/n,g0=gAt(x0),g1=gAt(x1),L=Math.hypot(x1-x0,g1-g0);for(const h of [.55,1.05])add(SK.cyl(.045,.05,L,5),vary(wc,.12),(x0+x1)/2,(g0+g1)/2+h-.03*rr(),(rr()-.5)*.04,0,0,Math.atan2(g1-g0,x1-x0)-Math.PI/2,.04);}
      return mergeParts(P);}
    if(WT==='logs'){for(let x=-len/2+.22;x<len/2;x+=.44){const g=gAt(x),top=H+(rr()-.5)*.45,b=g-.4,rad=.2+rr()*.04;add(SK.cyl(rad,rad*1.05,top-b,6,1,true),vary(wc,.14),x,(top+b)/2,0,0,rr()*3,0,.05);add(SK.cone(rad,.55,6,1,true),vary(wc,.1),x,top+.27,0,0,rr()*3,0,.05);}
      for(const h of [1.0,2.4])add(SK.cyl(.13,.13,len,6),vary(cc,.08),0,(gA+gB)/2+h,.36,0,0,slope-Math.PI/2,.04);
      return mergeParts(P);}
    const dressed=WT==='dressed',plinth=dressed?1.0:1.2;
    add(new THREE.BoxGeometry(len,plinth-foot,d+.5),new THREE.Color(wc).multiplyScalar(.82).getHex(),0,(plinth+foot)/2,0,0,0,0,.05);
    add(new THREE.BoxGeometry(len,.2,d+.3),new THREE.Color(wc).multiplyScalar(.9).getHex(),0,plinth+.02,0,.0,0,0,.04);
    add(new THREE.BoxGeometry(len-.02,H-plinth,d-.08),0x4e4940,0,(H+plinth)/2,0,0,0,0,.03);
    // courses of blocks laid broken-joint on the mortar core: rubble uneven and mottled, ashlar even and pale
    for(let y=plinth+.1;y<H-.05;){const ch=Math.min(H-y,dressed?.5:.5+rr()*.3);let x=-len/2;
      while(x<len/2-.05){const bl=Math.min(len/2-x,dressed?1.3+rr()*.5:1.0+rr()*1.4);const inset=dressed?0:(rr()-.5)*.08;add(new THREE.BoxGeometry(bl-.06,ch-.05,d+inset),vary(wc,dressed?.06:.16),x+bl/2,y+ch/2,0,0,0,0,.05);x+=bl;}y+=ch;}
    if(!dressed){const nb=noButt?0:Math.max(1,Math.round(len/7));for(let i=0;i<nb;i++){const x=-len/2+(i+.5)*len/nb,g=Math.min(0,gAt(x))-.4,bh=H*.72-g;add(SK.rbox(.9,bh,.8,.06,1),vary(wc,.08),x,g+bh/2,-d/2-.35,0,0,0,.05);add(new THREE.BoxGeometry(.9,.5,.6),vary(cc,.06),x,H*.72+.1,-d/2-.28,-.6,0,0,.04);}}
    else{add(SK.rbox(len,.2,d+.24,.06,1),cc,0,H-1.4,0,0,0,0,.03);for(let x=-len/2+.5;x<len/2-.2;x+=1.0)add(new THREE.BoxGeometry(.28,.4,.34),vary(cc,.05),x,H-.2,-d/2-.12,0,0,0,.03);}
    // the parapet on the outer edge, crenellated: merlons and embrasures along the whole run
    const pz=-d/2+(dressed?-.08:.2),pd=dressed?.5:.42;add(new THREE.BoxGeometry(len,.35,pd),vary(cc,.05),0,H+.17,pz,0,0,0,.04);
    for(let x=-len/2+.55;x<len/2-.4;x+=dressed?1.6:1.8)add(SK.rbox(dressed?.95:1.0,.8,pd,.06,1),vary(cc,.08),x,H+.35+.4,pz,0,0,0,.05);
    return mergeParts(P);}
  // a gate tower: a timber watchtower beside a palisade; a coursed round tower with slits, a crenellated top and a
  // slated cone beside stone. y 0 at its foot, as the old tower.
  function gateTowerHi(WT,H,capC,roofC,rr){const P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+rr()*a*2).getHex(),cc=capC.getHex(),rc=roofC.getHex();
    if(WT==='logs'){const T=H+1.2;for(const [x,z] of [[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]])add(SK.cyl(.14,.16,T+.6,6),vary(0x5a4222,.1),x,T/2-.3,z,0,0,0,.05);
      for(const s of [-1,1]){add(SK.cyl(.06,.06,2.0,5),0x4a3418,s*.8,T*.35,0,.72*s,0,0,.04);add(SK.cyl(.06,.06,2.0,5),0x4a3418,0,T*.35,s*.8,0,0,.72*s,.04);}
      add(new THREE.BoxGeometry(2.1,.14,2.1),0x4a3418,0,T-1.6,0);for(let k=0;k<7;k++){const o=-.9+k*.3;for(const [x,z,ry] of [[o,-.98,0],[o,.98,0],[-.98,o,Math.PI/2],[.98,o,Math.PI/2]])add(new THREE.BoxGeometry(.28,1.1,.07),vary(0x6a5030,.1),x,T-1.0,z,0,ry,0,.05);}
      add(SK.cone(1.75,1.3,4),vary(rc,.06),0,T+.65,0,0,Math.PI/4,0,.05);add(SK.cyl(.05,.05,.6,4),0x3a2a1a,0,T+1.5,0);return mergeParts(P);}
    const dressed=WT==='dressed',R0=dressed?2.1:1.8,R1=dressed?2.3:2.0,T=H+2.4;
    add(new THREE.CylinderGeometry(R1+.05,R1+.4,1.6,16),new THREE.Color(cc).multiplyScalar(.85).getHex(),0,.3,0);
    add(new THREE.CylinderGeometry(R0,R1,T,16,4),cc,0,T/2,0,0,0,0,.08);
    for(let y=1.6;y<T-.8;y+=1.3){const rr2=R1-(R1-R0)*(y/T);add(SK.torus(rr2+.01,.05,3,16),new THREE.Color(cc).multiplyScalar(.8).getHex(),0,y,0,Math.PI/2,0,0,.03);}
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2+rr()*.6,y=2.2+i*1.3,rr2=R1-(R1-R0)*(y/T)+.02;if(y>T-1.2)continue;add(new THREE.BoxGeometry(.16,.8,.12),0x14141a,Math.sin(a)*rr2,y,Math.cos(a)*rr2,0,a,0,0);}
    add(new THREE.CylinderGeometry(R0+.35,R0,.5,16),new THREE.Color(cc).multiplyScalar(.92).getHex(),0,T-.15,0);add(new THREE.CylinderGeometry(R0+.35,R0+.35,.3,16),cc,0,T+.25,0);
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2;add(SK.rbox(.9,.7,.4,.06,1),vary(cc,.06),Math.sin(a)*(R0+.18),T+.75,Math.cos(a)*(R0+.18),0,a,0,.05);}
    for(let k=0;k<5;k++){const r1=(R0+.1)*(1-k/5),r2=(R0+.1)*(1-(k+1)/5);add(new THREE.CylinderGeometry(Math.max(.04,r2),r1,.62,16,1,true),vary(rc,.08),0,T+.4+k*.6+.31,0,0,0,0,.05);}
    add(SK.cyl(.05,.05,.8,4),0x8a7a4a,0,T+3.6,0);add(SK.ball(.12,6,5),0xc8a850,0,T+4.0,0);
    return mergeParts(P);}
  // S275 — the town gate between the gate towers (Michael, 28 Sep: A, the Session 273 prototype). In the wall segment's frame:
  // x along the wall, +z into the town, y 0 at the road. Stone and dressed stone: an arch of seventeen voussoirs from jamb to
  // jamb, the spandrels filled, a wall-walk with merlons over it. Palisade and fence: a braced timber lintel on two posts. In
  // both, two plank leaves with iron bands and a brace stand open against the inside (nothing shuts a town's gate yet).
  // `inner` is the jambs' distance from the road's middle; the leaves come back in userData.leaves for their colliders.
  function townGateGeo(WT,inner,H,d,wallC,capC,rr){const P=[],L=[];const add=(geo,col,x,y,z,rx,ry,rz,j,sx)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j,sx});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+rr()*a*2).getHex(),wc=wallC.getHex(),cc=capC.getHex();
    const stone=WT==='stone'||WT==='dressed',timberH=Math.max(H,2.4);let lh,hz,LO;
    if(stone){const span=inner,rise=2.2,spring=H-1.4-rise*.3,crown=spring+rise,top=H+1.2;
      for(let k=0;k<=16;k++){const a=k/16*Math.PI;add(SK.rbox(.55,.8,d+.2,.06,1),new THREE.Color(wc).multiplyScalar(k%2?.92:1).getHex(),Math.cos(a)*span,spring+Math.sin(a)*rise,0,0,0,a-Math.PI/2,.05,k===8?1.3:1);}
      for(let y=spring+.3;y<crown+.1;y+=.5){const e=Math.min(1,(y-spring)/rise),xa=span*Math.sqrt(1-e*e)+.35,w=span+.3-xa;if(w>.1)for(const s of [-1,1])add(new THREE.BoxGeometry(w,.5,d),vary(wc,.12),s*(xa+w/2),y,0);}
      add(new THREE.BoxGeometry(span*2+.6,top-crown+.2,d),vary(cc,.04),0,(crown-.2+top)/2,0,0,0,0,.04);
      add(new THREE.BoxGeometry(span*2+.8,.2,d+.2),new THREE.Color(cc).multiplyScalar(.9).getHex(),0,top+.02,0,0,0,0,.03);
      for(let x=-span+.3;x<span;x+=1.8)add(SK.rbox(1.0,.8,.45,.06,1),vary(cc,.06),x,top+.5,-d/2+.2,0,0,0,.05);
      for(const s of [-1,1])add(new THREE.BoxGeometry(.6,spring+1,d+.2),new THREE.Color(wc).multiplyScalar(.95).getHex(),s*(span-.3),(spring-1)/2,0);
      lh=WT==='dressed'?3.6:3.4;hz=d/2+.15;
      LO=[{geo:new THREE.BoxGeometry(.6,spring+1,d+.2),color:new THREE.Color(wc),x:-(span-.3),y:(spring-1)/2},{geo:new THREE.BoxGeometry(.6,spring+1,d+.2),color:new THREE.Color(wc),x:span-.3,y:(spring-1)/2},{geo:new THREE.BoxGeometry(span*2+.6,top-spring,d),color:new THREE.Color(cc),y:(spring+top)/2}];}
    else{const span=inner,T=timberH;
      for(const s of [-1,1])add(SK.cyl(.2,.22,T+2.6,7),vary(0x5a4222,.08),s*span,(T+.6)/2,0);
      for(const yy of [T+.6,T+1.3])add(SK.cyl(.16,.16,span*2+.6,7),vary(0x4a3418,.06),0,yy,0,0,0,Math.PI/2);
      for(const s of [-1,1])add(SK.cyl(.09,.09,1.6,5),0x4a3418,s*(span-.6),T+.1,0,0,0,s*.7);
      lh=WT==='fence'?1.3:2.8;hz=d/2+.1;
      LO=[{geo:new THREE.BoxGeometry(.4,T+2.6,.4),color:new THREE.Color(0x5a4222),x:-span,y:(T+.6)/2},{geo:new THREE.BoxGeometry(.4,T+2.6,.4),color:new THREE.Color(0x5a4222),x:span,y:(T+.6)/2},{geo:new THREE.BoxGeometry(span*2+.6,.3,.3),color:new THREE.Color(0x4a3418),y:T+1.3}];}
    // the leaves: hinged by the jambs, planks running in from the hinge, swung open 83 degrees into the town
    const w=inner-.2,ang=1.45;
    for(const s of [-1,1]){const phi=s*ang,cs=Math.cos(phi),sn=Math.sin(phi),hx=s*(inner-.1);
      const at=(lx,lz)=>[hx+lx*cs+lz*sn,hz-lx*sn+lz*cs];
      for(let k=0;k<6;k++){const [x,z]=at(-s*(k+.5)*w/6,0);add(SK.rbox(w/6-.02,lh,.12,.02,1),new THREE.Color(0x5a3d22).multiplyScalar(k%2?1.08:.96).getHex(),x,lh/2,z,0,phi,0,.06);}
      for(const yy of (lh>2?[.5,lh-.6]:[.3,lh-.3])){const [x,z]=at(-s*w/2,.08);add(new THREE.BoxGeometry(w,.12,.04),0x2a2624,x,yy,z,0,phi,0,.03);}
      {const [x,z]=at(-s*w/2,.08),bl=lh>2?lh-1.2:lh-.6;add(new THREE.BoxGeometry(.12,Math.hypot(w,bl),.1),0x4a3018,x,lh/2,z,0,phi,s*Math.atan2(w,bl),.04);}
      const [mx,mz]=at(-s*w/2,0);L.push({x:mx,z:mz,rx:w/2,rz:.12,ry:phi});}
    const g=mergeParts(P);g.userData.lo=mergeParts(LO);g.userData.leaves=L;return g;}
  let _furnN=0;const furnRng=()=>pRng(((_furnN++)*2654435761)>>>0);
  const FPART=(P,geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});
  function wellGeoHi(){const r0=furnRng(),P=[];const stone=0x7a746a;
    for(let ring=0;ring<3;ring++)for(let k=0;k<12;k++){const a=(k+(ring%2)*.5)/12*Math.PI*2;FPART(P,SK.rbox(.62,.3,.34,.06,1),new THREE.Color(stone).multiplyScalar(.82+r0()*.3).getHex(),Math.sin(a)*1.02,.16+ring*.31,Math.cos(a)*1.02,0,a,0,.05);}
    FPART(P,new THREE.CylinderGeometry(1.14,1.14,.1,14),0x6a655c,0,1.0,0);FPART(P,new THREE.CircleGeometry(.8,14),0x16202a,0,.55,0,-Math.PI/2,0,0,0);
    for(const x of [-.95,.95]){FPART(P,SK.rbox(.16,2.4,.16,.03,1),0x5a3d1e,x,1.2,0,0,0,0,.05);}
    FPART(P,SK.cyl(.14,.14,1.7,10),0x6a4a2a,0,1.85,0,0,0,Math.PI/2);FPART(P,SK.cyl(.02,.02,.4,5),0x2a2420,1.0,1.85,.18,0,0,0);FPART(P,SK.cyl(.018,.018,.25,5),0x2a2420,1.0,1.7,.3,Math.PI/2,0,0);
    FPART(P,SK.cyl(.012,.012,1.1,4),0xb09a70,0,1.25,0);FPART(P,SK.lathe([[.001,0],[.13,0],[.15,.22],[.001,.22]],8),0x5a4028,0,.6,0);
    for(const s of [1,-1])FPART(P,SK.rbox(2.6,.08,1.0,.03,1),0x4a3a2a,0,2.72,s*.42,s*.55,0,0,.08);FPART(P,SK.cyl(.06,.06,2.7,6),0x3a2a1a,0,2.95,0,0,0,Math.PI/2);
    return mergeParts(P);}
  function stallGeoHi(pk){const r0=furnRng(),P=[];const cl=new THREE.Color(pk.cloth),wh=new THREE.Color(0xe8e0c8);
    for(const [x,z] of [[-1.4,-.9],[1.4,-.9],[-1.4,.9],[1.4,.9]])FPART(P,SK.rbox(.12,z<0?2.5:2.1,.12,.02,1),0x5a3d1e,x,z<0?1.25:1.05,z,0,0,0,.05);
    for(let k=0;k<8;k++)FPART(P,new THREE.BoxGeometry(.42,.04,2.5),(k%2?wh:cl).getHex(),-1.47+k*.42,2.36,0,-.16,0,0,.05);
    for(let k=0;k<8;k++)FPART(P,SK.cone(.21,.22,3),(k%2?wh:cl).getHex(),-1.47+k*.42,2.05,1.23,Math.PI,Math.PI/6,0,.05);
    FPART(P,SK.rbox(3.0,.08,1.0,.02,1),0x7a5a36,0,.92,.5,0,0,0,.06);FPART(P,SK.rbox(2.9,.84,.9,.03,1),0x6a4a2a,0,.46,.5,0,0,0,.06);for(let k=0;k<6;k++)FPART(P,new THREE.BoxGeometry(.02,.7,.02),0x4a3420,-1.25+k*.5,.46,.96,0,0,0,0);
    pk.goods.forEach((gc,i)=>{const x=-1+i;const kind=Math.floor(r0()*3);
      if(kind===0)for(let q=0;q<5;q++)FPART(P,SK.ball(.1,8,6),gc,x+(q%3-1)*.14,1.06+Math.floor(q/3)*.11,.45+(q%2)*.1,0,0,0,.1);
      else if(kind===1)FPART(P,SK.lathe([[.001,0],[.13,0],[.17,.12],[.12,.26],[.07,.3],[.001,.3]],10),gc,x,.96,.5,0,0,0,.06);
      else{FPART(P,SK.rbox(.5,.18,.38,.03,1),0x8a6a40,x,1.05,.5,0,0,0,.05);for(let q=0;q<3;q++)FPART(P,SK.ball(.08,6,5),gc,x-.14+q*.14,1.17,.5,0,0,0,.1);}});
    return mergeParts(P);}
  function tentGeoHi(pk){const P=[];const tc=pk.tc;
    FPART(P,SK.lathe([[.001,2.9],[.25,2.75],[1.4,1.4],[2.2,.55],[2.35,.35],[2.35,0],[2.2,0],[2.2,.3],[2.05,.5],[1.3,1.35],[.2,2.72],[.001,2.82]],12),tc,0,0,0,0,0,0,.06);
    FPART(P,SK.cyl(.06,.06,3.2,6),0x4a3018,0,1.6,0);FPART(P,SK.ball(.1,6,5),0x8a2a1a,0,3.25,0);
    for(let k=0;k<6;k++){const a=k/6*Math.PI*2+.3,x0=Math.sin(a)*2.2,z0=Math.cos(a)*2.2,x1=Math.sin(a)*3.4,z1=Math.cos(a)*3.4;const L=Math.hypot(x1-x0,.55,z1-z0);
      const g=SK.cyl(.012,.012,L,4);g.translate(0,L/2,0);const v=new THREE.Vector3(x1-x0,-.55,z1-z0).normalize();const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v);const e=new THREE.Euler().setFromQuaternion(q);
      FPART(P,g,0xb09a70,x0,.55,z0,e.x,e.y,e.z,0);FPART(P,SK.cyl(.03,.02,.3,4),0x5a4028,x1,.1,z1,0,0,0);}
    FPART(P,new THREE.BoxGeometry(.9,1.1,.04),new THREE.Color(tc).multiplyScalar(.6).getHex(),0,.55,2.12,-.2,0,0,0);
    return mergeParts(P);}
  function ruinGeoHi(pk){const r0=furnRng(),P=[];
    for(const w of pk.picks){const c0=Math.cos(w.ry),s0=Math.sin(w.ry);const rows=Math.max(1,Math.round(w.h/.34));
      for(let row=0;row<rows;row++){const top=row===rows-1;const n=Math.max(1,Math.round(w.w/.55));for(let k=0;k<n;k++){if(top&&r0()<.35)continue;if(row>rows*.5&&(k<n*.2||k>n*.8)&&r0()<.6)continue;
        const lx=-w.w/2+(k+.5+(row%2)*.3)*w.w/n;if(Math.abs(lx)>w.w/2)continue;const y=.17+row*.34;const x=w.x+lx*c0,z=w.z-lx*s0;
        FPART(P,SK.rbox(w.w/n*.94,.3,.58,.06,1),new THREE.Color(w.col).multiplyScalar(.85+r0()*.35).getHex(),x,y,z,0,w.ry+(r0()-.5)*.06,(r0()-.5)*.05,.06);}}
      for(let k=0;k<4;k++){const a=r0()*6.28,d=1+r0()*1.5;FPART(P,SK.rbox(.5,.28,.4,.06,1),new THREE.Color(w.col).multiplyScalar(.8+r0()*.3).getHex(),w.x+Math.sin(a)*d,.14,w.z+Math.cos(a)*d,(r0()-.5)*.4,r0()*3,(r0()-.5)*.4,.06);}
      for(let k=0;k<3;k++)FPART(P,SK.bumpy(SK.ball(.22,8,5,0,Math.PI*2,0,Math.PI/2),.04,8,k),0x4a6a30,w.x+(r0()-.5)*w.w*.8*c0,.02,w.z-(r0()-.5)*w.w*.8*s0,0,0,0,.1);}
    return mergeParts(P);}
  function standingStoneGeoHi(pk){const r0=furnRng(),P=[];const g=SK.bumpy(SK.rbox(pk.w,pk.h,.6,.18,3),.05,6,r0()*9);
    FPART(P,g,0x5a5852,0,1.6,0,0,pk.ry,pk.rz,.1);for(let k=0;k<5;k++){const y=.4+r0()*pk.h*.8;FPART(P,SK.ball(.12+r0()*.1,6,4),r0()<.5?0x8a9a5a:0xb0a878,(r0()-.5)*pk.w*.7,y,.31,0,0,0,.1);}
    FPART(P,SK.bumpy(SK.ball(.7,10,5,0,Math.PI*2,0,Math.PI/2),.06,7,3),0x4a6a30,0,0,0,0,0,0,.1);return mergeParts(P);}
  function wellGeo(){const lo=wellGeoLo(),hi=wellGeoHi();hi.userData.lo=lo;return hi;}
  function stallGeo(r){const lo=stallGeoLo(r),hi=stallGeoHi(lo.userData.picks);hi.userData.lo=lo;return hi;}
  function tentGeo(r){const lo=tentGeoLo(r),hi=tentGeoHi(lo.userData.picks);hi.userData.lo=lo;return hi;}
  function ruinGeo(r){const lo=ruinGeoLo(r),hi=ruinGeoHi({picks:lo.userData.picks});hi.userData.lo=lo;return hi;}
  function standingStoneGeo(r){const lo=standingStoneGeoLo(r),hi=standingStoneGeoHi(lo.userData.picks);hi.userData.lo=lo;return hi;}
  const SETTLE_MAT=VC_MAT;

  // ── Dialog pools ─────────────────────────────────────────────────────
  const META_ID={ashenmoor:'overworld'};
  function siteBlurb(site){
    const meta=(typeof MAP_NODE_META!=='undefined')&&MAP_NODE_META[META_ID[site.id]||site.id];
    if(meta&&meta.desc)return meta.desc.replace(/<[^>]+>/g,'').split(/(?<=\.)\s/).slice(0,2).join(' ');
    return `${site.name}. Not much to it, but it's ours.`;
  }
  // v80 S138 — directions. Ask anyone in a town where something is; they answer from where you're both
  // standing, and the place goes on your compass until you reach it or leave town.
  let WAY=null;
  const WAY_ASK={castle:['The keep?','keeps'],inn:['An inn?','inns'],guild_f:['The Fighters\u2019 Guild?',''],guild_m:['The Mages\u2019 Guild?',''],church:['The church?','churches'],weapon:['A smith?','smithies'],armor:['An armourer?','armouries'],potion:['An apothecary?','apothecaries'],misc:['Somewhere for supplies?','goods stores'],shipwright:['The shipwright?','']};
  const WAY_ORDER=['castle','inn','guild_f','guild_m','church','weapon','armor','potion','misc','shipwright'];
  function wayFar(d,dir,open){return d<14?(open?`right here, just ${dir} of you`:`just ${dir} of here, you're nearly at the door`):d<55?`${dir} of here, a short walk`:d<130?`${dir} of here, on across the town`:`${dir} of here, the far side of town`;}
  function waySet(x,z,label,glyph,siteId){WAY={x,z,label,glyph:glyph||'\u25c9',siteId};showMsg(`On your compass: ${label}`,'#f0dca0');}
  // indoors px/pz are the room's own coordinates: measure from the building's front door instead
  function wayFrom(){try{if(typeof isInterior==='function'&&isInterior()&&typeof currentHouse!=='undefined'&&currentHouse&&currentHouse.exitX!=null)return {x:currentHouse.exitX,z:currentHouse.exitZ};}catch(e){}return {x:px,z:pz};}
  function wayTick(){if(!WAY)return;if(activeZoneId!=='world')return;try{if(typeof isInterior==='function'&&isInterior())return;}catch(e){}const d=Math.hypot(px-WAY.x,pz-WAY.z);const site=WAY.siteId?siteAnywhere(WAY.siteId):null;
    if(d<5){WAY=null;return;}if(site&&Math.hypot(px-site.x,pz-site.z)>(site.pad||60)+220)WAY=null;}
  function directionTopics(site,def){
    const S=SETTLE.get(site.id);if(!S||!S.houses||!S.houses.length)return [];const out=[];
    if(S.lordNpc&&S.lordNpc.def){const L=lordFor(site);const who=`${L.title} ${L.name}`;
      out.push({label:`Where's ${who}?`,fn:()=>{const o=wayFrom();if(def&&def._lord)return `You're looking at ${L.female?'her':'him'}.`;const LN=S.lordNpc;
        if(!LN.g.visible){const sq=(LN.sched&&LN.sched.plaza)||{x:site.x,z:site.z};const d=Math.hypot(sq.x-o.x,sq.z-o.z),dir=compassWord(sq.x-o.x,sq.z-o.z);waySet(sq.x,sq.z,`the square (${who})`,'\ud83d\udc51',site.id);return `At this hour? Home, and not to be woken. ${L.female?'She\u2019s':'He\u2019s'} on the square in the morning: ${wayFar(d,dir,true)}.`;} // after dark the lord is indoors: point at the square
        const g=LN.g.position;const d=Math.hypot(g.x-o.x,g.z-o.z),dir=compassWord(g.x-o.x,g.z-o.z);waySet(g.x,g.z,who,'\ud83d\udc51',site.id);WAY.follow=LN;return `${L.female?'She':'He'} keeps to the square most days \u2014 ${wayFar(d,dir,true)}.`;}});}
    for(const t of WAY_ORDER){const hs=S.houses.filter(h=>h.type===t);if(!hs.length)continue;const ask=WAY_ASK[t];
      out.push({label:ask[0],fn:()=>{const o=wayFrom();let h=hs[0],bd=1e9;for(const x of hs){const d=Math.hypot(x.exitX-o.x,x.exitZ-o.z);if(d<bd){bd=d;h=x;}}
        const dir=compassWord(h.exitX-o.x,h.exitZ-o.z);const far=wayFar(bd,dir);
        if(def&&def._houseId===h.id)return bd<14?'You\u2019ve found it. It\u2019s mine.':`That\u2019s mine \u2014 ${far}. Go on, I\u2019ll be along.`;
        waySet(h.exitX,h.exitZ,h.name,bldOf(t).glyph,site.id);
        const nm=(t==='guild_f'||t==='guild_m')&&!/^The /.test(h.name)?'The '+h.name:h.name;
        const lead=hs.length>1&&ask[1]?`There are ${hs.length} ${ask[1]} here. The nearest is ${nm}, `:`${nm}? It's `;
        const tail=t==='castle'?' The steward speaks for the lord.':(t==='guild_f'||t==='guild_m')?' Ask for the steward.':'';
        return lead+far+'.'+tail;}});}
    const mine=S.houses.find(h=>h.ownedByPlayer||ownedHouse(h.id));
    if(mine)out.push({label:'My house?',fn:()=>{const o=wayFrom();const d=Math.hypot(mine.exitX-o.x,mine.exitZ-o.z),dir=compassWord(mine.exitX-o.x,mine.exitZ-o.z);waySet(mine.exitX,mine.exitZ,mine.name,'\u2302',site.id);return `Yours? You've forgotten already? ${wayFar(d,dir).replace(/^./,c=>c.toUpperCase())}.`;}});
    return out;
  }
  function compassWord(dx,dz){
    const a=Math.atan2(dx,-dz);const dirs=['north','north-east','east','south-east','south','south-west','west','north-west'];
    return dirs[((Math.round(a/(Math.PI/4))%8)+8)%8];
  }
  function nearbyDoors(site,n){
    const arr=DOORS.map(e=>{const w=dungeonWorldPos[e.seed];return {e,w,d:Math.hypot(w.x-site.x,w.z-site.z)};}).sort((a,b)=>a.d-b.d).slice(0,n);
    return arr.map(o=>({name:o.e.canonicalName||(typeof dungeonName==='function'?dungeonName(o.e.seed,o.e.theme):'an old gate'),dir:compassWord(o.w.x-site.x,o.w.z-site.z),far:o.d<140?'close by':o.d<300?'an hour\'s walk':'a fair way off',fort:o.e.kind==='fort_door',theme:o.e.theme}));
  }
  const RUMORS={
    irish:["They say the Wastes were green once. My grandmother said her grandmother said so, anyway.","A man came through last month with a rubbing off a stone. Wouldn't say where from. Wouldn't sleep, either.","The old gates were here before the roads. Before us. They'll be here after.","Wolves are bolder this year. Something's pushing them out of the deep wood.","Somebody's been marking the doors — a scratch, like a letter that isn't. Same mark, every time."],
    french:["The King's men patrol the Route Royale and nowhere else. Draw your own conclusions.","There's a name they don't say in Coeur de Vie. Varek. I said it. Look — nothing happened.","Mur Pierre holds the pass. What it holds the pass against, they don't tell villagers.","A cloister in the mountains stopped ringing its bell. Someone should go and ask why. Not me.","Pellam's Hold was a lord's house once. Now it's a place you hear things from at night."],
    anglo:["The Hollowed don't rot. That's the part nobody tells you.","Caer Uaigneach shut its gates on the plague and never opened them. It's still shut. From the inside.","The hermit says the ground hums at night out there. He's not wrong. He's not right, either.","If a door's warm to the touch, don't. Just don't.","Something walks the wastes with a lantern. It isn't looking for anything. It's counting."],
  };
  function makeDef(site,reg,r,role,name,extra){
    const doors=nearbyDoors(site,3);
    const outs=ROAD_DEFS.filter(d=>d.a===site.id||d.b===site.id).map(d=>({s:SITE[d.a===site.id?d.b:d.a],via:d.via}));
    const roadLine=outs.length?outs.map(o=>`${o.via} runs ${compassWord(o.s.x-site.x,o.s.z-site.z)} to ${o.s.name}`).join('. ')+'.':'No roads worth the name. You walk.';
    const doorLine=doors.map(d=>`${d.fort?'The fort they call':'There\'s an old gate,'} ${d.name}, ${d.dir} of here, ${d.far}${d.fort?'':' — '+({undead:'the dead walk it',goblin:'goblins nest there',ruins:'old stone and older things',elemental:'the air hums wrong',deep:'it goes down a long way'}[d.theme]||'no one goes in')}`).join('. ')+'.';
    const greetPool={
      Smith:["Mind the sparks.","You'll want that edge looked at before you go back out.","Steel's honest. People less so."],
      Armourer:["Turn around. Let me see the back.","Padding first. Always padding first.","Nothing fancy here. Everything tested."],
      Apothecary:["Don't touch that. Or that.","You look like you've been drinking from streams. Sit.","Bitter is good. Bitter means it's working."],
      Merchant:["Buying or selling? Both is fine.","Everything's for sale except the counter.","Carts come through less than they did."],
      Innkeeper:["Fire's lit. Take a seat.","Bed's upstairs. Bowl's on the way.","We don't ask where you've been. Boots off, though."],
      Priest:["Come in out of the wind.","The door's open. It always is.","Sit a while. Nothing's chasing you in here."],
      Steward:["His lordship is not receiving. State your business to me.","You're tracking mud through the hall.","Petitions on the left. Complaints, also on the left."],
      Villager:["Fine day for it.","You're not from here. That's all right.","Keep to the road after dark.","Haven't seen a traveller in a week."],
      Guard:["Move along.","Trouble stays outside the walls. See that it does.","You armed? Good. Keep it sheathed in here."],
      Hermit:["Hm. Another one.","The ground hums. Put your hand on it. No? Suit yourself.","I don't sell anything. I don't have anything. Sit if you like."],
    };
    const topics=[
      {label:`What is this place?`,response:siteBlurb(site)},
      {label:'Where do the roads go?',response:roadLine},
      {label:'Anything dangerous nearby?',response:doorLine},
      {label:'Any news?',response:pick(r,RUMORS[reg])},
    ];
    let extraTopics=[];
    if(extra&&extra.topics){extraTopics=extra.topics.slice();extra=Object.assign({},extra);delete extra.topics;}
    const ICO={Smith:'⚒',Armourer:'🛡',Apothecary:'🌿',Merchant:'📦',Innkeeper:'🍺',Priest:'🕯',Steward:'🏰',Villager:'👤',Guard:'⚔',Hermit:'🪶',Harbourmaster:'⚓',Shipwright:'⛵',Lord:'👑',Lady:'👑',Mayor:'📜',Elder:'🌾','Harbour Reeve':'⚓',Captain:'⚔'};
    topics.push({label:'Farewell.',bye:true});
    const NK=(extra&&extra.nameKey!=null&&!extra.authored&&_curNM)?String(extra.nameKey):null,kept=NK&&_curNM[NK]?String(_curNM[NK]).split('|'):null; // S244
    let people=(extra&&extra.people)||peopleOfNpc(site,r);if(kept&&PEOPLES[kept[1]])people=kept[1];const P=PEOPLES[people];
    if(!(extra&&extra.authored)){ // rename into the people's bank (keep gender) unless told to keep it; take the people's body
      const bank=NAMES[P.names]||NAMES.irish;const female=Object.values(NAMES).some(b=>b.f&&b.f.includes(name));if(!(extra&&extra.keepName))name=pickFor(r,female?bank.f:bank.m,role!=='Villager');
      extra=Object.assign({},extra||{},{sCol:pick(r,P.skin),hairCol:pick(r,P.hair),bodyScale:[P.width,P.height,P.width]});}
    if(NK){ // S245 — the look and the trade too: skin, hair, clothes and a resident's trade, each field kept once drawn (an S244 record fills in)
      const F=[['sCol',36],['hairCol',36],['bCol',36],['role',0]],rec=[kept?kept[0]:name,people];if(kept)name=kept[0];const o={};
      F.forEach(([k,b],i)=>{const v=kept&&kept[i+2];if(v){if(k==='sCol'||k==='hairCol'||(extra&&extra[k]!=null))o[k]=b?parseInt(v,b):v;rec.push(v);}else{const c=extra&&extra[k];rec.push(c==null?'':b?Number(c).toString(b):String(c));}});
      extra=Object.assign({},extra||{},o);_curNM[NK]=rec.join('|');}
    const def=Object.assign({name,role,ico:ICO[role]||'👤',greeting:greetPool[role]||greetPool.Villager,topics,x:0,z:0},extra||{});
    def.people=people;def._siteId=site&&site.id;{const tw=noteName(def.name,role!=='Villager',kept?kept[6]:null);if(tw)def._twin=tw; // S248 — the second of a name in the town is another face
      if(NK){const p=String(_curNM[NK]).split('|');while(p.length<6)p.push('');p[6]=String(tw);_curNM[NK]=p.join('|');}} // S250 — and keeps its number through a rebuild
    def.temper=temperOf(name);def.bio=bioFor(site,reg,r,role,name);def._roadLine=roadLine;def._doorLine=doorLine;def._extra=extraTopics;
    return dialogFor(site,reg,r,role,name,extraTopics,def);
  }

  // ── Generator ────────────────────────────────────────────────────────
  // S255 — a town's work under way (a build it has funded and not finished): a half-raised wall of coursed stone with a
  // ragged top inside a scaffold of round poles lashed at the joints and braced, a plank deck with a ladder up to it, a
  // stack of cut stone, a pile of timber and a hoist pole with its rope; all within the old 3.4-square footprint.
  function buildSiteGeo(r){const P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+r()*a*2).getHex(),pole=0x8a6a3a,rope=0xb09a70;
    for(const [x,z] of [[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]]){add(SK.cyl(.065,.08,4.2,6),vary(pole,.08),x,2.1,z,(r()-.5)*.03,0,(r()-.5)*.03,.06);for(const y of [2.1,3.9])add(SK.torus(.085,.025,3,8),rope,x,y,z,Math.PI/2,0,0,.03);}
    for(const s of [-1.5,1.5]){add(SK.cyl(.05,.05,3.1,5),vary(pole,.08),0,2.1,s,0,0,Math.PI/2,.05);add(SK.cyl(.05,.05,3.1,5),vary(pole,.08),s,2.1,0,Math.PI/2,0,0,.05);
      add(SK.cyl(.04,.04,3.4,5),vary(pole,.1),0,1.1,s,0,0,Math.atan2(3,1.8)*(s>0?1:-1),.05);add(SK.cyl(.04,.04,3.4,5),vary(pole,.1),s,1.1,0,Math.atan2(3,1.8)*(s>0?-1:1),0,0,.05);}
    for(let i=0;i<5;i++)add(new THREE.BoxGeometry(.6,.05,3.2),vary(0x9a7a4a,.1),-1.24+i*.62,2.2,0,0,(r()-.5)*.03,0,.06);
    for(const s of [-.22,.22])add(SK.cyl(.03,.03,2.6,5),0x7a5a30,1.72,1.15,.7+s,0,0,.35,.05);for(let i=0;i<7;i++){const u=-1.05+i*.35;add(SK.cyl(.02,.02,.44,4),0x7a5a30,1.72-u*Math.sin(.35),1.15+u*Math.cos(.35),.7,Math.PI/2,0,0,.03);}
    // the wall going up: courses of blocks laid broken-joint, the upper courses shorter so the top steps down to one end
    const wc=0x8a8478;for(let c=0;c<5;c++){const y=.15+c*.34,run=2.4-c*.42*(.6+r()*.5);let x=-1.2;while(x<-1.2+run-.05){const bl=Math.min(-1.2+run-x,.45+r()*.35);add(SK.rbox(bl-.04,.3,.42,.04,1),vary(wc,.12),x+bl/2,y,-.6,0,0,0,.05);x+=bl;}}
    for(let i=0;i<6;i++)add(SK.rbox(.4,.26,.3,.04,1),vary(wc,.1),.55+(i%3)*.42,.13+Math.floor(i/3)*.27,.55,0,(r()-.5)*.2,0,.05);
    for(let i=0;i<4;i++)add(SK.cyl(.08,.08,2.2,6),vary(0x6a4a28,.12),-.6+(i%2)*.18+(i>1?.09:0),.09+(i>1?.15:0),1.05,0,0,Math.PI/2,.06);
    add(SK.cyl(.06,.07,4.6,6),vary(pole,.06),-1.3,2.3,1.25,0,0,.12,.05);add(SK.cyl(.05,.05,.9,5),pole,-1.1,4.45,1.25,0,0,Math.PI/2+.12,.04);add(SK.torus(.09,.025,4,10),0x3a3430,-.7,4.35,1.25,0,0,0,.02);add(SK.cyl(.012,.012,3.2,4),rope,-.61,2.75,1.25,0,0,0,.02);
    add(SK.rbox(.34,.24,.3,.04,1),vary(wc,.08),-.61,1.05,1.25,0,.3,0,.05);
    return mergeParts(P);}
  function genSettlement(site){
    if(SETTLE.has(site.id)||site.pad<=0)return;
    let r=rngFor(site.c*31+7,site.r*17+3);_townNames=new Set();_twinUsed=new Map();_roleNames=new Set();const _innNames=new Set();if(!site.lordless)try{const ln_=lordFor(site).name;_townNames.add(ln_);_roleNames.add(ln_);}catch(e){} // S248 — the lord's name is his own; the guild heads drawn before him leave it // S172 — names unique within the town where the bank allows
    const reg=site.reg||REGISTER[dominantRegion(site.x,site.z).r.id]||'irish'; // the cell's culture
    const biome=dominantRegion(site.x,site.z).r.biome;
    const [ni,nj]=cellOf(site.x,site.z);const _ts=worldState.towns&&worldState.towns[site.id];const NAT=(_ts&&_ts.flags.occupied!=null&&NATIONS[_ts.occupier])?NATIONS[_ts.occupier]:nationOf(ni,nj); // v80 S129 — an occupied town flies the occupier's colours
    // the nation's house style first; the home island keeps its cultural mix; biome quirks only in villages
    const st=site.kind==='garrison'?STYLE.garrison:site.kind==='city'?(STYLE[NAT.cityStyle]||STYLE.stone):NAT.people==='gatelander'?(biome==='autumn'?STYLE.bavarian:(STYLE[reg]||STYLE.irish)):(STYLE[NAT.style]||STYLE.irish);
    const plan=KIND_PLAN[site.kind]||KIND_PLAN.village;
    const group=new THREE.Group(),sol=[],houses=[],snpcs=[];
    const S={site,group,sol,houses,npcs:snpcs,reg,residents:[],lamps:[],_gates:[],chimneys:[],tundra:biome==='tundra'};_curSettle=S;
    const pad=site.pad;
    const cx=site.x,cz=site.z;
    if(POI_KINDS.includes(site.kind)){buildPoi(S,site,r);S.reach=t_reach(sol,site);bakeSettlement(S);sc.add(group);houses.forEach(h=>ZONES.world.houses.push(h));if(IMPOSTORS[site.id])IMPOSTORS[site.id].visible=false;SETTLE.set(site.id,S);return S;}
    function addMesh(geo,x,z,ry,solR){
      const m=new THREE.Mesh(geo,SETTLE_MAT);m.position.set(x,worldH(x,z)-.06,z);m.rotation.y=ry||0;m.castShadow=true;m.receiveShadow=true;group.add(m);
      if(geo.userData&&geo.userData.lo){m.userData.lod='hi';const l=new THREE.Mesh(geo.userData.lo,SETTLE_MAT);l.position.copy(m.position);l.rotation.y=m.rotation.y;l.castShadow=true;l.receiveShadow=true;l.userData.lod='lo';group.add(l);} // S194 — its distant copy
      if(solR)sol.push({cx:x,cz:z,rx:solR,rz:solR});
      return m;
    }
    // Layout. Villages: lots along the roads that cross the pad, wide
    // spacing. Towns/cities: a Daggerfall-style street grid aligned to the
    // main road — blocks of lots facing the streets, plaza at the centre,
    // everything inside the wall ring. Every door gets a footpath to the
    // nearest street. `paths` collects ribbon polylines drawn at the end.
    const paths=[];
    const streets=ROADS.filter(rd=>(rd.def.a===site.id||rd.def.b===site.id)&&rd.def.via!=='spur');
    const LOT_STEP=site.kind==='city'?11:plan.rows>1?12:site.kind==='village'?11:14, LAT_GAP=1.2;
    const gridKinds={town:1,city:1,garrison:1,village:1,port:1};
    const useGrid=!!gridKinds[site.kind];
    const inner=plan.walls?pad-12:site.kind==='village'?pad-5:pad-8;   // inside the wall ring
    // main axis from the first road out of the site
    let ax=1,az=0;
    if(streets.length){const rd=streets[0];const far=rd.def.a===site.id?rd.pts[rd.pts.length-1]:rd.pts[0];const dx=far.x-cx,dz=far.z-cz,L=Math.hypot(dx,dz)||1;ax=dx/L;az=dz/L;}
    const bx=-az,bz=ax; // perpendicular
    const streetLines=[]; // {px,pz,dx,dz} infinite lines, clipped to the pad
    if(useGrid){
      const G=site.kind==='city'?38:site.kind==='village'?17:site.kind==='port'?22:34; // block size; villages/ports one row per side
      const nmax=Math.floor((inner-6)/G);
      for(let k=-nmax;k<=nmax;k++){
        streetLines.push({px:cx+bx*k*G,pz:cz+bz*k*G,dx:ax,dz:az});   // streets along the axis
        streetLines.push({px:cx+ax*k*G,pz:cz+az*k*G,dx:bx,dz:bz});   // cross streets
      }
      // draw them (skip the real road's own lines roughly — they overlap harmlessly)
      streetLines.forEach(l=>{
        const half=Math.sqrt(Math.max(0,inner*inner-((l.px-cx)*(l.px-cx)+(l.pz-cz)*(l.pz-cz))));
        if(half<8)return;
        // S193 — where a road already runs along or across the street, the road is the street: the ribbon breaks
        // there rather than doubling it or weaving beside it (the playtest's overlapping patterns)
        let run=[];const flush=()=>{if(run.length>1&&Math.hypot(run[run.length-1].x-run[0].x,run[run.length-1].z-run[0].z)>3)paths.push({w:2.4,pts:[run[0],run[run.length-1]]});run=[];};
        for(let t=-half;t<=half+1e-6;t+=1.5){const x=l.px+l.dx*t,z=l.pz+l.dz*t;const ri=roadInfo(x,z);if(ri&&ri.d<ROAD_HALF+1.2+3.5)flush();else run.push({x,z});}flush();
      });
      // a perimeter lane every street runs into (no dead ends in a field)
      // (S193: broken where a road crosses it, the road being the way through there)
      {let ring=[];const n=Math.max(48,Math.round(inner/1.5));for(let k=0;k<=n;k++){const a=k/n*Math.PI*2,x=cx+Math.cos(a)*inner,z=cz+Math.sin(a)*inner;const ri=roadInfo(x,z);
        if(ri&&ri.d<ROAD_HALF+1.2+1.5){if(ring.length>1)paths.push({w:2.2,pts:ring});ring=[];}else ring.push({x,z});}if(ring.length>1)paths.push({w:2.2,pts:ring});}
    }
    // v80 S243 — the lots as a function of prosperity, so that a house's id follows its lot. A rebuild at another
    // prosperity (fewer lots; the guild halls gone below 60) used to hand every id in the town to another building, and
    // your own house (worldState.owned is keyed by id) with it. Ids are now the lot's place in the town's layout at its
    // starting prosperity with no builds paid for, which is the layout every existing id was given in.
    const TST=(site.kind in BASE_P)?TS(site):null;const burnedV=!!(TST&&TST.flags.burned!=null),sackedV=!!(TST&&TST.flags.sacked!=null),abandonedV=!!(TST&&TST.flags.abandoned!=null);
    function planLots(P,withBuilds){const r=rngFor(site.c*31+7,site.r*17+3);const placed=[],lots=[];
      // Candidate lots along a line direction (dx,dz) through (px,pz): both sides.
      function lotsAlong(px_,pz_,dx,dz,extent,latBase,rowsN){
        const nx=-dz,nz=dx;
        for(let t=-extent;t<=extent;t+=LOT_STEP){
          const mx=px_+dx*t,mz=pz_+dz*t;
          if(Math.hypot(mx-cx,mz-cz)>inner)continue;
          for(let row=0;row<rowsN;row++)for(const side of [-1,1]){
            const w=5+Math.floor(r()*3),d=4+Math.floor(r()*3);
            const lat=latBase+LAT_GAP+row*(9.5+LAT_GAP);
            const lx=mx+nx*side*(lat+d/2),lz=mz+nz*side*(lat+d/2);
            const dc=Math.hypot(lx-cx,lz-cz);
            if(dc>inner-4||dc<13)continue;
            const ri=roadInfo(lx,lz);if(ri&&ri.d<ROAD_BLEND+d/2)continue;
            // keep clear of every street line (grid) — not in an intersection
            let nearStreet=false;
            for(const l of streetLines){const ex=lx-l.px,ez=lz-l.pz;const dist=Math.abs(ex*(-l.dz)+ez*l.dx);if(dist<Math.max(w,d)/2+2.2&&!(Math.abs(l.dx-dx)<1e-6&&Math.abs(l.dz-dz)<1e-6&&Math.abs(ex*(-l.dz)+ez*l.dx-0)<1e-3)){/* different line too close */ if(!(l.px===px_&&l.pz===pz_&&l.dx===dx&&l.dz===dz))nearStreet=true;}}
            if(nearStreet)continue;
            const rad=Math.max(w,d)/2+2.0;
            if(placed.some(p=>Math.hypot(p.x-lx,p.z-lz)<p.rad+rad))continue;
            const ry=Math.atan2(-nx*side,-nz*side);
            placed.push({x:lx,z:lz,rad});
            lots.push({x:lx,z:lz,w,d,ry,tx:-nx*side,tz:-nz*side,row,street:{px:px_,pz:pz_,dx,dz},k:lots.length});
          }
        }
      }
      if(useGrid){
        streetLines.forEach(l=>{const half=Math.sqrt(Math.max(0,inner*inner-((l.px-cx)*(l.px-cx)+(l.pz-cz)*(l.pz-cz))));if(half>8)lotsAlong(l.px,l.pz,l.dx,l.dz,half,1.6,plan.rows);});
      } else {
        // villages: lots along the road samples, both sides, wide spacing
        streets.forEach(rd=>{
          const pts=rd.pts;let acc=LOT_STEP;
          for(let i=1;i<pts.length;i++){
            const a=pts[i-1],b=pts[i];const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
            const dc=Math.hypot(mx-cx,mz-cz);if(dc>inner||dc<12){acc=LOT_STEP;continue;}
            acc+=Math.hypot(b.x-a.x,b.z-a.z);if(acc<LOT_STEP)continue;acc=0;
            const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1;
            lotsAlong(mx,mz,dx/L,dz/L,0,ROAD_BLEND-1,plan.rows);
          }
        });
      }
      // Ring lots around the plaza if still short.
      const hero0=heroShops(site);
      const want=Math.max(Math.round((plan.n[0]+Math.floor(r()*(plan.n[1]-plan.n[0]+1)))*(TST?lotFactor(site,P):1)),(hero0?hero0.length:plan.shops.length)+2);
      for(let k=0;k<40&&lots.length<want;k++){
        const ang=r()*Math.PI*2,rad0=18+r()*Math.max(8,inner-30);
        const lx=cx+Math.cos(ang)*rad0,lz=cz+Math.sin(ang)*rad0;
        const w=5+Math.floor(r()*3),d=4+Math.floor(r()*3);
        const ri=roadInfo(lx,lz);if(ri&&ri.d<ROAD_BLEND+d/2)continue;
        let nearStreet=false;for(const l of streetLines){const ex=lx-l.px,ez=lz-l.pz;if(Math.abs(ex*(-l.dz)+ez*l.dx)<Math.max(w,d)/2+2.2)nearStreet=true;}
        if(nearStreet)continue;
        const rad=Math.max(w,d)/2+2.0;
        if(placed.some(p=>Math.hypot(p.x-lx,p.z-lz)<p.rad+rad))continue;
        const tx=(cx-lx),tz=(cz-lz),L=Math.hypot(tx,tz)||1;
        placed.push({x:lx,z:lz,rad});
        lots.push({x:lx,z:lz,w,d,ry:Math.atan2(tx/L,tz/L),tx:tx/L,tz:tz/L,row:0,street:null,k:lots.length});
      }
      lots.sort((a,b)=>Math.hypot(a.x-cx,a.z-cz)-Math.hypot(b.x-cx,b.z-cz));
      // Shops: nearest lots to the centre get the shops; hero rosters override.
      const hero=heroShops(site);
      let shopTypes=hero?[...hero.map(h=>h.type),...((site.kind==='town'||site.kind==='city')?['guild_f','guild_m']:[])]:[...plan.shops,...plan.optional.filter(()=>r()<.5)]; // hero towns get guild halls too
      if(TST&&!hero)shopTypes=shopsFor(site,shopTypes,P);
      if(TST&&withBuilds){TST.builds.forEach(b=>{if(!b.done)return;if(b.key==='inn'&&!shopTypes.includes('inn'))shopTypes.push('inn');if(b.key==='chapel'&&!shopTypes.includes('church'))shopTypes.push('church');if(b.key==='guild'&&!shopTypes.includes('guild_f'))shopTypes.push('guild_f');});}
      // Size shop lots by type first, then drop any later lot that overlaps an
      // earlier one (shops come first, so churches/keeps keep their room).
      lots.forEach((lot,i)=>{const t=shopTypes[i];if(t==='church'){lot.w=Math.max(lot.w,7);lot.d=Math.max(lot.d,9);}else if(t==='castle'){lot.w=14;lot.d=11;}else if(t==='guild_f'||t==='guild_m'){lot.w=13;lot.d=11;}});
      const kept=[];
      // S193 — a lot made bigger above (a keep, a guild hall, a church) is checked against the roads again: its corners
      // could reach one (3 of 1,062 buildings in thirty towns stood on a road)
      const lotOnRoad=lot=>{const c=Math.cos(lot.ry),s_=Math.sin(lot.ry);for(let u=-1;u<=1;u+=.5)for(let v=-1;v<=1;v+=.5){const lx=u*lot.w/2,lz=v*lot.d/2;const ri=roadInfo(lot.x+lx*c+lz*s_,lot.z-lx*s_+lz*c);if(ri&&ri.d<ROAD_HALF+.6)return true;}return false;};
      lots.forEach(lot=>{const rad=Math.max(lot.w,lot.d)/2+2.0;if(Math.hypot(lot.x-cx,lot.z-cz)>inner-Math.max(lot.w,lot.d)/2-1)return; // whole footprint inside the ring
        if(lot.w*lot.d>60&&lotOnRoad(lot))return;
        if(kept.some(k=>Math.hypot(k.x-lot.x,k.z-lot.z)<Math.max(k.w,k.d)/2+2.0+rad))return;kept.push(lot);});
      const use=kept.slice(0,Math.max(want,0)); // homes fill whatever the shops don't
      // ports: the shipwright gets its own lot at the quay head, door toward the quay
      if(site.kind==='port'&&site.quayStart){const si=shopTypes.indexOf('shipwright');const sd=shoreDir(site);
        if(si>=0&&sd){const q=site.quayStart;const lx=site.shipwrightLot?site.shipwrightLot.x:q.x-sd.dx*9-sd.dz*11,lz=site.shipwrightLot?site.shipwrightLot.z:q.z-sd.dz*9+sd.dx*11;const tx=-(-sd.dz),tz=-(sd.dx);
          const lot={x:lx,z:lz,w:7,d:6,ry:Math.atan2(tx,tz),tx,tz,row:0,street:null,two:true,k:'sw'};
          shopTypes.splice(si,1);shopTypes.unshift('shipwright');use.unshift(lot);}}
      return {r,use,shopTypes,hero,lots};}
    const PL=planLots(TST?prosperity(site):0,true);const use=PL.use,shopTypes=PL.shopTypes,hero=PL.hero;r=PL.r;
    {const base=TST?planLots(baseProsperity(site),false).use:use;const at=new Map();base.forEach((l,i)=>at.set(l.k,i));
      const idOf=l=>{l.n=at.has(l.k)?at.get(l.k):1000+(typeof l.k==='number'?l.k:0);return `g_${site.id}_${l.n}`;};
      // every lot this build could use, in order; your own house is never dropped for want of lots nor given to a shop
      const all=PL.lots;all.forEach(l=>l.id=idOf(l));use.forEach(l=>l.id=idOf(l));
      const mine=l=>ownedHouse(l.id);
      all.forEach(l=>{if(mine(l)&&!use.some(u=>u.k===l.k)&&!use.some(u=>Math.hypot(u.x-l.x,u.z-l.z)<Math.max(u.w,u.d)/2+2+Math.max(l.w,l.d)/2+2))use.push(l);});
      const nS=shopTypes.length;for(let i=0;i<Math.min(nS,use.length);i++){if(!mine(use[i]))continue;const j=use.findIndex((u,k)=>k>=nS&&!mine(u));if(j<0)break;const o=use[i];use[i]=use[j];use.splice(j,1);use.push(o);}}
    const names=NAMES[reg];
    const usedNames=new Set();
    function newName(){let n;for(let k=0;k<20;k++){n=pick(r,r()<.5?names.m:names.f);if(!usedNames.has(n))break;}usedNames.add(n);return n;}
    // v80 S244 — a person, once drawn for a lot (or a gate's post), is the town's for good: a rebuild at another prosperity
    // draws the stream in another order and used to rename most of the town. makeDef keeps the name and people under
    // extra.nameKey in the town's state (TST.nm) and still makes every draw, so the stream and all else drawn from it is
    // exactly what it was.
    const NM=TST?(TST.nm||(TST.nm={})):null;_curNM=NM;if(NM)_twinUsed=twinsFromRecord(NM);
    function keptName(key,drawn){if(!NM)return drawn;if(NM[key]==null)NM[key]=drawn;return NM[key];}
    const footReq=[];
    use.forEach((lot,i)=>{
      const type=shopTypes[i]||null;
      const isShop=!!type;
      let geo,solR;
      const standing=burnedV&&storyRuin(site)&&hero&&hero[i]&&ASH_SURVIVORS.includes(hero[i].keeper); // S269 — Edna's cottage and the oratory come through the burning
      if(TST&&!standing&&(burnedV||abandonedV||(sackedV&&!isShop&&r()<.5))){ // a shell: black walls, no roof, nobody home
        if(burnedV&&hero&&hero[i]&&hero[i].keeper==='Bram')S._forge={x:lot.x+lot.tx*(lot.d/2+1.6),z:lot.z+lot.tz*(lot.d/2+1.6)}; // S270 — where Bram fell, before his door
        const sh=buildingGeoLo(lot.w,lot.d,Object.assign({},st,{wall:burnedV?0x1a1614:0x6a665e,wall2:burnedV?0x120f0d:0x5a564e,roof:burnedV?0x0a0806:0x3a3632,roof2:0x0a0806,thatch:false,framed:false}),r,{chimney:false,twoStory:false,h:st.h*.8,rise:.2});const m=addMesh(sh,lot.x,lot.z,lot.ry,0);return;} // forEach: skip the rest of this lot
      if(!isShop&&TST&&r()<shutteredShare(site))lot._shuttered=true;
      if(type==='church')geo=churchGeo(lot.w,lot.d,st,r);
      else if(type==='castle')geo=keepGeo(lot.w,lot.d,st,r);
      else if(type==='guild_f'||type==='guild_m'){lot.two=true;geo=buildingGeo(lot.w,lot.d,STYLE.stone,r,{chimney:true,twoStory:true,h:3.4,rise:1.8});}
      else if(site.kind==='port'&&site.quayStart&&Math.hypot(lot.x-site.quayStart.x,lot.z-site.quayStart.z)<34){const fk=NAT.people==='gatelander'?'aurenne':NAT.people==='aurennais'?'mark':'irish';lot.two=r()<.4;geo=buildingGeo(lot.w,lot.d,STYLE[fk]||STYLE.irish,r,{chimney:true,twoStory:lot.two,h:(STYLE[fk]||STYLE.irish).h,rise:(STYLE[fk]||STYLE.irish).rise});lot.foreign=fk;} // the foreign quarter by the water
      else if(biome==='swamp'&&site.kind==='village'){lot.two=false;geo=mushroomGeo(lot.w,lot.d,st,r);}
      else if(biome==='tundra'&&site.kind==='village'&&site.islet){lot.two=false;geo=iceGeo(lot.w,lot.d,st,r);}
      else{lot.two=r()<(st.twoStory||0)||type==='inn';geo=buildingGeo(lot.w,lot.d,st,r,{chimney:r()<.65,twoStory:lot.two,h:type==='inn'?3.2:st.h,rise:type==='inn'?1.9:st.rise});}
      solR=Math.max(lot.w,lot.d)/2*.85;
      const m=addMesh(geo,lot.x,lot.z,lot.ry,0);
      {const ch=chimneyAt(geo,m,type||'home');if(ch)S.chimneys.push(ch);} // S343 — its smoke
      // rotated footprint (settleSolid understands {c,s} rotated rects)
      sol.push({cx:lot.x,cz:lot.z,rx:lot.w/2+.15,rz:lot.d/2+.15,c:Math.cos(lot.ry),s:Math.sin(lot.ry),bt:type||'home',hid:lot.id,sh:lot._shuttered?1:0}); // v80 S138 — the map colours it by type
      // footpath: door → the street/road it faces
      {
        const fx=lot.x+lot.tx*(lot.d/2+.3),fz=lot.z+lot.tz*(lot.d/2+.3);
        let ex=fx+lot.tx*(lot.row*(9.5+LAT_GAP)+(lot.street?2.5:ROAD_BLEND)),ez=fz+lot.tz*(lot.row*(9.5+LAT_GAP)+(lot.street?2.5:ROAD_BLEND));
        const ri=roadInfo(ex,ez);if(ri&&ri.d>ROAD_HALF+1&&!lot.street){const sg=ri.seg,vx=sg.bx-sg.ax,vz=sg.bz-sg.az,t=ri.t;ex=sg.ax+vx*t;ez=sg.az+vz*t;}
        footReq.push({fx,fz,ex,ez,lot,hid:`g_${site.id}_${i}`}); // S193 — routed once every building stands (below)
      }
      const doorX=lot.x+lot.tx*(lot.d/2+.15),doorZ=lot.z+lot.tz*(lot.d/2+.15);
      if(!isShop){
        // Residence: enterable 'home' interior, a named resident who keeps
        // house inside and idles by the door outside in daylight.
        const resident=newName();
        const exX=doorX+lot.tx*2.4,exZ=doorZ+lot.tz*2.4;
        const rdef=makeDef(site,reg,r,'Villager',resident,{nameKey:lot.n,x:doorX+lot.tx*1.4+lot.tz*1.0,z:doorZ+lot.tz*1.4-lot.tx*1.0,bCol:pick(r,[0x5a4030,0x3a5a3a,0x604828,0x504058,0x6a5a3a]),sCol:pick(r,[0xd4a878,0xc09070,0xb08060]),role:pick(r,['resident','farmer','weaver','cooper','old woman','fisher'])});
        rdef.roleTag=rdef.role;rdef.role='Villager';
        const hh={id:lot.id,doorX,doorZ,doorFace:cardinalFace(lot.tx,lot.tz),exitX:exX,exitZ:exZ,exitYaw:Math.atan2(-lot.tx,-lot.tz),name:`${rdef.name}'s House`,keeper:rdef.name,_twin:rdef._twin,type:'home',tagline:'',bCol:rdef.bCol,sCol:rdef.sCol,dlg:rdef,w:lot.w,d:lot.d,two:lot.two,reg,style:st===STYLE.stone?'stone':st===STYLE.garrison?'garrison':reg,roleTag:rdef.roleTag,siteKind:site.kind,siteId:site.id};
        if(lot._shuttered){hh.shuttered=true;hh.name=`${rdef.name}'s House (shuttered)`;hh.tagline='Gone to the city. Door nailed.';}
        if(ownedHouse(hh.id)){hh.name='Your House';hh.ownedByPlayer=true;}else rdef._extra.unshift(...houseTopics(hh));
        houses.push(hh);
        // residents stream in by distance (a city has 150+ of them)
        S.residents.push({def:rdef,ry:lot.ry+Math.PI,n:null,door:{x:exX,z:exZ}});
        return;
      }
      const heroH=hero&&hero[i];
      const keeper=heroH?heroH.keeper:newName();
      const noun=SHOP_NOUN[type]?(SHOP_NOUN[type][reg]||SHOP_NOUN[type].irish||''):'';
      let name=heroH?heroH.name:type==='inn'?keptName('i'+lot.n,pickFree(r,INN_NAMES[reg],_innNames)):type==='church'?(reg==='french'?`Chapelle de ${site.name}`:`${/^(la|le|les|l'|l’|the) /i.test(site.name)?'':'The '}${site.name} ${noun}`):type==='castle'?`${site.name} Keep`:(type==='guild_f'||type==='guild_m')?GUILD_DEF[type].name:`${keeper}'s ${noun}`;
      if(type==='inn')_innNames.add(name);
      // explicit exit point in front of the door (rotated buildings defeat the engine's cardinal step-out)
      let exX=doorX+lot.tx*2.4,exZ=doorZ+lot.tz*2.4;
      const house={id:lot.id,doorX,doorZ,doorFace:cardinalFace(lot.tx,lot.tz),exitX:exX,exitZ:exZ,exitYaw:Math.atan2(-lot.tx,-lot.tz),name,keeper,type,tagline:heroH?heroH.tagline:pick(r,TAGLINES[type]||TAGLINES.misc),bCol:heroH?heroH.bCol:0x5a4030,sCol:heroH?heroH.sCol:0xd4a878,w:lot.w,d:lot.d,two:lot.two,reg,style:st===STYLE.stone?'stone':st===STYLE.garrison?'garrison':reg,siteKind:site.kind,siteId:site.id};
      houses.push(house);
      { // wall lantern by the door (glow only)
        const lx=doorX+lot.tx*.25+lot.tz*1.05,lz=doorZ+lot.tz*.25-lot.tx*1.05,ly=worldH(doorX,doorZ)+2.05;
        {const m=new THREE.Mesh(doorLanternGeo(),VC_MAT);m.position.set(doorX+lot.tz*1.05,ly,doorZ-lot.tx*1.05);m.rotation.y=lot.ry;group.add(m);} // S258 — bracket and cage on the kit
        const lg=new THREE.Group();const pane=new THREE.Mesh(new THREE.BoxGeometry(.12,.17,.12),new THREE.MeshBasicMaterial({color:0xffc860,transparent:true,opacity:.55}));lg.add(pane);
        const fl=new THREE.Mesh(new THREE.ConeGeometry(.03,.09,6),new THREE.MeshBasicMaterial({color:0xffe090}));fl.position.y=-.01;lg.add(fl);lg.position.set(lx,ly,lz);group.add(lg);S.lamps.push({glass:lg,light:null});
      }
      let signY=null; // S246 — the trade sign is painted once the keeper's name is final (below)
      if(type==='guild_f'||type==='guild_m'){
        const y=worldH(doorX,doorZ);const col=GUILD_DEF[type].col;
        [-1,1].forEach(sd=>{const bx=doorX+lot.tx*.3-lot.tz*sd*2.4,bz=doorZ+lot.tz*.3+lot.tx*sd*2.4;
          const pole=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,1.1),new THREE.MeshLambertMaterial({color:0x2a2622}));pole.position.set(bx+lot.tx*.45,y+5.3,bz+lot.tz*.45);pole.rotation.y=lot.ry;group.add(pole);
          const cloth=new THREE.Mesh(new THREE.PlaneGeometry(1.1,3.4),new THREE.MeshLambertMaterial({color:col,side:THREE.DoubleSide}));cloth.position.set(bx+lot.tx*.95,y+3.55,bz+lot.tz*.95);cloth.rotation.y=lot.ry;group.add(cloth);
          const dev=new THREE.Mesh(new THREE.PlaneGeometry(.7,.7),new THREE.MeshLambertMaterial({map:signTexture(type,''),side:THREE.DoubleSide}));dev.position.set(bx+lot.tx*.97,y+4.2,bz+lot.tz*.97);dev.rotation.y=lot.ry;group.add(dev);});
        signY=y;
      } else if(type==='castle'){
        // seat of power: heraldic banners flanking the gate and a carved plaque above it
        const y=worldH(doorX,doorZ);const col=pick(r,[0x7a2020,0x203a6a,0x6a5a20,0x2a4a2a]);
        [-1,1].forEach(sd=>{const bx=doorX+lot.tx*.35-lot.tz*sd*2.6,bz=doorZ+lot.tz*.35+lot.tx*sd*2.6;
          const pole=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,1.2),new THREE.MeshLambertMaterial({color:0x2a2622}));pole.position.set(bx+lot.tx*.5,y+5.6,bz+lot.tz*.5);pole.rotation.y=lot.ry;group.add(pole);
          const cloth=new THREE.Mesh(new THREE.PlaneGeometry(1.0,3.2),new THREE.MeshLambertMaterial({color:col,side:THREE.DoubleSide}));cloth.position.set(bx+lot.tx*1.0,y+4.0,bz+lot.tz*1.0);cloth.rotation.y=lot.ry;group.add(cloth);
          const dev=new THREE.Mesh(new THREE.PlaneGeometry(.55,.55),new THREE.MeshLambertMaterial({map:signTexture('castle',''),side:THREE.DoubleSide}));dev.position.set(bx+lot.tx*1.02,y+4.6,bz+lot.tz*1.02);dev.rotation.y=lot.ry;group.add(dev);});
        const plq=textPlane(name,3.2,.6,'#d8ccb0','#4a4640');plq.position.set(doorX+lot.tx*.08,y+3.9,doorZ+lot.tz*.08);plq.rotation.y=lot.ry;group.add(plq);
      } else {
        // hanging trade sign above the door, symbol by business
        signY=worldH(doorX,doorZ);
      }
      // keeper at the door
      const kx=doorX+lot.tx*1.6+lot.tz*.9,kz=doorZ+lot.tz*1.6-lot.tx*.9;
      const role=SHOP_ROLE[type]||'Merchant';
      if(type==='guild_f'||type==='guild_m'){house.guild=type;house.dlg=null;}
      const def=(type==='guild_f'||type==='guild_m')?guildDef(type,site,keeper,{x:kx,z:kz,bCol:house.bCol,sCol:house.sCol}):makeDef(site,reg,r,role,keeper,{nameKey:lot.n,authored:!!heroH,people:heroH?'gatelander':undefined,x:kx,z:kz,bCol:house.bCol,sCol:house.sCol,topics:type==='shipwright'?[{get label(){return `Buy a ship (${shipPriceNow()} gold${shipPriceNow()<SHIP_PRICE?", with Corwin's note":''})`;},quest:true,fn:()=>buyShip(site)},{label:`What do you sell?`,response:'Hulls. Sound ones. And rope, if you ask nicely.'}]:[{label:`What do you sell?`,response:house.tagline}]});
      def._houseId=house.id; // v80 S138 — who keeps what, by identity (names collide)
      house.keeper=def.name;house._twin=def._twin;if(!heroH&&/'s /.test(house.name||''))house.name=house.name.replace(/^[^']+'s /,def.name+"'s ");
      if(signY!==null)buildTradeSign(group,type,house.name,doorX,doorZ,lot.tx,lot.tz,lot.ry,signY);
      if(type==='shipwright'){const base=def._extra.slice();Object.defineProperty(def,'_extra',{get(){const buy=base[0],rest=base.slice(1);return worldState.ship?[...upgradeTopics(site),...rest]:[buy,...rest];}});}
      if(house.guild||type==='shipwright'||type==='inn')house.dlg=def; // steward / shipwright / innkeeper talk inside (the innkeeper lets the rooms)
      if(type==='inn')def._extra.unshift(...innTopics(house)); // v80 — the innkeeper lets the rooms; S141 — one of them; S237 — shared with the coaching inn
      if(type==='castle'){def._extra.unshift(...lordTopics(site));def._extraFn=()=>[...tutTownTopics(site),...factionTopics(site),...fineTopics(site),...investTopics(site),...routeTopics(site),...coachTopics(site)];house.dlg=def;} // the keep's steward carries the lord's quests
      if(type==='church'){def._extraFn=()=>[...penanceTopics(site)];if(!house.dlg)house.dlg=def;} // S158 — the priest hears a confession
      const kn=spawnNPC(def,lot.ry+Math.PI,true);kn.sched={type:type==='inn'?'innkeeper':(house.guild?'innkeeper':'keeper'),door:{x:exX,z:exZ},plaza:{x:cx,z:cz},shop:type};snpcs.push(kn);
    });
    {const innH=houses.find(h=>h.type==='inn');S.innDoor=innH?{x:innH.exitX,z:innH.exitZ}:null;snpcs.forEach(n=>{if(n.sched&&n.sched.type==='keeper')n.sched.inn=S.innDoor;});}
    const clearDead=()=>{snpcs.forEach(n=>{sc.remove(n.g);sc.remove(n.dot);});snpcs.length=0;}; // S269 — out of the scene too, not only out of the list
    if(burnedV||abandonedV){S.dead=true;clearDead();}
    if(TST)TST.builds.forEach((b,k)=>{if(b.done)return;const sx=cx+14+k*6,sz=cz-16;const y=worldH(sx,sz);const m=new THREE.Mesh(buildSiteGeo(pRng(pHash(site.id+'|build|'+k))),VC_MAT);m.position.set(sx,y,sz);m.castShadow=true;m.receiveShadow=true;group.add(m);sol.push({cx:sx,cz:sz,rx:1.8,rz:1.8});}); // S255 — a building site on the kit (four box posts, a slab and a block)
    // The town's lord: by the well through the day (cities' lords keep to the keep; the steward speaks for them)
    if(plan.rows>0&&(site.kind!=='city'||!houses.some(h=>h.type==='castle'))&&!site.lordless&&!burnedV&&!abandonedV){const lord=lordFor(site);const ldef=makeDef(site,reg,r,lord.title,lord.name,{keepName:true,nameKey:'lord',people:NAT.people,x:cx+3,z:cz-4,bCol:[0x6a2a2a,0x2a3a6a,0x4a3a1a][site.kind==='town'?1:2],sCol:0xd4a878,topics:lordTopics(site)});
      ldef._extraFn=()=>[...tutTownTopics(site),...factionTopics(site),...fineTopics(site),...investTopics(site),...routeTopics(site),...coachTopics(site)];
      ldef._lord=true;const ln=spawnNPC(ldef,0,false);ln.sched={type:'villager',plaza:{x:cx,z:cz},padR:6};snpcs.push(ln);S.lordNpc=ln;}
    // Lamps: iron posts around the plaza and at the gates carry real lights
    // after dark; every shop door gets a wall lantern that glows (no light —
    // a city has a hundred of them). Lit state toggled in tickSettlements.
    const lampPost=(x,z,lit,fx,fz)=>{const y=worldH(x,z);
      // the arm and lantern hang toward (fx,fz) — the street or the plaza
      let dx=fx==null?0:fx-x,dz=fz==null?1:fz-z;const Ld=Math.hypot(dx,dz)||1;dx/=Ld;dz/=Ld;const ang=Math.atan2(dx,dz);
      // S258 — the post, its footing, the scrolled arm and the lantern's cage on the kit, one mesh; flame + glass inside
      {const m=new THREE.Mesh(lampPostGeo(),VC_MAT);m.position.set(x,y,z);m.rotation.y=ang;m.castShadow=true;group.add(m);}
      const hx=x+dx*.42,hy=y+2.85,hz=z+dz*.42;
      const glass=new THREE.Group();
      const pane=new THREE.Mesh(new THREE.BoxGeometry(.2,.26,.2),new THREE.MeshBasicMaterial({color:0xffc860,transparent:true,opacity:.55}));glass.add(pane);
      const flame=new THREE.Mesh(new THREE.ConeGeometry(.05,.14,6),new THREE.MeshBasicMaterial({color:0xffe090}));flame.position.y=-.02;glass.add(flame);
      glass.position.set(hx,hy,hz);group.add(glass);
      let light=null;if(lit){light=regLight(0xffb050,0,16,site.id);light.position.set(hx,hy+.05,hz);}
      sol.push({cx:x,cz:z,rx:.12,rz:.12});S.lamps.push({glass,light});};
    if(plan.rows>0&&(!TST||lampsLit(site))&&!burnedV&&!abandonedV){[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>lampPost(cx+sx*9,cz+sz*9,true,cx,cz));}
    if(site.kind==='port'){buildHarbour(S,site,r);spawnGulls(S,site);}
    if(plan.rows>0)streets.slice(0,3).forEach(rd=>{const q=rd.pts.find(p=>Math.abs(Math.hypot(p.x-cx,p.z-cz)-(pad-14))<5);if(q){const nx=-(cz-q.z),nz=(cx-q.x);const L2=Math.hypot(nx,nz)||1;lampPost(q.x+nx/L2*3.2,q.z+nz/L2*3.2,true,q.x,q.z);}});
    // Plaza: well + stalls; cairn already stands at the centre.
    if(plan.rows>0){
      addMesh(wellGeo(),cx+6,cz+4,r()*Math.PI,1.3);
      for(let i=0;i<plan.stalls;i++){
        const ang=r()*Math.PI*2,rad0=9+r()*5,sx=cx+Math.cos(ang)*rad0,sz=cz+Math.sin(ang)*rad0;
        const ri=roadInfo(sx,sz);if(ri&&ri.d<4)continue;
        addMesh(stallGeo(r),sx,sz,ang+Math.PI/2,1.4);
      }
    }
    // Walls with gates where roads cross; towers at the gates.
    if(plan.walls&&!burnedV&&!abandonedV){
      const WT=TST?wallTierFor(site):(plan.walls==='palisade'?'logs':'stone');const WS=WALL_SPEC[WT]; // v80 S129 — fence → logs → stone → dressed stone
      const R=pad-5,segs=Math.max(20,Math.round(R/3.2)),wallH=WS.h;
      const c=x=>new THREE.Color(x);
      const wallC=WS.wall!=null?c(WS.wall):c(STYLE.stone.wall),capC=WS.cap!=null?c(WS.cap):c(STYLE.stone.wall2);
      for(let i=0;i<segs;i++){
        const a0=i/segs*Math.PI*2,a1=(i+1)/segs*Math.PI*2,am=(a0+a1)/2;
        const mx=cx+Math.cos(am)*R,mz=cz+Math.sin(am)*R;
        // S193 — the road is looked for along the whole segment (about 20 long), not at its middle alone: a road crossing
        // near a segment's end ran into the wall
        let ri=null,qx=mx,qz=mz;for(let k=0;k<=8;k++){const a=a0+(a1-a0)*k/8,x=cx+Math.cos(a)*R,z=cz+Math.sin(a)*R;const r2=roadInfo(x,z);if(r2&&(!ri||r2.d<ri.d)){ri=r2;qx=x;qz=z;}}
        if(ri&&ri.d<9){ // gate: towers flank the road where it actually crosses the ring
          const sg=ri.seg;const vx=sg.bx-sg.ax,vz=sg.bz-sg.az,L2=vx*vx+vz*vz||1;const t=Math.max(0,Math.min(1,((qx-sg.ax)*vx+(qz-sg.az)*vz)/L2));const gx=sg.ax+vx*t,gz=sg.az+vz*t;
          if(S._gates.some(g=>Math.hypot(g.x-gx,g.z-gz)<12))continue; // one pair per crossing
          S._gates.push({x:gx,z:gz,tier:WT});
          // S275 — the gate and its towers stand square to the road where it crosses (they were set by the segment's middle,
          // up to 33 degrees askew, and roads cross the ring up to 49 degrees off the radial): local +z along the road into the town
          let ux=vx,uz=vz;if(ux*(cx-gx)+uz*(cz-gz)<0){ux=-ux;uz=-uz;}const gry=Math.atan2(ux,uz),ax_=Math.cos(gry),az_=-Math.sin(gry);
          {const inner=WS.towers?ROAD_HALF+3.6-(WT==='logs'?1.0:WT==='dressed'?2.2:1.9):ROAD_HALF+1.4; // S275 — the gate itself, in the road's frame (+z into the town)
            const gg=townGateGeo(WT,inner,wallH,WS.d,wallC,capC,pRng(pHash(site.id+'|gate|'+i)));
            const cs=Math.cos(gry),sn=Math.sin(gry),w2=(lx,lz)=>[gx+lx*cs+lz*sn,gz-lx*sn+lz*cs];
            // where a second road meets the first at the gate, a jamb or a leaf would stand on it: that crossing stays an open gap
            const onRoad=(lx,lz)=>{const [x,z]=w2(lx,lz),q=roadInfo(x,z);return q&&q.d<ROAD_HALF-.4;};let clash=false;
            for(const s of [-1,1])if(onRoad(s*(inner-.1),0))clash=true;
            for(const lf of gg.userData.leaves){const c2=Math.cos(lf.ry),s2=Math.sin(lf.ry);for(let u=-1;u<=1;u+=.5)if(onRoad(lf.x+u*lf.rx*c2,lf.z-u*lf.rx*s2))clash=true;}
            if(clash){gg.dispose();gg.userData.lo.dispose();S._gates[S._gates.length-1].open=true;}
            else{const gm=addMesh(gg,gx,gz,gry,0);gm.userData.gate=WT;
            for(const s of [-1,1]){const [jx,jz]=w2(s*(inner-.1),0);sol.push({cx:jx,cz:jz,rx:.4,rz:WS.d/2+.1,c:cs,s:sn,bt:'gate'});}
            for(const lf of gg.userData.leaves){const [lx,lz]=w2(lf.x,lf.z),a=gry+lf.ry;sol.push({cx:lx,cz:lz,rx:lf.rx,rz:lf.rz,c:Math.cos(a),s:Math.sin(a),bt:'gate'});}}}
          if(!WS.towers)continue;
          [-1,1].forEach(sd=>{const tx=gx+ax_*sd*(ROAD_HALF+3.6),tz=gz+az_*sd*(ROAD_HALF+3.6);
            const t=gateTowerHi(WT,wallH,capC,c(STYLE.stone.roof2),pRng(pHash(site.id+'|gt|'+i+'|'+sd))); // S249 — in detail near, the old tower its distant copy
            t.userData.lo=mergeParts([{geo:WS.towers==='box'?new THREE.BoxGeometry(1.6,wallH+1.2,1.6):new THREE.CylinderGeometry(WT==='dressed'?2.1:1.8,WT==='dressed'?2.3:2.0,wallH+2.4,8),color:capC,y:(wallH+2.4)/2,jitter:.06},{geo:new THREE.ConeGeometry(WT==='dressed'?2.4:2.1,1.6,8),color:c(STYLE.stone.roof2),y:wallH+2.4+.8,jitter:.06}]);
            addMesh(t,tx,tz,0,1.8);});
          continue;
        }
        const len=2*R*Math.sin(Math.PI/segs)+.3;
        const y=worldH(mx,mz);
        const wry=-am-Math.PI/2; // box length runs along the ring tangent
        // S249 — each segment its own mesh, in detail near with the old boxes (in its own frame) as the distant copy; the bake
        // clusters them with the houses by place
        const lp=[];if(WT==='fence'){lp.push({geo:new THREE.BoxGeometry(len,.12,.12),color:wallC,y:.55,jitter:.03});lp.push({geo:new THREE.BoxGeometry(len,.12,.12),color:wallC,y:1.05,jitter:.03});lp.push({geo:new THREE.BoxGeometry(.16,1.2,.16),color:capC,y:.6,jitter:.02});}
        else lp.push({geo:new THREE.BoxGeometry(len,wallH,WS.d),color:wallC,y:wallH/2,jitter:.07});
        if(WS.crenels){const K=WS.crenels;for(let k=-K;k<=K;k++)lp.push({geo:new THREE.BoxGeometry(.9,.6,WS.d+.1),color:capC,x:k*len*(K===1?.3:.18),y:wallH+.3,jitter:.06});}
        {const tx_=-Math.sin(am)*len/2,tz_=Math.cos(am)*len/2;const hiG=wallSegHi(WT,len,wallH,WS.d,wallC,capC,worldH(mx-tx_,mz-tz_)-y,worldH(mx+tx_,mz+tz_)-y,pRng(pHash(site.id+'|wall|'+i)));
          for(const [geo,lod] of [[hiG,'hi'],[mergeParts(lp),'lo']]){const m=new THREE.Mesh(geo,SETTLE_MAT);m.position.set(mx,y,mz);m.rotation.y=wry;m.castShadow=true;m.receiveShadow=true;m.userData.lod=lod;m.userData.wall=WT;group.add(m);}}
        sol.push({cx:mx,cz:mz,rx:len/2,rz:WS.capRz,c:Math.cos(wry),s:Math.sin(wry),bt:'wall'});
      }
      // a couple of guards at the gates
      streets.slice(0,2).forEach((rd,gi)=>{
        const q=rd.pts.find(p=>Math.abs(Math.hypot(p.x-cx,p.z-cz)-(R-6))<4);
        if(!q)return;
        const def=makeDef(site,reg,r,'Guard',newName(),{nameKey:'g'+gi,x:q.x+3,z:q.z,bCol:NAT.banner,sCol:0x808090});
        const gn=spawnNPC(def,Math.atan2(cx-q.x,cz-q.z),true);gn.sched={type:'guard',a:{x:q.x+3,z:q.z},b:{x:cx+6,z:cz+6}};snpcs.push(gn);
      });
    }
    // Night watchman: unwalled villages get one, who sleeps by day and walks
    // the road-in ↔ plaza with a torch after dark.
    if(!plan.walls&&plan.rows>0&&streets.length){
      const rd=streets[0];const q=rd.pts.find(p=>Math.abs(Math.hypot(p.x-cx,p.z-cz)-(pad-6))<5)||rd.pts[0];
      const def=makeDef(site,reg,r,'Guard',newName(),{nameKey:'w',x:cx+4,z:cz+4,bCol:0x3a3a48,sCol:0xb89878,role:'night watch'});def.role='Guard';
      const wn=spawnNPC(def,0,true);wn.sched={type:'watch',a:{x:q.x+2,z:q.z},b:{x:cx+4,z:cz+4}};snpcs.push(wn);
    }
    // Camps, ruins, standing stones.
    if(plan.tents){for(let i=0;i<plan.tents;i++){const ang=i/plan.tents*Math.PI*2+r();const x=cx+Math.cos(ang)*6,z=cz+Math.sin(ang)*6;addMesh(tentGeo(r),x,z,r()*Math.PI,1.8);}
      const fx=cx+1.5,fz=cz+2.5;const fl=regLight(0xff8a30,1.2,10,site.id);fl.position.set(fx,worldH(fx,fz)+.9,fz);
      const ember=new THREE.Mesh(new THREE.SphereGeometry(.25,6,6),new THREE.MeshBasicMaterial({color:0xff7a22}));ember.position.set(fx,worldH(fx,fz)+.2,fz);group.add(ember);
      const def=makeDef(site,reg,r,'Hermit',site.id==='hermit_camp'?'The Hermit':newName(),{x:cx+3.5,z:cz+4.5,bCol:0x4a4038,sCol:0xb09878,role:'old hermit'});def.role='Hermit';
      snpcs.push(spawnNPC(def,Math.PI,true));}
    if(plan.ruins){for(let i=0;i<plan.ruins;i++){const ang=r()*Math.PI*2,rad0=8+r()*(pad-16);addMesh(ruinGeo(r),cx+Math.cos(ang)*rad0,cz+Math.sin(ang)*rad0,r()*Math.PI,2.2);}}
    if(plan.stones){for(let i=0;i<plan.stones;i++){const ang=i/plan.stones*Math.PI*2;addMesh(standingStoneGeo(r),cx+Math.cos(ang)*11,cz+Math.sin(ang)*11,ang,.6);}}
    // Footpaths and streets as flat ribbons on the pad.
    // S193 — footpaths: straight from the door to its street when nothing stands between; otherwise a dog-leg out
    // of the door, along the gap beside the house in the way and on to the street; with no way through, none (a
    // back-row door's path used to run straight through the house in front: 7–18% of footpath in a town)
    {const blds=sol.filter(b=>b.bt);const inB=(x,z,own)=>blds.some(b=>{if(b.hid===own)return false;const ex=x-b.cx,ez=z-b.cz,c=b.c==null?1:b.c,s_=b.s||0;return Math.abs(ex*c-ez*s_)<b.rx+.5&&Math.abs(ex*s_+ez*c)<b.rz+.5;});
      const clear=(a,b,own)=>{const L=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(L/.4));for(let k=0;k<=n;k++){if(inB(a.x+(b.x-a.x)*k/n,a.z+(b.z-a.z)*k/n,own))return false;}return true;};
      const clearPath=(P,own)=>{for(let k=0;k<P.length-1;k++)if(!clear(P[k],P[k+1],own))return false;return true;};
      for(const q of footReq){const F={x:q.fx,z:q.fz},E={x:q.ex,z:q.ez},own=q.hid;let P=[F,E];
        if(!clearPath(P,own)){P=null;const tx=q.lot.tx,tz=q.lot.tz,px_=-tz,pz_=tx;const A={x:F.x+tx*1.1,z:F.z+tz*1.1};
          outer:for(const o of [q.lot.w/2+1.4,q.lot.w/2+3,q.lot.w/2+5])for(const sd of [1,-1]){const B={x:A.x+px_*sd*o,z:A.z+pz_*sd*o},C={x:E.x+px_*sd*o,z:E.z+pz_*sd*o};
            const cand=[F,A,B,C,E];if(clearPath(cand,own)){P=cand;break outer;}}}
        if(P)paths.push({w:1.3,pts:P});}}
    S.paths=paths; // S193 — kept for the checks on overlaps
    if(paths.length){
      const pos=[],col=[];const tone=roadTone(cx,cz).clone().multiplyScalar(.92);
      paths.forEach(pth=>{const W=pth.w/2;
        // subdivide to ≤3u so every vertex sits on the terrain, never bridging a dip
        const fine=[];for(let i=0;i<pth.pts.length-1;i++){const a=pth.pts[i],b=pth.pts[i+1];const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/3));for(let k=0;k<n;k++)fine.push({x:a.x+(b.x-a.x)*k/n,z:a.z+(b.z-a.z)*k/n});}fine.push(pth.pts[pth.pts.length-1]);
        for(let i=0;i<fine.length-1;i++){const a=fine[i],b=fine[i+1];const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1,nx=-dz/L*W,nz=dx/L*W;
        const v=[[a.x+nx,a.z+nz],[a.x-nx,a.z-nz],[b.x-nx,b.z-nz],[b.x+nx,b.z+nz]];
        const cross=(v[1][0]-v[0][0])*(v[2][1]-v[0][1])-(v[1][1]-v[0][1])*(v[2][0]-v[0][0]);
        const tri=cross<0?[0,1,2,0,2,3]:[0,2,1,0,3,2];
        for(const k of tri){const [x,z]=v[k];pos.push(x,worldH(x,z)+.05,z);const g=1+(Math.random()-.5)*.12;col.push(tone.r*g,tone.g*g,tone.b*g);}}});
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
      const nor=new Float32Array(pos.length);for(let i=1;i<nor.length;i+=3)nor[i]=1;g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.computeBoundingSphere();
      const pm=new THREE.Mesh(g,ROAD_MAT);pm.receiveShadow=true;snowWatch(g);group.add(pm); // v80 S147
    }
    // Loot barrels and crates tucked beside buildings — everyday goods only.
    if(plan.rows>0){
      const nb=site.kind==='city'?10:site.kind==='town'?7:site.kind==='village'?4:2;
      const barrelMat=new THREE.MeshLambertMaterial({color:0x6a4418}),crateMat=new THREE.MeshLambertMaterial({color:0x7a5a28});
      let made=0;
      for(let k=0;k<nb*4&&made<nb;k++){
        const lot=use[Math.floor(r()*use.length)];if(!lot)break;
        const side=r()<.5?-1:1;const sx=lot.x-lot.tz*side*(lot.w/2+.9)+lot.tx*(r()-.5)*lot.d*.6,sz=lot.z+lot.tx*side*(lot.w/2+.9)+lot.tz*(r()-.5)*lot.d*.6;
        if(solidAt(sx,sz)||settleSolid(sx,sz,.4))continue;
        const y=worldH(sx,sz);const kind=r()<.55?'barrel':'crate';let g,top;
        if(kind==='barrel'){const B=kitBarrel(1.75,0x6a4418);g=B.body;g.position.set(sx,y,sz);top=B.top;top.position.set(sx,y+.96,sz);} // S200 — the kit's barrel
        else{g=new THREE.Mesh(SK.rbox(.9,.8,.9,.05,2),crateMat);g.position.set(sx,y+.4,sz);g.rotation.y=r()*.6;top=new THREE.Mesh(new THREE.BoxGeometry(.92,.06,.92),new THREE.MeshLambertMaterial({color:0x5a3e18}));top.position.set(sx,y+.83,sz);top.rotation.y=g.rotation.y;}
        g.castShadow=true;group.add(g);group.add(top);
        let items=(typeof rollContainerLoot==='function'?rollContainerLoot('barrel',1,null,.9):[])||[];
        items=items.filter(it=>it&&it.dmg==null&&it.def==null&&!it.slot&&it.type!=='weapon'&&it.type!=='armor');
        if(!items.length)items.push(pick(r,[{name:'Tallow Candle',ico:'🕯️',type:'misc',weight:.2,sellMult:.3,buyPrice:4},{name:'Coil of Rope',ico:'🪢',type:'misc',weight:1,sellMult:.3,buyPrice:9},{name:'Salt Sack',ico:'🧂',type:'misc',weight:.6,sellMult:.3,buyPrice:6},{name:'Hard Bread',ico:'🍞',type:'potion',heal:6,weight:.3,sellMult:.2,buyPrice:3},{name:'Wax-sealed Letter',ico:'✉️',type:'misc',weight:.05,sellMult:.5,buyPrice:12},{name:'Tin Cup',ico:'🥛',type:'misc',weight:.3,sellMult:.3,buyPrice:3}]));
        items.forEach(it=>{if(it.qty==null)it.qty=1;});
        const c={x:sx,z:sz,y,name:kind==='barrel'?'Barrel':'Crate',displayName:kind==='barrel'?'Barrel':'Crate',items,zone:'world',kind,g,top,opened:false,_settle:site.id};
        if(typeof ZONE_CORPSES!=='undefined')ZONE_CORPSES.push(c);S.loot=S.loot||[];S.loot.push(c);
        sol.push({cx:sx,cz:sz,rx:.5,rz:.5});made++;
      }
    }
    // Villagers on the plaza by day.
    if(plan.rows>0){
      const nv=site.kind==='city'?6:site.kind==='town'?4:site.kind==='village'?3:1;
      for(let i=0;i<nv;i++){
        const ang=r()*Math.PI*2,rad0=4+r()*8;
        const def=makeDef(site,reg,r,'Villager',newName(),{x:cx+Math.cos(ang)*rad0,z:cz+Math.sin(ang)*rad0,bCol:pick(r,[0x5a4030,0x3a5a3a,0x604828,0x504058,0x6a5a3a]),sCol:pick(r,[0xd4a878,0xc09070,0xb08060]),role:pick(r,['villager','farmer','old woman','fisher','kid'])});
        def.role='Villager';
        const vn=spawnNPC(def,r()*Math.PI*2,false);vn.sched={type:'villager',plaza:{x:cx,z:cz},padR:Math.max(10,pad-22)};snpcs.push(vn);
      }
    }
    // v80 S166 — a rich town (prosperity 60 or more) puts a third man on the night watch; he sleeps by day.
    // Spawned last so the draws before it (names, barrels, villagers) are the same as before Session 166.
    if(snpcs.some(n=>n.sched&&n.sched.type==='guard')&&prosperity(site)>=60){
      const def=makeDef(site,reg,r,'Guard',newName(),{nameKey:'w2',x:cx-4,z:cz+4,bCol:NAT.banner,sCol:0x808090});
      const wn=spawnNPC(def,0,true);wn.sched={type:'watch',a:{x:cx-4,z:cz+4},b:{x:cx+4,z:cz-4}};snpcs.push(wn);
    }
    // S268 — a day constable (Michael, issue #41: B): a town without walls has only its night watchman, who sleeps by day,
    // so nobody kept the law there from 6:30 to 19h. A second man walks the plaza by day and sleeps by night; he halts,
    // follows and is sent indoors as any guard on duty. Spawned last, so every draw before him is as it was.
    if(snpcs.some(n=>n.sched&&n.sched.type==='watch')&&!snpcs.some(n=>n.sched&&n.sched.type==='guard')){
      const def=makeDef(site,reg,r,'Guard',newName(),{nameKey:'c',x:cx-5,z:cz-3,bCol:0x3a3a48,sCol:0xb89878,role:'constable'});def.role='Guard';
      const cn=spawnNPC(def,0,true);cn.sched={type:'constable',a:{x:cx-6,z:cz-3},b:{x:cx+6,z:cz+3}};snpcs.push(cn);
    }
    if(S.dead)clearDead(); // S269 — the villagers and the watch are drawn after the ruin's clearing (so the draws stay put): a ruin keeps nobody in the street
    if(S._forge&&storyRuin(site)&&typeof buildBramBody==='function'){ // S270 — Bram's body at his forge, as in the legacy burned zone
      for(let k=ZONE_CORPSES.length-1;k>=0;k--)if(ZONE_CORPSES[k].bramBody&&ZONE_CORPSES[k].zone==='world')ZONE_CORPSES.splice(k,1);
      buildBramBody(group,S._forge.x,worldH(S._forge.x,S._forge.z),S._forge.z,'world');}
    S.reach=t_reach(sol,site);
    bakeSettlement(S);
    if(S.chimneys.length)try{smokeFor(S);}catch(e){console.warn('smoke',e);}
    sc.add(group);
    houses.forEach(h=>ZONES.world.houses.push(h));
    if(IMPOSTORS[site.id])IMPOSTORS[site.id].visible=false;
    SETTLE.set(site.id,S);_townNames=null;_twinUsed=null;_roleNames=null;
    if(guardsOf(S).length)try{townRoute(S);}catch(e){} // S166 — the watch's street grid, built with the town rather than at nightfall
    return S;
  }
  // Bake a settlement: every static mesh with a plain (untextured, lit) material is
  // merged into cluster meshes (60u cells) with vertex colours, one draw call each.
  // Skipped: textured signs, glass/glows (MeshBasic), banners (planes), boats, gulls.
  function mergeGeos(list){
    let total=0;list.forEach(([g])=>total+=g.attributes.position.count);
    const pos=new Float32Array(total*3),nor=new Float32Array(total*3),col=new Float32Array(total*3);let o=0;const _n=new THREE.Matrix3();
    for(const [g,m,c] of list){const p=g.attributes.position,n=g.attributes.normal,cc=g.attributes.color;const cnt=p.count;_n.getNormalMatrix(m);const v=new THREE.Vector3();
      for(let i=0;i<cnt;i++){v.set(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(m);pos[(o+i)*3]=v.x;pos[(o+i)*3+1]=v.y;pos[(o+i)*3+2]=v.z;
        if(n){v.set(n.getX(i),n.getY(i),n.getZ(i)).applyMatrix3(_n).normalize();}else v.set(0,1,0);nor[(o+i)*3]=v.x;nor[(o+i)*3+1]=v.y;nor[(o+i)*3+2]=v.z;
        if(cc){col[(o+i)*3]=cc.getX(i)*c.r;col[(o+i)*3+1]=cc.getY(i)*c.g;col[(o+i)*3+2]=cc.getZ(i)*c.b;}else{col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}
      o+=cnt;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeBoundingSphere();return geo;
  }
  // S194 — the houses' distant copies: each baked cluster of detailed houses is drawn near the eye (under HOUSE_LOD.near),
  // its plain twin past HOUSE_LOD.far, whichever it had in between
  const HOUSE_LOD={near:70,far:80};
  function houseLod(){const cp=CAM.position;for(const S of SETTLE.values()){const L=S.lodMeshes;if(!L)continue;
    for(const m of L){if(m.userData.lod!=='hi')continue;const b=m.geometry.boundingSphere;const d=Math.max(0,Math.hypot(b.center.x-cp.x,b.center.z-cp.z)-b.radius*.5);
      const twin=m.userData.twin||(m.userData.twin=L.find(o=>o.userData.lod==='lo'&&o.userData.ckey===m.userData.ckey));
      const near=d<HOUSE_LOD.near?true:d>HOUSE_LOD.far?false:m.visible;m.visible=near;if(twin)twin.visible=!near;}}}
  function bakeSettlement(S){return bakeMeshes(S.group.children.slice(),S.group,new Set(S.boats||[]),S);}
  // bake any list of meshes: merged clusters go into addTo; originals are removed from their parents
  function bakeMeshes(meshes,addTo,keep,S){
    const clusters=new Map();const dead=[];keep=keep||new Set();
    (addTo===sc?sc:addTo).updateMatrixWorld(true);
    for(const o of meshes){
      if(!o.isMesh||keep.has(o)||o.userData.noBake)continue;const mat=o.material;const g=o.geometry;
      if(!mat||mat.map||mat.isMeshBasicMaterial||mat.transparent||!g||!g.attributes||!g.attributes.position)continue;
      if(g.type==='PlaneGeometry'||g.type==='CircleGeometry')continue;
      const src=g.index?g.toNonIndexed():g;const m=o.matrixWorld.clone();const c=(mat.vertexColors?new THREE.Color(1,1,1):mat.color)||new THREE.Color(1,1,1);
      const k=Math.floor(o.position.x/60)+','+Math.floor(o.position.z/60)+(o.userData.lod?','+o.userData.lod:'');(clusters.get(k)||clusters.set(k,[]).get(k)).push([src,m,c]);dead.push(o);
    }
    dead.forEach(o=>{if(o.parent)o.parent.remove(o);});
    const out=[];for(const [k,list] of clusters){const geo=mergeGeos(list);const m=new THREE.Mesh(geo,VC_MAT);m.castShadow=true;m.receiveShadow=true;m.userData.baked=true;
      const lod=/,(hi|lo)$/.exec(k);if(lod&&S){m.userData.lod=lod[1];m.userData.ckey=k.slice(0,-3);m.visible=lod[1]==='lo';(S.lodMeshes||(S.lodMeshes=[])).push(m);}addTo.add(m);out.push(m);}
    if(S)S.baked=clusters.size;return out;
  }
  function t_reach(sol,site){let m=site.pad+6;for(const s of sol){m=Math.max(m,Math.abs(s.cx-site.x)+Math.max(s.rx,s.rz)+2,Math.abs(s.cz-site.z)+Math.max(s.rx,s.rz)+2);}return m;}
  function nationAt(x,z){try{const c=cellOf(x,z);return nationKeyOf(c[0],c[1]);}catch(e){return 'gatelands';}}
  function spawnNPC(def,ry,isStatic){ // S248 — the face is keyed by his own town (def._siteId), not the last one built: residents spawn as you come near
    const g=buildNPCMesh(def,{nation:nationAt(def.x,def.z),key:def._siteId||(_curSettle&&_curSettle.site?_curSettle.site.id:'')});g.position.set(def.x,worldH(def.x,def.z),def.z);g.rotation.y=ry;sc.add(g);
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),new THREE.MeshBasicMaterial({color:0xffdd00}));dot.position.set(def.x,worldH(def.x,def.z)+1.5,def.z);dot.visible=false;sc.add(dot);
    g.children.forEach((c,i)=>{c.castShadow=i<2;c.traverse&&c.traverse(o=>{if(o!==c&&o.isMesh)o.castShadow=false;});});
    const n={g,dot,def,wa:Math.random()*Math.PI*2,wt:0,ph:Math.random()*Math.PI*2,_static:isStatic,home:{x:def.x,z:def.z}};
    n._settle=_curSettle;npcs.push(n);return n;
  }
  function disposeSettlement(id){
    const S=SETTLE.get(id);if(!S)return;
    (S.creatures||[]).forEach(e=>{if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const k=ZONES.world.enemies.indexOf(e);if(k>=0)ZONES.world.enemies.splice(k,1);});
    (S.herbs||[]).forEach(h=>{const k=ZONES.world.herbs.indexOf(h);if(k>=0)ZONES.world.herbs.splice(k,1);});
    if(S.chest&&typeof ZONE_CORPSES!=='undefined'){const k=ZONE_CORPSES.indexOf(S.chest);if(k>=0)ZONE_CORPSES.splice(k,1);}
    sc.remove(S.group);
    S.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();}});if(S.smoke)S.smoke.geometry.dispose();
    S.npcs.forEach(n=>{sc.remove(n.g);sc.remove(n.dot);const i=npcs.indexOf(n);if(i>=0)npcs.splice(i,1);});
    S.houses.forEach(h=>{const i=ZONES.world.houses.indexOf(h);if(i>=0)ZONES.world.houses.splice(i,1);});
    if(S.loot&&typeof ZONE_CORPSES!=='undefined')S.loot.forEach(c=>{const i=ZONE_CORPSES.indexOf(c);if(i>=0)ZONE_CORPSES.splice(i,1);});
    for(let i=ZONES.world.platforms.length-1;i>=0;i--)if(ZONES.world.platforms[i].site===id)ZONES.world.platforms.splice(i,1);
    unregLights(id);S.npcs.forEach(n=>{if(n._torch&&n._torch.userData.light)unregLight(n._torch.userData.light);});
    if(IMPOSTORS[id])IMPOSTORS[id].visible=true;
    SETTLE.delete(id);
  }
  let _settleT=0;
  function tickSettlements(dt,force){
    _settleT+=dt;if(!force&&_settleT<.5)return;_settleT=0;
    for(const t of SITES){
      if(t.pad<=0)continue;
      const d=Math.hypot(px-t.x,pz-t.z);
      const IN_=POI_KINDS.includes(t.kind)?900:SETTLE_IN,OUT_=POI_KINDS.includes(t.kind)?1000:SETTLE_OUT;
      if(d<IN_&&!SETTLE.has(t.id)&&!t._queued){t._queued=true;addJob(()=>{t._queued=false;if(!SETTLE.has(t.id)&&Math.hypot(px-t.x,pz-t.z)<OUT_)genSettlement(t);return false;},2);}
      else if(d>SETTLE_OUT&&SETTLE.has(t.id))disposeSettlement(t.id);
    }
    const _dark=isNight()||hourNow()<6.5||hourNow()>=19;
    let _spawned=0;
    for(const S of SETTLE.values()){
      if(S.lamps&&S._lit!==_dark){S._lit=_dark;S.lamps.forEach(l=>{l.glass.visible=_dark;if(l.light)l.light.intensity=_dark?2.4:0;});}
      for(const res of S.residents){
        const d=Math.hypot(px-res.def.x,pz-res.def.z);
        if(d<70&&!res.n&&_spawned<2){_spawned++;res.n=spawnNPC(res.def,res.ry,false);res.n.home={x:res.def.x,z:res.def.z};res.n.sched={type:'resident',door:res.door,plaza:{x:S.site.x,z:S.site.z},padR:Math.max(10,S.site.pad-22),inn:S.innDoor||null};S.npcs.push(res.n);}
        else if(d>95&&res.n){const n=res.n;if(n._torch&&n._torch.userData.light)unregLight(n._torch.userData.light);sc.remove(n.g);sc.remove(n.dot);let i=npcs.indexOf(n);if(i>=0)npcs.splice(i,1);i=S.npcs.indexOf(n);if(i>=0)S.npcs.splice(i,1);res.n=null;}
      }
    }
  }
  function settleSolid(x,z,R,MIN){
    for(const S of SETTLE.values()){
      const t=S.site;const reach=S.reach||t.pad+6;if(Math.abs(x-t.x)>reach||Math.abs(z-t.z)>reach)continue;
      const sol=S.sol;
      for(let i=0;i<sol.length;i++){
        const s=sol[i];if(MIN&&Math.max(s.rx,s.rz)<MIN)continue;const dx=x-s.cx,dz=z-s.cz;
        if(s.c!==undefined){ // rotated rect: rotate the point into the rect's frame (mesh rotation.y = atan2(s,c))
          const lx=dx*s.c-dz*s.s,lz=dx*s.s+dz*s.c;
          if(Math.abs(lx)<s.rx+R&&Math.abs(lz)<s.rz+R)return true;
        } else if(Math.abs(dx)<s.rx+R&&Math.abs(dz)<s.rz+R)return true;
      }
    }
    return false;
  }

  // ═══ LANDMARK IMPOSTORS ══════════════════════════════════════════════
  // Low-poly stand-ins for every settlement and fort, always in the scene,
  // so a city reads from a ridge long before it streams in. Hidden while
  // the real settlement is built.
  const IMPOSTORS={};const impostorList=[];
  function buildImpostors(){}
  function buildImpostorsFor(cell){
    const c=x=>new THREE.Color(x);
    cell.sites.forEach(t=>{
      if(t.pad<=0)return;
      const r=rngFor(t.c*11+5,t.r*13+9);
      const parts=[];
      const n=t.kind==='city'?22:t.kind==='town'?14:t.kind==='port'?11:t.kind==='garrison'?7:t.kind==='village'?7:t.kind==='outpost'?3:t.kind==='camp'?0:4;
      const base=worldH(t.x,t.z);
      for(let i=0;i<n;i++){
        const ang=r()*Math.PI*2,rad=6+r()*Math.max(8,t.pad*.55);
        const x=Math.cos(ang)*rad,z=Math.sin(ang)*rad;
        const w=4+r()*3,d=3.5+r()*2.5,h=2.6+r()*.8;
        const y=worldH(t.x+x,t.z+z)-base;
        parts.push({geo:new THREE.BoxGeometry(w,h,d),color:c(t.kind==='ruin'?0x6a6258:0xa89a80),x,y:y+h/2,z,ry:r()*Math.PI,jitter:.06});
        if(t.kind!=='ruin')parts.push({geo:new THREE.ConeGeometry(Math.max(w,d)*.72,1.6,4),color:c(0x5a4a34),x,y:y+h+.8,z,ry:r()*Math.PI+Math.PI/4,jitter:.06});
      }
      if(t.kind==='city'||t.kind==='town'||t.kind==='garrison'){
        parts.push({geo:new THREE.CylinderGeometry(t.pad-5,t.pad-5,4.6,28,1,true),color:c(0x7c7870),y:2.3,jitter:.04});
        if(t.kind!=='garrison'){parts.push({geo:new THREE.BoxGeometry(11,7,9),color:c(0x7c7870),y:3.5,jitter:.05});
          [[-5.5,-4.5],[5.5,-4.5],[-5.5,4.5],[5.5,4.5]].forEach(([x,z])=>parts.push({geo:new THREE.CylinderGeometry(1.3,1.5,9,7),color:c(0x6a665e),x,z,y:4.5,jitter:.05}));}
      }
      if(t.kind==='village'&&r()<.5)parts.push({geo:new THREE.BoxGeometry(2.2,8,2.2),color:c(0x7c7870),x:8,z:-6,y:4,jitter:.05});
      if(!parts.length)return;
      const g=mergeParts(parts);
      const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));
      m.position.set(t.x,base,t.z);m.castShadow=false;m.receiveShadow=false;m.userData.noBake=true;sc.add(m);IMPOSTORS[t.id]=m;impostorList.push({id:t.id,cell:t.cell});
    });
    cell.doors.filter(e=>e.kind==='fort_door'&&dungeonWorldPos[e.seed]).forEach(e=>{
      const p=dungeonWorldPos[e.seed];const base=worldH(p.x,p.z);
      const g=mergeParts([{geo:new THREE.BoxGeometry(6,9,6),color:c(0x7c7870),y:4.5,jitter:.06},{geo:new THREE.ConeGeometry(4.6,3,4),color:c(0x4a4c56),y:10.4,ry:Math.PI/4,jitter:.05},{geo:new THREE.CylinderGeometry(24,24,4,20,1,true),color:c(0x7c7870),y:2,jitter:.05}]);
      const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));m.position.set(p.x,base,p.z);m.userData.noBake=true;sc.add(m);IMPOSTORS['door_'+e.seed]=m;impostorList.push({id:'door_'+e.seed,cell:cell.i+','+cell.j});
    });
  }

  // ═══ DISCOVERY ═══════════════════════════════════════════════════════
  // worldState.wdisc = {id:true}. Sites discover within pad+30, doors within
  // 34, peaks within 140 of the summit. Saved with worldState.
  function discovered(id){if(id==='ship')return !!SHIP.mesh;if(String(id).startsWith('q_')||String(id).startsWith('gq_'))return true;return !!(worldState.wdisc&&worldState.wdisc[id]);}
  function discover(id,name){
    if(!worldState.wdisc)worldState.wdisc={};
    if(worldState.wdisc[id])return false;
    worldState.wdisc[id]=true;
    try{const t=siteAnywhere(id);const big=t&&(t.kind==='city'||t.kind==='town'||t.kind==='port');const gain=big?50:String(id).startsWith('door_')?30:25;xp+=gain;if(typeof chkLvl==='function')chkLvl();if(typeof updateHUD==='function')updateHUD();if(typeof showMsgLong==='function')showMsgLong(`${name} discovered  ·  +${gain} XP`,'#e8d8a0');else showMsg(`${name} discovered · +${gain} XP`,'#e8d8a0');(worldState.stats||(worldState.stats={})).found=((worldState.stats||{}).found||0)+1;}catch(e){if(typeof showMsg==='function')showMsg(`Discovered: ${name}`,'#e8d8a0');}
    if(typeof addLog==='function')addLog('🗺️',`Discovered ${name}.`);
    if(typeof sndDiscover==='function')sndDiscover();
    return true;
  }
  let _discT=0,_padTown=null;
  // S353 — #66 A: arriving on a town's pad autosaves, unless a foe is on you (never mid-fight) or you ride the coach in (stepping down saves)
  function tickTownArrival(){let on=null;for(const t of SITES){if(!(t.kind in BASE_P)||t.pad<0)continue;if(Math.hypot(px-t.x,pz-t.z)<t.pad){on=t;break;}}
    const id=on?on.id:null;if(id===_padTown)return;_padTown=id;if(!on||(typeof isInterior==='function'&&isInterior()))return;
    if([...COACHES.values()].some(C=>C.riding))return;
    if(ZONES.world.enemies.some(e=>!e.dead&&e.alert&&Math.hypot(px-e.mesh.position.x,pz-e.mesh.position.z)<30))return;
    if(typeof saveGame==='function')saveGame();}
  function tickDiscovery(dt){
    _discT+=dt;if(_discT<.5)return;_discT=0;try{tickTownArrival();}catch(e){console.warn('arrival save',e);}
    for(const t of SITES){if(t.pad<0)continue;if(Math.hypot(px-t.x,pz-t.z)<t.pad+30)discover(t.id,t.name);}
    for(const e of DOORS){const p=dungeonWorldPos[e.seed];if(Math.hypot(px-p.x,pz-p.z)<34)discover('door_'+e.seed,e.canonicalName||(typeof dungeonName==='function'?dungeonName(e.seed,e.theme):'an old gate'));}
    for(const p of PEAKS){if(Math.hypot(px-p.x,pz-p.z)<140)discover(p.id,p.name);}
    for(const l of LAKES){if(Math.hypot(px-l.x,pz-l.z)<l.r+60)discover(l.id,l.name);}
  }
  // Where fast travel drops you: a site's signpost spot, a door's step, a peak's shoulder.
  function siteAnywhere(id){
    if(SITE[id])return SITE[id];
    const m=/^c(\d+)_(\d+)_[spi]\d+$/.exec(id);if(m){return getCell(+m[1],+m[2]).sites.find(t=>t.id===id)||null;}
    return getCell(HOME_I,HOME_J).sites.find(t=>t.id===id)||null;
  }
  function doorAnywhere(seed){
    for(const c of CELLS.values()){const e=c.doors.find(e=>e.seed===seed);if(e)return e;}
    for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){const c=getCell(i,j);const e=c.doors.find(e=>e.seed===seed);if(e)return e;}
    return null;
  }
  function arrivalFor(id){
    if(id==='ship'&&SHIP.mesh)return {x:SHIP.x,z:SHIP.z,yaw:SHIP.yaw,name:`the ${SHIP.name}`};
    const t=siteAnywhere(id);
    if(t&&t.kind==='port'){const sd=shoreDir(t);if(sd){const q=t.quayStart||{x:t.x+sd.dx*t.pad,z:t.z+sd.dz*t.pad};return {x:q.x-sd.dx*8,z:q.z-sd.dz*8,yaw:Math.atan2(sd.dx,sd.dz)+Math.PI,name:t.name};}}
    if(t){
      const cell=getCell(...cellOf(t.x,t.z));const byId={};cell.sites.forEach(x=>byId[x.id]=x);
      const outs=cell.roadDefs.filter(d=>d.a===t.id||d.b===t.id).map(d=>byId[d.a===t.id?d.b:d.a]).filter(Boolean);
      if(t.kind in BASE_P){const o=outs[0];const dx=o?o.x-t.x:0,dz=o?o.z-t.z:1,L=Math.hypot(dx,dz)||1;return {x:t.x+dx/L*4,z:t.z+dz/L*4+2,yaw:Math.atan2(dx,dz),name:t.name};} // v80 — the plaza, facing the road out
      if(outs.length){const o=outs[0];const dx=o.x-t.x,dz=o.z-t.z,L=Math.hypot(dx,dz);return {x:t.x+dx/L*(t.pad+8),z:t.z+dz/L*(t.pad+8),yaw:Math.atan2(dx,dz)+Math.PI,name:t.name};}
      return {x:t.x,z:t.z+t.pad+8,yaw:0,name:t.name};
    }
    if(id.startsWith('door_')){const seed=+id.slice(5);const e=DOORS.find(e=>e.seed===seed)||doorAnywhere(seed);if(!e)return null;const p=dungeonWorldPos[seed]||(e.zone==='gen'?{x:e.x,z:e.z}:null);if(!p)return null;return {x:p.x,z:p.z+(e.kind==='fort_door'?30:4),yaw:0,name:e.canonicalName||id};}
    let pk=PEAKS.find(p=>p.id===id),lk=LAKES.find(l=>l.id===id);
    if(!pk&&!lk){const m=/^c(\d+)_(\d+)_/.exec(id);if(m){const c=getCell(+m[1],+m[2]);pk=c.peaks.find(p=>p.id===id);lk=c.lakes.find(l=>l.id===id);}else{const c=getCell(HOME_I,HOME_J);pk=c.peaks.find(p=>p.id===id);lk=c.lakes.find(l=>l.id===id);}}
    if(pk)return {x:pk.x+40,z:pk.z+40,yaw:-Math.PI*.75,name:pk.name};
    if(lk)return {x:lk.x+lk.r+30,z:lk.z,yaw:Math.PI/2,name:lk.name};
    return null;
  }
  function fastTravel(id){
    const a=arrivalFor(id);if(!a||!discovered(id))return false;
    noteFastTravel(id);
    if(typeof hubOpen!=='undefined'&&hubOpen&&typeof closeHub==='function')closeHub();
    const dist=Math.hypot(a.x-px,a.z-pz);
    const mins=Math.round(dist/3.83/60*60); // one game hour per ~230u at a walk
    if(typeof advanceClock==='function')advanceClock(mins);else worldState.gameTimeMinutes+=mins;
    enter(a.x,a.z,a.yaw,'🌍 '+a.name);
    if(typeof addLog==='function')addLog('🗺️',`Travelled to ${a.name}.`);
    return true;
  }

  // ═══ WORLD MAP — one continuous parchment (Session E) ════════════════
  // The whole continent is one map. Each cell is a tile: a coarse tile
  // (48px) for the wide view, generated quickly; a fine tile (320px) when
  // you zoom into a cell, generated over frames so the map never hitches.
  // Zoom 1 fits the continent; ~40 puts one province across the pane.
  const MAP={cv:null,ctx:null,zoom:1,ox:0,oy:0,drag:null,hover:null,hoverCell:null,sel:null,W:0,H:0,dirty:true,mode:'map',tiles:new Map(),jobs:[],_entries:[]};
  const TILE_C=48,TILE_F=320;
  const PARCH=new THREE.Color(0xd8c8a2),LOWC=new THREE.Color(0xcdb98c),HILL=new THREE.Color(0xb59d76),MTN=new THREE.Color(0x8d7c68),SNOWC=new THREE.Color(0xe9e4da),WATER=new THREE.Color(0x7d9cb0),DEEP=new THREE.Color(0x5b7d94),FORESTC=new THREE.Color(0x7c8a58),WASTEC=new THREE.Color(0xa08e74);
  // v80 S144 — the map read as brown or green because it was coloured by height: only forest (and a
  // 'wastes' test that never matched the generated 'wasteland') tinted it. Every biome the generator
  // uses now has a tint, laid over the parchment and fading out as the ground climbs into rock and snow.
  const MAPBIO={
    forest:{col:0x6d8a4c,amt:.52,label:'Forest'},
    autumn:{col:0xb0762c,amt:.42,label:'Autumn wood'},
    plains:{col:0xbdae6a,amt:.26,label:'Plains'},
    coast:{col:0xd9cb9c,amt:.30,label:'Coast'},
    dunes:{col:0xe3d193,amt:.46,label:'Dunes'},
    moor:{col:0x93758c,amt:.34,label:'Moor'},
    fen:{col:0x7f8f6b,amt:.40,label:'Fen'},
    swamp:{col:0x64764f,amt:.46,label:'Swamp'},
    tundra:{col:0xdde8ee,amt:.55,label:'Tundra'},
    wasteland:{col:0x9c8a72,amt:.46,label:'Wasteland'},
    wastes:{col:0xa08e74,amt:.46,label:'Wastes'},
  };
  const _mb=new THREE.Color();
  function tileKey(i,j,res){return i+','+j+':'+res;}
  function withCellData(cell,fn){
    // lend this cell's AND its neighbours' regions/landmarks to worldH (unloaded ones only)
    const lent=[];
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=cell.i+di,j=cell.j+dj;if(i<0||j<0||i>=GRID||j>=GRID)continue;const k=cellKey(i,j);if(LOADED.has(k))continue;const c=getCell(i,j);lent.push(c);
      c.regions.forEach(r_=>REGIONS.push(r_));c.peaks.forEach(p=>PEAKS.push(p));c.lakes.forEach(l=>LAKES.push(l));c.rivers.forEach(rv=>RIVERS.push(rv));(c.inlets||[]).forEach(inl=>INLETS.push(inl));}
    try{return fn();}finally{
      for(const c of lent){c.regions.forEach(r_=>{const i=REGIONS.indexOf(r_);if(i>=0)REGIONS.splice(i,1);});c.peaks.forEach(p=>{const i=PEAKS.indexOf(p);if(i>=0)PEAKS.splice(i,1);});c.lakes.forEach(l=>{const i=LAKES.indexOf(l);if(i>=0)LAKES.splice(i,1);});c.rivers.forEach(rv=>{const i=RIVERS.indexOf(rv);if(i>=0)RIVERS.splice(i,1);});(c.inlets||[]).forEach(inl=>{const i=INLETS.indexOf(inl);if(i>=0)INLETS.splice(i,1);});}}
  }
  // colour one map pixel from height / region / slope
  const _mc=new THREE.Color();
  function mapPixel(x,z,h,shade,out){
    if(h<0){_mc.copy(WATER).lerp(DEEP,sstep(0,-7,h));if(h>-1.2)_mc.lerp(PARCH,.35);}
    else{
      _mc.copy(PARCH).lerp(LOWC,sstep(1,8,h)).lerp(HILL,sstep(8,30,h)).lerp(MTN,sstep(30,70,h)).lerp(SNOWC,sstep(70,130,h));
      const dom=dominantRegion(x,z).r;const B=MAPBIO[dom.biome];
      if(B&&h<72){
        let amt=B.amt*(1-sstep(36,72,h));
        if(dom.biome==='forest'){const dens=regionScalar(x,z,'density');amt=Math.min(.62,dens*.8)*(1-sstep(25,44,h));} // a thin wood reads thinner
        if(amt>0){_mb.setHex(B.col);_mc.lerp(_mb,amt);}
      }
      _mc.multiplyScalar(shade);_mc.multiplyScalar(1+(_smoothNoise(x,z,SEED+55,9)-.5)*.10);
    }
    out[0]=Math.min(255,_mc.r*255)|0;out[1]=Math.min(255,_mc.g*255)|0;out[2]=Math.min(255,_mc.b*255)|0;
  }
  // A tile job renders rows across frames; coarse tiles finish in one go.
  function startTile(cell,res){
    const key=tileKey(cell.i,cell.j,res);if(MAP.tiles.has(key))return MAP.tiles.get(key);
    const cv=document.createElement('canvas');cv.width=res;cv.height=res;const ctx=cv.getContext('2d');
    const img=ctx.createImageData(res,res);const step=SIZE/res;const H=new Float32Array((res+1)*(res+1));
    const t={cv,ctx,img,H,row:0,hrow:0,done:false,cell,res,step};MAP.tiles.set(key,t);MAP.jobs.push(t);
    if(res<=TILE_C){while(!t.done)tileStep(t,1e9);}
    return t;
  }
  function tileStep(t,rowsBudget){
    const {cell,res,step,H}=t;const X0=cell.ox,Z0=cell.oz;
    withCellData(cell,()=>{
      // heights first (res+1 rows), then pixels
      while(t.hrow<=res&&rowsBudget>0){const j=t.hrow;for(let i=0;i<=res;i++)H[j*(res+1)+i]=worldH(X0+i*step,Z0+j*step);t.hrow++;rowsBudget--;}
      if(t.hrow<=res)return;
      const d=t.img.data,px3=[0,0,0];
      while(t.row<res&&rowsBudget>0){const j=t.row;
        for(let i=0;i<res;i++){const h=H[j*(res+1)+i];const x=X0+i*step,z=Z0+j*step;
          const hx=H[j*(res+1)+Math.min(res,i+1)]-H[j*(res+1)+Math.max(0,i-1)],hz=H[Math.min(res,j+1)*(res+1)+i]-H[Math.max(0,j-1)*(res+1)+i];
          const shade=Math.max(.72,Math.min(1.22,1+(-hx-hz)*(res>=TILE_F?.045:.02)));
          mapPixel(x,z,h,shade,px3);const k=(j*res+i)*4;d[k]=px3[0];d[k+1]=px3[1];d[k+2]=px3[2];d[k+3]=255;}
        t.row++;rowsBudget--;}
      if(t.row>=res){t.ctx.putImageData(t.img,0,0);
        if(res>=TILE_F){ // hatched water on fine tiles
          const c=t.ctx;c.strokeStyle='rgba(60,90,110,.22)';c.lineWidth=1;
          for(let j=4;j<res;j+=6){c.beginPath();let on=false;for(let i=0;i<res;i++){const h=H[j*(res+1)+i];if(h<-.6){if(!on){c.moveTo(i,j+((i/9|0)%2));on=true;}else c.lineTo(i,j+((i/9|0)%2));}else on=false;}c.stroke();}}
        t.done=true;const k=MAP.jobs.indexOf(t);if(k>=0)MAP.jobs.splice(k,1);MAP.dirty=true;}
    });
  }
  function mapJobs(){const t0=performance.now();while(MAP.jobs.length&&performance.now()-t0<24){const t=MAP.jobs[0];if(t.done){MAP.jobs.shift();continue;}tileStep(t,12);if(!t.done)break;}}
  // world ↔ screen
  function baseScale(){return Math.min(MAP.cv.width,MAP.cv.height)/(SIZE*GRID);}
  function mapToScreen(x,z){const s=baseScale()*MAP.zoom;return [x*s+MAP.ox,z*s+MAP.oy];}
  function screenToMap(sx,sy){const s=baseScale()*MAP.zoom;return [(sx-MAP.ox)/s,(sy-MAP.oy)/s];}
  function mapClamp(){const s=baseScale()*MAP.zoom,w=SIZE*GRID*s,cw=MAP.cv.width,ch=MAP.cv.height;MAP.ox=Math.min(Math.max(MAP.ox,cw-w-60),60);MAP.oy=Math.min(Math.max(MAP.oy,ch-w-60),60);if(w<cw)MAP.ox=(cw-w)/2;if(w<ch)MAP.oy=(ch-w)/2;}
  // icons
  function drawIcon(ctx,kind,s,known){
    ctx.save();ctx.scale(s,s);
    ctx.lineWidth=1.2;ctx.strokeStyle='#2a1c10';ctx.fillStyle=known?'#f2e6c4':'#c9b68f';
    const house=(x,y,w)=>{ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(x-w,y-w);ctx.lineTo(x,y-w*1.8);ctx.lineTo(x+w,y-w);ctx.lineTo(x+w,y);ctx.closePath();ctx.fill();ctx.stroke();};
    if(kind==='city'){ctx.beginPath();ctx.rect(-7,-4,14,8);ctx.fill();ctx.stroke();for(let i=-6;i<=6;i+=4){ctx.beginPath();ctx.rect(i-1.2,-8,2.4,4);ctx.fill();ctx.stroke();}ctx.beginPath();ctx.rect(-2.5,-13,5,9);ctx.fill();ctx.stroke();}
    else if(kind==='town'||kind==='garrison'||kind==='port'){ctx.beginPath();ctx.rect(-6,-3,12,6);ctx.fill();ctx.stroke();for(let i=-5;i<=5;i+=5){ctx.beginPath();ctx.rect(i-1.2,-6,2.4,3);ctx.fill();ctx.stroke();}house(0,-3,3);if(kind==='port'){ctx.fillStyle='#2a3a6a';ctx.fillRect(-1,4,2,6);ctx.beginPath();ctx.arc(0,8,4,.2*Math.PI,.8*Math.PI);ctx.stroke();}}
    else if(kind==='village'){house(-3,3,3);house(3,2,2.6);}
    else if(kind==='outpost'){ctx.beginPath();ctx.rect(-2.5,-6,5,10);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-3.5,-6);ctx.lineTo(0,-9.5);ctx.lineTo(3.5,-6);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(kind==='fort'){ctx.beginPath();ctx.rect(-4,-4,8,9);ctx.fill();ctx.stroke();for(let i=-3;i<=3;i+=3){ctx.beginPath();ctx.rect(i-.9,-7,1.8,3);ctx.fill();ctx.stroke();}}
    else if(kind==='cave'){ctx.beginPath();ctx.moveTo(-5,4);ctx.lineTo(-5,-1);ctx.arc(0,-1,5,Math.PI,0);ctx.lineTo(5,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#2a1c10';ctx.beginPath();ctx.moveTo(-2.5,4);ctx.lineTo(-2.5,0);ctx.arc(0,0,2.5,Math.PI,0);ctx.lineTo(2.5,4);ctx.closePath();ctx.fill();}
    else if(kind==='camp'){ctx.beginPath();ctx.moveTo(-6,4);ctx.lineTo(0,-6);ctx.lineTo(6,4);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(kind==='ruin'){ctx.beginPath();ctx.rect(-6,-1,4,5);ctx.rect(-1,-4,3,8);ctx.rect(3,0,3,4);ctx.fill();ctx.stroke();}
    else if(kind==='poi'){ctx.beginPath();ctx.rect(-2,-6,4,10);ctx.fill();ctx.stroke();ctx.beginPath();ctx.rect(-5,-2,3,6);ctx.rect(2,-3,3,7);ctx.fill();ctx.stroke();}
    else if(kind==='peak'){ctx.beginPath();ctx.moveTo(-8,5);ctx.lineTo(-2,-7);ctx.lineTo(2,-2);ctx.lineTo(5,-5);ctx.lineTo(9,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-3.5,-4);ctx.lineTo(-2,-7);ctx.lineTo(-.5,-4);ctx.closePath();ctx.fill();}
    else if(kind==='lake'){ctx.beginPath();ctx.ellipse(0,0,7,4,0,0,Math.PI*2);ctx.fillStyle='#7d9cb0';ctx.fill();ctx.stroke();}
    else if(kind==='glade'){ctx.beginPath();ctx.ellipse(0,1,7,4,0,0,Math.PI*2);ctx.fillStyle='#7d9cb0';ctx.fill();ctx.stroke();ctx.fillStyle='#6a8a3a';[[-7,-3],[7,-4],[0,-7]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();ctx.stroke();});}
    else if(kind==='shrine'){ctx.beginPath();ctx.arc(0,-2,6,Math.PI,0);ctx.lineTo(6,4);ctx.lineTo(-6,4);ctx.closePath();ctx.fill();ctx.stroke();for(let x=-4;x<=4;x+=4){ctx.beginPath();ctx.moveTo(x,-2);ctx.lineTo(x,4);ctx.stroke();}}
    else if(kind==='lair'){ctx.beginPath();ctx.moveTo(-7,5);ctx.lineTo(-5,-2);ctx.lineTo(0,-7);ctx.lineTo(5,-2);ctx.lineTo(7,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#2a1c10';ctx.beginPath();ctx.moveTo(-3,5);ctx.lineTo(0,-1);ctx.lineTo(3,5);ctx.closePath();ctx.fill();}
    else if(kind==='tower'){ctx.beginPath();ctx.rect(-2.5,-9,5,14);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-3.5,-9);ctx.lineTo(0,-13);ctx.lineTo(3.5,-9);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(kind==='bcamp'){ctx.beginPath();ctx.moveTo(-8,4);ctx.lineTo(-3,-5);ctx.lineTo(2,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(1,4);ctx.lineTo(5,-3);ctx.lineTo(9,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#c83a2a';ctx.beginPath();ctx.arc(-1,7,1.8,0,Math.PI*2);ctx.fill();}
    else if(kind==='quest'){ctx.fillStyle='#e8c040';ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(3,-3);ctx.lineTo(11,-2);ctx.lineTo(5,3);ctx.lineTo(7,11);ctx.lineTo(0,7);ctx.lineTo(-7,11);ctx.lineTo(-5,3);ctx.lineTo(-11,-2);ctx.lineTo(-3,-3);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(kind==='ship'){ctx.beginPath();ctx.moveTo(-8,2);ctx.lineTo(8,2);ctx.lineTo(6,6);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillRect(-.6,-9,1.2,11);ctx.beginPath();ctx.moveTo(.6,-8);ctx.lineTo(7,-2);ctx.lineTo(.6,-1);ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.restore();
  }
  function mapEntries(cell){
    const out=[];const c=cell;if(!c)return out;
    const SUB={glade:'Glade',shrine:'Shrine',lair:'Lair',tower:'Spire',bcamp:'Bandit camp',bridge:'Bridge'};
    c.sites.forEach(t=>{if(t.kind==='portal')return;out.push({id:t.id,name:t.name,kind:t.kind,x:t.x,z:t.z,sub:SUB[t.kind]||(t.kind.charAt(0).toUpperCase()+t.kind.slice(1)),major:t.kind==='city'||t.kind==='town'||t.kind==='port'||t.kind==='garrison'||t.kind==='tower'||t.kind==='shrine'});});
    c.doors.forEach(e=>{const p=dungeonWorldPos[e.seed]||(e.zone==='gen'?{x:e.x,z:e.z}:null);if(!p)return;out.push({id:'door_'+e.seed,name:e.canonicalName||(typeof dungeonName==='function'?dungeonName(e.seed,e.theme):'Old gate'),kind:e.kind==='fort_door'?'fort':'cave',x:p.x,z:p.z,sub:`${e.kind==='fort_door'?'Fort':'Old gate'} · ${e.theme}`,major:e.kind==='fort_door'});});
    c.peaks.forEach(p=>out.push({id:p.id,name:p.name,kind:'peak',x:p.x,z:p.z,sub:'Mountain',major:true}));
    c.lakes.forEach(l=>out.push({id:l.id,name:l.name,kind:'lake',x:l.x,z:l.z,sub:'Lake',major:true}));
    const wk=worldState.ship&&worldState.ship.sunk;if(wk&&wk.x>=c.ox&&wk.x<c.ox+SIZE&&wk.z>=c.oz&&wk.z<c.oz+SIZE)out.push({id:'shipwreck',name:`The wreck of the ${worldState.ship.name||SHIP.name}`,kind:'ship',x:wk.x,z:wk.z,sub:'Where she went down',major:true});
    if(SHIP.mesh&&SHIP.x>=c.ox&&SHIP.x<c.ox+SIZE&&SHIP.z>=c.oz&&SHIP.z<c.oz+SIZE)out.push({id:'ship',name:`The ${SHIP.name}`,kind:'ship',x:SHIP.x,z:SHIP.z,sub:'Your ship',major:true});
    questMarkers(c).forEach(m=>out.push(m));
    return out;
  }
  function visibleCells(){const [x0,z0]=screenToMap(0,0),[x1,z1]=screenToMap(MAP.cv.width,MAP.cv.height);const out=[];for(let j=Math.max(0,Math.floor(z0/SIZE));j<=Math.min(GRID-1,Math.floor(z1/SIZE));j++)for(let i=Math.max(0,Math.floor(x0/SIZE));i<=Math.min(GRID-1,Math.floor(x1/SIZE));i++)out.push(getCell(i,j));return out;}
  function mapDraw(){
    const ctx=MAP.ctx;if(!ctx)return;const cw=MAP.cv.width,ch=MAP.cv.height;
    ctx.fillStyle='#2b241a';ctx.fillRect(0,0,cw,ch);
    if(MAP.mode==='local'){const size=Math.min(cw,ch);ctx.save();ctx.translate((cw-size)/2,(ch-size)/2);drawLocalMap(ctx,size,130,true);ctx.restore();MAP.dirty=true;return;}
    const s=baseScale()*MAP.zoom,cellPx=SIZE*s;
    const cells=visibleCells();const fine=cellPx>=220;
    const [pi,pj]=cellOf(px,pz);
    // tiles
    for(const c of cells){
      const [sx,sy]=mapToScreen(c.ox,c.oz);
      let t=MAP.tiles.get(tileKey(c.i,c.j,TILE_C))||startTile(c,TILE_C);
      if(fine){const f=MAP.tiles.get(tileKey(c.i,c.j,TILE_F))||startTile(c,TILE_F);if(f.done)t=f;}
      if(t&&(t.done||t.res<=TILE_C)){ctx.drawImage(t.cv,sx,sy,cellPx+.6,cellPx+.6);}
      // undiscovered provinces sit under a light sepia wash
      if(c.type!=='sea'&&!(c.i===pi&&c.j===pj)&&!c.sites.some(x=>discovered(x.id))){ctx.fillStyle='rgba(60,40,20,.22)';ctx.fillRect(sx,sy,cellPx+.6,cellPx+.6);}
    }
    // province borders (faint) once you're in close
    if(cellPx>=140){ctx.strokeStyle='rgba(40,28,14,.25)';ctx.lineWidth=1;ctx.setLineDash([6,4]);for(const c of cells){if(c.type==='sea')continue;const [sx,sy]=mapToScreen(c.ox,c.oz);ctx.strokeRect(sx,sy,cellPx,cellPx);}ctx.setLineDash([]);}
    // roads
    if(cellPx>=160){ctx.strokeStyle='rgba(88,58,30,.85)';ctx.lineWidth=Math.max(1,Math.min(2.2,cellPx/300));ctx.setLineDash([5,3]);
      for(const c of cells){const k=cellKey(c.i,c.j);
        if(LOADED.has(k)){for(const rd of ROADS){if(rd.cell!==k)continue;ctx.beginPath();rd.pts.forEach((p,i)=>{const [x,y]=mapToScreen(p.x,p.z);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}}
        else{const byId={};c.sites.forEach(t=>byId[t.id]=t);for(const d of c.roadDefs){const A=byId[d.a],B=byId[d.b];if(!A||!B)continue;const [ax,ay]=mapToScreen(A.x,A.z),[bx,by]=mapToScreen(B.x,B.z);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}}}
      ctx.setLineDash([]);}
    // coaching roads: a paved double line
    if(cellPx>=100){const Cs=worldState.coaches||{};for(const key in Cs){const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);if(!rd)continue;ctx.setLineDash([]);ctx.strokeStyle='rgba(60,40,20,.95)';ctx.lineWidth=Math.max(4,cellPx/120);ctx.beginPath();rd.pts.forEach((p,i)=>{const [x,y]=mapToScreen(p.x,p.z);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.strokeStyle='rgba(220,200,160,.9)';ctx.lineWidth=Math.max(1.5,cellPx/300);ctx.stroke();}}
    // trade routes: a firm brown line along the road
    if(cellPx>=100){const R=worldState.routes||{};ctx.strokeStyle='rgba(120,70,20,.9)';ctx.lineWidth=Math.max(2,cellPx/200);ctx.setLineDash([]);for(const key in R){const rt=R[key];const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);if(rd){if(rt.broken){ctx.strokeStyle='rgba(160,40,20,.8)';ctx.setLineDash([4,4]);}ctx.beginPath();rd.pts.forEach((p,i)=>{const [x,y]=mapToScreen(p.x,p.z);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba(120,70,20,.9)';}else{const a=siteAnywhere(rt.a),b=siteAnywhere(rt.b);if(a&&b){const [ax,ay]=mapToScreen(a.x,a.z),[bx,by]=mapToScreen(b.x,b.z);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}}}}
    // labels
    ctx.textAlign='center';
    if(cellPx<140){ctx.font=`italic 700 ${Math.max(16,Math.min(30,cellPx*.28))}px Georgia, serif`;ctx.fillStyle='rgba(60,40,20,.55)';landmassOf(0,0);for(let m=0;m<_landmass.count;m++){const c=_landmass['c'+m];if(c.n<3)continue;const key=_landmass.nation[m];const nat=NATIONS[key];const [x,y]=mapToScreen((c.i+.5)*SIZE,(c.j+.5)*SIZE);ctx.fillText(nat.formal,x,y-8);ctx.font=`italic 500 ${Math.max(10,Math.min(16,cellPx*.16))}px Georgia, serif`;ctx.fillText(nat.name,x,y+10);ctx.font=`italic 700 ${Math.max(16,Math.min(30,cellPx*.28))}px Georgia, serif`;}}
    if(cellPx>=60&&cellPx<520){ctx.font=`italic 600 ${Math.max(10,Math.min(18,cellPx*.09))}px Georgia, serif`;ctx.fillStyle='rgba(70,50,30,.7)';for(const c of cells){if(c.type==='sea')continue;const [x,y]=mapToScreen(c.ox+SIZE/2,c.oz+SIZE*.12);ctx.fillText(c.name||'',x,y,cellPx-8);}}
    if(cellPx>=520){ctx.font='italic 600 14px Georgia, serif';for(const c of cells){ctx.fillStyle='rgba(70,50,30,.55)';c.regions.forEach(r=>{const [x,y]=mapToScreen(r.x,r.z);ctx.fillText(r.name||r.id,x,y-14);});ctx.fillStyle='rgba(60,70,90,.6)';c.lakes.forEach(l=>{const [x,y]=mapToScreen(l.x,l.z);ctx.fillText(l.name,x,y+4);});ctx.fillStyle='rgba(60,50,40,.7)';c.peaks.forEach(p=>{const [x,y]=mapToScreen(p.x,p.z);ctx.fillText(p.name,x,y-10);});ctx.font='italic 600 20px Georgia, serif';ctx.fillStyle='rgba(70,50,30,.45)';const [nx,ny]=mapToScreen(c.ox+SIZE/2,c.oz+120);ctx.fillText(c.name||'',nx,ny);ctx.font='italic 600 14px Georgia, serif';}}
    // icons
    const entries=[];const isc=Math.max(.9,Math.min(2.2,cellPx/420))*(Math.min(cw,ch)/700);
    if(cellPx>=60){for(const c of cells)for(const e of mapEntries(c)){if(!discovered(e.id))continue;if(cellPx<160&&!e.major)continue;if(!mapAllowed(e))continue;entries.push(e);}}
    MAP._entries=entries;
    for(const e of entries){const [sx,sy]=mapToScreen(e.x,e.z);ctx.save();ctx.translate(sx,sy);
      if(MAP.hover===e.id||MAP.sel===e.id){ctx.beginPath();ctx.arc(0,0,13*isc,0,Math.PI*2);ctx.fillStyle='rgba(255,230,160,.35)';ctx.fill();}
      drawIcon(ctx,e.kind,isc,true);
      if(cellPx>=260||e.kind==='city'||MAP.hover===e.id){ctx.font=`${Math.round(11*isc)}px Georgia, serif`;ctx.fillStyle='#2a1c10';ctx.strokeStyle='rgba(240,228,200,.8)';ctx.lineWidth=3;ctx.strokeText(e.name,0,14*isc+4);ctx.fillText(e.name,0,14*isc+4);}
      ctx.restore();}
    // other ships, player
    for(const o of OTHER){const [sx,sy]=mapToScreen(o.x,o.z);ctx.fillStyle=o.kind==='pirate'?'#b02020':'#8a8a8a';ctx.beginPath();ctx.arc(sx,sy,Math.max(2,3*isc),0,Math.PI*2);ctx.fill();}
    const _mp=(activeZoneId==='world')?{x:px,z:pz}:(typeof currentHouse!=='undefined'&&currentHouse&&currentHouse.exitX!=null)?{x:currentHouse.exitX,z:currentHouse.exitZ}:(typeof currentPortal!=='undefined'&&currentPortal&&dungeonWorldPos[currentPortal.seed])?dungeonWorldPos[currentPortal.seed]:{x:px,z:pz};
    const [pxs,pys]=mapToScreen(_mp.x,_mp.z);ctx.save();ctx.translate(pxs,pys);ctx.rotate(-yaw);ctx.beginPath();ctx.moveTo(0,-9*isc);ctx.lineTo(6*isc,7*isc);ctx.lineTo(0,3*isc);ctx.lineTo(-6*isc,7*isc);ctx.closePath();ctx.fillStyle='#c8322a';ctx.fill();ctx.strokeStyle='#2a0c08';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
    // compass, frame
    ctx.save();ctx.translate(cw-46,52);ctx.strokeStyle='rgba(40,28,14,.7)';ctx.fillStyle='rgba(240,228,200,.75)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(5,0);ctx.lineTo(0,20);ctx.lineTo(-5,0);ctx.closePath();ctx.fillStyle='#8a2a22';ctx.fill();ctx.fillStyle='#2a1c10';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText('N',0,-27);ctx.restore();
    const [fx,fy]=mapToScreen(0,0);ctx.strokeStyle='rgba(40,28,14,.8)';ctx.lineWidth=3;ctx.strokeRect(fx,fy,SIZE*GRID*s,SIZE*GRID*s);
    MAP.dirty=MAP.jobs.length>0;
  }
  // ── hover card for settlements: prosperity, services, guilds, issues, culture, people ──
  const SHOP_WORD={forge:'smith',goods:'goods',inn:'inn',apothecary:'apothecary',church:'church',armoury:'armoury',shipwright:'shipwright',guild_f:"Fighters' Guild",guild_m:"Mages' Guild",keep:'keep',castle:'keep',weapon:'smith',armor:'armoury',potion:'apothecary',misc:'goods'};
  function townCard(t){
    const [i,j]=cellOf(t.x,t.z);const nat=nationOf(i,j);const st=TS(t);const S=SETTLE.get(t.id);
    let services,guilds;
    if(S){const types=S.houses.map(h=>h.type);services=[...new Set(types.filter(x=>x!=='home'&&x!=='guild_f'&&x!=='guild_m').map(x=>SHOP_WORD[x]||x))];guilds=[...new Set(types.filter(x=>x==='guild_f'||x==='guild_m').map(x=>SHOP_WORD[x]))];}
    else{const plan=KIND_PLAN[t.kind]||KIND_PLAN.village;const list=[...plan.shops,...((t.kind==='town'||t.kind==='city')?['guild_f','guild_m']:[])];const open=shopsFor(t,list);services=[...new Set(open.filter(x=>x!=='guild_f'&&x!=='guild_m').map(x=>SHOP_WORD[x]||x))];guilds=open.filter(x=>x==='guild_f'||x==='guild_m').map(x=>SHOP_WORD[x]);}
    st.builds.forEach(b=>{if(b.done){if(b.key==='guild'&&!guilds.includes("Fighters' Guild"))guilds.push("Fighters' Guild");if(b.key==='inn'&&!services.includes('inn'))services.push('inn');if(b.key==='chapel'&&!services.includes('church'))services.push('church');if(b.key==='harbour')services.push('harbour');}});
    // issues
    const issues=[];for(const f in st.flags)issues.push(f==='scaffold'?'building':f);
    let near=null,nd=1e9;for(const o of (SITES.length?SITES:[])){if((o.kind==='lair'||o.kind==='bcamp')&&Math.hypot(o.x-t.x,o.z-t.z)<nd){nd=Math.hypot(o.x-t.x,o.z-t.z);near=o;}}
    if(near&&nd<700&&!(worldState.lairs&&worldState.lairs[near.id]))issues.push(near.kind==='bcamp'?`bandits at ${near.name}`:`a beast at ${near.name}`);
    const cleared=worldState.roadsCleared||{};const rds=ROAD_DEFS.filter(x=>x.a===t.id||x.b===t.id);const unclear=rds.filter(x=>!(cleared[x.a+'|'+x.b]||cleared[x.b+'|'+x.a])).length;if(rds.length&&unclear===rds.length)issues.push('roads unpatrolled');
    if(st.p<35)issues.push('homes shuttered');
    const R=worldState.routes||{};let open=0,broken=0;for(const key in R){if(R[key].a===t.id||R[key].b===t.id){if(R[key].broken)broken++;else open++;}}if(open)services.push(`${open} trade route${open>1?'s':''}`);if(broken)issues.push(`${broken} route${broken>1?'s':''} broken`);
    // people
    let demo;if(S&&S.npcs.length){const c={};S.npcs.forEach(n=>{const p=n.def.people||'gatelander';c[p]=(c[p]||0)+1;});const tot=S.npcs.length;demo=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([p,n])=>`${PEOPLES[p]?PEOPLES[p].name:p} ${Math.round(n/tot*100)}%`).join(', ');}
    else{const base=peopleOfSite(t);const blend=t.kind==='port'||t.islet;const others=Object.keys(PEOPLES).filter(p=>p!==nat.people&&p!=='oldblood');demo=blend?`${PEOPLES[nat.people].name} ~55%, ${PEOPLES[others[0]].name} ~25%, ${PEOPLES[others[1]].name} ~15%, Old Blood ~5%`:`${PEOPLES[nat.people].name} ~94%, Old Blood ~6%`;}
    const culture=(CULTURES[t.reg]||{}).name||t.reg||'';const lord=lordFor(t);
    const HOW={'roads unpatrolled':'clear the road (a quest from the lord) or open a trade route','homes shuttered':'raise prosperity — clear roads, kill the nearby beast, pay for a well','sacked':'give it time; clear the camp that did it','burned':'it will not recover on its own','plague':'clear the province\'s gate','abandoned':'re-found it: clear its roads and invest','scaffold':'building — three days'};
    const withHow=issues.map(i=>{let how=HOW[i];if(!how&&/^bandits at/.test(i))how='clear the camp';if(!how&&/^a beast at/.test(i))how='kill it';if(!how&&/route.*broken/.test(i))how='clear the camp on the road, then reopen it with the lord';return how?`${i} <span style="color:#8a7a60">— ${how}</span>`:i;});
    return `<div style="font:600 15px Georgia,serif;color:#f0e2c0">${t.name}</div>
      <div style="color:#b8a880;font-size:11px;margin:2px 0 6px">${(t.kind.charAt(0).toUpperCase()+t.kind.slice(1))} · ${nat.name} · ${culture} · ${lord.title} ${lord.name}</div>
      <div style="font-size:12px"><span style="color:#8a7a60">Prosperity</span> <b style="color:${st.p>=60?'#9ae090':st.p>=35?'#e8c040':'#e07060'}">${st.p}</b> — ${stateLine(t).split(' (')[0]}</div>
      <div style="font-size:12px"><span style="color:#8a7a60">Services</span> ${services.length?services.join(', '):'none'}</div>
      <div style="font-size:12px"><span style="color:#8a7a60">Guilds</span> ${guilds.length?guilds.join(', '):'none'}</div>
      <div style="font-size:12px"><span style="color:#8a7a60">People</span> ${demo}</div>
      <div style="font-size:12px;color:${issues.length?'#e0a070':'#8a7a60'}"><span style="color:#8a7a60">Issues</span> ${issues.length?withHow.join('<br>'):'none'}</div>`;
  }
  function showTownCard(e,sx,sy){let el=document.getElementById('wm-hover');if(!el){el=document.createElement('div');el.id='wm-hover';el.style.cssText='position:absolute;pointer-events:none;max-width:320px;padding:8px 10px;background:rgba(28,22,14,.97);border:1px solid #8a6a3a;border-radius:5px;box-shadow:0 4px 14px rgba(0,0,0,.5);z-index:20;display:none;color:#e8dcc0;font-family:Georgia,serif;line-height:1.4';MAP.cv.parentElement.appendChild(el);}
    if(!e||!(e.kind in BASE_P)){el.style.display='none';return;}const t=siteAnywhere(e.id);if(!t){el.style.display='none';return;}
    el.innerHTML=townCard(t);el.style.display='block';const r=MAP.cv.getBoundingClientRect();const px_=sx+16,py_=sy+16;el.style.left=Math.min(px_,r.width-310)+'px';el.style.top=Math.min(py_,r.height-el.offsetHeight-10)+'px';}
  function mapPick(sx,sy){const isc=Math.max(.9,Math.min(2.2,SIZE*baseScale()*MAP.zoom/420))*(Math.min(MAP.cv.width,MAP.cv.height)/700);let best=null,bd=16*isc;(MAP._entries||[]).forEach(e=>{const [x,y]=mapToScreen(e.x,e.z);const d=Math.hypot(sx-x,sy-y);if(d<bd){bd=d;best=e;}});return best;}
  function mapPanelCell(c){const body=document.getElementById('wm-panel-body');if(!body)return;const towns=c.sites.filter(t=>t.pad>0&&t.kind!=='portal');const known=towns.filter(t=>discovered(t.id)).length;
    body.innerHTML=`<div style="font:600 16px Georgia,serif;color:#e8d8a0">${c.name||'Open sea'}</div><div style="color:#b8a880;font-size:12px;margin:4px 0 10px">${c.type==='sea'?`Open water · ${nationOf(c.i,c.j).name}`:`${nationSubtitle(c)} · `+`${towns.length} settlements${towns.some(t=>t.kind==='city')?', a city':''}${towns.some(t=>t.kind==='port')?', ports':''} · ${c.doors.length} doors · ${known} known`}</div><div style="color:#8a7a60;font-size:11px">Scroll to zoom in.</div>`;}
  function syncMapButtons(){const tg=document.getElementById('w80-maptoggle');if(!tg)return;tg.querySelectorAll('button').forEach(x=>{x.style.background=x.dataset.m===MAP.mode?'#3a2a16':'#2a2020';x.style.color=x.dataset.m===MAP.mode?'#f0e2c0':'#c8b8a0';});}
  // ── search and filters ──
  MAP.filt={towns:true,gates:true,pois:true,quests:true};
  function mapKindClass(e){if(!e||!e.kind)return 'pois';if(e.kind in BASE_P)return 'towns';if(/door|gate/.test(e.kind))return 'gates';if(e.kind==='quest')return 'quests';return 'pois';}
  function mapAllowed(e){return MAP.filt[mapKindClass(e)]!==false;}
  function mapSearch(q){const box=document.getElementById('wm-results');if(!box)return;q=(q||'').trim().toLowerCase();if(!q){box.style.display='none';return;}
    const out=[];for(const c of CELLS.values()){c.sites.forEach(t=>{if(t.name&&t.name.toLowerCase().includes(q)&&discovered(t.id))out.push({name:t.name,sub:t.kind,x:t.x,z:t.z,id:t.id,kind:t.kind});});(c.doors||[]).forEach(d=>{const n=d.canonicalName||'';if(n.toLowerCase().includes(q)){const p=dungeonWorldPos[d.seed]||d;if(discovered('door_'+d.seed))out.push({name:n,sub:'gate',x:p.x,z:p.z,id:'door_'+d.seed,kind:'door'});}});}
    out.sort((a,b)=>a.name.localeCompare(b.name));box.innerHTML=out.slice(0,12).map((o,i)=>`<div class="wm-res" data-i="${i}" style="padding:5px 10px;cursor:pointer;border-bottom:1px solid rgba(60,80,40,.4);font:12px Georgia,serif;color:#e8dcc0">${o.name} <span style="color:#8a9a70">· ${o.sub}</span></div>`).join('')||'<div style="padding:6px 10px;color:#8a9a70;font:12px Georgia,serif">Nothing you know of by that name.</div>';box.style.display='block';
    box.querySelectorAll('.wm-res').forEach(el=>el.onclick=()=>{const o=out[+el.dataset.i];const s=baseScale()*MAP.zoom;MAP.ox=MAP.cv.width/2-o.x*s;MAP.oy=MAP.cv.height/2-o.z*s;mapClamp();MAP.sel=o.id;MAP.dirty=true;mapDraw();mapPanel({id:o.id,name:o.name,kind:o.kind,x:o.x,z:o.z,sub:o.sub});box.style.display='none';});}
  function wireMapSearch(){const inp=document.getElementById('wm-search');if(!inp||inp._wired)return;inp._wired=true;inp.addEventListener('input',()=>mapSearch(inp.value));['keydown','keyup','keypress'].forEach(ev=>inp.addEventListener(ev,e=>e.stopPropagation()));document.querySelectorAll('.wm-filt').forEach(cb=>cb.addEventListener('change',()=>{MAP.filt[cb.value]=cb.checked;MAP.dirty=true;mapDraw();}));}
  function mapPanel(e){
    const body=document.getElementById('wm-panel-body');if(!body)return;
    let tg=document.getElementById('w80-maptoggle');if(!tg){tg=document.createElement('div');tg.id='w80-maptoggle';tg.style.cssText='margin:0 0 10px;display:flex;gap:6px';tg.innerHTML='<button type="button" data-m="map" style="flex:1;padding:6px;background:#3a2a16;color:#f0e2c0;border:1px solid #8a6a3a;border-radius:4px;cursor:pointer;font:13px Georgia,serif">Map</button><button type="button" data-m="local" style="flex:1;padding:6px;background:#2a2020;color:#c8b8a0;border:1px solid #5a4a3a;border-radius:4px;cursor:pointer;font:13px Georgia,serif">Local</button>';const hdr=document.getElementById('wm-panel-header');if(hdr)hdr.insertAdjacentElement('afterend',tg);tg.querySelectorAll('button').forEach(b=>b.onclick=()=>{MAP.mode=b.dataset.m;syncMapButtons();MAP.dirty=true;});}
    if(!e){body.innerHTML='<div class="wm-placeholder">Scroll to zoom, drag to pan.<br><br>Hover a place to learn more; click a discovered place to travel there.<br><br>Places appear as you find them.</div>';return;}
    const k=discovered(e.id);
    const tsite=(e.kind in BASE_P)?siteAnywhere(e.id):null;
    body.innerHTML=`<div style="font:600 16px Georgia,serif;color:#e8d8a0">${e.name}</div><div style="color:#b8a880;font-size:12px;margin:4px 0 10px">${e.sub}${tsite?' · '+stateLine(tsite):''}</div>`+(k?`<button type="button" id="w80-travel" style="padding:8px 12px;background:#3a2a16;color:#f0e2c0;border:1px solid #8a6a3a;border-radius:4px;cursor:pointer;font:14px Georgia,serif">Travel to ${e.name}</button><div style="color:#8a7a60;font-size:11px;margin-top:6px">${Math.round(Math.hypot(e.x-px,e.z-pz))}u away</div>`:'<div style="color:#8a7a60;font-size:12px">Not yet discovered.</div>');
    const b=document.getElementById('w80-travel');if(b)b.onclick=()=>fastTravel(e.id);
  }
  function openMap(){
    const pane=document.getElementById('wm-map-pane');if(!pane)return;
    const wrap=document.getElementById('wm-svg-wrap');if(wrap)wrap.style.display='none';
    const zc=document.getElementById('wm-zoom-controls');if(zc)zc.style.display='none';
    let root=document.getElementById('w80-map');
    if(!root){
      root=document.createElement('canvas');root.id='w80-map';root.style.cssText='position:absolute;inset:0;width:100%;height:100%;cursor:grab;display:block;';pane.appendChild(root);
      root.addEventListener('mousedown',ev=>{MAP.drag={x:ev.clientX,y:ev.clientY,ox:MAP.ox,oy:MAP.oy,moved:false};});
      window.addEventListener('mousemove',ev=>{
        if(MAP.drag){MAP.ox=MAP.drag.ox+(ev.clientX-MAP.drag.x);MAP.oy=MAP.drag.oy+(ev.clientY-MAP.drag.y);if(Math.hypot(ev.clientX-MAP.drag.x,ev.clientY-MAP.drag.y)>3)MAP.drag.moved=true;mapClamp();MAP.dirty=true;return;}
        if(!MAP.cv||MAP.mode!=='map')return;const r=root.getBoundingClientRect();const e=mapPick(ev.clientX-r.left,ev.clientY-r.top);const id=e?e.id:null;
        if(id!==MAP.hover){MAP.hover=id;MAP.dirty=true;if(!MAP.sel)mapPanel(e);}
        showTownCard(e,ev.clientX-r.left,ev.clientY-r.top);
        if(!e&&!MAP.sel){const [wx,wz]=screenToMap(ev.clientX-r.left,ev.clientY-r.top);const [i,j]=cellOf(wx,wz);const hc=(i>=0&&j>=0&&i<GRID&&j<GRID)?[i,j]:null;if(JSON.stringify(hc)!==JSON.stringify(MAP.hoverCell)){MAP.hoverCell=hc;if(hc)mapPanelCell(getCell(i,j));else mapPanel(null);}}
      });
      root.addEventListener('mouseleave',()=>showTownCard(null,0,0));
      window.addEventListener('mouseup',ev=>{if(!MAP.drag)return;const moved=MAP.drag.moved;MAP.drag=null;if(moved||MAP.mode!=='map')return;const r=root.getBoundingClientRect();const e=mapPick(ev.clientX-r.left,ev.clientY-r.top);MAP.sel=e?e.id:null;mapPanel(e);MAP.dirty=true;});
      (function(){const kb=document.getElementById('wm-key'),bx=document.getElementById('wm-keybox');if(kb&&bx){kb.onclick=()=>{bx.style.display=bx.style.display==='none'?'block':'none';};
        if(!document.getElementById('wm-key-bld')){const seen=new Set(),rows=[];for(const k of ['home','castle','guild_f','guild_m','church','inn','weapon','potion','misc','shipwright','barracks','other']){const B=BLD[k];if(seen.has(B.label))continue;seen.add(B.label);rows.push(`<span style="white-space:nowrap;margin-right:8px"><span style="display:inline-block;width:10px;height:10px;background:${B.col};border:1px solid ${B.line};vertical-align:-1px;margin-right:3px"></span>${B.label}</span>`);}
          const d=document.createElement('div');d.id='wm-key-bld';d.style.cssText='margin-top:6px';d.innerHTML=`<div style="color:#e8d8a0;margin-bottom:2px">In town <span style="color:#8a9a70;font-size:11px">(Local view \u00b7 minimap)</span></div><div>${rows.join(' ')}</div><div style="margin-top:2px"><span style="color:${BLD.castle.col}">\u25cf</span> the lord &nbsp; <span style="color:#f6d860">\u25ce</span> where you were directed &nbsp; <span style="color:#f6e27a">\u25a1</span> your house</div>`;
          const tip=bx.lastElementChild;bx.insertBefore(d,tip);}
        if(!document.getElementById('wm-key-bio')){const seen=new Set(),rows=[];
          for(const k of ['plains','forest','autumn','moor','fen','swamp','dunes','tundra','wasteland','coast']){const B=MAPBIO[k];if(!B||seen.has(B.label))continue;seen.add(B.label);
            rows.push(`<span style="white-space:nowrap;margin-right:8px"><span style="display:inline-block;width:10px;height:10px;background:#${B.col.toString(16).padStart(6,'0')};border:1px solid rgba(0,0,0,.4);vertical-align:-1px;margin-right:3px"></span>${B.label}</span>`);}
          const d2=document.createElement('div');d2.id='wm-key-bio';d2.style.cssText='margin-top:6px';
          d2.innerHTML=`<div style="color:#e8d8a0;margin-bottom:2px">The land</div><div>${rows.join(' ')}</div><div style="margin-top:2px;color:#8a9a70;font-size:11px">Colour is the country; shading is the height. Peaks go to rock and snow whatever grows there.</div>`;
          const tip2=bx.lastElementChild;bx.insertBefore(d2,tip2);}}})(); // v80 S131 — the key; S138 — the town colours; S144 — the land
      root.addEventListener('wheel',ev=>{ev.preventDefault();if(MAP.mode!=='map')return;const r=root.getBoundingClientRect();const mx=ev.clientX-r.left,my=ev.clientY-r.top;const [wx,wz]=screenToMap(mx,my);MAP.zoom=Math.max(1,Math.min(64,MAP.zoom*(ev.deltaY<0?1.18:1/1.18)));const s=baseScale()*MAP.zoom;MAP.ox=mx-wx*s;MAP.oy=my-wz*s;mapClamp();MAP.dirty=true;},{passive:false});
    }
    root.style.display='block';
    const r=pane.getBoundingClientRect();root.width=Math.max(300,r.width|0);root.height=Math.max(300,r.height|0);
    MAP.cv=root;MAP.ctx=root.getContext('2d');MAP.W=Math.min(root.width,root.height);MAP.H=root.height;MAP.mode='map';
    // open at province scale, centred on the player
    MAP.zoom=Math.max(1,Math.min(64,(Math.min(root.width,root.height)*.55)/(SIZE*baseScale())));wireMapSearch();
    const s=baseScale()*MAP.zoom;MAP.ox=root.width/2-px*s;MAP.oy=root.height/2-pz*s;mapClamp();
    MAP.sel=null;mapPanel(null);syncMapButtons();MAP.dirty=true;mapDraw();
    if(!MAP._raf){const loop=()=>{if(MAP.cv&&MAP.cv.style.display!=='none'){mapJobs();if(MAP.dirty)mapDraw();MAP._raf=requestAnimationFrame(loop);}else MAP._raf=null;};MAP._raf=requestAnimationFrame(loop);}
  }
  function closeMap(){
    const root=document.getElementById('w80-map');if(root)root.style.display='none';
    const wrap=document.getElementById('wm-svg-wrap');if(wrap)wrap.style.display='';
    const zc=document.getElementById('wm-zoom-controls');if(zc)zc.style.display='';
  }

  // ═══ INTERIORS (Session 6) ═══════════════════════════════════════════
  // Rooms for generated buildings. Sized from the building's footprint,
  // walls and floors by region, furnished by trade, a gallery floor when
  // the exterior is two-storey. Follows the engine's interior contract:
  // sets interiorScene, fog, intNPCMesh/intNPCPos (+amble), intBedPos.
  // Door is the south wall centre (walk south to exit), player spawns at
  // (W/2, D-2.2) — same as the engine.
  const INT_TEX={};
  function intTex(kind,reg){
    const key=kind+'|'+reg;if(INT_TEX[key])return INT_TEX[key];
    const t=mkTex((ctx,w,h)=>{
      const P=(a,b)=>a+Math.random()*(b-a)|0;
      if(kind==='plaster'){ // lime / cream plaster, faint trowel marks
        const base=reg==='irish'?[232,226,212]:reg==='french'?[222,210,178]:[208,200,186];
        ctx.fillStyle=`rgb(${base})`;ctx.fillRect(0,0,w,h);
        for(let i=0;i<900;i++){const l=P(-12,12);ctx.fillStyle=`rgba(${base[0]+l},${base[1]+l},${base[2]+l},.5)`;ctx.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*6,1+Math.random()*2);}
      } else if(kind==='rubble'){ // grey rubble stone
        ctx.fillStyle='#4a4640';ctx.fillRect(0,0,w,h);
        for(let i=0;i<260;i++){const l=P(96,128);ctx.fillStyle=`rgb(${l},${l-4},${l-10})`;const rw=10+Math.random()*22,rh=7+Math.random()*12;ctx.fillRect(Math.random()*w,Math.random()*h,rw,rh);ctx.strokeStyle='rgba(30,26,22,.6)';ctx.lineWidth=1;ctx.strokeRect(Math.random()*w,Math.random()*h,rw,rh);}
      } else if(kind==='ashlar'){ // dressed stone courses
        ctx.fillStyle='#6a665e';ctx.fillRect(0,0,w,h);
        const ch=20;for(let y=0;y<h;y+=ch){const off=((y/ch)|0)%2?22:0;for(let x=-22;x<w;x+=44){const l=P(150,178);ctx.fillStyle=`rgb(${l},${l-3},${l-10})`;ctx.fillRect(x+off+1,y+1,42,ch-2);}}
      } else if(kind==='plank'){
        ctx.fillStyle='#5a3a1c';ctx.fillRect(0,0,w,h);
        for(let y=0;y<h;y+=16){const l=P(86,120);ctx.fillStyle=`rgb(${l},${(l*.62)|0},${(l*.32)|0})`;ctx.fillRect(0,y+1,w,14);for(let k=0;k<12;k++){ctx.fillStyle=`rgba(40,22,8,.35)`;ctx.fillRect(Math.random()*w,y+2+Math.random()*12,20+Math.random()*40,1);}}
      } else if(kind==='flag'){ // flagstones
        ctx.fillStyle='#3e3a34';ctx.fillRect(0,0,w,h);
        for(let y=0;y<h;y+=32)for(let x=0;x<w;x+=32){const l=P(108,136);ctx.fillStyle=`rgb(${l},${l-4},${l-10})`;ctx.fillRect(x+2+(y/32%2?8:0),y+2,28,28);}
      }
    },256,256);
    INT_TEX[key]=t;return t;
  }
  function tiled(kind,reg,rx,ry){const t=intTex(kind,reg).clone();t.needsUpdate=true;t.repeat.set(rx,ry);return new THREE.MeshLambertMaterial({map:t});}
  // S286 — the room's baked furniture (S289: every bake in it, the counter too): freed when the next room is built, the
  // flames flickered by tickInterior
  let FURN_LIVE=[];
  function furnSwap(room){FURN_LIVE.push(room);}
  function furnFree(){for(const r of FURN_LIVE)r.traverse(o=>{if(o.isMesh)o.geometry.dispose();});FURN_LIVE=[];}
  // S356 — the kit shell's ceiling and four shaded walls, for the generated rooms (S342) and the legacy builder's (S356)
  function shellWalls(sc_,W,D,H,wallKind,reg){
  const ce=new THREE.Mesh(new THREE.PlaneGeometry(W,D),tiled('plank',reg,W/2.2,D/2.2));ce.material.color.setHex(0x8a7a68);ce.rotation.x=Math.PI/2;ce.position.set(W/2,H,D/2);sc_.add(ce);
  [[W/2,0,0,W],[W/2,D,Math.PI,W],[0,D/2,Math.PI/2,D],[W,D/2,-Math.PI/2,D]].forEach(([x,z,ry,len])=>{
    const geo=new THREE.PlaneGeometry(len,H,Math.max(4,Math.round(len/.5)),Math.min(60,Math.max(10,Math.round(H/.2))));
    /* S355 — a wall over 12 high (the tower's 31) takes 60 rows packed towards the foot and the head, where the shading changes */
    if(H>12){const P_=geo.attributes.position,U_=geo.attributes.uv;for(let i=0;i<P_.count;i++){const t=P_.getY(i)/H+.5,t2=.5-.5*Math.cos(Math.PI*t);P_.setY(i,(t2-.5)*H);U_.setY(i,t2);}}
    {const P_=geo.attributes.position,col=new Float32Array(P_.count*3);for(let i=0;i<P_.count;i++){const u=P_.getX(i)+len/2,y=P_.getY(i)+H/2,e=Math.min(u,len-u);
      col[i*3]=col[i*3+1]=col[i*3+2]=Math.max(.45,1-.38*Math.exp(-y/.3)-.3*Math.exp(-(H-y)/.35)-.32*Math.exp(-e/.4));}geo.setAttribute('color',new THREE.BufferAttribute(col,3));}
    const wm=new THREE.Mesh(geo,tiled(wallKind,reg,len/2.6,H/2.6));wm.material.vertexColors=true;wm.userData.shaded=true;wm.position.set(x,H/2,z);wm.rotation.y=ry;sc_.add(wm);
  });
  }
  // the frame, built last so a post gives way to whatever stands against the wall (o.block: a legacy room's furniture test)
function shellFrame(sc_,o){const {W,D,H,type,st,wallKind,FN,FSEED,beams,wins,TALLZ,SOL,FOOTHOLDS}=o;const K=furnKit(),P=K.Parts(),Wd=K.WOOD[FN]||K.WOOD.gatelands,T=Wd.dark,S=0x6e675e,stone=wallKind!=='plaster',close=st==='french';
    let sd=FSEED*7+3;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};const jit=(c,a)=>new THREE.Color(c).offsetHSL(0,0,(r()-.5)*(a||.06));
    const rb=(w,h,d,q)=>SK.rbox(w,h,d,q==null?Math.min(.02,w/3,h/3,d/3):q,1);
    const bh=.22,bw=.2,jh=.09,yB=H-jh-bh/2;
    for(const z of beams)P(rb(W,bh,bw,.03),jit(T,.05),W/2,yB,z);
    for(let x=.3;x<W-.1;x+=.5)P(rb(.09,jh,D,.015),jit(T,.07),x,H-jh/2,D/2);
    // plates and plinth along each wall, the south one broken for the entrance
    [[W/2,0,W,0],[0,D/2,D,1],[W,D/2,D,1],[W/2,D,W,0]].forEach(([cx,cz,L,side])=>{const inset=side?(cx<1?.05:-.05):(cz<1?.05:-.05);
      const gap=type==='church'||type==='castle'?1.1:.9,segs=cz===D?[[0,W/2-gap],[W/2+gap,W]]:[[0,L]];
      for(const [a,b] of segs){const mid=(a+b)/2;
        if(stone){for(let s2=a;s2<b-.05;s2+=.55){const l=Math.min(.55,b-s2)-.02,c=s2+l/2;side?P(rb(.16,.26,l,.03),jit(S,.08),cx+inset*1.6,.13,c):P(rb(l,.26,.16,.03),jit(S,.08),c,.13,cz+inset*1.6);}}
        else side?P(rb(.1,.16,b-a,.015),jit(T),cx+inset,.08,mid):P(rb(b-a,.16,.1,.015),jit(T),mid,.08,cz+inset);}
      side?P(rb(.14,.16,L,.02),jit(T),cx+inset*1.2,H-jh-.08,cz):P(rb(L,.16,.14,.02),jit(T),cx,H-jh-.08,cz+inset*1.2);});
    const nearWin=(z,d)=>wins.some(wz=>Math.abs(wz-z)<d)||TALLZ.some(wz=>Math.abs(wz-z)<d);
    const hits=(x0,x1,z0,z1)=>SOL.some(q=>q.x0<x1&&q.x1>x0&&q.z0<z1&&q.z1>z0)||FOOTHOLDS.some(q=>q.x0!=null&&(q.x1-q.x0)*(q.z1-q.z0)<12&&q.x0<x1&&q.x1>x0&&q.z0<z1&&q.z1>z0)||!!(o.block&&o.block(x0,x1,z0,z1));
    const posts=[];const post=(x,z)=>{if(hits(x-.1,x+.1,z-.1,z+.1))return false;posts.push([x,z]);P(rb(.18,H-jh-.16,.18,.03),jit(T,.05),x,(H-jh-.16)/2,z);return true;};
    if(!stone){for(const [x,z] of [[.09,.09],[W-.09,.09],[.09,D-.09],[W-.09,D-.09]])post(x,z);
      for(const z of beams)for(const sx of [0,1]){const x=sx?W-.09:.09,dir=sx?-1:1;
        if(!nearWin(z,1.2)&&post(x,z)){const L=.75;for(const dz of [-1,1])P(rb(.1,L,.1,.02),jit(T),x+dir*.02,yB-bh/2-L*.35,z+dz*L*.35,dz*.78,0,0);P(rb(.1,.5,.1,.02),jit(T),x+dir*.24,yB-bh/2-.18,z,0,0,-dir*.8);}
        else P(rb(.22,.3,.24,.03),jit(T),x+dir*.03,yB-bh/2-.15,z);}
      const step=close?1.6:2.4;for(let x=step;x<W-.8;x+=step){if(Math.abs(x-W/2)>1.1)post(x,D-.09);post(x,.09);}
      if(close)for(let z=1.6;z<D-.8;z+=1.6)if(!nearWin(z,1.2)&&!beams.some(b=>Math.abs(b-z)<.5)){post(.09,z);post(W-.09,z);}}
    else for(const z of beams)if(!nearWin(z,.8))for(const sx of [0,1]){const x=sx?W:0,dir=sx?-1:1;
      for(let k=0;k<3;k++)P(rb(.16+k*.12,.12,.3,.025),jit(S,.06),x+dir*(.08+k*.06),yB-bh/2-.3+k*.12,z);}
    for(const [x,z] of posts)SOL.push({x0:x-.09,x1:x+.09,z0:z-.09,z1:z+.09,y0:-.5,y1:H,post:true});
    const G=K.bake(P);G.userData.shell={posts:posts.length,stone,at:posts};sc_.add(G);
    // the entrance: plank door with ledges, a brace, strap hinges with nail heads and a ring (local: the wall at z=0, the room +z)
    const big=type==='church'||type==='castle',Q=K.Parts(),w=big?1.5:1.0,h=big?2.3:1.5,I=0x2a2624,SS_=0x9a9284,nbd=big?7:5;
    for(let k=0;k<nbd;k++)Q(rb(w/nbd-.008,h,.05,.01),jit(Wd.wood,.08),-w/2+w/nbd*(k+.5),h/2,.03);
    for(const y of [.25,h-.25])Q(rb(w-.1,.09,.035,.01),jit(Wd.dark),0,y,.07);
    Q(rb(.08,Math.hypot(w-.16,h-.6),.03,.01),jit(Wd.dark),0,h/2,.07,0,0,Math.atan2(w-.16,h-.6));
    for(const y of [.25,h-.25]){Q(rb(w*.7,.045,.012,.005),I,-w*.15,y,.095);for(let k=0;k<4;k++)Q(SK.ball(.012,5,4),I,-w/2+.06+k*w*.19,y,.1);}
    Q(SK.torus(.05,.008,4,12),I,w*.32,h*.52,.1);Q(SK.ball(.02,6,5),I,w*.32,h*.52+.05,.09);
    if(stone){for(const sx of [-1,1])for(let k=0,y=0;k<4;k++){const bh2=h/4,bw2=k%2?.16:.24;Q(rb(bw2,bh2-.012,.2),jit(SS_,.07),sx*(w/2+bw2/2),y+bh2/2,.08);y+=bh2;}Q(rb(w+.6,.22,.22),jit(SS_,.05),0,h+.11,.09);}
    else{for(const sx of [-1,1])Q(rb(.12,h+.1,.14),jit(Wd.dark),sx*(w/2+.06),(h+.1)/2,.06);Q(rb(w+.5,.16,.16),jit(Wd.dark),0,h+.13,.07);}
    const Dr=K.bake(Q);Dr.position.set(W/2,0,D);Dr.rotation.y=Math.PI;Dr.userData.entrance=true;sc_.add(Dr);return {G,Dr,posts};}
  function buildInteriorFor(house){
    const reg=house.reg||'irish',type=house.type||'misc',st=house.style||'irish';
    INT_BED_NATION=nationAt(house.doorX,house.doorZ); // S288 — the beds' wood
    furnFree();
    const two=!!house.two;
    // room from footprint (interiors run larger than exteriors, as games do)
    let W=Math.max(8,Math.round((house.w||6)*1.8)),D=Math.max(8,Math.round((house.d||5)*2.0));
    // Eye height is 0.92u, so rooms and furniture are scaled to that: cottage
    // ceilings ~2.1u, counters ~0.6u. F scales every furniture height below.
    let ceil=st==='stone'?2.6:st==='french'?2.4:st==='anglo'?2.0:2.1;
    if(type==='church'){W=Math.max(10,Math.round((house.w||8)*1.5));D=Math.max(16,Math.round((house.d||9)*2.4));ceil=5.0;}
    if(type==='castle'){W=Math.max(18,Math.round((house.w||14)*1.5));D=Math.max(22,Math.round((house.d||11)*2.2));ceil=5.6;}
    const F=.62;
    if(type==='inn'){W=Math.max(W,12);D=Math.max(D,11);}
    if(type==='guild_f'||type==='guild_m'){W=Math.max(22,W);D=Math.max(20,D);}
    if(type==='cabin'){W=8;D=9;ceil=2.0;}
    if(type==='cellar'){W=Math.max(8,Math.round((house.w||6)*1.4));D=Math.max(8,Math.round((house.d||5)*1.6));ceil=2.0;}
    if(type==='chapel'){W=9;D=12;ceil=3.4;}
    if(type==='tower'){W=9;D=9;ceil=31;}
    const gallery=two&&type!=='church'&&type!=='castle';
    const H=gallery?ceil*1.85:ceil;
    house.intW=W;house.intD=D;
    const sc_=new THREE.Scene();interiorScene=sc_;
    sc_.background=new THREE.Color(0x120a06);
    sc_.fog=new THREE.Fog(0x120a06,Math.max(W,D)*.8,Math.max(W,D)*2.4);
    intNPCMesh=null;intBedPos=null;intStashPos=null;
    // Furniture helpers scale y and height by F. Shell pieces (walls, beams,
    // deck, pillars) use raw units via boxRaw.
    const boxRaw=(x,y,z,w,h,d,col,ry)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:col}));m.position.set(x,y,z);if(ry)m.rotation.y=ry;sc_.add(m);return m;};
    const box=(x,y,z,w,h,d,col,ry)=>boxRaw(x,y*F,z,w,h*F,d,col,ry);
    const cyl=(x,y,z,r0,r1,h,col,seg)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h*F,seg||8),new THREE.MeshLambertMaterial({color:col}));m.position.set(x,y*F,z);sc_.add(m);return m;};
    const glow=(x,y,z,col)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.06,5,5),new THREE.MeshBasicMaterial({color:col}));m.position.set(x,y*F,z);sc_.add(m);return m;};
    const light=(x,y,z,col,i,dist)=>{const l=new THREE.PointLight(col,i,dist);l.position.set(x,y*F,z);sc_.add(l);return l;};
    // interior solids the player can't walk through (AABBs, room coords)
    const SOL=[];
    // solid(x,z,hw,hd,top): a block you can step or jump onto (foothold at `top`).
    const solid=(x,z,hw,hd,top)=>{const t=(top==null?.62:top)*F;SOL.push({x0:x-hw,x1:x+hw,z0:z-hd,z1:z+hd,y0:-.5,y1:t});FOOTHOLDS.push({x0:x-hw,x1:x+hw,z0:z-hd,z1:z+hd,y:t});};
    INT_SOL=SOL;FOOTHOLDS=[];INT_BEDS=[];INT_DOORS=[];intBedPos=null;INT_NPCS=[];HATCH.active=false;HATCH.roof=false;INT_LOOT=null;INT_BOX=null;
    const bedOwner=type==='inn'?'inn':type==='home'?'home':(type==='guild_f'||type==='guild_m')?'guild':'free';
    // S289 — the room's nation (the furniture's wood) and a seed from the house id; S293: declared before the gallery uses it
    const FN=nationAt(house.doorX,house.doorZ),FSEED=String(house.id||'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,13)%100000;
    // Partition wall from (x0,z0) to (x1,z1) on a floor at base `by`, height `hh`,
    // with an optional doorway (gap 1.4) at parameter t (0..1). Full-height solid.
    const wallMat=()=>tiled(st==='anglo'?'rubble':(st==='stone'||st==='garrison')?'ashlar':'plaster',reg,2,1);
    const partition=(x0,z0,x1,z1,by,hh,doorT)=>{
      const dx=x1-x0,dz=z1-z0,L=Math.hypot(dx,dz),ang=Math.atan2(dx,dz);
      const seg=(a,b)=>{if(b-a<.05)return;const len=(b-a)*L;const mx=x0+dx*(a+b)/2,mz=z0+dz*(a+b)/2;const m=new THREE.Mesh(new THREE.BoxGeometry(.22,hh,len),wallMat());m.position.set(mx,by+hh/2,mz);m.rotation.y=ang;sc_.add(m);
        const hw=Math.abs(Math.sin(ang))*len/2+.11,hd=Math.abs(Math.cos(ang))*len/2+.11;SOL.push({x0:mx-hw,x1:mx+hw,z0:mz-hd,z1:mz+hd,y0:by-.3,y1:by+hh});};
      if(doorT==null){seg(0,1);}else{const g=.75/L;seg(0,Math.max(0,doorT-g));seg(Math.min(1,doorT+g),1);
        const lx=x0+dx*doorT,lz=z0+dz*doorT;const lint=new THREE.Mesh(new THREE.BoxGeometry(.24,.14,1.6),new THREE.MeshLambertMaterial({color:beamC0}));lint.position.set(lx,by+1.55,lz);lint.rotation.y=ang;sc_.add(lint);
        intDoorAt(sc_,SOL,lx,lz,by,ang,beamC0);} // v80 S143 — a door hangs in the gap
    };
    const beamC0=st==='french'||st==='anglo'?0x2c1e12:0x4a3420;const bedAt=(x,z,y,room)=>INT_BEDS.push({x,z,y:y||0,owner:bedOwner,room:room==null?null:room}); // v80 S141 — a bed belongs to a room
    // shell
    const wallKind=st==='anglo'?'rubble':(st==='stone'||st==='garrison'||type==='church'||type==='castle')?'ashlar':'plaster';
    const floorKind=(st==='stone'||st==='garrison'||type==='church'||type==='castle')?'flag':'plank';
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(W,D),tiled(floorKind,reg,W/2.2,D/2.2));fl.rotation.x=-Math.PI/2;fl.position.set(W/2,0,D/2);sc_.add(fl);
    // S342 (Michael's A on #62) — the generated rooms' shell on the kit: a boarded ceiling over joists, the walls shaded at the foot,
    // the head and the corners, and (built after the furniture, below) the frame; the tower keeps today's (S344: churches and keep
    // halls now take it too, as stone rooms, with a larger door and the corbels clear of their tall windows)
    // S355 — the tower too, as a stone room without beams: its top floor stands at 30 under a ceiling at 31, and a beam there
    // would hang at a person's neck; the joists, the plates, the plinth, the shaded walls and the plank door as elsewhere
    const kitShell=true,tower=type==='tower',TALLZ=[];
    shellWalls(sc_,W,D,H,wallKind,reg);
    const beamC=st==='french'||st==='anglo'?0x2c1e12:0x4a3420;
    // timber studs (french) and beams
    if(st==='french'&&!kitShell){for(let x=1.4;x<W-1;x+=1.6){boxRaw(x,H/2,.06,.14,H,.12,beamC);boxRaw(x,H/2,D-.06,.14,H,.12,beamC);}for(let z=1.4;z<D-1;z+=1.6){boxRaw(.06,H/2,z,.12,H,.14,beamC);boxRaw(W-.06,H/2,z,.12,H,.14,beamC);}}
    const nb=Math.max(2,Math.round(D/3));if(!kitShell)for(let i=1;i<=nb;i++)boxRaw(W/2,H-.1,D*i/(nb+1),W,.16,.22,beamC);
    // windows: lit panes on both long walls
    // S331 (Michael's 2 on #53) — each pane set back on the wall behind a kit frame chosen by the room (winKind); one bake a room
    const winY=Math.min(H-.6,1.35);const WK=furnKit(),WP=WK.Parts(),wKind=WK.winKind(type,false);let wi=0;
    for(let z=D*.3;z<D*.9;z+=Math.max(3,D*.3)){[.03,W-.03].forEach(x=>{const west=x<1;const p=new THREE.Mesh(new THREE.PlaneGeometry(.9,.95),windowMat(type,house));p.position.set(west?.006:W-.006,winY,z);p.rotation.y=west?Math.PI/2:-Math.PI/2;sc_.add(p);
      WP.put(WK.windowFrame(wKind,.9,.95,FN,FSEED+wi++),west?0:W,z,west?Math.PI/2:-Math.PI/2,winY);light(west?.6:W-.6,winY,z,0xc8d0e0,.35,5);});}
    {const G=WK.bake(WP);G.userData.windows=wKind;sc_.add(G);}
    // the tall windows of a church or a keep's hall: a round-headed pane of lit glass in a stone frame (C), one bake for the lot
    const tallWins=(zs,y,w,h,col)=>{const T=WK.Parts();TALLZ.push(...zs);zs.forEach((z,k)=>[0,W].forEach(x=>{const west=x<1,R=w/2,sh=new THREE.Shape();sh.moveTo(-R,-h/2);sh.lineTo(R,-h/2);sh.lineTo(R,h/2-R);sh.absarc(0,h/2-R,R,0,Math.PI,false);sh.lineTo(-R,-h/2);
      const g=new THREE.Mesh(new THREE.ShapeGeometry(sh,12),new THREE.MeshBasicMaterial({color:col}));g.position.set(west?.006:W-.006,y,z);g.rotation.y=west?Math.PI/2:-Math.PI/2;sc_.add(g);
      T.put(WK.windowFrame('C',w,h,FN,FSEED+50+k*2+(west?0:1)),x,z,west?Math.PI/2:-Math.PI/2,y);}));const G=WK.bake(T);G.userData.windows='C';sc_.add(G);};
    sc_.add(new THREE.AmbientLight(0xffb070,type==='church'?.32:type==='castle'?.3:.45));
    const lan=new THREE.PointLight(0xffaa44,2.2,Math.max(W,D)*1.3);lan.position.set(W/2,H-.4,D/2);sc_.add(lan);const lc=new THREE.Mesh(new THREE.SphereGeometry(.06,5,5),new THREE.MeshBasicMaterial({color:0xffdd88}));lc.position.copy(lan.position);sc_.add(lc);
    // door on the south wall + the engine's exit disc
    if(!kitShell)boxRaw(W/2,.7,D-.05,.9,1.4,.08,0x4a2e14);
    const eDisc=new THREE.Mesh(new THREE.CircleGeometry(.5,10),new THREE.MeshBasicMaterial({color:0xc8a84a,transparent:true,opacity:.18,side:THREE.DoubleSide}));eDisc.rotation.x=-Math.PI/2;eDisc.position.set(W/2,.02,D-1.0);sc_.add(eDisc);
    // gallery: mezzanine along the north half, railing, stair on the west wall
    if(gallery){
      // Mezzanine over the north half at gy, reached by a straight stair
      // against the west wall (run = gy/0.62 for a ~32° climb). Both are
      // FOOTHOLDS, so the player actually walks up; the railing is solid
      // except at the stair head.
      const guild=type==='guild_f'||type==='guild_m';const gy=ceil-.1,gd=Math.min(D*.45,guild?6:6),run=gy/.62,zs=gd+.6;
      // stair side varies by house: west or east wall
      const east=guild?false:galleryEast(house); /* S424 — one rule with the innkeeper's directions */const sx0=east?W-1.6:.1,sx1=east?W-.1:1.6,sxc=east?W-.85:.85;
      const deck=new THREE.Mesh(new THREE.BoxGeometry(W,.16,gd),tiled('plank',reg,W/2.2,gd/2.2));deck.position.set(W/2,gy-.08,gd/2);sc_.add(deck);
      FOOTHOLDS.push({x0:0,x1:W,z0:0,z1:gd,y:gy});
      // landing between the deck edge and the top tread — no seam to fall through
      boxRaw(sxc,gy-.08,(gd+zs)/2,1.5,.16,zs-gd+.1,0x5a3a1c);FOOTHOLDS.push({x0:sx0,x1:sx1,z0:gd-.2,z1:zs+.1,y:gy});
      // stair: treads
      const steps=Math.max(6,Math.round(run/.32));
      for(let i=0;i<steps;i++){const t=(i+.5)/steps;const z=zs+run*t;boxRaw(sxc,gy*(1-t)-.05,z,1.3,.1,run/steps+.02,0x5a3a1c);boxRaw(sxc,gy*(1-t)-.18,z+run/steps/2,1.3,.26,.06,0x4a2e14);}
      FOOTHOLDS.push({x0:sx0,x1:sx1,z0:zs,z1:zs+run+.25,axis:'z',y0:gy,y1:-.1});
      // railing along the deck edge, open above the stair
      for(let x=.4;x<W;x+=.8){if(x>=sx0-.2&&x<=sx1+.2)continue;boxRaw(x,gy+.3,gd+.04,.06,.6,.06,beamC);}
      const rx0=east?0:1.7,rx1=east?W-1.7:W;boxRaw((rx0+rx1)/2,gy+.6,gd+.04,rx1-rx0,.06,.06,beamC);
      SOL.push({x0:rx0,x1:rx1,z0:gd-.08,z1:gd+.16,y0:gy-.3,y1:gy+.8}); // railing: on the deck only, and a jump clears it
      boxRaw(east?W-1.6:1.6,gy*.5+.5,zs+run/2,.06,.06,run,beamC).rotation.x=Math.atan2(gy,run);
      // upstairs rooms: a corridor along the deck edge (1.8 deep), rooms behind
      // it, each with a doorway from the corridor.
      const nRooms=Math.max(1,Math.floor(W/4.5));const corr=1.9,roomBack=gd-corr;
      if(roomBack>2.2){
        for(let k=0;k<nRooms;k++){const xa=k*W/nRooms,xb=(k+1)*W/nRooms;partition(xa,roomBack,xb,roomBack,gy,ceil-.3,.5);if(k>0)partition(xa,0,xa,roomBack,gy,ceil-.3,null);}
      }

      // furniture up top: beds, a chest
      const up=o=>{o.position.y+=gy;};
      const lift=n=>sc_.children.slice(-n).forEach(up);
      {const nR=Math.max(1,Math.floor(W/4.5));const many=type==='inn'||type==='guild_f'||type==='guild_m';for(let k=0;k<(many?nR:1);k++){const bx=(k+.5)*W/nR+(k%2?.6:-.6);const k0=sc_.children.length;_intBed(sc_,bx,1.1,'N');sc_.children.slice(k0).forEach(up);bedAt(bx,1.1,gy,type==='inn'?k:null);if(many&&W/nR>4.2){const k1=sc_.children.length;_intBed(sc_,bx+(k%2?-1.6:1.6),1.1,'N');sc_.children.slice(k1).forEach(up);bedAt(bx+(k%2?-1.6:1.6),1.1,gy,type==='inn'?k:null);}}}
      {const K=furnKit(),c=K.bake(K.chest(FN,FSEED+3));c.position.set(W/2,gy,.6);c.userData.furn=true;sc_.add(c);furnSwap(c);} // S293 — the gallery's chest on the kit
      const gl=new THREE.PointLight(0xffaa44,.9,gd*1.5);gl.position.set(W/2,gy+1.2,gd/2);sc_.add(gl);
    }
    // ── trade furnishing ────────────────────────────────────────────────
    let npc={x:W/2,z:2.2,maxZ:Math.min(D*.55,4.5),paused:false}; /* S387 — behind the counter (z 2.6–3.4), not on its edge */
    // S289 — every shop's counter is the kit's panelled counter, bare (the bar without its tankards), its own small bake
    const counter=()=>{const K=furnKit(),c=K.bake(K.counter(W*.5,FN,FSEED+5,true));c.position.set(W/2,0,3.0);c.userData.furn=true;sc_.add(c);furnSwap(c);solid(W/2,3.0,W*.25+.1,.4,1.05);};
    // A finished table: thick plank top with a lip, aprons, turned legs, and benches if asked.
    const table=(x,z,w,d,benches)=>{
      box(x,.74,z,w,.09,d,0x6a4a2a);box(x,.79,z,w+.06,.03,d+.06,0x4a3018);
      for(let k=1;k<Math.round(w/.45);k++)box(x-w/2+k*.45,.795,z,.02,.02,d,0x4a3018);
      box(x,.66,z,w-.3,.07,d-.3,0x5a3a1c);
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{box(x+sx*(w/2-.18),.37,z+sz*(d/2-.18),.09,.74,.09,0x4a3018);box(x+sx*(w/2-.18),.2,z+sz*(d/2-.18),.12,.06,.12,0x4a3018);});
      solid(x,z,w/2,d/2,.76);
      if(benches)[-1,1].forEach(sd=>{const bz=z+sd*(d/2+.4);box(x,.42,bz,w-.2,.08,.36,0x5a3a1c);box(x,.36,bz,w-.3,.04,.28,0x4a3018);[-1,1].forEach(sx=>box(x+sx*(w/2-.3),.2,bz,.08,.42,.3,0x4a3018));solid(x,bz,w/2-.1,.2,.44);});
    };
    if(type==='weapon'){
      // S289 — the smithy on the kit (#46 A): a coursed forge with a hood, chimney and bellows, an anvil on a stump, a quench
      // tub, racks of the weapon kit's blades and hafts on the east wall, a grindstone, a dagger on the counter; one bake
      {const K=furnKit(),room=K.bake(K.smithy(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(1.2,1.4,.9,.8,1.2);light(1.2,1.0,2.0,0xff6a20,1.6,6);solid(W-2.0,1.6,.3,.3,1.0);solid(W-1.0,3.2,.3,.3,.7);
      counter();
    } else if(type==='armor'){
      // S290 — the armourer on the kit (#46 A): three stands (plate, leather, mail) with helms, the kit's shields on the
      // east wall in front of the back room, a bench with leather, rivets and a mallet; one bake
      {const K=furnKit(),room=K.bake(K.armoury(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      for(let k=0;k<3;k++)solid(1.6+k*1.6,1.6,.25,.25,1.8);solid(W-1.6,1.6,.7,.3,.76);
      counter();
    } else if(type==='potion'){
      // S290 — the apothecary on the kit: three shelves of bright potions, herbs hung drying, the still (an iron cauldron
      // glowing green over a small fire, a copper alembic), a mortar and pestle on the counter; one bake
      {const K=furnKit(),room=K.bake(K.apothecary(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      light(W-1.6,1.3,1.8,0x60ff80,1.0,5);solid(W-1.6,1.8,.4,.4,1.0);
      counter();
    } else if(type==='misc'||type==='shipwright'){
      // S290 — the general goods on the kit: crates, sacks tied at the neck, shelves of pots, bowls and plates, a balance on
      // the counter; the barrels are the interiors' kit barrel. The sacks stood in the back room; now in front of it
      {const K=furnKit(),room=K.bake(K.goods(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      _intBarrel(sc_,W-1.0,1.2);_intBarrel(sc_,W-1.9,1.1);_intBarrel(sc_,W-1.4,2.0);
      counter();
    } else if(type==='inn'){
      // S287 — the taproom on the kit (#46 A): a panelled bar with a brass rail and stools, the dresser of bottles and plates
      // behind it, two casks on cradles, the big stone hearth, four tables with benches, by the nation's wood, one mesh and
      // the flames. The beds are still _intBed's (the rooms' beds are shared with shops and halls); the solids are the old ones.
      {const K=furnKit(),seed=String(house.id||'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,11)%100000;
        const room=K.bake(K.inn(W,D,H,nationAt(house.doorX,house.doorZ),seed,true));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(W/2,2.2,W*.275+.1,.45,1.15);
      const hx=W-.4;light(hx-.8,.8,D*.5,0xff6a20,1.5,7);solid(W-.35,D*.5,.35,1.15,1.3);
      const tables=[[3.4,D*.42],[3.4,D*.66],[W-3.4,D*.7],[W/2,D*.6]]; // clear of the stair foot
      tables.forEach(([x,z])=>{solid(x,z,.9,.5,.76);[-1,1].forEach(sd=>solid(x,z+sd*.9,.8,.2,.44));});
      if(!gallery){_intBed(sc_,1.2,D-2.0,'N');_intBed(sc_,W-1.2,D-2.0,'N');bedAt(1.2,D-2.0,0);bedAt(W-1.2,D-2.0,0);intBedPos={x:1.2,z:D-2.0};}else intBedPos={x:W-1.2,z:1.2};
      npc={x:W/2,z:1.4,maxZ:1.8,paused:false};
    } else if(type==='church'){
      // S291 — the church on the kit (#46 A): a flagged stone dais, a moulded altar with its cloth, runner, candlesticks and
      // book, pews with shaped ends and kneelers, an eight-sided pulpit with steps, columns with bases and capitals; one bake
      {const K=furnKit(),room=K.bake(K.church(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(W/2,1.6,1.2,.55,1.3);light(W/2,2.2,1.8,0xffc070,1.4,8);
      {const zs=[];for(let z=3;z<D-2;z+=Math.max(3,D/4))zs.push(z);tallWins(zs,3.4,.9,2.6,0xc89050);}
      for(const x of [W/2-4.1,W/2+4.1])for(let z=5.5;z<D-3;z+=4)solid(x,z,.4,.4,H/F); // S303 — the columns outside the pews (at W/2 ± 3 they stood in them)
      npc={x:W/2,z:3.2,maxZ:3.6,paused:true};
    } else if(type==='castle'){
      // S291 — the keep's hall on the kit (#46 A): a stone dais with a runner and a carved throne, a long runner down the hall,
      // columns with banners, two braziers, the long table with benches, plates, tankards and candles; one bake
      {const K=furnKit(),room=K.bake(K.hall(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(W/2,1.6,.5,.4,1.0);
      for(let z=6;z<D-3;z+=4)[W/2-5,W/2+5].forEach(x=>solid(x,z,.5,.5,H/F));
      [W/2-3,W/2+3].forEach(x=>{light(x,1.4,5.2,0xff6a20,1.3,8);solid(x,5.2,.3,.3,1.1);});
      {const z=D*.3;solid(W/2,z,4,.8,.76);[-1,1].forEach(sd=>solid(W/2,z+sd*1.2,3.9,.2,.44));}
      {const zs=[];for(let z=4;z<D-3;z+=Math.max(4,D/5))zs.push(z);tallWins(zs,4.2,1.0,2.4,0xa8b8c8);}
      npc={x:W/2,z:4.6,maxZ:6.5,paused:false};
    } else if(type==='guild_f'||type==='guild_m'){
      const F_=type==='guild_f';
      // S292 — the guild halls on the kit (#46 A): the steward's desk (the counter's front with a ledger, inkwell and quill),
      // the notice board of pinned notes; the Fighters' racks of the weapon kit, armour stands, the long table with benches and
      // a grindstone (it stood in a dormitory; now in the hall); the Mages' bookcases, potion shelves either side of the board,
      // the still, a reading table of open books, columns. One bake; the old solids where they were
      {const K=furnKit(),room=K.bake((F_?K.guildF:K.guildM)(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);
        const nb=K.bake(K.noticeBoard(2.6,1.4,FN,FSEED+7));nb.position.set(W/2,1.6,.02);nb.userData.furn=true;sc_.add(nb);furnSwap(nb);}
      solid(W/2,3.4,2.6,.45,1.05);
      if(F_){for(let k=0;k<3;k++)solid(2+k*1.6,5.2,.25,.25,1.8);{const z=D*.3;solid(W/2,z,3,.65,.76);[-1,1].forEach(sd=>solid(W/2,z+sd*1.05,2.9,.2,.44));}}
      else{light(W-2.4,1.3,2.4,0x60ff80,1.0,5);solid(W-2.4,2.4,.4,.4,1.0);solid(W/2,D*.3,2.5,.6,.76);
        for(let x=W/2-4;x<=W/2+4;x+=8)for(let z=6;z<D-3;z+=5)solid(x,z,.4,.4,H/F);}
      // ground floor rooms: the hall (north) holds desk/board/training; a
      // cross wall with a central doorway; south of it a corridor with two
      // dormitory rooms each side (2 beds each) and the front door at the end.
      const hallZ=D*.52;
      partition(0,hallZ,W,hallZ,0,ceil,.5);
      const corrW=3.2;const lx=W/2-corrW/2,rx=W/2+corrW/2;
      partition(lx,hallZ,lx,D-2.6,0,ceil,null);partition(rx,hallZ,rx,D-2.6,0,ceil,null);
      const midZ=(hallZ+D-2.6)/2;
      partition(0,midZ,lx,midZ,0,ceil,null);partition(rx,midZ,W,midZ,0,ceil,null);
      // doorways from the corridor into each of the four rooms
      [[hallZ,midZ],[midZ,D-2.6]].forEach(([za,zb],ri)=>{const zc=(za+zb)/2;
        // cut door: re-make the side walls as two segments with a gap at zc
        [lx,rx].forEach((wx,side)=>{for(let i=SOL.length-1;i>=0;i--){const q=SOL[i];if(Math.abs(q.x0-(wx-.11))<.02&&Math.abs(q.x1-(wx+.11))<.02){SOL.splice(i,1);}}});
      });
      // (walls were solid segments; rebuild side walls with doorways)
      sc_.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry'&&Math.abs(o.position.x-lx)<.05&&o.geometry.parameters.width===.22||o.isMesh&&o.geometry.type==='BoxGeometry'&&Math.abs(o.position.x-rx)<.05&&o.geometry.parameters.width===.22).forEach(o=>sc_.remove(o));
      [lx,rx].forEach(wx=>{partition(wx,hallZ,wx,midZ,0,ceil,.5);partition(wx,midZ,wx,D-2.6,0,ceil,.5);});
      // beds: two per room
      [[1.4,hallZ+1.2],[1.4,midZ+1.2],[W-1.4,hallZ+1.2],[W-1.4,midZ+1.2]].forEach(([bx,bz],k)=>{_intBed(sc_,bx,bz,'N');bedAt(bx,bz,0);const bz2=bz+2.2;_intBed(sc_,bx,bz2,'N');bedAt(bx,bz2,0);
        const cx_=bx<W/2?bx+2.2:bx-2.2;{const K=furnKit(),c=K.bake(K.chest(FN,FSEED+k));c.position.set(cx_,0,bz+1.0);c.userData.furn=true;sc_.add(c);furnSwap(c);}}); // S292 — a kit chest by each pair of beds
      intBedPos={x:1.4,z:hallZ+1.2};
      // move the desk/board into the hall's south side facing the cross-wall door
      
      // members
      const memberRoles=F_?['Blade','Warden','Recruit']:['Adept','Novice','Evoker'];
      const names=NAMES[reg]||NAMES.irish;
      for(let k=0;k<3;k++){const nm=pick(Math.random,Math.random()<.5?names.m:names.f);const def={name:nm,role:memberRoles[k]+' of the '+(F_?'Fighters':'Mages'),ico:F_?'⚔':'✨',greeting:F_?["Steward's at the desk.","New? Don't touch the racks.","Come to spar sometime."]:["Mind the cauldron.","Have you read the board?","The Archmage sees everyone eventually."],topics:[{label:'What is it like here?',response:F_?'Beds, bread, and the odd broken nose. Better than the road.':'Quiet, mostly. Until something on a shelf goes off.'},{label:'Any advice?',response:F_?'Take the small jobs first. Beasts don\'t care about your rank.':'Never carry a relic in your bare hands longer than you must.'},{label:'Farewell.',bye:true}]};
        const g=buildNPCMesh({role:F_?'guard':'scholar',name:nm,bCol:F_?0x5a2020:0x203a6a,sCol:0xd4a878},{nation:nationAt(house.doorX,house.doorZ),key:house.siteId||''});const x=4+k*(W-8)/2,z=D*.4+(k%2)*2;g.position.set(x,0,z);g.rotation.y=Math.random()*Math.PI*2;sc_.add(g);
        INT_NPCS.push({g,def,wa:0,wt:1,walk:false,box:{x0:2,x1:W-2,z0:5,z1:D-4}});}
      npc={x:W/2,z:2.2,maxZ:2.6,paused:false};
    } else if(type==='tower'){
      // a stone post, a helix of treads to a landing 30u up, a chest in the treasure room
      const TOP=30,turns=5,r0=1.1,r1=3.9;const cx_=W/2,cz_=D/2;
      // S294 — the helix, the post, the far rail and the treasure chest are one bake on the kit: 130 treads of dressed stone
      // (they were 130 boxes, 130 draw calls), the post in drums of coursed stone the whole height (the old cylinder was
      // F-scaled and stopped at 18.6 of the 30), the rail of posts and a top rail, the prototype's chest
      {const K=furnKit(),P=K.Parts(),rr=i=>((Math.sin(i*12.9898+7.1)*43758.5453)%1+1)%1,stoneC=i=>new THREE.Color(0x7a746a).offsetHSL(0,0,(rr(i)-.5)*.08);
        const steps=turns*26;for(let i=0;i<steps;i++){const t=i/steps;const a=t*Math.PI*2*turns;const y=t*TOP;const x=cx_+Math.cos(a)*(r0+r1)/2,z=cz_+Math.sin(a)*(r0+r1)/2;P(SK.rbox(r1-r0+.2,.14,.9,.03,1),stoneC(i),x,y+.05,z,0,-a,0);}
        for(let i=0;i<TOP/.5;i++)P(SK.cyl(.95,.95,.5,14),new THREE.Color(0x6a665e).offsetHSL(0,0,(rr(i+500)-.5)*.1),cx_,.25+i*.5,cz_,0,rr(i+900)*6,0);
        for(let k=0;k<6;k++)P(SK.rbox(.06,1.8,.06,.015,1),0x3a2e22,cx_-1.5+k*.6,TOP+.9,cz_-3.2);P(SK.rbox(3.4,.06,.06,.015,1),0x3a2e22,cx_,TOP+1.8,cz_-3.2);
        P.put(K.chest(FN,FSEED),cx_+2.2,cz_-2.2,0,TOP);
        const room=K.bake(P);room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(cx_,cz_,1.0,1.0,TOP/F);
      FOOTHOLDS.push({kind:'spiral',cx:cx_,cz:cz_,r0,r1,y0:0,y1:TOP,turns});
      // landing and treasure room floor
      // the top floor, with the well left open where the helix arrives (so you can go back down), and a hatch to the roof
      const ex=cx_+(r0+r1)/2,ez=cz_; // the helix ends at angle 0: due +x
      boxRaw(cx_-(W-(ex-1.4))/2- (ex-1.4)/2+ (ex-1.4)/2, TOP-.08, cz_, ex-1.4, .16, D, 0x6a665e); // left of the well
      boxRaw((ex-1.4+W)/2, TOP-.08, (ez-1.6)/2, W-(ex-1.4), .16, ez-1.6, 0x6a665e); // right, before the well
      boxRaw((ex-1.4+W)/2, TOP-.08, (ez+1.6+D)/2, W-(ex-1.4), .16, D-(ez+1.6), 0x6a665e); // right, after the well
      FOOTHOLDS.push({x0:0,x1:W,z0:0,z1:D,y:TOP,hole:{x0:ex-1.4,x1:W,z0:ez-1.6,z1:ez+1.6}});
      HATCH.x=cx_;HATCH.z=cz_-2.2;HATCH.y=TOP;HATCH.active=true;HATCH.roof=true; // the roof hatch
      glow(cx_+2.2,(TOP+.9)/F,cz_-2.2,0xffd080); // S294 — glow() scales y by F: the old chest and its glow sat at 18.8, in the shaft
      INT_LOOT={x:cx_+2.2,z:cz_-2.2,y:TOP,id:house.id};
      for(let k=0;k<4;k++){const a=k/4*Math.PI*2;const wx=cx_+Math.cos(a)*(W/2-.4),wz=cz_+Math.sin(a)*(D/2-.4);glow(wx,(TOP+1.6)/F,wz,0xa0c0ff);}
      npc={x:-99,z:-99,maxZ:1,paused:true};
    } else if(type==='chapel'){
      partition(0,D*.55,W*.38,D*.55,0,ceil-.3,null);partition(W*.62,D*.55,W,D*.55,0,ceil-.3,null);
      // S293 — the chapel on the kit: the fallen stones in the gap as they lay, a stone dais with a moulded pillar and its cap,
      // six candles round it, pews either side, a ladder to the hatch; one bake
      {const K=furnKit(),room=K.bake(K.chapel(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      HATCH.x=W/2;HATCH.z=D-1.3;HATCH.y=0;HATCH.active=true;
      npc={x:-99,z:-99,maxZ:1,paused:true};
    } else if(type==='cellar'){
      // S293 — the cellar on the kit: the barrels and crates (the stacked crate now on the others), a wine rack, a chest, a ladder
      for(let k=0;k<4;k++){_intBarrel(sc_,1.2+k*1.1,1.2);}for(let k=0;k<3;k++){_intCrate(sc_,W-1.2-k*.9,.25,1.3,.5);}_intCrate(sc_,W-1.65,.5+.225,1.3,.45);
      {const K=furnKit(),room=K.bake(K.cellar(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      HATCH.x=W/2;HATCH.z=1.2;HATCH.y=0;HATCH.active=true;
      npc={x:-99,z:-99,maxZ:1,paused:true};
    } else if(type==='cabin'){
      // the captain's cabin: bunk, chart table, lantern, the hold (stash chest)
      _intBed(sc_,1.3,1.6,'N');bedAt(1.3,1.6,0);intBedPos={x:1.3,z:1.6};
      // S293 — the cabin on the kit: the chart table (a chart, a log, dividers and a candle), sacks, the shelves of bottles
      {const K=furnKit(),room=K.bake(K.cabin(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}solid(W/2+.6,D*.45,.9,.55,.76);
      if(typeof _intStashChest==='function'){_intStashChest(sc_,W-1.2,1.2);intStashPos={x:W-1.2,z:1.2};}
      const port=new THREE.Mesh(new THREE.CircleGeometry(.32,12),new THREE.MeshBasicMaterial({color:0x7ac8ff}));port.position.set(W-.04,1.3,D*.6);port.rotation.y=-Math.PI/2;sc_.add(port);
      npc={x:-99,z:-99,maxZ:1,paused:true};
    } else { // home
      bedAt(1.2,1.4,0);if(!gallery)intBedPos={x:1.2,z:1.4};else intBedPos={x:W-1.2,z:1.2};
      // S286 — the home's furniture on the kit (#46 A): a box bed, the stone hearth, a table and two chairs with a candle, the
      // chest, two dressed shelves and a rag rug, by the nation's wood, baked to one mesh (and the flames); the old boxes' places
      {const K=furnKit(),seed=String(house.id||'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7)%100000;
        const room=K.bake(K.home(W,D,H,nationAt(house.doorX,house.doorZ),seed));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      const hx=W-.4;light(hx-.8,.7,D*.4,0xff6a20,1.2,6);solid(W-.35,D*.4,.35,.95,1.3);
      solid(W/2,D*.5,.75,.45,.76);
      const role=(house.dlg&&house.dlg.role)||'';
      if(/weaver/i.test(house.roleTag||''))box(W-2.2,.9,D-2.2,1.6,1.7,.4,0x5a3a1c);
      if(/fisher/i.test(house.roleTag||'')){const net=new THREE.Mesh(new THREE.ConeGeometry(.7,1.4,6,1,true),new THREE.MeshLambertMaterial({color:0x8a8060,side:THREE.DoubleSide,wireframe:true}));net.position.set(W-2,H-.9,D-2.2);sc_.add(net);}
      if(/farmer/i.test(house.roleTag||''))for(let k=0;k<3;k++)cyl(W-1.6-k*.7,.35,D-1.4,.32,.38,.7,0xb8a070,7);
      if(/cooper/i.test(house.roleTag||'')){_intBarrel(sc_,W-1.4,D-1.6);_intBarrel(sc_,W-2.3,D-1.4);}
      npc={x:W/2+1.6,z:D*.5+.9,maxZ:Math.min(D*.6,5),paused:false};
    }
    // v80 S131 — interior variety: the shopkeeper's room behind a partition; private rooms at the inn; the coaching inn's board and tack
    try{
      const SHOPS=['weapon','armor','potion','misc','shipwright','goods','forge','apothecary','armoury'];
      const partition=(z0,x0,x1,doorX,y0,y1)=>{const hh=y1-y0;for(const [a,b] of [[x0,doorX-.6],[doorX+.6,x1]]){if(b-a<.2)continue;boxRaw((a+b)/2,y0+hh/2,z0,b-a,hh,.18,0x5a4630);SOL.push({x0:a,x1:b,z0:z0-.09,z1:z0+.09,y0,y1});}
        boxRaw(doorX,y1-.12,z0,1.3,.24,.22,0x3a2a18);
        intDoorAt(sc_,SOL,doorX,z0,y0,Math.PI/2,0x3a2a18);}; // v80 S143 — the back room gets a door
      const sideWall=(x0,z0,z1,y0,y1)=>{boxRaw(x0,(y0+y1)/2,(z0+z1)/2,.18,y1-y0,z1-z0,0x5a4630);SOL.push({x0:x0-.09,x1:x0+.09,z0,z1,y0,y1});};
      if(SHOPS.includes(type)&&!gallery&&D>=9){
        const z0=D-3.2,doorX=W*.3;partition(z0,0,W,doorX,0,ceil);
        _intBed(sc_,W-1.3,D-1.4,'S');bedAt(W-1.3,D-1.4,0);solid(W-1.3,D-1.4,.55,1.05,.5);
        _intCrate(sc_,1.0,.25,D-.9,.5);_intCrate(sc_,1.6,.25,D-.9,.42);box(W*.6,.68,D-1.4,1.2,.06,.7,0x7a4818);box(W*.6,.34,D-1.4,.08,.62,.08,0x5a3010);solid(W*.6,D-1.4,.6,.35,.7);
        box(W*.6,.02,D-1.8,2.4,.03,2.0,[0x6a2a2a,0x2a3a5a,0x5a4a2a][(W|0)%3]);light(W*.6,1.4,D-1.6,0xffb070,.7,5);
        house._backRoom=true;
      }
      if(type==='inn'){
        if(!gallery){const z0=D-3.0,mid=W/2;sideWall(mid,z0,D,0,ceil);
        [[0,W*.25-.6],[W*.25+.6,W*.75-.6],[W*.75+.6,W]].forEach(([a,b])=>{boxRaw((a+b)/2,ceil/2,z0,b-a,ceil,.18,0x5a4630);SOL.push({x0:a,x1:b,z0:z0-.09,z1:z0+.09,y0:0,y1:ceil});});[W*.25,W*.75].forEach(dx=>boxRaw(dx,ceil-.12,z0,1.3,.24,.22,0x3a2a18));
        _intBed(sc_,1.3,D-1.4,'S');bedAt(1.3,D-1.4,0);solid(1.3,D-1.4,.55,1.05,.5);_intBed(sc_,W-1.3,D-1.4,'S');bedAt(W-1.3,D-1.4,0);solid(W-1.3,D-1.4,.55,1.05,.5);
        _intCrate(sc_,mid-1.0,.25,D-.8,.42);_intCrate(sc_,mid+1.0,.25,D-.8,.42);light(mid-2.5,1.3,D-1.6,0xffb070,.6,4);light(mid+2.5,1.3,D-1.6,0xffb070,.6,4);
        house._rooms=2;}
        // a coaching inn: a board by the door and a stable corner if a coach line ends here
        let coachHere=!!house.coachInn;try{const sid=String(house.id||'').replace(/^g_/,'').replace(/_\d+$/,'');const Cs=coaches();for(const k in Cs){if(Cs[k].a===sid||Cs[k].b===sid)coachHere=true;}}catch(e){}
        if(coachHere){ // S296 — the coaching board, the tack and the bales on the kit: one bake
          const K=furnKit(),P=K.Parts();P.put(K.noticeBoard(1.4,.9,FN,FSEED+11),1.2,.14,0,1.35);
          for(let i=0;i<3;i++){const z=2.0+i*.6;P(SK.cyl(.02,.02,.4,6),0x3a2a18,W-.2,1.7,z,0,0,Math.PI/2);P(SK.torus(.12,.025,6,16),[0x5a3a20,0x3a2a1a,0x6a4a2a][i],W-.36,1.56,z,0,Math.PI/2,0);P(SK.rbox(.05,.3,.18,.01,1),0x4a3018,W-.38,1.48,z+.1);}
          for(const [x,y,z,w,h,d] of [[W-1.0,0,D*.5+1.9,1.2,.31,1.0],[W-1.3,.31,D*.5+2.0,.6,.19,.5]]){P(SK.bumpy(SK.rbox(w,h,d,.06,2),.02,31,2),0xc8a850,x,y+h/2,z);for(const t of [-.25,.25])P(SK.rbox(w+.01,.012,.012,.004,1),0x7a5a2a,x,y+h*.5,z+t*d,0,0,0,1,1,1);}
          const room=K.bake(P);room.userData.furn=true;sc_.add(room);furnSwap(room);
          if(house.coachInn)coachInnFolk(house,sc_,W,D); // S238 — the driver and the travellers waiting in the common room
          house._coaching=true;}
      }
    }catch(e){console.warn('interior variety',e);}
    if(hasCellar(house)){const hx=Math.min(W-1.6,3.2),hz=D-2.6;boxRaw(hx,.06,hz,1.1,.08,1.1,0x3a2612);const ring=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,5,10),new THREE.MeshLambertMaterial({color:0x2a2622}));ring.position.set(hx+.3,.12,hz);ring.rotation.x=Math.PI/2;sc_.add(ring);house._hatch={x:hx,z:hz};HATCH.x=hx;HATCH.z=hz;HATCH.y=0;HATCH.active=true;}
    // v80 S155 — a shop's strongbox in the back room (or behind the counter), a home's small chest: locked, and worth something
    if(BOX_KINDS.includes(type)||type==='home'){const home=type==='home';const bx=home?1.0:(house._backRoom?W-.9:W-1.0),bz=home?D-1.0:(house._backRoom?D-2.6:D*.55);
      const bg=new THREE.Group();const shell=buildChestShell(bg,home?.45:.6,home?0x6a4a2c:0x4a3018);bg.position.set(bx,0,bz);bg.rotation.y=home?Math.PI*.5:Math.PI;sc_.add(bg);solid(bx,bz,.32,.28,.5);
      INT_BOX={x:bx,z:bz,lid:shell.lid,g:bg,id:house.id,kind:home?'home':'shop',type,house,open:false};}
    // S342 (#62 A) — the frame, built last so a post gives way to whatever stands against the wall. Plastered rooms: posts at the
    // corners and under each beam's ends (a short bracket where a window is within 1.2), knee braces, a sole plate and a wall
    // plate; Aurenne's close studding a post every 1.6. Stone and rubble rooms: a plinth course and three stepped corbels under
    // each beam's end. Everywhere: rounded beams .22 deep, joists every .5, and the entrance a plank door in a timber or stone frame.
    if(kitShell){const beams=[];for(let i=1;i<=(tower?0:nb);i++)beams.push(D*i/(nb+1));const wins=[];for(let z=D*.3;z<D*.9;z+=Math.max(3,D*.3))wins.push(z);
      shellFrame(sc_,{W,D,H,type,st,wallKind,FN,FSEED,beams,wins,TALLZ,SOL,FOOTHOLDS});}
    // keeper / resident — only if the schedule says they're indoors right now
    // (the same person you see in the street is the one behind the counter).
    if(npcInsideNow(house)){
    const roleName=type==='church'?'Priest':type==='home'?'Resident':type==='inn'?'Innkeeper':type==='castle'?'Steward':type==='guild_f'?'guard':type==='guild_m'?'scholar':'Merchant';
    const g=buildNPCMesh({role:roleName,name:house.keeper,_twin:house._twin,bCol:house.bCol||0x5a4030,sCol:house.sCol||0xd4a878},{nation:nationAt(house.doorX,house.doorZ),key:house.siteId||''});
    g.rotation.y=type==='church'?0:Math.PI;g.position.set(npc.x,0,npc.z);sc_.add(g);intNPCMesh=g;intNPCPos={x:npc.x,z:npc.z};
    intNPCMesh.userData.amble={wa:Math.random()*Math.PI*2,wt:1+Math.random()*3,minZ:.6,maxZ:npc.maxZ,minX:.8,maxX:W-.8,speed:.25,paused:npc.paused};
    } else {intNPCMesh=null;intNPCPos={x:-99,z:-99};}
    return sc_;
  }

  // ═══ LOCAL MAP (Session 12) ══════════════════════════════════════════
  // North-up map of what's around the player: terrain shade, water, roads,
  // paths, the buildings/walls of any streamed settlement, doors, camps,
  // NPCs and enemies. Drawn at 4 Hz into an offscreen canvas for the HUD
  // minimap and drawn directly, larger, for the hub's Local view.
  const LM={cv:null,t:0};const _snowMapC=new THREE.Color(0xe6ecf0);
  // v80 S138 — buildings by what they are, on the Local view, the minimap and the Key. Michael's scheme:
  // grey-white homes, red Fighters, blue Mages, gold keep and lord, purple church; the rest assigned here.
  const BLD={
    home:{col:'#cdc9c0',line:'#55514a',label:'Home'},
    castle:{col:'#e8b820',line:'#6a5008',label:'Keep \u00b7 the lord',glyph:'\ud83c\udff0'},
    guild_f:{col:'#c8402e',line:'#5a1a12',label:'Fighters\u2019 Guild',glyph:'\u2694'},
    guild_m:{col:'#3f73d6',line:'#16305e',label:'Mages\u2019 Guild',glyph:'\u2727'},
    church:{col:'#9656c8',line:'#3e1e5a',label:'Church',glyph:'\ud83d\udd6f'},
    inn:{col:'#e07a2a',line:'#6a3208',label:'Inn',glyph:'\ud83c\udf7a'},
    weapon:{col:'#5a5a64',line:'#1c1c22',label:'Smith \u00b7 armourer',glyph:'\u2692'},
    potion:{col:'#56b04c',line:'#1e4a18',label:'Apothecary',glyph:'\ud83c\udf3f'},
    misc:{col:'#b88a50',line:'#4a3418',label:'Goods',glyph:'\ud83d\udce6'},
    shipwright:{col:'#2fa39a',line:'#0e4440',label:'Shipwright',glyph:'\u26f5'},
    barracks:{col:'#8a4a40',line:'#3a1a14',label:'Barracks'},
    other:{col:'#d8c8a0',line:'#6a5a3a',label:'Other'},
    wall:{col:'#8a857a',line:'#5a5650',label:'Wall'},
  };
  BLD.armor=BLD.weapon;BLD.safehouse=BLD.home;
  function bldOf(t){return BLD[t]||BLD.other;}
  function drawLocalMap(ctx,size,radius,detail){
    const s=size/(radius*2),cx=size/2,cz=size/2;
    const toS=(x,z)=>[cx+(x-px)*s,cz+(z-pz)*s];
    ctx.save();ctx.fillStyle='#1c1a14';ctx.fillRect(0,0,size,size);
    // terrain: coarse cells
    const cell=Math.max(4,radius/14);
    for(let z=pz-radius;z<pz+radius;z+=cell)for(let x=px-radius;x<px+radius;x+=cell){
      const h=worldH(x+cell/2,z+cell/2);const dom=dominantRegion(x,z).r;
      let col;if(h<0)col='#3a5a78';else{const b=BIOME_PROFILES[dom.biome]||BIOME_PROFILES.plains;const c=new THREE.Color(b.groundBase);const k=.75+Math.min(.6,Math.max(0,h)/40)*.5;
        if(WX.cover>.02)c.lerp(_snowMapC,Math.min(.9,WX.cover*.85)); // v80 S146 — snow lying, on the local map too
        col=`rgb(${(c.r*255*k)|0},${(c.g*255*k)|0},${(c.b*255*k)|0})`;}
      const [sx,sz]=toS(x,z);ctx.fillStyle=col;ctx.fillRect(sx,sz,cell*s+1,cell*s+1);
    }
    // roads
    ctx.strokeStyle='#b8a070';ctx.lineWidth=Math.max(1.5,3*s);ctx.lineCap='round';
    for(const rd of ROADS){const pts=rd.pts;let on=false;ctx.beginPath();for(let i=0;i<pts.length;i++){const p=pts[i];if(Math.abs(p.x-px)>radius+10||Math.abs(p.z-pz)>radius+10){on=false;continue;}const [sx,sz]=toS(p.x,p.z);if(!on){ctx.moveTo(sx,sz);on=true;}else ctx.lineTo(sx,sz);}ctx.stroke();}
    // settlements: buildings, walls, doors
    for(const S of SETTLE.values()){
      if(Math.abs(S.site.x-px)>radius+S.site.pad||Math.abs(S.site.z-pz)>radius+S.site.pad)continue;
      for(const r of S.sol){
        if(r.c===undefined)continue;
        const [sx,sz]=toS(r.cx,r.cz);
        ctx.save();ctx.translate(sx,sz);ctx.rotate(-Math.atan2(r.s,r.c));
        const wall=r.bt==='wall'||(!r.bt&&r.rx>5&&r.rz<1.2);const B=wall?BLD.wall:bldOf(r.bt);
        const own=r.hid&&ownedHouse(r.hid); // v80 S138 — coloured by type; your own house outlined in light gold
        ctx.fillStyle=r.sh?'#85827b':B.col;ctx.strokeStyle=own?'#f6e27a':B.line;ctx.lineWidth=own?2:1;
        ctx.fillRect(-r.rx*s,-r.rz*s,r.rx*2*s,r.rz*2*s);ctx.strokeRect(-r.rx*s,-r.rz*s,r.rx*2*s,r.rz*2*s);ctx.restore();
      }
      if(detail){for(const h of S.houses){const [sx,sz]=toS(h.doorX,h.doorZ);ctx.fillStyle='#1a1610';ctx.strokeStyle=h.type==='home'?'#8a857a':'#f0e4c0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx,sz,Math.max(1.5,1.2*s),0,Math.PI*2);ctx.fill();ctx.stroke();}} // v80 S138 — the door: a dark notch on the coloured footprint
    }
    // doors, camps
    for(const r of STATIC_SOL){if(Math.abs(r.cx-px)>radius||Math.abs(r.cz-pz)>radius)continue;if(r.c!==undefined||Math.max(r.rx,r.rz)<3)continue;const [sx,sz]=toS(r.cx,r.cz);ctx.fillStyle='#a89a80';ctx.strokeStyle='#5a5650';ctx.lineWidth=1;ctx.fillRect(sx-r.rx*s,sz-r.rz*s,r.rx*2*s,r.rz*2*s);ctx.strokeRect(sx-r.rx*s,sz-r.rz*s,r.rx*2*s,r.rz*2*s);} // v80 S132 — keeps and other large statics
    for(const e of DOORS){const p=dungeonWorldPos[e.seed];if(Math.abs(p.x-px)>radius||Math.abs(p.z-pz)>radius)continue;const [sx,sz]=toS(p.x,p.z);ctx.fillStyle=e.kind==='fort_door'?'#c8a060':'#302820';ctx.strokeStyle='#e8d8a0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx,sz,Math.max(2.5,2.5*s),0,Math.PI*2);ctx.fill();ctx.stroke();}
    for(const b of beds){if(Math.abs(b.x-px)>radius||Math.abs(b.z-pz)>radius)continue;const [sx,sz]=toS(b.x,b.z);ctx.fillStyle='#ffb060';ctx.fillRect(sx-2,sz-2,4,4);}
    if(SHIP.mesh&&Math.abs(SHIP.x-px)<radius&&Math.abs(SHIP.z-pz)<radius){const [sx,sz]=toS(SHIP.x,SHIP.z);ctx.save();ctx.translate(sx,sz);ctx.rotate(-SHIP.yaw);ctx.fillStyle='#e8d8a0';ctx.strokeStyle='#2a1c10';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(3,4);ctx.lineTo(-3,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
    for(const o of OTHER){if(Math.abs(o.x-px)<radius&&Math.abs(o.z-pz)<radius){const [sx,sz]=toS(o.x,o.z);ctx.fillStyle=o.kind==='pirate'?'#ff4040':'#c8c8c8';ctx.beginPath();ctx.arc(sx,sz,3,0,Math.PI*2);ctx.fill();}}
    // people
    for(const n of npcs){if(!n.g.visible)continue;const [sx,sz]=toS(n.g.position.x,n.g.position.z);if(sx<0||sz<0||sx>size||sz>size)continue;if(n.def&&n.def._lord){ctx.fillStyle=BLD.castle.col;ctx.strokeStyle='#2a1c10';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(sx,sz,Math.max(3,2.2*s),0,Math.PI*2);ctx.fill();ctx.stroke();continue;} ctx.fillStyle=n.sched&&(n.sched.type==='guard'||n.sched.type==='watch'||n.sched.type==='constable')?'#80b0ff':'#ffffff';ctx.beginPath();ctx.arc(sx,sz,Math.max(1.5,1.2*s),0,Math.PI*2);ctx.fill();} // v80 S138 — the lord in gold
    // v80 S138 — the place someone gave you directions to
    if(WAY){const [sx,sz]=toS(WAY.x,WAY.z);const ins=sx>=0&&sz>=0&&sx<=size&&sz<=size;ctx.save();ctx.strokeStyle='#f6d860';ctx.lineWidth=2;
      if(ins){const pr=5+1.5*Math.sin(performance.now()/260);ctx.beginPath();ctx.arc(sx,sz,pr+3,0,Math.PI*2);ctx.stroke();}
      else{const a=Math.atan2(sz-cz,sx-cx),ex=cx+Math.cos(a)*(size/2-9),ez=cz+Math.sin(a)*(size/2-9);ctx.fillStyle='#f6d860';ctx.translate(ex,ez);ctx.rotate(a);ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-4,4);ctx.lineTo(-4,-4);ctx.closePath();ctx.fill();}
      ctx.restore();}
    for(const e of ZONES.world.enemies){if(e.dead||!e.mesh||!e.mesh.visible)continue;const [sx,sz]=toS(e.x,e.z);if(sx<0||sz<0||sx>size||sz>size)continue;ctx.fillStyle='#ff4040';ctx.beginPath();ctx.arc(sx,sz,Math.max(1.8,1.4*s),0,Math.PI*2);ctx.fill();}
    // player arrow
    ctx.save();ctx.translate(cx,cz);ctx.rotate(-yaw);ctx.fillStyle='#ffe060';ctx.strokeStyle='#2a1c10';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,6);ctx.lineTo(0,3);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    ctx.fillStyle='rgba(240,228,200,.8)';ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.fillText('N',cx,10);
    ctx.restore();
  }
  function drawMinimap(mm,size){
    if(!LM.cv){LM.cv=document.createElement('canvas');LM.cv.width=size;LM.cv.height=size;}
    const now=performance.now();
    if(now-LM.t>250){LM.t=now;drawLocalMap(LM.cv.getContext('2d'),size,58,false);}
    mm.drawImage(LM.cv,0,0);
  }

  // ═══ GUILDS (Session 12) ═════════════════════════════════════════════
  // Fighters' and Mages' guild halls in every town and city: a big two-
  // storey hall with a steward at the desk, members who wander, a dormitory
  // of beds, and paid tasks generated from the live world (doors, herbs,
  // residents, towns). Progress hooks: onKill, onHarvest, onPickup, onTalk,
  // onEnterInterior. State lives in worldState.guild so it saves.
  const GUILD_DEF={
    guild_f:{name:"Fighters' Guild",role:'Guildmaster',ranks:['Recruit','Blade','Warden','Champion','Master'],sign:'guild_f',col:0x7a2020},
    guild_m:{name:"Mages' Guild",role:'Archmage',ranks:['Novice','Adept','Evoker','Warlock','Archmage'],sign:'guild_m',col:0x203a6a},
  };
  function gstate(){if(!worldState.guild)worldState.guild={guild_f:{done:0,active:null},guild_m:{done:0,active:null}};return worldState.guild;}
  function rankOf(g){const st=gstate()[g];return GUILD_DEF[g].ranks[Math.min(4,Math.floor(st.done/3))];}
  function dirWord(fx,fz,tx,tz){return compassWord(tx-fx,tz-fz);}
  function nearSites(site,maxD){return SITES.filter(t=>t.id!==site.id&&t.pad>0&&Math.hypot(t.x-site.x,t.z-site.z)<maxD).sort((a,b)=>Math.hypot(a.x-site.x,a.z-site.z)-Math.hypot(b.x-site.x,b.z-site.z));}
  function nearDoors(site,maxD,fortsOnly){return DOORS.filter(e=>(!fortsOnly||e.kind==='fort_door')&&Math.hypot(dungeonWorldPos[e.seed].x-site.x,dungeonWorldPos[e.seed].z-site.z)<maxD).sort((a,b)=>Math.hypot(dungeonWorldPos[a.seed].x-site.x,dungeonWorldPos[a.seed].z-site.z)-Math.hypot(dungeonWorldPos[b.seed].x-site.x,dungeonWorldPos[b.seed].z-site.z));}
  const HUNT=['Wolf','Goblin','Spider','Bandit','Skeleton'];
  // v80 S133 — the nearest region whose encounter table carries the creature: a name and a point for the compass
  function huntGround(site,creature){let best=null,bd=1e9;for(const c of CELLS.values()){if(c.type==='sea'||!c.regions)continue;for(const rg of c.regions){const tbl=ENC[rg.id]||ENC_BIOME[rg.biome];if(!tbl||!tbl.some(g=>g.name===creature))continue;const d=Math.hypot(rg.x-site.x,rg.z-site.z);if(d<bd){bd=d;best={x:rg.x,z:rg.z,name:rg.name||rg.id};}}}return best;}
  function genTask(g,site){
    const st=gstate()[g];const r=Math.random;const tier=Math.floor(st.done/3);
    const gold=60+tier*50+Math.floor(r()*40);
    const doors=nearDoors(site,900,false),sites=nearSites(site,700);
    const pickDoor=()=>doors[Math.floor(r()*Math.min(doors.length,6))];
    if(g==='guild_f'){
      const kind=['clear','hunt','beast','raid'][Math.floor(r()*4)];
      if(kind==='clear'&&doors.length){const e=pickDoor();const p=dungeonWorldPos[e.seed];const name=e.canonicalName||(typeof dungeonName==='function'?dungeonName(e.seed,e.theme):'an old gate');return {id:'f'+Date.now(),g,kind,portal:'dyn_'+e.seed,need:5+tier*2,have:0,gold,desc:`${name} — ${dirWord(site.x,site.z,p.x,p.z)} of here. Clear it: put down ${5+tier*2} of whatever's inside.`,short:`Clear ${name}`};}
      if(kind==='hunt'){const t=HUNT[Math.floor(r()*HUNT.length)];const n=4+tier*2;const where=huntGround(site,t);return {id:'f'+Date.now(),g,kind,target:t,need:n,have:0,gold,x:where?where.x:null,z:where?where.z:null,ground:where?where.name:null,desc:`${t}s have been at the roads. Kill ${n} of them in the open country${where?` — ${where.name}, ${compassWord(where.x-site.x,where.z-site.z)} of here, is their ground`:''} — and come back.`,short:`Hunt ${n} ${t}s${where?` (${where.name})`:''}`};}
      if(kind==='beast'&&sites.length){const t=sites[Math.floor(r()*Math.min(3,sites.length))];const beast=['Cave Bear','Ogre','Forest Troll'][Math.min(2,tier)];const ang=r()*Math.PI*2;const sx=t.x+Math.cos(ang)*(t.pad+70),sz=t.z+Math.sin(ang)*(t.pad+70);return {id:'f'+Date.now(),g,kind,siteId:t.id,beast,sx,sz,spawned:false,done:false,gold:gold+40,desc:`A ${beast.toLowerCase()} is taking sheep at ${t.name}, ${dirWord(site.x,site.z,t.x,t.z)} of here. It was last seen ${compassWord(sx-t.x,sz-t.z)} of the village. Kill it.`,short:`The beast at ${t.name}`};}
      if(sites.length){const t=sites.filter(s=>s.kind==='village')[0]||sites[0];return {id:'f'+Date.now(),g,kind:'raid',siteId:t.id,count:6+tier*2,spawned:false,have:0,gold:gold+80,desc:`${t.name} sent a rider: bandits are coming, ${dirWord(site.x,site.z,t.x,t.z)} of here. Get there and hold the town until they're all down.`,short:`Defend ${t.name}`};}
    } else {
      const kind=['relic','gather','deliver','hearth','wizard','creature'][Math.floor(r()*6)];
      if(kind==='relic'&&doors.length){const e=nearDoors(site,900,true)[0]||pickDoor();const p=dungeonWorldPos[e.seed];const name=e.canonicalName||'an old gate';return {id:'m'+Date.now(),g,kind,x:p.x+8,z:p.z+6,got:false,gold:gold+30,desc:`An old binding-stone lies outside ${name}, ${dirWord(site.x,site.z,p.x,p.z)} of here, by the door. Bring it back unbroken.`,short:`Relic at ${name}`};}
      if(kind==='gather'){const pool=herbPool();const keys=Object.keys(HERB_DEF||{});const t=keys.length?keys[Math.floor(r()*keys.length)]:null;if(t){return {id:'m'+Date.now(),g,kind,herb:t,need:3+tier,have:0,gold,desc:`We're short of ${HERB_DEF[t].name}. Harvest ${3+tier} in the wild and bring them.`,short:`Gather ${HERB_DEF[t].name}`};}}
      if(kind==='deliver'&&sites.length){const t=sites[Math.floor(r()*Math.min(3,sites.length))];return {id:'m'+Date.now(),g,kind,siteId:t.id,who:null,gold,desc:`Someone in ${t.name}, ${dirWord(site.x,site.z,t.x,t.z)} of here, is sick. Take this draught to whoever answers to the name we'll give you at the gate — ask the first resident you meet.`,short:`Draught to ${t.name}`};}
      if(kind==='hearth'&&sites.length){const t=sites[Math.floor(r()*Math.min(3,sites.length))];return {id:'m'+Date.now(),g,kind,siteId:t.id,house:null,gold:gold-20,desc:`A house in ${t.name}, ${dirWord(site.x,site.z,t.x,t.z)} of here, has a hearth that won't take. Go in and light it — any flame you can cast will do.`,short:`Light a hearth in ${t.name}`};}
      if(kind==='wizard'&&doors.length){const e=pickDoor();const p=dungeonWorldPos[e.seed];const ang=r()*Math.PI*2;return {id:'m'+Date.now(),g,kind,sx:p.x+Math.cos(ang)*30,sz:p.z+Math.sin(ang)*30,spawned:false,done:false,gold:gold+60,desc:`A rogue of ours has set up by ${e.canonicalName||'an old gate'}, ${dirWord(site.x,site.z,p.x,p.z)} of here. End him.`,short:`The rogue mage`};}
      const lk=LAKES[0];return {id:'m'+Date.now(),g,kind:'creature',sx:lk.x+lk.r+30,sz:lk.z+20,spawned:false,done:false,gold:gold+50,desc:`Something is walking the shore of ${lk.name}, ${dirWord(site.x,site.z,lk.x,lk.z)} of here, that shouldn't be. Unmake it.`,short:`The thing at ${lk.name}`};
    }
    return {id:'x'+Date.now(),g,kind:'hunt',target:'Wolf',need:4,have:0,gold,desc:'Wolves. Four of them.',short:'Hunt 4 Wolves'};
  }
  function taskDone(t){
    switch(t.kind){case 'clear':case 'hunt':case 'gather':return t.have>=t.need;case 'raid':return t.spawned&&t.have>=t.count;case 'beast':case 'wizard':case 'creature':return !!t.done;case 'relic':return !!t.got;case 'deliver':return !!t.done;case 'hearth':return !!t.done;}return false;
  }
  function progressLine(t){
    switch(t.kind){case 'clear':case 'hunt':case 'gather':return `${t.have}/${t.need}`;case 'raid':return t.spawned?`${t.have}/${t.count} down`:'not yet there';default:return taskDone(t)?'done':'not yet';}
  }
  // ── hooks ──
  function onKill(e,ctx){
    (worldState.stats||(worldState.stats={})).kills=((worldState.stats||{}).kills||0)+1;
    qOnKill(e,ctx);
    const G=gstate();
    for(const g in G){const t=G[g].active;if(!t)continue;
      if(t.kind==='clear'&&ctx==='dungeon'&&typeof currentPortal!=='undefined'&&currentPortal&&currentPortal.id===t.portal)t.have++;
      if(t.kind==='hunt'&&ctx==='zone'&&e.name===t.target)t.have++;
      if((t.kind==='beast'||t.kind==='wizard'||t.kind==='creature')&&e._guildTag===t.id)t.done=true;
      if(t.kind==='raid'&&e._guildTag===t.id){t.have++;if(t.have>=t.count){const S=SETTLE.get(t.siteId);if(S)S.raid=false;showMsg('The raiders are down. The town is safe.','#e8d8a0');}}
      if(taskDone(t)&&!t._told){t._told=true;showMsg(`${GUILD_DEF[g].name}: task complete — report back.`,'#e8d8a0');}
    }
  }
  function onHarvest(h){const G=gstate();for(const g in G){const t=G[g].active;if(t&&t.kind==='gather'&&h.type===t.herb){t.have++;if(taskDone(t)&&!t._told){t._told=true;showMsg("Mages' Guild: that's enough — report back.",'#e8d8a0');}}}}
  function onTalk(def){if(def&&def.name==='Varek'){varekTalked();return false;}if(qOnTalk(def))return true;const G=gstate();const t=G.guild_m.active;if(!t||t.kind!=='deliver'||t.done)return false;
    const S=SETTLE.get(t.siteId);if(!S||!S.houses.some(h=>h.keeper===def.name))return false;
    if(!t.who){t.who=def.name;showMsg(`${def.name} takes the draught. "Bless you." Report back.`,'#e8d8a0');t.done=true;return true;}return false;}
  function onEnterInterior(house){const G=gstate();const t=G.guild_m.active;if(!t||t.kind!=='hearth'||t.done)return;if(house.type!=='home')return;const S=SETTLE.get(t.siteId);if(!S||!S.houses.includes(house))return;t.house=house.id;showMsg('This is the cold hearth. Stand by it and cast a flame (F).','#c8b880');}
  function onCast(){const G=gstate();const t=G.guild_m.active;if(!t||t.kind!=='hearth'||t.done||!t.house)return;if(typeof currentHouse==='undefined'||!currentHouse||currentHouse.id!==t.house)return;
    const W=currentHouse._roomW||10,D=currentHouse._roomD||10;if(Math.hypot(px-(W-.4),pz-D*.4)<2.6){t.done=true;showMsg('The hearth catches. Report back.','#e8d8a0');}}
  // world pickups (relics)
  const pickups=[];
  function ensureTaskWorldObjects(){
    const G=gstate();
    for(const g in G){const t=G[g].active;if(!t)continue;
      if(t.kind==='relic'&&!t.got&&!t._obj){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.28,0),new THREE.MeshBasicMaterial({color:0x9ad0ff}));m.position.set(t.x,worldH(t.x,t.z)+.5,t.z);sc.add(m);const l=regLight(0x80c0ff,1.2,6,'task');l.position.copy(m.position);t._obj={m,l};pickups.push({x:t.x,z:t.z,task:t});}
      if((t.kind==='beast'||t.kind==='wizard'||t.kind==='creature')&&!t.spawned&&!t.done&&Math.hypot(px-t.sx,pz-t.sz)<220){
        const name=t.kind==='beast'?t.beast:t.kind==='wizard'?'Rogue Mage':'Shore Wisp';
        const e=unlockFoe(buildZoneEnemy(sc,STATIC_SOL,t.sx,t.sz,name,typeof pickVariant==='function'?pickVariant(name,level,'hard'):null));e._guildTag=t.id;e.hp=Math.round(e.hp*1.6);e.maxHp=e.hp;ZONES.world.enemies.push(e);t.spawned=true;showMsg(`${name} sighted.`,'#ffb060');
      }
      if(t.kind==='raid'&&!t.spawned){const S=SETTLE.get(t.siteId);if(S&&Math.hypot(px-S.site.x,pz-S.site.z)<150){t.spawned=true;S.raid=true;const site=S.site;for(let i=0;i<t.count;i++){const ang=Math.random()*Math.PI*2;const ex=site.x+Math.cos(ang)*(site.pad+8),ez=site.z+Math.sin(ang)*(site.pad+8);const e=unlockFoe(buildZoneEnemy(sc,STATIC_SOL,ex,ez,'Bandit',null));e._guildTag=t.id;e.alert=true;ZONES.world.enemies.push(e);}showMsg(`Raiders! ${t.count} of them. Hold ${site.name}.`,'#ff8060');}}
    }
  }
  function tickPickups(){qPickupTick();for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];if(p.quest)continue;if(Math.hypot(px-p.x,pz-p.z)<1.4){p.task.got=true;sc.remove(p.task._obj.m);unregLight(p.task._obj.l);pickups.splice(i,1);showMsg('You take the binding-stone. Report back.','#e8d8a0');if(typeof addLog==='function')addLog('🔷','Took a binding-stone.');}}}
  function turnIn(g){const st=gstate()[g];const t=st.active;if(!t)return "You've no task from us.";if(!taskDone(t))return `Not yet. ${progressLine(t)}.`;
    st.active=null;st.done++;const paid=questGold(t.gold);gold+=paid;xp+=Math.round(t.gold*.8);chkLvl();updateHUD();if(typeof addLog==='function')addLog('🏅',`${GUILD_DEF[g].name}: ${t.short} — ${paid} gold.`);
    const rk=rankOf(g);return `Good work. ${paid} gold. ${st.done%3===0?`You're a ${rk} of the ${GUILD_DEF[g].name} now.`:`Rank: ${rk}.`}`;}
  function offer(g,site){const st=gstate()[g];if(st.active)return `You still owe us: ${st.active.short}. ${progressLine(st.active)}.`;const t=commissionFor(g,site)||genTask(g,site);st.active=t;if(typeof addLog==='function')addLog('📜',`${GUILD_DEF[g].name}: ${t.short}.`);showMsg(`New task: ${t.short}`,'#e8d8a0');return (t.title?`${t.title}. `:'')+t.desc+` Pay is ${t.gold} gold.`;}
  // S254 — the guild head greets in the voice of their own people (quest review, run 1, finding 1)
  const GUILD_GREET={
    guild_f:{
      gatelander:["A blade on the wall cuts no bread. The board's behind me.","You've the look of someone who can swing a thing. The board will tell us the rest."],
      markman:   ["The board's behind me. Work if you want it.","You look like you can swing something."],
      aurennais: ["The contracts are posted behind me, Master. Each has its terms and its fee.","You have the look of someone who could take a contract, Master. Read the terms before you sign for one."],
      oldblood:  ["The board is behind me. The work is older than the board.","You carry a blade. Good. Most of the work wants one."]},
    guild_m:{
      gatelander:["Mind the shelves. What sits quiet on a shelf isn't always sleeping.","The Guild's never short of errands, whatever else it's short of. Is it work you're after, or answers?"],
      markman:   ["Mind the shelves. Some of that bites.","Guild needs feet more than minds. You've got feet."],
      aurennais: ["Mind the shelves, Master. Not all of the stock is inert, and breakage is charged.","The Guild has need of runners, Master, more than of scholars. The terms are fair and the pay is prompt."],
      oldblood:  ["Mind the shelves. Some of what is on them was not made to be read.","The Guild wants feet. Minds it has, of a kind."]}};
  function guildDef(g,site,keeper,extra){
    const gd=GUILD_DEF[g];
    const gr=rngFor(site.c*31+(g==='guild_f'?101:211),site.r*17+5); // S172 — the same head every visit (was Math.random: a new name and face each time)
    const gp=peopleOfSite(site);const gb=NAMES[PEOPLES[gp].names]||NAMES.irish;keeper=pickFor(gr,gr()<.4?gb.f:gb.m,true);const tk='tw:'+g,tr=_curNM&&_curNM[tk]?String(_curNM[tk]).split('|'):null;const tw=noteName(keeper,true,tr&&tr[0]===keeper?tr[1]:null);if(_curNM)_curNM[tk]=keeper+'|'+tw;
    return Object.assign({name:keeper,_twin:tw||undefined,_siteId:site.id,people:gp,sCol:pick(gr,PEOPLES[gp].skin),hairCol:pick(gr,PEOPLES[gp].hair),bodyScale:[PEOPLES[gp].width,PEOPLES[gp].height,PEOPLES[gp].width],role:gd.role,ico:g==='guild_f'?'⚔':'✨',greeting:(GUILD_GREET[g][gp]||GUILD_GREET[g].markman),
      get topics(){const base=[{label:'Any work?',quest:true,fn:()=>offer(g,site)},{label:"It's done.",quest:true,fn:()=>turnIn(g)},{label:'My standing?',quest:true,fn:()=>`${rankOf(g)} of the ${gd.name}. ${gstate()[g].done} tasks done.`}];{const w=directionTopics(site,this);if(w.length)base.push({label:'Where can I find \u2026',folder:true,response:'Outside these walls? Ask, then.',follow:w});} /* v80 S138 */if(g==='guild_m'&&typeof spellShopTopics==='function')base.push(...spellShopTopics(Math.min(4,Math.floor(gstate()[g].done/3))),...rubbingTopics(site));return base.concat(this._tail);},_tail:[{label:'What is this place?',response:g==='guild_f'?"The Fighters' Guild. We take contracts the watch won't: beasts, raiders, old doors that need emptying. Beds upstairs for members.":"The Mages' Guild. Ingredients, relics, errands that need a spell at the end of them. There are beds if you've nowhere else."},{label:'Farewell.',bye:true}]},extra||{});
  }
  // ── interior extras: members who wander and talk ──
  let INT_NPCS=[];
  // ── v80 S143: doors inside buildings ──
  // The dungeon's doors are grid cells with a mesh and an open flag; interiors cut doorways but hung
  // nothing in them. A leaf now hangs on the hinge side of every doorway a partition cuts: solid when
  // shut, swung clear when open, on the same E press and the same sounds as a cave door.
  function intDoorAt(sc_,SOL,x,z,by,ang,beamC){
    const w=1.34,h=1.46,dir=(Math.floor(Math.abs(x*7+z*13))%2)?1:-1; // which way it swings, steady per doorway
    const ux=Math.sin(ang),uz=Math.cos(ang);                          // along the wall
    const hx=x-ux*w/2,hz=z-uz*w/2;                                    // the hinge post
    const g=new THREE.Group();g.position.set(hx,by,hz);g.rotation.y=ang;sc_.add(g);
    const leaf=new THREE.Mesh(new THREE.BoxGeometry(.07,h,w),new THREE.MeshLambertMaterial({color:beamC}));
    leaf.position.set(0,h/2+.02,w/2);g.add(leaf);
    for(const t of [-.34,.34]){const br=new THREE.Mesh(new THREE.BoxGeometry(.05,.1,w*.86),new THREE.MeshLambertMaterial({color:0x2a2622}));br.position.set(.05,h/2+t,w/2);g.add(br);} // iron bands
    const kn=new THREE.Mesh(new THREE.SphereGeometry(.05,7,6),new THREE.MeshLambertMaterial({color:0x6a5a2a}));kn.position.set(.08,h/2,w*.86);g.add(kn);
    const sol={x0:x-Math.abs(ux)*w/2-.07,x1:x+Math.abs(ux)*w/2+.07,z0:z-Math.abs(uz)*w/2-.07,z1:z+Math.abs(uz)*w/2+.07,y0:by,y1:by+h};
    SOL.push(sol);
    INT_DOORS.push({x,z,y:by,g,ang,dir,open:false,a:0,from:0,want:0,t0:0,sol,box:{x0:sol.x0,x1:sol.x1,z0:sol.z0,z1:sol.z1}});
    return INT_DOORS[INT_DOORS.length-1];
  }
  function intDoorNear(){return INT_DOORS.find(d=>Math.hypot(px-d.x,pz-d.z)<1.5&&Math.abs(jumpY-d.y)<1.3)||null;}
  function intDoorPrompt(){const d=intDoorNear();if(!d)return null;return d.open?"Press 'E' to close the door":"Press 'E' to open the door";}
  function intDoorInteract(){
    const d=intDoorNear();if(!d)return false;
    if(d.open){ // don't close it on somebody
      const inWay=INT_NPCS.some(n=>Math.hypot(n.g.position.x-d.x,n.g.position.z-d.z)<.8);
      if(inWay){showMsg('Someone is in the doorway.','#c8b880');return true;}
      d.open=false;d.from=d.a;d.want=0;d.t0=performance.now();d.sol.x0=d.box.x0;d.sol.x1=d.box.x1;d.sol.z0=d.box.z0;d.sol.z1=d.box.z1;
      try{sndDoorClose();}catch(e){}
    }else{
      d.open=true;d.from=d.a;d.want=1;d.t0=performance.now();d.sol.x0=d.sol.x1=-9e5;d.sol.z0=d.sol.z1=-9e5; // out of the collision set while it stands open
      try{sndDoorOpen();}catch(e){}
    }
    return true;
  }
  const INT_DOOR_SWING=300; // ms, end to end
  function tickIntDoors(){
    const now=performance.now();
    for(const d of INT_DOORS){if(d.a===d.want)continue;
      const t=Math.min(1,(now-d.t0)/INT_DOOR_SWING);const e=t*t*(3-2*t);
      d.a=d.from+(d.want-d.from)*e;if(t>=1)d.a=d.want;
      d.g.rotation.y=d.ang+d.dir*d.a*1.62;}
  }
  function tickInterior(dt,now){
    try{tickSent(dt,true);}catch(e){} // S239 — a guard sent after you
    tickIntDoors(); // v80 S143
    for(const r of FURN_LIVE)if(r.userData.fire&&r.parent===interiorScene)furnKit().flicker(r.userData.fire,performance.now()*.001);
    for(const n of INT_NPCS){n.wt-=dt;if(n.wt<=0){n.wa=Math.random()*Math.PI*2;n.wt=2+Math.random()*4;n.walk=Math.random()<.6;}
      if(n.walk){const nx=n.g.position.x+Math.sin(n.wa)*.35*dt,nz=n.g.position.z+Math.cos(n.wa)*.35*dt;if(nx>n.box.x0&&nx<n.box.x1&&nz>n.box.z0&&nz<n.box.z1&&!intSolidAt(nx,nz,.3,n.g.position.y)){n.g.position.x=nx;n.g.position.z=nz;n.g.rotation.y=n.wa;}else n.wa+=Math.PI/2;}
      const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);if(d<4&&!n.walk){n.g.rotation.y=Math.atan2(px-n.g.position.x,pz-n.g.position.z);}}
  }
  function interiorTalk(){const n=INT_NPCS.find(n=>Math.hypot(px-n.g.position.x,pz-n.g.position.z)<2.2&&Math.abs(jumpY-n.g.position.y)<1.2);if(!n)return false;openDialog(n.def);return true;}

  // ═══ CULTURES & PROVINCES (Session B) ════════════════════════════════
  // A culture is the bundle the three authored registers were: name
  // syllables, building style, shop nouns, inn-name patterns, rumours.
  // Generated cultures are registered into the SAME tables (NAMES, STYLE,
  // SHOP_NOUN, INN_NAMES, RUMORS, SYL), so every consumer keyed by `reg`
  // works unchanged. Cultures spread across the grid from seeded capitals
  // so neighbouring provinces mostly share one; the home cell stays irish.
  const CUL_ONSETS=['b','c','d','f','g','h','k','l','m','n','p','r','s','t','v','w','br','dr','gr','tr','th','st'];
  const CUL_NUCLEI=['a','e','i','o','u','a','e','o','ai','ei','ia','ou'];
  const CUL_CODAS=['','','','','n','r','l','s','th','nd','rn','m','sh'];
  function makeCulture(id,seed){
    const r=cellRng(seed,777,seed*7+1);
    const pick_=a=>a[Math.floor(r()*a.length)];
    // a culture favours a subset of sounds — that's what makes its names cohere
    const onsets=Array.from({length:7},()=>pick_(CUL_ONSETS)),nuclei=Array.from({length:5},()=>pick_(CUL_NUCLEI)),codas=Array.from({length:5},()=>pick_(CUL_CODAS));
    // no coda before another consonant cluster: keeps names sayable
    const syl=(last)=>{const o=pick_(onsets),n=pick_(nuclei),c=pick_(codas);return o+n+(last?c:(c.length>1?'':c));};
    const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
    const word=(n)=>{let w='';for(let k=0;k<n;k++)w+=syl(k===n-1);return cap(w);};
    const m=[],f=[];for(let k=0;k<12;k++){m.push(word(2));f.push(word(2)+pick_(['a','ia','e','is','ya']));}
    const placeA=Array.from({length:10},()=>word(1)),placeB=Array.from({length:10},()=>syl(false)+pick_(['','a','en','ir','os','ey']));
    const hue=r();const wall=new THREE.Color().setHSL(hue,.12+r()*.15,.62+r()*.2),roof=new THREE.Color().setHSL((hue+.5+r()*.2)%1,.25+r()*.3,.22+r()*.2);
    const thatch=r()<.3,framed=!thatch&&r()<.5;
    STYLE[id]={wall:wall.getHex(),wall2:wall.clone().multiplyScalar(.88).getHex(),roof:roof.getHex(),roof2:roof.clone().multiplyScalar(.8).getHex(),plinth:0x5a5450,frame:0x2c1e12,framed,h:2.3+r()*1.0,rise:thatch?1.5:1.1+r()*1.3,thatch,twoStory:r()*.7,door:new THREE.Color().setHSL(r(),.5,.3).getHex()};
    NAMES[id]={m,f};SYL[id]=[placeA,placeB];
    const nouns={weapon:pick_(['Forge','Smithy','Ironhouse','Hammer']),armor:pick_(['Armoury','Platehouse','Mail-hall']),potion:pick_(['Apothecary','Herb-house','Stillroom','Physic']),misc:pick_(['Goods','Stores','Chandlery','Wares']),church:pick_(['Chapel','Shrine','Sanctum','Oratory']),shipwright:pick_(['Boatyard','Shipwright','Slipway','Yard'])};
    for(const t in nouns)SHOP_NOUN[t][id]=nouns[t];
    const adj=['Grey','Black','Red','Old','Broken','Golden','Salt','Wandering','Quiet','Last'],noun=['Heron','Hound','Ram','Oar','Cup','Hearth','Lantern','Gate','Ember','Anchor'];
    INN_NAMES[id]=Array.from({length:6},()=>`The ${pick_(adj)} ${pick_(noun)}`);
    RUMORS[id]=[`The ${word(2)} clan still pays no tithe. Nobody makes them.`,`They say a ${word(1).toLowerCase()} walks the ${pick_(['marsh','ridge','shore','wood'])} at dusk. They say a lot of things.`,`The old road to ${word(2)} is closed. Or it closed itself.`,`There's a door in the ${pick_(['hills','cliffs','wood','fen'])} that was shut when my father was a boy. Still shut.`,`Ships from ${word(2)} stopped coming two seasons back.`];
    return {id,name:word(2)+pick_(['ish','ic','an','ari','ese']),reg:id,thatch};
  }
  const CULTURES={irish:{id:'irish',name:'Irish'},french:{id:'french',name:'Royale'},anglo:{id:'anglo',name:'Anglic'}};
  const CULTURE_IDS=['irish','french','anglo'];
  for(let k=0;k<5;k++){const id='cul'+k;CULTURES[id]=makeCulture(id,1000+k);CULTURE_IDS.push(id);}
  // spread: each culture has a capital cell; a cell takes the culture of the
  // nearest capital with a little noise; the home cell is irish.
  const CAPITALS=(()=>{const r=cellRng(4242,1,1);const caps=[{id:'irish',i:HOME_I,j:HOME_J}];CULTURE_IDS.slice(1).forEach(id=>caps.push({id,i:1+Math.floor(r()*(GRID-2)),j:1+Math.floor(r()*(GRID-2))}));return caps;})();
  function cultureOfCell(i,j){
    if(i===HOME_I&&j===HOME_J)return 'irish';
    let best='irish',bd=1e9;CAPITALS.forEach(c=>{const d=Math.hypot(c.i-i,c.j-j)+(cellHash(i,j,300+c.id.length)-.5)*1.4;if(d<bd){bd=d;best=c.id;}});
    return best;
  }
  // climate by latitude with noise; polity by seed
  function climateOfCell(i,j){return nationOf(i,j).climate;}
  function polityOfCell(i,j){const q=cellHash(i,j,32);return q<.45?'realm':q<.78?'marches':'wilds';}
  // snow line and ground tint by climate (used by groundColor)
  function snowLineAt(x,z){const [i,j]=cellOf(x,z);const cl=climateOfCell(i,j);return cl==='cold'?18:cl==='warm'?120:38;}

  // ═══ PORTS (Session B) ═══════════════════════════════════════════════
  // A port is a town on the shore: the pad's sea-facing edge gets a stone
  // quay running out past the waterline (a walkable platform), a breakwater
  // beside it, moored boats, nets and crates, a shipwright and a
  // harbourmaster. Ships themselves are Session C.
  function shoreDir(t){ // unit vector from the site toward its sea edge
    if(t.shore)return {dx:t.shore[0],dz:t.shore[1]};
    const [i,j]=cellOf(t.x,t.z);const c=getCell(i,j);const ox=i*SIZE,oz=j*SIZE;
    const cands=[];if(c.sea.E)cands.push([1,0,(ox+SIZE)-t.x]);if(c.sea.W)cands.push([-1,0,t.x-ox]);if(c.sea.S)cands.push([0,1,(oz+SIZE)-t.z]);if(c.sea.N)cands.push([0,-1,t.z-oz]);
    if(!cands.length)return null;cands.sort((a,b)=>a[2]-b[2]);return {dx:cands[0][0],dz:cands[0][1]};
  }
  function allPorts(){const out=[];for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){const c=getCell(i,j);c.sites.forEach(t=>{if(t.kind==='port')out.push(t);});}return out;}
  // S426 — one price for the label and the charge (the label had no tithe, no free passage and a lower cap)
  function ferryPrice(from,to){const d=Math.hypot(to.x-from.x,to.z-from.z);const tithe=nationKeyOf(...cellOf(from.x,from.z))==='aurenne'?1.3:1;const free=fstate()[factionOf(nationKeyOf(...cellOf(from.x,from.z)))].rank>=2;return free?0:Math.min(150,Math.round((15+d/250)*tithe));}
  function ferryTo(from,to){
    const d=Math.hypot(to.x-from.x,to.z-from.z);const price=ferryPrice(from,to);
    if(gold<price)return `Passage to ${to.name} is ${price} gold.`;
    gold-=price;updateHUD();TUT().ferries=(TUT().ferries||0)+1;if(!discovered(to.id)){worldState.wdisc[to.id]=true;}
    const hours=Math.max(1,Math.round(d/300));
    if(typeof worldState.gameTimeMinutes==='number'){worldState.gameTimeMinutes=(worldState.gameTimeMinutes+hours*60)%1440;worldState.gameTimeAbsMinutes=(worldState.gameTimeAbsMinutes||0)+hours*60;}
    if(typeof closeDialog==='function')closeDialog();
    const a=arrivalFor(to.id);if(a)enter(a.x,a.z,a.yaw,()=>{showMsg(`${hours} hour${hours>1?'s':''} on the water. ${to.name}.`,'#c8b880');if(typeof addLog==='function')addLog('⛴',`Took the ferry to ${to.name} (${price} gold).`);});
    return false;
  }
  function ferryTopics(site){
    const ports=allPorts().filter(p=>p.id!==site.id).map(p=>({p,d:Math.hypot(p.x-site.x,p.z-site.z)})).sort((a,b)=>a.d-b.d).slice(0,5);
    return ports.map(({p,d})=>({label:`Passage to ${p.name} (${ferryPrice(site,p)}g, ${compassWord(p.x-site.x,p.z-site.z)})`,quest:true,fn:()=>ferryTo(site,p)}));
  }
  // S390 — cargo by the crate (Michael's B on #88, built as A first). Twelve goods, four from each island's trade (canon
  // §1). A harbour's factor (the harbourmaster's board) sells his own island's goods at ×0.6 of their worth and buys any
  // good: his own at ×0.6, another island's at ×1.4, less his tenth (CARGO_CUT, so buying and selling back at one quay
  // never pays). Each crate sold drops that quay's price for that good 4%, each bought raises it 4%, and the gap closes
  // by 30% a day (CARGO_HEAL), so one route can't be milked. In the Compact's ports a sale pays the tithe, a tenth.
  // With your ship at this harbour (within 140 units, the fetch topic's reach) the crates go into her hold: 40 / 60 / 90
  // weight by class, +25 a hold tier; without her, on your back by weight, as anything else.
  const CARGO_GOODS={
    grain:{n:'Sack of Grain',home:'gatelands',v:20,w:8},wool:{n:'Bale of Wool',home:'gatelands',v:30,w:6},
    hides:{n:'Bundle of Hides',home:'gatelands',v:35,w:7},beef:{n:'Barrel of Salt Beef',home:'gatelands',v:28,w:8},
    iron:{n:'Crate of Iron',home:'mark',v:40,w:10},silver:{n:'Chest of Silver',home:'mark',v:95,w:8},
    timber:{n:'Load of Timber',home:'mark',v:22,w:10},furs:{n:'Bale of Furs',home:'mark',v:60,w:5},
    salt:{n:'Sack of Salt',home:'aurenne',v:20,w:8},dyes:{n:'Crate of Dyes',home:'aurenne',v:70,w:4},
    glass:{n:'Crate of Glass',home:'aurenne',v:55,w:7},fish:{n:'Barrel of Salt Fish',home:'aurenne',v:26,w:7},
    horse:{n:'Horse',home:'gatelands',v:110,w:20,hold:true}}; // S391 — B names horses; a horse goes only in a hold
  const CARGO_HOME=.6,CARGO_ABROAD=1.4,CARGO_CUT=.9,CARGO_STEP=.04,CARGO_HEAL=.7,CARGO_TITHE=.1,CARGO_HOLD={sloop:40,cog:60,galleon:90};
  function cargoNation(site){return nationAt(site.x,site.z);}
  // S391 — prices that follow the world (B): a sacked or occupied town (or one under siege) pays half again for grain and
  // iron; a war raises iron and horses by 30% at the quays of the two nations in it; black sails at sea within 600 units
  // of a port double the premium on another island's goods there (×1.8 for ×1.4). Read when the price is asked.
  const CARGO_SACKED=1.5,CARGO_WAR=1.3,CARGO_BLOCKADE=600;
  function cargoBlockaded(site){return OTHER.some(o=>o.kind==='pirate'&&!o.dead&&Math.hypot(o.x-site.x,o.z-site.z)<CARGO_BLOCKADE);}
  function cargoHard(site){const st=TS(site);return st.flags.sacked!=null||st.flags.occupied!=null||st.flags.besieged!=null;}
  function cargoAtWar(site){const W=war();const nk=cargoNation(site);return !!(W&&(W.a===nk||W.b===nk));}
  function cargoWorld(site,key){let m=1;if((key==='grain'||key==='iron')&&cargoHard(site))m*=CARGO_SACKED;if((key==='iron'||key==='horse')&&cargoAtWar(site))m*=CARGO_WAR;return m;}
  function cargoAbroad(site){return cargoBlockaded(site)?1+2*(CARGO_ABROAD-1):CARGO_ABROAD;}
  function cargoPress(site,key){const m=worldState.cargoMkt||(worldState.cargoMkt={});const s=m[site.id]||(m[site.id]={});const now=worldState.gameTimeAbsMinutes||0;
    const e=s[key];if(!e)return {p:1,t:now};const p=1+(e.p-1)*Math.pow(CARGO_HEAL,Math.max(0,now-e.t)/1440);return {p,t:now};}
  function cargoPush(site,key,f){const e=cargoPress(site,key);e.p*=f;worldState.cargoMkt[site.id][key]=e;}
  function cargoAsk(site,key){const g=CARGO_GOODS[key];return Math.max(1,Math.round(g.v*(g.home===cargoNation(site)?CARGO_HOME:cargoAbroad(site))*cargoWorld(site,key)*cargoPress(site,key).p));}
  function cargoBid(site,key){const raw=Math.max(1,Math.round(cargoAsk(site,key)*CARGO_CUT));const tithe=cargoNation(site)==='aurenne'?Math.round(raw*CARGO_TITHE):0;return {raw,tithe,net:raw-tithe};}
  // S413 — in port: within 140 of the town, or within 60 of the quay's head (Portclare's quay runs 174 out, and a ship fetched there lay 196 off)
  function shipHere(site){if(!(worldState.ship&&SHIP.mesh))return false;if(Math.hypot(SHIP.x-site.x,SHIP.z-site.z)<140)return true;const q=site.quayStart;return !!(q&&Math.hypot(SHIP.x-q.x,SHIP.z-q.z)<60);}
  function holdOf(){const st=shipCfg();return st.hold||(st.hold={});}
  function holdCap(){const st=shipCfg();return (CARGO_HOLD[st.cls||'sloop']||40)+25*(st.cargo||0);}
  function holdUsed(){const h=holdOf();let w=0;for(const k in h)if(CARGO_GOODS[k])w+=h[k]*CARGO_GOODS[k].w;return w;}
  function cargoItem(key){const g=CARGO_GOODS[key];return {name:g.n,ico:'📦',type:'cargo',cargo:key,weight:g.w,qty:1,desc:`Trade goods. A harbour's factor buys them.`};}
  function cargoHave(key){const b=BAG.find(it=>it.type==='cargo'&&it.cargo===key);return {bag:b?(b.qty||1):0,hold:(worldState.ship&&worldState.ship.hold&&worldState.ship.hold[key])||0};}
  function cargoBuy(site,key){const g=CARGO_GOODS[key];if(!g||g.home!==cargoNation(site))return 'That is not sold here.';const p=cargoAsk(site,key);
    if(gold<p)return `A ${g.n.toLowerCase()} is ${p} gold.`;
    if(shipHere(site)&&holdUsed()+g.w<=holdCap()){const h=holdOf();h[key]=(h[key]||0)+1;}
    else if(!g.hold&&canCarry(cargoItem(key)))bagAdd(cargoItem(key));
    else if(g.hold)return shipHere(site)?`No room in the hold for a horse.`:`A horse goes in a ship's hold, and your ship is not here.`;
    else return shipHere(site)?`No room in the hold, and too heavy to carry.`:`Too heavy to carry.`;
    gold-=p;cargoPush(site,key,1+CARGO_STEP);if(typeof updateHUD==='function')updateHUD();if(typeof sndGoldJingle==='function')sndGoldJingle();
    return `Bought a ${g.n.toLowerCase()} for ${p} gold.`;}
  function cargoSell(site,key){const g=CARGO_GOODS[key];if(!g)return '';const have=cargoHave(key);const fromHold=shipHere(site)&&have.hold>0;
    if(!fromHold&&!have.bag)return `You have no ${g.n.toLowerCase()} here.`;
    const b=cargoBid(site,key);
    if(fromHold){const h=holdOf();h[key]--;if(h[key]<=0)delete h[key];}
    else{const i=BAG.findIndex(it=>it.type==='cargo'&&it.cargo===key);const it=BAG[i];it.qty=(it.qty||1)-1;if(it.qty<=0)BAG.splice(i,1);}
    gold+=b.net;cargoPush(site,key,1-CARGO_STEP);const ws=worldState.stats||(worldState.stats={});ws.goldIn=(ws.goldIn||0)+b.net;
    if(typeof updateHUD==='function')updateHUD();if(typeof sndGoldJingle==='function')sndGoldJingle();
    return `Sold a ${g.n.toLowerCase()} for ${b.net} gold`+(b.tithe?` (the Compact's tithe, ${b.tithe}).`:'.');}
  function cargoBoard(site){const nk=cargoNation(site);const own=Object.keys(CARGO_GOODS).filter(k=>CARGO_GOODS[k].home===nk);
    let s=`The factor's prices, a crate. Selling: `+own.map(k=>`${CARGO_GOODS[k].n.replace(/^\w+ of /,'')} ${cargoAsk(site,k)}`).join(', ')+'.';
    const abroad=Object.keys(CARGO_GOODS).filter(k=>CARGO_GOODS[k].home!==nk);s+=` Buying from abroad: `+abroad.map(k=>`${CARGO_GOODS[k].n.replace(/^\w+ of /,'')} ${cargoBid(site,k).net}`).join(', ')+'.';
    if(nk==='aurenne')s+=` The Compact tithes every sale a tenth.`;
    if(cargoHard(site))s+=` Grain and iron are dear here: the town has been hard used.`;
    if(cargoAtWar(site))s+=` The war has put up iron and horses.`;
    if(cargoBlockaded(site))s+=` Black sails off the coast: goods from abroad are dearer.`;
    if(worldState.ship)s+=shipHere(site)?` The ${SHIP.name}'s hold: ${holdUsed()} of ${holdCap()}.`:` The ${SHIP.name} is not at this harbour; what you buy, you carry.`;
    return s;}
  function cargoRows(site){const nk=cargoNation(site);const rows=[];
    for(const k in CARGO_GOODS){const g=CARGO_GOODS[k];if(g.home!==nk)continue;rows.push({label:`Buy a ${g.n.toLowerCase()} (${cargoAsk(site,k)} gold)`,quest:true,fn:(c)=>{const r=cargoBuy(site,k);c.follow=cargoRows(site);return r+' '+cargoBoard(site);}});}
    for(const k in CARGO_GOODS){const h=cargoHave(k);const n=(shipHere(site)?h.hold:0)+h.bag;if(!n)continue;rows.push({label:`Sell a ${CARGO_GOODS[k].n.toLowerCase()} (${cargoBid(site,k).net} gold, ${n} on hand)`,quest:true,fn:(c)=>{const r=cargoSell(site,k);c.follow=cargoRows(site);return r+' '+cargoBoard(site);}});}
    return rows;}
  function cargoTopic(site){return {label:'Cargo — the factor’s prices',quest:true,fn:(c)=>{c.follow=cargoRows(site);return cargoBoard(site);}};}
  // S250 — the harbour in detail (H.5, Michael's A): the quay along local z (seaward +z), its deck's top at .1 as the old
  // deck's; faces of coursed blocks on a mortar core, a kerbed coping, a paved deck, steps down to the water on the right
  // side near the head, iron mooring rings; everything below the tide line (sea level + .3, in the mesh's own y, dy the
  // mesh's height above the sea) dark and weedy. The breakwater's heaps of armour stone likewise.
  function tideLine(geo,dy){const p=geo.attributes.position,c=geo.attributes.color;for(let i=0;i<p.count;i++){const y=p.getY(i)+dy;if(y<SEA_Y+.3){const k=y<SEA_Y-.4?1:(SEA_Y+.3-y)/.7;c.setXYZ(i,c.getX(i)*(1-.38*k),c.getY(i)*(1-.24*k),c.getZ(i)*(1-.4*k));}}c.needsUpdate=true;return geo;}
  function quayGeoHi(len,QW,dy,rr){const P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+rr()*a*2).getHex(),stone=0x7a746a,B=-3.2;
    add(new THREE.BoxGeometry(QW-.2,3.2,len-.2),0x4a453d,0,-1.6,0,0,0,0,.03);
    const course=(run,place)=>{for(let y=B;y<-.3;){const ch=Math.min(-.3-y,.55+rr()*.2);let u=-run/2;while(u<run/2-.05){const bl=Math.min(run/2-u,1.3+rr()*1.1);place(u+bl/2,bl-.06,y+ch/2,ch-.05,vary(stone,.14));u+=bl;}y+=ch;}};
    for(const s of [-1,1])course(len,(u,bl,y,h,col)=>add(new THREE.BoxGeometry(.5,h,bl),col,s*(QW/2-.25)+(rr()-.5)*.05,y,u,0,0,0,.05));
    course(QW,(u,bl,y,h,col)=>add(new THREE.BoxGeometry(bl,h,.5),col,u,y,len/2-.25+(rr()-.5)*.05,0,0,0,.05));
    for(const s of [-1,1])for(let z=-len/2;z<len/2-.05;){const L=Math.min(len/2-z,2.2);add(SK.rbox(.72,.34,L-.03,.06,1),vary(0x8a857a,.06),s*(QW/2-.36),-.07,z+L/2,0,0,0,.04);z+=L;}
    for(let x=-QW/2+.7;x<QW/2-.75;){const L=Math.min(QW/2-.7-x,2.2);add(SK.rbox(L-.03,.34,.72,.06,1),vary(0x8a857a,.06),x+L/2,-.07,len/2-.36,0,0,0,.04);x+=L;}
    for(let z=-len/2+.55;z<len/2-.8;z+=1.1){let x=-QW/2+.72;while(x<QW/2-.75){const w=Math.min(QW/2-.72-x,.9+rr()*.9);if(w>.2)add(new THREE.BoxGeometry(w-.05,.08,1.04),vary(0x7e786c,.12),x+w/2,.06,z,0,0,0,.05);x+=w;}}
    for(let i=0;i<6;i++){const top=-.3-i*.42;add(SK.rbox(1.3,top-B,1.1,.05,1),vary(stone,.1),QW/2+.66,(top+B)/2,len/2-7-i*1.1,0,0,0,.05);}
    for(let z=-len/2+6;z<len/2-2;z+=6)for(const s of [-1,1])add(SK.torus(.13,.028,4,10),0x2a2622,s*(QW/2+.04),-.55,z,0,Math.PI/2,0,.02);
    return tideLine(mergeParts(P),dy);}
  function netHeapGeo(k){const rr=pRng(9001+k*131),P=[];const g=SK.bumpy(SK.ball(.62,12,6,0,Math.PI*2,0,Math.PI/2),.09,9,k*1.7);g.scale(1,.55,1);P.push({geo:g,color:new THREE.Color(0x7a7258),y:0,jitter:.14});
    for(let i=0;i<9;i++){const a=rr()*Math.PI*2,d=.2+rr()*.45;P.push({geo:SK.ball(.055,6,4),color:new THREE.Color(i%3?0xb08a4a:0x9a3a22),x:Math.cos(a)*d,y:.34*Math.sqrt(Math.max(0,1-(d/.66)**2))+.02,z:Math.sin(a)*d,jitter:.05});}
    return mergeParts(P);}
  function breakwaterHeap(rr){const P=[];const add=(geo,col,x,y,z,ry)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx:0,ry,rz:0,jitter:.1});
    add(cragGeo(2.9+rr()*.4,Math.floor(rr()*1e4)),new THREE.Color(0x6a665e).multiplyScalar(.9+rr()*.2).getHex(),0,.1,0,rr()*6);
    for(let k=0;k<4;k++){const a=k/4*Math.PI*2+rr(),d=2.2+rr()*1.2,s=1.3+rr()*.9;add(cragGeo(s,Math.floor(rr()*1e4)),new THREE.Color(0x6e6a60).multiplyScalar(.85+rr()*.25).getHex(),Math.cos(a)*d,-.6+rr()*.8,Math.sin(a)*d,rr()*6);}
    return tideLine(mergeParts(P),0);}
  function buildHarbour(S,site,r){
    const sd=shoreDir(site);if(!sd)return;
    const {group,sol}=S;
    // walk from the pad edge toward the sea until the water line
    const QW=8,QY=1.1;
    // walk seaward from the pad edge: the quay starts where the ground falls
    // to quay height, and runs 34u past the waterline
    let x=site.quayStart?site.quayStart.x:site.x+sd.dx*site.pad,z=site.quayStart?site.quayStart.z:site.z+sd.dz*site.pad,n=0;
    if(!site.quayStart){while(worldH(x,z)>QY+.2&&n<80){x+=sd.dx*3;z+=sd.dz*3;n++;}}
    const startX=x,startZ=z;
    while(worldH(x,z)>0&&n<120){x+=sd.dx*3;z+=sd.dz*3;n++;}
    const endX=x+sd.dx*34,endZ=z+sd.dz*34;const len=Math.max(24,Math.hypot(endX-startX,endZ-startZ));
    const mx=(startX+endX)/2,mz=(startZ+endZ)/2;const ang=Math.atan2(sd.dx,sd.dz);
    const rq=pRng(pHash(site.id+'|quay'));{const lo=mergeParts([{geo:new THREE.BoxGeometry(QW,3.2,len),color:new THREE.Color(0x7a746a),y:-1.6,jitter:0},{geo:new THREE.BoxGeometry(QW+.4,.2,len+.4),color:new THREE.Color(0x8a857a),jitter:0}]); // S250 — the old quay and deck, now the distant copy
      for(const [geo,lod] of [[quayGeoHi(len,QW,QY-SEA_Y,rq),'hi'],[lo,'lo']]){const q=new THREE.Mesh(geo,SETTLE_MAT);q.position.set(mx,QY,mz);q.rotation.y=ang;q.receiveShadow=true;q.castShadow=lod==='hi';q.userData.lod=lod;q.userData.quay=true;group.add(q);}}
    // walkable platform (axis-aligned box covering the quay)
    const hw=Math.abs(sd.dx)?len/2:QW/2,hd=Math.abs(sd.dz)?len/2:QW/2;
    ZONES.world.platforms.push({x0:mx-hw,x1:mx+hw,z0:mz-hd,z1:mz+hd,y:QY,site:site.id});
    // bollards and a lantern
    const iron=new THREE.MeshLambertMaterial({color:0x2e2c2a}),bollard=SK.lathe([[.001,0],[.2,0],[.2,.07],[.13,.14],[.11,.42],[.16,.55],[.17,.63],[.1,.7],[.001,.72]],10); // S250 — a cast-iron bollard (it was a wooden peg)
    for(let t=-len/2+3;t<len/2;t+=6){const bx=mx+sd.dx*t-sd.dz*(QW/2-.5),bz=mz+sd.dz*t+sd.dx*(QW/2-.5);const b=new THREE.Mesh(bollard,iron);b.position.set(bx,QY+.08,bz);group.add(b);}
    const lampX=endX-sd.dx*2,lampZ=endZ-sd.dz*2;const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,3.4,6),new THREE.MeshLambertMaterial({color:0x2a2622}));post.position.set(lampX,QY+1.7,lampZ);group.add(post);
    const glass=new THREE.Group();const pane=new THREE.Mesh(new THREE.BoxGeometry(.24,.3,.24),new THREE.MeshBasicMaterial({color:0xffc860,transparent:true,opacity:.6}));glass.add(pane);glass.position.set(lampX,QY+3.2,lampZ);group.add(glass);
    const hl=regLight(0xffb050,0,20,site.id);hl.position.copy(glass.position);S.lamps.push({glass,light:hl});
    // breakwater: a curved stone arm beside the quay, out in the water
    const bw=[];for(let k=0;k<7;k++){const t=k/6;const bx=endX-sd.dx*t*len*.6-sd.dz*(QW/2+10+t*14),bz=endZ-sd.dz*t*len*.6+sd.dx*(QW/2+10+t*14);bw.push([bx,bz]);}
    const rw=pRng(pHash(site.id+'|breakwater'));bw.forEach(([bx,bz],k)=>{ // S250 — a heap of armour stone near, the old block its distant copy
      for(const [geo,lod] of [[breakwaterHeap(rw),'hi'],[mergeParts([{geo:new THREE.BoxGeometry(6,3.6,6),color:new THREE.Color(0x6a665e),y:.6,jitter:0}]),'lo']]){const m=new THREE.Mesh(geo,SETTLE_MAT);m.position.set(bx,0,bz);m.rotation.y=k*.35;m.castShadow=lod==='hi';m.userData.lod=lod;m.userData.breakwater=true;group.add(m);}sol.push({cx:bx,cz:bz,rx:3,rz:3});});
    // boats moored along the quay
    const nb=2+Math.floor(r()*2);
    for(let k=0;k<nb;k++){
      const t=-len/2+8+k*10;const side=k%2?1:-1;const bx=mx+sd.dx*t-sd.dz*side*(QW/2+3.2),bz=mz+sd.dz*t+sd.dx*side*(QW/2+3.2);
      const hull=boatBake(Math.floor(r()*4)).geo; // S168 — an open clinker boat, four paints, one bake each
      const bm=new THREE.Mesh(hull,SHIP_MAT);bm.position.set(bx,SEA_Y+.05,bz);bm.rotation.y=ang+(r()-.5)*.2;bm.castShadow=true;group.add(bm);S.boats=S.boats||[];S.boats.push(bm);
    }
    // nets, crates and barrels on the landward end
    for(let k=0;k<5;k++){const t=-len/2+2+r()*10;const bx=mx+sd.dx*t-sd.dz*(r()-.5)*(QW-2),bz=mz+sd.dz*t+sd.dx*(r()-.5)*(QW-2);
      if(r()<.5){const cr=new THREE.Mesh(SK.rbox(.9,.8,.9,.05,2),new THREE.MeshLambertMaterial({color:0x7a5a28}));cr.position.set(bx,QY+.5,bz);cr.rotation.y=r();group.add(cr);} // S250 — the town's rounded crate
      else{const net=new THREE.Mesh(netHeapGeo(k),SETTLE_MAT);net.position.set(bx,QY+.1,bz);group.add(net);}} // S250 — a heap of net with cork floats (it was a wireframe cone)
    // harbourmaster at the landward end of the quay
    const hx=startX+sd.dx*3-sd.dz*2,hz=startZ+sd.dz*3+sd.dx*2;
    const def=makeDef(site,S.reg,r,'Harbourmaster',pick(r,(NAMES[S.reg]||NAMES.irish).m),{x:hx,z:hz,bCol:0x2a3a5a,sCol:0xc09070,topics:[...ferryTopics(site),cargoTopic(site),{label:'What comes through here?',response:'Salt fish, timber, wool, and trouble. Mostly fish.'}]});
    def.role='Harbourmaster';
    const hn=spawnNPC(def,ang+Math.PI,true);hn.sched={type:'harbour',door:{x:hx,z:hz},plaza:{x:site.x,z:site.z}};S.npcs.push(hn); // v80 S235 — on the quay by day (was 'keeper': hidden 8–18 as if behind a counter)
  }

  // ═══ SHIPS & SWIMMING (Session C) ════════════════════════════════════
  // One ship for now, bought at a shipwright, kept in worldState.ship. The
  // deck is a moving platform (ZONES.world.platforms entry updated every
  // frame), so you board by walking on. E at the wheel takes the helm:
  // WASD drives the ship, you stand at the wheel, the camera is free. E
  // again lets go. The bow stops in shallows ("aground"); walk off the
  // bow onto the shore. Water is swimmable: the surface is the ground
  // when the bed is deeper than the waterline.
  const SHIP={mesh:null,x:0,z:0,yaw:0,speed:0,sailing:false,plat:null,wheel:{x:0,z:0},helm:{x:0,z:0},name:'Gull',L:13,W:4.4};
  const SHIP_NAMES=['Grey Gull','Salt Heron','Kestrel','Marrow','Ember Wake','Lantern','Cormorant','Old Ram','Wandering Oar','Mercy'];
  const DECK_Y=SEA_Y+1.0,SHIP_PRICE=400;
  const KEYS={};
  window.addEventListener('keydown',e=>{KEYS[e.code]=true;});window.addEventListener('keyup',e=>{KEYS[e.code]=false;});
  // ── Ships on the shape kit (backlog H.5b, Session 168) ──
  // A hull is lofted, not boxed: stations along the length, each a round-bilged section from the keel to the gunwale,
  // fining to a stem at the bow and a transom or sternpost aft, the gunwale rising to both ends; each row of faces is a
  // strake with its own shade, tarred below the waterline. Deck, rails, wale, keel and stem, rudder, bowsprit, rigging
  // and sails are baked with it into one vertex-coloured geometry: one draw call a ship, as before. The frame is the
  // game's: the mesh sits at SEA_Y, +z is the prow, the deck is flat at 1.0 (DECK_Y), the wheel at -L/2+2.8, the hatch at
  // L/2-3.2. The deck you can stand on follows the hull's breadth (mesh.userData.deckAt), not the old box's rectangle.
  // Prototype: docs/prototypes/boats (Michael, 27 Sep: the rigs per class, the pirate and merchant looks; the sails
  // filled, ratlines, the spritsail brought in).
  const SHIP_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0,side:THREE.DoubleSide});
  const SHIP_DECK=1.0;
  function ShipBake(){this.parts=[];}
  {const _e=new THREE.Euler(0,0,0,'YXZ'),_q=new THREE.Quaternion();
    ShipBake.prototype.add=function(geo,p,r,s,col){_e.set(r?r[0]:0,r?r[1]:0,r?r[2]:0,'YXZ');_q.setFromEuler(_e);
      const m=new THREE.Matrix4().compose(new THREE.Vector3(p?p[0]:0,p?p[1]:0,p?p[2]:0),_q,new THREE.Vector3(s?s[0]:1,s?s[1]:1,s?s[2]:1));
      this.parts.push([geo,m,col==null?null:new THREE.Color(col)]);return this;};}
  // a part between two points (spars, stays, shrouds, ratlines)
  ShipBake.prototype.rod=function(a,b,r0,r1,col,seg){const A=new THREE.Vector3(a[0],a[1],a[2]),B=new THREE.Vector3(b[0],b[1],b[2]),d=B.clone().sub(A),L=d.length();
    const g=new THREE.CylinderGeometry(r1==null?r0:r1,r0,L,seg||5,1,true);g.translate(0,L/2,0);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
    this.parts.push([g,new THREE.Matrix4().compose(A,q,new THREE.Vector3(1,1,1)),new THREE.Color(col)]);return this;};
  ShipBake.prototype.bake=function(){
    let n=0;const flat=this.parts.map(([g,m,c])=>{const gg=g.index?g.toNonIndexed():g.clone();g.dispose();gg.applyMatrix4(m);if(!gg.attributes.normal)gg.computeVertexNormals();n+=gg.attributes.position.count;return [gg,c];});
    const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;
    flat.forEach(([g,c])=>{const p=g.attributes.position,nn=g.attributes.normal,vc=g.attributes.color;
      for(let i=0;i<p.count;i++,o++){pos[o*3]=p.getX(i);pos[o*3+1]=p.getY(i);pos[o*3+2]=p.getZ(i);nor[o*3]=nn.getX(i);nor[o*3+1]=nn.getY(i);nor[o*3+2]=nn.getZ(i);
        if(c){col[o*3]=c.r;col[o*3+1]=c.g;col[o*3+2]=c.b;}else{col[o*3]=vc.getX(i);col[o*3+1]=vc.getY(i);col[o*3+2]=vc.getZ(i);}}g.dispose();});
    const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('color',new THREE.BufferAttribute(col,3));
    out.computeBoundingBox();out.computeBoundingSphere();return out;};
  const shC=x=>new THREE.Color(x);
  // the hull: o {L,W,draft,sheer,bowRise,sternRise,stem,transom,full,strakes,bottom,wale,band,rows,stations}
  // returns the geometry, a transom, at(z) -> {b half-breadth at the gunwale, g gunwale height, k keel}, and the keel and gunwale lines
  function shipHull(o){
    const D=SHIP_DECK,L=o.L,W=o.W,NS=o.stations||28,NR=o.rows||12,zs=-L/2-(o.transom?.15:.6),zb=L/2+(o.stem||2.2);
    const rows=[],kpts=[],gpts=[];const U=u=>zs+(zb-zs)*u;
    const breadth=u=>{const z=U(u);let k=1;
      if(z>L/2-2.4){const t=(z-(L/2-2.4))/(zb-(L/2-2.4));k=Math.max(.015,1-Math.pow(t,o.full||1.7));}
      if(z<-L/2+2.2){const t=(-L/2+2.2-z)/(-L/2+2.2-zs);k=Math.min(k,1-Math.pow(t,2.2)*(1-(o.transom||.12)));}
      return W/2*k;};
    const gun=u=>{const z=U(u),t=z/(L/2);return D+(o.sheer||.45)+(t>0?(o.bowRise||.5)*Math.pow(Math.max(0,t),2.2):(o.sternRise||.35)*Math.pow(-t,2.4));};
    const keel=u=>{const z=U(u);let y=-(o.draft||1.1);
      if(z>L/2-3.5){const t=(z-(L/2-3.5))/(zb-(L/2-3.5));y+=(gun(u)-.05-y)*Math.pow(t,2.1);}
      if(z<-L/2+1.5){const t=(-L/2+1.5-z)/(-L/2+1.5-zs);y+=(o.transom?(.55+.3*t):1.2)*t*t;}
      return y;};
    for(let s=0;s<=NS;s++){const u=s/NS,z=U(u),b=breadth(u),g=gun(u),k=keel(u);kpts.push(new THREE.Vector3(0,k,z));gpts.push(new THREE.Vector3(b,g,z));
      const ring=[];for(let j=0;j<=NR;j++){const th=j/NR*Math.PI/2;const sx=Math.pow(Math.sin(th),.45),cy=Math.pow(Math.cos(th),.55);
        const flare=1+.05*Math.max(0,(1-cy)-.6);ring.push([b*sx*flare,g-(g-k)*cy,z]);}
      rows.push(ring);}
    const pos=[],colr=[];const push=(a,c)=>{pos.push(a[0],a[1],a[2]);colr.push(c.r,c.g,c.b);};
    const strake=(j,y,s)=>{if(y<.08)return shC(o.bottom||0x2e2620);if(o.wale&&y>D-.28&&y<D-.02)return shC(o.wale);
      if(o.band&&y>D+.02)return shC(o.band);const base=shC(o.strakes[j%o.strakes.length]);return base.multiplyScalar(.94+.06*((s*7)%3)/2);};
    for(let s=0;s<NS;s++)for(let j=0;j<NR;j++)for(const side of [1,-1]){
      const a=rows[s][j],b=rows[s+1][j],c=rows[s+1][j+1],d=rows[s][j+1];const f=q=>[q[0]*side,q[1],q[2]];
      const col=strake(NR-1-j,(a[1]+c[1])/2,Math.floor(s/4));
      const tri=side>0?[a,b,c,a,c,d]:[a,c,b,a,d,c];for(const q of tri)push(f(q),col);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colr,3));
    geo.computeVertexNormals();shipSmoothNormals(geo);
    let tgeo=null;if(o.transom){const r=rows[0],cz=r[0][2],tp=[],tc=[];const col=shC(o.transomCol||o.strakes[0]).multiplyScalar(.85);
      for(let j=0;j<NR;j++)for(const side of [1,-1]){const a=r[j],d=r[j+1];const f=q=>[q[0]*side,q[1],cz];
        const quad=[a,d,[0,d[1],cz],[0,a[1],cz]];const ix=side>0?[0,2,1,0,3,2]:[0,1,2,0,2,3];for(const i of ix){const q=f(quad[i]);tp.push(q[0],q[1],q[2]);tc.push(col.r,col.g,col.b);}}
      tgeo=new THREE.BufferGeometry();tgeo.setAttribute('position',new THREE.Float32BufferAttribute(tp,3));tgeo.setAttribute('color',new THREE.Float32BufferAttribute(tc,3));tgeo.computeVertexNormals();}
    const at=z=>{const u=Math.min(1,Math.max(0,(z-zs)/(zb-zs)));return {b:breadth(u),g:gun(u),k:keel(u)};};
    return {geo,tgeo,at,kpts,gpts,zs,zb};
  }
  // smooth normals across faces that share a point: the strakes are coloured flat, the hull shades round
  function shipSmoothNormals(g){const p=g.attributes.position,n=g.attributes.normal,m=new Map();const key=i=>`${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    for(let i=0;i<p.count;i++){const k=key(i);let v=m.get(k);if(!v)m.set(k,v=new THREE.Vector3());v.x+=n.getX(i);v.y+=n.getY(i);v.z+=n.getZ(i);}
    for(let i=0;i<p.count;i++){const v=m.get(key(i)).clone().normalize();n.setXYZ(i,v.x,v.y,v.z);}}
  // the deck: planks fore and aft, clipped to the hull's breadth. deckAt(z) is the half-breadth you can stand on there
  function shipDeck(B,H,L,cols){const y=SHIP_DECK,NZ=24,NP=9;const pos=[],col=[];const z0=-L/2-.05,z1=H.zb-.5;
    for(let s=0;s<NZ;s++){const za=z0+(z1-z0)*s/NZ,zb=z0+(z1-z0)*(s+1)/NZ;const ba=H.at(za).b*.97,bb=H.at(zb).b*.97;
      for(let p=0;p<NP;p++){const fa=-1+2*p/NP,fb=-1+2*(p+1)/NP;const c=shC(cols[(p+(s>>3))%cols.length]);
        const q=[[ba*fa,y,za],[ba*fb,y,za],[bb*fb,y,zb],[bb*fa,y,zb]];for(const i of [0,2,1,0,3,2]){pos.push(q[i][0],q[i][1],q[i][2]);col.push(c.r,c.g,c.b);}}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();B.add(g);
    return {z0,z1,at:z=>z<z0||z>z1?0:H.at(z).b*.97};}
  function shipRail(B,H,r,col,dy){for(const side of [1,-1]){const pts=H.gpts.filter((q,i)=>i%2===0||i===H.gpts.length-1).map(q=>new THREE.Vector3(q.x*side,q.y+(dy||0),q.z));
    B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),28,r,5,false),null,null,null,col);}}
  function shipWale(B,H,y,r,col){for(const side of [1,-1]){const pts=[];for(let z=H.zs+.2;z<H.zb-.6;z+=.6){const b=H.at(z).b;pts.push(new THREE.Vector3(b*side*1.01,y,z));}
    B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,r,4,false),null,null,null,col);}}
  function shipKeel(B,H,r,col,top){const pts=H.kpts.filter((q,i)=>i%2===0).map(q=>q.clone());const last=H.kpts[H.kpts.length-1];pts.push(new THREE.Vector3(0,last.y+(top||.35),last.z+.12));
    B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,r,5,false),null,null,null,col);}
  // a square sail, filled: it bellies forward most in the middle and low down, the foot curving up at the clews, the
  // leeches drawn in a little, the way a sail full of wind hangs from its yard
  function shipSail(B,w0,w1,h,belly,col,seam,at){const nx=8,ny=8,pos=[],cl=[];const c0=shC(col),c1=shC(seam||col);
    const P=(i,j)=>{const t=j/ny,u=i/nx,w=w1+(w0-w1)*t,s=Math.sin(Math.PI*u);const x=(u-.5)*w*(1-.06*Math.sin(Math.PI*t));
      const y=-h*t+h*.1*t*t*(1-s);const bz=belly*s*Math.pow(Math.sin(Math.PI*(.12+.8*t)),.8)*(.75+.25*t);return [x,y,bz];};
    for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const q=[P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)];const c=(i%2?c1:c0);for(const k of [0,1,2,0,2,3])pos.push(q[k][0],q[k][1],q[k][2]),cl.push(c.r,c.g,c.b);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.computeVertexNormals();
    B.add(g,at);}
  // the wheel is its own small mesh on the hull, so it can turn with the helm
  function shipWheelMesh(){const B=new ShipBake(),W=0x5a3a1c;B.add(SK.torus(.4,.045,6,14),[0,0,0],0,null,W);
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2;B.rod([Math.cos(a)*.1,Math.sin(a)*.1,0],[Math.cos(a)*.56,Math.sin(a)*.56,0],.022,.018,W,4);}
    B.add(SK.cyl(.08,.1,.1,8),[0,0,0],[Math.PI/2,0,0],null,0x3a2410);const m=new THREE.Mesh(B.bake(),SHIP_MAT);m.castShadow=true;return m;}
  function shipHatch(B,z){const D=SHIP_DECK;B.add(new THREE.BoxGeometry(1.3,.14,1.3),[0,D+.07,z],0,null,0x4a3018);
    for(let k=-2;k<=2;k++)B.add(new THREE.BoxGeometry(1.1,.04,.12),[0,D+.15,z+k*.22],0,null,0x2e1e10);
    B.add(SK.torus(.1,.022,5,10),[.34,D+.16,z],[Math.PI/2,0,0],null,0x2a2622);}
  function shipBarrel(B,x,z,col){const y=SHIP_DECK;B.add(SK.lathe([[.001,0],[.2,0],[.24,.12],[.26,.25],[.24,.38],[.2,.5],[.001,.5]],10),[x,y,z],0,null,col||0x7a5228);
    for(const h of [.06,.44])B.add(SK.torus(.235,.018,5,10),[x,y+h,z],[Math.PI/2,0,0],null,0x3a3530);}
  function shipCrate(B,x,z,s,ry){const y=SHIP_DECK;B.add(new THREE.BoxGeometry(s,s*.8,s),[x,y+s*.4,z],[0,ry||0,0],null,0x8a6a38);B.add(new THREE.BoxGeometry(s*1.02,s*.12,s*1.02),[x,y+s*.4,z],[0,ry||0,0],null,0x5a4020);}
  function shipLantern(B,x,y,z){B.rod([x,y-.5,z],[x,y,z],.03,.03,0x2a2622,4);B.add(SK.cyl(.08,.1,.22,6),[x,y+.11,z],0,null,0xffc860);B.add(SK.cone(.12,.1,6),[x,y+.27,z],0,null,0x2a2622);}
  // shrouds from the chains at the gunwale to the masthead, and ratlines across them every .42 up to climb by
  function shipShrouds(B,H,z,top,n,dz,rc){for(const s of [1,-1]){const ends=[];for(let k=0;k<n;k++){const zz=z-dz*(n-1)/2+k*dz;const a=H.at(zz);const lo=[a.b*s*1.02,a.g-.1,zz],hi=[.13*s,top,z];B.rod(lo,hi,.02,.02,rc,3);ends.push([lo,hi]);}
    if(n<2)continue;const lo0=ends[0][0][1],steps=Math.floor((top-lo0)*.62/.42);
    for(let q=1;q<=steps;q++){const pts=ends.map(([lo,hi])=>{const t=q*.42/(top-lo[1]);return [lo[0]+(hi[0]-lo[0])*t,lo[1]+(hi[1]-lo[1])*t,lo[2]+(hi[2]-lo[2])*t];});
      for(let k=0;k<pts.length-1;k++)B.rod(pts[k],pts[k+1],.011,.011,rc,3);}}}
  // a gaff sail aft of a mast: boom at bY, gaff peaking up from gY, the sail between them filled to leeward
  function shipGaff(B0,mz0,bY,gY,boomL,gaffL,lk,rigs){const B=rigs?new ShipBake():B0,mz=rigs?0:mz0;B.rod([0,bY,mz-.1],[0,bY+.25,mz-boomL],.07,.05,0x5a3c1e,6);B.rod([0,gY,mz-.1],[0,gY+gaffL*.3,mz-gaffL],.06,.045,0x5a3c1e,6);
    const nx=8,ny=8,pos=[],cl=[];const c0=shC(lk.sail),c1=shC(lk.seam);
    const Pm=(i,j)=>{const t=i/nx,v=j/ny;const zf=mz-.15-t*(v*(gaffL-.2)+(1-v)*(boomL-.3));const yb=bY+.1+.25*t,yt=gY-.05+gaffL*.3*t;const y=yb+(yt-yb)*v;
      return [1.05*Math.pow(Math.sin(Math.PI*t),.85)*Math.sin(Math.PI*(.12+.8*v))*(1-.35*v),y,zf];};
    for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const q=[Pm(i,j),Pm(i+1,j),Pm(i+1,j+1),Pm(i,j+1)];const c=j%2?c1:c0;for(const k of [0,1,2,0,2,3])pos.push(q[k][0],q[k][1],q[k][2]),cl.push(c.r,c.g,c.b);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.computeVertexNormals();B.add(g);
    if(rigs)rigs.push({geo:B.bake(),z:mz0,type:'gaff'});}
  // a mast with a top, its shrouds and ratlines, the yard and a square sail (and a topsail over it)
  function shipSquareMast(B,H,z,h,yardW,sailH,o){const D=SHIP_DECK,mc=o.mast||0x5a3c1e,rc=o.rope||0x2e2820;const foot=D-.8;
    B.add(SK.cyl(.1*o.k,.17*o.k,h+.8,8),[0,foot+(h+.8)/2,z],0,null,mc);
    if(o.top)B.add(SK.cyl(.42*o.k,.3*o.k,.14,10),[0,D+h*.72,z],0,null,mc);
    shipShrouds(B,H,z,D+h*.72,3,.55,rc);
    // S330 — the yards and sails a rig of their own (o.rigs), braced round the mast by shipTrim
    const R=o.rigs?new ShipBake():B,zr=o.rigs?0:z;
    const yy=D+h*.66;R.rod([-yardW/2,yy,zr+.18],[yardW/2,yy,zr+.18],.06*o.k,.06*o.k,mc,6);
    shipSail(R,yardW*.94,yardW*1.02,sailH,yardW*.11,o.sail,o.seam,[0,yy-.05,zr+.22]);
    if(o.topsail){const y2=D+h*.95;R.rod([-yardW*.35,y2,zr+.14],[yardW*.35,y2,zr+.14],.045,.045,mc,6);shipSail(R,yardW*.66,yardW*.84,h*.2,yardW*.07,o.sail,o.seam,[0,y2-.04,zr+.18]);}
    if(o.rigs)o.rigs.push({geo:R.bake(),z,type:'square'});
    return yy;}
  const SHIP_LOOKS={
    player:{strakes:[0x6a4424,0x5c3a1e,0x714a28],wale:0x3a2410,band:null,bottom:0x2e2620,sail:0xece2c8,seam:0xdccfac,trim:0x3a2410,deck:[0xa8865a,0x9c7c52,0xb08e62]},
    pirate:{strakes:[0x2e2824,0x26201c,0x322a24],wale:0x6a1a14,band:0x1a1614,bottom:0x1e1a16,sail:0x2a2624,seam:0x1e1a18,trim:0x6a1a14,deck:[0x6a5a44,0x5e503c,0x72604a]},
    merchant:{strakes:[0x7a5a34,0x6e5030,0x84623a],wale:0x2a4a3a,band:0x3a6a52,bottom:0x3a2e24,sail:0xeee2c6,seam:0xa84a30,trim:0x2a4a3a,deck:[0xb09264,0xa48658,0xb89a6c]}
  };
  const SHIP_GEO=new Map();
  // kind 'sloop' | 'cog' | 'galleon'; look 'player' | 'pirate' | 'merchant'. One bake per kind and look, shared.
  function shipBake(kind,look){const key=kind+'|'+look;let r=SHIP_GEO.get(key);if(r)return r;
    const D=SHIP_DECK,lk=SHIP_LOOKS[look]||SHIP_LOOKS.player;const B=new ShipBake();
    const cls={sloop:{L:13,W:4.4},cog:{L:17,W:5.6},galleon:{L:22,W:7.0}}[kind];const L=cls.L,W=cls.W;
    const hopt={sloop:{draft:1.05,sheer:.42,bowRise:.45,sternRise:.3,stem:2.4,transom:.34,full:1.8},
      cog:{draft:1.25,sheer:.55,bowRise:.85,sternRise:.9,stem:1.4,transom:0,full:1.3},
      galleon:{draft:1.5,sheer:.5,bowRise:.7,sternRise:1.25,stem:3.0,transom:.62,full:2.0}}[kind];
    const H=shipHull(Object.assign({L,W,strakes:lk.strakes,wale:lk.wale,band:lk.band,bottom:lk.bottom,transomCol:lk.strakes[1],stations:kind==='galleon'?34:28},hopt));
    B.add(H.geo);if(H.tgeo)B.add(H.tgeo);const deckAt=shipDeck(B,H,L,lk.deck);
    shipRail(B,H,.06,lk.trim,.02);shipWale(B,H,D-.15,.07,lk.wale);shipKeel(B,H,.09,lk.trim,kind==='cog'?.2:.45);
    const st=H.at(H.zs+.01);B.rod([0,st.k-.1,H.zs-.05],[0,st.g+.1,H.zs-.12],.08,.08,lk.trim,5);
    const rud=new THREE.BoxGeometry(.12,1,1);rud.translate(0,-.5,-.5);B.add(rud,[0,D-.15,H.zs-.1],null,[1,1.1+hopt.draft*.7,.8],lk.trim);
    const bow=H.at(H.zb-.3);const sp=kind==='cog'?1.8:kind==='galleon'?6:4.4;const bz=H.zb-.6,by=bow.g-.05;
    const spA=[0,by-.15,bz-1.2],spB=[0,by+sp*.35,bz+sp];B.rod(spA,spB,.13,.06,lk.trim,6);
    B.add(SK.cyl(.1,.13,.95,6),[0,D+.475,-L/2+2.92],0,null,0x4a3018); // the wheel's post; the wheel itself turns (shipWheelMesh)
    shipHatch(B,L/2-3.2);
    shipLantern(B,0,H.at(-L/2).g+.55,H.zs+.15);
    shipBarrel(B,W/2-.7,-1.6);shipBarrel(B,W/2-.75,-2.25,0x6a4a22);shipCrate(B,-W/2+.8,-1.9,.7,.3);shipCrate(B,-W/2+.75,-2.6,.55,-.2);
    const rigs=[];const mopt={k:kind==='galleon'?1.25:kind==='cog'?1.1:1,sail:lk.sail,seam:lk.seam,rope:0x2e2820,mast:0x5a3c1e,rigs};
    let mastTop=D+8.6,mastZ=.6;
    if(kind==='sloop'){
      // one mast, a gaff mainsail aft of it and a jib to the bowsprit
      const mz=.6,mh=8.6;B.add(SK.cyl(.11,.17,mh+.8,8),[0,D-.8+(mh+.8)/2,mz],0,null,0x5a3c1e);
      shipShrouds(B,H,mz,D+mh*.85,2,.5,0x2e2820);
      B.rod([0,D+mh*.85,mz],[0,by+sp*.33,bz+sp-.2],.022,.022,0x2e2820,3);B.rod([0,D+mh,mz],[0,H.at(-L/2).g,-L/2+.3],.02,.02,0x2e2820,3);
      shipGaff(B,mz,D+1.6,D+mh*.82,7.2,5.2,lk,rigs);
      // the jib, filled: a triangle from the masthead to the bowsprit and the deck at the bow, bellied to leeward
      const jh=[0,D+mh*.82,mz+.25],jt=[0,by+sp*.3,bz+sp-.5],jc=[.3,D+.6,L/2-.8];const jp=[],jcl=[];const N=7;const c=shC(lk.sail);
      const pt=(a,b)=>{const w=1-a-b;return [jh[0]*w+jt[0]*a+jc[0]*b+12*a*b*w,jh[1]*w+jt[1]*a+jc[1]*b,jh[2]*w+jt[2]*a+jc[2]*b];};
      for(let i=0;i<N;i++)for(let j=0;j<N-i;j++){const A=pt(i/N,j/N),Bq=pt((i+1)/N,j/N),Cq=pt(i/N,(j+1)/N);jp.push(...A,...Bq,...Cq);jcl.push(c.r,c.g,c.b,c.r,c.g,c.b,c.r,c.g,c.b);
        if(j<N-i-1){const Dq=pt((i+1)/N,(j+1)/N);jp.push(...Bq,...Dq,...Cq);jcl.push(c.r,c.g,c.b,c.r,c.g,c.b,c.r,c.g,c.b);}}
      const jg=new THREE.BufferGeometry();jg.setAttribute('position',new THREE.Float32BufferAttribute(jp,3));jg.setAttribute('color',new THREE.Float32BufferAttribute(jcl,3));jg.computeVertexNormals();const JB=new ShipBake();JB.add(jg);rigs.push({geo:JB.bake(),z:0,type:'jib'});
    }
    if(kind==='cog'){
      // one tall mast, one great square sail; castle rails on posts over the raised ends (the deck stays flat to walk on)
      shipSquareMast(B,H,.4,10.5,8.2,6.6,Object.assign({top:true},mopt));mastTop=D+10.5;mastZ=.4;
      B.rod([0,D+10.5*.72,.4],[0,by+sp*.3,bz+sp-.1],.025,.025,0x2e2820,3);
      for(const [z0,z1] of [[-L/2+.2,-L/2+3.2],[L/2-1.8,L/2+.8]])for(const s of [1,-1]){for(let z=z0;z<=z1+.01;z+=.75){const a=H.at(z);B.rod([a.b*s*.96,a.g,z],[a.b*s*.96,a.g+.55,z],.045,.045,lk.trim,4);}
        const pts=[];for(let z=z0;z<=z1+.01;z+=.5){const a=H.at(z);pts.push(new THREE.Vector3(a.b*s*.96,a.g+.55,z));}B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.05,4,false),null,null,null,lk.trim);}
      if(look!=='pirate'){const sh=H.at(0);for(const s of [1,-1])for(let k=0;k<4;k++){const z=-2.4+k*1.5;B.add(SK.cyl(.36,.36,.06,10),[sh.b*s*1.03,sh.g-.28,z],[0,0,Math.PI/2],null,[0xa83a2a,0xd8c49a,0x2a4a7a,0xd8c49a][k]);}}
    }
    if(kind==='galleon'){
      // fore and main square-rigged with topsails, a gaff mizzen; the spritsail hangs from a yard under the bowsprit,
      // a third of the way out (the prototype's hung far ahead of the bow)
      shipSquareMast(B,H,5.2,10.5,7.4,5.8,Object.assign({top:true,topsail:true},mopt));
      shipSquareMast(B,H,-.4,13,9.4,7.2,Object.assign({top:true,topsail:true},mopt));mastTop=D+13;mastZ=-.4;
      const mz=-6.6,mh=9;B.add(SK.cyl(.12,.19,mh+.8,8),[0,D-.8+(mh+.8)/2,mz],0,null,0x5a3c1e);
      shipShrouds(B,H,mz,D+mh*.8,2,.5,0x2e2820);
      shipGaff(B,mz,D+1.9,D+mh*.78,4.6,3.6,lk,rigs);
      const t=.36,sy=spA[1]+(spB[1]-spA[1])*t-.18,sz=spA[2]+(spB[2]-spA[2])*t;
      B.rod([-2.1,sy,sz],[2.1,sy,sz],.045,.045,0x5a3c1e,5);shipSail(B,4.0,4.3,1.7,.4,lk.sail,lk.seam,[0,sy-.05,sz+.05]);
      for(const [a,b] of [[[0,D+13*.72,-.4],[0,D+10.5*.72,5.2]],[[0,D+10.5*.72,5.2],[0,by+sp*.3,bz+sp-.2]],[[0,D+9*.8,mz],[0,D+13*.72,-.4]]])B.rod(a,b,.025,.025,0x2e2820,3);
      const tz=H.zs-.02;for(let k=-2;k<=2;k++){B.add(new THREE.BoxGeometry(.5,.55,.06),[k*.72,D+.55,tz],0,null,0x1a1a22);B.add(new THREE.BoxGeometry(.62,.08,.1),[k*.72,D+.87,tz],0,null,0xc8a040);}
      B.add(new THREE.BoxGeometry(4.2,.12,.14),[0,D+.2,tz],0,null,0xc8a040);
      const gp=look==='merchant'?0:6;for(const s of [1,-1])for(let k=0;k<gp;k++){const z=-5+k*2.1;const a=H.at(z);B.add(new THREE.BoxGeometry(.06,.42,.5),[a.b*s*1.005,D-.45,z],0,null,0x1a1614);}
      shipLantern(B,-1.6,H.at(-L/2).g+.5,H.zs+.2);shipLantern(B,1.6,H.at(-L/2).g+.5,H.zs+.2);
    }
    if(look==='pirate'){const fl=new THREE.PlaneGeometry(1.4,.9,3,1);const p=fl.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*3)*.08);fl.computeVertexNormals();
      const FB=new ShipBake();FB.add(fl,[0,mastTop+.9,-.8],[0,Math.PI/2,0],null,0x111111);FB.add(SK.ball(.14,8,6),[.03,mastTop+.95,-.8],0,[1,1,.6],0xd8d0c0);rigs.push({geo:FB.bake(),z:mastZ,type:'flag'});/* S332 — the black flag streams downwind */B.rod([0,mastTop,mastZ],[0,mastTop+1.4,mastZ],.03,.03,0x2a2622,4);}
    r={geo:B.bake(),deck:deckAt,L,W,zs:H.zs,zb:H.zb,rigs};SHIP_GEO.set(key,r);return r;}
  // a harbour boat: an open clinker boat with thwarts, oars shipped, a stubby mast with the sail furled; four paints
  function boatBake(v){const key='boat|'+v;let r=SHIP_GEO.get(key);if(r)return r;
    const R=(()=>{let s=(v*2654435761+12345)>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};})();const B=new ShipBake();const paint=[0x5a6a4a,0x6a3a2a,0x3a4a6a,0x7a6a4a][v%4];
    const L=6,W=2.2,G=.55;const H=shipHull({L,W,draft:.55,sheer:G-SHIP_DECK,bowRise:.35,sternRise:.25,stem:1.0,transom:.4,full:1.5,rows:9,stations:20,strakes:[0x7a5634,0x6a4a2c,0x84603a],band:null,wale:null,bottom:0x3a3028});
    B.add(H.geo);if(H.tgeo)B.add(H.tgeo);const at=z=>H.at(z);
    for(const side of [1,-1]){const pts=H.gpts.filter((q,i)=>i%2===0).map(q=>new THREE.Vector3(q.x*side,q.y+.02,q.z));B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,.05,4,false),null,null,null,paint);}
    const pts=H.kpts.filter((q,i)=>i%2===0).map(q=>new THREE.Vector3(0,q.y,q.z));B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,.06,4,false),null,null,null,paint);
    B.add(new THREE.BoxGeometry(W*.5,.04,L*.72),[0,at(0).k+.22,-.1],0,null,0x9a7a4a);
    for(const z of [-1.7,-.2,1.2]){const a=at(z);B.add(new THREE.BoxGeometry(a.b*1.9,.07,.3),[0,a.g-.2,z],0,null,0xa0804e);}
    const st=at(-L/2);B.add(new THREE.BoxGeometry(st.b*1.8,.07,.9),[0,st.g-.22,-L/2+.3],0,null,0xa0804e);
    for(const s of [.3,-.3]){B.rod([s,at(0).g-.1,-2.2],[s*.8,at(0).g-.08,2.1],.03,.03,0xb09060,4);B.add(new THREE.BoxGeometry(.14,.02,.55),[s*.8,at(0).g-.08,2.3],0,null,0xb09060);}
    const mz=1.2,mh=3.6;B.add(SK.cyl(.05,.08,mh,6),[0,at(mz).k+mh/2+.1,mz],0,null,0x5a3c1e);
    const yy=at(mz).k+mh-.2;B.rod([0,yy,mz+.1],[0,yy-.9,mz-2.2],.035,.03,0x5a3c1e,5);B.rod([0,yy-.12,mz-.05],[0,yy-.95,mz-2.1],.1,.07,0xd8ccae,8);
    B.add(SK.torus(.16,.04,5,12),[.35,at(-1).k+.3,-1],[Math.PI/2,0,0],null,0x8a7a58);
    B.add(SK.bumpy(SK.ball(.28,10,6,0,Math.PI*2,0,1.8),.05,11,R()*9),[-.2,at(.5).k+.28,.5],0,[1,.5,1.3],0x8a8060);
    B.add(SK.lathe([[.001,0],[.16,0],[.2,.22],[.19,.24],[.001,.24]],9),[.3,at(-2.4).k+.24,-2.4],0,null,0x9a7a40);
    r={geo:B.bake()};SHIP_GEO.set(key,r);return r;}
  // a point in world space against a ship's deck: in the mesh's frame (turned by rotation.y), within the deck's breadth there
  function onShipDeck(mesh,wx,wz){const d=mesh.userData.deck;if(!d)return true;const ry=mesh.rotation.y,c=Math.cos(ry),s=Math.sin(ry);
    const dx=wx-mesh.position.x,dz=wz-mesh.position.z;const lx=dx*c-dz*s,lz=dx*s+dz*c;return Math.abs(lx)<d.at(lz)-.1;}
  // the ship's mesh: the class by its length, the look by who sails her; the wheel a child that turns with the helm
  function buildShipMesh(SHIP_L,SHIP_W,look){
    const kind=(SHIP_L||13)>=20?'galleon':(SHIP_L||13)>=15?'cog':'sloop';const r=shipBake(kind,look||'player');
    const mesh=new THREE.Mesh(r.geo,SHIP_MAT);mesh.castShadow=true;mesh.receiveShadow=true;
    const wheel=shipWheelMesh();wheel.position.set(0,SHIP_DECK+.95,-r.L/2+2.8);mesh.add(wheel);
    mesh.userData.wheel=wheel;mesh.userData.deck=r.deck;mesh.userData.kind=kind;
    mesh.userData.rigs=(r.rigs||[]).map(q=>{const m=new THREE.Mesh(q.geo,SHIP_MAT);m.castShadow=true;m.position.z=q.z;mesh.add(m);return {m,type:q.type,a:0};});
    mesh.userData.trimSnap=true;
    return mesh;
  }
  // S330 (Michael's 1, #57) — trim a ship's sails to the wind. th is the way the wind blows, against the bow in the hull's frame (0 dead astern,
  // +/-PI/2 on the beam, towards +x or -x). Square yards brace round to bisect the wind and the bow, at most 35 degrees; a gaff's
  // boom swings to leeward, out to 72 degrees running and in to 15 close-hauled; the gaff sails and the jib belly to leeward
  function shipTrim(mesh,th,dt){const R=mesh&&mesh.userData.rigs;if(!R)return;th=Math.atan2(Math.sin(th),Math.cos(th));const side=Math.sin(th)>=0?1:-1;
    for(const q of R){let t=0;if(q.type==='square')t=Math.max(-.61,Math.min(.61,th/2));else if(q.type==='gaff')t=-side*Math.max(.26,Math.min(1.25,(Math.PI-Math.abs(th))/2));
      // S332 — a flag has no bound: it points the way the wind goes (its cloth runs aft at 0) and turns the short way round, quicker than a sail
      if(q.type==='flag'){t=th+Math.PI;const d=Math.atan2(Math.sin(t-q.a),Math.cos(t-q.a));q.a=dt==null?t:q.a+d*Math.min(1,dt*3);q.m.rotation.y=q.a;continue;}
      q.a=dt==null?t:q.a+(t-q.a)*Math.min(1,dt*1.2);q.m.rotation.y=q.a;if(q.type!=='square')q.m.scale.x=side;}}
  // every ship afloat trims to the world's wind; a ship just built sets its sails at once, then eases round through a turn
  function tickSailTrim(dt){const w=windDir();const one=m=>{if(!m||!m.userData.rigs)return;const snap=m.userData.trimSnap;m.userData.trimSnap=false;shipTrim(m,w-m.rotation.y,snap?null:dt);};
    one(SHIP.mesh);for(const o of OTHER)one(o.mesh);}
  // the deck platform's box: the hull turned by yaw (the bow's deck reaches past L/2 now); the deck's own outline is plat.inside
  function shipPlatBox(plat,mesh,x,z,yaw,L,W){const d=mesh&&mesh.userData.deck;const hl=d?Math.max(-d.z0,d.z1):L/2;
    const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw));const hw=W/2*c+hl*s,hd=W/2*s+hl*c;
    plat.x0=x-hw;plat.x1=x+hw;plat.z0=z-hd;plat.z1=z+hd;if(mesh&&!plat.inside)plat.inside=(wx,wz)=>onShipDeck(mesh,wx,wz);}
  function shipUpdatePlacement(){
    const m=SHIP.mesh;if(!m)return;
    m.position.set(SHIP.x,SEA_Y+Math.sin(performance.now()*.0012)*.05,SHIP.z);m.rotation.y=SHIP.yaw+Math.PI; // mesh +z is the prow; movement forward is (-sin,-cos)
    m.rotation.z=Math.sin(performance.now()*.0017)*.02;
    // deck platform: the box around the turned hull, and within it the deck's own outline (S168)
    if(!SHIP.plat){SHIP.plat={x0:0,x1:0,z0:0,z1:0,y:DECK_Y,ship:true};ZONES.world.platforms.push(SHIP.plat);}
    if(SHIP.plat.mesh!==m){SHIP.plat.mesh=m;SHIP.plat.inside=null;}m.updateMatrix();
    shipPlatBox(SHIP.plat,m,SHIP.x,SHIP.z,SHIP.yaw,SHIP.L,SHIP.W);
    // the wheel in world space
    const wx=-Math.sin(SHIP.yaw)*(-SHIP.L/2+2.8),wz=-Math.cos(SHIP.yaw)*(-SHIP.L/2+2.8);
    SHIP.wheel.x=SHIP.x+wx;SHIP.wheel.z=SHIP.z+wz;
    // the helmsman stands a pace aft of the wheel, looking forward over it
    SHIP.helm={x:SHIP.x-Math.sin(SHIP.yaw)*(-SHIP.L/2+1.7),z:SHIP.z-Math.cos(SHIP.yaw)*(-SHIP.L/2+1.7)};
    if(m.userData.wheel)m.userData.wheel.rotation.z=(SHIP.sailing?SHIP.turn||0:0)*.6;
  }
  function spawnShip(x,z,yaw){
    const cc=shipClass();SHIP.L=cc.L;SHIP.W=cc.W;
    if(!SHIP.mesh){SHIP.mesh=buildShipMesh(SHIP.L,SHIP.W);sc.add(SHIP.mesh);}
    SHIP.x=x;SHIP.z=z;SHIP.yaw=yaw||0;SHIP.speed=0;SHIP.sailing=false;
    SHIP.name=(worldState.ship&&worldState.ship.name)||SHIP_NAMES[Math.floor(Math.random()*SHIP_NAMES.length)];
    Object.assign(worldState.ship||(worldState.ship={}),{x,z,yaw:SHIP.yaw,name:SHIP.name});shipUpdatePlacement();
  }
  function restoreShip(){if(worldState.ship&&!worldState.ship.sunk&&!SHIP.mesh)spawnShip(worldState.ship.x,worldState.ship.z,worldState.ship.yaw);}
  // buy at a shipwright: the ship appears off the seaward end of the quay
  function buyShip(site){
    if(worldState.ship)return 'You have a ship already. She\u2019s wherever you left her.';
    const price=shipPriceNow();
    if(gold<price)return `A hull is ${price} gold. Come back when your purse is heavier.`;
    const plat=ZONES.world.platforms.find(p=>p.site===site.id);const sd=shoreDir(site);
    if(!plat||!sd)return 'No berth here to launch from.';
    const ex=sd.dx?(sd.dx>0?plat.x1:plat.x0):(plat.x0+plat.x1)/2,ez=sd.dz?(sd.dz>0?plat.z1:plat.z0):(plat.z0+plat.z1)/2;
    const bx=ex+sd.dx*4-sd.dz*(SHIP.W/2+6),bz=ez+sd.dz*4+sd.dx*(SHIP.W/2+6);
    gold-=price;updateHUD();spawnShip(bx,bz,Math.atan2(sd.dx,sd.dz));if(price<SHIP_PRICE&&typeof addLog==='function')addLog('📜',"The shipwright read Corwin's note and took a quarter off.");
    if(typeof addLog==='function')addLog('⛵',`Bought a ship at ${site.name}.`);
    return `She\u2019s the ${SHIP.name}, and she\u2019s yours — moored off the seaward end of the quay, ${compassWord(bx-site.x,bz-site.z)} of here. Walk out, press E beside her to board, E again for the wheel.`;
  }
  // E near the wheel takes / leaves the helm
  function onDeck(){const p=SHIP.plat;return !!p&&px>p.x0&&px<p.x1&&pz>p.z0&&pz<p.z1&&(!p.inside||p.inside(px,pz))&&Math.abs(jumpY-DECK_Y)<1;}
  function hullDist(){const p=SHIP.plat;if(!p)return 1e9;const dx=Math.max(p.x0-px,0,px-p.x1),dz=Math.max(p.z0-pz,0,pz-p.z1);return Math.hypot(dx,dz);}
  function nearShip(){return !!SHIP.mesh&&!onDeck()&&hullDist()<3.5&&jumpY<4;}
  function nearWheel(){return onDeck()&&Math.hypot(px-SHIP.wheel.x,pz-SHIP.wheel.z)<2.4;}
  function shipInteract(){
    if(roofInteract())return true;
    if(coachInteract())return true;
    if(shrineInteract())return true;
    if(catchFish())return true;
    if(otherInteract())return true;
    if(!SHIP.mesh)return false;
    if(!SHIP.sailing&&cabinPrompt()){goToInterior(CABIN.house);return true;}
    if(SHIP.sailing){SHIP.sailing=false;SHIP.speed=0;Object.assign(worldState.ship,{x:SHIP.x,z:SHIP.z,yaw:SHIP.yaw,name:SHIP.name});showMsg('You let go of the wheel.','#c8b880');return true;}
    if(nearWheel()){px=SHIP.helm.x;pz=SHIP.helm.z;jumpY=DECK_Y;yaw=SHIP.yaw;SHIP.sailing=true;showMsg(`You take the wheel of the ${SHIP.name}. W/S sail, A/D turn, E to let go.`,'#c8b880');return true;}
    if(nearShip()){px=SHIP.x-Math.sin(SHIP.yaw)*-1.5;pz=SHIP.z-Math.cos(SHIP.yaw)*-1.5;jumpY=DECK_Y;onGround=true;velY=0;showMsg('You climb aboard. E again for the wheel.','#c8b880');return true;}
    return false;
  }
  function nearNpcName(){let best=null,bd=3.2;for(const n of npcs){if(n._retreated||!n.g.visible)continue;const d=Math.hypot(n.g.position.x-px,n.g.position.z-pz);if(d<bd){bd=d;best=n;}}return best?`${best.def.name}${best.def.role&&best.def.role!=='Villager'?' — '+best.def.role:''}`:null;}
  function roofPrompt(){for(const S of SETTLE.values()){if(!S.roof)continue;if(Math.abs(jumpY-S.roof.y)<1.2&&Math.hypot(px-S.roof.hatch.x,pz-S.roof.hatch.z)<1.4)return "Press 'E' to climb back down";}return null;}
  function roofInteract(){for(const S of SETTLE.values()){if(!S.roof)continue;if(Math.abs(jumpY-S.roof.y)<1.2&&Math.hypot(px-S.roof.hatch.x,pz-S.roof.hatch.z)<1.4){const hs=ZONES.world.houses.find(x=>x.type==='tower'&&x.siteId===S.site.id);if(!hs)return false;window._pendingPos={x:4.5,z:4.5-2.2+1.0,yaw:0,jumpY:30};goToInterior(hs);return true;}}return false;}
  function shipPrompt(){const rp=roofPrompt();if(rp)return rp;const cop=coachPrompt();if(cop)return cop;const sp=shrinePrompt();if(sp)return sp;const fp=fishPrompt();if(fp)return fp;const op=otherPrompt();if(op)return op;if(!SHIP.mesh)return null;if(SHIP.sailing)return "Press 'E' to let go of the wheel";const cp=cabinPrompt();if(cp)return cp;if(nearWheel())return `Press 'E' to pilot the ${SHIP.name}`;if(nearShip())return `Press 'E' to board the ${SHIP.name}`;return null;}
  // ── sea sounds (use the engine's AX / sfxGain) ──
  const SND={wind:null,windG:null,creakT:0,splashT:0,wasSwim:false};
  function ensureWind(){if(SND.wind||typeof AX==='undefined'||!AX)return;const buf=AX.createBuffer(1,AX.sampleRate*2,AX.sampleRate);const d=buf.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){l=l*.97+(Math.random()*2-1)*.03;d[i]=l*4;}const src=AX.createBufferSource();src.buffer=buf;src.loop=true;const f=AX.createBiquadFilter();f.type='lowpass';f.frequency.value=380;const g=AX.createGain();g.gain.value=0;src.connect(f);f.connect(g);g.connect(sfxGain);src.start();SND.wind=src;SND.windG=g;}
  function creak(){if(typeof sfxNoise==='function'){sfxNoise(.35,0,0,.09,220);sfxTone(90,60,.3,.05,'triangle');}}
  function splash(big){if(typeof sfxNoise==='function'){sfxNoise(big?.5:.25,0,0,big?.22:.09,big?1400:2600);}}
  function tickSeaSounds(dt){
    const swim=isSwimming();if(swim&&!SND.wasSwim)splash(true);SND.wasSwim=swim;
    if(swim){SND.splashT-=dt;if(SND.splashT<=0){SND.splashT=.9+Math.random()*.9;if(KEYS.KeyW||KEYS.KeyA||KEYS.KeyS||KEYS.KeyD)splash(false);}}
    if(!SHIP.mesh)return;
    ensureWind();
    if(SND.windG){const target=SHIP.sailing?Math.min(.35,Math.abs(SHIP.speed)/7.5*.35):0;SND.windG.gain.value+=(target-SND.windG.gain.value)*Math.min(1,dt*2);}
    if(SHIP.sailing&&Math.abs(SHIP.speed)>1){SND.splashT-=dt;if(SND.splashT<=0){SND.splashT=1.2+Math.random()*1.6;splash(false);}}
    if(SHIP.sailing&&SHIP.turn){SND.creakT-=dt;if(SND.creakT<=0){SND.creakT=.9+Math.random()*1.2;creak();}}else SND.creakT=0;
  }
  function tickShip(dt){
    tickSeaSounds(dt);
    SHIP._raiseT=(SHIP._raiseT||0)-dt;if(SHIP._raiseT<=0){SHIP._raiseT=1;tickShipRaise();}
    if(!SHIP.mesh)return;
    if(worldState.ship&&(SHIP.sailing||onDeck())){SHIP._seaT=(SHIP._seaT||0)-dt;if(SHIP._seaT<=0){SHIP._seaT=1;SHIP.sea=seaState();}}else SHIP._seaT=0;
    if(SHIP.sailing){
      const fwd=(KEYS.KeyW?1:0)-(KEYS.KeyS?.5:0),turn=(KEYS.KeyA?1:0)-(KEYS.KeyD?1:0);SHIP.turn=turn;
      const target=fwd*shipSpeedNow();SHIP.speed+=(target-SHIP.speed)*Math.min(1,dt*.8);
      SHIP.yaw+=turn*dt*.55*Math.min(1,Math.abs(SHIP.speed)/3+.3);
      const fx=-Math.sin(SHIP.yaw),fz=-Math.cos(SHIP.yaw);
      // keep the bow in water
      const probe=Math.sign(SHIP.speed)||1;const bx=SHIP.x+fx*probe*(SHIP.L/2+2),bz=SHIP.z+fz*probe*(SHIP.L/2+2);
      const WMAX=SIZE*GRID;
      if(worldH(bx,bz)>SEA_Y-1.4||bx<20||bz<20||bx>WMAX-20||bz>WMAX-20){const v=Math.abs(SHIP.speed);const w=v>2&&shipBars().hull>0?shipWear((v-2)*4,0):null;if(w&&w.hull)showMsg(`Aground — she strikes the shallows. Hull −${w.hull}.`,'#ff8060');else if(v>.5)showMsg('Aground — shallows ahead.','#c8b880');SHIP.speed=0;}
      SHIP.x+=fx*SHIP.speed*dt;SHIP.z+=fz*SHIP.speed*dt;
      tickSeaWear(dt,fwd);
      // the player stands at the wheel
      px=SHIP.helm.x;pz=SHIP.helm.z;jumpY=DECK_Y;onGround=true;velY=0;
      Object.assign(worldState.ship,{x:SHIP.x,z:SHIP.z,yaw:SHIP.yaw,name:SHIP.name});
    }
    shipUpdatePlacement();
  }
  // Swimming: the water surface is the ground wherever the bed is deep.
  const SWIM_Y=SEA_Y-.35;
  function groundY(x,z){const h=worldH(x,z);if(h<SWIM_Y&&typeof fxOn==='function'&&fxOn('waterwalk'))return SEA_Y+.06;return h<SWIM_Y?SWIM_Y:h;}
  function isSwimming(){if(typeof fxOn==='function'&&fxOn('waterwalk'))return false;return activeZoneId==='world'&&!SHIP.sailing&&worldH(px,pz)<SWIM_Y-.05&&jumpY<SWIM_Y+.3&&!onAnyPlatform();}
  function onAnyPlatform(){for(const p of ZONES.world.platforms){if(px>p.x0&&px<p.x1&&pz>p.z0&&pz<p.z1&&(!p.inside||p.inside(px,pz))&&Math.abs(jumpY-p.y)<1.2)return true;}return false;}

  // ═══ UNDER THE WATER (Session D) ═════════════════════════════════════
  // Diving: while swimming, look down and hold W to dive, look up (or Space)
  // to rise; let go and you drift up slowly. Breath lasts ~40 s underwater,
  // then you take damage. The camera below the surface gets blue fog.
  const DIVE={depth:null,breath:1,under:false,ui:null,hurtT:0};
  const BREATH_S=40;
  function diveTick(dt,surfaceY){
    // called from the engine's terrain follow with the ground/surface y; returns the y to hold, or null
    const bed=worldH(px,pz);
    // standing on something above the water (quay, deck, another ship): not swimming
    if(surfaceY>SWIM_Y+.2){DIVE.depth=null;DIVE.under=false;DIVE.breath=Math.min(1,DIVE.breath+dt/6);breathUI();return null;}
    if(!(bed<SWIM_Y-.3)||SHIP.sailing){DIVE.depth=null;if(DIVE.under){DIVE.under=false;}DIVE.breath=Math.min(1,DIVE.breath+dt/6);breathUI();return null;}
    if(DIVE.depth==null)DIVE.depth=SWIM_Y;
    const fwd=KEYS.KeyW,down=pitch<-.35,up=pitch>.35||KEYS.Space;
    let vy=0;
    if(fwd&&down)vy=-2.2;else if((fwd&&up)||KEYS.Space)vy=2.4;else if(!fwd)vy=.6; // buoyancy
    DIVE.depth=Math.max(bed+.55,Math.min(SWIM_Y,DIVE.depth+vy*dt));
    const under=DIVE.depth<SWIM_Y-.15;
    if(under!==DIVE.under){DIVE.under=under;if(under)splash(false);}
    if(under){if(!(typeof fxOn==='function'&&fxOn('waterbreath')))DIVE.breath=Math.max(0,DIVE.breath-dt/BREATH_S);if(DIVE.breath<=0){DIVE.hurtT-=dt;if(DIVE.hurtT<=0){DIVE.hurtT=1;PHP=Math.max(0,PHP-6);updateHUD();if(PHP<=0&&typeof playerDead==='function')playerDead();}}}
    else DIVE.breath=Math.min(1,DIVE.breath+dt/4);
    breathUI();return DIVE.depth;
  }
  function breathUI(){
    if(typeof document==='undefined'||!document.body)return;
    let el=DIVE.ui;if(!el){el=document.createElement('div');if(!el.style)return;el.id='breath';el.style.cssText='position:fixed;left:50%;bottom:120px;transform:translateX(-50%);width:220px;height:10px;background:rgba(10,20,40,.7);border:1px solid #8ab;border-radius:5px;display:none;z-index:50';el.innerHTML='<div id="breath-fill" style="height:100%;width:100%;background:#7ac8ff;border-radius:4px"></div>';document.body.appendChild(el);DIVE.ui=el;}
    const show=DIVE.under||DIVE.breath<1;el.style.display=show?'block':'none';const f=el.firstChild;f.style.width=(DIVE.breath*100)+'%';f.style.background=DIVE.breath<.25?'#ff6060':'#7ac8ff';
  }
  function cameraUnderwater(){return activeZoneId==='world'&&(jumpY+.92)<SEA_Y+.05&&worldH(px,pz)<SWIM_Y;}

  // ── sea-floor herbs ──
  function ensureSeaHerbs(){
    if(typeof HERB_DEF==='undefined'||HERB_DEF.kelp)return;
    const base=HERB_DEF.firemoss||Object.values(HERB_DEF)[0];if(!base)return;
    const mk=(k,name,col,stem,shape,desc,known,item)=>{HERB_DEF[k]=Object.assign({},base,{name,ico:'🌿',zone:'sea',col,glowCol:col,glowInt:.35,glowRad:1.6,stemCol:stem,shape,respawn:240,desc,knownDesc:known,item:Object.assign({},base.item||{},item)});};
    mk('kelp','Kelp',0x2a6a4a,0x1e4a34,'clump','Long green fronds that lean with the current.','Restores 20 stamina',{name:'Kelp',type:'herb',effect:{stam:20},weight:.3,sellMult:.3,buyPrice:6});
    mk('sealily','Sea Lily',0xd8d0f0,0x6a6a8a,'single','A pale flower that opens on the sea bed.','Restores 15 mana',{name:'Sea Lily',type:'herb',effect:{mana:15},weight:.2,sellMult:.5,buyPrice:14});
    mk('pearlweed','Pearlweed',0xc0e0e8,0x4a6a6a,'clump','Beaded weed that shines faintly in the dark.','Restores 25 HP',{name:'Pearlweed',type:'herb',effect:{heal:25},weight:.2,sellMult:.6,buyPrice:18});
  }
  function spawnSeaHerbs(ch){
    if(typeof mkHerbMesh!=='function')return;ensureSeaHerbs();if(!HERB_DEF.kelp)return;
    const n=Math.floor(hash01(ch.cx,ch.cz,140)*3.2);
    for(let i=0;i<n;i++){
      const hx=ch.cx*CHUNK+4+hash01(ch.cx+i,ch.cz,141)*(CHUNK-8),hz=ch.cz*CHUNK+4+hash01(ch.cz,ch.cx+i,142)*(CHUNK-8);
      const bed=worldH(hx,hz);if(bed>-1.2||bed<-9)continue; // shallows and reefs, not the abyss
      const type=['kelp','kelp','sealily','pearlweed'][Math.floor(hash01(ch.cx,ch.cz,143+i)*4)];const def=HERB_DEF[type];
      const {g,gl}=mkHerbMesh(hx,hz,def,sc);if(gl&&gl.parent)gl.parent.remove(gl);g.position.y=bed;
      const h={x:hx,z:hz,type,def,g,gl,harvested:false,respawnT:0,ph:Math.random()*Math.PI*2,bed:true};
      ZONES.world.herbs.push(h);ch.herbs.push(h);
    }
  }
  // ── wrecks: a broken hull on the bed with a chest ──
  // S259 — a wreck on the sea floor: a hull broken in two, each half an open run of bent ribs on a keel with its planking
  // rotted through in places, half sunk in the sand and heeled over, a stem post, the snapped mast across it and loose
  // planks; weed darkening the wood towards the sand. y 0 at the sea floor, the hull along z, about the old 4 by 12.
  function wreckGeo(rr){const P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.08:j});
    const wood=0x3a2a18,weed=0x2a3a24,L=11,DEP=1.7,wOf=t=>2.05*Math.pow(Math.max(0,Math.sin(Math.PI*Math.min(1,Math.max(0,t)))),.55)+.05;
    const tone=y=>new THREE.Color(wood).lerp(new THREE.Color(weed),Math.max(0,Math.min(1,.7-y*.35))).multiplyScalar(.85+rr()*.3).getHex();
    const _m=new THREE.Matrix4(),_up=new THREE.Vector3(0,1,0);
    const board=(a,b,wd,th,col,M)=>{const d=new THREE.Vector3().subVectors(b,a),len=d.length();if(len<.05)return;const g=new THREE.BoxGeometry(wd,th,len);
      _m.lookAt(new THREE.Vector3(),d,_up);g.applyMatrix4(new THREE.Matrix4().extractRotation(_m));g.translate((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);if(M)g.applyMatrix4(M);add(g,col,0,0,0,0,0,0,.08);};
    const half=(t0,t1,M,brokenSide,rot)=>{const n=Math.max(3,Math.round((t1-t0)*L/.95));
      const at=(t,th)=>{const w=wOf(t);return new THREE.Vector3(Math.cos(th)*w,DEP-Math.sin(th)*DEP,(t-.5)*L);};
      for(let i=0;i<=n;i++){const t=t0+(t1-t0)*i/n,w=wOf(t);if(w<.2)continue;const full=rr()<.78,g=SK.torus(w,.08,4,10,full?Math.PI:Math.PI*(.45+rr()*.3));g.rotateZ(Math.PI+(full||rr()<.5?0:Math.PI*.5));g.scale(1,DEP/w,1);g.translate(0,DEP,(t-.5)*L);g.applyMatrix4(M);add(g,tone(.3),0,0,0,0,0,0,.1);}
      board(new THREE.Vector3(0,-.12,(t0-.5)*L),new THREE.Vector3(0,-.12,(t1-.5)*L),.26,.3,0x2a2014,M);
      const K=7;for(let k=0;k<K;k++)for(const s of [1,-1]){const th=(k+.5)/K*Math.PI/2,c=Math.cos(th),hi=1-Math.sin(th);if(s===brokenSide&&hi>.45)continue;
        for(let i=0;i<n;i++){if(rr()<rot+hi*.2)continue;const a=at(t0+(t1-t0)*i/n,th),b=at(t0+(t1-t0)*(i+1)/n,th);a.x*=s;b.x*=s;board(a,b,.36,.06,tone(a.y),M);}}};
    const Mh=(x,y,z,rx,rz)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,rz)),new THREE.Vector3(1,1,1));
    const Ms=Mh(0,-.2,-.4,.04,.32),Mb=Mh(.35,-.15,1.1,.14,-.42);
    half(.02,.54,Ms,1,.08);half(.6,.98,Mb,-1,.15);
    {const g=SK.torus(1.1,.12,4,8,Math.PI*.5);g.rotateY(Math.PI/2);g.translate(0,DEP-1.1+.2,(.99-.5)*L-1.1);g.applyMatrix4(Mb);add(g,0x2a2014,0,0,0,0,0,0,.08);}
    add(SK.cyl(.13,.17,7.2,7),0x2e2214,.4,1.0,.6,1.25,0,.28,.08);add(SK.cyl(.1,.13,1.4,6),0x2e2214,-.9,.25,-3.2,.2,.5,1.4,.08);
    for(let k=0;k<5;k++){const a=rr()*Math.PI*2,d=2.4+rr()*1.2;add(new THREE.BoxGeometry(.32,.06,1.2+rr()*1.4),tone(.1),Math.cos(a)*d,.04,Math.sin(a)*d*1.3,rr()*.2,rr()*3,rr()*.2,.1);}
    return mergeParts(P);}
  function spawnWreck(ch){
    if(hash01(ch.cx,ch.cz,150)>.06)return; // ~1 in 16 candidate chunks
    let x=null,z=null;for(let k=0;k<9&&x===null;k++){const tx=ch.cx*CHUNK+8+hash01(ch.cx+k,ch.cz,151)*(CHUNK-16),tz=ch.cz*CHUNK+8+hash01(ch.cz,ch.cx+k,152)*(CHUNK-16);const b=worldH(tx,tz);if(b<-2.5&&b>-8){x=tx;z=tz;}}
    if(x===null)return;const y=worldH(x,z),ry=hash01(ch.cx,ch.cz,153)*Math.PI*2;
    const c=k=>new THREE.Color(k);
    const m=new THREE.Mesh(wreckGeo(pRng(pHash('wreck|'+ch.cx+'|'+ch.cz))),VC_MAT);m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;ch.group.add(m); // S259 — a broken hull on the kit
    // S259 — the sea chest on the kit (S198's chest, the old box's size), its lid on the hinge
    const chest=new THREE.Group();chest.position.set(x+Math.cos(ry)*2.2,worldH(x+Math.cos(ry)*2.2,z+Math.sin(ry)*2.2),z+Math.sin(ry)*2.2);chest.rotation.set(.08,ry+2.2,-.06);const {lid}=buildChestShell(chest,1.8,0x5a3a1c);ch.group.add(chest);
    let items=(typeof rollContainerLoot==='function'?rollContainerLoot('chest',1.4,null,1):[])||[];
    if(!items.length)items.push({name:'Sea-worn Coins',ico:'🪙',type:'misc',weight:.4,sellMult:1,buyPrice:60});
    items.forEach(it=>{if(it.qty==null)it.qty=1;});
    const cobj={x:chest.position.x,z:chest.position.z,y:chest.position.y+.3,name:'Sea Chest',displayName:'Sea Chest',items,zone:'world',kind:'chest',g:chest,lid,opened:false,_chunk:chunkKey(ch.cx,ch.cz)};
    if(typeof ZONE_CORPSES!=='undefined')ZONE_CORPSES.push(cobj);ch.loot=ch.loot||[];ch.loot.push(cobj);
    ch.sol.push({cx:x,cz:z,rx:2.2,rz:3.6});
  }

  // ═══ THE LIVING SEA (Session D part 2) ═══════════════════════════════
  // Cabin: a door entry that follows the ship; interior type 'cabin'.
  const CABIN={house:{id:'g_ship_cabin',type:'cabin',name:'',keeper:'',doorX:0,doorZ:0,doorFace:'S',exitX:0,exitZ:0,exitYaw:0,w:6,d:7,two:false,reg:'irish',style:'irish',dlg:null,tagline:''}};
  function cabinUpdate(){
    if(!SHIP.mesh)return;const h=CABIN.house;h.name=`The ${SHIP.name} — cabin`;
    const fwd=[-Math.sin(SHIP.yaw),-Math.cos(SHIP.yaw)];
    h.doorX=SHIP.x+fwd[0]*(SHIP.L/2-3.2);h.doorZ=SHIP.z+fwd[1]*(SHIP.L/2-3.2); // forward hatch, clear of the wheel
    h.exitX=SHIP.x+fwd[0]*(SHIP.L/2-4.4);h.exitZ=SHIP.z+fwd[1]*(SHIP.L/2-4.4);h.exitYaw=SHIP.yaw+Math.PI;
    if(!ZONES.world.houses.includes(h))ZONES.world.houses.push(h);
  }
  function cabinPrompt(){if(!SHIP.mesh||SHIP.sailing)return null;const h=CABIN.house;return (Math.hypot(px-h.doorX,pz-h.doorZ)<1.1&&Math.abs(jumpY-DECK_Y)<1)?"Press 'E' to go below":null;}

  // ── whitecaps: foam by crest height + streak noise (used by the water material) ──
  function waterShader(sh){
    sh.uniforms.uTime={value:0};
    sh.vertexShader='uniform float uTime;\nvarying float vFoam;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vec4 wpw=modelMatrix*vec4(position,1.0);\n float w1=sin(wpw.x*0.11+uTime*1.1), w2=sin(wpw.z*0.08-uTime*0.8), w3=sin((wpw.x+wpw.z)*0.05+uTime*0.5), w4=sin(wpw.x*0.31-wpw.z*0.23+uTime*1.9);\n float hgt=w1*0.13+w2*0.11+w3*0.08+w4*0.04;\n transformed.z+=hgt;\n float streak=sin(wpw.x*0.9+wpw.z*0.4+uTime*0.6)*sin(wpw.z*0.7-uTime*0.35);\n vFoam=smoothstep(0.16,0.30,hgt+streak*0.05)*0.85;');
    sh.fragmentShader='varying float vFoam;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.92,0.96,1.0),vFoam);\n diffuseColor.a=mix(diffuseColor.a,1.0,vFoam*0.6);');
  }

  // ── wildlife ──
  const LIFE={fish:[],gulls:[],dolphins:[],sharksT:0};
  function spawnFishSchool(ch){
    // find shallow water somewhere in the chunk (the shore band is narrower than a chunk)
    let cxw=null,czw=null,bed=0;for(let k=0;k<9&&cxw===null;k++){const x=ch.cx*CHUNK+8+hash01(ch.cx+k,ch.cz,167)*(CHUNK-16),z=ch.cz*CHUNK+8+hash01(ch.cz,ch.cx+k,168)*(CHUNK-16);const b=worldH(x,z);if(b<-1.2&&b>-7){cxw=x;czw=z;bed=b;}}
    if(cxw===null||hash01(ch.cx,ch.cz,160)>.45)return;
    const n=10+Math.floor(hash01(ch.cx,ch.cz,161)*8);
    const geo=new THREE.ConeGeometry(.08,.42,4);geo.rotateX(Math.PI/2);
    const im=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({color:0x9ab8c0}),n);
    const school={im,cx:cxw,cz:czw,y:bed+1.2+hash01(ch.cx,ch.cz,164)*1.5,r:3+hash01(ch.cx,ch.cz,165)*3,ph:hash01(ch.cx,ch.cz,166)*Math.PI*2,n,chunk:chunkKey(ch.cx,ch.cz)};
    ch.group.add(im);LIFE.fish.push(school);ch.fish=school;
  }
  const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s1=new THREE.Vector3(1,1,1);
  function tickFish(dt,now){
    for(const s of LIFE.fish){const t=now*.0006+s.ph;for(let i=0;i<s.n;i++){const a=t+i*(Math.PI*2/s.n)*1.3,r=s.r*(.7+.3*Math.sin(i*1.7+t*2));_v.set(s.cx+Math.cos(a)*r,s.y+Math.sin(t*3+i)*.25,s.cz+Math.sin(a)*r);_e.set(0,-a+Math.PI/2,0);_q.setFromEuler(_e);_m4.compose(_v,_q,_s1);s.im.setMatrixAt(i,_m4);}s.im.instanceMatrix.needsUpdate=true;}
  }
  function spawnGulls(S,site){
    const q=site.quayStart||{x:site.x,z:site.z};const n=4;const g=new THREE.Group();
    for(let i=0;i<n;i++){const b=mergeParts([{geo:new THREE.ConeGeometry(.08,.5,4),color:new THREE.Color(0xf0f0f0),rx:Math.PI/2},{geo:new THREE.BoxGeometry(1.1,.02,.18),color:new THREE.Color(0xf0f0f0),y:.02}]);const m=new THREE.Mesh(b,VC_MAT);g.add(m);}
    g.position.set(q.x,0,q.z);S.group.add(g);S.gulls={g,ph:Math.random()*10};LIFE.gulls.push(S.gulls);
  }
  function tickGulls(dt,now){
    for(let i=LIFE.gulls.length-1;i>=0;i--){const gl=LIFE.gulls[i];if(!gl.g.parent){LIFE.gulls.splice(i,1);continue;}
      gl.g.children.forEach((m,k)=>{const t=now*.0004+gl.ph+k*1.6;const r=8+k*3;m.position.set(Math.cos(t)*r,11+Math.sin(t*2.3+k)*1.5,Math.sin(t)*r);m.rotation.y=-t+Math.PI;m.rotation.z=Math.sin(t*3)*.2;});}
  }
  function tickDolphins(dt,now){
    if(!SHIP.mesh||!SHIP.sailing||Math.abs(SHIP.speed)<3){LIFE.dolphins.forEach(d=>{d.m.visible=false;});return;}
    if(!LIFE.dolphins.length){for(let k=0;k<2;k++){const m=new THREE.Mesh(mergeParts([{geo:new THREE.CylinderGeometry(.16,.06,1.5,6),color:new THREE.Color(0x6a7a8a),rx:Math.PI/2,jitter:.05},{geo:new THREE.ConeGeometry(.12,.35,3),color:new THREE.Color(0x5a6a7a),y:.18,z:.1,rx:-.6}]),VC_MAT);sc.add(m);LIFE.dolphins.push({m,ph:k*2.1,side:k?1:-1});}}
    const fwd=[-Math.sin(SHIP.yaw),-Math.cos(SHIP.yaw)];
    LIFE.dolphins.forEach(d=>{const t=now*.0015+d.ph;const along=3+Math.sin(t*.7)*2,out=SHIP.W/2+2.5;const x=SHIP.x+fwd[0]*along+(-fwd[1])*d.side*out,z=SHIP.z+fwd[1]*along+fwd[0]*d.side*out;const leap=Math.max(-.6,Math.sin(t*2)*1.4);d.m.visible=true;d.m.position.set(x,SEA_Y+leap,z);d.m.rotation.y=SHIP.yaw+Math.PI;d.m.rotation.x=-Math.cos(t*2)*.8;});
  }
  // sharks: sea encounters; kept to the water; only interested in swimmers
  // ═══ ENEMY BEHAVIOUR (Session W) ═════════════════════════════════════
  // Layered over the engine's chase-and-hit: archers kite and shoot, cowards
  // run to fetch friends, packs circle to the flanks, bosses have a second
  // phase with a telegraphed heavy. World zone only. The engine has no
  // 'locked' — kiters and cowards are taken out of its alert state and driven here.
  const RANGED=new Set(['Bandit Archer','Goblin Slinger','Cultist']);const COWARD=new Set(['Kobold','Goblin']);const PACK=new Set(['Wolf','Dire Wolf','Snow Wolf','Ash Hound']);
  function _setPos(e,x,z){e.x=x;e.z=z;if(e.mesh){e.mesh.position.x=x;e.mesh.position.z=z;}}
  let _bhT=0;
  function tickBehaviours(dt){
    if(dt==null){const t=performance.now();dt=Math.min(.1,(t-_bhT)/1000||.016);_bhT=t;}
    const inWorld=activeZoneId==='world';const now=performance.now();const E=inWorld?ZONES.world.enemies:(typeof ENEMIES!=='undefined'?ENEMIES:[]);
    const SC=inWorld?sc:(typeof scene!=='undefined'?scene:sc);const groundAt=(x,z)=>inWorld?worldH(x,z):(typeof activeTerrainH==='function'?activeTerrainH(x,z):0);const blocked=(x,z)=>inWorld?(solidAt(x,z)||worldH(x,z)<=0):(typeof dSolid==='function'?dSolid(x,z):false);
    const packs=[];for(const e of E){if(e.dead||!e.alert)continue;if(PACK.has(e.name))packs.push(e);}
    if(!inWorld)tickArrows(dt);
    for(const e of E){if(e.dead)continue;const d=Math.hypot(e.x-px,e.z-pz);
      if(RANGED.has(e.name)&&(e.alert||e._agg)){if(e.alert){e._agg=true;e.alert=false;}if(d>40){e._agg=false;continue;}const spd=(e.spd||1.2)*2.2;let mx=0,mz=0;const ux=(px-e.x)/(d||1),uz=(pz-e.z)/(d||1);
        if(d<8){mx=-ux;mz=-uz;}else if(d>14){mx=ux;mz=uz;}else{mx=-uz*.6;mz=ux*.6;}
        const nx=e.x+mx*spd*dt,nz=e.z+mz*spd*dt;if(!blocked(nx,nz))_setPos(e,nx,nz);if(e.mesh)e.mesh.rotation.y=Math.atan2(px-e.x,pz-e.z);
        e._shotT=(e._shotT||0)-dt;if(d<26&&e._shotT<=0){e._shotT=2.4+Math.random()*.8;const m=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.9),new THREE.MeshLambertMaterial({color:0x3a2a18}));m.position.set(e.x,groundAt(e.x,e.z)+1.2,e.z);SC.add(m);ARROWS.push({m,scene:SC,sx:e.x,sz:e.z,sy:groundAt(e.x,e.z)+1.2,tx:px+(Math.random()-.5)*1.6,tz:pz+(Math.random()-.5)*1.6,ty:jumpY+.6,t:0,dur:Math.max(.35,d/40),k:.4});if(typeof sfxNoise==='function')sfxNoise(.12,0,0,.06,1600);}
        continue;}
      if(COWARD.has(e.name)&&(e.alert||e._flee)&&!e._fetched&&e.hp<e.maxHp*.4){let f=null,fd=1e9;for(const o of E){if(o===e||o.dead||o.alert)continue;const dd=Math.hypot(o.x-e.x,o.z-e.z);if(dd<70&&dd<fd){fd=dd;f=o;}}
        if(f){if(e.alert){e._flee=true;e.alert=false;}const ux=(f.x-e.x)/(fd||1),uz=(f.z-e.z)/(fd||1);const nx=e.x+ux*(e.spd||1.4)*3*dt,nz=e.z+uz*(e.spd||1.4)*3*dt;if(!blocked(nx,nz))_setPos(e,nx,nz);if(!e._cried){e._cried=true;showMsg(`The ${e.name.toLowerCase()} runs for help.`,'#c8b880');}
          if(fd<4){for(const o of E){if(!o.dead&&Math.hypot(o.x-e.x,o.z-e.z)<12)o.alert=true;}e._fetched=true;e._flee=false;e.alert=true;}continue;}}
      if(PACK.has(e.name)&&e.alert&&packs.length>=2&&d>2.4&&d<14){const i=packs.indexOf(e);const ang=(i/packs.length)*Math.PI*2+now*.0004;const tx=px+Math.cos(ang)*3.2,tz=pz+Math.sin(ang)*3.2;const dx=tx-e.x,dz=tz-e.z;const L=Math.hypot(dx,dz)||1;const nx=e.x+dx/L*(e.spd||1.6)*1.6*dt,nz=e.z+dz/L*(e.spd||1.6)*1.6*dt;if(!blocked(nx,nz))_setPos(e,nx,nz);}
      // every strike lunges the body toward you and swings the first limb
      if(e._lunge!=null&&e.mesh){e._lunge-=dt;const k=Math.max(0,e._lunge)/.3;const s=Math.sin(k*Math.PI);const ux=(px-e.x)/(d||1),uz=(pz-e.z)/(d||1);e.mesh.position.x=e.x+ux*s*.5;e.mesh.position.z=e.z+uz*s*.5;if(e._lunge<=0){e._lunge=null;e.mesh.position.x=e.x;e.mesh.position.z=e.z;}}
      else if(e._wind>0&&e.mesh){const ux=(px-e.x)/(d||1),uz=(pz-e.z)/(d||1);e.mesh.position.x=e.x-ux*e._wind*.2;e.mesh.position.z=e.z-uz*e._wind*.2;e._pulled=true;}
      else if(e._pulled&&e.mesh){e._pulled=false;e.mesh.position.x=e.x;e.mesh.position.z=e.z;}
      if(e.mesh&&(e._wind>0||e._lunge!=null||e._posed)){try{attackPose(e,false);}catch(err){}e._posed=(e._wind>0||e._lunge!=null);}
      // a dazed beast: the charge met a wall
      if(e._stun>0){e._stun-=dt;if(e.mesh)e.mesh.rotation.z=Math.sin(e._stun*14)*.12;if(e._stun<=0&&e.mesh)e.mesh.rotation.z=0;continue;}
      // a lair's beast charges: every 7 s from 5–16u it comes at you at four times its speed; contact hits for double and throws you
      if(e.lair&&e.alert&&!e.dead){e._chT=(e._chT==null?4:e._chT)-dt;if(e._chT<=0&&d>5&&d<16&&e._charge==null){e._chT=7;e._charge=1.1;e._cAng=Math.atan2(px-e.x,pz-e.z);showMsg(`${e.name} charges!`,'#ff8060');if(typeof sfxNoise==='function')sfxNoise(.4,0,0,.25,300);}
        if(e._charge!=null){e._charge-=dt;const sp=(e.spd||1.4)*4*dt;const nx=e.x+Math.sin(e._cAng)*sp,nz=e.z+Math.cos(e._cAng)*sp;if(!blocked(nx,nz))_setPos(e,nx,nz);else{e._charge=0;e._stun=2.4;showMsg(`${e.name} slams into the ground, dazed — now!`,'#e8d8a0');}if(e.mesh)e.mesh.rotation.y=e._cAng;
          if(Math.hypot(e.x-px,e.z-pz)<2.3&&!rollUntouchable(performance.now()/1000)){const dmg=_warded(Math.round((e.dmg||10)*2*(blocking?.5:1)),e);PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;updateHUD();const kx=(px-e.x)/(d||1),kz=(pz-e.z)/(d||1);for(let k=1;k<=3;k++){if(!blocked(px+kx*k,pz+kz*k)){px+=kx;pz+=kz;}}showMsg(`${e.name} bowls you over: ${dmg}.`,'#ff6060');if(typeof sfxNoise==='function')sfxNoise(.5,0,0,.3,250);e._charge=null;if(PHP<=0&&typeof playerDead==='function')playerDead();}
          if(e._charge!=null&&e._charge<=0)e._charge=null;}}
      if((e.boss||/Captain|Troll|Ogre|Wight|Hag|Bear/.test(e.name))&&e.alert){if(!e._phase2&&e.hp<e.maxHp*.5){e._phase2=true;e.spd=(e.spd||1)*1.3;showMsg(`${e.name} roars.`,'#ff8060');if(typeof sfxNoise==='function')sfxNoise(.8,0,0,.3,200);}
        if(e._phase2){e._heavyT=(e._heavyT||3)-dt;if(e._heavyT<=0&&d<7){e._heavyT=6;e._windup=1.0;showMsg(`${e.name} winds up.`,'#ffb060');}
          if(e._windup!=null){e._windup-=dt;if(e.mesh){const k=1+Math.sin(Math.max(0,e._windup)*Math.PI)*.18;if(e._baseScale==null)e._baseScale=e.mesh.scale.x;e.mesh.scale.setScalar(e._baseScale*k);}
            if(e._windup<=0){e._windup=null;if(e.mesh)e.mesh.scale.setScalar(e._baseScale||1);if(Math.hypot(e.x-px,e.z-pz)<3.2&&!rollUntouchable(performance.now()/1000)){const dmg=_warded(Math.round((e.dmg||10)*2.2*(blocking?.35:1)));PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;updateHUD();showMsg(`${e.name}'s heavy blow: ${dmg}.`,'#ff6060');if(typeof sfxNoise==='function')sfxNoise(.5,0,0,.18,300);if(PHP<=0&&typeof playerDead==='function')playerDead();}else showMsg('You step clear.','#c8e88a');}}}}
    }
  }
  function tickSharks(){
    for(const e of ZONES.world.enemies){if(e.dead||e.name!=='Shark')continue;
      if(e.mesh&&e.mesh._sharkTail){const t=performance.now()*.001;e.mesh._sharkTail.rotation.y=Math.sin(t*(e.alert?7:3.4)+(e.homeX||0))*(e.alert?.34:.22);} // S260 — the tail sweeps, faster when it hunts
      if(worldH(e.x,e.z)>-1.6){const dx=e.x-(e.homeX||e.x),dz=e.z-(e.homeZ||e.z),L=Math.hypot(dx,dz)||1;e.x-=dx/L*1.5;e.z-=dz/L*1.5;}
      if(!isSwimming())e.alert=false;
    }
  }

  // ── other ships: pirates and merchants ──
  const OTHER=[]; // {kind,mesh,x,z,yaw,speed,plat,crew:[],chest,boarded,volleyT,dead}
  function spawnOtherShip(kind,x,z){
    // S168 — the black sail and the merchantman are looks of their own, not tints; S285 — the merchantman on the cog, broad and slow (Michael's A, #50)
    const cls=kind==='pirate'?SHIP_CLASSES.sloop:SHIP_CLASSES.cog;
    const m=buildShipMesh(cls.L,cls.W,kind==='pirate'?'pirate':'merchant');
    sc.add(m);
    const o={kind,mesh:m,x,z,yaw:Math.random()*Math.PI*2,speed:0,L:cls.L,W:cls.W,plat:{x0:0,x1:0,z0:0,z1:0,y:DECK_Y},crew:[],chest:null,boarded:false,volleyT:2,dead:false,wp:null,name:kind==='pirate'?'a black-sailed ship':'a merchantman'};
    ZONES.world.platforms.push(o.plat);OTHER.push(o);placeOther(o);
    if(kind==='pirate')crewUp(o,false);
    return o;
  }
  function despawnOtherShip(o){sc.remove(o.mesh);const i=ZONES.world.platforms.indexOf(o.plat);if(i>=0)ZONES.world.platforms.splice(i,1);o.crew.forEach(e=>{if(!e.dead){if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const k=ZONES.world.enemies.indexOf(e);if(k>=0)ZONES.world.enemies.splice(k,1);}});if(o.chest&&typeof ZONE_CORPSES!=='undefined'){const k=ZONE_CORPSES.indexOf(o.chest);if(k>=0)ZONE_CORPSES.splice(k,1);}const j=OTHER.indexOf(o);if(j>=0)OTHER.splice(j,1);}
  function placeOther(o){
    o.mesh.position.set(o.x,SEA_Y+Math.sin(performance.now()*.0011+o.x)*.05,o.z);o.mesh.rotation.y=o.yaw+Math.PI;
    shipPlatBox(o.plat,o.mesh,o.x,o.z,o.yaw,o.L,o.W);
  }
  function atSea(){return activeZoneId==='world'&&(SHIP.sailing||isSwimming()||onDeck())&&worldH(px,pz)<-3;}
  let _seaT=0;
  const PIRATE_RAM={range:30,top:6.5,wait:30,run:12};
  function tickOtherShips(dt,now){
    _seaT-=dt;
    if(_seaT<=0){_seaT=2;
      // keep one pirate and one merchant near a player at sea; drop them when far
      for(let i=OTHER.length-1;i>=0;i--){const o=OTHER[i];if(Math.hypot(o.x-px,o.z-pz)>700)despawnOtherShip(o);}
      if(atSea()){
        for(const kind of ['pirate','merchant']){if(OTHER.some(o=>o.kind===kind))continue;if(Math.random()>(kind==='pirate'?((tutWantsPirate()||factionWantsPirate())?1:.5):.6))continue;
          for(let k=0;k<12;k++){const a=Math.random()*Math.PI*2,d=260+Math.random()*200;const x=px+Math.cos(a)*d,z=pz+Math.sin(a)*d;if(worldH(x,z)<-4&&!SITES.some(t=>Math.hypot(t.x-x,t.z-z)<t.pad+80)){spawnOtherShip(kind,x,z);if(kind==='pirate')showMsg('Black sails on the horizon.','#ffb060');break;}}}
      }
    }
    for(const o of OTHER){
      if(o.boarded){placeOther(o);pirateFled(o);continue;}
      const dP=Math.hypot(px-o.x,pz-o.z);
      let tx,tz;
      if(o.kind==='pirate'&&!o.sated&&atSea()&&dP<300){ // close to ~28u, then hold off and shoot
        // S418 — her ram (Michael's B on #100): within 30 units, faster than you and with her ram ready, she steers at your
        // hull; the first touch spends it (tickHullCollisions) and she goes back to her circle; 30 s before the next, 12 s to land it
        o.ramWait=(o.ramWait||0)-dt;const aboard=!!SHIP.mesh&&(SHIP.sailing||onDeck());
        if(o.ramming){o.ramming-=dt;if(o.ramming<=0||!aboard){o.ramming=0;o.ramWait=PIRATE_RAM.wait;}}
        else if(aboard&&dP<=PIRATE_RAM.range&&o.ramWait<=0&&(SHIP.speed||0)<PIRATE_RAM.top)o.ramming=PIRATE_RAM.run;
        const dx=px-o.x,dz=pz-o.z;if(o.ramming){tx=SHIP.x;tz=SHIP.z;}else if(dP>30){tx=px;tz=pz;}else{tx=o.x-dz*.5;tz=o.z+dx*.5;}
        o.volleyT-=dt;if(dP<70&&o.volleyT<=0){o.volleyT=2.2+Math.random();volley(o);}
      } else if(o.sated){tx=o.x+(o.x-px);tz=o.z+(o.z-pz);
      } else {
        if(!o.wp||Math.hypot(o.wp.x-o.x,o.wp.z-o.z)<20){for(let k=0;k<10;k++){const a=Math.random()*Math.PI*2,d=150+Math.random()*250;const x=o.x+Math.cos(a)*d,z=o.z+Math.sin(a)*d;if(worldH(x,z)<-4){o.wp={x,z};break;}}}
        if(o.wp){tx=o.wp.x;tz=o.wp.z;}
      }
      if(tx!=null){const want=Math.atan2(-(tx-o.x),-(tz-o.z));let d=want-o.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));o.yaw+=Math.max(-.5*dt,Math.min(.5*dt,d));o.speed+=((o.kind==='pirate'?6.5:4.5)-o.speed)*Math.min(1,dt*.6);}
      const fx=-Math.sin(o.yaw),fz=-Math.cos(o.yaw);const bx=o.x+fx*(o.L/2+3),bz=o.z+fz*(o.L/2+3);
      if(worldH(bx,bz)>-1.8){o.speed=0;o.wp=null;}
      o.x+=fx*o.speed*dt;o.z+=fz*o.speed*dt;placeOther(o);
    }
    tickArrows(dt);
  }
  // volleys: arrows that fly to where you are; a hit if you're still near when they land
  const ARROWS=[];
  function volley(o){
    const n=2+Math.floor(Math.random()*2);const v={hit:false};
    for(let k=0;k<n;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.9),new THREE.MeshLambertMaterial({color:0x3a2a18}));const sx=o.x+(Math.random()-.5)*3,sz=o.z+(Math.random()-.5)*3;m.position.set(sx,DECK_Y+1.2,sz);sc.add(m);
      const tx=px+(Math.random()-.5)*4,tz=pz+(Math.random()-.5)*4,dist=Math.hypot(tx-sx,tz-sz);ARROWS.push({m,sx,sz,sy:DECK_Y+1.2,tx,tz,ty:jumpY+.6,t:0,dur:Math.max(.6,dist/45),k:.3+Math.random()*.4,v});}
    if(typeof sfxNoise==='function')sfxNoise(.18,0,0,.08,1800);showMsg('Arrows!','#ff8060');
  }
  // S411 — a volley whose first arrow comes down on your own deck costs her 2 hull and 3 rig (once a volley)
  function volleyOnDeck(x,z,y){const p=SHIP.plat;return !!(SHIP.mesh&&worldState.ship&&p&&x>p.x0&&x<p.x1&&z>p.z0&&z<p.z1&&(!p.inside||p.inside(x,z))&&Math.abs(y-.6-p.y)<1.5);}
  function tickArrows(dt){
    for(let i=ARROWS.length-1;i>=0;i--){const a=ARROWS[i];a.t+=dt;const u=Math.min(1,a.t/a.dur);const arc=Math.sin(u*Math.PI)*a.dur*4;
      const x=a.sx+(a.tx-a.sx)*u,z=a.sz+(a.tz-a.sz)*u,y=a.sy+(a.ty-a.sy)*u+arc;a.m.position.set(x,y,z);a.m.lookAt(a.tx,a.ty,a.tz);
      if(u>=1){(a.scene||sc).remove(a.m);ARROWS.splice(i,1);if(a.v&&!a.v.hit&&volleyOnDeck(a.tx,a.tz,a.ty)){a.v.hit=true;shipWear(2,3);}if(Math.hypot(px-a.tx,pz-a.tz)<1.6&&Math.abs(jumpY+.6-a.ty)<1.5&&!rollUntouchable(performance.now()/1000)){const dmg=_warded(Math.round((6+level*.8)*(blocking?.4:1)));PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;updateHUD();showMsg(`An arrow strikes you for ${dmg}.`,'#ff6060');if(typeof sfxNoise==='function')sfxNoise(.12,0,0,.14,900);if(PHP<=0&&typeof playerDead==='function')playerDead();}}}
  }
  // boarding: E beside another ship (hulls close, or swimming up to her)
  function nearOther(){let best=null,bd=1e9;for(const o of OTHER){const p=o.plat;const d=Math.hypot(Math.max(p.x0-px,0,px-p.x1),Math.max(p.z0-pz,0,pz-p.z1));if(d>0&&d<3.5&&d<bd&&jumpY<4){bd=d;best=o;}}return best;}
  function crewUp(o,alert){
    if(o.crew.length)return;
    for(let k=0;k<3;k++){const fwd=[-Math.sin(o.yaw),-Math.cos(o.yaw)];const ex=o.x+fwd[0]*(-3+k*3)+(-fwd[1])*(k%2?1:-1)*1.2,ez=o.z+fwd[1]*(-3+k*3)+fwd[0]*(k%2?1:-1)*1.2;const e=buildZoneEnemy(sc,STATIC_SOL,ex,ez,'Pirate',typeof pickVariant==='function'?pickVariant('Pirate',level,'normal'):null);e.alert=!!alert;e.homeX=o.x;e.homeZ=o.z;e._ship=o;ZONES.world.enemies.push(e);o.crew.push(e);}
  }
  function boardOther(o){
    o.boarded=true;o.speed=0;o._fled=false;
    px=o.x;pz=o.z;jumpY=DECK_Y;onGround=true;velY=0;
    if(o.kind==='pirate'){crewUp(o,true);o.crew.forEach(e=>{if(!e.dead)e.alert=true;});showMsg('You board her. The crew turns.','#ff8060');} else if(o.kind==='merchant'){showMsg('A merchantman. Her crew keep their heads down.','#c8b880');}
    if(!o.chest){const fwd=[-Math.sin(o.yaw),-Math.cos(o.yaw)];const cx=o.x+fwd[0]*(-o.L/2+3.2),cz=o.z+fwd[1]*(-o.L/2+3.2);const g=new THREE.Mesh(new THREE.BoxGeometry(.9,.6,.6),new THREE.MeshLambertMaterial({color:0x4a3018}));g.position.set(cx,DECK_Y+.3,cz);sc.add(g);const lid=new THREE.Mesh(new THREE.BoxGeometry(.92,.12,.62),new THREE.MeshLambertMaterial({color:0x7a5a2a}));lid.position.set(cx,DECK_Y+.65,cz);sc.add(lid);
      let items=(typeof rollContainerLoot==='function'?rollContainerLoot('chest',o.kind==='pirate'?1.8:1.2,null,1):[])||[];if(!items.length)items.push({name:'Pirate Gold',ico:'🪙',type:'misc',weight:.5,sellMult:1,buyPrice:120});
      if(o.kind==='pirate'){const ks=Object.keys(CARGO_GOODS).filter(k=>!CARGO_GOODS[k].hold);items.push({...cargoItem(ks[Math.floor(Math.random()*ks.length)]),qty:1+(Math.random()<.5?1:0)});}
      if(o.loot){items.push(...o.loot);o.loot=null;}
      items.forEach(it=>{if(it.qty==null)it.qty=1;});
      o.chest={x:cx,z:cz,y:DECK_Y+.3,name:o.kind==='pirate'?"Captain's Chest":'Cargo Chest',displayName:o.kind==='pirate'?"Captain's Chest":'Cargo Chest',items,zone:'world',kind:'chest',g,top:lid,opened:false};if(typeof ZONE_CORPSES!=='undefined')ZONE_CORPSES.push(o.chest);}
  }
  // S399 (Michael's B on #91, with C's chest) — a pirate's chest above carries one or two crates of one good taken off another
  // ship. Flee a deck while her crew still holds it, and they take half the crates in your hold (rounded up), the dearest
  // first: leave her deck with any of her crew standing and your ship within 140 units (they cross behind you), or leave
  // your own deck while her boarders stand on it (pirateBoardersHold, below). What they take goes into her chest (a horse
  // they keep in her hold, not the chest) and she sails off. Falling to them is a death and a reload, so fleeing is the
  // one way a boarding is lost.
  const PIRATE_REACH=140;
  function deckOff(p){return Math.hypot(Math.max(p.x0-px,0,px-p.x1),Math.max(p.z0-pz,0,pz-p.z1));}
  function pirateTake(){const h=holdOf();
    const crates=[];for(const k of Object.keys(h).filter(k=>CARGO_GOODS[k]&&h[k]>0).sort((a,b)=>CARGO_GOODS[b].v-CARGO_GOODS[a].v))for(let i=0;i<h[k];i++)crates.push(k);
    const took=crates.slice(0,Math.ceil(crates.length/2));for(const k of took){h[k]--;if(h[k]<=0)delete h[k];}return took;}
  function pirateStow(o,took){const n={};for(const k of took)n[k]=(n[k]||0)+1;
    for(const k in n){if(CARGO_GOODS[k].hold)continue;const dest=o.chest?o.chest.items:(o.loot||(o.loot=[]));const ex=dest.find(it=>it.type==='cargo'&&it.cargo===k);if(ex)ex.qty=(ex.qty||1)+n[k];else dest.push({...cargoItem(k),qty:n[k]});}
    o.boarded=false;o.sated=true;o.wp=null;
    const list=Object.keys(n).map(k=>n[k]>1?`${n[k]} × ${CARGO_GOODS[k].n.toLowerCase()}`:`a ${CARGO_GOODS[k].n.toLowerCase()}`);
    return list.length>1?list.slice(0,-1).join(', ')+' and '+list[list.length-1]:list[0];}
  function pirateFled(o){if(o.kind!=='pirate'||o._fled||PHP<=0||!o.crew.some(e=>!e.dead))return;if(deckOff(o.plat)<1.5&&!onDeck())return;
    o._fled=true;if(!worldState.ship||!SHIP.mesh||Math.hypot(SHIP.x-o.x,SHIP.z-o.z)>PIRATE_REACH)return;const took=pirateTake();if(!took.length)return;
    showMsg(`They come over your rail behind you and take ${pirateStow(o,took)} from the hold.`,'#ff8060');}
  function otherPrompt(){const o=nearOther();return o&&!o.boarded?`Press 'E' to board ${o.name}`:null;}
  function otherInteract(){const o=nearOther();if(o&&!o.boarded){boardOther(o);return true;}return false;}
  // keep crew on their deck
  function tickCrew(){for(const o of OTHER){if(o._lx!=null&&!o.boarded){const dx=o.x-o._lx,dz=o.z-o._lz;for(const e of o.crew){if(!e.dead){e.x+=dx;e.z+=dz;e.homeX=o.x;e.homeZ=o.z;}}}o._lx=o.x;o._lz=o.z;}for(const o of OTHER)for(const e of o.crew){if(e.dead)continue;const p=o.plat;if(e.x<p.x0+.5||e.x>p.x1-.5||e.z<p.z0+.5||e.z>p.z1-.5){e.x=Math.max(p.x0+.6,Math.min(p.x1-.6,e.x));e.z=Math.max(p.z0+.6,Math.min(p.z1-.6,e.z));}}}

  // ═══ WEATHER (Session F) ═════════════════════════════════════════════
  // Visual and sound. A weather state per stay: clear, overcast, fog,
  // rain, storm, snow — picked by the climate and biome under the player,
  // held for a few real minutes, then blended to the next. Rain and snow
  // are Points around the camera; storms flash and thunder; rain/snow/fog
  // thicken the fog (visibility), overcast dims the sun. Particles and the
  // loop stop indoors and in dungeons.
  const WX={type:'clear',next:'clear',k:0,intensity:0,timer:0,rain:null,snow:null,flashT:0,rainG:null,rainSrc:null,windT:0,cover:0,coverPainted:0,coverQ:null,sRain:1,sSnow:1,sFog:1,cold:.4};
  const WX_COL={overcast:0x8a8f96,fog:0xb8bcc0,rain:0x6a717a,storm:0x4a4e56,snow:0xb8c0c8};
  function weatherWeights(){
    const [i,j]=cellOf(px,pz);const cl=climateOfCell(i,j);const b=dominantRegion(px,pz).r.biome;
    let w={clear:.5,overcast:.2,fog:.08,rain:.15,storm:.05,snow:0};
    if(cl==='cold'){w={clear:.35,overcast:.22,fog:.08,rain:.05,storm:.02,snow:.28};}
    else if(cl==='warm'){w={clear:.6,overcast:.14,fog:.03,rain:.1,storm:.1,snow:0};}
    if(b==='fen'||b==='swamp'){w.fog+=.2;w.rain+=.1;w.clear*=.5;}
    if(b==='coast'||b==='dunes'){w.overcast+=.08;w.storm+=.04;}
    if(b==='tundra'){w.snow+=.15;w.clear*=.7;}
    if(b==='wasteland'){w.overcast+=.2;w.clear*=.6;w.snow=0;}
    return w;
  }
  function pickWeather(){const w=weatherWeights();let s=0;for(const k in w)s+=w[k];let r=Math.random()*s;for(const k in w){r-=w[k];if(r<=0)return k;}return 'clear';}
  let _softTex=null;
  function softTex(){if(_softTex)return _softTex;const cv=document.createElement('canvas');cv.width=cv.height=64;const c=cv.getContext('2d');const gr=c.createRadialGradient&&c.createRadialGradient(32,32,0,32,32,32);if(gr&&gr.addColorStop){gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.5,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;}else c.fillStyle='#fff';c.fillRect(0,0,64,64);_softTex=new THREE.CanvasTexture(cv);return _softTex;}
  function mkPoints(n,size,col,op){
    const g=new THREE.BufferGeometry();const p=new Float32Array(n*3),v=new Float32Array(n);
    for(let i=0;i<n;i++){p[i*3]=(Math.random()-.5)*44;p[i*3+1]=Math.random()*24;p[i*3+2]=(Math.random()-.5)*44;v[i]=.6+Math.random()*.8;}
    g.setAttribute('position',new THREE.BufferAttribute(p,3));
    const m=new THREE.PointsMaterial({color:col,size,transparent:true,opacity:op,depthWrite:false,sizeAttenuation:true,fog:false,map:softTex(),alphaTest:.05});
    const pts=new THREE.Points(g,m);pts.frustumCulled=false;pts.userData.v=v;pts.visible=false;sc.add(pts);return pts;
  }
  function ensureWx(){if(!WX.rain){WX.rain=mkPoints(3200,.12,0xcfd9e6,.55);WX.snow=mkPoints(2600,.34,0xffffff,.85);}}
  // v80 S146 — the same storm is not the same everywhere. Each biome carries how hard rain and snow
  // fall on it, how it fogs, and how well it keeps snow on the ground; the value is blended across
  // the regions you stand between, so it changes as you walk rather than at a border.
  const WX_BIO={
    tundra:   {rain:.35,snow:1.75,fog:1.15,cold:1.00},
    moor:     {rain:1.05,snow:1.20,fog:1.40,cold:.62},
    forest:   {rain:1.35,snow:1.00,fog:1.25,cold:.50},
    autumn:   {rain:1.20,snow:.90,fog:1.30,cold:.48},
    fen:      {rain:1.20,snow:.75,fog:1.75,cold:.42},
    swamp:    {rain:1.35,snow:.45,fog:1.85,cold:.28},
    coast:    {rain:1.15,snow:.75,fog:1.35,cold:.38},
    plains:   {rain:1.00,snow:1.00,fog:1.00,cold:.42},
    dunes:    {rain:.30,snow:.05,fog:.45,cold:.04},
    wasteland:{rain:.55,snow:.45,fog:.80,cold:.26},
    wastes:   {rain:.55,snow:.45,fog:.80,cold:.26},
  };
  function wxLocal(k){
    const ws=regionWeights(px,pz);let v=0,w=0;
    for(const e of ws){if(e.w<=0)continue;const t=WX_BIO[e.r.biome]||WX_BIO.plains;v+=(t[k]!=null?t[k]:1)*e.w;w+=e.w;}
    let out=w>0?v/w:1;
    if(k!=='cold'&&worldH(px,pz)<SEA_Y+1.0)out*=1.25; // out on the water there is nothing to break it
    return out;
  }
  function rainLoop(on){
    if(typeof AX==='undefined'||!AX||!sfxGain)return;
    if(on&&!WX.rainSrc){const buf=AX.createBuffer(1,AX.sampleRate*2,AX.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1);const src=AX.createBufferSource();src.buffer=buf;src.loop=true;const f=AX.createBiquadFilter();f.type='bandpass';f.frequency.value=2600;f.Q.value=.5;const g=AX.createGain();g.gain.value=0;src.connect(f);f.connect(g);g.connect(sfxGain);src.start();WX.rainSrc=src;WX.rainG=g;WX.rainF=f;}
  }
  function thunder(delay){setTimeout(()=>{if(typeof sfxNoise==='function'){sfxNoise(1.6,0,0,.28,180);sfxNoise(.9,0,0,.16,90);}},delay*1000);}
  // v80 S146 — repainting the ground for snow: the chunk colour pass already exists for rivers; this
  // queues every loaded chunk and works through a handful a frame so a snowfall doesn't hitch.
  function snowRepaint(){WX.coverPainted=WX.cover;WX.coverQ=[...chunks.values()];snowPaintRibbons();}
  // v80 S147 — roads and footpaths are their own ribbons on a shared material, so they can't be tinted
  // by the material; each keeps a copy of its own colours and is lerped toward snow instead.
  const SNOW_RIBBON=new THREE.Color(0xdfe4e8);const _ribbons=[];
  function snowWatch(geo){if(!geo||!geo.attributes.color)return;geo.userData.baseCol=geo.attributes.color.array.slice();_ribbons.push(geo);if(WX.cover>0)snowPaintRibbon(geo);}
  function snowPaintRibbon(geo){
    const base=geo.userData.baseCol,col=geo.attributes.color;if(!base)return;
    const a=Math.min(.62,WX.cover*.55); // trodden: never as white as the fields
    for(let i=0;i<base.length;i+=3){
      col.array[i]=base[i]+(SNOW_RIBBON.r-base[i])*a;
      col.array[i+1]=base[i+1]+(SNOW_RIBBON.g-base[i+1])*a;
      col.array[i+2]=base[i+2]+(SNOW_RIBBON.b-base[i+2])*a;}
    col.needsUpdate=true;
  }
  function snowPaintRibbons(){for(let i=_ribbons.length-1;i>=0;i--){const g=_ribbons[i];if(!g.attributes||!g.attributes.color){_ribbons.splice(i,1);continue;}snowPaintRibbon(g);}}
  // ── v80 S147: footprints ──
  // A ring of flat marks dropped as you walk on snow, fading as the cover does. One material each so
  // they can fade independently; they are re-used round-robin, so the cost is fixed.
  const FP={pool:[],i:0,last:null,side:1,max:48};
  function fpEnsure(){
    if(FP.pool.length)return;
    const geo=new THREE.PlaneGeometry(.15,.30);geo.rotateX(-Math.PI/2);
    for(let k=0;k<FP.max;k++){
      const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x5f6b78,transparent:true,opacity:0,depthWrite:false}));
      m.visible=false;m.userData.t=0;m.renderOrder=2;sc.add(m);FP.pool.push(m);
    }
  }
  function fpDrop(){
    fpEnsure();const m=FP.pool[FP.i];FP.i=(FP.i+1)%FP.max;
    const s=Math.sin(yaw),c=Math.cos(yaw);
    const ox=c*.19*FP.side,oz=-s*.19*FP.side;FP.side*=-1;
    m.position.set(px+ox,worldH(px+ox,pz+oz)+.035,pz+oz);m.rotation.y=yaw;
    m.userData.t=1;m.material.opacity=.5;m.visible=true;
  }
  function tickFootprints(dt){
    if(!FP.pool.length)return;
    for(const m of FP.pool){if(!m.visible)continue;
      m.userData.t-=dt/26;                      // a print lasts under half a minute
      const o=Math.max(0,m.userData.t)*.5*Math.min(1,WX.cover*2.2); // and goes with the snow it was made in
      m.material.opacity=o;if(o<=.01)m.visible=false;}
  }
  function fpWalk(){ // called from the footstep beat
    if(activeZoneId!=='world'||lid!=='overworld')return false;
    if(WX.cover<.18)return false;
    const p=FP.last;if(p&&Math.hypot(px-p.x,pz-p.z)<.55)return true;
    FP.last={x:px,z:pz};fpDrop();return true;
  }
  function snowRepaintStep(){
    if(!WX.coverQ||!WX.coverQ.length)return;
    // S177 — two chunks a frame (was six): a chunk costs about a millisecond, and a town's hundred or so are still done inside a second
    let n=0;while(WX.coverQ.length&&n<2){const ch=WX.coverQ.pop();if(ch&&ch.terrain)recolourChunk(ch);n++;}
  }
  function recolourChunk(ch){
    const geo=ch.terrain,pa=geo.attributes.position,col=geo.attributes.color;const ox=ch.cx*CHUNK,oz=ch.cz*CHUNK;const c=_tmpC;
    for(let i=0;i<pa.count;i++){const x=pa.getX(i)+ox+CHUNK/2,z=pa.getZ(i)+oz+CHUNK/2;const h=pa.getY(i);
      groundColor(x,z,h,slopeNormalY(x,z),c);col.setXYZ(i,c.r,c.g,c.b);}
    col.needsUpdate=true;
  }
  // S330 (Michael's 1, #57) — the world's wind: the way it blows, (sin, cos) in the world. It is read off the absolute
  // clock, so it is the same after a load and needs no save: three slow swells over 9–53 game hours, and in a storm a
  // gusting swing of a few seconds on top. Look only: nothing's speed reads it.
  function windDir(){const t=(worldState.gameTimeAbsMinutes||0)/60,P=2*Math.PI;
    let w=1.3+1.2*Math.sin(t*P/53+.4)+.9*Math.sin(t*P/21+1.9)+.25*Math.sin(t*P/9+.7);
    const st=WX.storm||0;if(st>0)w+=st*(.22*Math.sin(t*60*P/.07)+.12*Math.sin(t*60*P/.031+1.3));
    return w;}
  // S343 (Michael's B on #63) — chimney smoke on the world's wind. A town's smoke is one Points object: 24 puffs a chimney on a
  // ten-second life that rise, drift downwind along windDir(), swell from .5 to 3.3 across and fade; a storm shortens the life and
  // lays the plume flat, so the puffs stay close enough to read as one plume. By the hearth's hours: the inn, the smithy and the
  // guild halls always; homes 6–9 and 17–23 in full, a thin thread 9–17, cold at night; every chimney at every hour in snow or
  // the tundra. Positions are relative to the town's centre (float32 on the GPU, see CLAUDE.md).
  const SMOKE={K:24,L:10,t:0,mat:null};
  function smokeMat(){if(SMOKE.mat)return SMOKE.mat;const cv=document.createElement('canvas');cv.width=cv.height=64;const cx=cv.getContext('2d');let sd=7;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
    for(let k=0;k<5;k++){const ox=32+(r()-.5)*18,oy=32+(r()-.5)*18,gr=cx.createRadialGradient(ox,oy,0,ox,oy,22);gr.addColorStop(0,'rgba(255,255,255,.8)');gr.addColorStop(1,'rgba(255,255,255,0)');cx.fillStyle=gr;cx.fillRect(0,0,64,64);}
    return SMOKE.mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:true,
      uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:new THREE.CanvasTexture(cv)},tint:{value:new THREE.Color(0xb8b4ae)},scale:{value:770}}]),
      vertexShader:'attribute float aSize;attribute float aAlpha;varying float vA;uniform float scale;\n#include <fog_pars_vertex>\nvoid main(){vA=aAlpha;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*scale/max(.1,-mvPosition.z);gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader:'uniform sampler2D map;uniform vec3 tint;varying float vA;\n#include <fog_pars_fragment>\nvoid main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(tint,t.a*vA);\n#include <fog_fragment>\n}'});}
  function smokeFor(S){const N=S.chimneys.length*SMOKE.K,geo=new THREE.BufferGeometry(),seed=new Float32Array(N);let sd=(String(S.site.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7)%2147483646)+1;
    for(let i=0;i<N;i++){sd=(sd*16807)%2147483647;seed[i]=sd/2147483647;}
    geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));geo.setAttribute('aSize',new THREE.BufferAttribute(new Float32Array(N),1));geo.setAttribute('aAlpha',new THREE.BufferAttribute(new Float32Array(N),1));
    const pts=new THREE.Points(geo,smokeMat());pts.position.set(S.site.x,0,S.site.z);pts.frustumCulled=false;pts.renderOrder=2;pts.userData.seed=seed;pts.userData.smoke=true;pts.visible=false;S.smoke=pts;S.group.add(pts);return pts;}
  // S345 — a chimney's world position from the placed house (its geometry's chimney top in the house's frame)
  function chimneyAt(geo,o,t){const q=geo.userData&&geo.userData.chimney;if(!q)return null;const c=Math.cos(o.rotation.y),s=Math.sin(o.rotation.y);return {x:o.position.x+q[0]*c+q[2]*s,y:o.position.y+q[1],z:o.position.z-q[0]*s+q[2]*c,t:t||'home',k:0};}
  // how hard a chimney smokes now, 0–1
  function smokeWant(c,h,cold){if(cold||c.t==='inn'||c.t==='weapon'||c.t==='armor'||c.t==='guild_f'||c.t==='guild_m')return 1;
    return (h>=6&&h<9)||(h>=17&&h<23)?1:(h>=9&&h<17)?.3:0;}
  // S354 — a legacy village (its own scene, where WORLD.tick does not run) keeps its chimneys on the scene; the main loop
  // calls this while it is the active scene. Positions are the scene's own, so the Points sit at its origin.
  function smokeLegacy(dt,vs){let S=vs.userData.smokeS;if(!S){S=vs.userData.smokeS={site:{id:'legacy_'+(vs.userData.chimneys.map(c=>c.x.toFixed(1)).join()),x:0,z:0},chimneys:vs.userData.chimneys,group:vs};smokeFor(S);}tickSmoke(dt,[S]);return S;}
  function tickSmoke(dt,list){SMOKE.t+=dt;const h=gameHour(),storm=WX.storm||0,snow=WX.type==='snow'||(WX.next==='snow'&&WX.k>.5),w=windDir(),wx=Math.sin(w),wz=Math.cos(w);
    const drift=.45+1.2*storm,L=SMOKE.L/(1+2*storm),K=SMOKE.K,rise=.38/(1+drift*.4),grow=1+.5*storm;
    if(SMOKE.mat)SMOKE.mat.uniforms.tint.value.setHex(h>=20.5||h<5.5?0x4a4c56:h>=17.5?0x9a8a84:h<7?0x8a8a90:0xb8b4ae);
    const all=list||[...SETTLE.values()];if(!list)for(const C of COACHES.values())if(C.smokeS)all.push(C.smokeS);
    for(const S of all){const P=S.smoke;if(!P)continue;const far=Math.hypot(S.site.x-px,S.site.z-pz)>300;P.visible=!far;if(far)continue;
      const pos=P.geometry.attributes.position.array,size=P.geometry.attributes.aSize.array,al=P.geometry.attributes.aAlpha.array,seed=P.userData.seed,cold=snow||S.tundra,ox=S.site.x,oz=S.site.z;
      for(let ci=0;ci<S.chimneys.length;ci++){const c=S.chimneys[ci];c.k+=(smokeWant(c,h,cold)-c.k)*Math.min(1,dt*.5);
        for(let k=0;k<K;k++){const i=ci*K+k;if(c.k<.01){al[i]=0;continue;}const a=((SMOKE.t/L+k/K+seed[i]*.05)%1),t=a*SMOKE.L,wob=Math.sin(t*1.3+seed[i]*20)*.12*a,d=drift*Math.pow(a*L,1.25);
          pos[i*3]=c.x-ox+wx*d+wz*wob;pos[i*3+1]=c.y+.1+rise*t;pos[i*3+2]=c.z-oz+wz*d-wx*wob;
          size[i]=(.5+2.8*a)*(.55+.45*c.k)*grow;al[i]=Math.min(1,a*6)*Math.pow(1-a,1.3)*.9*c.k;}}
      P.geometry.attributes.position.needsUpdate=P.geometry.attributes.aSize.needsUpdate=P.geometry.attributes.aAlpha.needsUpdate=true;}}
  function tickWeather(dt){
    snowRepaintStep();tickFootprints(dt);
    const inWorld=activeZoneId==='world'&&lid==='overworld';
    // choose / transition
    WX.timer-=dt;
    if(WX.timer<=0){WX.timer=150+Math.random()*180;WX.next=pickWeather();if(WX.next!==WX.type)WX.k=0;}
    if(WX.next!==WX.type){WX.k+=dt/25;if(WX.k>=1){WX.type=WX.next;WX.k=0;}}
    const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?WX.k:0;
    const inten=t=>t==='rain'?.7:t==='storm'?1:t==='snow'?.8:t==='fog'?.6:t==='overcast'?.35:0;
    WX.intensity=inten(cur)*(1-mix)+inten(nxt)*mix;
    const rainAmt=(cur==='rain'||cur==='storm'?1:0)*(1-mix)+(nxt==='rain'||nxt==='storm'?1:0)*mix;
    const snowAmt=(cur==='snow'?1:0)*(1-mix)+(nxt==='snow'?1:0)*mix;
    const storm=(cur==='storm'?1:0)*(1-mix)+(nxt==='storm'?1:0)*mix;WX.storm=storm;WX.wind=windDir();
    ensureWx();
    // particles follow the camera
    const upd=(pts,amt,fall,drift,wrapH)=>{
      if(!pts)return;pts.visible=inWorld&&amt>.02;if(!pts.visible)return;
      const p=pts.geometry.attributes.position.array,v=pts.userData.v;const n=p.length/3;const cx=px,cy=jumpY+8,cz=pz;
      const shown=Math.floor(n*amt);pts.geometry.setDrawRange(0,shown);
      for(let i=0;i<shown;i++){p[i*3+1]-=fall*v[i]*dt;p[i*3]+=drift*dt*(0.5+Math.sin(i)*.5);
        if(p[i*3+1]<cy-wrapH){p[i*3+1]+=24;p[i*3]=cx+(Math.random()-.5)*44;p[i*3+2]=cz+(Math.random()-.5)*44;}
        if(Math.abs(p[i*3]-cx)>22)p[i*3]=cx+(Math.random()-.5)*44;if(Math.abs(p[i*3+2]-cz)>22)p[i*3+2]=cz+(Math.random()-.5)*44;}
      pts.geometry.attributes.position.needsUpdate=true;
    };
    // v80 S146 — strength where you stand
    const sRain=wxLocal('rain'),sSnow=wxLocal('snow'),sFog=wxLocal('fog'),cold=wxLocal('cold');
    WX.sRain=sRain;WX.sSnow=sSnow;WX.sFog=sFog;WX.cold=cold;
    const rainShown=Math.min(1,rainAmt*.62*sRain),snowShown=Math.min(1,snowAmt*.58*sSnow);
    upd(WX.rain,rainShown,26,1.5,12);upd(WX.snow,snowShown,2.2,1.2,12);
    // snow settles on the ground while it falls, and goes off again when it stops — slowly where it is cold
    if(inWorld){
      const falling=snowAmt*sSnow;
      const floor=cold>=.85?.30:0; // the far north keeps a covering of its own
      if(falling>.08)WX.cover+=dt*(.009*Math.min(1.6,falling)*(.45+cold)); // a couple of minutes to lie thick
      else WX.cover-=dt*(.016*(1.25-cold));
      WX.cover=Math.max(floor,Math.min(1,WX.cover));
      if(Math.abs(WX.cover-WX.coverPainted)>.045)snowRepaint();
    }
    // lightning
    WX.flashT-=dt;
    if(inWorld&&storm>.5&&WX.flashT<=0){WX.flashT=6+Math.random()*14;WX.flash=.14;thunder(.4+Math.random()*2.2);}
    if(WX.flash>0){WX.flash-=dt;}
    // sound is ticked from the main loop now (wxAudio), so it keeps fading when you step inside
  }
  // v80 S145 — the loudness of the weather, and how much of it reaches you.
  // The world tick only runs in the open world, so the gain used to freeze at whatever it was when you
  // left: a downpour followed you into a house or a cave at full volume. This runs every frame instead.
  function wxAudio(dt){
    rainLoop(true);if(!WX.rainG)return;
    const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?WX.k:0;
    const amtOf=t=>(cur===t?1:0)*(1-mix)+(nxt===t?1:0)*mix;
    const rainAmt=amtOf('rain'),stormAmt=amtOf('storm'),snowAmt=amtOf('snow');
    const open=activeZoneId==='world'&&lid==='overworld';
    const inside=(typeof isInterior==='function'&&isInterior());
    const mul=open?1:inside?.22:(activeZoneId==='dungeon')?.05:.3; // muffled through a wall, all but gone underground
    const target=(rainAmt*.055*(WX.sRain||1)+stormAmt*.075*(WX.sRain||1)+snowAmt*.012*(WX.sSnow||1))*mul; // rain was .11 flat: too loud in the open
    WX.rainG.gain.value+=(target-WX.rainG.gain.value)*Math.min(1,dt*(target<WX.rainG.gain.value?3.5:2));
    // snow is a breath of wind, not a hiss: the same noise, filtered low
    if(WX.rainF){const snowy=snowAmt>(rainAmt+stormAmt);
      const f=snowy?380:2600,q=snowy?.25:.5;
      WX.rainF.frequency.value+=(f-WX.rainF.frequency.value)*Math.min(1,dt*1.2);WX.rainF.Q.value=q;}
  }
  // called from atmosphere() after the day/night targets are computed
  function applyWeather(){
    const I=WX.intensity;if(I<=0&&!(WX.flash>0))return;
    const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?WX.k:0;
    const col=(t)=>_tmpWx.setHex(WX_COL[t]||0x8a8f96);
    _tmpWx2.copy(col(cur));if(mix>0)_tmpWx2.lerp(col(nxt),mix);
    const night=(typeof _nightFactor==='function')?_nightFactor():0;
    _atm.sky.lerp(_tmpWx2,I*.85);
    // fog colour: the weather's grey by day, a dim blue-grey at night (never black — fogged things must still read)
    _tmpWx.setHex(0x2c3440).lerp(_tmpWx2,.35);_atm.fog.lerp(night>.5?_tmpWx:_tmpWx2,I*.85);
    // visibility: a storm roughly halves the view; fog closes it right down. v80 S145 — fog was 2.2x a
    // biome density of ~.008, which is barely a haze; it now also carries a floor so it reads anywhere.
    const foggy=(cur==='fog'?1:0)*(1-mix)+(nxt==='fog'?1:0)*mix;
    const sFog=WX.sFog||1; // v80 S146 — a fen fogs harder than a downland
    const fogK=(1.2+foggy*5.0)*sFog;WX.fogMul=1+I*fogK*(1-night*.35);
    WX.fogFloor=foggy*(night>.5?.020:.028)*sFog; // ~35-50 steps of sight in the thick of it
    WX.sunMul=1-I*(.55+foggy*.18);
    if(WX.flash>0){_atm.sky.setHex(0xe8eefc);_atm.fog.lerp(_tmpWx.setHex(0xdde6f4),.6);WX.sunMul=2.2;}
  }
  const _tmpWx=new THREE.Color(),_tmpWx2=new THREE.Color();
  window.devWeather=function(t){if(!t)return WX.type+(WX.next!==WX.type?' → '+WX.next:'');WX.next=t;WX.k=0;WX.timer=240;return 'weather → '+t;};

  // ═══ INTERIORS II (Session G) ════════════════════════════════════════
  // Beds have owners: 'inn' (rent a room for the night, 5–25 gold), 'home'
  // (yours only if you own the house), 'guild' (members only), 'free'
  // (camps, fort cots, your ship). Houses can be bought from their
  // resident. Larger buildings have an instanced cellar under a floor
  // hatch. Interior windows are painted backdrops that follow the clock.
  function ownedHouse(id){return !!(worldState.owned&&worldState.owned[id]);}
  function rentedNow(id){const r=worldState.rented;if(!r||r.id!==id)return false;return (worldState.gameTimeAbsMinutes||0)<r.until;}
  // v80 S141 — you rent a room, not the inn. The interior's width comes from the footprint, so the
  // room count is known without going in; the other doors belong to other people.
  // v80 S237 — the innkeeper's own business, a meal and a room (was inline in the town builder; the coaching inn shares it)
  function innTopics(house){return [{label:'Something to eat and drink?',trade:true},{label:'A bed for the night?',
          get response(){const price=innPrice(house),n=innRooms(house),taken=innTaken(house),free=innFreeRoom(house);
            if(rentedNow(house.id)){const mine=myRoom(house.id);return mine==null?'Your room’s made up already. Upstairs.':`${innRoomName(mine,n,house).replace(/^./,c=>c.toUpperCase())} — made up already. The key’s in the door.`;}
            const others=taken===0?'The house is empty tonight.':taken===1?'One other guest in tonight.':`${taken} guests in tonight.`;
            return `${others} A room is ${price} gold — ${innRoomName(free,n,house)}, a bed, a bolt on the door, and breakfast if you’re up for it. Shall I make it up?`;},
          get follow(){const price=innPrice(house);if(rentedNow(house.id))return [];
            return [{label:`Yes. ${price} gold.`,quest:true,fn:()=>{const n=innRooms(house),free=innFreeRoom(house);
              if(free==null)return 'Every room’s taken tonight, and I’ll not put two strangers in one. The fire’s free.';
              if(gold<price)return `That’s ${price} gold, and you’ve ${gold}. Come back with it.`;
              gold-=price;updateHUD();worldState.rented={id:house.id,room:free,until:(worldState.gameTimeAbsMinutes||0)+24*60};
              if(typeof addLog==='function')addLog('🛏️',`Rented ${innRoomName(free,n,house)} at ${house.name} for ${price} gold.`);
              return `${price} gold, thank you. ${innRoomName(free,n,house).replace(/^./,c=>c.toUpperCase())}, up the stairs — yours till this time tomorrow. The other doors aren’t mine to open.`;}},
            {label:'Not tonight.',response:'Suit yourself. The fire’s free.'}];}}];}
  function innRooms(house){const W=Math.max(8,Math.round((house.w||6)*1.8));return Math.max(1,Math.floor(W/4.5));}
  // v80 S424 — the rooms stand in one row behind the gallery, room 0 at the west wall, and you come up the stair facing
  // their doors: from a west stair every door is on your right, the nearest room 0's; from an east stair on your left,
  // the nearest the last room's. The names count the doors from the stair head (were left and right in turn, from room 0).
  function galleryEast(house){return String(house.id||'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,3)%2===1;}
  function innRoomName(k,n,house){if(k==null)return 'a room';if(n<=1)return 'the room at the top of the stairs';
    const east=galleryEast(house),i=east?n-1-k:k,side=east?'left':'right';
    if(i===n-1&&n>2)return `the last door on the ${side}`;
    return `the ${['first','second','third','fourth','fifth','sixth'][i]||`${i+1}th`} door on the ${side}`;}
  function innGuestRoom(house,k){return k!=null&&k<innTaken(house);} // S424 — rooms below the night's free one are other guests'; above it, empty
  function innDay(){return Math.floor((worldState.gameTimeAbsMinutes||0)/1440);}
  function innTaken(house){const n=innRooms(house);if(n<=1)return 0;if(house.coachInn)return n-1; // S237 — the roadside inn has one room to let; travellers hold the rest
   const h=String(house.id+'|'+innDay()).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,5);return h%n;} // other guests: steady for the night, never the whole house
  function innFreeRoom(house){const n=innRooms(house),taken=innTaken(house);return taken<n?taken:null;}
  function myRoom(id){const r=worldState.rented;return (r&&r.id===id&&r.room!=null)?r.room:null;}
  function innPrice(house){const k=house.reg||'irish';const base={village:6,town:12,port:10,city:20,garrison:8}[house.siteKind||'village']||10;const h=String(house.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);return Math.min(25,Math.max(5,base+(h%9)-3));}
  function guildMember(g){const st=(worldState.guild||{})[g];return !!(st&&(st.done>0||st.joined));}
  // Called by the engine's E handler when standing at a bed. Returns true if it handled it.
  function bedInteract(bd){
    const h=currentHouse;const owner=bd.owner||'free';
    if(owner==='free')return false;                       // engine sleeps
    if(owner==='home'){if(ownedHouse(h.id))return false;showMsg("That's someone else's bed.",'#c8b880');return true;}
    if(owner==='guild'){if(guildMember(h.guild))return false;showMsg('Members only. Take a task from the desk first.','#c8b880');return true;}
    if(owner==='inn'){
      if(rentedNow(h.id)){
        const mine=myRoom(h.id); // v80 S141 — an old save rented the whole inn: any bed there
        if(mine==null||bd.room==null||bd.room===mine)return false;
        showMsg(`${innGuestRoom(h,bd.room)?"Another guest's room.":'An empty room, not the one you took.'} Yours is ${innRoomName(mine,innRooms(h),h)}.`,'#c8b880');return true;
      }
      showMsg('The innkeeper lets the rooms. Ask at the counter.','#c8b880');return true;
    }
    return false;
  }
  function bedPrompt(bd){const h=currentHouse;const owner=bd.owner||'free';
    if(owner==='inn'&&!rentedNow(h.id))return `Ask the innkeeper for a room (${innPrice(h)} gold)`;
    if(owner==='inn'){const mine=myRoom(h.id);if(mine!=null&&bd.room!=null&&bd.room!==mine)return innGuestRoom(h,bd.room)?"Another guest's room":'Not your room';if(mine!=null)return "Your room \u2014 press 'E' to rest";} // v80 S141
    if(owner==='home'&&!ownedHouse(h.id))return null;if(owner==='guild'&&!guildMember(h.guild))return "Members' beds";return "Press 'E' to rest";}
  // ── buying a house ──
  function housePrice(house){const k=house.siteKind||'village';const base={village:450,town:900,port:800,city:1500,garrison:700}[k]||600;const hh=String(house.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,3);return base+((hh%7)*50);}
  function forSale(house){if(house.type!=='home'||ownedHouse(house.id))return false;const hh=String(house.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,11);return (hh%100)<28;}
  function buyHouse(house){
    const price=housePrice(house);if(gold<price)return `She'd take ${price} gold for it. Not a coin less.`;
    gold-=price;updateHUD();(worldState.owned||(worldState.owned={}))[house.id]={name:house.name,site:house.siteId};
    house.name='Your House';house.ownedByPlayer=true;
    if(typeof addLog==='function')addLog('🏠',`Bought a house for ${price} gold.`);
    // the former resident moves out: hide their street self for good
    const n=npcs.find(n=>n.def&&n.def.name===house.keeper&&n.sched&&n.sched.type==='resident');if(n){n.g.visible=false;n.dot.visible=false;n._retreated=true;n.sched={type:'gone'};}
    if(typeof closeDialog==='function')closeDialog();
    return false;
  }
  function houseTopics(house){return forSale(house)?[{label:`Buy this house (${housePrice(house)} gold)`,quest:true,fn:()=>buyHouse(house)}]:[];}
  // ── cellars ──
  function cellarFor(house){
    if(!house._cellar){const chapel=isGuestCathedral(house);house._cellar={id:house.id+(chapel?'_chapel':'_cellar'),type:chapel?'chapel':'cellar',name:chapel?'Cill an Aoi':`${house.name} — cellar`,keeper:'',parent:house,reg:house.reg,style:house.style,w:house.w,d:house.d,two:false,doorX:house.doorX,doorZ:house.doorZ,exitX:house.exitX,exitZ:house.exitZ,exitYaw:house.exitYaw,siteKind:house.siteKind,guild:house.guild};}
    return house._cellar;
  }
  function hasCellar(house){return house&&(house.type==='inn'||house.type==='guild_f'||house.type==='guild_m'||house.type==='castle'||house.ownedByPlayer||isGuestCathedral(house));}
  const HATCH={x:0,z:0,y:0,active:false};
  // ── S155: town locks and strongboxes (the crime system, part 1 of 4 — the design is in the backlog) ──
  let INT_BOX=null;
  const BOX_KINDS=['weapon','armor','potion','misc','shipwright','goods','forge','apothecary','armoury'];
  const bpick=a=>a[Math.floor(Math.random()*a.length)];
  function absMin(){return worldState.gameTimeAbsMinutes||0;}
  function houseSite(house){return (house&&house.siteId&&SITE[house.siteId])||null;}
  // a shop is locked while it is shut (18–8); a home from night to dawn, unless it is yours
  function doorLockNow(house){if(!house||house.ownedByPlayer||ownedHouse(house.id))return null;const h=hourNow();
    if(house.type==='home')return (h>=HRS.night||h<HRS.dawn)?{kind:'home',opens:HRS.dawn}:null;
    return shopClosedNow(house)?{kind:'shop',opens:HRS.shopOpen}:null;}
  function doorPicked(house){const P=worldState.picked;const t=P&&P[house.id];return t!=null&&absMin()-t<12*60;} // a picked door stays open for the night
  function lockPins(house){const st=houseSite(house);const p=st?prosperity(st):50;return house.type==='home'?2:(p>=60?4:3);} // a rich town buys better locks
  // ── S156: witnesses and favour (the crime system, part 2 of 4) ──
  // Anyone awake within sight sees it: a townsperson or guard within twelve units with a clear line, six indoors;
  // sneaking halves the range and night halves it again. Seen, the town's favour drops on the canon's scale, the
  // wronged keeper refuses your custom for five days, and a fine accrues that the lord will take. Favour lost to
  // crime comes back a point for every three quiet days.
  const CRIME_PTS={lock:1,theft:2,assault:3};
  // indoors, a wall between you and the keeper hides you (S182, the critic's section I): only what stands across eye
  // height counts (walls, partitions, a shut door), not a counter or a table you could see over
  function intClearLine(ax,az,bx,bz){if(typeof INT_SOL==='undefined')return true;const d=Math.hypot(bx-ax,bz-az);const n=Math.max(1,Math.ceil(d/.25));
    for(let i=1;i<n;i++){const t=i/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;for(const s2 of INT_SOL){if(s2.y1!=null&&s2.y1<1.5)continue;if(s2.y0!=null&&s2.y0>1.2)continue;if(x>s2.x0&&x<s2.x1&&z>s2.z0&&z<s2.z1)return false;}}return true;}
  function clearLine(ax,az,bx,bz){const d=Math.hypot(bx-ax,bz-az);const n=Math.max(1,Math.ceil(d/.6));for(let i=1;i<n;i++){const t=i/n;if(solidAt(ax+(bx-ax)*t,az+(bz-az)*t))return false;}return true;}
  // v80 S167 — indoors, sight stops at a partition wall (a solid taller than a person's head) or a shut door; counters,
  // tables and beds do not block it. An open door's box stands out of the way, so its doorway is clear.
  function intSightLine(ax,az,bx,bz){const S_=(typeof INT_SOL!=='undefined'&&INT_SOL)||[];const D_=(typeof INT_DOORS!=='undefined'&&INT_DOORS)||[];
    const eye=(typeof jumpY==='number'?jumpY:0)+1.1;const B=S_.filter(s=>s.y0!=null&&s.y1!=null&&s.y0<=eye&&s.y1>=eye&&(s.y1-s.y0>=1.8||D_.some(d=>d.sol===s)));
    const d=Math.hypot(bx-ax,bz-az);const n=Math.max(1,Math.ceil(d/.1));
    for(let i=1;i<n;i++){const t=i/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;for(const s of B)if(x>s.x0&&x<s.x1&&z>s.z0&&z<s.z1)return false;}return true;}
  // S368 — indoors a person sees what they face (Michael's B on #73): a 120° cone about the way they look, (sin ry, cos ry)
  const INT_FOV=Math.cos(Math.PI/3);
  function intFaces(o){const dx=px-o.position.x,dz=pz-o.position.z,d=Math.hypot(dx,dz);if(d<1e-3)return true;return (Math.sin(o.rotation.y)*dx+Math.cos(o.rotation.y)*dz)/d>=INT_FOV;}
  function witnessOf(house){
    const sneak=(typeof _sneaking!=='undefined')&&_sneaking;let R=12;if(sneak)R*=.5;if(isNight())R*=.5;
    if(typeof isInterior==='function'&&isInterior()){const inR=6; // indoors: whoever is in the room with you, facing you, and can see you
      if(typeof intNPCMesh!=='undefined'&&intNPCMesh&&Math.hypot(px-intNPCMesh.position.x,pz-intNPCMesh.position.z)<inR&&intFaces(intNPCMesh)&&intSightLine(intNPCMesh.position.x,intNPCMesh.position.z,px,pz))return {name:currentHouse.keeper||'the keeper'};
      const m=(INT_NPCS||[]).find(n=>Math.hypot(px-n.g.position.x,pz-n.g.position.z)<inR&&intFaces(n.g)&&intSightLine(n.g.position.x,n.g.position.z,px,pz));return m?{name:(m.def&&m.def.name)||'someone'}:null;}
    let best=null,bd=R;for(const n of npcs){if(!n.g.visible||n._retreated)continue;const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);if(d>=bd)continue;if(!clearLine(px,pz,n.g.position.x,n.g.position.z))continue;best=n;bd=d;}
    return best?{name:(best.def&&best.def.name)||'someone',npc:best}:null;}
  function seenCrime(kind,house,w,value){const site=houseSite(house);const pts=CRIME_PTS[kind]||1;
    if(site){addFavor(site,-pts);const C=worldState.crime||(worldState.crime={});const c=C[site.id]||(C[site.id]={bounty:0,debt:0,last:0});c.bounty+=25*pts+Math.max(0,Math.round(value||0));c.debt+=pts;c.last=dayNow();} // S168 — a theft's fine is 50 and the goods' value (the spec)
    if(house.keeper&&house.type!=='home')(worldState.refuse||(worldState.refuse={}))[house.id]=dayNow()+5;
    const what=kind==='lock'?'pick the lock':kind==='theft'?'take what was not yours':'strike';
    if(site&&typeof isInterior==='function'&&isInterior())try{dispatchGuard(house,site);}catch(e){} // S239 — seen indoors: a guard is sent
    showMsg(`${w.name} saw you ${what}.`,'#e88a8a');if(typeof addLog==='function')addLog('👁',`${w.name} saw you ${what} at ${house.name}${site?'; '+site.name+' will not forget it':''}.`);}
  // S327 — asked each frame of a town pick (Michael's A on #54): whoever sees you now sees the lock picked
  function pickSeen(house){const w=witnessOf(house);if(!w)return null;
    (worldState.crimes||(worldState.crimes=[])).push({kind:'lock',site:house.siteId||null,house:house.id,day:dayNow(),min:absMin()});seenCrime('lock',house,w);return w;}
  function noteCrime(kind,house,value,coins){(worldState.crimes||(worldState.crimes=[])).push({kind,site:house.siteId||null,house:house.id,day:dayNow(),min:absMin()});
    if(coins>0&&house.siteId){const C=worldState.crime||(worldState.crime={});const c=C[house.siteId]||(C[house.siteId]={bounty:0,debt:0,last:0});c.loot=(c.loot||0)+coins;} // S168 — the gold taken in a town, for the cells to take back
    const w=witnessOf(house);if(w)seenCrime(kind,house,w,value);return !!w;}
  function refusesTrade(house){const R=worldState.refuse;if(!R||!house||R[house.id]==null)return false;if(dayNow()>=R[house.id]){delete R[house.id];return false;}return true;}
  function bountyAt(site){const C=worldState.crime;const c=C&&C[typeof site==='string'?site:site.id];return c?c.bounty:0;}
  function fineTopics(site){const b=bountyAt(site);if(b<=0)return [];
    return [{label:`Pay my fine (${b} gold)`,quest:true,fn:()=>{if(gold<b)return `The fine is ${b} gold. Come back when you have it.`;gold-=b;updateHUD();worldState.crime[site.id].bounty=0;worldState.crime[site.id].shut=false;if(typeof addLog==='function')addLog('⚖',`Paid a fine of ${b} gold at ${site.name}.`);return 'Paid. The town will still remember for a while; give it time.';}}];}
  function tickCrimeDay(){const C=worldState.crime;if(!C)return;const day=dayNow();for(const id in C){const c=C[id];if(c.debt>0&&day-c.last>=3){c.debt--;c.last=day;addFavor(id,1);}}}
  // ── S157: guards (the crime system, part 3 of 4) ──
  // With a fine on you, a guard within five units and a clear line stops you: pay, or he draws. Drawn, the guard
  // stands in as a zone enemy (the Bandit body for now, in the watch's red) and the guard himself steps out of the
  // street. At low health you may yield: pay double, or a night in the cells, which takes the stolen goods and
  // clears the fine. Killing a guard costs five favour, shuts the town's gates to you until you pay, and the Church
  // hears of it. Striking anyone is assault, seen by its victim; a struck guard draws at once.
  const CR={cool:0,yielded:false};
  function nearSite(){let best=null,bd=1e9;for(const S of SETTLE.values()){if(!S.site)continue;const d=Math.hypot(px-S.site.x,pz-S.site.z);if(d<(S.site.pad||40)+40&&d<bd){bd=d;best=S;}}return best;}
  function guardsOf(S){return (S&&S.npcs||[]).filter(n=>n.sched&&(n.sched.type==='guard'||n.sched.type==='watch'||n.sched.type==='constable'));}
  function crimeOf(S){const C=worldState.crime;return C&&S&&C[S.site.id];}
  function drawnAt(S){return ZONES.world.enemies.filter(e=>e._guard&&!e.dead&&e._guard.site===S.site.id);}
  function tickCrime(dt,now){
    CR.cool=Math.max(0,CR.cool-dt);try{tickSent(dt,false);}catch(e){}const S=nearSite();if(!S)return;const c=crimeOf(S);const talking=(typeof dlgOpen!=='undefined')&&dlgOpen;
    const drawn=drawnAt(S);
    if(drawn.length){ // the fight: they hold while you talk; at low health, the offer to yield
      if(talking){drawn.forEach(e=>{e.alert=false;e.atkCd=Math.max(e.atkCd||0,.6);});return;}
      drawn.forEach(e=>{e.alert=true;});
      if(!CR.yielded&&PHP<maxHP*.3&&c&&c.bounty>0){CR.yielded=true;offerYield(S,c);}
      return;}
    CR.yielded=false;
    if(!c||c.bounty<=0||talking)return;if(!c.shut&&CR.cool>0)return; // shut gates: no talk, no cooldown
    for(const n of guardsOf(S)){if(!n.g.visible||n._retreated||n._drawn)continue;const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);if(d>5)continue;if(!clearLine(px,pz,n.g.position.x,n.g.position.z))continue;
      if(c.shut)guardDraw(n,S);else confront(n,S,c);return;}
  }
  // S239 — guards indoors (Michael, issue #23: B). Seen indoors with a fine on you, the nearest guard on duty is sent.
  // Half a minute on (or when he has walked there, if that is longer) he comes in by the door and halts you where you
  // stand. Leave before then and he is in the street where his walk had got him, and gives chase: he halts you if he
  // catches you, and gives up when you leave the town's pad or after a minute and a half. Refuse him indoors and he
  // takes it outside, where he draws (the fight indoors is the next session). The clock runs in both ticks.
  const GUARD_IN=30,CHASE_SPD=3.0,CHASE_MAX=90;
  function dispatchGuard(house,site){const S=SETTLE.get(site.id);if(!S)return;if(CR.sent&&CR.sent.site===site.id&&CR.sent.house===house.id)return;
    const h=hourNow();let best=null,bd=1e9;
    for(const n of guardsOf(S)){if(n._drawn||scheduleFor(n,h).hide)continue;const d=Math.hypot(n.g.position.x-house.exitX,n.g.position.z-house.exitZ);if(d<bd){bd=d;best=n;}}
    if(!best)return;if(CR.sent)endSent();
    CR.sent={site:site.id,house:house.id,npc:best,t:0,ct:0,from:{x:best.g.position.x,z:best.g.position.z},door:{x:house.exitX,z:house.exitZ},out:{x:house.exitX-house.doorX,z:house.exitZ-house.doorZ},walk:bd/CHASE_SPD,phase:'coming',mesh:null};
    best._follow=false;}
  function endSent(){const s=CR.sent;if(!s)return;if(s.mesh&&s.mesh.parent)s.mesh.parent.remove(s.mesh);if(s.enemy){const i=ZONES.world.enemies.indexOf(s.enemy);if(i>=0)ZONES.world.enemies.splice(i,1);}if(s.npc)s.npc._chase=false;CR.sent=null;}
  function tickSent(dt,indoor){const s=CR.sent;if(!s)return;const C=worldState.crime;const c=C&&C[s.site];if(!c||c.bounty<=0){endSent();return;}
    const S=SETTLE.get(s.site);const n=s.npc;if(!S||!n||(n._drawn&&s.phase!=='fight')){endSent();return;}
    s.t+=dt;const talking=(typeof dlgOpen!=='undefined')&&dlgOpen;
    if(indoor){CR.cool=Math.max(0,CR.cool-dt);/* S241 — the halt's minute runs indoors too (it only ran in the street's tick) */const inHouse=typeof currentHouse!=='undefined'&&currentHouse&&currentHouse.id===s.house;
      if(s.phase==='chase'){ // you ducked in somewhere while he was on your heels (within 20 units): he follows you in
        if(currentHouse&&s.last&&s.last.d<=20){s.house=currentHouse.id;s.door={x:currentHouse.exitX,z:currentHouse.exitZ};s.out={x:currentHouse.exitX-currentHouse.doorX,z:currentHouse.exitZ-currentHouse.doorZ};s.phase='coming';s.t=GUARD_IN-s.last.d/CHASE_SPD;s.walk=0;n._chase=false;}
        else{endSent();}return;}
      if(!inHouse)return;
      if(s.phase==='fight'){const e=s.enemy;if(!e||e.dead){endSent();return;} // S241 — killed (guardKilled has run) or stood down
        if(talking){e.alert=false;e.atkCd=Math.max(e.atkCd||0,.6);return;}
        e.alert=true;if(!CR.yielded&&PHP<maxHP*.3&&c.bounty>0){CR.yielded=true;offerYield(S,c);return;}
        const keep=ZE;ZE=[e];try{tickZoneEnemies(dt,performance.now(),interiorScene);}finally{ZE=keep;}return;}
      if(s.phase==='coming'&&s.t>=Math.max(GUARD_IN,s.walk)){ // he comes in by the door
        const W=currentHouse._roomW||currentHouse.intW||10,D=currentHouse._roomD||currentHouse.intD||10;
        const g=buildNPCMesh({role:'guard',name:(n.def&&n.def.name)||'Guard',_twin:n.def&&n.def._twin,bCol:(n.def&&n.def.bCol)||0x6a2a2a,sCol:(n.def&&n.def.sCol)||0xd4a878},{nation:nationAt(currentHouse.doorX,currentHouse.doorZ),key:currentHouse.siteId||''});
        g.position.set(W/2,0,D-1.0);g.rotation.y=Math.PI;if(interiorScene)interiorScene.add(g);s.mesh=g;s.phase='inside';
        showMsg(`${(n.def&&n.def.name)||'A guard'} comes in.`,'#e88a8a');return;}
      if(s.phase==='inside'&&s.mesh){const g=s.mesh,dx=px-g.position.x,dz=pz-g.position.z,d=Math.hypot(dx,dz);g.rotation.y=Math.atan2(dx,dz);
        if(d>1.5&&!talking){const st=Math.min(d-1.4,1.8*dt),nx=g.position.x+dx/d*st,nz=g.position.z+dz/d*st;
          if(!intSolidAt(nx,nz,.3,0)){g.position.x=nx;g.position.z=nz;}else if(!intSolidAt(nx,g.position.z,.3,0))g.position.x=nx;else if(!intSolidAt(g.position.x,nz,.3,0))g.position.z=nz;}
        else if(d<=1.5&&!talking&&CR.cool<=0&&Math.abs(jumpY)<1.2)confrontIndoor(s,S,c);}
      return;}
    // out of doors
    if(s.phase==='fight'){const e=s.enemy;const hp=e?e.hp:null;if(e){e.dead=true;try{e.mesh&&e.mesh.parent&&e.mesh.parent.remove(e.mesh);}catch(err){}const i=ZONES.world.enemies.indexOf(e);if(i>=0)ZONES.world.enemies.splice(i,1);} // S241 — you ran out mid-fight: he follows and fights on in the street
      const ol=Math.hypot(s.out.x,s.out.z)||1,gx=s.door.x+s.out.x/ol*1.8,gz=s.door.z+s.out.z/ol*1.8;n._drawn=false;n.g.position.set(gx,worldH(gx,gz),gz);s.enemy=null;endSent();const e2=guardDraw(n,S);if(e2&&hp!=null)e2.hp=Math.max(1,hp);return;}
    if(s.phase==='inside'||s.phase==='coming'){ // you are out: he is where his walk had got him (at the door if he was already in)
      const k=s.phase==='inside'?1:Math.min(1,s.t/Math.max(.01,s.walk));const x=s.from.x+(s.door.x-s.from.x)*k,z=s.from.z+(s.door.z-s.from.z)*k;
      if(s.mesh&&s.mesh.parent)s.mesh.parent.remove(s.mesh);s.mesh=null;
      n.g.position.set(x,worldH(x,z),z);n.g.visible=true;n._retreated=false;if(n.dot)n.dot.visible=true;
      if(s.drawOnExit){const ol=Math.hypot(s.out.x,s.out.z)||1,gx=s.door.x+s.out.x/ol*1.8,gz=s.door.z+s.out.z/ol*1.8;n.g.position.set(gx,worldH(gx,gz),gz);endSent();CR.cool=0;guardDraw(n,S);return;}
      s.phase='chase';s.ct=0;n._chase=true;n._follow=false;CR.cool=0;}
    if(s.phase==='chase'){s.ct+=dt;const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);s.last={d,clear:clearLine(px,pz,n.g.position.x,n.g.position.z)};
      const onPad=Math.hypot(px-S.site.x,pz-S.site.z)<(S.site.pad||40)+40;
      if(!onPad||s.ct>CHASE_MAX){showMsg(`${(n.def&&n.def.name)||'The guard'} gives up the chase.`,'#c8b880');endSent();}}
  }
  // S241 — refused indoors, the guard draws where he stands: a Town Guard in the room, fought through the zone-enemy code
  // (run on him alone, with the room's floor and solids); the yield comes at a fifth of health, as in the street.
  function guardFightIndoor(s,S){if(!interiorScene||!s.mesh)return;const n=s.npc;const x=s.mesh.position.x,z=s.mesh.position.z;if(s.mesh.parent)s.mesh.parent.remove(s.mesh);s.mesh=null;
    const e=guardEnemy(n,S,interiorScene,[],x,z);e._indoor=s.house;s.enemy=e;s.phase='fight';CR.yielded=false;}
  // S254 — the halt and the yield in the voice of the town's people; markman is the old text (quest review, run 1, findings 2–3)
  const HALT_LINES={
    gatelander:{greet:(f,t)=>`Stand a moment. There’s a fine of ${f} gold owed in ${t}, and it won’t pay itself. Settle it, or I’ll have to draw.`,
      poor:'You haven’t got it. A debt only grows in the dark, so find it, and soon.',
      pay:'Paid is paid. Walk easy.',
      refuse:'Then the sword, and Weaver forgive the both of us.'},
    markman:{greet:(f,t)=>`Halt. There’s a fine of ${f} gold on you in ${t}. Pay it, or I draw.`,
      poor:'You haven’t got it. Then find it, and quick.',
      pay:'Good. Keep your nose clean.',
      refuse:'Then it’s the sword.'},
    aurennais:{greet:(f,t)=>`A moment, Master. There is a fine of ${f} gold entered against you in ${t}. Settle it now, or I am obliged to draw.`,
      poor:'You have not the sum, Master. Find it before the town finds you.',
      pay:'Settled, and struck from the book. Good day.',
      refuse:'Then you leave me no other term.'},
    oldblood:{greet:(f,t)=>`Stop. ${t} is owed ${f} gold by you. Pay, or I draw.`,
      poor:'You have not got it. Find it.',
      pay:'It is paid.',
      refuse:'Then the blade.'}};
  const YIELD_LINES={
    gatelander:{greet:d=>`A bent knee mends faster than a broken head. ${d} gold, or a night in the cells.`,
      poor:'You haven’t got it. Then it’s the cells, or the sword again, and I’d not choose the sword.',
      pay:'That’s the wiser road. Go on, and go quiet.',
      cells:'Come along, so. The cells are dry, at least.'},
    markman:{greet:d=>`Yield, and it goes easier. ${d} gold, or a night in the cells.`,
      poor:'You haven’t got it. The cells, then, or fight on.',
      pay:'Wise. Go on, then.',
      cells:'Come along, then.'},
    aurennais:{greet:d=>`Yield, and the terms improve. ${d} gold, Master, or a night in the cells.`,
      poor:'You have not the sum, Master. The cells, then, or we continue.',
      pay:'Settled, and noted. You may go.',
      cells:'The cells, then. It will be entered in the town’s book.'},
    oldblood:{greet:d=>`Yield. ${d} gold, or the cells until light.`,
      poor:'You have not got it. The cells, or the blade.',
      pay:'It is paid. Go.',
      cells:'Come. The cells are quiet.'}};
  function haltLines(S){return HALT_LINES[peopleOfSite(S.site)]||HALT_LINES.markman;}
  function yieldLines(S){return YIELD_LINES[peopleOfSite(S.site)]||YIELD_LINES.markman;}
  function confrontIndoor(s,S,c){CR.cool=60;const fine=c.bounty;const n=s.npc;const name=(n.def&&n.def.name)||'The guard';const L=haltLines(S);
    openDialog({name,role:'Guard',ico:'⚔',greeting:[L.greet(fine,S.site.name)],topics:[
      {label:`Pay the fine (${fine} gold)`,quest:true,fn:()=>{if(gold<fine)return L.poor;gold-=fine;updateHUD();c.bounty=0;c.shut=false;CR.cool=5;if(typeof addLog==='function')addLog('⚖',`Paid ${fine} gold to ${name} at ${S.site.name}.`);endSent();return L.pay;}},
      {label:'I’ll not pay.',quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}guardFightIndoor(s,S);},60);return L.refuse;}},
      {label:'Not now.',bye:true}]});}
  function confront(n,S,c){CR.cool=60;if(CR.sent&&CR.sent.npc===n)endSent();/* S239 — caught: the chase is over */const fine=c.bounty;const name=(n.def&&n.def.name)||'The guard';const L=haltLines(S);
    openDialog({name,role:'Guard',ico:'⚔',greeting:[L.greet(fine,S.site.name)],topics:[
      {label:`Pay the fine (${fine} gold)`,quest:true,fn:()=>{if(gold<fine)return L.poor;gold-=fine;updateHUD();c.bounty=0;c.shut=false;CR.cool=5;if(typeof addLog==='function')addLog('⚖',`Paid ${fine} gold to ${name} at ${S.site.name}.`);return L.pay;}},
      {label:'I’ll not pay.',quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}guardDraw(n,S);},60);return L.refuse;}},
      {label:'Not now.',bye:true}]});}
  function guardDraw(n,S){if(n._drawn)return null;return guardEnemy(n,S,sc,STATIC_SOL,n.g.position.x,n.g.position.z);}
  function guardEnemy(n,S,scn,sol,x,z){n._drawn=true;n._retreated=true;n.g.visible=false;if(n.dot)n.dot.visible=false; // S241 — in the street, or in a room
    let gen=null;n.g.traverse(o=>{if(!gen&&o.userData&&o.userData.rig&&o.userData.rig.g)gen=o.userData.rig.g;}); // S171 — the guard who draws is the guard you spoke to
    const e=buildZoneEnemy(scn,sol,x,z,'Bandit',null,{genome:gen});e.name='Town Guard';e.displayName='Town Guard';e.locked=false;e.minLevel=1;if(e.mesh)e.mesh.visible=true;
    e.hp=e.maxHp=Math.round(40+level*8);e.dmg=Math.round(6+level*1.2);e.spd=1.4;e.xpVal=0;e.def=3;e._guard={site:S.site.id,npc:n};e.alert=true;
    try{const body=enemyBodyMesh(e);if(!(e.limbs&&e.limbs.person)&&body&&body.material&&body.material.color)body.material.color.setHex(0x6a2a2a);}catch(err){}
    ZONES.world.enemies.push(e);showMsg(`${(n.def&&n.def.name)||'The guard'} draws.`,'#ff8060');return e;}
  function standDown(S){for(const e of ZONES.world.enemies){if(!e._guard||e.dead||e._guard.site!==S.site.id)continue;e.dead=true;try{(e.mesh&&e.mesh.parent||sc).remove(e.mesh);}catch(err){}if(e.el)e.el.intensity=0;
    const n=e._guard.npc;if(n){n._drawn=false;n._retreated=false;n.g.visible=true;if(n.dot)n.dot.visible=true;}}}
  function offerYield(S,c){const dbl=c.bounty*2;const D_=drawnAt(S);D_.forEach(e=>{e.alert=false;e.atkCd=Math.max(e.atkCd||0,.6);}); // they hold while the offer stands
    const L=yieldLines(S);const gn=D_.map(e=>e._guard&&e._guard.npc&&e._guard.npc.def&&e._guard.npc.def.name).find(Boolean)||'The guard'; // S171 — the guard who drew speaks, by name
    openDialog({name:gn,role:'Guard',ico:'⚔',greeting:[L.greet(dbl)],topics:[
      {label:`Pay double (${dbl} gold)`,quest:true,fn:()=>{if(gold<dbl)return L.poor;gold-=dbl;updateHUD();c.bounty=0;c.shut=false;standDown(S);if(typeof addLog==='function')addLog('⚖',`Yielded and paid ${dbl} gold at ${S.site.name}.`);return L.pay;}},
      {label:'The cells.',quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}toCells(S,c);},60);return L.cells;}},
      {label:'Fight on.',bye:true}]});}
  function toCells(S,c){if(typeof isInterior==='function'&&isInterior()){try{closeDialog();}catch(e){}try{exitInterior();}catch(e){}let k=0;const w=()=>{if(!isInterior()||++k>60)toCells(S,c);else setTimeout(w,100);};setTimeout(w,100);return;} // S241 — taken from a room: out first
    standDown(S);let stolen=0;for(let i=BAG.length-1;i>=0;i--)if(BAG[i].stolen){BAG.splice(i,1);stolen++;}c.bounty=0;c.shut=false;
    const back=Math.min(Math.max(0,gold),c.loot||0);if(back>0){gold-=back;stolen++;}c.loot=0; // S168 — the gold stolen in this town goes back too, as much of it as you still carry
    doFade(()=>{const gtm=worldState.gameTimeMinutes||0;const to=gtm<7*60?7*60-gtm:1440-gtm+7*60;worldState.gameTimeAbsMinutes=(worldState.gameTimeAbsMinutes||0)+to;worldState.gameTimeMinutes=7*60; // to the next morning, on both clocks
      const keep=S.houses.find(h=>h.type==='castle');if(keep){px=keep.exitX!=null?keep.exitX:keep.doorX;pz=keep.exitZ!=null?keep.exitZ:keep.doorZ+2;}else{px=S.site.x;pz=S.site.z;}jumpY=0;PHP=Math.max(PHP,Math.round(maxHP*.5));
      showMsg(`A night in the cells. ${stolen?'They took what you stole'+(back?` (${back} gold)`:'')+'. ':''}It is morning.`,'#c8b880');if(typeof addLog==='function')addLog('⛓',`A night in the cells at ${S.site.name}${stolen?'; the stolen goods were taken'+(back?`, and ${back} gold`:''):''}.`);
      if(typeof renderInv==='function')renderInv();if(typeof updateHUD==='function')updateHUD();});}
  function guardKilled(e){const id=e._guard.site;const C=worldState.crime||(worldState.crime={});const c=C[id]||(C[id]={bounty:0,debt:0,last:0});addFavor(id,-5);c.debt+=5;c.last=dayNow();c.bounty+=125;c.shut=true;
    (worldState.church||(worldState.church={notes:[]})).notes.push({kind:'guard',site:id,day:dayNow()});const S=SETTLE.get(id);
    try{const t=S?S.site:SITE[id];if(t){const st=fstate()[factionOf(nationKeyOf(...cellOf(t.x,t.z)))];if(st.done>0){st.done=Math.max(0,st.done-3);st.rank=Math.min(3,Math.floor(st.done/3));}}}catch(err){} // a service lost, and the rank with it
    showMsg(`You have killed a guard of ${S?S.site.name:'the town'}. Its gates are shut to you until you pay.`,'#ff6060');if(typeof addLog==='function')addLog('☠',`Killed a guard at ${S?S.site.name:id}. The Church will hear of it.`);}
  // ── S158: the Church and the factions (the crime system, part 4 of 4) ──
  // The priest of a town where you have a record hears a confession: a tithe of 25 gold, once in three days, buys
  // back one point of the favour crime cost you. Not for a guard's death while the town is unpaid. The nation's
  // faction will not serve you while any of its towns has a fine on you or its gates shut, and its discount is
  // gone; a guard's death in its nation costs a service and the rank that went with it.
  function recordAt(site){const c=crimeOf({site});return c&&(c.debt>0||c.bounty>0||c.shut)?c:null;}
  function churchNoteAt(siteId){const N=(worldState.church&&worldState.church.notes)||[];return N.find(n=>n.kind==='guard'&&n.site===siteId&&!n.absolved);}
  function penanceTopics(site){const c=recordAt(site);if(!c)return [];const note=churchNoteAt(site.id);if(c.debt<=0&&!note)return []; /* S425 — no favour owed and no guard's death to hear: a fine alone is the lord's, and the tithe bought nothing */
    return [{label:'Confess.',quest:true,fn:()=>{
      if(note&&(c.bounty>0||c.shut))return 'A guard of this town is dead by your hand, and the town is not paid. I will not hear you until it is.';
      const day=dayNow();if(c.confessed!=null&&day-c.confessed<3)return 'You have confessed. Now live it; come back to me in a few days.';
      if(gold<25)return 'The tithe is 25 gold. The Weaver keeps no accounts, but the roof does.';
      gold-=25;updateHUD();c.confessed=day;if(c.debt>0){c.debt--;addFavor(site,1);}if(note)note.absolved=day;
      if(typeof addLog==='function')addLog('🕯',`Confessed at ${site.name}; a tithe of 25 gold.`);
      return note?'It is heard. The dead man had a name; learn it. Go, and do not come back to me for the same thing.':'It is heard. The town will come round the sooner for it. Go gently.';}}];}
  function nationRecord(nk){const C=worldState.crime||{};for(const id in C){const c=C[id];if(!(c.bounty>0||c.shut))continue;const t=SITE[id];if(t&&nationKeyOf(...cellOf(t.x,t.z))===nk)return t;}return null;}
  // striking a townsperson: the victim always sees it; a struck guard draws at once, anyone else runs
  function strikeNpc(fx,fz){const S=nearSite();if(!S)return false;let best=null,bd=2.2;
    for(const n of S.npcs||[]){if(!n.g.visible||n._retreated||n._drawn)continue;const ex=n.g.position.x-px,ez=n.g.position.z-pz,d=Math.hypot(ex,ez);if(d>=bd)continue;if((ex*fx+ez*fz)/(d||1)<=.45)continue;best=n;bd=d;}
    if(!best)return false;const name=(best.def&&best.def.name)||'someone';const site=S.site;
    addFavor(site,-3);const C=worldState.crime||(worldState.crime={});const c=C[site.id]||(C[site.id]={bounty:0,debt:0,last:0});c.bounty+=75;c.debt+=3;c.last=dayNow();
    (worldState.crimes||(worldState.crimes=[])).push({kind:'assault',site:site.id,house:null,day:dayNow(),min:absMin()});
    if(best.sched&&(best.sched.type==='guard'||best.sched.type==='watch'||best.sched.type==='constable')){showMsg(`You struck ${name}.`,'#ff6060');guardDraw(best,S);}
    else{best._scared=performance.now()+20000;showMsg(`You struck ${name}. ${site.name} will not forget it.`,'#ff6060');if(typeof addLog==='function')addLog('👁',`Struck ${name} at ${site.name}.`);}
    return true;}
  function doorLockFor(house){const home=house.type==='home';return {seed:'door_'+house.id,minPins:lockPins(house),lockBonus:home?-1:0,lockTitle:home?'A locked door':'A shop door, locked for the night',live:true,house,
    onPick:()=>{(worldState.picked||(worldState.picked={}))[house.id]=absMin();noteCrime('lock',house);if(typeof goToInterior==='function')goToInterior(house);}};}
  // a shop's takings before the day's luck (Michael’s A on #68, S361): 10 + 50 a 100 prosperity, by the shop's kind; was 20 + 180 (S155)
  function boxCoins(p,type){const mult=/weapon|armor|armoury|forge/.test(type)?1.2:/potion|apothecary/.test(type)?.8:1;return (10+50*Math.max(0,Math.min(100,p))/100)*mult;}
  function boxState(){if(!INT_BOX)return null;const B=worldState.boxes||(worldState.boxes={});const r=B[INT_BOX.id];if(r&&dayNow()-r.taken<5)return 'empty';if(r&&INT_BOX.open)INT_BOX.open=false; // refilled: locked again
    return INT_BOX.open?'open':'locked';}
  function boxPrompt(){if(!INT_BOX||!currentHouse)return null;if(Math.hypot(px-INT_BOX.x,pz-INT_BOX.z)>1.6||jumpY>.6)return null;const st=boxState();const name=INT_BOX.kind==='home'?'the chest':'the strongbox';
    return st==='empty'?(INT_BOX.kind==='home'?'The chest is empty':'The strongbox is empty'):st==='locked'?`Press 'E' to pick the lock on ${name}`:`Press 'E' to open ${name}`;}
  function boxInteract(){if(!boxPrompt())return false;const st=boxState(),X=INT_BOX;
    if(st==='empty'){showMsg(X.kind==='home'?'Nothing left in it.':'The takings are gone; they will not have refilled it yet.','#c8b880');return true;}
    if(st==='locked'){if(typeof tryLockpick==='function')tryLockpick({seed:'box_'+X.id,live:true,house:X.house,minPins:lockPins(X.house),lockBonus:X.kind==='home'?-1:0,lockTitle:X.kind==='home'?'A small chest':'A strongbox',onPick:()=>{X.open=true;if(X.lid)X.lid.rotation.x=-Math.PI/3;boxInteract();}});return true;}
    // open: the takings by the town's prosperity and one thing from the stock; a home's few coins and a keepsake
    const items=[];let coins=0;const site=houseSite(X.house);const p=site?prosperity(site):50;
    if(X.kind==='home'){coins=2+Math.floor(Math.random()*11);items.push({name:bpick(['A carved bird','A tin locket','A worn ring','A child’s top','A bone comb','A prayer card','A lock of hair in paper']),ico:'🎁',type:'misc',weight:.1,sellMult:1,buyPrice:8+Math.floor(Math.random()*22),qty:1,stolen:true});}
    else{coins=Math.round(boxCoins(p,X.type)*(.8+Math.random()*.4));
      try{const tbl=(typeof SHOP_STOCK!=='undefined')&&(SHOP_STOCK[X.type]||SHOP_STOCK.misc);if(tbl&&tbl.length){items.push(Object.assign({},bpick(tbl),{qty:1,stolen:true}));}}catch(e){}}
    gold+=coins;let got=0;items.forEach(it=>{if(typeof bagAdd==='function'){bagAdd(it);got++;}});
    (worldState.boxes||(worldState.boxes={}))[X.id]={taken:dayNow()};noteCrime('theft',X.house,coins+items.reduce((a,it)=>a+(it.buyPrice||0),0),coins);
    showMsg(`${coins} gold${got?', and '+items.map(i=>i.name.toLowerCase()).join(', '):''}.`,'#e8d8a0');if(typeof addLog==='function')addLog('💰',`Took ${coins} gold from ${X.kind==='home'?'a chest in':'the strongbox at'} ${X.house.name}.`);
    if(typeof renderInv==='function')renderInv();return true;}
  let INT_LOOT=null;
  function lootPrompt(){if(!INT_LOOT||!currentHouse)return null;const taken=worldState.towerLoot&&worldState.towerLoot[INT_LOOT.id];if(taken)return null;if(Math.hypot(px-INT_LOOT.x,pz-INT_LOOT.z)<1.5&&Math.abs(jumpY-INT_LOOT.y)<1.2)return towerLocked()?"Press 'E' to pick the chest's lock":"Press 'E' to open the chest";return null;}
  function towerLocked(){return !!INT_LOOT&&!(worldState.towerPicked&&worldState.towerPicked[INT_LOOT.id]);} // S150 — the tower's chest is a good lock
  function lootInteract(){if(!lootPrompt())return false;
    if(towerLocked()){const id=INT_LOOT.id;if(typeof tryLockpick==='function')tryLockpick({seed:'tower_'+id,minPins:4,lockTitle:'A locked chest',onPick:()=>{(worldState.towerPicked||(worldState.towerPicked={}))[id]=true;lootInteract();}});return true;}
    const items=(typeof rollContainerLoot==='function'?rollContainerLoot('treasure',2.4,null,1):[])||[];if(!items.length)items.push({name:'Old Gold',ico:'🪙',type:'misc',weight:.5,sellMult:1,buyPrice:120,qty:1});let got=0;items.forEach(it=>{if(it.qty==null)it.qty=1;if(typeof bagAdd==='function'){bagAdd(it);got++;}});(worldState.towerLoot||(worldState.towerLoot={}))[INT_LOOT.id]=true;showMsg(`The chest yields ${got} thing${got===1?'':'s'}.`,'#e8d8a0');if(typeof addLog==='function')addLog('💰',`Opened the chest atop ${currentHouse.name}.`);return true;}
  function hatchPrompt(){if(!HATCH.active||!currentHouse)return null;if(Math.hypot(px-HATCH.x,pz-HATCH.z)<1.3&&Math.abs(jumpY-HATCH.y)<.9)return HATCH.roof?"Press 'E' to climb out onto the roof":(currentHouse.type==='cellar'||currentHouse.type==='chapel')?"Press 'E' to climb up":isGuestCathedral(currentHouse)?"Press 'E' to go down — the bricked stair":"Press 'E' to go down to the cellar";return null;}
  function hatchInteract(){if(!hatchPrompt())return false;const h=currentHouse;
    if(HATCH.roof){const S=SETTLE.get((h.siteId)||'');const site=siteAnywhere(h.siteId);const roof=(S&&S.roof)||(site?roofFor(site):null);if(!roof)return false;const hh=h;if(typeof exitInterior==='function'){window._pendingWorldPos={x:roof.x,z:roof.z+1.2,yaw:Math.PI,jumpY:roof.y};exitInterior();}showMsg('Wind. The whole country, from up here.','#c8b880');return true;}
    if(h.type==='cellar'||h.type==='chapel'){const p=h.parent;goToInterior(p);setTimeout(()=>{if(currentHouse===p&&p._hatch){px=p._hatch.x;pz=p._hatch.z+.9;jumpY=0;}},900);return true;}
    const c=cellarFor(h);goToInterior(c);return true;}
  // ── painted windows ──
  // S331 (Michael, on #53: "more medieval, and it should reflect the type of town") — the view through a window is drawn by
  // the time of day, the town's prosperity and its nation: a poor place shows fields, trees and perhaps a cottage; a middling
  // one a few gabled houses round a church tower; a rich one its curtain wall with towers and the roofs and spires inside.
  // No mullions are painted: the kit frame in front of the pane carries them. One texture per (time, tier, nation), cached.
  const WINTEX={};
  function winTier(p){return p==null?0:p<35?0:p<60?1:2;}
  function windowTexture(tier,nation){
    const h=hourNow();const key=h<5.5?'night':h<7.5?'dawn':h<17.5?'day':h<19.5?'dusk':'night';
    tier=tier==null?1:tier;nation=nation||'gatelands';const ck=key+'|'+tier+'|'+nation;
    if(WINTEX[ck])return WINTEX[ck];
    let sd=(tier*7919+nation.length*104729+key.length*31)>>>0;const R=()=>{sd=(sd*16807)%2147483647||1;return sd/2147483647;};
    const cv=document.createElement('canvas');cv.width=256;cv.height=256;const ctx=cv.getContext('2d');
    const sky=ctx.createLinearGradient(0,0,0,256);
    if(key==='day'){sky.addColorStop(0,'#8fbce0');sky.addColorStop(1,'#d9e6ee');}
    else if(key==='dusk'){sky.addColorStop(0,'#3a3a66');sky.addColorStop(.6,'#c8683c');sky.addColorStop(1,'#f0b070');}
    else if(key==='dawn'){sky.addColorStop(0,'#5a6a9a');sky.addColorStop(.7,'#e8b890');sky.addColorStop(1,'#f8dcb0');}
    else{sky.addColorStop(0,'#0a0e22');sky.addColorStop(1,'#1c2242');}
    ctx.fillStyle=sky;ctx.fillRect(0,0,256,256);
    if(key==='night'){ctx.fillStyle='#e8e8ff';for(let i=0;i<60;i++)ctx.fillRect(R()*256,R()*120,1.2,1.2);ctx.fillStyle='#f4f0d8';ctx.beginPath();ctx.arc(190,46,14,0,Math.PI*2);ctx.fill();}
    if(key==='day'){ctx.fillStyle='rgba(255,255,255,.7)';[[40,44,24],[130,30,30],[210,54,20]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.arc(x+r*.8,y-r*.3,r*.7,0,Math.PI*2);ctx.arc(x-r*.7,y+r*.1,r*.6,0,Math.PI*2);ctx.fill();});}
    // everything on the ground is drawn in day colours and pulled towards the light of the hour
    const TINT={day:[0,[0,0,0]],dawn:[.35,[110,90,120]],dusk:[.5,[70,40,60]],night:[.82,[12,14,30]]}[key];
    const col=hex=>{const c=parseInt(hex.slice(1),16),k=TINT[0],t=TINT[1];const m=(v,i)=>Math.round(v*(1-k)+t[i]*k);return `rgb(${m(c>>16,0)},${m((c>>8)&255,1)},${m(c&255,2)})`;};
    const lit=key!=='day';const glow=()=>lit?'#ffc860':col('#2a2622');
    const poly=(pts,fill)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(const q of pts.slice(1))ctx.lineTo(q[0],q[1]);ctx.closePath();ctx.fill();};
    // hills: a far blue ridge and a nearer green one
    const hill=(y0,amp,c,ph)=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,256);for(let x=0;x<=256;x+=8)ctx.lineTo(x,y0-amp*Math.sin(x*.021+ph)-amp*.5*Math.sin(x*.047+ph*2));ctx.lineTo(256,256);ctx.closePath();ctx.fill();};
    hill(150,12,col('#7c93a0'),R()*6);hill(176,9,col('#6f8a58'),R()*6);
    // the roofs by nation: thatch and slate in the Gatelands, dark shingle in the Mark, terracotta in Aurenne
    const ROOFS={gatelands:['#8a7448','#5a5e66','#7a6a44'],mark:['#4a3a2e','#3e3a36','#5a4838'],aurenne:['#a8583a','#b86a44','#9a4e34']}[nation]||['#8a7448','#5a5e66','#7a6a44'];
    const WALLS={gatelands:['#d8ccb0','#cabb98'],mark:['#8a6a4a','#7a5c40'],aurenne:['#e0cfa8','#d4b890']}[nation]||['#d8ccb0','#cabb98'];
    const tree=(x,y,r,dark)=>{ctx.fillStyle=col('#4a3622');ctx.fillRect(x-1.5,y-r*.4,3,r*.6);ctx.fillStyle=col(dark?'#3e5a2e':'#557038');ctx.beginPath();ctx.arc(x,y-r,r,0,Math.PI*2);ctx.arc(x-r*.6,y-r*.6,r*.7,0,Math.PI*2);ctx.arc(x+r*.6,y-r*.65,r*.7,0,Math.PI*2);ctx.fill();};
    const pine=(x,y,hh)=>{ctx.fillStyle=col('#34502e');ctx.beginPath();ctx.moveTo(x,y-hh);ctx.lineTo(x+hh*.28,y);ctx.lineTo(x-hh*.28,y);ctx.closePath();ctx.fill();};
    // a house: a wall with a door and a window, a steep gable roof, a chimney
    const house=(x,y,w,hh,k)=>{const wall=col(WALLS[k%2]),roof=col(ROOFS[k%3]);ctx.fillStyle=wall;ctx.fillRect(x,y-hh,w,hh);
      poly([[x-3,y-hh],[x+w/2,y-hh-w*.62],[x+w+3,y-hh]],roof);ctx.fillStyle=col('#3a2a1c');ctx.fillRect(x+w*.62,y-hh-w*.46,4,10);
      ctx.fillStyle=glow();ctx.fillRect(x+w*.2,y-hh*.7,5,6);ctx.fillStyle=col('#4a3020');ctx.fillRect(x+w*.55,y-hh*.55,6,hh*.55);};
    const tower=(x,y,w,hh,spire)=>{ctx.fillStyle=col('#a89c88');ctx.fillRect(x,y-hh,w,hh);if(spire)poly([[x-2,y-hh],[x+w/2,y-hh-w*2.2],[x+w+2,y-hh]],col(ROOFS[1]));
      else{ctx.fillStyle=col('#a89c88');for(let k=0;k<w;k+=6)ctx.fillRect(x+k,y-hh-5,3.5,5);}ctx.fillStyle=lit?'#e0a850':col('#2a2622');ctx.fillRect(x+w/2-1.5,y-hh*.75,3,7);};
    const ground=196;
    if(tier===0){
      // fields in strips, a hedge, trees, and a cottage one time in two
      [['#8a9a50',ground-4],['#a89a58',ground+10],['#7a8a48',ground+26]].forEach(([c,y])=>poly([[0,y],[256,y-6],[256,256],[0,256]],col(c)));
      ctx.fillStyle=col('#3e5a2e');for(let x=0;x<256;x+=5)ctx.fillRect(x,ground-6-2*Math.sin(x*.3),6,6);
      if(R()<.5)house(150+R()*40,ground-2,38,20,0);
      tree(30,ground+30,16,false);tree(78,ground-2,12,true);pine(118,ground-2,34);tree(222,ground+34,18,true);pine(240,ground,30);if(R()<.6)tree(190,ground-4,10,false);
    }else if(tier===1){
      // a village: gabled houses round a church tower, trees between
      tower(118,ground-8,18,54,true);
      let x=-6;const back=[];while(x<256){const w=30+R()*16;back.push([x,w]);x+=w+6+R()*10;}
      back.forEach(([bx,w],k)=>{if(bx+w>112&&bx<140)return;house(bx,ground-6,w,20+R()*8,k);});
      tree(20,ground+16,14,true);tree(236,ground+18,15,false);
      ctx.fillStyle=col('#7a8a48');ctx.fillRect(0,ground-2,256,60);
      for(let k=0;k<3;k++)house(10+k*86+R()*20,ground+18,40,26,k+1);
      ctx.fillStyle=col('#9a8a68');poly([[110,256],[146,256],[132,ground+22],[124,ground+22]],col('#9a8a68'));
    }else{
      // a city: a curtain wall with round towers, a gate, and inside the roofs, a keep and a spire
      tower(40,ground-30,22,70,false);tower(170,ground-34,16,82,true);
      let x=-8;while(x<256){const w=20+R()*16,hh=22+R()*18;house(x,ground-24,w,hh,Math.floor(R()*6));x+=w+2;}
      const wallY=ground+14,wc=col('#b0a48c');ctx.fillStyle=wc;ctx.fillRect(0,wallY-44,256,44);
      ctx.fillStyle=wc;for(let k=0;k<256;k+=10)ctx.fillRect(k,wallY-52,6,8);
      ctx.strokeStyle=col('#8a7e68');ctx.lineWidth=1;for(let y=wallY-40;y<wallY;y+=8){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}
      for(const tx of [22,128,234]){ctx.fillStyle=col('#a89c84');ctx.fillRect(tx-14,wallY-66,28,66);poly([[tx-17,wallY-66],[tx,wallY-96],[tx+17,wallY-66]],col(ROOFS[1]));ctx.fillStyle=lit?'#e0a850':col('#2a2622');ctx.fillRect(tx-2,wallY-54,4,8);}
      ctx.fillStyle=col('#2a2018');ctx.beginPath();ctx.moveTo(114,wallY);ctx.lineTo(114,wallY-18);ctx.arc(128,wallY-18,14,Math.PI,0);ctx.lineTo(142,wallY);ctx.closePath();ctx.fill();
      ctx.fillStyle=col('#6f8a58');ctx.fillRect(0,wallY,256,256-wallY);poly([[112,256],[144,256],[140,wallY],[116,wallY]],col('#9a8a68'));
      tree(60,wallY+30,12,true);tree(200,wallY+34,14,false);
    }
    const tex=new THREE.CanvasTexture(cv);WINTEX[ck]=tex;return tex;
  }
  // a window's view: the painted town of the room's own place (its settlement's prosperity and nation); a church's glass is lit
  function windowMat(type,house){if(type==='church')return new THREE.MeshBasicMaterial({color:0xc8b070});
    let tier=0,nation='gatelands';if(house){const t=houseSite(house)||(house.siteId&&siteAnywhere(house.siteId));if(t&&(t.kind in BASE_P))tier=winTier(prosperity(t));try{nation=nationAt(house.doorX,house.doorZ);}catch(e){}}
    return new THREE.MeshBasicMaterial({map:windowTexture(tier,nation)});}

  // ═══ NAVAL II (Session H) ═════════════════════════════════════════════
  // Ship classes and upgrades (speed, cargo, hull size — no hull HP),
  // fish you catch by swimming up to a school, whales in deep water,
  // pirates who board you, and hulls that push each other apart.
  const SHIP_CLASSES={sloop:{L:13,W:4.4,name:'sloop',price:0,speed:7.5,hull:100},cog:{L:17,W:5.6,name:'cog',price:900,speed:8.5,hull:140},galleon:{L:22,W:7.0,name:'galleon',price:2200,speed:9.5,hull:200}};
  const SAIL_TIERS=[0,250,450,700]; // price to reach tier 1..3, +1.2 u/s each
  const CARGO_TIERS=[0,200,400];    // +25 carry each while aboard or within 20u of her
  function shipCfg(){return worldState.ship||(worldState.ship={});}
  function shipClass(){return SHIP_CLASSES[(worldState.ship&&worldState.ship.cls)||'sloop'];}
  function shipTopSpeed(){return shipClass().speed+((worldState.ship&&worldState.ship.sails)||0)*1.2;}
  // S411 — Michael's A on #85 (docs/design/sailing.md): a hull by class and a rig of 100, kept in worldState.ship (saved).
  // Under half her hull she ships water (speed ×0.8), under a quarter ×0.6; the rig sets ×(0.5 + 0.5 × rig/100);
  // at 0 hull she is waterlogged and makes 2.5 at most. The shipwright mends 4 gold a hull point, 3 a rig point, an hour a 20.
  function shipBars(){const st=shipCfg(),mx=shipClass().hull;if(!(st.hull>=0)||st.hull>mx)st.hull=mx;if(!(st.rig>=0)||st.rig>100)st.rig=100;return {hull:st.hull,rig:st.rig,hullMax:mx,rigMax:100};}
  function shipSpeedMul(){if(!worldState.ship)return 1;const b=shipBars(),f=b.hull/b.hullMax;return (f<.25?.6:f<.5?.8:1)*(.5+.5*b.rig/100);}
  function shipSpeedNow(){const v=shipTopSpeed()*shipSpeedMul();return worldState.ship&&shipBars().hull<=0?Math.min(2.5,v):v;}
  function shipWear(hull,rig){if(!worldState.ship)return null;const b=shipBars(),st=shipCfg();hull=Math.max(0,Math.round(hull||0));rig=Math.max(0,Math.round(rig||0));
    if(b.hull===0&&hull>0&&SHIP.mesh){shipSink();return {hull:0,rig:0,sunk:true};}
    st.hull=Math.max(0,b.hull-hull);st.rig=Math.max(0,b.rig-rig);if(b.hull>0&&st.hull===0)showMsg(`The ${SHIP.name} is waterlogged. She will make two knots and a half.`,'#ff8060');shipBarsUI();return {hull:b.hull-st.hull,rig:b.rig-st.rig};}
  // S412 — the sea's state where she is, 0 calm, 1 moderate, 2 rough, 3 storm: the weather (clear and fog 0; overcast, rain and
  // snow 1; a storm 3) plus one in open water, at most 3. Open water is the sea's own floor (the bed blends to −8 at a full
  // sea cell, so the page's "below −8" is never met; −7.9 here) with no shore within 150 units. Read once a second.
  const SEA_WORD=['calm','moderate','rough','storm'];
  function weatherSea(){const t=(WX.next!==WX.type&&WX.k>=.5)?WX.next:WX.type;return t==='storm'?3:(t==='clear'||t==='fog')?0:1;}
  function openWater(x,z){if(worldH(x,z)>-7.9)return false;for(let k=0;k<12;k++){const a=k/12*Math.PI*2;for(const r of [50,100,150])if(worldH(x+Math.cos(a)*r,z+Math.sin(a)*r)>SEA_Y-1.4)return false;}return true;}
  function seaState(x,z){if(x==null){x=SHIP.x;z=SHIP.z;}return Math.min(3,weatherSea()+(openWater(x,z)?1:0));}
  // under sail in a rough sea she loses 1 hull and 1 rig a minute; in a storm with W held 1 hull every 6 s and 1 rig every 4 s,
  // half that with no key held while she still makes way, nothing hove to (under half a knot)
  function tickSeaWear(dt,fwd){
    const st=SHIP.sea||0,v=Math.abs(SHIP.speed);let h=0,r=0;
    if(st>=3&&v>.5){const m=fwd>0?1:.5;h=dt/6*m;r=dt/4*m;}else if(st===2&&v>.5){h=dt/60;r=dt/60;}
    if(!h&&!r)return;SHIP._wh=(SHIP._wh||0)+h;SHIP._wr=(SHIP._wr||0)+r;const H=Math.floor(SHIP._wh),R=Math.floor(SHIP._wr);
    if(H||R){SHIP._wh-=H;SHIP._wr-=R;shipWear(H,R);}}
  // S413 — foundering: any hull lost while she is waterlogged sinks her. The wreck lies where she went down (on the map); any
  // shipwright raises her, class and tiers, for 30% of what they cost, and she lies at his quay three game days later. The hold
  // comes up with her; the stash is the safehouse's, untouched.
  function shipCostAll(){const st=shipCfg();const cls=st.cls||'sloop';let c=SHIP_PRICE+(cls!=='sloop'?SHIP_CLASSES.cog.price:0)+(cls==='galleon'?SHIP_CLASSES.galleon.price:0);
    for(let i=1;i<=(st.sails||0);i++)c+=SAIL_TIERS[i];for(let i=1;i<=(st.cargo||0);i++)c+=CARGO_TIERS[i];return c;}
  function shipRaiseCost(){return Math.round(shipCostAll()*.3);}
  function shipSink(){const st=shipCfg();const aboard=SHIP.sailing||onDeck();
    st.sunk={x:SHIP.x,z:SHIP.z};st.hull=0;Object.assign(st,{x:SHIP.x,z:SHIP.z,yaw:SHIP.yaw});SHIP.sailing=false;SHIP.speed=0;
    for(const e of BOARDERS){if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const j=ZONES.world.enemies.indexOf(e);if(j>=0)ZONES.world.enemies.splice(j,1);}BOARDERS.length=0;
    if(SHIP.mesh){sc.remove(SHIP.mesh);SHIP.mesh=null;}if(SHIP.plat){const j=ZONES.world.platforms.indexOf(SHIP.plat);if(j>=0)ZONES.world.platforms.splice(j,1);SHIP.plat=null;}
    if(aboard){jumpY=SWIM_Y;velY=0;onGround=false;}splash(true);
    showMsg(`The ${SHIP.name} goes down. Any shipwright can raise her.`,'#ff6060');if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} sank.`);shipBarsUI();}
  // once a second: a raised ship due at her quay is put there
  function tickShipRaise(){const st=worldState.ship;if(!st||!st.sunk||!st.raise||SHIP.mesh)return;if((worldState.gameTimeAbsMinutes||0)<st.raise.due)return;
    const site=siteAnywhere(st.raise.site);if(!site)return;const sd=shoreDir(site)||{dx:1,dz:0};const q=site.quayStart||{x:site.x+sd.dx*site.pad,z:site.z+sd.dz*site.pad};
    delete st.sunk;delete st.raise;st.hull=shipClass().hull;st.rig=100;spawnShip(q.x+sd.dx*22,q.z+sd.dz*22+(sd.dx?12:0),Math.atan2(-sd.dz,-sd.dx)+Math.PI/2);
    if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} is raised and lies at ${site.name}.`);}
  function shipMendCost(){const b=shipBars();const h=b.hullMax-b.hull,r=100-b.rig;return {hull:h,rig:r,gold:h*4+r*3,mins:Math.round((h+r)*3)};}
  const SHIPBAR={ui:null};
  function shipBarsUI(){
    if(typeof document==='undefined'||!document.body)return;
    let el=SHIPBAR.ui;if(!el){el=document.createElement('div');if(!el.style)return;el.id='shipbars';el.style.cssText='position:fixed;right:14px;bottom:150px;width:150px;padding:5px 8px;background:rgba(40,30,18,.82);border:1px solid #a08a5a;border-radius:4px;color:#e8dcc0;font:11px Georgia,serif;display:none;z-index:50';
      el.innerHTML='<div id="shipbars-name" style="margin-bottom:3px"></div><div id="shipbars-sea" style="margin-bottom:3px;color:#c8b890"></div><div>Hull <span id="shipbars-hull"></span></div><div style="height:5px;background:#2a2014;margin:1px 0 3px"><div id="shipbars-hf" style="height:100%;background:#b08a4a"></div></div><div>Rig <span id="shipbars-rig"></span></div><div style="height:5px;background:#2a2014;margin-top:1px"><div id="shipbars-rf" style="height:100%;background:#d8c8a0"></div></div>';document.body.appendChild(el);SHIPBAR.ui=el;}
    const show=!!(worldState.ship&&SHIP.mesh&&activeZoneId==='world'&&!(typeof isInterior==='function'&&isInterior())&&(SHIP.sailing||onDeck()));
    const b=show?shipBars():null,key=show?`${SHIP.name}|${b.hull}|${b.hullMax}|${b.rig}|${SHIP.sea||0}`:'';if(key===SHIPBAR.key)return;SHIPBAR.key=key;el.style.display=show?'block':'none';if(!show)return;
    const q=id=>document.getElementById(id);q('shipbars-name').textContent=`The ${SHIP.name}`;q('shipbars-sea').textContent=`Sea: ${SEA_WORD[SHIP.sea||0]}`;q('shipbars-hull').textContent=`${b.hull} / ${b.hullMax}`;q('shipbars-rig').textContent=`${b.rig} / 100`;
    q('shipbars-hf').style.width=(b.hull/b.hullMax*100)+'%';q('shipbars-hf').style.background=b.hull/b.hullMax<.25?'#c85040':'#b08a4a';q('shipbars-rf').style.width=b.rig+'%';
  }
  function applyShipClass(){const c=shipClass();SHIP.L=c.L;SHIP.W=c.W;if(SHIP.mesh){sc.remove(SHIP.mesh);SHIP.mesh=buildShipMesh(SHIP.L,SHIP.W);sc.add(SHIP.mesh);shipUpdatePlacement();}}
  function cargoBonus(){if(!SHIP.mesh)return 0;const t=(worldState.ship&&worldState.ship.cargo)||0;if(!t)return 0;return (Math.hypot(px-SHIP.x,pz-SHIP.z)<20||onDeck())?t*25:0;}
  const SHIPWRIGHT_LINES={
    gatelander:{
      raisePoor:c=>`Raising her is ${c} gold. The sea gives nothing back for less, and it gives grudgingly then.`,
      raised:`Three days, and she'll be lying at the quay here, Weaver willing. A drowned boat comes up slow, like a man who knows he's in the wrong.`,
      fetchPoor:f=>`Bringing her round is ${f} gold. A boat on the wrong shore is no boat at all, but a shipwright working for thanks is no shipwright either.`,
      fetched:`The lads'll have her alongside before your cup's cold. She's at the quay.`,
      mendPoor:g=>`Putting her right is ${g} gold. A stitch in time, they say, and they never once say it's free.`,
      mended:hw=>`${hw} in the yard, and she's sound again, hull and rig. Treat her kindly and she'll return it.`,
      refitPoor:(n,p)=>`A ${n} hull is ${p} gold. A bigger boat's a bigger bill, the same as a bigger house.`,
      refitted:n=>`She's a ${n} now. Longer, broader, and she'll carry more sail. You'll hardly know her, and she'll hardly know you.`,
      sailsPoor:p=>`That canvas is ${p} gold. Good cloth was never cheap, and cheap cloth was never good.`,
      sailed:k=>`New canvas. She'll make ${k} knots with a wind, and the wind is the Weaver's business, not mine.`,
      holdPoor:p=>`The carpentry's ${p} gold. Wood is dear, and the joiner dearer.`,
      held:n=>`More room below. You'll carry ${n} more aboard her, and you'll find a way to fill it.`},
    markman:{
      raisePoor:c=>`Raising her is ${c} gold.`,
      raised:`Three days, and she'll be lying at the quay here.`,
      fetchPoor:f=>`Bringing her round is ${f} gold.`,
      fetched:`Lads'll have her alongside by the time you've finished your drink. She's at the quay.`,
      mendPoor:g=>`Putting her right is ${g} gold.`,
      mended:hw=>`${hw} in the yard. She's sound again, hull and rig.`,
      refitPoor:(n,p)=>`A ${n} hull is ${p} gold.`,
      refitted:n=>`She's a ${n} now. Longer, broader, and she'll carry more sail.`,
      sailsPoor:p=>`That canvas is ${p} gold.`,
      sailed:k=>`New canvas. She'll make ${k} knots with a wind.`,
      holdPoor:p=>`The carpentry's ${p} gold.`,
      held:n=>`More room below. You'll carry ${n} more aboard her.`},
    aurennais:{
      raisePoor:c=>`The raising is ${c} gold, Master, payable before the work.`,
      raised:`Three days, Master, and she will be lying at the quay here. The yard's receipt is entered.`,
      fetchPoor:f=>`Bringing her round is ${f} gold, Master. The fee covers the crew and the tow.`,
      fetched:`The yard's crew has her alongside, Master. She is at the quay, as agreed.`,
      mendPoor:g=>`The repair is ${g} gold, Master, at the yard's posted rate.`,
      mended:hw=>`${hw} in the yard, Master. She is sound again, hull and rig, and the work is warranted to the next storm, if not through it.`,
      refitPoor:(n,p)=>`A ${n} hull is ${p} gold, Master. The yard does not extend credit on hulls.`,
      refitted:n=>`She is a ${n} now, Master: longer, broader, and rated for more sail. The new rating is entered against her name.`,
      sailsPoor:p=>`That canvas is ${p} gold, Master.`,
      sailed:k=>`New canvas, Master. Under a fair wind she should make ${k} knots. The yard warrants the cloth, not the wind.`,
      holdPoor:p=>`The joinery is ${p} gold, Master.`,
      held:n=>`More room below, Master. She is rated for ${n} more aboard.`},
    oldblood:{
      raisePoor:c=>`${c} gold, to raise her.`,
      raised:`Three days. She will be at the quay.`,
      fetchPoor:f=>`${f} gold, to bring her round.`,
      fetched:`She is at the quay.`,
      mendPoor:g=>`${g} gold.`,
      mended:hw=>`${hw} in the yard. Sound again, hull and rig.`,
      refitPoor:(n,p)=>`A ${n} hull is ${p} gold.`,
      refitted:n=>`A ${n} now. Longer. Broader. More sail.`,
      sailsPoor:p=>`${p} gold, the canvas.`,
      sailed:k=>`New canvas. ${k} knots, with a wind.`,
      holdPoor:p=>`${p} gold, the joinery.`,
      held:n=>`More room below. ${n} more.`}};
  function upgradeTopics(site){
    if(!worldState.ship)return [];
    const st=shipCfg();const out=[];const L=SHIPWRIGHT_LINES[peopleOfSite(site)]||SHIPWRIGHT_LINES.markman;
    if(st.sunk){if(st.raise)return out;const rc=shipRaiseCost();out.push({label:`Raise the ${st.name||SHIP.name} (${rc} gold)`,quest:true,fn:()=>{const c=shipRaiseCost();if(gold<c)return L.raisePoor(c);gold-=c;updateHUD();
      st.raise={site:site.id,due:(worldState.gameTimeAbsMinutes||0)+3*1440};if(typeof addLog==='function')addLog('⛵',`Paid ${site.name}'s shipwright to raise the ${st.name||SHIP.name}.`);return L.raised;}});return out;}
    if(SHIP.mesh&&!shipHere(site)){const fee=Math.min(150,Math.round(25+Math.hypot(SHIP.x-site.x,SHIP.z-site.z)/200));out.push({label:`Fetch the ${SHIP.name} to this harbour (${fee} gold)`,quest:true,fn:()=>{if(gold<fee)return L.fetchPoor(fee);gold-=fee;updateHUD();const sd=shoreDir(site)||{dx:1,dz:0};const q=site.quayStart||{x:site.x+sd.dx*site.pad,z:site.z+sd.dz*site.pad};SHIP.x=q.x+sd.dx*22;SHIP.z=q.z+sd.dz*22+ (sd.dx?12:0);SHIP.yaw=Math.atan2(-sd.dz,-sd.dx)+Math.PI/2;SHIP.speed=0;SHIP.sailing=false;shipUpdatePlacement();Object.assign(worldState.ship,{x:SHIP.x,z:SHIP.z,yaw:SHIP.yaw});if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} brought round to ${site.name}.`);return L.fetched;}});}
    const mc=shipMendCost();if(mc.gold>0&&shipHere(site)){const b=shipBars();out.push({label:`Mend her: hull ${b.hull} of ${b.hullMax}, rig ${b.rig} of 100 (${mc.gold} gold)`,quest:true,fn:()=>{const m=shipMendCost();if(gold<m.gold)return L.mendPoor(m.gold);gold-=m.gold;updateHUD();
      const s2=shipCfg();s2.hull=shipClass().hull;s2.rig=100;if(typeof advanceClock==='function')advanceClock(m.mins);else worldState.gameTimeMinutes+=m.mins;shipBarsUI();const h=Math.max(1,Math.round(m.mins/60));
      if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} mended at ${site.name}.`);return L.mended(h===1?'An hour':h+' hours');}});}
    const cls=st.cls||'sloop';const next=cls==='sloop'?'cog':cls==='cog'?'galleon':null;
    if(next)out.push({label:`Refit her as a ${next} (${SHIP_CLASSES[next].price} gold)`,quest:true,fn:()=>{const p=SHIP_CLASSES[next].price;if(gold<p)return L.refitPoor(next,p);gold-=p;updateHUD();st.cls=next;st.hull=SHIP_CLASSES[next].hull;applyShipClass();if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} refitted as a ${next}.`);return L.refitted(next);}});
    const sails=st.sails||0;if(sails<3)out.push({label:`Better sails, tier ${sails+1} (${SAIL_TIERS[sails+1]} gold)`,quest:true,fn:()=>{const p=SAIL_TIERS[sails+1];if(gold<p)return L.sailsPoor(p);gold-=p;updateHUD();st.sails=sails+1;return L.sailed(shipTopSpeed().toFixed(1));}});
    const cargo=st.cargo||0;if(cargo<2)out.push({label:`Bigger hold, tier ${cargo+1} (${CARGO_TIERS[cargo+1]} gold)`,quest:true,fn:()=>{const p=CARGO_TIERS[cargo+1];if(gold<p)return L.holdPoor(p);gold-=p;updateHUD();st.cargo=cargo+1;return L.held(25*(cargo+1));}});
    return out;
  }
  // ── fish ──
  const FISH_KINDS={shallow:['Herring','Bream','Mackerel'],deep:['Cod','Silverfin','Ling'],cold:['Char','Haddock'],warm:['Grouper','Snapper']};
  function nearSchool(){if(!isSwimming())return null;for(const s of LIFE.fish){if(s.cool>0)continue;if(Math.hypot(px-s.cx,pz-s.cz)<s.r+1.4&&Math.abs(jumpY-s.y)<1.6)return s;}return null;}
  function fishPrompt(){return nearSchool()?"Press 'E' to catch a fish":null;}
  function catchFish(){const s=nearSchool();if(!s)return false;
    const [i,j]=cellOf(px,pz);const cl=climateOfCell(i,j);const bed=worldH(px,pz);
    const pool=(cl==='cold'&&Math.random()<.5)?FISH_KINDS.cold:(cl==='warm'&&Math.random()<.5)?FISH_KINDS.warm:bed<-5?FISH_KINDS.deep:FISH_KINDS.shallow;
    const name=pool[Math.floor(Math.random()*pool.length)];const big=Math.random()<.12;
    const item={name:(big?'Fine ':'')+name,ico:'🐟',type:'misc',weight:big?1.2:.6,sellMult:big?1.2:.7,buyPrice:big?26:9,qty:1,_typeKey:'fish'};
    if(typeof canCarry==='function'&&!canCarry(item)){showMsg('Too heavy to carry!','#cc8844');return true;}
    if(typeof bagAdd==='function')bagAdd(item);s.cool=18+Math.random()*12;splash(false);showMsg(`Caught a ${item.name}.`,'#88cc88');if(typeof addLog==='function')addLog('🐟',`Caught a ${item.name}.`);return true;}
  function tickSchoolCool(dt){for(const s of LIFE.fish)if(s.cool>0)s.cool-=dt;}
  // ── whales ──
  const WHALES=[];
  function spawnWhale(x,z){const c=k=>new THREE.Color(k);const g=mergeParts([{geo:new THREE.CylinderGeometry(1.6,.7,14,10),color:c(0x3a4650),rx:Math.PI/2,jitter:.03},{geo:new THREE.SphereGeometry(1.7,10,8),color:c(0x3a4650),z:7,jitter:.03},{geo:new THREE.BoxGeometry(5.2,.3,2.2),color:c(0x2e3a44),z:-8.2,jitter:.03},{geo:new THREE.ConeGeometry(.5,1.2,4),color:c(0x2e3a44),y:1.6,z:-2},{geo:new THREE.BoxGeometry(2.6,.25,1.4),color:c(0x2e3a44),x:2.2,z:2.5,y:-.6},{geo:new THREE.BoxGeometry(2.6,.25,1.4),color:c(0x2e3a44),x:-2.2,z:2.5,y:-.6}]);
    const m=new THREE.Mesh(g,VC_MAT);sc.add(m);const w={m,x,z,yaw:Math.random()*Math.PI*2,ph:Math.random()*10,spout:null};
    const sp=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(60*3),3)),new THREE.PointsMaterial({color:0xe8f0f8,size:.35,transparent:true,opacity:.8,depthWrite:false}));sp.visible=false;sc.add(sp);w.spout=sp;WHALES.push(w);return w;}
  function tickWhales(dt,now){
    if(atSea()&&WHALES.length<2&&Math.random()<dt*.04){for(let k=0;k<10;k++){const a=Math.random()*Math.PI*2,d=180+Math.random()*220;const x=px+Math.cos(a)*d,z=pz+Math.sin(a)*d;if(worldH(x,z)<-6){spawnWhale(x,z);break;}}}
    for(let i=WHALES.length-1;i>=0;i--){const w=WHALES[i];if(Math.hypot(w.x-px,w.z-pz)>700){sc.remove(w.m);sc.remove(w.spout);WHALES.splice(i,1);continue;}
      w.yaw+=Math.sin(now*.0003+w.ph)*.15*dt;const fx=-Math.sin(w.yaw),fz=-Math.cos(w.yaw);const nx=w.x+fx*2.2*dt,nz=w.z+fz*2.2*dt;if(worldH(nx,nz)<-6){w.x=nx;w.z=nz;}else w.yaw+=1.2*dt;
      const t=now*.0009+w.ph;const surf=Math.sin(t);const y=SEA_Y-3.2+surf*3.4;w.m.position.set(w.x,y,w.z);w.m.rotation.y=w.yaw+Math.PI;w.m.rotation.x=-Math.cos(t)*.25;
      const up=surf>.85;w.spout.visible=up;if(up){const p=w.spout.geometry.attributes.position.array;for(let k=0;k<60;k++){const h=(k/60)*(4+surf*2),spread=.2+h*.25;p[k*3]=w.x+fx*4+(Math.random()-.5)*spread;p[k*3+1]=y+1.8+h;p[k*3+2]=w.z+fz*4+(Math.random()-.5)*spread;}w.spout.geometry.attributes.position.needsUpdate=true;if(!w._blew){w._blew=true;if(typeof sfxNoise==='function'&&Math.hypot(w.x-px,w.z-pz)<120)sfxNoise(.9,0,0,.12,900);}}else w._blew=false;}
  }
  // ── pirates board you; hulls push apart ──
  const BOARDERS=[];
  function tickBoarding(dt){
    if(!SHIP.mesh)return;
    for(const o of OTHER){
      if(o.kind!=='pirate'||o.boarded||o.dead)continue;
      const d=Math.hypot(o.x-SHIP.x,o.z-SHIP.z);
      const mine=onDeck()||SHIP.sailing;
      if(mine&&d<40){o.closeT=(o.closeT||0)+dt;}else o.closeT=0;
      if(mine&&d<16&&o.closeT>12&&!o.sentBoarders){o.sentBoarders=true;let n=0;
        for(const e of o.crew){if(e.dead||n>=2)continue;n++;const fwd=[-Math.sin(SHIP.yaw),-Math.cos(SHIP.yaw)];e.x=SHIP.x+fwd[0]*(-2+n*2);e.z=SHIP.z+fwd[1]*(-2+n*2);e.alert=true;e._ship={plat:SHIP.plat};e._from=o;BOARDERS.push(e);const k=o.crew.indexOf(e);if(k>=0)o.crew.splice(k,1);}
        if(n){showMsg('Pirates on your deck!','#ff6060');splash(true);}}
    }
    pirateBoardersHold();
    // keep boarders aboard
    const p=SHIP.plat;for(let i=BOARDERS.length-1;i>=0;i--){const e=BOARDERS[i];if(e.dead){BOARDERS.splice(i,1);continue;}if(!e._lx){e._lx=SHIP.x;e._lz=SHIP.z;}e.x+=SHIP.x-e._lx;e.z+=SHIP.z-e._lz;e._lx=SHIP.x;e._lz=SHIP.z;e.x=Math.max(p.x0+.6,Math.min(p.x1-.6,e.x));e.z=Math.max(p.z0+.6,Math.min(p.z1-.6,e.z));e.homeX=SHIP.x;e.homeZ=SHIP.z;}
  }
  // S399 — leave your own deck while boarders stand on it and they take half the hold, then go back over the rail to their ship
  function pirateBoardersHold(){if(PHP<=0||!worldState.ship||!SHIP.plat||deckOff(SHIP.plat)<1.5)return;const live=BOARDERS.filter(e=>!e.dead);if(!live.length)return;
    const took=pirateTake();if(!took.length)return;const o=live[0]._from,home=!!(o&&OTHER.includes(o));
    for(const e of live){BOARDERS.splice(BOARDERS.indexOf(e),1);
      if(home){e.x=o.x+(Math.random()-.5)*2;e.z=o.z+(Math.random()-.5)*2;e.homeX=o.x;e.homeZ=o.z;e._ship=o;o.crew.push(e);}
      else{if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const j=ZONES.world.enemies.indexOf(e);if(j>=0)ZONES.world.enemies.splice(j,1);}}
    const what=home?pirateStow(o,took):took.map(k=>`a ${CARGO_GOODS[k].n.toLowerCase()}`).join(', ');
    showMsg(`They hold your deck, take ${what} from the hold and go back over the rail.`,'#ff8060');}
  function tickHullCollisions(dt){
    const hulls=[];if(SHIP.mesh)hulls.push({o:SHIP,L:SHIP.L,W:SHIP.W,mine:true});for(const o of OTHER)hulls.push({o,L:o.L||13,W:o.W||4.4});
    for(let i=0;i<hulls.length;i++)for(let j=i+1;j<hulls.length;j++){const a=hulls[i],b=hulls[j];const dx=b.o.x-a.o.x,dz=b.o.z-a.o.z;const d=Math.hypot(dx,dz)||.01;const minD=(a.L+b.L)/2*.62;
      // S411 — a ram: on first touch your hull takes the closing speed × 3, half if your bow is on her; they part before it counts again
      if(a.mine){if(d<minD&&!b.o._touch){b.o._touch=true;const ux=dx/d,uz=dz/d,fa=[-Math.sin(a.o.yaw),-Math.cos(a.o.yaw)],fb=[-Math.sin(b.o.yaw||0),-Math.cos(b.o.yaw||0)];
          const close=(fa[0]*(a.o.speed||0)-fb[0]*(b.o.speed||0))*ux+(fa[1]*(a.o.speed||0)-fb[1]*(b.o.speed||0))*uz;const bow=(a.o.speed||0)>.5&&fa[0]*ux+fa[1]*uz>.7;
          const rammed=!!b.o.ramming;if(rammed){b.o.ramming=0;b.o.ramWait=PIRATE_RAM.wait;}
          if(close>.5){const w=shipWear(close*3*(bow?.5:1),0);if(w&&w.hull){showMsg(`${bow?'You ram her':rammed?'The black sail rams you':'The hulls strike'}. Hull −${w.hull}.`,'#ff8060');a._bump=performance.now();}}}
        else if(d>minD+1)b.o._touch=false;}
      if(d<minD){const push=(minD-d)*.5;const ux=dx/d,uz=dz/d;a.o.x-=ux*push;a.o.z-=uz*push;b.o.x+=ux*push;b.o.z+=uz*push;a.o.speed*=.6;b.o.speed*=.6;if(!a._bump||performance.now()-a._bump>1500){a._bump=performance.now();if(typeof sfxNoise==='function')sfxNoise(.5,0,0,.16,240);if(a.mine||b.mine)showMsg('Hulls grind together.','#c8b880');}}}
  }

  // ═══ DIALOG II (Session J) ═══════════════════════════════════════════
  // Every generated NPC gets a temperament that colours their lines, a
  // small biography (origin, family, years here, a worry), and topics that
  // draw on the live world: the town's lord, the weather, what's actually
  // nearby, pirates seen from the quay, the guild's business. Topics are
  // built on open (getter), so they change with the hour and with what
  // you've done. NPCs remember you.
  const TEMPERS={
    warm:  {greet:["Well now — you look half frozen. Come closer.","Good to see a new face. Truly.","Sit, sit. You've walked a way."],yes:"Of course.",no:"I'd rather not, if it's all the same.",bye:["Safe roads, friend.","Come back and tell me how it went."]},
    gruff: {greet:["What.","Say it, then.","I've work to do. Be quick."],yes:"Fine.",no:"No.",bye:["Go on, then.","Mind the door."]},
    nervous:{greet:["Oh — you startled me.","Is something wrong? You look like something's wrong.","Keep your voice down, would you?"],yes:"I suppose.",no:"I don't think that's wise.",bye:["Careful out there. Please.","Don't tell anyone I said anything."]},
    pious: {greet:["Blessings on the road that brought you.","The Light keeps this door.","You carry weight, traveller. Set it down a moment."],yes:"As it should be.",no:"That isn't for me to give.",bye:["Walk in light.","May the ground hold under you."]},
    sly:   {greet:["Now here's someone with coin in their step.","Ask me anything. Some answers cost.","You've the look of trouble. I like trouble."],yes:"Naturally.",no:"Ah. No.",bye:["Don't get caught.","We never spoke."]},
    weary: {greet:["Another one.","Mm. What is it.","I was young once, you know. Ask your question."],yes:"If you must.",no:"No. Not today.",bye:["Go well. Or go. Either.","Shut the door behind you."]},
  };
  const TEMPER_IDS=Object.keys(TEMPERS);
  const WORRIES=["the wolves came right up to the fence last winter","the tithe went up again and nobody says why","my brother took the king's coin and never wrote","the well's gone brackish and the elder does nothing","there's a light in the old ruin some nights","the road hasn't seen a merchant cart in a month","the priest talks less than he used to","the fish have moved off the shallows"];
  const WISHES=["to see the capital before I die","a roof that doesn't leak","one good harvest, just one","to hear from my daughter","a quiet year","to go to sea again","to be left alone, mostly"];
  const TRADES_BY_ROLE={Villager:['farmer','weaver','cooper','fisher','shepherd','thatcher','midwife','carter','beekeeper','net-mender'],Guard:['soldier'],Smith:['smith'],Armourer:['armourer'],Apothecary:['apothecary'],Merchant:['trader'],Innkeeper:['innkeeper'],Priest:['priest'],Harbourmaster:['harbourmaster'],Shipwright:['shipwright']};
  function temperOf(name){const h=String(name).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,5);return TEMPER_IDS[h%TEMPER_IDS.length];}
  function metCount(name){return (worldState.met&&worldState.met[name])||0;}
  function noteMet(name){(worldState.met||(worldState.met={}))[name]=metCount(name)+1;}
  function bioFor(site,reg,r,role,name){
    const cells=[...CELLS.values()].filter(c=>c.type!=='sea');const other=cells.length?pick(r,pick(r,cells).sites.filter(t=>t.pad>0&&t.id!==site.id)):null;
    const born=r()<.55?site.name:(other?other.name:site.name);const years=3+Math.floor(r()*40);
    const names=NAMES[reg]||NAMES.irish;const spouse=r()<.5?pick(r,r()<.5?names.m:names.f):null;const kids=r()<.5?1+Math.floor(r()*3):0;
    const trade=pick(r,TRADES_BY_ROLE[role]||TRADES_BY_ROLE.Villager);
    return {born,years,spouse,kids,trade,worry:pick(r,WORRIES),wish:pick(r,WISHES)};
  }
  function lordFor(site){
    if(site.lord)return site.lord;const h=String(site.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,9);const rr=cellRng(h%9973,h%7919,1);
    const [ci_,cj_]=cellOf(site.x,site.z);const lp=PEOPLES[nationOf(ci_,cj_).people];const names=NAMES[lp.names]||NAMES.irish;const female=rr()<.4;const nm=pick(rr,female?names.f:names.m);
    const NT=nationOf(ci_,cj_).titles;const tt=NT[site.kind]||'Elder';const title=Array.isArray(tt)?tt[female?1:0]:tt;
    const style=pick(rr,['fair but tired','hard as the walls','well liked, badly advised','new to it and knows it','old, and forgets nothing']);
    site.lord={name:nm,title,style,female};return site.lord;
  }
  function weatherLine(){const t=WX.type;return t==='storm'?"This storm'll take a roof or two.":t==='rain'?"Rain again. The road'll be mud to the knee.":t==='snow'?"Snow's early this year. Or late. I lose track.":t==='fog'?"Can't see the end of the street. Don't wander.":t==='overcast'?"Grey. It's been grey a week.":"Clear as a bell. Make use of it.";}
  function liveRumours(site){
    const out=[];const [ci,cj]=cellOf(site.x,site.z);const c=getCell(ci,cj);
    if(OTHER.some(o=>o.kind==='pirate'&&Math.hypot(o.x-site.x,o.z-site.z)<600))out.push("Black sails off the coast this morning. The fishermen came straight back in.");
    const G=worldState.guild;if(G){for(const g in G){const t=G[g].active;if(t&&t.siteId===site.id)out.push(t.kind==='raid'?"They say bandits are coming for us. The guild sent someone. Maybe you.":t.kind==='beast'?`Something's been at the sheep. ${t.beast||'A beast'}, they say.`:"The guild's got business here. Everyone's on edge.");}}
    if(isNight())out.push("Don't go past the last lamp. Not tonight.");
    {const L=fstate().league;if(L.rowe==='dead'&&L.closed&&nationKeyOf(ci,cj)==='mark')out.push("Somebody put Hesket Rowe down on the yard at Caer Slige after she'd yielded. Nobody says the name. Everybody knows it.");} // S374 — the yard's murder, in the Mark
    {const d=nearestSigilDoorFrom(site);if(d&&Math.random()<.5)out.push(`There's a warm stone in ${d.name}, ${compassWord(d.x-site.x,d.z-site.z)} of here. My cousin put his hand on it and talked in his sleep for a week.`);}
    if(c.polity==='wilds')out.push("No lord out here. We settle things ourselves. Mostly with shovels.");
    if(c.polity==='marches')out.push("The forts are full again. Someone's expecting a war.");
    const lk=c.lakes[0];if(lk&&r01()<.4)out.push(`There's a fish in ${lk.name} as long as a boat. My uncle saw it. He drinks, but still.`);
    const pk=c.peaks[0];if(pk&&r01()<.4)out.push(`Nobody's been to the top of ${pk.name} and come back to say so.`);
    return out;
  }
  function r01(){return Math.random();}
  function localLore(site){
    const [ci,cj]=cellOf(site.x,site.z);const c=getCell(ci,cj);const bits=[];
    c.peaks.forEach(p=>bits.push(`${p.name} stands ${compassWord(p.x-site.x,p.z-site.z)}`));c.lakes.forEach(l=>bits.push(`${l.name} lies ${compassWord(l.x-site.x,l.z-site.z)}`));
    if(c.rivers.length)bits.push('a river runs through the province — follow it down to the sea');
    const ports=c.sites.filter(t=>t.kind==='port');if(ports.length)bits.push(`ships put in at ${ports[0].name}`);
    return bits.length?bits.join('; ')+'.':"Nothing here but what you see.";
  }
  // topic set for a generated NPC; built on open so it reflects the moment
  function richTopics(site,reg,r,role,name,def){
    const T=TEMPERS[def.temper];const bio=def.bio;const lord=lordFor(site);
    const base=[];
    const t=[];
    t.push({label:'What is this place?',response:siteBlurb(site)+` ${lord.title} ${lord.name} has the say here — ${lord.style}.`});
    t.push({label:'Who are you?',response:(bio.born===site.name?`Born here. ${bio.years} years, man and boy.`:`I came from ${bio.born}, ${bio.years} years back.`)+` I'm a ${bio.trade}.`+(bio.spouse?` Married to ${bio.spouse}${bio.kids?`, ${bio.kids} ${bio.kids>1?'children':'child'}`:''}.`:'')+` If I want anything it's ${bio.wish}.`,then:[{label:'Anything troubling you?',response:`Since you ask — ${bio.worry}. ${T.no==='No.'?"Not that it's your business.":"Nobody listens, so."}`}]});
    t.push({label:'Where do the roads go?',response:def._roadLine});
    t.push({label:'Anything dangerous nearby?',response:def._doorLine,then:[{label:'What would you do about it?',response:pick(Math.random,["Leave it be. That's what I'd do.","Hire the Fighters' Guild. That's what they're for.","Go in daylight, with a friend, and don't touch the walls.","Nothing. It's been there longer than us."])}]});
    t.push({label:'Any news?',get response(){const live=liveRumours(site);return live.length&&Math.random()<.7?pick(Math.random,live):pick(Math.random,RUMORS[reg]||RUMORS.irish);}});
    t.push({label:'How\u2019s the weather been?',get response(){return weatherLine();}});
    t.push({label:'Tell me about the land here.',response:localLore(site)});
    t.push({label:`What do you make of ${lord.title} ${lord.name}?`,response:pick(Math.random,[`${lord.style.charAt(0).toUpperCase()+lord.style.slice(1)}. Could be worse.`,"Keeps the roads open. Ask for more and you'll wait.","You'll find them "+(site.kind==='city'?'in the keep':site.kind==='village'?'by the well of a morning':'at the inn, most evenings')+". Take a gift.","We don't talk about that with strangers."])});
    {const mine=def.people||'gatelander';const P=PEOPLES[mine];Object.keys(P.of).forEach(o=>{if(o===mine)return;const O=PEOPLES[o];t.push({label:`What do you make of the ${o==='oldblood'?'Old Blood':o==='markman'?'Markmen':o==='aurennais'?'Aurennais':'Gatelanders'}?`,get response(){return pick(Math.random,P.of[o]);}});});}
    // ── depth: every role gets a full set in each folder ──
    const [ni,nj]=cellOf(site.x,site.z);const NAT=nationOf(ni,nj);const P=PEOPLES[def.people||NAT.people]||PEOPLES.gatelander;
    const shopsHere=(SETTLE.get(site.id)||{houses:[]}).houses.filter(h=>h.type!=='home').map(h=>h.type);const have=k=>shopsHere.includes(k);
    t.push({cat:'you',label:'What do you do here?',response:`I'm a ${bio.trade}. ${bio.trade==='farmer'?'Barley, when it comes up. Mud, when it doesn\'t.':bio.trade==='fisher'?'Nets in the dark, fish in the morning, if the Sea\'s in the mood.':bio.trade==='smith'?'Nails, mostly. Everyone wants swords; everyone needs nails.':bio.trade==='soldier'?'I stand where I\'m put and I don\'t sleep much.':bio.trade==='priest'?'I bury people and tell the rest not to worry. One of those I\'m good at.':bio.trade==='innkeeper'?'Beds, ale, and other people\'s trouble.':'The same as my mother did, and hers.'}`});
    t.push({cat:'you',label:'Family?',response:bio.spouse?`${bio.spouse}. ${bio.kids?`${bio.kids} ${bio.kids>1?'children':'child'}, and they eat like it.`:'No children. We tried.'}`:pick(Math.random,["Not anymore.","Never got round to it. The work doesn't leave much.","A brother somewhere. We don't write."])});
    t.push({cat:'you',label:'How long have you lived here?',response:bio.born===site.name?`All my life. ${bio.years} years, if you're counting. I stopped.`:`${bio.years} years, since ${bio.born}. It's home now. Mostly.`});
    t.push({cat:'you',label:'What do you want out of life?',response:`${bio.wish.charAt(0).toUpperCase()+bio.wish.slice(1)}. ${pick(Math.random,["Ask me again when I'm old.","Is that so much?","Don't laugh.","You asked."])}`});
    t.push({cat:'you',label:'Your people?',response:`${P.self}. ${P.name==='Old Blood'?"We were here before the rest. We don't say it loudly.":P.name==='Markman'?"Iron and blood. It's on the banners and it's in the bread.":P.name==='Aurennais'?"On account, and on paper. It's kept us fed a long time.":"We keep the roads and the promises. Somebody has to."}`});
    t.push({cat:'place',label:'Who runs things here?',response:`${lord.title} ${lord.name}. ${lord.style.charAt(0).toUpperCase()+lord.style.slice(1)}. Above ${lord.title==='Elder'?'them':'that'}, ${NAT.crown} — for what it's worth out here.`});
    t.push({cat:'place',label:'Where can I sleep?',response:have('inn')?`The inn. A room's a few coins a night; ${lord.title} ${lord.name} doesn't let them gouge.`:`No inn. There's a camp on the road, or a friend's floor if you've a friend. Try ${nearSites(site,900).find(x=>x.kind==='town'||x.kind==='city')?.name||'the next town'}.`});
    t.push({cat:'place',label:'What can I buy here?',response:shopsHere.length?`${[...new Set(shopsHere.map(k=>({forge:'the smith',weapon:'the smith',armoury:'the armourer',armor:'the armourer',apothecary:'the apothecary',potion:'the apothecary',goods:'the general goods',misc:'the general goods',inn:'the inn',church:'the church',shipwright:'the shipwright',guild_f:"the Fighters' Guild",guild_m:"the Mages' Guild",castle:'the keep',keep:'the keep'})[k]||k))].join(', ')}. ${prosperity(site)<40?'Not much on the shelves lately.':'Fair prices, mostly.'}`:'Nothing. We trade with each other and with the carts, when carts come.'});
    t.push({cat:'place',label:'What\u2019s the law here?',response:NAT.people==='markman'?"The Captain's word, and a duel if you don't like it. Fair, in its way.":NAT.people==='aurennais'?"The Compact's. Everything's written, everything's tithed, and the Prior reads it back to you slowly.":"The Crown's. Patrols on the roads, a magistrate twice a year, and the old gates are royal property — so they say."});
    t.push({cat:'place',label:'The nearest old gate?',get response(){const d=nearestSigilDoorFrom(site);const doors=(getCell(ni,nj).doors||[]).map(e=>({e,p:dungeonWorldPos[e.seed]||e})).sort((a,b)=>Math.hypot(a.p.x-site.x,a.p.z-site.z)-Math.hypot(b.p.x-site.x,b.p.z-site.z));const n=doors[0];return n?`${n.e.canonicalName||(typeof dungeonName==='function'?dungeonName(n.e.seed,n.e.theme):'An old gate')}, ${compassWord(n.p.x-site.x,n.p.z-site.z)} of here. ${d&&d.seed===n.e.seed?'There\'s a warm stone in it, they say.':'Leave it be, unless you\'re the sort who doesn\'t.'}`:'None near. Count yourself lucky.';}});
    t.push({cat:'place',label:'How are things here, honestly?',get response(){return `${stateLine(site)}. ${prosperity(site)>=60?'Better than my father saw.':prosperity(site)>=35?'We get by.':'You can see for yourself.'}`;}});
    t.push({cat:'news',label:`What of ${NAT.crown}?`,response:NAT.people==='markman'?"The League? Captains arguing in a hall. They agree on one thing — the Crown's ships shouldn't be in our strait.":NAT.people==='aurennais'?"The Compact tithes and the Church blesses the tithe. Between them they own the sea. Don't say I said it.":"The Crown wants the gates. Says they're royal. My grandmother said they were the Weaver's. Neither of them's ever been down one."});
    t.push({cat:'news',label:'Any word from the sea?',get response(){const pirates=OTHER.some(o=>o.kind==='pirate');return pirates?"Black sails, this week. The fishermen came in early and won't say why.":pick(Math.random,["The ferries are running. That's news enough.","A whale off the point, they say. Big as a church.","Quiet. Too quiet for the harbourmaster, who likes a tithe."]);}});
    t.push({cat:'news',label:'How\u2019s trade?',get response(){const R=worldState.routes||{};const open=Object.keys(R).filter(k=>!R[k].broken&&(R[k].a===site.id||R[k].b===site.id)).length;return open?`A cart in the morning, a cart at night. ${open>1?'Two routes now.':'One route.'} Prices are kinder for it.`:prosperity(site)>=50?"Steady. We could do with a route to somewhere, if anyone with coin were listening.":"What trade. The road's a road; nothing comes down it.";}});
    t.push({cat:'news',label:'Heard anything strange?',get response(){return pick(Math.random,["A man at the old field who doesn't age. Everyone's uncle has seen him.","The stones in the gates are warmer than they were. Or colder. Depends who you ask.","Someone's been carving over the old marks. Down in the gates. Nobody knows what for.","The church has a room it bricked up. You didn't hear that from me."]);}});
    if(role==='Villager')t.push({cat:'you',label:'Any work going?',response:`Not from me. The ${site.kind==='city'||site.kind==='town'?'guilds take contracts, and':''} ${lord.title} pays for real trouble. Ask at the ${site.kind==='city'?'keep':'well'}.`});
    if(role==='Innkeeper')t.push({label:'Who\u2019s passing through?',get response(){return pick(Math.random,["A carter from the north who won't say what he carried.","Two guild swords, drinking like they'd earned it.","Nobody. It's you and the fire."+(isNight()?" And whatever's outside.":""),"A priest who paid in silver and ate nothing."]);}});
    if(role==='Priest')t.push({label:'A blessing?',fn:()=>{PHP=Math.min(effMaxHP(),PHP+8);updateHUD();return "Kneel. There. Go easier on the road.";}});
    if(role==='Guard')t.push({label:'Any trouble on the watch?',get response(){return pick(Math.random,["Quiet. Too quiet, my sergeant would say, but he says that about bread.","Wolves at the north fence three nights running.","Someone's been at the graves. Don't ask me who.",isNight()?"Night watch. Everything's trouble at night.":"A drunk, a cart, and you. Fine day."]);}});
    return t;
  }
  function dialogFor(site,reg,r,role,name,extraTopics,def){
    // the def already has _roadLine/_doorLine; topics are rebuilt on each open
    const T=TEMPERS[def.temper];
    Object.defineProperty(def,'topics',{configurable:true,get(){
      // top level: the NPC's own business (shop, ferries, quests, purchases) + three folders
      const extra=[...(def._extra||extraTopics||[]),...(def._extraFn?def._extraFn():[])];
      const ferries=extra.filter(t=>/^Passage to/.test(t.label)),rest=extra.filter(t=>!/^Passage to/.test(t.label));
      const rich=richTopics(site,reg,r,role,name,def);
      const folder=(label,items,say)=>({label,folder:true,response:say||pick(Math.random,['Ask, then.','Go on.','What would you know?','Well?']),follow:items});
      const you=rich.filter(t=>t.cat==='you'||(!t.cat&&/Who are you|troubling|work going|blessing|passing through|on the watch/i.test(t.label)));
      const place=rich.filter(t=>t.cat==='place'||(!t.cat&&/this place|roads go|dangerous|land here|make of|would you do/i.test(t.label)&&!/make of the/.test(t.label)));
      const folk=rich.filter(t=>/make of the/.test(t.label));
      const news=rich.filter(t=>t.cat==='news'||(!t.cat&&/news|weather/i.test(t.label)));
      const list=[...rest];
      if(ferries.length)list.push(folder(`Passage \u2026 (${ferries.length} routes)`,ferries,'Where to? The fares are what they are.'));
      {const where=directionTopics(site,def);if(where.length)list.push(folder('Where can I find \u2026',where,pick(Math.random,['What are you after?','Lost? It happens.','Depends what you want.'])));} // v80 S138
      list.push(folder('About you \u2026',you,'Me? Not much to tell. Ask.'),folder('About this place \u2026',place,'This place. Go on.'),folder('Other folk \u2026',folk,'Other folk. Careful what you ask.'),folder('News \u2026',news,'News travels slow here. What I have:'));
      // follow-ups: a topic with `then` reveals its sub-topics after it's chosen
      const expanded=[];for(const tp of list){expanded.push(tp);}
      // follow-ups live inside the folders: expand them there
      [you,place].forEach(arr=>{for(let i=arr.length-1;i>=0;i--){const tp=arr[i];if(tp.then&&def._asked&&def._asked.has(tp.label))tp.then.forEach((x,k)=>arr.splice(i+1+k,0,Object.assign({},x,{label:'  \u21b3 '+x.label})));}});
      expanded.push({label:Math.random()<.5?pick(Math.random,(PEOPLES[def.people||'gatelander']).bye):pick(Math.random,T.bye),bye:true});
      // remember what was asked (wrap fn/response so choosing marks it)
      return expanded.map(tp=>{const w=Object.assign({},tp);const orig=w.fn;w.fn=(c)=>{(def._asked||(def._asked=new Set())).add(tp.label);const rr=orig?orig(c):undefined;return rr;};if(!orig&&!w.response&&Object.getOwnPropertyDescriptor(tp,'response')){}return w;});
    }});
    Object.defineProperty(def,'greeting',{configurable:true,get(){const n=metCount(def.name);const P=PEOPLES[def.people||'gatelander'];const pg=peopleGreeting(def);const pp=playerPeople();const asideOK=n===0&&pg&&(pp==='oldblood'||Math.random()<.5);const aside=asideOK?(pp==='oldblood'?' '+pg:(pp===def.people?' '+pg:` You're ${pp==='aurennais'?'Aurennais':pp==='markman'?'a Markman':'a Gatelander'}, by the look of you. ${pg}`)):'';const g=(n>0?pick(Math.random,["Back again?","You. Good.","I remember you.","Thought I'd seen the last of you."]):(Math.random()<.5?pick(Math.random,P.greet):pick(Math.random,T.greet)))+aside;const rank=worldState.guild&&(worldState.guild.guild_f.done>=3||worldState.guild.guild_m.done>=3)?" Guildsman.":"";const owner=worldState.owned&&Object.values(worldState.owned).some(o=>o.site===site.id)?" Neighbour.":"";noteMet(name);return [g+owner+rank];}});
    return def;
  }

  // ═══ QUESTS (Session K) ══════════════════════════════════════════════
  // One journal for everything: guild tasks (Session 12) and town quests
  // from lords. A quest is {id, giver, title, desc, objective, kind, data,
  // done, turnedIn, reward}. Town quests are generated from the world like
  // guild tasks; guild ranks add authored commissions at the milestones.
  // Active objectives get a marker on the map. Hooks: onKill, pickups,
  // onTalk, arriving somewhere.
  function plural(n,t){const p=t==='Wolf'?'Wolves':t==='Snow Wolf'?'Snow Wolves':t.endsWith('s')?t:t+'s';return n===1?t:p;}
  function QJ(){return worldState.quests||(worldState.quests=[]);}
  function qFind(id){return QJ().find(q=>q.id===id);}
  function qActive(){return QJ().filter(q=>!q.turnedIn);}
  function qAdd(q){QJ().push(q);if(typeof addLog==='function')addLog('📜',`${q.title} — ${q.giver}`);showMsg(`New quest: ${q.title}`,'#e8d8a0');return q;}
  function qComplete(q){if(q.done)return;q.done=true;showMsg(`${q.title}: done — report to ${q.giver}.`,'#e8d8a0');if(typeof addLog==='function')addLog('✅',`${q.title}: objective complete.`);}
  function qTurnIn(q){q.turnedIn=true;const paid=questGold(q.reward);q.paid=paid;gold+=paid;(worldState.stats||(worldState.stats={})).goldIn=((worldState.stats||{}).goldIn||0)+paid;xp+=Math.round((q.reward||0)*.9);chkLvl();updateHUD();if(typeof addLog==='function')addLog('🏅',`${q.title}: ${paid} gold.`);return paid;}
  // ── town quests ──
  const TOWN_KINDS=['cull','retrieve','deliver','find','road'];
  function townQuestFor(site,force){
    const active=qActive().find(q=>q.giverSite===site.id);if(active)return active;
    const lord=lordFor(site);const r=Math.random;const [ci,cj]=cellOf(site.x,site.z);const c=getCell(ci,cj);
    const kind=force||TOWN_KINDS[Math.floor(r()*TOWN_KINDS.length)];const tier=Math.floor(level/3);const reward=40+tier*30+Math.floor(r()*30);
    const id='tq_'+site.id+'_'+Date.now();const giver=`${lord.title} ${lord.name}`;
    const biome=dominantRegion(site.x,site.z).r.biome;
    if(kind==='cull'){const t=({tundra:'Snow Wolf',fen:'Bog Crawler',swamp:'Bog Crawler',dunes:'Sand Scorpion',wasteland:'Ash Hound',moor:'Kobold',forest:'Wolf',autumn:'Boar'}[biome])||'Wolf';const n=4+tier;return {id,giver,giverSite:site.id,title:`${plural(2,t)} at ${site.name}`,desc:`${lord.name}: "${plural(2,t)} have been at the flocks. Kill ${n} of them within sight of the walls and the ${site.kind} will pay."`,objective:`Kill ${n} ${plural(n,t)} near ${site.name}`,kind,data:{target:t,need:n,have:0,x:site.x,z:site.z,radius:520},reward};}
    if(kind==='retrieve'){const doors=nearDoors(site,700,false);const e=doors[Math.floor(r()*Math.min(3,doors.length))];if(e){const p=dungeonWorldPos[e.seed]||{x:e.x,z:e.z};const item=pick(r,["my mother's ring","the parish silver","the reeve's seal","a bolt of dyed cloth","the old survey"]);return {id,giver,giverSite:site.id,title:`${item.charAt(0).toUpperCase()+item.slice(1)}`,desc:`${lord.name}: "Thieves took ${item} and ran for ${e.canonicalName||'an old gate'}, ${compassWord(p.x-site.x,p.z-site.z)} of here. It'll be dropped by the door — they never carry far. Bring it back."`,objective:`Recover ${item} near ${e.canonicalName||'the old gate'}`,kind,data:{x:p.x+7,z:p.z+5,got:false,item},reward:reward+20};}}
    if(kind==='deliver'){const others=nearSites(site,900).filter(t=>t.pad>=45&&t.kind!=='portal');const t=others[Math.floor(r()*Math.min(4,others.length))];if(t){const tl=lordFor(t);return {id,giver,giverSite:site.id,title:`A letter for ${tl.title} ${tl.name}`,desc:`${lord.name}: "Carry this to ${tl.title} ${tl.name} at ${t.name}, ${compassWord(t.x-site.x,t.z-site.z)} of here. Put it in their hand, no one else's."`,objective:`Deliver the letter to ${tl.title} ${tl.name} at ${t.name}`,kind,data:{siteId:t.id,who:tl.name,x:t.x,z:t.z,done:false},reward};}}
    if(kind==='find'){const bedsAll=beds.filter(b=>Math.hypot(b.x-site.x,b.z-site.z)<700);const names=NAMES[site.reg||'irish']||NAMES.irish;const who=pick(r,r()<.5?names.m:names.f);const spot=bedsAll[0]?{x:bedsAll[0].x,z:bedsAll[0].z}:{x:site.x+Math.cos(r()*6.28)*380,z:site.z+Math.sin(r()*6.28)*380};return {id,giver,giverSite:site.id,title:`Where is ${who}?`,desc:`${lord.name}: "${who} went out ${compassWord(spot.x-site.x,spot.z-site.z)} three days ago and hasn't come back. Find them — there's a camp out that way — and send them home."`,objective:`Find ${who} ${compassWord(spot.x-site.x,spot.z-site.z)} of ${site.name}`,kind,data:{who,x:spot.x,z:spot.z,found:false,spawned:false},reward};}
    // road: a bandit camp on the nearest road out
    const rd=ROADS.find(rr=>rr.def.a===site.id||rr.def.b===site.id);const q=rd?rd.pts[Math.min(rd.pts.length-1,Math.floor(rd.pts.length*.5))]:{x:site.x+300,z:site.z};return {id,giver,giverSite:site.id,title:`The road out of ${site.name}`,desc:`${lord.name}: "Bandits have made a camp on the road, ${compassWord(q.x-site.x,q.z-site.z)} of here. Carts won't come. Clear it."`,objective:`Clear the bandit camp on the road ${compassWord(q.x-site.x,q.z-site.z)} of ${site.name}`,kind:'road',data:{x:q.x,z:q.z,count:3+tier,have:0,spawned:false},reward:reward+30};
  }
  function lordTopics(site){
    const _st=TS(site);if(_st.flags.occupied!=null){const by=nationName(_st.occupier);return [{label:'Who holds the town?',response:`${by}. Their captain sits in my chair and their soldiers hold the plaza. Kill the garrison and it's ours again; until then I've nothing to give you but my thanks for asking.`}];}
    if(_st.flags.besieged!=null){const by=nationName(_st.siegeBy);return [{label:'The siege?',response:`${by}'s camp sits on the road. Twelve days of that and the gates open from hunger. Break the camp and you'll have the town's thanks and mine.`}];}
    return [{label:'I\u2019m looking for work.',quest:true,fn:()=>{const q=townQuestFor(site);if(!q.turnedIn&&!qFind(q.id))qAdd(q);if(q.done)return `You've done it? Then ${q.reward} gold, with the ${site.kind}'s thanks.`;return q.desc+` (${q.reward} gold.)`;}},
            {label:'It\u2019s done.',quest:true,fn:()=>{const q=qActive().find(q=>q.giverSite===site.id);if(!q)return "You've nothing from me to finish.";if(!q.done)return `Not yet — ${q.objective}.`;const paid=qTurnIn(q);addFavor(site,1);const more=tutOnTurnIn(q,site);return `${paid} gold. ${more?'Good.'+more:pick(Math.random,["Good.","The town won't forget it.","There'll be more."])}`;}},
            {label:'How fares the town?',get response(){return `${site.name} is ${stateLine(site)}. ${favor(site)>=3?'And it counts you a friend.':favor(site)<=-2?'And it has not forgotten you.':''}`;}},
            ];
  }
  // ── hooks ──
  function qOnKill(e,ctx){
    for(const q of qActive()){if(q.done)continue;
      if(q.kind==='cull'&&ctx==='zone'&&e.name===q.data.target&&Math.hypot(e.x-q.data.x,e.z-q.data.z)<q.data.radius){q.data.have++;if(q.data.have>=q.data.need)qComplete(q);}
      if(q.kind==='road'&&e._questTag===q.id){q.data.have++;if(q.data.have>=q.data.count){qComplete(q);const rd=ROADS.find(rr=>rr.def.a===q.giverSite||rr.def.b===q.giverSite);if(rd)markRoadCleared(rd.def.a,rd.def.b);}}
    }
  }
  function qOnTalk(def){
    for(const q of qActive()){if(q.done)continue;
      if(q.kind==='deliver'&&def.name===q.data.who){q.data.done=true;qComplete(q);showMsg(`${def.name} takes the letter.`,'#e8d8a0');return true;}
      if(q.kind==='find'&&def.name===q.data.who&&def._lost){q.data.found=true;qComplete(q);showMsg(`${def.name}: "Home? Yes. Yes, all right."`,'#e8d8a0');return true;}
    }
    return false;
  }
  function qTick(){
    for(const q of qActive()){if(q.done)continue;
      if(q.kind==='retrieve'&&!q.data.got&&!q._obj){const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.4,.5),new THREE.MeshLambertMaterial({color:0xc8a040}));m.position.set(q.data.x,worldH(q.data.x,q.data.z)+.2,q.data.z);sc.add(m);const l=regLight(0xffd080,.8,5,'quest');l.position.copy(m.position);q._obj={m,l};pickups.push({x:q.data.x,z:q.data.z,quest:q});}
      if(q.kind==='find'&&!q.data.spawned&&Math.hypot(px-q.data.x,pz-q.data.z)<200){q.data.spawned=true;const site=siteAnywhere(q.giverSite);const def=makeDef(site,site.reg||'irish',Math.random,'Villager',q.data.who,{x:q.data.x+1.5,z:q.data.z,bCol:0x4a3a2a,sCol:0xd4a878,keepName:true,topics:q.data.topics||[{label:'People are looking for you.',response:"Are they. I only meant to sit a while."}]});def._lost=true;if(q.rival){def.people='markman';def.sCol=0xf0dcc8;def.hairCol=0xd8c8a0;def.bCol=0x2a2a30;}const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(q.data.x+1.5,worldH(q.data.x+1.5,q.data.z),q.data.z);q._npc=n;}
      if(q.kind==='road'&&!q.data.spawned&&Math.hypot(px-q.data.x,pz-q.data.z)<180){q.data.spawned=true;for(let k=0;k<q.data.count;k++){const a=Math.random()*Math.PI*2;const ex=q.data.x+Math.cos(a)*8,ez=q.data.z+Math.sin(a)*8;const e=unlockFoe(buildZoneEnemy(sc,STATIC_SOL,ex,ez,q.enemy||(k===0&&level>=5?'Bandit Captain':'Bandit'),null));e._questTag=q.id;if(q.enemyName){e.name=q.enemyName;e.displayName=q.enemyName;}e.alert=false;e.homeX=q.data.x;e.homeZ=q.data.z;ZONES.world.enemies.push(e);}
        // a camp to go with them
        if(q.data.noCamp){showMsg(`${q.enemyName||'Someone'} is waiting.`,'#e8d8a0');continue;}
        const tentMat=new THREE.MeshLambertMaterial({color:0x6a5a44,side:THREE.DoubleSide});[[-3,-1],[3,-2]].forEach(([ox,oz])=>{const t=new THREE.Mesh(new THREE.ConeGeometry(1.8,2.2,5,1,true),tentMat);t.position.set(q.data.x+ox,worldH(q.data.x+ox,q.data.z+oz)+1.1,q.data.z+oz);sc.add(t);});const em=new THREE.Mesh(new THREE.SphereGeometry(.22,6,6),new THREE.MeshBasicMaterial({color:0xff7a22}));em.position.set(q.data.x,worldH(q.data.x,q.data.z)+.2,q.data.z);sc.add(em);showMsg('A bandit camp.','#ffb060');}
    }
  }
  // pickups shared with guild relics
  function qPickupTick(){for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];if(!p.quest)continue;if(Math.hypot(px-p.x,pz-p.z)<1.4){p.quest.data.got=true;sc.remove(p.quest._obj.m);unregLight(p.quest._obj.l);pickups.splice(i,1);qComplete(p.quest);showMsg(`You take ${p.quest.data.item}.`,'#e8d8a0');}}}
  // compass + world markers for everything live: red for doors/portals, green for people, items, creatures, places
  const RED='#ff5544',GREEN='#66dd66';
  const POI_GLYPH={bridge:'⌒',city:'🏰',town:'🏘',village:'⌂',port:'⚓',garrison:'⚔',outpost:'⚑',glade:'❀',shrine:'✦',lair:'☠',tower:'▲',bcamp:'⛺',camp:'▲',ruin:'☗',hermit_camp:'⌂',poi:'✧'};
  function compassPlaces(){const out=[];if(activeZoneId!=='world')return out;const R=200;
    for(const t of SITES){if(!t.name||t.kind==='portal')continue;const d=Math.hypot(t.x-px,t.z-pz);if(d>R||d<6)continue;out.push({x:t.x,z:t.z,glyph:POI_GLYPH[t.kind]||'✧',label:t.name,found:!!discovered(t.id),d,place:true});}
    for(const e of DOORS){const p=dungeonWorldPos[e.seed]||e;const d=Math.hypot(p.x-px,p.z-pz);if(d>R||d<6)continue;out.push({x:p.x,z:p.z,glyph:e.kind==='fort_door'?'⛫':'◠',label:e.canonicalName||'an old gate',found:!!discovered('door_'+e.seed),d,place:true});}
    return out;}
  function compassMarkers(){
    const out=[];if(activeZoneId!=='world')return out;
    const push=(x,z,col,label,glyph)=>{if(x!=null&&z!=null)out.push({x,z,col,label,glyph});};
    // v80 S138 — the place someone gave you directions to
    wayTick();if(WAY){if(WAY.follow&&WAY.follow.g&&WAY.follow.g.visible){WAY.x=WAY.follow.g.position.x;WAY.z=WAY.follow.g.position.z;}push(WAY.x,WAY.z,'#f6d860',WAY.label,WAY.glyph);}
    // town quests
    for(const q of qActive()){if(q.done){const g=q.giverSite?siteAnywhere(q.giverSite):null;if(g)push(g.x,g.z,GREEN,`report to ${q.giver}`);continue;}const d=q.data||{};
      if(q.kind==='retrieve'&&!d.got)push(d.x,d.z,GREEN,d.item||'the heirloom','\u25c6');
      else if(q.kind==='find'){if(q._npc&&q._npc.g)push(q._npc.g.position.x,q._npc.g.position.z,GREEN,d.who,'\ud83d\udc64');else push(d.x,d.z,GREEN,d.who,'\ud83d\udc64');}
      else if(q.kind==='deliver'){const t=siteAnywhere(d.siteId);if(t)push(t.x,t.z,GREEN,d.who);}
      else if(q.kind==='road'||q.kind==='cull')push(d.x,d.z,GREEN,q.kind==='road'?'the camp':plural(2,q.data.target),q.kind==='road'?'\u26fa':'\u2620');
      else if(q.kind==='duel'&&d.state!=='lost')push(d.x,d.z,GREEN,'the yard','\u2694');}
    // guild tasks
    const G=worldState.guild;if(G)for(const g in G){const t=G[g].active;if(!t||taskDone(t))continue;const x=t.sx!=null?t.sx:t.x!=null?t.x:(t.siteId?(siteAnywhere(t.siteId)||{}).x:null),z=t.sz!=null?t.sz:t.z!=null?t.z:(t.siteId?(siteAnywhere(t.siteId)||{}).z:null);if(x!=null)push(x,z,t.kind==='clear'?RED:GREEN,t.short,t.kind==='relic'?'\u25c6':(t.kind==='beast'||t.kind==='wizard'||t.kind==='creature'||t.kind==='hunt')?'\u2620':undefined);}
    // the story
    const S=worldState.story;if(S&&S.act>=2){
      if(S.step==='corwin'||S.step==='courier'||S.step==='ashfeld'){if(CORWIN.npc)push(CORWIN.npc.g.position.x,CORWIN.npc.g.position.z,GREEN,'Corwin');else{let best=null,bd=1e9;for(const t of SITES){if(t.kind!=='port')continue;const d=Math.hypot(px-t.x,pz-t.z);if(d<bd){bd=d;best=t;}}if(best)push(best.x,best.z,GREEN,'Corwin — '+best.name);}}
      if(S.step==='proof'){for(const nk in S.gates){const g=S.gates[nk];if(!S.proof[nk])push(g.x,g.z,RED,g.name);}}
      if(S.step==='courier'){if(OSWY.ship&&OTHER.includes(OSWY.ship))push(OSWY.ship.x,OSWY.ship.z,GREEN,'the Kestrel');else{const pb=_anch&&_anch.blackhand;if(pb)push(pb.x,pb.z,GREEN,'Port Blackhand');}}
      if(S.step==='ashfeld'){const f=siteAnywhere('ashfeld');if(f)push(ASH.npc?ASH.npc.g.position.x:f.x,ASH.npc?ASH.npc.g.position.z:f.z,GREEN,'Varek');}
      if(S.step==='root'){const r=_anch&&_anch.root;if(r){if(S.rootCleared&&ROOTS.npc)push(ROOTS.npc.g.position.x,ROOTS.npc.g.position.z,GREEN,'Varek');else{const p=dungeonWorldPos[9001];push(p?p.x:r.x,p?p.z:r.z,RED,'The Root');}}}}
    tutMarkers(push);try{factionMarkers(push);warMarkers(push);guildMarkers(push);}catch(e){}
    // rubbings and the reader
    const rub=worldState.rubbings||{};for(const seed in rub){const p=dungeonWorldPos[seed];const read=worldState.sigilsRead||{};if(p&&!read[seed])push(p.x,p.z,RED,rub[seed]);}
    if(VX.npc)push(VX.npc.g.position.x,VX.npc.g.position.z,GREEN,'someone at the field');
    // the main story's next giver, when a quest is waiting on an authored NPC in this world
    try{if(typeof QUEST_DEFS!=='undefined'){for(const q of QUEST_DEFS){const st=qState(q.id);if(!q.giver)continue;if(st==='available'||st==='reward'){const h=ZONES.world.houses.find(x=>x.keeper===q.giver);const n=npcs.find(x=>x.def&&x.def.name===q.giver);if(n)push(n.g.position.x,n.g.position.z,GREEN,q.giver);else if(h)push(h.doorX,h.doorZ,GREEN,q.giver);else if(typeof NPC_DEF!=='undefined'&&NPC_DEF.some(d=>d.name===q.giver)&&SITE.ashenmoor)push(SITE.ashenmoor.x,SITE.ashenmoor.z,GREEN,q.giver+' — Ashenmoor'); /* v80 S133 — an outdoor giver far away still points at the village */}}}}catch(e){}
    // v80 S138 — a marker at a place takes the place's glyph (the same set the compass shows for places)
    for(const m of out){if(m.glyph)continue;let best=null,bd=25;
      for(const t of SITES){if(!t.name||t.kind==='portal')continue;const d=Math.hypot(t.x-m.x,t.z-m.z);if(d<bd){bd=d;best=POI_GLYPH[t.kind]||'\u2727';}}
      for(const e of DOORS){const p=dungeonWorldPos[e.seed]||e;const d=Math.hypot(p.x-m.x,p.z-m.z);if(d<bd){bd=d;best=e.kind==='fort_door'?'\u26eb':'\u25e0';}}
      if(best)m.glyph=best;}
    return out;
  }
  // map markers for active objectives
  function questMarkers(cell){const out=[];{const tpush=(x,z,col,label)=>{if(x!=null&&x>=cell.ox&&x<cell.ox+SIZE&&z>=cell.oz&&z<cell.oz+SIZE)out.push({id:'q_tut_'+label,name:label,kind:'quest',x,z,sub:'A lesson',major:true});};try{tutMarkers(tpush);}catch(e){}}const S=worldState.story;if(S&&S.act>=2){const push=(x,z,name,sub)=>{if(x>=cell.ox&&x<cell.ox+SIZE&&z>=cell.oz&&z<cell.oz+SIZE)out.push({id:'q_story_'+name,name,kind:'quest',x,z,sub,major:true});};if(S.step==='proof'){for(const nk in S.gates){const g=S.gates[nk];if(!S.proof[nk])push(g.x,g.z,g.name,'An etched gate');}}if(S.step==='courier'){const pb=_anch&&_anch.blackhand;if(pb)push(pb.x,pb.z,pb.name,'Oswy Blackhand');}if(S.step==='ashfeld'){const f=siteAnywhere('ashfeld');if(f)push(f.x,f.z,'The Ashfeld','Varek');}if(S.step==='root'){const r=_anch&&_anch.root;if(r)push(r.x,r.z,'The Root','What was bound');}}const rub=worldState.rubbings||{};for(const seed in rub){const p=dungeonWorldPos[seed];if(!p)continue;if(p.x>=cell.ox&&p.x<cell.ox+SIZE&&p.z>=cell.oz&&p.z<cell.oz+SIZE)out.push({id:'q_rub_'+seed,name:rub[seed],kind:'quest',x:p.x,z:p.z,sub:'A warm stone — from a rubbing',major:true});}for(const q of qActive()){if(q.done)continue;const d=q.data;if(d&&d.x!=null&&d.x>=cell.ox&&d.x<cell.ox+SIZE&&d.z>=cell.oz&&d.z<cell.oz+SIZE)out.push({id:'q_'+q.id,name:q.title,kind:'quest',x:d.x,z:d.z,sub:q.objective,major:true});}
    const G=worldState.guild;if(G)for(const g in G){const t=G[g].active;if(!t||taskDone(t))continue;const x=t.sx!=null?t.sx:t.x!=null?t.x:(t.siteId?(siteAnywhere(t.siteId)||{}).x:null),z=t.sz!=null?t.sz:t.z!=null?t.z:(t.siteId?(siteAnywhere(t.siteId)||{}).z:null);if(x==null)continue;if(x>=cell.ox&&x<cell.ox+SIZE&&z>=cell.oz&&z<cell.oz+SIZE)out.push({id:'gq_'+t.id,name:t.short,kind:'quest',x,z,sub:GUILD_DEF[g].name+': '+t.desc.slice(0,60)+'…',major:true});}
    return out;}
  // ── guild commissions at the rank milestones ──
  const COMMISSIONS={
    guild_f:[{at:2,title:'Blooded',short:'The captain of the road',kind:'commission',mk:(site)=>({sx:site.x+300,sz:site.z+200,beast:'Bandit Captain',desc:"A bandit captain has been bleeding the roads for a year. The Guild wants his head before it gives you a name. He's camped with his best a way out of town."})},{at:5,title:'Warden\u2019s Trial',short:'The troll of the hills',kind:'commission',mk:(site)=>({sx:site.x-350,sz:site.z-250,beast:'Ogre',desc:"An ogre. Alone. That's the trial. The old Wardens all did it; half of them lived."})},{at:8,title:'Champion',short:'Two at once',kind:'commission',mk:(site)=>({sx:site.x+420,sz:site.z-120,beast:'Frost Troll',desc:"There's a frost troll in the passes, and where there's one there's another. Kill it and you're Champion. Nobody's asked what happens if you don't."})}],
    guild_m:[{at:2,title:'Adept\u2019s Reading',short:'The rogue\u2019s notes',kind:'commission',mk:(site)=>({sx:site.x-280,sz:site.z+260,beast:'Rogue Mage',desc:"One of ours went rogue and took his notebook. The notebook we want. Him we're indifferent to."})},{at:5,title:'Evoker\u2019s Proof',short:'The wisp at the water',kind:'commission',mk:(site)=>({sx:site.x+380,sz:site.z+340,beast:'Shore Wisp',desc:"Wisps don't die; they unmake. Unmake one and you'll understand what an Evoker is."})},{at:8,title:'Warlock',short:'The hag\u2019s pact',kind:'commission',mk:(site)=>({sx:site.x-400,sz:site.z-300,beast:'Marsh Hag',desc:"A hag in the fen holds a pact older than the Guild. Break it. You'll know how when you're standing there."})}],
  };
  function commissionFor(g,site){const st=gstate()[g];const c=(COMMISSIONS[g]||[]).find(c=>c.at===st.done&&!(st.commissions||[]).includes(c.at));if(!c)return null;const d=c.mk(site);(st.commissions||(st.commissions=[])).push(c.at);return Object.assign({id:g+'_c'+c.at+'_'+Date.now(),g,kind:'beast',spawned:false,done:false,gold:200+c.at*60,short:c.short,title:c.title,siteId:site.id},d);}

  // ═══ POINTS OF INTEREST II (Session M) ══════════════════════════════
  // Five new site kinds, generated like camps/ruins and built by genSettlement:
  //  glade  — a pond in a clearing, herb hotspots, boar and wolves at the water
  //  shrine — a round columned temple; pray at the altar: full restore + a boon for the day
  //  lair   — a cave mouth in a rock pile with a great beast and its hoard outside it
  function roofFor(site){const y=worldH(site.x,site.z)+38.6;return {x:site.x,z:site.z,y};}
  //  tower  — a tall spire; an interior spiral climbs to a treasure room at the top
  //  bcamp  — a bandit camp: tents, fire, loot, debris, 5–15 bandits under a captain
  const POI_KINDS=['glade','shrine','lair','tower','bcamp'];
  const POI_PAD={glade:52,shrine:28,lair:38,tower:26,bcamp:40};
  // a cavern behind every lair's mouth: a portal record the engine builds as a dungeon; the beast outside still guards it
  function lairDoorFor(site,c){const seed=100000+(String(site.id).split('').reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,7)%800000);const biome=dominantRegion(site.x,site.z).r.biome;
    const boss=biome==='tundra'?'Frost Troll':biome==='wasteland'||biome==='wastes'?'Ash Wight':biome==='swamp'||biome==='fen'?'Marsh Hag':cellHash(seed%9973,seed%7919,4)<.5?'Cave Bear':'Ogre';
    const dragon=!!site.dragon||cellHash(seed%9973,seed%7919,5)<.08;site.dragon=dragon;
    return {zone:'gen',x:site.x,z:site.z-6,seed,size:dragon?'large':'medium',theme:biome==='tundra'?'deep':biome==='swamp'||biome==='fen'?'haunted':'deep',diff:dragon?'veryhard':'hard',kind:'cave_door',cell:c.i+','+c.j,sigil:false,lairDoor:true,canonicalName:`${site.name} — the cavern`,lair:{place:site.name.replace(/'s Lair$/,''),boss,dragon,siteId:site.id}};}
  function poiName(kind,r,reg){const n=genName(r,reg);return kind==='glade'?`${n} Glade`:kind==='shrine'?`Shrine of ${n}`:kind==='lair'?`${n}'s Lair`:kind==='tower'?`${n} Spire`:`${n} Camp`;}
  // ── finding sigils: rubbings, rumours, the Weaver's Eye ──
  function sigilDoors(){const out=[];for(const c of CELLS.values()){if(!c.doors)continue;c.doors.forEach(e=>{if(e.sigil||e.kind==='fort_door')out.push(e);});}return out;}
  function nearestSigilDoor(){let best=null,bd=1e9;const read=worldState.sigilsRead||{};for(const e of sigilDoors()){if(read[e.seed])continue;const p=dungeonWorldPos[e.seed]||{x:e.x,z:e.z};const d=Math.hypot(p.x-px,p.z-pz);if(d<bd){bd=d;best={x:p.x,z:p.z,name:e.canonicalName||'an old gate',seed:e.seed};}}return best;}
  function onMasteryTouch(spellId){const seed=(typeof activePortal!=='undefined'&&activePortal&&activePortal.seed)||(typeof curPortal!=='undefined'&&curPortal&&curPortal.seed)||(typeof currentPortal!=='undefined'&&currentPortal&&currentPortal.seed)||null;if(seed!=null)(worldState.sigilsRead||(worldState.sigilsRead={}))[seed]=spellId;worldState.masteries=(worldState.masteries||0)+1;}
  function rubbingTopics(site){const d=nearestSigilDoorFrom(site);if(!d)return [];const price=60;return [{label:`Buy a rubbing of a warm stone (${price} gold)`,quest:true,fn:()=>{if(gold<price)return `A rubbing is ${price} gold. We have to send someone to take it.`;gold-=price;updateHUD();if(typeof bagAdd==='function')bagAdd({name:`Rubbing: ${d.name}`,ico:'📜',type:'rubbing',seed:d.seed,gate:d.name,weight:.2,sellMult:.3,buyPrice:price,qty:1});return `Taken from ${d.name}, ${compassWord(d.x-site.x,d.z-site.z)} of here. Read it and your map will remember where.`;}}];}
  function nearestSigilDoorFrom(site){let best=null,bd=1e9;const read=worldState.sigilsRead||{},rub=worldState.rubbings||{};for(const e of sigilDoors()){if(read[e.seed]||rub[e.seed])continue;const p=dungeonWorldPos[e.seed]||{x:e.x,z:e.z};const d=Math.hypot(p.x-site.x,p.z-site.z);if(d<bd&&d<2600){bd=d;best={x:p.x,z:p.z,name:e.canonicalName||(typeof dungeonName==='function'?dungeonName(e.seed,e.theme):'an old gate'),seed:e.seed};}}return best;}
  // canonical names for generated gates, in the cell's own tongue
  const GATE_WORDS={ruins:['Barrow','Hollow','Tomb','Crypt','Vault'],goblin:['Warren','Den','Burrow','Hole','Nest'],haunted:['Crypt','Sepulchre','Mound','Silence','Deep'],cave:['Cave','Hollow','Mouth','Cleft','Undercroft'],fort:['Hold','Keep','Bastion','Watch','Gate'],elemental:['Furnace','Well','Cistern','Forge','Kiln'],undead:['Ossuary','Charnel','Grave','Barrow','Catacomb'],forest:['Root','Hollow','Bower','Warren','Nest'],deep:['Wound','Scar','Pit','Silence','Seam']};
  function canonicalGateName(e,cell){const words=GATE_WORDS[e.theme]||GATE_WORDS.cave;const rr=cellRng(e.seed%9973,e.seed%7919,3);const w=words[Math.floor(rr()*words.length)];const n=genName(rr,cell.reg||'irish');const q=rr();return q<.35?`${n} ${w}`:q<.6?`The ${w} of ${n}`:q<.8?`${n}'s ${w}`:`The ${['Old','Cold','Black','Broken','Sunken','Grey'][Math.floor(rr()*6)]} ${w}`;}
  function siteCreatures(S,list){ // zone enemies that belong to a site; removed with it
    S.creatures=S.creatures||[];for(const [name,x,z,alert] of list){const e=buildZoneEnemy(sc,STATIC_SOL,x,z,name,typeof pickVariant==='function'?pickVariant(name,level,'normal'):null);if(e.locked){e.locked=false;if(e.mesh)e.mesh.visible=true;} /* v80 — a lair's beast is there whatever your level */ e.alert=!!alert;e.homeX=x;e.homeZ=z;e._site=S.site.id;ZONES.world.enemies.push(e);S.creatures.push(e);}
  }
  function siteChest(S,x,z,mult,name){const y=worldH(x,z);const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=Math.atan2(S.site.x-x,S.site.z-z);const {lid}=buildChestShell(g,1.8,0x4a3018);S.group.add(g); // S259 — the kit's chest (S198), the old box's size, its lid on the hinge; a group, so the bake leaves it whole
    let items=(typeof rollContainerLoot==='function'?rollContainerLoot('treasure',mult,null,1):[])||[];if(!items.length)items.push({name:'Old Gold',ico:'🪙',type:'misc',weight:.5,sellMult:1,buyPrice:80,qty:1});items.forEach(it=>{if(it.qty==null)it.qty=1;});
    const ch={x,z,y:y+.3,name,displayName:name,items,zone:'world',kind:'chest',g,lid,opened:false,_site:S.site.id};if(typeof ZONE_CORPSES!=='undefined')ZONE_CORPSES.push(ch);S.chest=ch;return ch;}
  function buildGlade(S,site,r){
    const {group,sol}=S;const cx=site.x,cz=site.z;const pad=site.pad;const y=worldH(cx,cz);
    // the pond: a bowl stamp under a water disc
    const pr=11+r()*4;addStamp({id:'pond_'+site.id,kind:'pond',x:cx,z:cz,r:pr,blend:7,y:y-2.0});
    const water=new THREE.Mesh(new THREE.CircleGeometry(pr+2,28),new THREE.MeshLambertMaterial({color:0x4a8ab0,transparent:true,opacity:.75}));water.rotation.x=-Math.PI/2;water.position.set(cx,y-.75,cz);water.userData.noBake=true;group.add(water);
    ZONES.world.platforms.push({x0:cx-pr,x1:cx+pr,z0:cz-pr,z1:cz+pr,y:y-.85,site:site.id,shallow:true});
    // reeds, a fallen log, big trees at the edge. S215 — in detail (H.5, Michael's A): clumps of reed blades and cattails,
    // a barked log with cut ends, stubs, moss and mushrooms, lily pads on the water; the old cones and cylinder the distant copy
    {const hi=[],lo=[],C=x=>new THREE.Color(x),add=(A,geo,col,x,yy,z,rx,ry,rz,sx,sy,sz)=>A.push({geo,color:C(col),x,y:yy,z,rx,ry,rz,sx,sy,sz});
      for(let i=0;i<14;i++){const a=r()*Math.PI*2,rr=pr+1+r()*3;const x=Math.cos(a)*rr,z=Math.sin(a)*rr,hy=worldH(cx+x,cz+z)-y,h=1.6+r()*.8;
        add(lo,new THREE.ConeGeometry(.12,h,4),0x6a8a3a,x,hy+.7,z);
        const nb=13+Math.floor(r()*7);for(let k=0;k<nb;k++){const ba=r()*Math.PI*2,bl=h*(.55+r()*.5),lean=.08+r()*.22,g0=C(0x5a7a30).lerp(C(0x9aa04a),r());
          add(hi,SK.cone(.045,bl,3),g0.getHex(),x+Math.cos(ba)*.2,hy+bl/2-.05,z+Math.sin(ba)*.12,Math.sin(ba)*lean,ba,-Math.cos(ba)*lean,1,1,.35);}
        const nc=1+Math.floor(r()*3);for(let k=0;k<nc;k++){const ox=(r()-.5)*.25,oz=(r()-.5)*.25,sh=h*(.8+r()*.35);add(hi,SK.cyl(.012,.014,sh,5),0x7a8a40,x+ox,hy+sh/2-.05,z+oz);
          add(hi,SK.cyl(.05,.05,.24,8),0x5a381c,x+ox,hy+sh-.12,z+oz);add(hi,SK.cyl(.004,.008,.12,4),0x8a7a50,x+ox,hy+sh+.06,z+oz);}}
      // the fallen log, built along x and turned where it lies
      const ly=r()*3,lx=pr+5,lh=worldH(cx+lx,cz)-y;
      const lg=(geo,col,x,yy,z,rx,ry,rz,sx,sy,sz)=>{geo.scale(sx||1,sy||1,sz||1);geo.rotateZ(rz||0);geo.rotateY(ry||0);geo.rotateX(rx||0);geo.translate(x,yy,z);geo.rotateY(ly);geo.translate(lx,lh+.4,0);hi.push({geo,color:C(col)});};
      lg(SK.bumpy(SK.cyl(.4,.5,5,14,6),.035,17,9),0x4a3018,0,0,0,0,0,Math.PI/2);
      for(const sd of [1,-1]){lg(SK.cyl(sd>0?.37:.47,sd>0?.37:.47,.02,14),0xa8844e,sd*2.505,0,0,0,0,Math.PI/2);for(let k=1;k<4;k++)lg(SK.torus((sd>0?.37:.47)*k/4,.012,3,14),0x7a5a30,sd*2.52,0,0,0,Math.PI/2,0);}
      lg(SK.cyl(.08,.12,.6,7),0x4a3018,.6,.45,.1,.3,0,-.4);lg(SK.cyl(.06,.09,.45,7),0x4a3018,-1.3,.2,-.4,-1.1,0,.2);
      for(let k=0;k<5;k++)lg(SK.ball(.22+r()*.12,8,5),C(0x3e5a24).lerp(C(0x6a8a34),r()).getHex(),-1.8+k*.9,.38,(r()-.5)*.3,0,0,0,1.3,.35,1);
      for(let k=0;k<4;k++){const mx=-.5+k*.22+r()*.1,mz=.44+r()*.06,ms=.7+r()*.6;lg(SK.cyl(.02*ms,.026*ms,.12*ms,6),0xe8dcc0,mx,-.05+.06*ms,mz);lg(SK.ball(.06*ms,8,5,0,Math.PI*2,0,Math.PI/2),0xb08858,mx,-.05+.12*ms,mz);}
      {const g2=new THREE.CylinderGeometry(.4,.5,5,7);g2.rotateZ(Math.PI/2);g2.rotateY(ly);lo.push({geo:g2,color:C(0x4a3018),x:lx,y:lh+.4,z:0});}
      // lily pads and a few flowers near the bank
      for(let i=0;i<9;i++){const a=r()*Math.PI*2,rr=pr*(.45+r()*.45);const ps=.35+r()*.3;add(hi,new THREE.CylinderGeometry(ps,ps,.02,12,1,false,.3,Math.PI*2-.6),C(0x3a6a2a).lerp(C(0x5a8a3a),r()).getHex(),Math.cos(a)*rr,-.73,Math.sin(a)*rr,0,r()*6.28,0);
        if(r()<.35)add(hi,SK.cone(.09,.1,6),0xf0e0e8,Math.cos(a)*rr+.1,-.66,Math.sin(a)*rr);}
      poiLod(group,mergeParts(hi),mergeParts(lo),cx,y,cz);}
    sol.push({cx:cx+pr+5,cz,rx:2.5,rz:.5});
    const trees=new THREE.InstancedMesh(PROTO.broadleaf,SCATTER_MAT,10);const mm=new THREE.Matrix4();for(let i=0;i<10;i++){const a=i/10*Math.PI*2+r()*.4,rr=pad-9+r()*5;const x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;mm.compose(new THREE.Vector3(x,worldH(x,z),z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),r()*6.28),new THREE.Vector3(1.4,1.5,1.4));trees.setMatrixAt(i,mm);trees.setColorAt(i,new THREE.Color(.9,1,.9));sol.push({cx:x,cz:z,rx:.5,rz:.5});}trees.instanceMatrix.needsUpdate=true;trees.userData.noBake=true;group.add(trees);
    // herbs: a hotspot ring of 18 around the water
    if(typeof HERB_DEF!=='undefined'){const biome=dominantRegion(cx,cz).r.biome;const cands=herbCandidates(biome,'water').concat(herbCandidates(biome,'tree'));if(cands.length){for(let i=0;i<18;i++){const a=r()*Math.PI*2,rr=pr+2.5+r()*8;const x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;const type=cands[Math.floor(r()*cands.length)][0];const def=HERB_DEF[type];const g=new THREE.Group();g.position.set(x,worldH(x,z),z);const h={x,z,type,def,g,gl:{intensity:0,parent:null},harvested:false,respawnT:0,ph:r()*6.28};ZONES.world.herbs.push(h);(S.herbs=S.herbs||[]).push(h);}
      // instance them onto a chunk-less mesh owned by the settlement
      const byType={};S.herbs.forEach(h=>(byType[h.type]||(byType[h.type]=[])).push(h));for(const type in byType){const geo=herbGeoFor(type,HERB_DEF[type]);if(!geo)continue;const list=byType[type];herbIM(type,geo,list,group,h=>worldH(h.x,h.z));}}}
    // creatures at the water
    if(worldState.lairs&&worldState.lairs[site.id]){S.creatures=[];S._deadMarked=true;} // v80 — a lair's beast dies once
    const cl=[];const biome=dominantRegion(cx,cz).r.biome;const beast=biome==='tundra'?'Snow Wolf':biome==='fen'||biome==='swamp'?'Bog Crawler':'Boar';for(let i=0;i<3+Math.floor(r()*3);i++){const a=r()*Math.PI*2,rr=pr+4+r()*10;cl.push([i%3===2?'Wolf':beast,cx+Math.cos(a)*rr,cz+Math.sin(a)*rr,false]);}siteCreatures(S,cl);
  }
  function buildShrine(S,site,r){
    const {group,sol}=S;const cx=site.x,cz=site.z;const y=worldH(cx,cz);const c=x=>new THREE.Color(x);const parts=[];
    parts.push({geo:new THREE.CylinderGeometry(6.5,6.8,.5,24),color:c(0xd8d0c0),y:.25},{geo:new THREE.CylinderGeometry(5.8,6.0,.4,24),color:c(0xe0d8c8),y:.7});
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const x=Math.cos(a)*5.0,z=Math.sin(a)*5.0;parts.push({geo:new THREE.CylinderGeometry(.32,.36,4.2,10),color:c(0xe8e0d0),x,z,y:2.9},{geo:new THREE.BoxGeometry(.9,.3,.9),color:c(0xe8e0d0),x,z,y:5.15},{geo:new THREE.CylinderGeometry(.45,.5,.25,10),color:c(0xd8d0c0),x,z,y:1.0});sol.push({cx:cx+x,cz:cz+z,rx:.4,rz:.4});}
    const god=godOf(site);parts.push({geo:new THREE.TorusGeometry(5.2,.3,6,24),color:c(0xe0d8c8),y:5.35,rx:Math.PI/2},{geo:new THREE.CylinderGeometry(.9,1.1,1.1,10),color:c(0xd0c8b8),y:1.45},{geo:new THREE.BoxGeometry(1.6,.12,1.0),color:c(0xe8e0d0),y:2.05});
    const m=poiLod(group,shrineGeoHi(),mergeParts(parts),cx,y,cz); // S204 — fluted columns, bases and capitals, a moulded altar
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.22,.6,6),new THREE.MeshBasicMaterial({color:0xfff0b0}));flame.position.set(cx,y+2.45,cz);flame.userData.noBake=true;group.add(flame);const l=regLight(0xfff0c0,1.4,12,site.id);l.position.set(cx,y+2.8,cz);
    sol.push({cx,cz,rx:.6,rz:.6});S.altar={x:cx,z:cz};S.god=god;site.name=`Shrine of ${god.name}`;
    { // the steps and the floor are footholds: two rings, then the dais
      ZONES.world.platforms.push({x0:cx-7.4,x1:cx+7.4,z0:cz-7.4,z1:cz+7.4,y:y+.5,shrine:site.id},{x0:cx-6.4,x1:cx+6.4,z0:cz-6.4,z1:cz+6.4,y:y+.9,shrine:site.id});
      const dome=new THREE.Mesh(new THREE.SphereGeometry(5.6,20,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:god.tint,side:THREE.DoubleSide}));dome.position.set(cx,y+5.4,cz);dome.castShadow=true;dome.userData.noBake=true;group.add(dome);S._domeSep=true;}
    // a low ring of steps for the pad edge
    for(let i=0;i<3;i++){const s=new THREE.Mesh(new THREE.CylinderGeometry(7.2+i*.9,7.4+i*.9,.22,28),new THREE.MeshLambertMaterial({color:0xcfc7b8}));s.position.set(cx,y-i*.2,cz);group.add(s);}
  }
  // S338 (Michael's A on #60) — the Boon of Renewal: health, stamina and mana each come back half a point a second while
  // it lasts (a Mild tonic's rate, over the boon's whole span); the main loop reads it beside the regen tonics
  const GODS=[{key:'muir',name:'An Mhuir',en:'the Sea',boon:{type:'swiftness',mult:1.25,label:'the Boon of the Road'},tint:0x7a9ab0},{key:'speir',name:'An Spéir',en:'the Sky',boon:{type:'regen',mult:1,rate:RENEWAL_RATE,label:'the Boon of Renewal'},tint:0xa8b8d0},{key:'beithigh',name:'Na Beithígh',en:'the Beasts',boon:{type:'meleeDmg',mult:1.2,label:'the Boon of the Arm'},tint:0x8a7a5a},{key:'cloch',name:'An Chloch',en:'the Stone',boon:{type:'warding',mult:.75,label:'the Boon of Stone'},tint:0x8a8478},{key:'teallach',name:'An Teallach',en:'the Hearth',boon:{type:'spellCost',mult:.7,label:'the Boon of the Mind'},tint:0xb8946a},{key:'fiodoir',name:'An Fíodóir',en:'the Weaver',boon:null,tint:0xc8b8d8}];
  function godOf(site){const h=String(site.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,13);return GODS[h%GODS.length];}
  const SHRINE_BOONS=[{type:'swiftness',mult:1.25,label:'the Boon of the Road'},{type:'warding',mult:.75,label:'the Boon of Stone'},{type:'regen',mult:1,rate:RENEWAL_RATE,label:'the Boon of Renewal'},{type:'meleeDmg',mult:1.2,label:'the Boon of the Arm'},{type:'spellCost',mult:.7,label:'the Boon of the Mind'}];
  function shrinePrompt(){for(const S of SETTLE.values()){if(S.site.kind!=='shrine'||!S.altar)continue;if(Math.hypot(px-S.altar.x,pz-S.altar.z)<2.6)return `Press 'E' to pray to ${S.god?S.god.name+', '+S.god.en:'the altar'}`;}return null;}
  function shrineInteract(){for(const S of SETTLE.values()){if(S.site.kind!=='shrine'||!S.altar)continue;if(Math.hypot(px-S.altar.x,pz-S.altar.z)>=2.6)continue;
    const st=worldState.shrines||(worldState.shrines={});const abs=worldState.gameTimeAbsMinutes||0;if(st[S.site.id]&&abs-st[S.site.id]<1440){showMsg('The altar is quiet. Come back tomorrow.','#c8b880');return true;}
    st[S.site.id]=abs;PHP=effMaxHP();mana=effMaxMana();if(typeof stamina!=='undefined')stamina=effMaxStamina();updateHUD();
    const b=(S.god&&S.god.boon)||SHRINE_BOONS[Math.floor(Math.random()*SHRINE_BOONS.length)];if(S.god&&!S.god.boon){const d=nearestSigilDoorFrom(S.site);if(d&&typeof bagAdd==='function'){bagAdd({name:`Rubbing: ${d.name}`,ico:'📜',type:'rubbing',seed:d.seed,gate:d.name,weight:.2,sellMult:.3,buyPrice:60,qty:1});showMsg(`You are restored. The Weaver leaves a rubbing on the altar: ${d.name}.`,'#e8d8a0');}else showMsg('You are restored.','#e8d8a0');}
    else{if(typeof _applyBuff==='function')_applyBuff({type:b.type,mult:b.mult,rate:b.rate,duration:1800,label:b.label,col:'#e8d8a0'});showMsg(`You are restored, and carry ${b.label} until tomorrow.`,'#e8d8a0');}if(typeof addLog==='function')addLog('⛩',`Prayed at ${S.site.name}: ${b.label}.`);if(typeof sfxTone==='function')sfxTone(660,660,.6,.15);return true;}
    return false;}
  function buildLair(S,site,r){
    const {group,sol}=S;const cx=site.x,cz=site.z;const y=worldH(cx,cz);const c=x=>new THREE.Color(x);const parts=[];
    // S204 — lumpy boulders (they were dodecahedra), on the same rolls in the same order
    const stone=c(0x5a5650);for(let i=0;i<14;i++){const a=Math.PI*.15+r()*Math.PI*1.7,rr=3+r()*4;const bs=1.4+r()*1.6;parts.push({geo:cragGeo(bs,i),color:stone,x:Math.cos(a)*rr,z:Math.sin(a)*rr-2,y:.6+r()*1.2,rx:r()*3,ry:r()*3,sy:.8,jitter:.08});}
    parts.push({geo:cragGeo(4.2,99),color:stone,z:-4.5,y:3.2,jitter:.08},{geo:new THREE.BoxGeometry(3.2,2.8,1.2),color:c(0x0a0806),z:-1.2,y:1.4});
    const m=new THREE.Mesh(mergeParts(parts),VC_MAT);m.position.set(cx,y,cz);m.castShadow=true;group.add(m);
    sol.push({cx,cz:cz-4.5,rx:5,rz:3.5},{cx:cx-5,cz:cz-2,rx:2.2,rz:2.2},{cx:cx+5,cz:cz-2,rx:2.2,rz:2.2});
    // bones and a kill
    for(let i=0;i<8;i++){const a=r()*Math.PI*2,rr=3+r()*7;const b=new THREE.Mesh(new THREE.BoxGeometry(.12,.1,.7+r()*.6),new THREE.MeshLambertMaterial({color:0xe8e0d0}));const x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr+3;b.position.set(x,worldH(x,z)+.05,z);b.rotation.y=r()*3;group.add(b);}
    const biome=dominantRegion(cx,cz).r.biome;const boss=biome==='tundra'?'Frost Troll':biome==='wasteland'||biome==='wastes'?'Ash Wight':biome==='swamp'||biome==='fen'?'Marsh Hag':r()<.5?'Cave Bear':'Ogre';
    siteCreatures(S,[[boss,cx,cz+3,false],[biome==='tundra'?'Snow Wolf':'Dire Wolf',cx-4,cz+5,false],[biome==='tundra'?'Snow Wolf':'Dire Wolf',cx+4,cz+6,false]]);
    if(S.creatures[0]){const e=S.creatures[0];const dragon=!!site.dragon;e.hp=e.maxHp=Math.round(e.maxHp*(dragon?6:4)*(1+level*.08));e.dmg=Math.round(e.dmg*(dragon?2.2:2)*(1+level*.04));e.spd=(e.spd||1.4)*1.5;e.lair=site.id;if(e.mesh)e.mesh.scale.multiplyScalar(dragon?2.4:1.5);if(dragon)dragonBody(e,3.2);e.name=dragon?`${site.name.replace("'s Lair",'')} Wyrm`:`${site.name.replace("'s Lair",'')} the ${boss}`;e.boss=true;e.dragon=dragon;}
    siteChest(S,cx+2.2,cz-.2,2.2,'The Hoard');
  }
  function buildTower(S,site,r){
    const {group,sol,houses}=S;const cx=site.x,cz=site.z;const y=worldH(cx,cz);const c=x=>new THREE.Color(x);const H=38,R=4.6;const parts=[];
    parts.push({geo:new THREE.CylinderGeometry(R*.82,R,H,14),color:c(0x8a8478),y:H/2,jitter:.04},{geo:new THREE.CylinderGeometry(R*1.05,R*.85,1.2,14),color:c(0x7a746a),y:H+.4},{geo:new THREE.ConeGeometry(R*1.1,6,14),color:c(0x3a3a46),y:H+4});
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.4;parts.push({geo:new THREE.BoxGeometry(.9,1.4,.4),color:c(0x1a1a22),x:Math.cos(a)*R*.86,z:Math.sin(a)*R*.86,y:8+i*6,ry:-a});}
    parts.push({geo:new THREE.BoxGeometry(1.4,2.2,.6),color:c(0x3a2412),z:R*.95,y:1.1});
    const m=poiLod(group,towerGeoHi(H,R),mergeParts(parts),cx,y,cz); // S204 — in detail near, the old tower far
    for(let a=0;a<Math.PI*2;a+=Math.PI/8){const px_=cx+Math.cos(a)*R*.8,pz_=cz+Math.sin(a)*R*.8;if(Math.abs(a-Math.PI/2)<.5)continue;sol.push({cx:px_,cz:pz_,rx:1.2,rz:1.2});}
    { // v80 — the roof: a walkable platform inside the parapet at the top of the spire
      const ry=y+H+1.0;ZONES.world.platforms.push({x0:cx-R*.78,x1:cx+R*.78,z0:cz-R*.78,z1:cz+R*.78,y:ry,roof:site.id});
      for(let k=0;k<14;k++){const a=k/14*Math.PI*2;parts.push({geo:new THREE.BoxGeometry(1.0,.9,.5),color:c(0x6a665e),x:Math.cos(a)*R*.92,y:H+1.45,z:Math.sin(a)*R*.92,ry:-a});}
      parts.push({geo:new THREE.BoxGeometry(1.4,.12,1.4),color:c(0x3a2e22),x:0,y:H+1.06,z:-2.2});S.roof={x:cx,z:cz,y:ry,hatch:{x:cx,z:cz-2.2}};}
    const house={id:'g_'+site.id+'_tower',doorX:cx,doorZ:cz+R*.95+.4,doorFace:'S',exitX:cx,exitZ:cz+R*.95+2.2,exitYaw:0,name:site.name,keeper:'',type:'tower',tagline:'',w:8,d:8,two:false,reg:site.reg||'irish',style:'stone',dlg:null,siteKind:site.kind,siteId:site.id};houses.push(house);
    const lantern=new THREE.Mesh(new THREE.ConeGeometry(.14,.4,6),new THREE.MeshBasicMaterial({color:0xffd080}));lantern.position.set(cx,y+3.1,cz+R*.98);lantern.userData.noBake=true;group.add(lantern);const l=regLight(0xffb050,1.0,9,site.id);l.position.copy(lantern.position);
  }
  function buildBanditCamp(S,site,r){
    const {group,sol}=S;const cx=site.x,cz=site.z;const y=worldH(cx,cz);
    const tentMat=new THREE.MeshLambertMaterial({color:0x6a5a44,side:THREE.DoubleSide});const n=5+Math.floor(r()*4);
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r()*.5,rr=7+r()*8;const x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;const t=new THREE.Mesh(campTentGeo(i),VC_MAT);t.position.set(x,worldH(x,z),z);t.rotation.y=r()*6;t.castShadow=true;t.userData.noBake=true;group.add(t);sol.push({cx:x,cz:z,rx:1.6,rz:1.6});} // S205 — a ridge tent of canvas on poles (it was an open cone)
    // fire, cooking frame, crates, barrels, bones, a stockade of stakes
    const fire=new THREE.Mesh(new THREE.SphereGeometry(.32,7,7),new THREE.MeshBasicMaterial({color:0xff7a22}));fire.position.set(cx,y+.28,cz);fire.userData.noBake=true;group.add(fire);const fl=regLight(0xff8a30,1.5,13,site.id);fl.position.set(cx,y+1.0,cz);
    // S205 — on the kit, on the same dice in the same order: a ring of fire stones with logs and a cooking tripod, crates
    // and bellied barrels, bones that are bones, pointed stakes
    const c=x=>new THREE.Color(x);const parts=[];for(let i=0;i<9;i++){const a=i/9*Math.PI*2;parts.push({geo:cragGeo(.26,i+3),color:c(0x5a5650).multiplyScalar(.85+(i%3)*.12),x:Math.cos(a)*.95,z:Math.sin(a)*.95,y:.12,ry:-a,jitter:.06});}
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;parts.push({geo:SK.cyl(.08,.1,1.1,6),color:c(0x3a2818),x:Math.cos(a)*.25,z:Math.sin(a)*.25,y:.2,rx:Math.PI/2-.35,ry:-a+Math.PI/2,jitter:.08});}
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2;parts.push({geo:SK.cyl(.04,.05,2.1,5),color:c(0x4a3018),x:Math.cos(a)*.75,z:Math.sin(a)*.75,y:.95,rx:Math.sin(a)*-.35,rz:Math.cos(a)*.35});}
    parts.push({geo:SK.cyl(.01,.01,.7,4),color:c(0x2a2622),y:1.55},{geo:SK.lathe([[.001,0],[.2,0],[.26,.12],[.24,.28],[.18,.3],[.001,.3]],10),color:c(0x2a2622),y:1.0});
    for(let i=0;i<5;i++){const a=r()*6.28,rr=4+r()*5;const X=Math.cos(a)*rr,Z=Math.sin(a)*rr;
      if(i%2){parts.push({geo:SK.lathe([0,.125,.25,.375,.5,.625,.75,.875,1].map(u=>[.4*(.86+.14*Math.sin(Math.PI*u)),.9*u]),12),color:c(0x8a6a3a),x:X,z:Z,y:0});for(const u of [.15,.85])parts.push({geo:new THREE.TorusGeometry(.4*(.86+.14*Math.sin(Math.PI*u))+.01,.02,4,14),color:c(0x2a241e),x:X,z:Z,y:.9*u,rx:Math.PI/2});}
      else parts.push({geo:SK.rbox(.9,.8,.9,.05,2),color:c(0x7a5a30),x:X,z:Z,y:.4});}
    for(let i=0;i<12;i++){const a=r()*6.28,rr=2+r()*14;const L=.4+r()*.5;parts.push({geo:SK.limb(L,.05,.04),color:c(0xe8e0d0),x:Math.cos(a)*rr,z:Math.sin(a)*rr,y:.05,rx:Math.PI/2,ry:r()*3});}
    for(let i=0;i<26;i++){const a=i/26*Math.PI*2;const rr=site.pad-6;const rx=(r()-.5)*.3,rz=(r()-.5)*.3;parts.push({geo:SK.cyl(.1,.14,2.0,6),color:c(0x4a3018),x:Math.cos(a)*rr,z:Math.sin(a)*rr,y:1.0,rx,rz,jitter:.08},{geo:SK.cone(.1,.45,6),color:c(0x6a4a28),x:Math.cos(a)*rr+Math.sin(rz)*-1.1,z:Math.sin(a)*rr+Math.sin(rx)*1.1,y:2.2,rx,rz});}
    const m=new THREE.Mesh(mergeParts(parts),VC_MAT);m.position.set(cx,y,cz);m.castShadow=true;group.add(m);
    // a banner and the loot
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,4,6),new THREE.MeshLambertMaterial({color:0x2a2622}));pole.position.set(cx+3,y+2,cz-3);group.add(pole);const cloth=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.9),new THREE.MeshLambertMaterial({color:0x2a2020,side:THREE.DoubleSide}));cloth.position.set(cx+3.6,y+3.5,cz-3);group.add(cloth);
    siteChest(S,cx-3,cz+2,1.6,"Bandits' Takings");
    const cl=[];const nb=5+Math.floor(r()*11);for(let i=0;i<nb;i++){const a=r()*6.28,rr=2+r()*(site.pad-12);cl.push([i===0&&level>=4?'Bandit Captain':i<3?'Bandit Archer':r()<.3?'Highwayman':'Bandit',cx+Math.cos(a)*rr,cz+Math.sin(a)*rr,false]);}siteCreatures(S,cl);
  }
  let _sdT=0;function tickSiteDeaths(){_sdT-=1/60;if(_sdT>0)return;_sdT=2;for(const S of SETTLE.values()){if(!S.creatures||!S.creatures.length||S._deadMarked)continue;if(S.creatures.every(e=>e.dead)){S._deadMarked=true;markLairDead(S.site.id);const rd=ROADS.find(rr=>Math.hypot(rr.pts[Math.floor(rr.pts.length/2)].x-S.site.x,rr.pts[Math.floor(rr.pts.length/2)].z-S.site.z)<300);if(rd&&S.site.kind==='bcamp')markRoadCleared(rd.def.a,rd.def.b);showMsg(`${S.site.name} is quiet now.`,'#e8d8a0');}}}
  // S204 — a POI's detailed piece near, its old one as the distant copy (baked in the POI's clusters, as a town's houses)
  function poiLod(group,hiGeo,loGeo,x,y,z,shadow){const hi=new THREE.Mesh(hiGeo,VC_MAT),lo=new THREE.Mesh(loGeo,VC_MAT);for(const m of [hi,lo]){m.position.set(x,y,z);m.castShadow=shadow!==false;m.receiveShadow=true;group.add(m);}hi.userData.lod='hi';lo.userData.lod='lo';return hi;}
  // the wizard's tower in detail: coursed stone in bands, pilaster ribs, arched lancets with sills, a string course at each
  // floor, a corbelled and crenellated parapet, a slated spire in courses with a finial, an arched door up three steps
  function towerGeoHi(H,R){const P=[],s=0x8a8478,dk=0x6e695f,r0=pRng(9173);const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});
    add(new THREE.CylinderGeometry(R*1.12,R*1.25,1.6,18),dk,0,.5,0);add(new THREE.CylinderGeometry(R*.82,R,H,18,8),s,0,H/2,0,0,0,0,.06);
    for(let k=1;k<7;k++){const y=k*H/7,rr=R-(R*.18)*(y/H);add(new THREE.TorusGeometry(rr+.02,.16,5,24),dk,0,y,0,Math.PI/2,0,0);}
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.4,y=8+i*6,rr=(R-(R*.18)*(y/H))+.04;const x=Math.cos(a)*rr,z=Math.sin(a)*rr;
      add(new THREE.BoxGeometry(.8,1.3,.3),0x1a1a22,x,y,z,0,-a+Math.PI/2,0,0);add(SK.cone(.4,.45,4),0x1a1a22,x,y+.85,z,0,-a+Math.PI/2+Math.PI/4,0,0);
      add(SK.rbox(1.1,.14,.5,.04,1),dk,x,y-.72,z,0,-a+Math.PI/2,0);add(SK.torus(.45,.08,4,10,Math.PI),dk,Math.cos(a)*(rr+.05),y+.66,Math.sin(a)*(rr+.05),0,-a+Math.PI/2,0);}
    const top=H,Rt=R*.82;for(let k=0;k<18;k++){const a=k/18*Math.PI*2;add(SK.rbox(.35,.55,.35,.06,1),dk,Math.cos(a)*(Rt+.18),top-.1,Math.sin(a)*(Rt+.18),0,-a,0);}
    add(new THREE.CylinderGeometry(Rt+.45,Rt+.3,.6,18),s,0,top+.4,0);for(let k=0;k<12;k++){if(k%2)continue;const a=k/12*Math.PI*2;add(SK.rbox(1.1,.8,.4,.08,1),s,Math.cos(a)*(Rt+.3),top+1.1,Math.sin(a)*(Rt+.3),0,-a+Math.PI/2,0);}
    for(let k=0;k<6;k++){const r1=Rt*1.12*(1-k/6),r2=Rt*1.12*(1-(k+1)/6);add(new THREE.CylinderGeometry(Math.max(.05,r2),r1,1.25,18,1,true),new THREE.Color(0x3a3a46).multiplyScalar(.85+r0()*.3).getHex(),0,top+1.3+k*1.08+.6,0,0,0,0,.05);}
    add(SK.cyl(.08,.08,1.6,5),0x8a7a4a,0,top+8.4,0);add(SK.ball(.22,8,6),0xc8a850,0,top+9.2,0);
    add(SK.rbox(1.8,2.6,.5,.08,1),dk,0,1.3,R*.97);add(new THREE.BoxGeometry(1.3,2.1,.3),0x3a2412,0,1.05,R*1.02);add(SK.torus(.72,.12,5,12,Math.PI),dk,0,2.1,R*1.05);
    for(let k=0;k<3;k++)add(SK.rbox(2.2,.2,.6,.05,1),dk,0,.1+k*.2,R*1.05+.9-k*.35);
    return mergeParts(P);}
  function shrineGeoHi(){const P=[],w=0xe8e0d0,w2=0xd8d0c0;const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.04:j});
    add(new THREE.CylinderGeometry(6.5,6.8,.5,32),w2,0,.25,0);add(new THREE.CylinderGeometry(5.8,6.0,.4,32),0xe0d8c8,0,.7,0);add(new THREE.CylinderGeometry(6.15,6.25,.1,32),w,0,.52,0);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const x=Math.cos(a)*5.0,z=Math.sin(a)*5.0;
      add(SK.lathe([[.001,0],[.5,0],[.5,.12],[.42,.18],[.4,.3],[.001,.3]],14),w2,x,.9,z);
      const col=SK.cyl(.32,.36,4.0,16,6);const pp=col.attributes.position;for(let q=0;q<pp.count;q++){const ang=Math.atan2(pp.getZ(q),pp.getX(q));const f=1-.06*Math.max(0,Math.cos(ang*16));pp.setX(q,pp.getX(q)*f);pp.setZ(q,pp.getZ(q)*f);}col.computeVertexNormals();add(col,w,x,3.2,z);
      add(SK.lathe([[.001,0],[.34,0],[.44,.12],[.52,.22],[.001,.22]],14),w2,x,5.2,z);add(SK.rbox(1.05,.22,1.05,.04,1),w,x,5.5,z);}
    add(new THREE.TorusGeometry(5.2,.32,8,40),0xe0d8c8,0,5.75,0,Math.PI/2,0,0);add(new THREE.TorusGeometry(5.2,.16,6,40),w2,0,6.12,0,Math.PI/2,0,0);
    add(SK.lathe([[.001,0],[1.2,0],[1.2,.2],[.95,.35],[.9,1.0],[1.15,1.15],[1.15,1.3],[.001,1.3]],16),w2,0,.9,0);add(SK.rbox(1.8,.14,1.1,.04,1),w,0,2.26,0);
    return mergeParts(P);}
  // a craggy boulder: an icosahedron whose corners are pushed in and out by the position (so shared corners move
  // together) and shaded flat, facet by facet
  function cragGeo(s,seed){const g=new THREE.IcosahedronGeometry(s,1),p=g.attributes.position;const h=(x,y,z)=>{const v=Math.sin(x*12.9898+y*78.233+z*37.719+seed*.917)*43758.5453;return v-Math.floor(v);};
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1+(h(Math.round(x*100),Math.round(y*100),Math.round(z*100))-.5)*.45;p.setXYZ(i,x*k,y*k*.85,z*k);}g.computeVertexNormals();return g;}
  // a bandit's ridge tent: two canvas slopes over a ridge pole on two uprights, the gables closed, the door flap tied
  // back, guy lines to pegs; the canvas a patched brown by the tent's number
  function campTentGeo(k){const P=[];const cv=new THREE.Color([0x6a5a44,0x5e5240,0x74624a][k%3]),dk=0x3a2a1a,L=3.2,W=2.4,H=1.9;const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:col.isColor?col:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.08:j});
    const sl=Math.atan2(H,W/2),sLen=Math.hypot(W/2,H);for(const s of [1,-1])add(new THREE.BoxGeometry(.04,sLen,L),cv,s*W/4,H/2,0,0,0,s*(Math.PI/2-sl),.1);
    for(const s of [1,-1]){const tri=new THREE.Shape();tri.moveTo(-W/2,0);tri.lineTo(W/2,0);tri.lineTo(0,H);tri.closePath();const g=new THREE.ShapeGeometry(tri);add(g,s>0?cv.clone().multiplyScalar(.9):cv.clone().multiplyScalar(.8),0,0,s*L/2,0,s>0?0:Math.PI,0,.06);}
    add(SK.cyl(.05,.05,L+.3,5),dk,0,H+.02,0,Math.PI/2,0,0);for(const s of [1,-1])add(SK.cyl(.05,.05,H,5),dk,0,H/2,s*(L/2+.05));
    add(new THREE.BoxGeometry(.6,1.3,.04),cv.clone().multiplyScalar(.7),.45,.65,L/2+.08,0,-.6,0,.05);
    for(const s of [1,-1])for(const z of [-L/2+.3,L/2-.3]){const x0=s*W/2,x1=s*(W/2+.9);const gl=SK.cyl(.012,.012,Math.hypot(.9,H*.6),4);const ang=Math.atan2(.9,H*.6);add(gl,0xb09a70,(x0+x1)/2,H*.3,z,0,0,s*ang,0);add(SK.cyl(.025,.02,.25,4),0x5a4028,x1,.08,z);}
    return mergeParts(P);}
  function buildPoi(S,site,r){const k=site.kind;if(k==='glade')buildGlade(S,site,r);else if(k==='shrine')buildShrine(S,site,r);else if(k==='lair')buildLair(S,site,r);else if(k==='tower')buildTower(S,site,r);else if(k==='bcamp')buildBanditCamp(S,site,r);}

  // ═══ PEOPLES AND NATIONS (Session N) ═════════════════════════════════
  // Three islands, three nations, four peoples. A province belongs to the
  // nation of its landmass; inland provinces are one people, ports blend.
  // NPCs take body, name bank, dialect and opinions from their people.
  const NATIONS={
    gatelands:{name:'the Gatelands',formal:'Tír na nGeataí',people:'gatelander',climate:'temperate',style:'irish',cityStyle:'stone',banner:0x8a1a1a,trim:0xd8b040,titles:{city:['Lord','Lady'],town:'Mayor',port:'Harbour Reeve',garrison:'Captain',village:'Elder'},crown:'the Crown'},
    mark:     {name:'the Mark',      formal:'Na Críocha',    people:'markman',   climate:'cold',     style:'mark', cityStyle:'garrison',banner:0x1a1a1e,trim:0x8a8a90,titles:{city:['Captain','Captain'],town:'Reeve',port:'Harbour Reeve',garrison:'Captain',village:'Elder'},crown:'the League'},
    aurenne:  {name:'Aurenne',       formal:'the Compact',   people:'aurennais', climate:'warm',     style:'aurenne',cityStyle:'aurenne',banner:0x1e3a7a,trim:0xe8e8f0,titles:{city:['Prior','Prior'],town:'Factor',port:'Factor',garrison:'Marshal',village:'Elder'},crown:'the Compact'},
  };
  const PEOPLES={
    gatelander:{name:'Gatelander',self:'Tírfolk',names:'irish',skin:[0xe8c8a8,0xf0d0b0,0xe0b898,0xd8b090],hair:[0x2a1a10,0x4a2c14,0x8a3a1a,0xa04a20,0x3a2a1a],height:1.0,width:1.0,
      greet:["Weaver keep you.","You'll have walked a way.","Good day to you, and to yours."],bye:["Mind the road.","Weaver between you and harm."],yes:"I would, aye.",no:"I would not.",oath:"Weaver keep us",honor:"friend",
      of:{markman:["Hill-dogs. Loud, drunk, they'd duel a fencepost.","I'd walk any road with a Markish crew. Those people kill bears at ten."],aurennais:["Ledgers. Won't shake a hand without a witness.","Their ships come back. Ours don't."],oldblood:["Cold-eyes. My grandmother wouldn't let one in the house after dark. Never said why.","They can read the stones. I don't know that I'd want to."]}},
    markman:   {name:'Markman',self:'Markman',names:'anglo',skin:[0xf0dcc8,0xecd4c0,0xf4e0d0,0xe8d0b8],hair:[0xd8c8a0,0xb8a070,0x8a8a80,0xe8dcc0,0x5a4a3a],height:1.08,width:1.1,
      greet:["Aye.","Well? Speak.","You're not from the Mark. Fine."],bye:["Iron and blood.","Go on."],yes:"Aye.",no:"No.",oath:"iron and blood",honor:"",
      of:{gatelander:["Turf-cutters. Slow, sly, a proverb for every debt unpaid.","A Gatelander won't leave a wounded man. I wouldn't say that of a Markman."],aurennais:["Tithe-men. They'd sell you the rope for your hanging and charge for the knot.","Their steel's better than ours and they know it."],oldblood:["Cold-eyes. We don't sit with them. Nobody remembers why and nobody breaks it.","They don't die easy. I've seen it."]}},
    aurennais: {name:'Aurennais',self:'Aurennais',names:'french',skin:[0xc8a078,0xb88860,0xa87850,0xd0a880],hair:[0x1a1210,0x2a1a10,0x3a2818,0x1a1a1a],height:.98,width:.94,
      greet:["Master. Good day.","You have business? Then let us do it properly.","Welcome, on account."],bye:["As agreed.","Good day. Mind the tithe."],yes:"Agreed, and noted.",no:"That was not in the terms.",oath:"",honor:"Master",
      of:{gatelander:["Gate-grubbers. They dig up what should stay buried and call it a living.","Nobody keeps a field or a promise like a Gatelander."],markman:["The unlettered. A nation that settles arithmetic with axes.","Want a thing done by nightfall? Hire a Markman. Pay him after."],oldblood:["The Church says to honour them. The Church says a great deal.","They read what the rest of us only copy."]}},
    oldblood:  {name:'Old Blood',self:'Seanfhuil',names:'oldblood',skin:[0xd8d0cc,0xcfc8c4,0xe0d8d4,0xc8c0bc],hair:[0x0e0c0c,0x141212,0x1a1616],height:.92,width:.92,tattoo:true,
      greet:["You are here.","The stones are warm today.","Sit. You have been walking since before you woke."],bye:["Go gently.","The loom holds."],yes:"It is so.",no:"It is not.",oath:"by the loom",honor:"",
      of:{gatelander:["They dig. They have always dug. We taught them where.","Good people. They give what they are asked and don't ask what for."],markman:["They will not sit with us. That is fair. We would not sit with us.","Honest. Loud, but honest."],aurennais:["They built a church on our name. It is a fine church.","They write everything down. Someone must."]}},
  };
  NAMES.oldblood={m:['Fíachra','Cúán','Éimhín','Lonán','Odhrán','Senán','Dáire','Fáelán','Bécán','Cellach'],f:['Sadb','Étaín','Muirenn','Lasair','Fionnuala','Damhnait','Gormlaith','Bébinn','Caílte','Ercnat']};
  // ── which island is which nation ──
  let _landmass=null;
  function landmassOf(i,j){
    if(!_landmass){_landmass={};let id=0;const land=(i,j)=>i>=0&&j>=0&&i<GRID&&j<GRID&&isLandCell(i,j);
      for(let jj=0;jj<GRID;jj++)for(let ii=0;ii<GRID;ii++){const k=ii+','+jj;if(_landmass[k]!=null||!land(ii,jj))continue;const st=[[ii,jj]];_landmass[k]=id;let sx=0,sz=0,n=0;while(st.length){const [a,b]=st.pop();sx+=a;sz+=b;n++;[[1,0],[-1,0],[0,1],[0,-1]].forEach(([di,dj])=>{const x=a+di,y=b+dj;const kk=x+','+y;if(land(x,y)&&_landmass[kk]==null){_landmass[kk]=id;st.push([x,y]);}});}
        _landmass['c'+id]={i:sx/n,j:sz/n,n};id++;}
      _landmass.count=id;
      // nations by centroid: the home island's mass is the Gatelands; of the rest, west is the Mark, east Aurenne
      const home=_landmass[HOME_I+','+HOME_J];const others=[];for(let k=0;k<id;k++)if(k!==home&&_landmass['c'+k].n>=3)others.push(k);others.sort((a,b)=>_landmass['c'+a].i-_landmass['c'+b].i);
      _landmass.nation={};_landmass.nation[home]='gatelands';others.forEach((k,idx)=>{_landmass.nation[k]=idx===0?'mark':'aurenne';});
      for(let k=0;k<id;k++)if(_landmass.nation[k]==null){const c=_landmass['c'+k];let best='gatelands',bd=1e9;for(const m of [home,...others]){const cm=_landmass['c'+m];const d=Math.hypot(cm.i-c.i,cm.j-c.j);if(d<bd){bd=d;best=_landmass.nation[m];}}_landmass.nation[k]=best;}
      // sea cells (islets) go with the nearest mass
      for(let jj=0;jj<GRID;jj++)for(let ii=0;ii<GRID;ii++){const k=ii+','+jj;if(_landmass[k]!=null)continue;let best=null,bd=1e9;for(let m=0;m<id;m++){const c=_landmass['c'+m];const d=Math.hypot(c.i-ii,c.j-jj);if(d<bd&&c.n>=3){bd=d;best=m;}}_landmass[k]=best;}
    }
    return _landmass[i+','+j];
  }
  function nationOf(i,j){const m=landmassOf(i,j);return NATIONS[_landmass.nation[m]||'gatelands'];}
  function nationKeyOf(i,j){const m=landmassOf(i,j);return _landmass.nation[m]||'gatelands';}
  // the people of a province: inland = the nation's; ports and edge cities blend
  function peopleOfSite(site){
    const [i,j]=cellOf(site.x,site.z);const nat=nationOf(i,j);const r=cellRng((site.id||'').length*131+i*7,j*13,5);
    const blend=site.kind==='port'||site.islet||(site.kind==='city'&&(cellHash(i,j,41)<.4));
    if(!blend)return nat.people;
    const others=Object.keys(PEOPLES).filter(p=>p!==nat.people&&p!=='oldblood');const q=r();
    return q<.55?nat.people:q<.8?others[0]:q<.95?others[1]:'oldblood';
  }
  function peopleOfNpc(site,r){ // per NPC: the site's people, with an Old Blood minority everywhere and a stranger at ports
    const base=peopleOfSite(site);const q=r();
    if(q<.06)return 'oldblood';
    if((site.kind==='port'||site.islet)&&q<.3){const [i,j]=cellOf(site.x,site.z);const nat=nationOf(i,j);const others=Object.keys(PEOPLES).filter(p=>p!==nat.people&&p!=='oldblood');return others[Math.floor(r()*others.length)];}
    return base;
  }
  // the player's people
  function playerPeople(){return worldState.people||'gatelander';}
  // what an NPC says of the player's people, and how they describe the player (the Old Blood can't be pinned)
  function peopleGreeting(def){
    const P=PEOPLES[def.people||'gatelander'];const pp=playerPeople();
    if(pp==='oldblood'){const d=pick(Math.random,["I'd have said dark hair. I'd have said it. Now I'm not sure.","Your eyes were grey a moment ago.","I keep losing your face when I look away. Forgive me.","I never could look straight at you, could I."]);return d;}
    if(pp===def.people)return pick(Math.random,[P.honor?`One of our own, ${P.honor}.`:'One of our own.',"You've the look of home about you."]);
    const line=P.of[pp];return line?pick(Math.random,line):null;
  }
  function nationSubtitle(cell){const nat=nationOf(cell.i,cell.j);return `${nat.name} · ${(CULTURES[cell.reg]||{}).name||cell.reg} · ${cell.climate||nat.climate}`;}

  // ═══ SETTLEMENT STATES (Session O) — the prosperity model ═══════════
  // A town is generated from a seed and a plan; its state is an input.
  // worldState.towns[siteId] = {p, flags:{burned,sacked,abandoned,scaffold,owned,...}, builds:[], t}
  const BASE_P={village:45,town:60,city:75,port:65,garrison:55,outpost:35};
  function TS(site){const T=worldState.towns||(worldState.towns={});const id=typeof site==='string'?site:site.id;if(!T[id]){const kind=typeof site==='string'?'village':site.kind;const h=String(id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,3);T[id]={p:Math.max(10,Math.min(95,(BASE_P[kind]||45)+(h%21)-10)),flags:{},builds:[],t:worldState.gameTimeAbsMinutes||0};}return T[id];}
  function prosperity(site){return TS(site).p;}
  function baseProsperity(site){const h=String(site.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,3);return Math.max(10,Math.min(95,(BASE_P[site.kind]||45)+(h%21)-10));} // S243 — what TS() starts a town at
  function favor(site){const F=worldState.favor||(worldState.favor={});return F[typeof site==='string'?site:site.id]||0;}
  function addFavor(site,n){const F=worldState.favor||(worldState.favor={});const id=typeof site==='string'?site:site.id;F[id]=(F[id]||0)+n;return F[id];}
  function setProsperity(site,p,why){const st=TS(site);const old=st.p;st.p=Math.max(0,Math.min(100,Math.round(p)));if(Math.abs(st.p-old)>=12&&SETTLE.has(site.id||site)){disposeSettlement(site.id||site);} }
  // S272 — the town's own conditions keep their fraction (Michael, #44 B): st.pf carries what a day's flag effects (occupied −.5,
  // owned +.4, burned or sacked −.2) leave under a whole point, so half a point a day is a point in two days. Roads, the lair and
  // the drift home (`round`) are rounded together as before: carried too, they sank every town a third of the way in 120 days.
  function driveProsperity(site,dd,round){const st=TS(site);st.pf=Math.round(((st.pf||0)+dd)*1e6)/1e6;const w=Math.trunc(st.pf);st.pf-=w;
    const n=st.p+w+Math.round(round||0);if(n!==st.p)setProsperity(site,n);if((st.p>=100&&st.pf>0)||(st.p<=0&&st.pf<0))st.pf=0;}
  function flag(site,name,on){const st=TS(site);if(on)st.flags[name]=worldState.gameTimeAbsMinutes||0;else delete st.flags[name];if(SETTLE.has(site.id||site))disposeSettlement(site.id||site);}
  // what the generator reads
  function lotFactor(site,P){const p=P!=null?P:prosperity(site);return .35+.65*(p/100);}                     // 35%–100% of the plan
  function shopsFor(site,list,P){const p=P!=null?P:prosperity(site);const order={forge:0,goods:10,inn:20,apothecary:30,church:35,armoury:45,shipwright:40,guild_f:60,guild_m:60,keep:80,castle:80};return list.filter(t=>p>=(order[t]==null?0:order[t]));}
  function shutteredShare(site){const p=prosperity(site);return p<35?.5:p<50?.25:0;}
  function wallsAllowed(site){return prosperity(site)>=55||TS(site).flags.threatened!=null;}
  function lampsLit(site){return prosperity(site)>=40;}
  function bannersUp(site){return prosperity(site)>=70;}
  function priceMul(site){const p=prosperity(site);return 1.18-p*.0035;} // buy prices: 1.15 at 10 → .83 at 100
  // ═══ S269 — Q7 in the open world: Ashenmoor burns (Michael, issue #32: A) ═══
  // Handing in Q6 ("Smoke. From Ashenmoor.") sets worldState.ashenmoorPending. From then the world's Ashenmoor is the
  // war code's ruin, for good: burnt shells, nobody in the street, no lord; only Edna's cottage and Brother Oswin's
  // oratory stand, with the two of them inside. Coming onto its pad is Q7's first step, as entering the legacy zone was.
  const ASH_SURVIVORS=['Edna','Brother Oswin'];
  function storyRuin(site){return !!site&&(site.id||site)==='ashenmoor'&&!!(worldState.ashenmoorPending||worldState.ashenmoorBurned);}
  function tickAshenmoorStory(){if(!(worldState.ashenmoorPending||worldState.ashenmoorBurned))return;const t=siteAnywhere('ashenmoor');if(!t)return;
    if(TS(t).flags.burned==null)flag(t,'burned',true);
    if(worldState.ashenmoorPending&&!worldState.ashenmoorBurned&&!(typeof isInterior==='function'&&isInterior())&&Math.hypot(px-t.x,pz-t.z)<(t.pad||58)){
      worldState.ashenmoorBurned=true;worldState.ashenmoorPending=false;
      if(typeof addLog==='function')addLog('🔥','Ashenmoor has burned.');
      if(typeof checkQuestProgress==='function')checkQuestProgress('enter_zone',{zone:'overworld'});}
    // S270 — the Faolchú waits on the plaza until killed (killZoneEnemy sets faolchuDefeated, drops the Mark and ticks Q7)
    if(worldState.ashenmoorBurned&&!worldState.faolchuDefeated&&SETTLE.has('ashenmoor')&&typeof faolchuAt==='function'&&!ZONES.world.enemies.some(e=>e.isBoss&&e.bossId==='faolchu')){
      const fx=t.x+4,fz=t.z+2;const e=faolchuAt(sc,fx,fz,worldH(fx,fz));e._site='ashenmoor';ZONES.world.enemies.push(e);
      if(typeof addLog==='function')addLog('🐺','Something is moving in the ruins.');}}
  // ── drivers, ticked once per game-day for loaded towns ──
  let _pDay=-1;
  function tickProsperity(){
    const day=Math.floor((worldState.gameTimeAbsMinutes||0)/1440);if(day===_pDay)return;_pDay=day;
    const cleared=worldState.roadsCleared||{};const camps=worldState.camps||(worldState.camps={});
    let tithe=0; // S266 — the Compact's tithe (Michael, #37 A): a town Aurenne occupies pays half a point a day more, and its capital gains it
    for(const t of SITES){if(!(t.kind in BASE_P))continue;const st=TS(t);let d=0;
      // roads: cleared roads lift; ambush-ridden ones drain
      const rds=ROAD_DEFS.filter(x=>x.a===t.id||x.b===t.id);rds.forEach(x=>{d+=cleared[x.a+'|'+x.b]||cleared[x.b+'|'+x.a]?1:-.15;});
      // the nearest lair or bandit camp
      let near=null,nd=1e9;for(const o of SITES){if((o.kind==='lair'||o.kind==='bcamp')&&Math.hypot(o.x-t.x,o.z-t.z)<nd){nd=Math.hypot(o.x-t.x,o.z-t.z);near=o;}}
      if(near&&nd<700){const dead=worldState.lairs&&worldState.lairs[near.id];d+=dead?.6:-.6;if(near.kind==='bcamp'&&!dead){camps[near.id]=(camps[near.id]||0)+1;if(camps[near.id]>=20&&st.flags.sacked==null&&st.flags.burned==null){sack(t,near);camps[near.id]=0;}}}
      // flags
      let c=0;if(st.flags.burned!=null||st.flags.sacked!=null)c-=.2;if(st.flags.plague!=null)c-=1;if(st.flags.owned!=null)c+=.4;if(st.flags.besieged!=null)c-=2;if(st.flags.occupied!=null)c-=.5;
      // drift home
      const base=BASE_P[t.kind]||45;const drift=(base-st.p)*.01;
      // scaffolds finish
      st.builds.forEach(b=>{if(!b.done&&day>=b.doneDay){b.done=true;st.p+=b.p;showMsg(`${t.name}: the ${b.name} ${b.key==='walls'?'are':'is'} finished.`,'#e8d8a0');if(SETTLE.has(t.id))disposeSettlement(t.id);}});
      if(st.p<=0&&st.flags.abandoned==null){flag(t,'abandoned',true);}
      if(st.flags.abandoned!=null&&st.p>=20)flag(t,'abandoned',false);
      driveProsperity(t,c,d+drift);
      // prosperity is kept in whole points, so the tithe keeps its own account and is paid a point at a time, every second day
      if(st.flags.occupied!=null&&st.occupier==='aurenne'){st.tithe=(st.tithe||0)+.5;tithe+=.5;const w=Math.floor(st.tithe);if(w){st.tithe-=w;setProsperity(t,st.p-w);}}
    }
    if(tithe>0){anchoredPlaces();const cap=FACTIONS.compact.seat?siteAnywhere(FACTIONS.compact.seat):null;
      if(cap&&TS(cap).flags.occupied==null){const cs=TS(cap);cs.tithe=(cs.tithe||0)+tithe;const w=Math.floor(cs.tithe);if(w){cs.tithe-=w;setProsperity(cap,cs.p+w);}}}
    tickRoutesDay();try{tickWorldSystemsDay();}catch(e){console.warn('systems',e);}
  }
  function sack(t,camp){const st=TS(t);flag(t,'sacked',true);st.p=15;const lord=lordFor(t);if(typeof addLog==='function')addLog('🔥',`${t.name} was sacked by the bandits of ${camp.name}.`);showMsg(`Word comes that ${t.name} has been sacked.`,'#ff8060');}
  function markRoadCleared(a,b){(worldState.roadsCleared||(worldState.roadsCleared={}))[a+'|'+b]=worldState.gameTimeAbsMinutes||0;}
  function markLairDead(siteId){(worldState.lairs||(worldState.lairs={}))[siteId]=worldState.gameTimeAbsMinutes||0;}
  // ═══ SETTLEMENT AND WORLD SYSTEMS (Session 129) ══════════════════════
  // Wall tiers by prosperity; the cold peace breaking into a war of
  // sieges and occupations; pirates sacking ports; plague from a
  // backlogged gate; re-founding a ruin; the coach halting at a broken road.
  const dayNow=()=>Math.floor((worldState.gameTimeAbsMinutes||0)/1440);
  function allSites(){anchoredPlaces();const out=[];for(const c of CELLS.values())if(c.type!=='sea')out.push(...c.sites);return out;}
  // ── walls: fence → logs → stone → dressed stone ──
  function wallTierFor(site){const st=TS(site);const p=st.p;const built=st.builds.some(b=>b.key==='walls'&&b.done);
    if(st.flags.threatened!=null||st.flags.besieged!=null||st.flags.occupied!=null)return p>=70?'stone':'logs';
    if(p>=85)return 'dressed';if(p>=65)return 'stone';if(p>=45||built)return 'logs';return 'fence';}
  const WALL_SPEC={fence:{h:1.15,d:.3,wall:0x5a4a30,cap:0x4a3a22,towers:false,crenels:0,capRz:.3},
                   logs:{h:3.2,d:.5,wall:0x5a4222,cap:0x4a3418,towers:'box',crenels:0,capRz:.85},
                   stone:{h:4.6,d:1.3,wall:null,cap:null,towers:'round',crenels:1,capRz:.85},
                   dressed:{h:5.6,d:1.5,wall:0xbfb6a6,cap:0xd6cfc0,towers:'round',crenels:2,capRz:.95}};
  // ── the war ──
  const OPPONENT={crown:'mark',league:'aurenne',compact:'mark'}; // the Crown remembers the last war; the League and the Compact face each other across the strait
  function war(){return worldState.war||null;}
  function nationName(nk){return NATIONS[nk]?NATIONS[nk].name:nk;}
  function borderTowns(nk,vs){const out=[];const cells=[...CELLS.values()].filter(c=>c.type!=='sea'&&nationKeyOf(c.i,c.j)===vs);if(!cells.length)return out;const R=SIZE*2.5;
    for(const t of allSites()){if(!(t.kind in BASE_P)||t.kind==='outpost')continue;const [ci,cj]=cellOf(t.x,t.z);if(nationKeyOf(ci,cj)!==nk)continue;let bd=1e9;for(const c of cells){const d=Math.hypot(t.x-(c.i+.5)*SIZE,t.z-(c.j+.5)*SIZE);if(d<bd)bd=d;}if(bd<R)out.push(t);}
    if(!out.length){const mine=allSites().filter(t=>(t.kind in BASE_P)&&t.kind!=='outpost'&&nationKeyOf(...cellOf(t.x,t.z))===nk);mine.sort((p,q)=>{const dp=Math.min(...cells.map(c=>Math.hypot(p.x-(c.i+.5)*SIZE,p.z-(c.j+.5)*SIZE)));const dq=Math.min(...cells.map(c=>Math.hypot(q.x-(c.i+.5)*SIZE,q.z-(c.j+.5)*SIZE)));return dp-dq;});out.push(...mine.slice(0,4));}
    return out;}
  function startWar(a,b,firstId){if(war())return;worldState.war={a,b,day:dayNow(),resolved:0,broken:0,lost:0,first:firstId||null};
    if(typeof addLog==='function')addLog('⚔',`The cold peace is broken: ${nationName(a)} and ${nationName(b)} are at war.`);showMsg(`Word comes that ${nationName(a)} and ${nationName(b)} are at war.`,'#ff8060');
    if(firstId){const t=siteAnywhere(firstId);if(t)laySiege(t,b);}}
  function laySiege(t,by){const st=TS(t);if(st.flags.besieged!=null||st.flags.occupied!=null)return;flag(t,'besieged',true);st.siegeBy=by;st.siegeDay=dayNow();if(typeof addLog==='function')addLog('⚔',`${nationName(by)} has laid siege to ${t.name}.`);showMsg(`${t.name} is under siege.`,'#ff8060');}
  function breakSiege(t){const st=TS(t);const by=st.siegeBy;flag(t,'besieged',false);delete st.siegeBy;st.p=Math.min(100,st.p+5);addFavor(t,3);const W=war();if(W){W.broken++;W.resolved++;}
    if(typeof addLog==='function')addLog('⚔',`The siege of ${t.name} is broken.`);showMsg(`The siege of ${t.name} is broken.`,'#e8d8a0');if(W&&W.first===t.id)W.first=null;endWarIf();}
  function occupy(t){const st=TS(t);const by=st.siegeBy;flag(t,'besieged',false);flag(t,'occupied',true);st.occupier=by;delete st.siegeBy;st.p=Math.max(10,st.p-10);const W=war();if(W){W.lost++;W.resolved++;}
    if(typeof addLog==='function')addLog('⚔',`${t.name} has fallen to ${nationName(by)}.`);showMsg(`${t.name} has fallen.`,'#ff8060');endWarIf();}
  function liberate(t){const st=TS(t);flag(t,'occupied',false);delete st.occupier;st.p=Math.min(100,st.p+5);addFavor(t,4);if(typeof addLog==='function')addLog('⚔',`${t.name} is free again.`);showMsg(`${t.name} is free.`,'#e8d8a0');}
  function endWarIf(){const W=war();if(!W)return;if(W.resolved>=5){worldState.war=null;(worldState.wars||(worldState.wars=[])).push({a:W.a,b:W.b,day:W.day,ended:dayNow(),broken:W.broken,lost:W.lost});if(typeof addLog==='function')addLog('⚔',`Peace between ${nationName(W.a)} and ${nationName(W.b)}. ${W.broken} sieges broken, ${W.lost} towns lost.`);showMsg('Word comes of a peace.','#e8d8a0');}}
  function warFromFaction(fk){const a=FACTIONS[fk].nation,b=OPPONENT[fk];const seat=FACTIONS[fk].seat?siteAnywhere(FACTIONS[fk].seat):null;let first=null;const bt=borderTowns(a,b);if(seat&&bt.some(t=>t.id===seat.id))first=seat.id;else if(seat&&bt.length)first=bt.slice().sort((p,q)=>Math.hypot(p.x-seat.x,p.z-seat.z)-Math.hypot(q.x-seat.x,q.z-seat.z))[0].id;startWar(a,b,first);}
  function tickWarDay(){const W=war();if(!W)return;const day=dayNow();
    for(const t of allSites()){if(!(t.kind in BASE_P))continue;const st=worldState.towns&&worldState.towns[t.id];if(st&&st.flags.besieged!=null&&day-(st.siegeDay||day)>=12)occupy(t);}
    if(Math.random()<.15){const side=Math.random()<.5?[W.a,W.b]:[W.b,W.a];const cand=borderTowns(side[0],side[1]).filter(t=>{const st=TS(t);return st.flags.besieged==null&&st.flags.occupied==null&&st.flags.abandoned==null;});if(cand.length)laySiege(cand[Math.floor(Math.random()*cand.length)],side[1]);}}
  // soldiers outside the walls, or a garrison on the plaza; kill them all and the town is yours again
  const SIEGES=new Map();
  function soldierName(nk){return nk==='mark'?'Markish Soldier':nk==='aurenne'?'Compact Man-at-arms':"Crown Soldier";}
  function tickSieges(){if(activeZoneId!=='world')return;
    for(const t of SITES){if(!(t.kind in BASE_P))continue;const st=worldState.towns&&worldState.towns[t.id];if(!st)continue;const kind=st.flags.besieged!=null?'siege':st.flags.occupied!=null?'occupied':null;
      const S=SIEGES.get(t.id);const d=Math.hypot(px-t.x,pz-t.z);
      if(!kind||d>420){if(S&&(d>600||!kind)){S.enemies.forEach(e=>{if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const k=ZONES.world.enemies.indexOf(e);if(k>=0)ZONES.world.enemies.splice(k,1);});S.props.forEach(m=>sc.remove(m));SIEGES.delete(t.id);}continue;}
      if(S){if(S.kind!==kind){S.enemies.forEach(e=>{if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);});S.props.forEach(m=>sc.remove(m));SIEGES.delete(t.id);continue;}
        if(S.enemies.length&&S.enemies.every(e=>e.dead)){SIEGES.delete(t.id);S.props.forEach(m=>sc.remove(m));if(kind==='siege')breakSiege(t);else liberate(t);}continue;}
      if(d>300)continue;
      const by=kind==='siege'?st.siegeBy:st.occupier;const n=kind==='siege'?6+Math.floor(level/3):5+Math.floor(level/4);const enemies=[],props=[];
      let cx,cz;if(kind==='siege'){const rd=ROADS.find(r=>r.def.a===t.id||r.def.b===t.id);const q=rd?rd.pts[rd.def.a===t.id?Math.min(rd.pts.length-1,8):Math.max(0,rd.pts.length-9)]:{x:t.x+(t.pad||30)+30,z:t.z};cx=q.x;cz=q.z;}else{cx=t.x+8;cz=t.z+8;}
      for(let k=0;k<n;k++){const a=k/n*Math.PI*2;const ex=cx+Math.cos(a)*(kind==='siege'?7:5),ez=cz+Math.sin(a)*(kind==='siege'?7:5);const e=unlockFoe(buildZoneEnemy(sc,STATIC_SOL,ex,ez,k===0?'Bandit Captain':'Bandit',null));e.name=k===0?`${soldierName(by).replace(/Soldier|Man-at-arms/,'Captain')}`:soldierName(by);e.displayName=e.name;e.alert=false;e.homeX=cx;e.homeZ=cz;e._siege=t.id;ZONES.world.enemies.push(e);enemies.push(e);}
      if(kind==='siege'){const tentMat=new THREE.MeshLambertMaterial({color:by==='mark'?0x2a2a30:by==='aurenne'?0x2a3a6a:0x6a2a2a,side:THREE.DoubleSide});[[-4,-2],[4,-3],[0,5]].forEach(([ox,oz])=>{const m=new THREE.Mesh(new THREE.ConeGeometry(2,2.4,5,1,true),tentMat);m.position.set(cx+ox,worldH(cx+ox,cz+oz)+1.2,cz+oz);sc.add(m);props.push(m);});
        const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,4,5),new THREE.MeshLambertMaterial({color:0x3a2a1a}));pole.position.set(cx,worldH(cx,cz)+2,cz);sc.add(pole);props.push(pole);const ban=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.8),new THREE.MeshLambertMaterial({color:NATIONS[by]?NATIONS[by].banner:0x444444,side:THREE.DoubleSide}));ban.position.set(cx+.6,worldH(cx,cz)+3.6,cz);sc.add(ban);props.push(ban);
        showMsg(`${nationName(by)}'s camp outside ${t.name}.`,'#ff8060');}
      else showMsg(`${nationName(by)}'s garrison holds ${t.name}.`,'#ff8060');
      SIEGES.set(t.id,{kind,enemies,props});}}
  function warLine(){const W=war();if(!W)return '';return ` ${nationName(W.a)} and ${nationName(W.b)} are at war.`;}
  function warMarkers(push){const W=war();if(!W)return;for(const t of allSites()){if(!(t.kind in BASE_P))continue;const st=worldState.towns&&worldState.towns[t.id];if(!st)continue;if(st.flags.besieged!=null)push(t.x,t.z,RED,`siege — ${t.name}`);else if(st.flags.occupied!=null&&Math.hypot(px-t.x,pz-t.z)<1500)push(t.x,t.z,RED,`occupied — ${t.name}`);}}
  // ── ports: black sails come for the unprotected ──
  function portProtected(t){const st=TS(t);return st.builds.some(b=>(b.key==='harbour'||b.key==='walls')&&b.done)||wallTierFor(t)==='stone'||wallTierFor(t)==='dressed';}
  function tickPortsDay(){const S=story();const W=war();const risk=(W&&(W.a==='mark'||W.b==='mark'))?.05:S.act>=2?.025:0;if(!risk)return;
    for(const t of allSites()){if(t.kind!=='port')continue;const st=TS(t);if(st.flags.sacked!=null||st.flags.burned!=null||st.flags.abandoned!=null||portProtected(t))continue;if(Math.random()<risk){flag(t,'sacked',true);st.p=Math.max(10,st.p-25);if(typeof addLog==='function')addLog('🏴',`${t.name} was sacked from the sea by black sails.`);showMsg(`Word comes that black sails have sacked ${t.name}.`,'#ff8060');}}}
  // ── plague: a gate left uncleared too long ──
  function tickPlagueDay(){const L=worldState.lairDays||(worldState.lairDays={});const day=dayNow();
    for(const t of SITES){if(!(t.kind in BASE_P))continue;const st=TS(t);
      let near=null,nd=1e9;for(const o of SITES){if(o.kind==='lair'&&Math.hypot(o.x-t.x,o.z-t.z)<nd){nd=Math.hypot(o.x-t.x,o.z-t.z);near=o;}}
      const dead=near&&worldState.lairs&&worldState.lairs[near.id];
      if(st.flags.plague!=null){if(dead||day-st.flags.plague/1440>=20||st.plagueGone){flag(t,'plague',false);delete st.plagueGone;if(typeof addLog==='function')addLog('🕯',`The sickness at ${t.name} has passed.`);}continue;}
      if(near&&nd<700&&!dead){L[t.id]=(L[t.id]||0)+1;if(L[t.id]>=30&&Math.random()<.08){flag(t,'plague',true);L[t.id]=0;st.plagueFrom=near.name;if(typeof addLog==='function')addLog('🕯',`A sickness at ${t.name}. They say it came up out of ${near.name}.`);showMsg(`Word comes of a sickness at ${t.name}.`,'#ff8060');}}else L[t.id]=0;}}
  // ── a ruin re-founded ──
  function refoundTopics(site){const out=[];if(favor(site)<3)return out;for(const t of SITES){if(!(t.kind in BASE_P)||t.id===site.id)continue;const st=worldState.towns&&worldState.towns[t.id];if(!st||st.flags.abandoned==null)continue;if(Math.hypot(t.x-site.x,t.z-site.z)>1500)continue;const cost=900;
    out.push({label:`Send settlers to re-found ${t.name} (${cost} gold)`,quest:true,fn:()=>{if(gold<cost)return `Settlers, seed grain, a year's bread: ${cost} gold to re-found ${t.name}.`;gold-=cost;updateHUD();flag(t,'abandoned',false);const ts=TS(t);ts.p=25;ts.flags={};flag(t,'owned',true);addFavor(t,3);if(typeof addLog==='function')addLog('🏘',`${t.name} re-founded under your name.`);return `Then ${t.name} lives again, and it's yours. Twenty families go out in the morning. Keep the roads clean and they'll stay.`;}});}
    return out;}
  // ── what changes with the day ──
  function tickWorldSystemsDay(){try{tickWarDay();}catch(e){console.warn('war',e);}try{tickPortsDay();}catch(e){}try{tickPlagueDay();}catch(e){}try{tickCrimeDay();}catch(e){}
    // sacked and burned towns rebuild in a month
    const day=dayNow();for(const t of SITES){if(!(t.kind in BASE_P))continue;const st=worldState.towns&&worldState.towns[t.id];if(!st)continue;for(const f of ['sacked','burned']){if(f==='burned'&&storyRuin(t))continue;if(st.flags[f]!=null&&day-st.flags[f]/1440>=30&&st.p>=30)flag(t,f,false);}}}
  function roadBroken(a,b){const R=routes();const rt=R[routeKey(a.id,b.id)];if(rt&&rt.broken)return true;const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;return !!SITES.find(t=>t.kind==='bcamp'&&Math.hypot(t.x-mx,t.z-mz)<500&&!(worldState.lairs&&worldState.lairs[t.id]));}
  // ── investment and the deed ──
  const BUILDS=[{key:'well',name:'well',cost:120,p:6,min:0},{key:'inn',name:'inn',cost:400,p:10,min:30},{key:'chapel',name:'chapel',cost:500,p:8,min:35},{key:'walls',name:'walls',cost:900,p:8,min:45},{key:'guild',name:'guild hall',cost:1200,p:10,min:55},{key:'harbour',name:'harbour',cost:1500,p:12,min:50,port:true}];
  const aBuild=b=>b.key==='walls'?b.name:(/^[aeiou]/.test(b.name)?'an ':'a ')+b.name; // S349 — *an inn*, *walls*, not *a inn*, *a walls*
  // S352 — Michael’s A on #65: a lord offers only what the town lacks. What stands is read off the live town's houses
  // (the plan's list at today's prosperity when it isn't loaded): no inn where an inn stands, no chapel where a church
  // does, no guild hall where either guild's hall does, no walls where the ring is logs or better. The well and the harbour as before.
  function buildStands(site){const out=new Set();const S=SETTLE.get(site.id);let types;
    if(S&&S.houses)types=S.houses.map(h=>h.type);
    else{const plan=KIND_PLAN[site.kind]||KIND_PLAN.village;types=shopsFor(site,[...plan.shops,...((site.kind==='town'||site.kind==='city')?['guild_f','guild_m']:[])]);}
    if(types.includes('inn'))out.add('inn');if(types.includes('church'))out.add('chapel');if(types.includes('guild_f')||types.includes('guild_m'))out.add('guild');
    const plan=KIND_PLAN[site.kind]||KIND_PLAN.village;if(plan.walls&&wallTierFor(site)!=='fence')out.add('walls');
    return out;}
  function investTopics(site){
    const st=TS(site);const _tw=tutWaivesInvest(site);if((prosperity(site)<40||favor(site)<3)&&!_tw)return [];
    const out=[];const have=new Set(st.builds.map(b=>b.key));const stands=buildStands(site);
    for(const b of BUILDS){if(have.has(b.key)||stands.has(b.key)||(prosperity(site)<b.min&&!(_tw&&b.key==='well'))||(b.port&&site.kind!=='port'))continue;const cost=Math.round(b.cost*(1+prosperity(site)/200));
      out.push({label:`Pay for ${aBuild(b)} (${cost} gold)`,quest:true,fn:()=>{if(gold<cost)return `${aBuild(b).replace(/^./,c=>c.toUpperCase())} would cost the town ${cost} gold.`;gold-=cost;updateHUD();st.builds.push({key:b.key,name:b.name,p:b.p,doneDay:Math.floor((worldState.gameTimeAbsMinutes||0)/1440)+3,done:false});addFavor(site,1);if(SETTLE.has(site.id))disposeSettlement(site.id);if(typeof addLog==='function')addLog('🏗',`Paid for ${aBuild(b)} at ${site.name}.`);return `The masons start tomorrow. Three days, and it's yours as much as ours.`;}});}
    out.push(...refoundTopics(site));
    if(st.builds.filter(b=>b.done).length>=3&&favor(site)>=5&&st.flags.owned==null)out.push({label:`Take the deed to ${site.name}`,quest:true,fn:()=>{flag(site,'owned',true);addFavor(site,2);if(typeof addLog==='function')addLog('📜',`${site.name} is yours.`);return `Then it's yours. The rents come to you on the first of the week. Don't let it burn.`;}});
    return out;
  }
  // ═══ TRADE ROUTES (Session R) ════════════════════════════════════════
  // worldState.routes[a|b] = {a,b,opened,broken}. A caravan walks the road
  // between the two towns; both ends gain prosperity per day while it runs.
  // An ambush on the road, or a camp left alive within reach, breaks it.
  const CARAVANS=new Map(); // routeKey → {npc,mule,cart,road,t,dir}
  function routeKey(a,b){return a<b?a+'|'+b:b+'|'+a;}
  function routes(){return worldState.routes||(worldState.routes={});}
  function routeTopics(site){
    if((prosperity(site)<30||favor(site)<1)&&!tutWaivesRoute(site))return [];
    const out=[];const R=routes();
    ROAD_DEFS.filter(d=>d.a===site.id||d.b===site.id).forEach(d=>{const other=siteAnywhere(d.a===site.id?d.b:d.a);if(!other||!(other.kind in BASE_P))return;const key=routeKey(site.id,other.id);const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);const len=rd?rd.pts.reduce((acc,p,i)=>i?acc+Math.hypot(p.x-rd.pts[i-1].x,p.z-rd.pts[i-1].z):0,0):Math.hypot(other.x-site.x,other.z-site.z);
      if(R[key]&&!R[key].broken)return;const cost=Math.round(120+len/6);
      out.push({label:R[key]&&R[key].broken?`Reopen the route to ${other.name} (${cost} gold)`:`Open a trade route to ${other.name} (${cost} gold)`,quest:true,fn:()=>{if(gold<cost)return `A caravan to ${other.name} is ${cost} gold to fit out.`;gold-=cost;updateHUD();R[key]={a:site.id,b:other.id,opened:worldState.gameTimeAbsMinutes||0,broken:false};addFavor(site,1);addFavor(other,1);if(typeof addLog==='function')addLog('🐴',`Opened a trade route: ${site.name} — ${other.name}.`);return `Then it's done. A cart leaves in the morning, and one comes back. ${other.name}'s ${lordFor(other).title} will hear of it.`;}});});
    return out;
  }
  function tickRoutesDay(){const R=routes();for(const key in R){const rt=R[key];if(rt.broken)continue;const a=siteAnywhere(rt.a),b=siteAnywhere(rt.b);if(!a||!b)continue;
      // a camp alive within 500u of the road midpoint breaks it
      const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;const camp=SITES.find(t=>t.kind==='bcamp'&&Math.hypot(t.x-mx,t.z-mz)<500&&!(worldState.lairs&&worldState.lairs[t.id]));
      // a threat from yesterday that was never met (asleep, indoors, away when its hour came) breaks the route now
      if(rt.threat&&!rt.threat.won){breakRoute(key,rt,rt.threat.camp);continue;}
      delete rt.threat;
      // the camp picks an hour on the outbound leg, u .35–.65 of the road; tickCaravans springs it (Session 179)
      if(camp)rt.threat={day:Math.floor((worldState.gameTimeAbsMinutes||0)/1440),camp:camp.name,f:.175+Math.random()*.15,won:false,started:false};
      setProsperity(a,prosperity(a)+.8);setProsperity(b,prosperity(b)+.8);}
    const Cs=coaches();for(const key in Cs){const a=siteAnywhere(Cs[key].a),b=siteAnywhere(Cs[key].b);if(a&&b){setProsperity(a,prosperity(a)+1);setProsperity(b,prosperity(b)+1);}}}
  function caravanDef(a,b){const [i,j]=cellOf(a.x,a.z);const nat=nationOf(i,j);return makeDef(a,a.reg||'irish',Math.random,'Merchant',pick(Math.random,(NAMES[PEOPLES[nat.people].names]||NAMES.irish).m),{people:nat.people,x:a.x,z:a.z,bCol:0x6a4a2a,sCol:0xd4a878,topics:[{label:'What are you carrying?',response:`${a.name} wool and ${b.name} iron, this week. Next week the other way round. The road's kinder than it was.`},{label:'Anything for sale?',trade:true,goods:[{name:'Travel Ration',ico:'🍞',type:'potion',heal:12,buyPrice:6,sellMult:.4},{name:'Lamp Oil',ico:'🪔',type:'misc',buyPrice:9,sellMult:.5},{name:'Bolt of Cloth',ico:'🧵',type:'misc',buyPrice:22,sellMult:.6}]}]});}
  // The ambush (Session 179, Michael's answer B on issue #18). A camp near the road sets a threat for the day
  // (tickRoutesDay). At its hour, if you are within CARAVAN_WATCH of the caravan, three or four of the camp's
  // bandits fall on it: the cart goes over, the merchant runs. Kill them all and the route holds that day; go
  // CARAVAN_LEAVE away with them alive, or be elsewhere at the hour, and it breaks as before. The overturned cart
  // stays on the road (rt.wreck) until the route is reopened.
  const CARAVAN_WATCH=150,CARAVAN_LEAVE=250;const WRECKS=new Map();
  function roadAt(pts,u){u=Math.max(0,Math.min(1,u));const fi=u*(pts.length-1);const i0=Math.min(pts.length-2,Math.floor(fi)),f=fi-i0;const p0=pts[i0],p1=pts[i0+1];return {x:p0.x+(p1.x-p0.x)*f,z:p0.z+(p1.z-p0.z)*f,ang:Math.atan2(p1.x-p0.x,p1.z-p0.z)};}
  function cartMesh(){const c=x=>new THREE.Color(x);return new THREE.Mesh(mergeParts([{geo:new THREE.BoxGeometry(1.6,.5,1.0),color:c(0x6a4a2a),y:.6},{geo:new THREE.CylinderGeometry(.42,.42,.12,10),color:c(0x3a2a1a),x:0,y:.42,z:.6,rx:Math.PI/2},{geo:new THREE.CylinderGeometry(.42,.42,.12,10),color:c(0x3a2a1a),x:0,y:.42,z:-.6,rx:Math.PI/2},{geo:new THREE.BoxGeometry(.9,.5,.7),color:c(0x9a8a6a),y:1.1},{geo:new THREE.BoxGeometry(.08,.08,1.8),color:c(0x4a3018),y:.5,z:1.3}]),VC_MAT);}
  function overturn(m,x,z,ang){m.position.set(x,worldH(x,z)+.5,z);m.rotation.set(0,ang,0);m.rotateZ(Math.PI*.5);}
  function breakRoute(key,rt,campName){const a=siteAnywhere(rt.a),b=siteAnywhere(rt.b);rt.broken=true;rt.by=campName;
    if(!rt.wreck){const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);if(rd){const u=rt.threat?Math.min(1,rt.threat.f*2):.5;const p=roadAt(rd.pts,u);rt.wreck={x:p.x,z:p.z,ang:p.ang};}}
    delete rt.threat;const C=CARAVANS.get(key);if(C&&C.attack)C.attack.enemies.forEach(e=>{e._caravan=null;});removeCaravan(key);
    if(a&&b){showMsg(`The ${a.name}–${b.name} caravan was taken by the bandits of ${campName}.`,'#ff8060');if(typeof addLog==='function')addLog('🐴',`Trade route ${a.name}–${b.name} broken by ${campName}.`);}}
  function springAmbush(key,rt,C,a,b){const cx=C.npc.g.position.x,cz=C.npc.g.position.z,ang=C.npc.g.rotation.y;const n=3+(Math.random()<.5?1:0);const enemies=[];
    for(let k=0;k<n;k++){const t=(k/n)*Math.PI*2+ang;const ex=cx+Math.sin(t)*6,ez=cz+Math.cos(t)*6;const e=unlockFoe(buildZoneEnemy(sc,STATIC_SOL,ex,ez,k===0&&level>=5?'Bandit Captain':'Bandit',null));e.alert=true;e.homeX=cx;e.homeZ=cz;e._caravan=key;ZONES.world.enemies.push(e);enemies.push(e);}
    rt.threat.started=true;C.attack={enemies,x:cx,z:cz,ang,fled:0};overturn(C.cart,C.cart.position.x,C.cart.position.z,ang);
    showMsg(`Bandits of ${rt.threat.camp} fall on the ${a.name}–${b.name} caravan!`,'#ff8060');}
  function tickCaravans(dt){
    const R=routes();const dayNowF=((worldState.gameTimeAbsMinutes||0)%1440)/1440,today=Math.floor((worldState.gameTimeAbsMinutes||0)/1440);
    for(const key in R){const rt=R[key];const a=siteAnywhere(rt.a),b=siteAnywhere(rt.b);if(!a||!b)continue;
      const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);const near=Math.hypot(px-(a.x+b.x)/2,pz-(a.z+b.z)/2)<Math.hypot(a.x-b.x,a.z-b.z)/2+400;
      // the overturned cart of a broken route
      let W=WRECKS.get(key);if(rt.broken&&rt.wreck&&near){if(!W){W=cartMesh();sc.add(W);WRECKS.set(key,W);}overturn(W,rt.wreck.x,rt.wreck.z,rt.wreck.ang);}else if(W){sc.remove(W);WRECKS.delete(key);}
      let C=CARAVANS.get(key);
      // the threat's hour: spring it if you are by the caravan, else the route breaks unseen
      const T=rt.threat;if(!rt.broken&&T&&!T.won&&!T.started&&T.day===today&&dayNowF>=T.f){
        if(C&&Math.hypot(px-C.npc.g.position.x,pz-C.npc.g.position.z)<CARAVAN_WATCH)springAmbush(key,rt,C,a,b);else{breakRoute(key,rt,T.camp);continue;}}
      if(!rt.broken&&T&&T.started&&!T.won){const A=C&&C.attack;
        if(!A){breakRoute(key,rt,T.camp);continue;}
        if(A.enemies.every(e=>e.dead)){T.won=true;A.enemies.forEach(e=>{e._caravan=null;});C.lagF=Math.max(0,dayNowF<.5?dayNowF-T.f:0);delete C.attack;C.cart.rotation.set(0,0,0);
          showMsg(`The bandits are dead. The ${a.name}–${b.name} caravan rights its cart and goes on.`,'#e8d8a0');if(typeof addLog==='function')addLog('🐴',`Drove the bandits of ${T.camp} off the ${a.name}–${b.name} caravan.`);addFavor(a,1);addFavor(b,1);}
        else if(Math.hypot(px-A.x,pz-A.z)>CARAVAN_LEAVE||activeZoneId!=='world'){breakRoute(key,rt,T.camp);continue;}}
      if(rt.broken||!rd||!near){if(C){removeCaravan(key);}continue;}
      if(!C){const def=caravanDef(a,b);const n=spawnNPC(def,0,true);n.sched={type:'lost'};
        const c=x=>new THREE.Color(x);const cart=new THREE.Mesh(mergeParts([{geo:new THREE.BoxGeometry(1.6,.5,1.0),color:c(0x6a4a2a),y:.6},{geo:new THREE.CylinderGeometry(.42,.42,.12,10),color:c(0x3a2a1a),x:0,y:.42,z:.6,rx:Math.PI/2},{geo:new THREE.CylinderGeometry(.42,.42,.12,10),color:c(0x3a2a1a),x:0,y:.42,z:-.6,rx:Math.PI/2},{geo:new THREE.BoxGeometry(.9,.5,.7),color:c(0x9a8a6a),y:1.1},{geo:new THREE.BoxGeometry(.08,.08,1.8),color:c(0x4a3018),y:.5,z:1.3}]),VC_MAT);sc.add(cart);
        const mule=new THREE.Mesh(mergeParts([{geo:new THREE.BoxGeometry(.5,.55,1.1),color:c(0x5a4a3a),y:.75},{geo:new THREE.BoxGeometry(.3,.35,.5),color:c(0x5a4a3a),y:1.05,z:.7},{geo:new THREE.BoxGeometry(.12,.7,.12),color:c(0x4a3a2a),x:.18,y:.35,z:.4},{geo:new THREE.BoxGeometry(.12,.7,.12),color:c(0x4a3a2a),x:-.18,y:.35,z:.4},{geo:new THREE.BoxGeometry(.12,.7,.12),color:c(0x4a3a2a),x:.18,y:.35,z:-.4},{geo:new THREE.BoxGeometry(.12,.7,.12),color:c(0x4a3a2a),x:-.18,y:.35,z:-.4},{geo:new THREE.BoxGeometry(.6,.3,.5),color:c(0x8a6a3a),y:1.1}]),VC_MAT);sc.add(mule);
        C={npc:n,cart,mule,road:rd,t:((worldState.gameTimeAbsMinutes||0)%1440)/1440,dir:1,lagF:0};CARAVANS.set(key,C);}
      // under attack: the cart lies where it went over, the mule stands, the merchant runs back along the road
      if(C.attack){const A=C.attack;if(A.fled<30){const s=Math.min(30-A.fled,4.5*dt);A.fled+=s;const x=C.npc.g.position.x-Math.sin(A.ang)*s,z=C.npc.g.position.z-Math.cos(A.ang)*s;C.npc.g.position.set(x,worldH(x,z),z);C.npc.g.rotation.y=A.ang+Math.PI;C.npc.def.x=x;C.npc.def.z=z;C.npc.home={x,z};}continue;}
      // after a fight the caravan runs late, and makes the time up a quarter faster until it is back on its hour
      if(C.lagF>0)C.lagF=Math.max(0,C.lagF-dt/1440*.25);
      // one leg per game-day: the fraction of the day is the position along the road, out and back
      const dayF=Math.max(0,((worldState.gameTimeAbsMinutes||0)%1440)/1440-(C.lagF||0));const u=dayF<.5?dayF*2:2-dayF*2;const pts=C.road.pts;const fi=u*(pts.length-1);const i0=Math.min(pts.length-2,Math.floor(fi)),f=fi-i0;const p0=pts[i0],p1=pts[i0+1];const x=p0.x+(p1.x-p0.x)*f,z=p0.z+(p1.z-p0.z)*f;const fwd=dayF<.5?1:-1;const ang=Math.atan2((p1.x-p0.x)*fwd,(p1.z-p0.z)*fwd);
      C.npc.g.position.set(x,worldH(x,z),z);C.npc.g.rotation.y=ang;C.npc.def.x=x;C.npc.def.z=z;C.npc.home={x,z};
      C.mule.position.set(x-Math.sin(ang)*1.4,worldH(x,z),z-Math.cos(ang)*1.4);C.mule.rotation.y=ang;
      C.cart.position.set(x-Math.sin(ang)*3.0,worldH(x,z),z-Math.cos(ang)*3.0);C.cart.rotation.y=ang;
    }
  }
  function removeCaravan(key){const C=CARAVANS.get(key);if(!C)return;sc.remove(C.cart);sc.remove(C.mule);sc.remove(C.npc.g);sc.remove(C.npc.dot);const k=npcs.indexOf(C.npc);if(k>=0)npcs.splice(k,1);CARAVANS.delete(key);}
  // ═══ FACTIONS AND ANCHORED PLACES (Session S) ════════════════════════
  // Three nations you can rise in; past the second rank the other two close.
  // The story's named places are picked from the generated world once, by constraint.
  const FACTIONS={crown:{name:'the Crown',seat:'coeur_de_vie',nation:'gatelands',ranks:['Commissioner','Warden of Roads','Knight of the Gates'],house:'a keep'},
                  league:{name:"the Captains' League",seat:null,nation:'mark',ranks:['Sworn','Reeve','Captain'],house:'a garrison'},
                  compact:{name:'the Compact',seat:null,nation:'aurenne',ranks:['Clerk','Factor','Prior'],house:'a house and a ship'}};
  function fstate(){const F=worldState.factions||(worldState.factions={});for(const k in FACTIONS)if(!F[k])F[k]={done:0,rank:0,active:null,closed:false};return F;}
  function factionRank(k){return fstate()[k].rank;}
  function factionOf(nationKey){return nationKey==='gatelands'?'crown':nationKey==='mark'?'league':'compact';}
  let _anch=null;
  function anchoredPlaces(){
    if(_anch)return _anch;landmassOf(0,0);for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++)getCell(i,j);_anch={};
    const cellsOf=(nk)=>[...CELLS.values()].filter(c=>c.type!=='sea'&&nationKeyOf(c.i,c.j)===nk);
    const sitesOf=(nk,kinds)=>cellsOf(nk).flatMap(c=>c.sites.filter(t=>kinds.includes(t.kind)));
    // the strait: the sea column between the Mark and Aurenne — approximate by the Mark's easternmost coast
    const mark=cellsOf('mark');const markE=Math.max(...mark.map(c=>c.i));
    const pickNear=(list,fx,fz)=>list.slice().sort((a,b)=>Math.hypot(a.x-fx,a.z-fz)-Math.hypot(b.x-fx,b.z-fz))[0]||null;
    const straitX=(markE+1)*SIZE,straitZ=(mark.reduce((a,c)=>a+c.j,0)/Math.max(1,mark.length)+.5)*SIZE;
    // Caer Slige: a Mark garrison nearest the strait (or the nearest town, promoted)
    let cs=pickNear(sitesOf('mark',['garrison']),straitX,straitZ)||pickNear(sitesOf('mark',['town']),straitX,straitZ);if(cs){cs.name='Caer Slige';cs.anchor='caer_slige';FACTIONS.league.seat=cs.id;}
    // its spire
    const sp=cs?pickNear(sitesOf('mark',['tower']),cs.x,cs.z):null;if(sp){sp.name='The Spire of Caer Slige';sp.anchor='spire';}
    // Port Blackhand: a Mark port nearest the strait
    const pb=pickNear(sitesOf('mark',['port']),straitX,straitZ);if(pb){pb.name='Port Blackhand';pb.anchor='blackhand';}
    // the Compact's seat: Aurenne's capital; the Salt Mouth: an Aurennais lair nearest the coast facing the strait
    const cap=sitesOf('aurenne',['city'])[0];if(cap){FACTIONS.compact.seat=cap.id;}
    const sm=pickNear(sitesOf('aurenne',['lair']),straitX,straitZ);if(sm){sm.name='The Salt Mouth';sm.anchor='salt_mouth';sm.dragon=true;const cl=CELLS.get(key(...cellOf(sm.x,sm.z)));if(cl){const d=cl.doors.find(x=>x.lairDoor&&x.lairSite===sm.id);if(d){d.lair.dragon=true;d.lair.place='The Salt Mouth';d.size='large';d.diff='veryhard';d.canonicalName='The Salt Mouth — the cavern';}}}
    // the Root: an islet lair in a sea cell farthest east
    let root=null,rx=-1;for(const c of CELLS.values()){if(c.type!=='sea')continue;c.sites.forEach(t=>{if(t.kind==='lair'&&t.x>rx){rx=t.x;root=t;}});}
    if(root){root.name='The Root';root.anchor='root';const cell=CELLS.get(key(...cellOf(root.x,root.z)));if(cell){cell.doors=cell.doors.filter(d=>!(d.lairDoor&&d.lairSite===root.id));if(!cell.doors.some(d=>d.root))cell.doors.push({zone:'gen',x:root.x,z:root.z-6,seed:9001,size:'large',theme:'deep',diff:'veryhard',kind:'cave_door',cell:cell.i+','+cell.j,sigil:true,root:true,canonicalName:'The Root',lair:{place:'The Root',boss:'Ogre',dragon:false}});}}
    _anch={caer_slige:cs,spire:sp,blackhand:pb,salt_mouth:sm,root,compact_seat:cap};return _anch;
  }
  // faction quests ride the town-quest generator, flavoured and counted
  function factionTopics(site){
    const nk=nationKeyOf(...cellOf(site.x,site.z));const fk=factionOf(nk);const F=FACTIONS[fk];if(F.seat!==site.id)return [];
    const rec=nationRecord(nk);if(rec)return [{label:`Serve ${F.name}?`,response:`Not while ${rec.name} has a fine on you. ${F.name.replace(/^the /,'The ')} does not take on a debtor's quarrels. Settle it.`}]; // S158
    const st=fstate()[fk];const _duel=st.active&&st.active.kind==='duel'?st.active:null;
    if(st.closed&&!(_duel&&_duel.data.state==='murder'))return [{label:`Serve ${F.name}?`,response:"Not you. We've a long memory for the yard, and a short one for excuses."}]; // S373 — Rowe killed after she yielded
    const others=Object.keys(FACTIONS).filter(k=>k!==fk).filter(k=>fstate()[k].rank>=2);
    if(others.length)return [{label:`Serve ${F.name}?`,response:`${FACTIONS[others[0]].name} has your oath. We don't share.`}];
    const out=[];
    out.push({label:`Serve ${F.name}.`,quest:true,fn:()=>{const A=st.active;if(A&&A.kind==='duel'){const D=A.data; // S373 — the yard's two other endings
        if(D.state==='murder'){A.turnedIn=true;A.paid=0;st.active=null;st.closed=true;if(typeof addLog==='function')addLog('🏛',"The Captains' League has closed its gates to you.");return FLINES[fk][A.service].afterMurder;}
        if(D.state==='lost'&&!D.told){D.told=true;return "Rowe's Captain. The chair's hers till someone takes it off her on the yard, and that's your right now, same as it was hers. Give your arm a week. The ring goes up again in seven days.";}
        if(D.state==='lost'&&dayNow()<(D.retryDay||0))return "Not yet. A week, I said. Rowe's not going anywhere, and neither's the chair.";}
      if(st.active&&!st.active.done)return `You still owe us: ${st.active.objective}.`;if(st.active&&st.active.done){const _fi=st.active.service;qTurnIn(st.active);st.done++;const before=st.rank;st.rank=Math.min(3,Math.floor(st.done/3));st.active=null;const _aft=_fi!=null?factionAfter(fk,_fi):'';if(st.rank>before){if(typeof addLog==='function')addLog('🏛',`${F.name}: named ${F.ranks[st.rank-1]}.`);if(st.rank===3)try{warFromFaction(fk);}catch(e){console.warn('war',e);}return `${F.name.replace(/^the /,'The ')} names you ${F.ranks[st.rank-1]}.${_aft} ${st.rank===3?`There's ${F.house} in it, when you want it.`:''}`;}return `Good. ${F.name} keeps count.${_aft}`;}
      const q=factionQuestFor(site,fk,st);if(!qFind(q.id))qAdd(q);st.active=q;return q.desc+` (${q.reward} gold, and ${F.name}'s regard.)`;}});
    out.push({label:`My standing with ${F.name}?`,get response(){return st.rank?`${F.ranks[st.rank-1]}. ${st.done} services.`:`None yet. ${st.done} services.`;}});
    if(st.rank>=3&&!st.house){out.push({label:`Claim ${F.house}.`,quest:true,fn:()=>{st.house=true;const h=(fk==='crown'?ZONES.world.houses.find(x=>x.type==='castle'):ZONES.world.houses.find(x=>x.type==='home'&&x.siteId===site.id));if(h){(worldState.owned||(worldState.owned={}))[h.id]={name:h.name,site:site.id};h.ownedByPlayer=true;h.name=fk==='crown'?'Your Keep':'Your House';}if(typeof addLog==='function')addLog('🏛',`${F.name} granted you ${F.house}.`);return `It's yours. ${fk==='compact'?'The ship is at the quay under your name.':''}`;}});}
    return out;
  }
  // perks: shops of your faction's nation discount by rank; ferries free at rank 2
  // ═══ FACTION LINES (Session 128) ════════════════════════════════════
  // Nine authored services per faction (three per rank), the ninth a set
  // piece, and one rival across all three: Hesket Rowe, a Markish
  // mercenary who is always one service ahead of you until she isn't.
  // Services ride the town-quest generator for their mechanics (the
  // generator picks the target and the direction) and take authored words.
  const RIVAL={name:'Hesket Rowe',npc:null,key:''};
  const FLINES={
    crown:[
      {kind:'cull',title:"The King's Wolves",brief:"The Crown licenses the gates and taxes the salvage; it also feeds the countryside that feeds the city."},
      {kind:'road',title:'The South Road',brief:"Hesket Rowe took the north road last week and had it clean in a day. You have the south.",rival:'mention'},
      {kind:'deliver',title:'Under Seal',brief:"This goes under the Crown's seal. If it's opened before it's read, I'll know by the wax."},
      {kind:'retrieve',title:'The Old Survey',brief:"The survey teams map the gates for the Crown. One of their books was taken.",rival:'present',item:'the old survey'},
      {kind:'cull',title:"The Warden's Tally",brief:"A Warden keeps the roads. A road with wolves on it isn't kept."},
      {kind:'find',title:'Where Is Warden Rowe?',brief:"Rowe rode out three days ago on Crown business and hasn't sent word. That isn't like her.",rival:'trouble'},
      {kind:'deliver',title:'Word to the Lords',brief:"Every lord on this island is to know the Crown's survey teams are not to be hindered. Say it plainly."},
      {kind:'road',title:'The Last Camp',brief:"There's one camp left on the royal roads. A Knight of the Gates clears it in person."},
      {kind:'retrieve',title:'The Silent Survey',brief:"A survey team went into a gate under the Crown's writ and has stopped answering. Bring back their marker so we know what they found.",set:true,item:"the survey team's marker",after:"They were etching, Knight. Not clearing — etching. The orders came under Aldwyn's seal, and Aldwyn swears he never sent them. Keep that under your helm."}
    ],
    league:[
      {kind:'cull',title:'Meat for the Garrison',brief:"Caer Slige eats what the hills give it. The hills are giving it wolves."},
      {kind:'road',title:'The Hill Road',brief:"Rowe cleared the coast road for us. Sworn a week and already a name. The hill road's yours.",rival:'mention'},
      {kind:'deliver',title:"A Reeve's Letter",brief:"The free towns don't take orders. They take letters, if the hand that brings them looks like it could hold a sword."},
      {kind:'retrieve',title:"The Reeve's Seal",brief:"A seal was taken off a dead reeve. Whoever has it can sign the Mark's name.",rival:'present',item:"the reeve's seal"},
      {kind:'cull',title:'The Watch on the Spire',brief:"Something's been coming down off the spire at night. Kill what you find below it."},
      {kind:'find',title:'Where Is Rowe?',brief:"Rowe went up the hill road alone. Reeves don't go alone. Find her.",rival:'trouble'},
      {kind:'deliver',title:'The Captains\u2019 Word',brief:"The League has one word for the Crown's surveyors: no. Carry it."},
      {kind:'road',title:'The Free Captains',brief:"The free captains have made a camp on our road. They're ours, and they're still a camp. Clear it, and don't ask whose coin they carry."},
      {kind:'duel',title:'The Duel at Caer Slige',brief:"A Captain of the League is made by acclamation, and acclamation is won on the yard. Rowe has claimed the challenge. It's her right. The ring's laid east of the walls from first light. Walk in when you're ready. Down or yield, and it's done by noon.",set:true,after:"Acclaimed. Rowe says you fought well, and she doesn't say that of many. You're Captain now, and the spire's yours to hold. Something up there pays my sergeants in light. I've stopped asking what.",afterMurder:"The yard saw it. So did I. There's no acclamation for that, and there's no League for you either. Leave your oath at the gate."}
    ],
    compact:[
      {kind:'deliver',title:'The Tithe Roll',brief:"Every hull that passes is tithed. This roll goes to the Factor; it says which ones haven't paid."},
      {kind:'cull',title:'The Church\u2019s Flocks',brief:"The Church of the Weaver keeps flocks as well as souls. Both are being eaten."},
      {kind:'road',title:'The Pilgrim Road',brief:"Rowe cleared the pilgrim road east of here before the Church asked. Clerk to Factor in a fortnight. Yours is the west.",rival:'mention'},
      {kind:'retrieve',title:'What the Sea Gave Back',brief:"A relic was taken from a sealed gate — sealed by us, at cost. It must not be sold.",rival:'present',item:'the reliquary'},
      {kind:'deliver',title:'A Prior\u2019s Letter',brief:"To the Factor at the port. The tithe is going up; the port won't like it; you will stand there while it's read."},
      {kind:'find',title:'Where Is Factor Rowe?',brief:"Rowe went to a gate the Church had sealed. She should not have. Find her — and don't touch the seal.",rival:'trouble'},
      {kind:'cull',title:'The Uncleared',brief:"The dead are the uncleared. The Church blesses them; you bury them."},
      {kind:'road',title:'The Tithe Road',brief:"Bandits on the tithe road means bandits in the Church's purse."},
      {kind:'sail',title:'The Black Sail',brief:"A black-sailed hull has been taking tithe-ships in the strait. The Church has a ship; a Prior has a ship's captain. Board her and clear her deck.",set:true,after:"The strait's quieter. Prior — and the house and the ship are yours. Rowe's gone north with the League, they say. Cold-eyes always find their own."}
    ]
  };
  function factionService(fk,i){const L=FLINES[fk];return L[Math.min(i,L.length-1)];}
  function factionQuestFor(site,fk,st){
    const F=FACTIONS[fk];const i=st.done;const S=factionService(fk,i);const authored=i<FLINES[fk].length;
    const lord=lordFor(site);const voice=`${lord.title} ${lord.name}`;
    let q;
    if(S.kind==='sail'){q={id:'fq_'+fk+'_'+i+'_'+Date.now(),giver:F.name,giverSite:site.id,title:S.title,desc:'',objective:'Board a black-sailed ship in the strait and clear her deck',kind:'sail',data:{},reward:220+level*20};}
    else if(S.kind==='duel'){const x=site.x+(site.pad||30)+14,z=site.z;q={id:'fq_'+fk+'_'+i+'_'+Date.now(),giver:F.name,giverSite:site.id,title:S.title,desc:'',objective:`Meet ${RIVAL.name} in the ring east of ${site.name}`,kind:'duel',data:{x,z,state:'wait',retryDay:null},enemy:'Bandit Captain',enemyName:RIVAL.name,reward:220+level*20};}
    else{q=townQuestFor(site,S.kind);if(qActive().some(a=>a.id===q.id))return q; // the seat's own job is still open
      if(S.kind==='find'&&S.rival){const old=q.data.who;q.data.who=RIVAL.name;q.title=S.title;q.objective=q.objective.split(old).join(RIVAL.name);q.desc=q.desc.split(old).join(RIVAL.name).replace('Find them — there\'s a camp out that way — and send them home.','Find her — there\'s a camp out that way — and bring her back.');q.rival='trouble';q.data.topics=[{label:'The seat sent me for you.',response:"Did they. Then they've noticed I'm not there. I sat down and my legs stopped agreeing with me. Tell them Rowe's coming — and tell them who found her."}];}
      if(S.item&&q.kind==='retrieve'){const old=q.data.item;q.data.item=S.item;q.objective=q.objective.split(old).join(S.item);q.desc=q.desc.split(old).join(S.item);}}
    if(authored){const mech=q.desc.replace(/^[^:]+: "/,'').replace(/"$/,'');q.title=`${F.name}: ${S.title}`;q.desc=`${voice}: "${S.brief}${mech?' '+mech:''}"`;if(S.set)q.reward=Math.max(q.reward,200+level*20);}
    else q.title=`${F.name}: ${q.title}`;
    q.giver=F.name;q.faction=fk;q.service=i;return q;
  }
  function factionAfter(fk,i){const S=FLINES[fk][i];return S&&S.after?' '+S.after:'';}
  // the rival's beats: what she has to say when she stands at the seat
  function rivalBeat(fk,st){if(fk==='league'&&st.rowe==='dead')return null; // S374 — after the yard: she lives (rank 3), or holds the chair until the rematch
    if(st.rank>=3&&(fk!=='league'||st.rowe==='alive'))return 'present';if(fk==='league'&&duelLostBeat(st))return 'present';const i=st.done;const S=FLINES[fk][i];if(!S)return null;
    if(S.rival==='present')return 'present';
    if(S.rival==='mention'&&st.active)return 'mention';return null;}
  function duelLostBeat(st){const A=st.active;return st.rowe==='captain'&&A&&A.kind==='duel'&&A.data&&A.data.state==='lost';}
  function rivalLines(fk,st,F){
    if(fk==='league'&&st.rank>=3)return {greet:"Captain. Took me a week to stop favouring the left. I'm staying on at Caer Slige a while. Somebody ought to watch that spire.",topics:[{label:'What now, Rowe?',response:"The spire. You hold it, and I'll watch what comes down off it at night. If it's the light I think it is, you'll want a witness who can't be paid in it."},{label:'How are you ahead of me?',response:"I'm not, now. Don't get used to it."}]};
    if(fk==='league'&&duelLostBeat(st))return {greet:"Captain Rowe, for a week at least. The ring's there when you want it. I'd want it back.",topics:[{label:'How are you ahead of me?',response:"I was a step slow on the left, and you didn't see it. Next time you might."},{label:'Where are you from?',response:"The Mark. Half the swords on these islands are. The other half are asking where we're from."}]};
    const r=F.ranks;const yours=st.rank?r[st.rank-1]:'nobody';const hers=r[Math.min(2,st.rank)];
    if(st.rank>=3)return {greet:fk==='crown'?"Knight. I heard about the survey team. I was in one, once — I got out. We'll talk about it when you've a keep to talk in.":"Prior. They tell me you took the black sail. I'd have taken her a day sooner. I'm for the Mark; the League pays in silver and doesn't tithe it.",topics:[{label:'What now, Rowe?',response:fk==='crown'?"The same as you. Someone's etching in the gates on orders nobody gave. I'd like to know whose hand."+"":"North. There's a captain at the strait who pays in light. I want to see it."}]};
    return {greet:`${yours}, is it? I'm ${hers}. ${fk==='crown'?"Try to keep up; the roads don't clear themselves.":fk==='league'?"They gave me the coast road. They gave you the hills. That's the order of things.":"The Church counts in fortnights. Try to be worth one."}`,
      topics:[{label:'How are you ahead of me?',response:"I start earlier and I don't stop to talk. That's the whole of it."},{label:'Where are you from?',response:"The Mark. Half the swords on these islands are. The other half are asking where we're from."}]};
  }
  function tickRival(){
    let fk=null,st=null;for(const k in FACTIONS){const s=fstate()[k];if(s.active||s.done>0){if(!fk||s.done>st.done){fk=k;st=s;}}}
    if(!fk){if(RIVAL.npc)removeRival();return;}
    const F=FACTIONS[fk];const seat=F.seat?siteAnywhere(F.seat):null;const beat=seat?rivalBeat(fk,st):null;
    if(!beat||beat==='mention'||Math.hypot(px-seat.x,pz-seat.z)>160){if(RIVAL.npc&&(!beat||Math.hypot(px-RIVAL.npc.g.position.x,pz-RIVAL.npc.g.position.z)>240))removeRival();return;}
    const key=fk+'|'+st.done+'|'+st.rank+'|'+(fk==='league'&&duelLostBeat(st)?'lost':'');if(RIVAL.npc){if(RIVAL.key!==key)removeRival();else return;}
    const L=rivalLines(fk,st,F);const x=seat.x+6,z=seat.z+9;
    const def={name:RIVAL.name,role:'',ico:'⚔',authored:true,people:'markman',sCol:0xf0dcc8,hairCol:0xd8c8a0,bodyScale:[1.04,1.06,1.04],bCol:0x2a2a30,x,z,greeting:[L.greet],topics:[...L.topics,{label:'Farewell.',bye:true}]};def.temper='dry';
    const n=spawnNPC(def,Math.PI,true);n.sched={type:'lost'};n.g.position.set(x,worldH(x,z),z);RIVAL.npc=n;RIVAL.key=key;
  }
  function removeRival(){const n=RIVAL.npc;if(!n)return;sc.remove(n.g);sc.remove(n.dot);const k=npcs.indexOf(n);if(k>=0)npcs.splice(k,1);RIVAL.npc=null;}
  // the set-piece kinds the generator doesn't know
  function tickFactionKinds(){for(const q of qActive()){if(q.done)continue;if(q.kind==='sail'&&OTHER.some(o=>o.kind==='pirate'&&o.boarded&&o.crew.length&&o.crew.every(e=>e.dead))){qComplete(q);showMsg('Her deck is yours.','#e8d8a0');}}}
  function factionWantsPirate(){return qActive().some(q=>q.kind==='sail'&&!q.done);}
  // S373 — the Yard at Caer Slige (Michael's A on #69; the quest writer's draft in docs/quest_drafts.md). The League's
  // ninth service is a duel in a roped ring east of the seat, laid from first light to noon. Rowe waits in it as a
  // person; the yard-sergeant's *Call it.* puts a Bandit Captain wearing her name in her place. At a quarter of her
  // health she kneels and yields (no blow takes her below it before then); three seconds unstruck and she is spared, a
  // blow after the yield is murder and the League closes. The ring holds you at 1 health: down, yielded or over the
  // rope, the yard acclaims Rowe, and the ring is laid again in seven days.
  const DUEL={q:null,open:false,parts:[],sgt:null,watchers:[],rowe:null,npc:null,bark:0,last:'',spare:0,hp0:0,yieldS:0,inside:false,offered:false,rb:null,rbT:0,stag:false,pstag:false};
  const DUEL_R=5,DUEL_OPEN=6,DUEL_CLOSE=12,DUEL_CHECK=.4;
  const DUEL_BARKS=["Feet, Rowe! Feet!","Get your guard up, {nick}!","That's blood. Keep at it.","Iron and blood!","Watch her left, {nick}.","Don't dance. Fight.","Hesket! Hesket!","Up, {nick}! Up!","Finish it by noon, the pair of you!"];
  function duelQuest(){return qActive().find(q=>q.kind==='duel')||null;}
  function duelRingHours(){const h=hourNow();return h>=DUEL_OPEN&&h<DUEL_CLOSE;}
  function duelNick(){const it=EQ.weapon;if(!it)return 'Fists';const sh=it.weaponShape||(/bow/i.test(it.name)?'bow':/staff/i.test(it.name)?'staff':/axe/i.test(it.name)?'axe':/mace|hammer|club/i.test(it.name)?'mace':/dagger|knife/i.test(it.name)?'dagger':'sword');
    return /bow/.test(sh)?'Bowstring':/staff/.test(sh)?'Stick':/axe/.test(sh)?'Hatchet':/mace|club|hammer|flail/.test(sh)?'Hammer':/dagger|knife/.test(sh)?'Pin':'Blade';}
  function duelLeague(){return fstate().league;}
  function duelRemoveNpc(n){if(!n)return;sc.remove(n.g);if(n.dot)sc.remove(n.dot);const k=npcs.indexOf(n);if(k>=0)npcs.splice(k,1);}
  function duelRemoveRowe(){const e=DUEL.rowe;if(!e)return;if(!e.dead){if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const i=ZONES.world.enemies.indexOf(e);if(i>=0)ZONES.world.enemies.splice(i,1);}DUEL.rowe=null;DUEL.rb=null;}
  function duelRingDown(){DUEL.parts.forEach(m=>{sc.remove(m);if(m.geometry)m.geometry.dispose();});DUEL.parts=[];}
  function duelTeardown(){duelRingDown();duelRemoveNpc(DUEL.sgt);DUEL.watchers.forEach(duelRemoveNpc);duelRemoveNpc(DUEL.npc);duelRemoveRowe();
    Object.assign(DUEL,{q:null,sgt:null,watchers:[],npc:null,inside:false,offered:false,stag:false,pstag:false});}
  function duelPerson(def,x,z,face){def.x=x;def.z=z;const n=spawnNPC(def,face,true);n.sched={type:'lost'};n.g.position.set(x,worldH(x,z),z);return n;}
  function duelSeed(q){let h=0;for(const c of q.id)h=(h*31+c.charCodeAt(0))>>>0;return ()=>{h=(h*1664525+1013904223)>>>0;return h/4294967296;};}
  function roweSay(text){const e=DUEL.rowe;if(!e||!e.mesh)return;if(DUEL.rb)e.mesh.remove(DUEL.rb);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:bubbleFor(text),transparent:true,depthTest:false}));sp.scale.set(1.6,.4,1);sp.position.set(0,2.1,0);e.mesh.add(sp);DUEL.rb=sp;DUEL.rbT=3.2;}
  function roweDef(x,z){const pp=playerPeople();
    const hello={markman:"One of ours. Good. Nobody'll say it wasn't fair.",gatelander:"A turf-cutter on the yard. They say your lot won't leave a wounded man. We'll see if you'll let one up.",aurennais:"Your Church says the yard's for the unlettered. You came anyway. That's the first thing I've liked about you.",oldblood:"Cold-eyes. The sergeant asked me if it's allowed. It's allowed. I'll try to look straight at you. People tell me that's hard."}[pp]||"One of ours. Good. Nobody'll say it wasn't fair.";
    const def={name:RIVAL.name,role:'',ico:'⚔',authored:true,people:'markman',sCol:0xf0dcc8,hairCol:0xd8c8a0,bodyScale:[1.04,1.06,1.04],bCol:0x2a2a30,x,z,temper:'dry',
      get greeting(){const s=DUEL.q&&DUEL.q.data.state;return [s==='won'?"Good fight. I was a step slow on the left, and you saw it. Buy me a drink when you've a garrison to buy it in.":hello];},
      get topics(){const s=DUEL.q&&DUEL.q.data.state;return s==='wait'?[{label:'Why do you want it?',response:"Captain's a garrison and forty mouths. I've fed worse. And somebody ought to ask what the spire pays the sergeants in, because it isn't silver."},{label:"We don't have to do this.",response:"Aye, we do. You're Reeve, I'm Reeve, and there's one Captain's chair at the strait. We settle it by noon and drink after."},{label:'Farewell.',bye:true}]:[{label:'Farewell.',bye:true}];}};
    return def;}
  function duelBuild(q){const d=q.data,cx=d.x,cz=d.z;DUEL.q=q;DUEL.open=duelRingHours();const r=duelSeed(q);const bank=NAMES.anglo;const used=new Set();
    // S393 — the yard's people never take a name the seat already uses: the service's giver, the town's lord and its people (the critic's s342: a watcher Wulfstan beside Reeve Wulfstan)
    {const take=n=>{if(n)String(n).split(/\s+/).forEach(w=>used.add(w));};take(q.giver);take(RIVAL.name);const seat=siteAnywhere(q.giverSite);if(seat){try{if(!seat.lordless)take(lordFor(seat).name);}catch(err){}const S_=SETTLE.get(seat.id);if(S_&&S_.npcs)S_.npcs.forEach(n=>take(n.def&&n.def.name));}}
    const nm=()=>{let n;for(let k=0;k<20;k++){const L=r()<.5?bank.m:bank.f;n=L[Math.floor(r()*L.length)];if(!used.has(n))break;}used.add(n);return n;};
    const sn=nm();const sa=-Math.PI/2+.5,sx=cx+Math.cos(sa)*(DUEL_R+.8),sz=cz+Math.sin(sa)*(DUEL_R+.8);
    const sdef={name:sn,role:'Yard-sergeant',ico:'⚔',authored:true,people:'markman',bCol:0x3a3a40,sCol:0xe8d4bc,x:sx,z:sz,
      get greeting(){const s=DUEL.q&&DUEL.q.data.state;if(s==='murder')return ["She yielded. Every one of us saw it."];return [DUEL.open?"You're the other one. Rowe's been in there since first light.":"Ring's down. It goes up at first light, and it comes down at noon, fought or not."];},
      get topics(){const s=DUEL.q&&DUEL.q.data.state;if(s!=='wait'||!DUEL.open)return [{label:'Farewell.',bye:true}];return [
        {label:'The rules?',response:"Three. Nobody steps in. You go over the rope, you've yielded. Somebody yields, it's over, and you don't touch them after. That last one's the only one anybody remembers."},
        {label:'What do I fight with?',response:"What you walked in with. Steel, a bow, the old words if you've got them. The yard doesn't care how. It cares that it's you."},
        {label:'And if she dies?',response:"She won't, before she yields. Rowe's not proud that way. After she yields, it's murder, and the whole Mark will know your name by the week's end."},
        {label:'Call it.',quest:true,fn:()=>{duelStart(q);return "Rope's up. Iron and blood, the pair of you. Go on.";}},
        {label:'Farewell.',bye:true}];}};
    DUEL.sgt=duelPerson(sdef,sx,sz,Math.atan2(cx-sx,cz-sz));
    if(!DUEL.open)return;
    const stakeM=new THREE.MeshLambertMaterial({color:0x5a4630}),ropeM=new THREE.MeshLambertMaterial({color:0xb8a27a});const N=12,pts=[];
    for(let i=0;i<N;i++){const a=i/N*Math.PI*2;const x=cx+Math.cos(a)*DUEL_R,z=cz+Math.sin(a)*DUEL_R;const y=worldH(x,z);pts.push(new THREE.Vector3(x,y+.85,z));const s=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,1.1,5),stakeM);s.position.set(x,y+.55,z);s.castShadow=true;sc.add(s);DUEL.parts.push(s);}
    for(let i=0;i<N;i++){const a=pts[i],b=pts[(i+1)%N];const m=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,a.distanceTo(b),4),ropeM);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());sc.add(m);DUEL.parts.push(m);}
    for(let i=0;i<8;i++){const a=(i+.5)/8*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a-sa),Math.cos(a-sa)))<.35)continue;const x=cx+Math.cos(a)*(DUEL_R+1.6),z=cz+Math.sin(a)*(DUEL_R+1.6);
      const w=duelPerson({name:nm(),role:'',ico:'⚔',authored:true,people:'markman',bCol:[0x3a3a40,0x4a4038,0x2e3238][i%3],sCol:0xe8d4bc,greeting:['Iron and blood!'],topics:[{label:'Farewell.',bye:true}]},x,z,Math.atan2(cx-x,cz-z));w._duelWatch=true;DUEL.watchers.push(w);}
    DUEL.npc=duelPerson(roweDef(cx,cz+1.5),cx,cz+1.5,Math.PI);}
  function duelStart(q){if(q.data.state!=='wait'||!DUEL.npc)return;const d=q.data;const p=DUEL.npc.g.position;const x=p.x,z=p.z;duelRemoveNpc(DUEL.npc);DUEL.npc=null;
    const e=unlockFoe(buildZoneEnemy(sc,STATIC_SOL,x,z,q.enemy||'Bandit Captain',null));e._questTag=q.id;e._duel=true;e.name=e.displayName=RIVAL.name;e.homeX=d.x;e.homeZ=d.z;e.alert=true;e._duelHold=false;if(e.mesh&&!e.mesh.parent)sc.add(e.mesh);ZONES.world.enemies.push(e);DUEL.rowe=e;
    d.state='fight';DUEL.inside=Math.hypot(px-d.x,pz-d.z)<=DUEL_R;DUEL.offered=false;DUEL.bark=3;
    setTimeout(()=>{try{if(dlgOpen)closeDialog();}catch(err){}},1400);
    showMsg('The rope is up. Hesket Rowe lifts her blade.','#e8d8a0');if(typeof addLog==='function')addLog('⚔','The duel at Caer Slige: Hesket Rowe.');}
  function duelBark(line){const W=DUEL.watchers.filter(w=>w.g.visible);if(!W.length)return;sayBubble(W[Math.floor(Math.random()*W.length)],line.split('{nick}').join(duelNick()));}
  function duelYield(q){const e=DUEL.rowe;q.data.state='yielded';e._duelHold=true;e.alert=false;e.telegraphT=0;DUEL.hp0=e.hp;DUEL.spare=3;DUEL.yieldS=playClockS;if(e.mesh)e.mesh.position.y-=.45;
    try{if(dlgOpen&&dlgNPC&&dlgNPC.name===RIVAL.name)closeDialog();}catch(err){}
    showMsg('Hesket Rowe goes down on one knee and lays her blade on the ground.','#e8d8a0');roweSay("Enough. I yield. It's yours.");}
  function duelWon(q){const e=DUEL.rowe;q.data.state='won';duelLeague().rowe='alive';const x=e.x,z=e.z;duelRemoveRowe();duelRingDown();
    DUEL.npc=duelPerson(roweDef(x,z),x,z,Math.atan2(px-x,pz-z));
    const W=DUEL.watchers.slice().sort(()=>Math.random()-.5).slice(0,3);['Captain!','Captain! Captain!','Iron and blood!'].forEach((t,i)=>{if(W[i])sayBubble(W[i],t);});
    qComplete(q);showMsg('The yard acclaims you Captain.','#e8d8a0');}
  function duelMurder(q){q.data.state='murder';q.done=true;const L=duelLeague();L.rowe='dead';L.closed=true;duelRingDown();
    if(DUEL.sgt){sayBubble(DUEL.sgt,'She yielded. Every one of us saw it.');}
    DUEL.watchers.forEach(w=>{w.g.rotation.y+=Math.PI;w.def.greeting=['…'];if(w._bubble){w.g.remove(w._bubble);w._bubble=null;}});
    showMsg('Hesket Rowe is dead. The yard is silent.','#c8b880');}
  function duelLost(q,how){const d=q.data;d.state='lost';d.retryDay=dayNow()+7;d.told=false;duelLeague().rowe='captain';PHP=Math.max(PHP,1);if(typeof updateHUD==='function')updateHUD();
    duelRemoveRowe();duelRingDown();try{if(dlgOpen)closeDialog();}catch(err){}
    showMsg(how==='rope'?'You step over the rope. That is a yield. The yard acclaims Hesket Rowe Captain.':how==='yield'?'You yield. The yard acclaims Hesket Rowe Captain.':'You go down, and stay down. The yard acclaims Hesket Rowe Captain.','#c8b880');}
  function duelOffer(q){const e=DUEL.rowe;if(e){e._duelHold=true;e.telegraphT=0;}
    openDialog({name:RIVAL.name,role:'',ico:'⚔',greeting:["You're done. Say it, and it's done."],topics:[
      {label:'I yield.',quest:true,fn:()=>{setTimeout(()=>{if(q.data.state==='fight')duelLost(q,'yield');},1200);return "Heard. Up you get. You'll want that arm again.";}},
      {label:'Not yet.',quest:true,fn:()=>{setTimeout(()=>{try{if(dlgOpen)closeDialog();}catch(err){}},1200);return "Your blood, then.";}}]});}
  function tickDuel(dt){
    const q=duelQuest();if(DUEL.q&&DUEL.q!==q)duelTeardown();if(!q)return;const d=q.data;const far=Math.hypot(px-d.x,pz-d.z);
    if(DUEL.rb){DUEL.rbT-=dt;if(DUEL.rbT<=0){if(DUEL.rowe&&DUEL.rowe.mesh)DUEL.rowe.mesh.remove(DUEL.rb);DUEL.rb=null;}}
    const _seat=siteAnywhere(q.giverSite);const _occ=!!(_seat&&TS(_seat).flags.occupied!=null); // S374 — an occupied League town loses its duels (canon §12a): no ring
    if(_occ&&DUEL.q&&d.state==='wait'){duelTeardown();return;}
    if(!DUEL.q){if(far>180||_occ)return;if(d.state==='fight'||d.state==='yielded')d.state='wait'; // a fight left by a load is laid again
      if(d.state==='lost'&&dayNow()>=(d.retryDay||0))d.state='wait';if(d.state!=='wait')return;duelBuild(q);return;}
    const ended=d.state==='won'||d.state==='murder'||d.state==='lost';
    if(ended){if(far>60||(d.state==='lost'&&dayNow()>=(d.retryDay||0)))duelTeardown();return;}
    if(d.state==='wait'){if(far>240){duelTeardown();return;}if(DUEL.open!==duelRingHours()){duelTeardown();return;}return;}
    const e=DUEL.rowe;if(!e){duelTeardown();return;}
    if(d.state==='yielded'){if(!e.dead&&e.hp<DUEL.hp0&&duelCheck(e))return;if(!e.dead&&e.hp<DUEL.hp0){e.hp=0;if(typeof killZoneEnemy==='function')killZoneEnemy(e,sc,'');else duelMurder(q);return;}
      DUEL.spare-=dt;if(DUEL.spare<=0)duelWon(q);return;}
    // the fight
    const talking=(typeof dlgOpen!=='undefined')&&dlgOpen;e._duelHold=talking;if(!talking)e.alert=true;
    if(far<=DUEL_R)DUEL.inside=true;else if(DUEL.inside&&far>DUEL_R+1){duelLost(q,'rope');return;}
    if(e.hp<=e.maxHp*.25){duelYield(q);return;}
    if(!DUEL.offered&&!talking&&PHP<maxHP*.3){DUEL.offered=true;duelOffer(q);return;}
    const st=typeof isStaggered==='function'&&isStaggered(e);if(st&&!DUEL.stag){duelBark("She's open!");DUEL.bark=Math.max(DUEL.bark,3);}DUEL.stag=st;
    const ps=PPOST.stagUntil>performance.now()/1000;if(ps&&!DUEL.pstag){duelBark("Rowe's got you, {nick}.");DUEL.bark=Math.max(DUEL.bark,3);}DUEL.pstag=ps;
    DUEL.bark-=dt;if(DUEL.bark<=0){DUEL.bark=6+Math.random()*3;let line;do{line=DUEL_BARKS[Math.floor(Math.random()*DUEL_BARKS.length)];}while(line===DUEL.last);DUEL.last=line;duelBark(line);}
  }
  // the kill path asks first: before the yield no blow takes her below a quarter (she yields instead); after it, a kill is murder
  function duelKill(e){const q=DUEL.q;if(!q||DUEL.rowe!==e)return false;const s=q.data.state;
    if(s==='fight'||s==='wait'){if(s==='wait')q.data.state='fight';e.hp=Math.max(1,Math.floor(e.maxHp*.25));duelYield(q);return true;}
    if(s==='yielded'){if(duelCheck(e))return true;duelMurder(q);}return false;}
  // S408 (Michael's B on #96) — a blow begun within DUEL_CHECK s of her kneeling is held: it lands on nothing. A blow begun later is murder
  function duelCheck(e){if(!(_offenceS<(DUEL.yieldS||0)+DUEL_CHECK))return false;e.hp=DUEL.hp0;e.dead=false;
    if(e.hpFg){e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}showMsg('You check the blow.','#e8d8a0');return true;}
  // the ring holds you at 1 health: going down in it is a yield, not a death
  function duelDown(){const q=DUEL.q;if(!q||q.data.state!=='fight'||Math.hypot(px-q.data.x,pz-q.data.z)>DUEL_R+2)return false;duelLost(q,'down');return true;}
  // v80 S133 — a guild hunt's ground on the compass until the tally is met
  function guildMarkers(push){try{const G=gstate();for(const k in G){const t=G[k]&&G[k].active;if(t&&t.kind==='hunt'&&!t.done&&t.x!=null&&t.have<t.need)push(t.x,t.z,GREEN,`${t.target}s — ${t.ground||'their ground'}`);}}catch(e){}}
  function factionMarkers(push){const F=FACTIONS;for(const k in F){const st=fstate()[k];if(!st.active||st.active.done){if(st.active&&st.active.done&&F[k].seat){const s=siteAnywhere(F[k].seat);if(s)push(s.x,s.z,GREEN,F[k].name);}continue;}}}
  function factionPriceMul(site){const nk=nationKeyOf(...cellOf(site.x,site.z));const fk=factionOf(nk);const r=fstate()[fk].rank;if(nationRecord(nk))return 1;return r>=1?1-.05*r:1;} // S158 — no discount with a record
  // ═══ COACH LINES (Session T) ═════════════════════════════════════════
  // worldState.coaches[a|b] = {a,b}. A coaching road: milestones, an inn at
  // the midpoint, and a coach that leaves each end at 06:00 and 18:00, runs
  // the road at a trot, and carries you if you board it.
  const COACHES=new Map(); // key → {road,cart,horses,driver,plat,u,dir,state,wait,len,inn,posts}
  function coaches(){return worldState.coaches||(worldState.coaches={});}
  function coachTopics(site){
    if(prosperity(site)<50||favor(site)<3)return [];const C=coaches();const out=[];
    ROAD_DEFS.filter(d=>d.a===site.id||d.b===site.id).forEach(d=>{const other=siteAnywhere(d.a===site.id?d.b:d.a);if(!other||!(other.kind==='town'||other.kind==='city'||other.kind==='port'))return;if(!(site.kind==='town'||site.kind==='city'||site.kind==='port'))return;const key=routeKey(site.id,other.id);if(C[key])return;const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);if(!rd)return;const len=roadLen(rd);const cost=Math.round(600+len/2);
      out.push({label:`Raise a coaching road to ${other.name} (${cost} gold)`,quest:true,fn:()=>{if(gold<cost)return `A coaching road to ${other.name} — milestones, an inn, a coach and team — is ${cost} gold.`;gold-=cost;updateHUD();C[key]={a:site.id,b:other.id,opened:worldState.gameTimeAbsMinutes||0};addFavor(site,2);addFavor(other,2);setProsperity(site,prosperity(site)+3);setProsperity(other,prosperity(other)+3);if(typeof addLog==='function')addLog('🐎',`Raised a coaching road: ${site.name} — ${other.name}.`);return `The masons go out with the milestones tomorrow, and the first coach leaves at six. It'll change the look of that road.`;}});});
    return out;
  }
  function roadLen(rd){let L=0;for(let i=1;i<rd.pts.length;i++)L+=Math.hypot(rd.pts[i].x-rd.pts[i-1].x,rd.pts[i].z-rd.pts[i-1].z);return L;}
  function roadPoint(rd,u){const pts=rd.pts;const fi=Math.max(0,Math.min(1,u))*(pts.length-1);const i0=Math.min(pts.length-2,Math.floor(fi)),f=fi-i0;const p0=pts[i0],p1=pts[i0+1];return {x:p0.x+(p1.x-p0.x)*f,z:p0.z+(p1.z-p0.z)*f,ang:Math.atan2(p1.x-p0.x,p1.z-p0.z)};}
  // S237 — the coaching inn halfway along a coach road (Michael, issue #24: A). A roadside inn: a keeper of the country
  // it stands in, a meal and a drink, one room to let, the coach's board and a tack corner. Built with the line and kept
  // stable by the road's key, so the same inn has the same name and keeper whenever you come back.
  // S315 — the quest review's Finding 4 (run 2): the coaching inn's keeper, driver and travellers speak in the voice of
  // the keeper's people (`def.people`); Markish is the fallback, today's text unchanged.
  const COACH_INN_LINES={
    gatelander:{
      greet:["The fire's lit, and there's a chair by it with nobody's name on it.","A full bowl makes a short road. Sit, and it'll come to you.","We don't ask where you've been; a road's its own business. Boots off, though."],
      place:(n,a,b)=>`${n}, halfway between ${a} and ${b}. A house on a road is only ever half a house; the other half is whoever comes in. The coach stops, we feed them, and the horses drink.`,
      seatHas:(t,d)=>`The ${t} for ${d}. Your name's on it, and a name given is a name kept. If you're not at the door when it calls, it waits an hour, and not a breath more.`,
      seatGive:(t,d)=>`The ${t} for ${d}. It's yours, and it'll cost you nothing but being there; the driver knows to wait. An hour, mind. Patience has a bottom to it.`,
      driver:["The horses first, then me, and then whoever's left.","A quarter hour and we're off, and the road won't shorten for the waiting.","Mind the step when she's in. It's older than it looks, like the rest of us."],
      road:{trouble:"There's trouble on the road, and trouble doesn't move for a coach. We stand here till it's cleared.",clear:"Clear today, and I'd not promise you tomorrow."},
      trav:["Waiting on the coach, same as yourself. A watched road never brings it.","Sit, if you like. It'll come no faster for standing.","Would it be six yet, do you think?"]},
    markman:{
      greet:["Fire's lit. Take a seat.","Bed's upstairs. Bowl's on the way.","We don't ask where you've been. Boots off, though."],
      place:(n,a,b)=>`${n}, halfway between ${a} and ${b}. The coach stops, we feed whoever gets off, and the horses drink.`,
      seatHas:(t,d)=>`The ${t} for ${d}. Your name's on it. If you're not at the door when it calls, it waits — an hour, no more.`,
      seatGive:(t,d)=>`The ${t} for ${d}. It's yours, and it costs nothing; the driver knows to wait. An hour, no more.`,
      driver:["Horses first, then me.","Quarter of an hour and we're off.","Mind the step when she's in."],
      road:{trouble:"There's trouble on the road. We stand here till it's cleared.",clear:"Clear, today."},
      trav:["Waiting on the coach, same as you.","Sit, if you like. It won't come faster standing.","Is it six yet?"]},
    aurennais:{
      greet:["Be welcome, Master. The fire is lit, and the seats by it are free.","A bed upstairs, Master, and the kitchen is open. The terms are at the counter.","We keep no register of travellers, Master; only of accounts."],
      place:(n,a,b)=>`${n}, Master, halfway between ${a} and ${b}. The coach stops here under the road's contract. We feed its passengers and water its horses, at the posted rates.`,
      seatHas:(t,d)=>`The ${t} for ${d}, Master. Your name is entered. Should you not be at the door when it calls, it will wait one hour and no longer. That is the term.`,
      seatGive:(t,d)=>`The ${t} for ${d}, Master. The seat is entered at no charge, and the driver is instructed to wait. One hour, and no longer.`,
      driver:["The horses are seen to first, Master, and then the passengers.","We depart in a quarter of an hour, Master, on the timetable.","Mind the step when she is in, Master. The company accepts no claims for ankles."],
      road:{trouble:"The road is obstructed, Master. We are held here until it is cleared.",clear:"Clear today, Master."},
      trav:["Waiting on the coach, as are you. It is posted for six.","Do sit. Standing will not advance the timetable.","Is it six yet? The notice says six."]},
    oldblood:{
      greet:["The fire is lit. Sit.","Bed above. Bread soon.","Boots off. The rest is yours."],
      place:(n,a,b)=>`${n}. Halfway between ${a} and ${b}. The coach stops. We feed who gets off. The horses drink.`,
      seatHas:(t,d)=>`The ${t} for ${d}. Your name is on it. It waits an hour.`,
      seatGive:(t,d)=>`The ${t} for ${d}. Yours, and no charge. It waits an hour, no more.`,
      driver:["Horses first.","A quarter hour.","Mind the step."],
      road:{trouble:"Trouble on the road. We wait.",clear:"Clear."},
      trav:["Waiting.","Sit. It comes when it comes.","Six yet?"]}};
  const COACH_INNS=new Map();
  function coachInnHouse(key,rt,rd,ix,iz,L){
    if(COACH_INNS.has(key))return COACH_INNS.get(key);
    const mid=roadPoint(rd,.5),nx=Math.cos(mid.ang),nz=-Math.sin(mid.ang);
    const hk=String(key).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,11);const r=rngFor(hk%100003,hk%7919);
    const reg=REGISTER[dominantRegion(ix,iz).r.id]||'irish';const [ci,cj]=cellOf(ix,iz);const P=PEOPLES[nationOf(ci,cj).people]||PEOPLES.gatelander;
    const bank=NAMES[P.names]||NAMES[reg]||NAMES.irish;const female=r()<.5;const keeper=pick(r,female?bank.f:bank.m);
    const name=pick(r,INN_NAMES[reg]||INN_NAMES.irish);
    const A=siteAnywhere(rt.a),B=siteAnywhere(rt.b);
    const house={id:'g_coach_'+key,coachInn:key,type:'inn',doorX:ix-nx*3.4,doorZ:iz-nz*3.4,doorFace:cardinalFace(-nx,-nz),exitX:ix-nx*4.6,exitZ:iz-nz*4.6,exitYaw:Math.atan2(nx,nz),
      name,keeper,tagline:'',bCol:0x5a4030,sCol:pick(r,P.skin),w:9,d:6,two:true,reg,style:'stone',siteKind:'village',siteId:null,innX:ix,innZ:iz};
    const hm=m=>{const t=((m%1440)+1440)%1440;return `${Math.floor(t/60)}:${String(Math.round(t%60)).padStart(2,'0')}`;};
    const half=Math.round(L/2/COACH_SPEED); // game minutes from either end to the inn
    const board=`The coach for ${B?B.name:'the far end'} leaves ${A?A.name:'the near end'} at six and calls here about ${hm(6*60+half)}. The coach for ${A?A.name:'the near end'} leaves ${B?B.name:'the far end'} at six in the evening and calls here about ${hm(18*60+half)}. A quarter of an hour, then it goes on.`;
    const CL=COACH_INN_LINES[nationOf(ci,cj).people]||COACH_INN_LINES.markman;
    const def={name:keeper,role:'Innkeeper',ico:'\u{1F37A}',people:nationOf(ci,cj).people,x:0,z:0,bCol:house.bCol,sCol:house.sCol,
      greeting:CL.greet,_extra:innTopics(house)};
    Object.defineProperty(def,'topics',{configurable:true,get(){return [...def._extra,
      {label:'When does the coach come through?',response:board},seatTopic(key,A,B,half,def.people),
      {label:'What is this place?',response:CL.place(name,A?A.name:'one town',B?B.name:'the next')},
      {label:'Any news?',get response(){return pick(Math.random,RUMORS[reg]||RUMORS.irish);}},
      {label:'How’s the weather been?',get response(){return weatherLine();}},
      {label:'Farewell.',bye:true}];}});
    house.dlg=def;house._board=board;COACH_INNS.set(key,house);return house;
  }
  // S267 — a seat held (Michael, issue #31: A). The keeper takes your name for the next coach to call, either way; it costs
  // nothing and the ride stays free. That coach waits at the inn for you, up to an hour past its call, so you can eat or
  // sleep without missing it. The coach stands still while you are indoors (WORLD.tick runs only outside), so a seat is
  // also settled against the timetable when you come out: if its call has come and the hour is not up, it is at the door.
  const SEAT_HOLD=60; // game minutes past the call
  function seatNow(){const s=worldState.coachSeat;return s&&coaches()[s.key]?s:null;}
  function nextCall(key,half){const C=COACHES.get(key);const now=worldState.gameTimeAbsMinutes||0;
    if(C&&C.state==='stop')return {at:now,tod:worldState.gameTimeMinutes||0,dir:C.resumeDir||C.dir||1};
    const tod=worldState.gameTimeMinutes||0;let best=null; // counted from the clock of the day, which the timetable reads
    for(const [m,dir] of [[6*60+half,1],[18*60+half,-1]]){let dm=((m-tod)%1440+1440)%1440;if(dm===0)dm=1440;if(!best||dm<best.dm)best={dm,dir,m};}
    return best&&{at:now+best.dm,tod:best.m,dir:best.dir};}
  function seatTopic(key,A,B,half,people){const L=COACH_INN_LINES[people]||COACH_INN_LINES.markman;const hm=m=>{const t=((m%1440)+1440)%1440;return `${Math.floor(t/60)}:${String(Math.round(t%60)).padStart(2,'0')}`;};
    const dest=dir=>{const t=dir>0?B:A;return t?t.name:'the far end';};const S=seatNow();
    if(S&&S.key===key)return {label:'My seat on the coach?',response:L.seatHas(hm(S.tod),dest(S.dir))};
    return {label:'A seat on the next coach?',quest:true,fn:()=>{const c=nextCall(key,half);if(!c)return 'No coach calls here now.';
      worldState.coachSeat={key,at:c.at,tod:c.tod,dir:c.dir};if(typeof addLog==='function')addLog('🐎',`A seat held on the ${hm(c.tod)} coach for ${dest(c.dir)}.`);
      return L.seatGive(hm(c.tod),dest(c.dir));}};}
  function seatHeldFor(C,key,dir){const S=seatNow();return !!S&&S.key===key&&S.dir===dir&&!C.riding;}
  function seatCatchUp(C,key){const S=seatNow();if(!S||S.key!==key||C.riding)return;const now=worldState.gameTimeAbsMinutes||0;
    if(now>=S.at+SEAT_HOLD){if(!(C.state==='stop'&&C.holdTo)){worldState.coachSeat=null;showMsg('The coach could not wait any longer. Your seat has gone with it.','#c8b880');}return;}
    if(now<S.at)return;
    const before=(C.state==='wait'&&(S.dir>0?C.u<=.001:C.u>=.999))||(C.state==='run'&&C.dir===S.dir&&!C.stopped);
    if(before){C.u=.5;C.state='stop';C.stopT=0;C.resumeDir=S.dir;C.dir=S.dir;C.holdTo=S.at+SEAT_HOLD;}}
  // S238 — the coach's other half (Michael, issue #24: B): the driver and a traveller or two wait in the common room while
  // the inn is open. Who they are is steady for a day (the road's key and the day); they wander the floor like guild members.
  function coachInnFolk(house,sc_,W,D){
    if(!npcInsideNow(house))return;const key=house.coachInn;const rt=coaches()[key];if(!rt)return;
    const A=siteAnywhere(rt.a),B=siteAnywhere(rt.b);const C=COACHES.get(key);
    const hk=String(key).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,17);const r=rngFor((hk+innDay())%100003,innDay()%7919);
    const [ci,cj]=cellOf(house.doorX,house.doorZ);const P=PEOPLES[nationOf(ci,cj).people]||PEOPLES.gatelander;const bank=NAMES[P.names]||NAMES[house.reg]||NAMES.irish;
    const nm=()=>pick(r,r()<.5?bank.f:bank.m);const used=new Set([house.keeper]);const fresh=()=>{let n=nm();for(let k=0;k<6&&used.has(n);k++)n=nm();used.add(n);return n;};
    const L=COACH_INN_LINES[nationOf(ci,cj).people]||COACH_INN_LINES.markman;
    const road=()=>(C&&C.halted)||(A&&B&&roadBroken(A,B))?L.road.trouble:L.road.clear;
    const folk=[{name:fresh(),role:'Coach Driver',ico:'\u{1F40E}',greeting:L.driver,
      topics:[{label:'When does the coach leave?',response:house._board||'At six, either end.'},{label:'How’s the road?',get response(){return road();}},{label:'Farewell.',bye:true}]}];
    const n=1+(r()<.5?1:0);
    for(let k=0;k<n;k++){const toB=r()<.5,dest=toB?B:A;const why=pick(r,['Family.','Work, if it’s still there.','A wedding. Not mine.','I’ve a debt to collect.','The same as everyone. Something better.']);
      folk.push({name:fresh(),role:'Traveller',ico:'\u{1F9F3}',greeting:L.trav,
        topics:[{label:'Where are you headed?',response:`${dest?dest.name:'The next town'}. ${why}`},{label:'Farewell.',bye:true}]});}
    folk.forEach((def,k)=>{const g=buildNPCMesh({role:'villager',name:def.name,bCol:k?0x4a4038:0x3a2a20,sCol:pick(r,P.skin)},{nation:nationAt(house.doorX,house.doorZ),key:'coach_'+key});
      let x=W/2,z=D*.7;for(let t=0;t<40;t++){const cx=2.5+r()*(W-5),cz=Math.max(5.5,D*.5)+r()*(D*.5-2.5);if(!intSolidAt(cx,cz,.45,0)&&!INT_NPCS.some(o=>Math.hypot(o.g.position.x-cx,o.g.position.z-cz)<1.2)){x=cx;z=cz;break;}}g.position.set(x,0,z);g.rotation.y=r()*Math.PI*2;sc_.add(g);
      INT_NPCS.push({g,def,wa:0,wt:1,walk:false,box:{x0:2,x1:W-2,z0:Math.max(5,D*.5),z1:D-2}});});
  }
  // S261 — the road coach on the kit (Michael's A on Session 230, as shown): a rounded panelled body on a lower frame,
  // framed windows and a door each side with a brass handle and a crest panel, a roof with an iron rail and luggage, the
  // driver's bench, backrest and footboard, two lamps, leaf springs over the axles, four wheels of twelve spokes with iron
  // tyres (larger behind), the pole out to the horses. One vertex-coloured mesh at .9 of the prototype, so its roof is at
  // 1.92 where the rider already stands (the platform at 1.9); facing +z, the horses ahead.
  function coachGeo(){const P=[],K=.9;const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x:x*K,y:y*K,z:z*K,rx,ry,rz,sx:K,sy:K,sz:K,jitter:j==null?.04:j});
    const rod=(a,b,r0,r1,col)=>{const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=d.length();const g=SK.cyl(r1,r0,L,6);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())));add(g,col,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,0,0,0,.03);};
    const B=0x5a2a1a,D=0x2a1410,W=0x8aa0b0,I=0x2a2a2e,BR=0xc8a050,WD=0x4a3018,Y=0xb08a30;
    add(SK.rbox(1.6,1.15,2.3,.12,3),B,0,1.45,0);add(SK.rbox(1.72,.12,2.46,.04,2),D,0,2.07,0);add(SK.rbox(1.5,.26,1.9,.08,2),B,0,.86,0);
    for(const s of [1,-1]){for(const z of [-.62,.62]){add(SK.rbox(.03,.46,.5,.02,1),W,s*.8,1.62,z,0,0,0,.02);add(SK.rbox(.05,.52,.56,.02,1),D,s*.79,1.62,z);}
      add(SK.rbox(.04,.9,.62,.02,1),D,s*.81,1.38,0);add(SK.ball(.025,8,6),BR,s*.84,1.38,.22);add(SK.rbox(.02,.24,.3,.01,1),Y,s*.83,1.22,0);}
    for(const [x,z] of [[.8,1.2],[-.8,1.2],[.8,-1.2],[-.8,-1.2]])rod([x,2.13,z],[x,2.3,z],.015,.015,I);
    for(const s of [1,-1])rod([s*.8,2.3,-1.2],[s*.8,2.3,1.2],.015,.015,I);rod([.8,2.3,1.2],[-.8,2.3,1.2],.015,.015,I);rod([.8,2.3,-1.2],[-.8,2.3,-1.2],.015,.015,I);
    add(SK.rbox(.9,.35,.7,.06,2),0x6a5030,.15,2.3,-.4);add(SK.rbox(.5,.3,.5,.05,2),0x3a3a2a,-.35,2.28,.35);
    add(SK.rbox(1.4,.1,.5,.03,2),WD,0,2.0,1.45);add(SK.rbox(1.4,.4,.08,.03,2),WD,0,2.2,1.24);add(SK.rbox(1.3,.06,.5,.02,1),WD,0,1.55,1.75,.5,0,0);
    for(const s of [1,-1]){add(SK.cyl(.06,.05,.16,8),I,s*.82,1.95,1.2);add(SK.ball(.045,8,6),0xffd070,s*.82,1.96,1.2,0,0,0,0);}
    const wheel=(r,x,z)=>{const yc=r+.02;add(SK.torus(r,.035,6,28),I,x,yc,z,0,Math.PI/2,0);add(SK.torus(r-.05,.03,5,24),Y,x,yc,z,0,Math.PI/2,0);
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2;rod([x,yc,z],[x,yc+Math.cos(a)*(r-.06),z+Math.sin(a)*(r-.06)],.018,.014,Y);}
      add(SK.cyl(.08,.08,.16,10),Y,x,yc,z,0,0,Math.PI/2);add(SK.cyl(.05,.05,.2,8),I,x,yc,z,0,0,Math.PI/2);};
    wheel(.55,.95,-.95);wheel(.55,-.95,-.95);wheel(.42,.95,.95);wheel(.42,-.95,.95);
    for(const z of [.95,-.95]){rod([.95,z>0?.44:.57,z],[-.95,z>0?.44:.57,z],.03,.03,I);for(const s of [1,-1])P.push({geo:SK.ball(.1,8,6),color:new THREE.Color(I),x:s*.55*K,y:(z>0?.62:.72)*K,z:z*K,sx:1.6*K,sy:.3*K,sz:.5*K,jitter:.03});}
    rod([0,.5,1.1],[0,.75,3.1],.04,.035,WD);
    return mergeParts(P);}
  function buildCoachLine(key,rt,rd){
    const c=x=>new THREE.Color(x);const g=new THREE.Group();
    // milestones every ~100u, an inn with a lamp at the midpoint
    const L=roadLen(rd);const posts=[];for(let d=100;d<L-60;d+=100){const p=roadPoint(rd,d/L);const nx=Math.cos(p.ang),nz=-Math.sin(p.ang);const x=p.x+nx*(ROAD_HALF+1.2),z=p.z+nz*(ROAD_HALF+1.2);posts.push({geo:new THREE.BoxGeometry(.4,1.1,.3),color:c(0xd8d0c0),x,y:worldH(x,z)+.55,z,ry:p.ang});}
    const m=new THREE.Mesh(mergeParts(posts),VC_MAT);g.add(m);
    const mid=roadPoint(rd,.5);const ix=mid.x+Math.cos(mid.ang)*(ROAD_HALF+7),iz=mid.z-Math.sin(mid.ang)*(ROAD_HALF+7);const iy=worldH(ix,iz);
    addStamp({id:'inn_'+key,kind:'site',x:ix,z:iz,r:9,blend:8,y:iy});
    const innGeo=buildingGeo(9,6,STYLE.stone,Math.random,{chimney:true,twoStory:true,h:3.0,rise:1.4});const inn=new THREE.LOD();{const hi=new THREE.Mesh(innGeo,VC_MAT),lo=new THREE.Mesh(innGeo.userData.lo,VC_MAT);hi.castShadow=lo.castShadow=true;inn.addLevel(hi,0);inn.addLevel(lo,HOUSE_LOD.far);} /* S202 — the roadside inn in detail near, plain past 80 */inn.position.set(ix,iy-.06,iz);inn.rotation.y=mid.ang-Math.PI/2;/* S237/S239 — turned so its door (the mesh's +z face) looks onto the road */g.add(inn);let smokeS=null;{const ch=chimneyAt(innGeo,inn,'inn');if(ch){smokeS={site:{id:'coach_'+key,x:ix,z:iz},chimneys:[ch],group:g};try{smokeFor(smokeS);}catch(err){}}} /* S345 — the inn's smoke */STATIC_SOL.push({cx:ix,cz:iz,rx:4.7,rz:3.2,c:Math.cos(inn.rotation.y),s:Math.sin(inn.rotation.y)});
    const house=coachInnHouse(key,rt,rd,ix,iz,L);if(!ZONES.world.houses.includes(house))ZONES.world.houses.push(house); // S237 — you can go in
    const l=regLight(0xffb050,1.4,14,'coach:'+key);l.position.set(mid.x+Math.cos(mid.ang)*(ROAD_HALF+2),iy+3,mid.z-Math.sin(mid.ang)*(ROAD_HALF+2));
    // the coach
    const cart=new THREE.Mesh(coachGeo(),VC_MAT);cart.castShadow=true;sc.add(cart); // S261 — the coach on the kit
    const horse=kind=>{const hg=new THREE.Group();const rg=buildWolf(kind,1.6);hg.add(rg.root);return hg;}; // S262 — the horses on the wolf's bones and gait (tickCreatures walks them by the ground they cover)
    const h1=horse('Horse'),h2=horse(pHash(key)&1?'Grey Horse':'Horse');sc.add(h1);sc.add(h2);
    const plat={x0:0,x1:0,z0:0,z1:0,y:0,coach:key};ZONES.world.platforms.push(plat);
    sc.add(g);const C={road:rd,rt,group:g,cart,horses:[h1,h2],plat,u:0,dir:1,state:'wait',len:L,riding:false,smokeS};COACHES.set(key,C);return C;
  }
  function removeCoachLine(key){const C=COACHES.get(key);if(!C)return;{const hs=ZONES.world.houses,i=hs.findIndex(h=>h.coachInn===key);if(i>=0&&!(typeof currentHouse!=='undefined'&&currentHouse===hs[i]))hs.splice(i,1);}sc.remove(C.group);if(C.smokeS&&C.smokeS.smoke)C.smokeS.smoke.geometry.dispose();sc.remove(C.cart);C.horses.forEach(h=>sc.remove(h));const i=ZONES.world.platforms.indexOf(C.plat);if(i>=0)ZONES.world.platforms.splice(i,1);unregLights('coach:'+key);COACHES.delete(key);}
  const COACH_SPEED=13;
  const COACH_STOP=15; // S178 — a quarter of an hour (real seconds, a game minute each) at the midpoint inn, each way
  function tickCoaches(dt){
    const Cs=coaches();
    for(const key in Cs){const rt=Cs[key];const a=siteAnywhere(rt.a),b=siteAnywhere(rt.b);if(!a||!b)continue;const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);const near=Math.hypot(px-(a.x+b.x)/2,pz-(a.z+b.z)/2)<Math.hypot(a.x-b.x,a.z-b.z)/2+500;
      let C=COACHES.get(key);if(!rd||!near){if(C)removeCoachLine(key);continue;}
      if(!C)C=buildCoachLine(key,rt,rd);
      seatCatchUp(C,key); // S267 — a seat held: the coach is at the inn if its call has come
      // schedule: leaves the a-end at 06:00 and the b-end at 18:00; otherwise waits at a station
      const h=hourNow();
      if(C.state==='wait'){if(roadBroken(a,b)){C.halted=true;}else{C.halted=false;if(C.u>0.001&&C.u<0.999){C.state='run';C.dir=C.resumeDir||1;}else if(h>=6&&h<6.2&&C.u<=0.001){C.state='run';C.dir=1;}else if(h>=18&&h<18.2&&C.u>=0.999){C.state='run';C.dir=-1;}}}
      if(C.state==='run'&&roadBroken(a,b)&&C.u>.02&&C.u<.98){C.state='wait';C.halted=true;C.resumeDir=C.dir;C.dir=0;} // the coach halts where it is and goes on when the road is clear
      // S178 — the coach draws up at the coaching inn halfway, once each way, and goes on after COACH_STOP
      if(C.state==='stop'){C.stopT-=dt;const nowM=worldState.gameTimeAbsMinutes||0;
        if(C.riding&&seatNow()&&seatNow().key===key){worldState.coachSeat=null;C.holdTo=0;} // aboard: the seat is used
        if(C.stopT<=0&&seatHeldFor(C,key,C.resumeDir||C.dir)){if(!C.holdTo)C.holdTo=nowM+SEAT_HOLD-COACH_STOP;}
        if(C.stopT<=0&&!(C.holdTo&&nowM<C.holdTo&&seatHeldFor(C,key,C.resumeDir||C.dir))){if(C.holdTo&&seatHeldFor(C,key,C.resumeDir||C.dir)){worldState.coachSeat=null;showMsg('The coach could not wait any longer. Your seat has gone with it.','#c8b880');}
          C.holdTo=0;C.state='run';C.dir=C.resumeDir||C.dir;C.stopped=true;}}
      if(C.state==='run'){const u0=C.u;C.u+=C.dir*COACH_SPEED*dt/C.len;
        if(!C.stopped&&(u0-.5)*(C.u-.5)<=0&&u0!==.5){C.u=.5;C.state='stop';C.stopT=COACH_STOP;C.resumeDir=C.dir;}
        if(C.u>=1){C.u=1;C.state='wait';C.stopped=false;}if(C.u<=0){C.u=0;C.state='wait';C.stopped=false;}}
      const p=roadPoint(rd,C.u);const fwd=C.dir;const ang=p.ang+(fwd<0?Math.PI:0);const y=worldH(p.x,p.z);
      C.cart.position.set(p.x,y,p.z);C.cart.rotation.y=ang;
      C.horses.forEach((hm,k)=>{const ox=(k?-.45:.45);hm.position.set(p.x+Math.sin(ang)*3.2+Math.cos(ang)*ox,worldH(p.x,p.z),p.z+Math.cos(ang)*3.2-Math.sin(ang)*ox);hm.rotation.y=ang;});
      C.plat.x0=p.x-1.2;C.plat.x1=p.x+1.2;C.plat.z0=p.z-1.7;C.plat.z1=p.z+1.7;C.plat.y=y+1.9;
      if(C.riding){px=p.x-Math.sin(ang)*.3;pz=p.z-Math.cos(ang)*.3;jumpY=y+1.9;}
    }
  }
  function coachNear(){for(const C of COACHES.values()){const d=Math.hypot(px-C.cart.position.x,pz-C.cart.position.z);if(d<3.2)return C;}return null;}
  function coachWhen(C){return (C.u>0.001&&C.u<0.999)?'goes on when the road is clear':C.u<=0.001?'leaves at six':'leaves at six in the evening';} // S348 — the prompt and the seat say the same hour
  function coachPrompt(){const C=coachNear();if(!C)return null;if(C.riding)return "Press 'E' to step down";if(C.state==='stop')return "Press 'E' to board the coach (it goes on shortly)";if(C.state==='wait')return `Press 'E' to board the coach (${coachWhen(C)})`;return "Press 'E' to swing aboard";}
  function coachInteract(){const C=coachNear();if(!C)return false;if(C.riding){C.riding=false;const ang=C.cart.rotation.y;px=C.cart.position.x+Math.cos(ang)*2.2;pz=C.cart.position.z-Math.sin(ang)*2.2;jumpY=worldH(px,pz);showMsg('You step down.','#c8b880');if(typeof saveGame==='function')saveGame();return true;} /* S353 — #66 A: stepping off the coach autosaves */C.riding=true;showMsg(C.state==='wait'?`You take a seat. The coach ${coachWhen(C)}.`:'You swing aboard.','#c8b880');if(typeof addLog==='function')addLog('🐎','Took the coach.');return true;}
  function tickRents(){const wk=Math.floor((worldState.gameTimeAbsMinutes||0)/(1440*7));if(worldState._rentWk===wk)return;worldState._rentWk=wk;const T=worldState.towns||{};let sum=0;for(const id in T){if(T[id].flags.owned==null)continue;const t=siteAnywhere(id);if(!t)continue;sum+=Math.round(20+T[id].p*(t.kind==='city'?3:t.kind==='town'?1.6:.8));}if(sum>0){gold+=sum;updateHUD();showMsg(`Rents: ${sum} gold from your towns.`,'#e8d8a0');}}
  function stateLine(site){const st=TS(site);const f=Object.keys(st.flags);const p=st.p;const word=st.flags.besieged!=null?'under siege':st.flags.occupied!=null?'occupied':p>=80?'thriving':p>=60?'prosperous':p>=40?'getting by':p>=20?'struggling':'failing';return `${word} (${p})${f.length?' · '+f.join(', '):''}`;}

  // ═══ THE READER (Session Q) — Varek's discoveries, the fields, the Guest's chapel ═══
  // Varek reads the frame through the player. Each discovery is a real
  // property of play: deaths, the gap between sessions, the order places
  // were known. When one is due he stands at the nearest field. He never
  // says game, save, player or screen.
  const VX={due:null,npc:null,site:null,seenT:0};
  function vstate(){return worldState.varek||(worldState.varek={done:{},deaths:0,lastReal:Date.now(),gapH:0,shortRoad:null,chapel:false,masteries:0});}
  function noteDeath(){vstate().deaths++;}
  function noteSessionGap(){const v=vstate();const now=Date.now();if(v.lastReal){const h=(now-v.lastReal)/3.6e6;if(h>=6)v.gapH=Math.max(v.gapH||0,h);}v.lastReal=now;}
  let _lastRealT=0;function tickRealClock(){const now=Date.now();if(now-_lastRealT>60000){_lastRealT=now;vstate().lastReal=now;}}
  // roads walked vs places known first from the map
  let _rwT=0;function tickRoadsWalked(dt){_rwT-=dt;if(_rwT>0)return;_rwT=1;const ri=roadInfo(px,pz);if(ri&&ri.d<ROAD_HALF+2&&ri.seg&&ri.seg.road){const d=ri.seg.road.def;(worldState.roadsWalked||(worldState.roadsWalked={}))[d.a+'|'+d.b]=1;}}
  function noteFastTravel(id){const t=siteAnywhere(id);if(!t||!t.pad)return;const walked=worldState.roadsWalked||{};const rds=ROAD_DEFS.filter(x=>x.a===id||x.b===id);if(rds.length&&!rds.some(x=>walked[x.a+'|'+x.b]||walked[x.b+'|'+x.a])){const v=vstate();if(!v.shortRoad)v.shortRoad=t.name;}}
  // which discovery is due
  function varekDue(){const v=vstate();const M=worldState.masteries||0;
    if(v.chapel&&!v.done.chapel)return 'chapel';
    if(M>=1&&v.deaths>=1&&!v.done.returns)return 'returns';
    if(M>=1&&v.gapH>=6&&!v.done.breath)return 'breath';
    if(M>=2&&v.shortRoad&&!v.done.map)return 'map';
    return null;}
  // the fields: the Ashfeld at home; elsewhere the nation's bleakest site (a ruin or wasteland camp) nearest its centroid
  function fieldFor(nationKey){if(nationKey==='gatelands'){const a=SITE['ashfeld']||siteAnywhere('ashfeld');if(a)return a;}
    landmassOf(0,0);let best=null,bd=1e9;for(let m=0;m<_landmass.count;m++){if(_landmass.nation[m]!==nationKey)continue;const c=_landmass['c'+m];for(const cell of CELLS.values()){if(cell.type==='sea'||nationKeyOf(cell.i,cell.j)!==nationKey)continue;cell.sites.forEach(t=>{if(t.kind!=='ruin'&&t.kind!=='camp')return;const d=Math.hypot(cell.i-c.i,cell.j-c.j);if(d<bd){bd=d;best=t;}});}}return best;}
  const VAREK_LINES={
    returns:[`Áine's brother died in the Mouth fifty years ago and stayed dead. You didn't. I watched. You were on the floor of it, and then you were here, at the door, with your boots dry. I want to know where you go.`,`Don't answer. I've had two hundred and fifty years of answers. Just — stand there a moment, where I can see you.`],
    breath:[`Nine days passed for me between your last word and this one. For you it was an evening. I could tell by your boots — they hadn't dried. The stones felt it too. A skip, like a clock with a tooth missing.`,`Where do you go when you're not here? Not the sea. I'd know the salt.`],
    map:[`You walked to ${'%SHORT%'} by the shortest road on your first day. Nobody has seen that road from above. Nobody has stood high enough.`,`I've drawn this country for two centuries and I still take the long way to Portclare. You didn't take the long way anywhere.`],
    chapel:[`…`,`You went below the church at ${'%CHAPEL%'}. I know because the stones went quiet for four breaths, all of them, everywhere. I didn't think it had a face. I still don't. But it looked at something.`],
  };
  function varekDef(site,kind){
    const lines=VAREK_LINES[kind].map(l=>l.replace('%SHORT%',vstate().shortRoad||'Portclare').replace('%CHAPEL%',worldState.chapelAt||'the cathedral'));
    const def={name:'Varek',role:'',ico:'✒',authored:true,people:'oldblood',sCol:0xd0c8c4,hairCol:0x0e0c0c,bodyScale:[.92,.96,.92],bCol:0x2a2a30,x:site.x+4,z:site.z-3,greeting:[kind==='chapel'?'':lines[0]],
      topics:kind==='chapel'?[{label:'…',response:lines[1]},{label:"You're watching my hands.",response:"Yes."},{label:'Farewell.',bye:true}]:[{label:'Where do you think I go?',response:lines[1]},{label:'What are you?',response:kind==='returns'?"Old. Tired in a way I don't have a word for yet. I'm working on the word.":kind==='breath'?"A man who keeps a list. Your name's on a page by itself now.":"The only one who kept looking. That's all it ever was."},{label:'Farewell.',bye:true}]};
    def.temper='weary';return def;
  }
  function tickVarek(dt){
    tickRoadsWalked(dt);
    if(activeZoneId!=='world')return;
    if(worldState.story&&(worldState.story.step==='ashfeld'||worldState.story.step==='root'))return;
    const kind=varekDue();
    if(!kind){if(VX.npc&&Math.hypot(px-VX.npc.g.position.x,pz-VX.npc.g.position.z)>90){removeVarek();}return;}
    if(VX.npc)return;
    const nk=nationKeyOf(...cellOf(px,pz));const f=fieldFor(nk);if(!f)return;
    if(Math.hypot(px-f.x,pz-f.z)>420)return; // he stands at the field; you have to walk to it
    const def=varekDef(f,kind);const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(def.x,worldH(def.x,def.z),def.z);VX.npc=n;VX.kind=kind;VX.site=f;
    if(!vstate().hinted||vstate().hinted!==kind){vstate().hinted=kind;showMsg('Someone is standing at the field, looking out.','#a0a8c0');}
  }
  function removeVarek(){if(!VX.npc)return;const n=VX.npc;sc.remove(n.g);sc.remove(n.dot);const k=npcs.indexOf(n);if(k>=0)npcs.splice(k,1);VX.npc=null;}
  function varekTalked(){if(VX.npc&&VX.kind){vstate().done[VX.kind]=1;if(typeof addLog==='function')addLog('✒',`Varek, at ${VX.site.name}: ${VX.kind==='returns'?'he watched you die and come back':VX.kind==='breath'?'he felt the world stop while you were gone':VX.kind==='map'?'he knows you took the shortest road':'he knows you went below the church'}.`);}}
  // ── the Guest's chapel: under the cathedral of Aurenne's capital ──
  // S152 — solved once over the whole grid, in grid order: it used to walk only the cells generated so far,
  // so the capital was nowhere until you'd been near Aurenne, and then whichever city's cell loaded first
  let _guestCap;
  function guestChapelHouse(){if(_guestCap!==undefined)return _guestCap;_guestCap=null;
    for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){if(!isLandCell(i,j)||nationKeyOf(i,j)!=='aurenne')continue;const city=getCell(i,j).sites.find(t=>t.kind==='city');if(city){_guestCap=city;return city;}}
    return null;}
  function isGuestCathedral(house){if(house.type!=='church')return false;const cap=guestChapelHouse();return !!cap&&house.siteId===cap.id;}
  function guestPrompt(){if(!currentHouse||currentHouse.type!=='chapel')return null;if(Math.hypot(px-currentHouse.intW/2,pz-2.2)<1.8)return "Press 'E' to pray";return null;}
  function guestInteract(){if(!guestPrompt())return false;
    try{const ov=document.createElement('div');if(ov.style)ov.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;background:#000;z-index:0;pointer-events:none';
    const cv=(typeof REN!=='undefined'&&REN.domElement)||document.querySelector('canvas');if(cv&&cv.parentElement&&cv.insertAdjacentElement)cv.insertAdjacentElement('afterend',ov);else if(document.body&&document.body.appendChild)document.body.appendChild(ov);
    setTimeout(()=>{if(ov.remove)ov.remove();if(typeof addLog==='function')addLog('👁','It saw you.');},4000);}catch(e){}
    vstate().chapel=true;worldState.chapelAt=guestChapelHouse()?guestChapelHouse().name:'the cathedral';return true;}

  // ═══ THE ACTS (Session U) — Act II: The Widening Dark · Act III: What Was Bound ═══
  // ═══ TUTORIAL LINES (Session 125) ═══════════════════════════════════
  // Two optional lines that teach systems already in the world, and read
  // back into Act II. Neither gates anything.
  //  town — "A Town Worth Keeping", from any lord: a job → the road → a
  //         trade route → paying for a build → report when it stands.
  //  sea  — "Salt Water", from Corwin at a harbour: a ferry → a hull (his
  //         note takes a quarter off) → a crossing to another island at
  //         your own wheel → boarding black sails and clearing the deck.
  // worldState.tut = {town:{site,step,build}, sea:{step,note,from,target}, ferries}
  function TUT(){return worldState.tut||(worldState.tut={town:null,sea:null,ferries:0});}
  function tutQuest(id){return QJ().find(q=>q.id===id);}
  function tutLog(msg){if(typeof addLog==='function')addLog('🧭',msg);}
  function tutSet(id,title,giver,desc,objective,reward,done){let q=tutQuest(id);
    if(!q){q={id,giver,title,desc,objective,kind:'tut',data:{},reward:reward||0,tut:true,done:!!done};QJ().push(q);if(typeof addLog==='function')addLog('📜',`${title} — ${giver}`);showMsg(`New quest: ${title}`,'#e8d8a0');}
    else{q.desc=desc;q.objective=objective;q.done=!!done;if(reward!=null)q.reward=reward;}
    return q;}
  function tutFinish(id,gold_){const q=tutQuest(id);if(q){q.done=true;q.turnedIn=true;}const paid=questGold(gold_);gold+=paid;xp+=Math.round(gold_*.9);(worldState.stats||(worldState.stats={})).goldIn=((worldState.stats||{}).goldIn||0)+paid;if(typeof chkLvl==='function')chkLvl();updateHUD();}
  function lordName(site){const l=lordFor(site);return `${l.title} ${l.name}`;}
  // ── the town line ──
  function tutTownSite(){const T=TUT().town;return T?siteAnywhere(T.site):null;}
  function tutTownIs(site){const T=TUT().town;return !!T&&!!site&&T.site===site.id&&T.step!=='done';}
  function tutTownStage(site){
    const T=TUT().town,L=lordFor(site),lord=lordName(site),nm=site.name;
    const S=story();
    const stages={
      work:{desc:`${L.name}: "A sword's a start. A town is kept by people who do the small work, and the small work comes first. Take a job from me, finish it, and come back for the next."`,obj:`Finish a job for ${lord} at ${nm} (ask for work)`},
      road:{desc:`${L.name}: "Carts won't take a road with a camp on it, and a town without carts is a town that empties. Clear it. The road stays clean while it's watched — and a clean road raises every town on it."`,obj:`Clear the road out of ${nm}, then tell ${lord} it's done`},
      route:{desc:`${L.name}: "Now the road's clean, put something on it. Ask me to open a trade route — a caravan out in the morning, back at night. Both towns grow by it while it runs. A camp near the road breaks it; you'd have to clear that and reopen."`,obj:`Open a trade route from ${nm} (ask ${lord})`},
      invest:{desc:`${L.name}: "You've done work, cleared a road, sent a cart. That's a friend of the town. Friends pay for things. Ask what the town needs — a well is cheapest — and the masons start the next day. Pay for three and the town will talk to you about a deed."`,obj:`Pay for a build at ${nm} (ask ${lord})`},
      building:{desc:`${L.name}: "Three days. Walk the country; it'll be standing when you're back."`,obj:`Wait for the ${T&&T.build||'build'} at ${nm} to be finished`},
      report:{desc:`The ${T&&T.build||'build'} at ${nm} is finished.`,obj:`Tell ${lord}`,done:true}
    };
    return stages[T.step]||stages.work;
  }
  function tutTownSync(site){const T=TUT().town;if(!T||T.step==='done')return;const s=tutTownStage(site);tutSet('tut_town','A Town Worth Keeping',lordName(site),s.desc,s.obj,null,!!s.done);}
  function tutTownAdvance(site,step,msg){const T=TUT().town;T.step=step;tutTownSync(site);if(msg){showMsg(msg,'#e8d8a0');tutLog(msg);}}
  function tutTownTopics(site){
    const T=TUT().town;const out=[];if(!site||site.kind==='portal')return out;
    if(!T){
      out.push({label:`What does ${site.name} need, beyond a sword?`,quest:true,fn:()=>{
        TUT().town={site:site.id,step:'work',build:null};
        // a job already in hand from this lord counts
        tutTownSync(site);
        const has=qActive().find(q=>q.giverSite===site.id);
        return `A town's not kept by swords. It's kept by roads, carts, and people who pay for wells. ${has?`Finish the job you've got from me — "${has.title}" — and`:'Ask me for work, do it, and'} come back. I'll show you the rest one piece at a time.`;}});
      return out;
    }
    if(T.site!==site.id||T.step==='done')return out;
    if(T.step==='report')out.push({label:`The ${T.build||'build'} is finished.`,quest:true,fn:()=>{
      const reward=questGold(150+level*20);T.step='done';setProsperity(site,prosperity(site)+3);addFavor(site,1);tutFinish('tut_town',150+level*20);
      tutLog(`A Town Worth Keeping: ${site.name} (${reward} gold).`);
      const S=story();
      const coda=S.act>=2
        ?`Word is the Crown's survey teams have been in the gates, and not to clear them. The man asking questions about it is at the harbours — Corwin. A town's only as safe as the stones under it.`
        :`People who can clear a road and read a ledger get noticed in Ironhaven. When the Crown's commission comes — and it comes to people like you — the sea opens, and you'll know what a town is worth when you see one burning.`;
      return `I saw it. ${reward} gold, from the ${site.kind}'s purse, and your name where the masons can cut it. From here it's yours to push: more builds and the deed, a coaching road once we're big enough, the Crown's service if you want a title. ${coda}`;}});
    else out.push({label:'What next, for the town?',get response(){return tutTownStage(site).desc.replace(/^[^:]+: "/,'').replace(/"$/,'');}});
    return out;
  }
  // called from the lord's "It's done." after a town quest turns in — returns words to add
  function tutOnTurnIn(q,site){
    const T=TUT().town;if(!T||T.site!==site.id)return '';
    if(T.step==='work'&&q.kind==='road'){ // the job was the road: that lesson's learned
      tutTownAdvance(site,'route',null);
      return ` That was the first piece, and the second with it — the road's clean. Now put a cart on it: ask me to open a trade route. A caravan both ways, and both towns grow while it runs.`;
    }
    if(T.step==='work'){
      const rq=townQuestFor(site,'road');rq.tut='town';if(!qFind(rq.id))qAdd(rq);
      tutTownAdvance(site,'road',null);
      return ` That's the first piece. The second: ${rq.desc.replace(/^[^:]+: /,'')} (${rq.reward} gold.)`;
    }
    if(T.step==='road'&&q.tut==='town'){
      tutTownAdvance(site,'route',null);
      return ` The road's clean. Now put a cart on it — ask me to open a trade route. A caravan both ways, and both towns grow while it runs.`;
    }
    return '';
  }
  function tickTutTown(){
    const T=TUT().town;if(!T||T.step==='done')return;const site=tutTownSite();if(!site)return;
    if(T.step==='road'){ // a road already cleared by other means counts
      const R=worldState.roadsCleared||{};if(Object.keys(R).some(k=>k.split('|').includes(site.id))&&!qActive().some(q=>q.tut==='town'))tutTownAdvance(site,'route',`${site.name}'s road is clean. ${lordName(site)} will want a cart on it.`);}
    if(T.step==='route'){const R=routes();if(Object.values(R).some(rt=>!rt.broken&&(rt.a===site.id||rt.b===site.id)))tutTownAdvance(site,'invest',`A cart on ${site.name}'s road. ${lordName(site)} counts you a friend now — ask what the town needs.`);}
    if(T.step==='invest'){const st=TS(site);const b=st.builds[st.builds.length-1];if(b){T.build=b.name;tutTownAdvance(site,b.done?'report':'building',`The masons are at ${site.name}. Three days.`);}}
    if(T.step==='building'){const st=TS(site);if(st.builds.some(b=>b.done)){const b=st.builds.find(b=>b.done);T.build=b.name;tutTownAdvance(site,'report',`The ${b.name} at ${site.name} ${b.key==='walls'?'are':'is'} standing. ${lordName(site)} will want to see you.`);}}
  }
  // gates the lord waives for the line's own town at the step that teaches them
  function tutWaivesRoute(site){const T=TUT().town;return !!T&&T.site===site.id&&T.step==='route';}
  function tutWaivesInvest(site){const T=TUT().town;return !!T&&T.site===site.id&&T.step==='invest';}

  // ── the sea line ──
  function tutSeaOpen(){const S=story();const T=TUT();if(T.sea&&T.sea.step==='done')return false;
    if(S.act>=2)return true;
    // v80 S133 — only once the merchant's own quest is done: before that Corwin belongs to Ashenmoor, and the journal points there
    try{if(typeof qState==='function'&&(qState('q3_the_merchant_knows')==='complete'||qState('q4_crypt_of_embers')!=='locked'))return true;}catch(e){}
    return false;}
  function tutSeaStage(){
    const E=TUT().sea;const tgt=E&&E.target?siteAnywhere(E.target):null;const shipName=(worldState.ship&&worldState.ship.name)||'your ship';
    return ({
      ferry:{desc:`Corwin: "Before you own a boat, ride in one. Ask the harbourmaster for passage — any port, anywhere. You'll see what the sea costs in hours and coin."`,obj:'Take a ferry from any harbour (ask the harbourmaster)'},
      ship:{desc:`Corwin: "Now buy a hull. Any shipwright. Show them my note — a quarter off; they owe me for a winter's timber. E beside her to board, E at the wheel. W and S for the sails, A and D to steer."`,obj:`Buy a ship from a shipwright (Corwin's note: a quarter off)`},
      crossing:{desc:`Corwin: "A ferry takes you. A ship, you take. Sail the ${shipName} yourself to a harbour on another island${tgt?` — ${tgt.name} is nearest`:''}. Keep off the rocks; they don't move for anyone."`,obj:`Sail the ${shipName} to a harbour on another island${tgt?` (${tgt.name})`:''}`},
      board:{desc:`Corwin: "Out on the water you'll meet black sails. They shoot first. Don't run — come alongside, E to board, and clear her deck. The captain's chest is yours after."`,obj:'Board a pirate ship and clear her deck'},
      report:{desc:`Corwin: "Come and tell me. I'm at whatever harbour you're at — it's a talent."`,obj:'Tell Corwin at any harbour',done:true}
    })[E?E.step:'ferry'];
  }
  function tutSeaSync(){const E=TUT().sea;if(!E||E.step==='done')return;const s=tutSeaStage();tutSet('tut_sea','Salt Water','Corwin',s.desc,s.obj,null,!!s.done);}
  function tutSeaAdvance(step,msg){TUT().sea.step=step;tutSeaSync();if(msg){showMsg(msg,'#e8d8a0');tutLog(msg);}}
  function foreignPortFrom(x,z){const nk=nationKeyOf(...cellOf(x,z));let best=null,bd=1e9;for(const p of allPorts()){if(nationKeyOf(...cellOf(p.x,p.z))===nk)continue;const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;best=p;}}return best;}
  function shipPriceNow(){const E=TUT().sea;return Math.round(SHIP_PRICE*(E&&E.note&&!worldState.ship?.75:1));}
  function tutCorwinTopics(){
    const E=TUT().sea;const out=[];if(!tutSeaOpen())return out;
    if(!E){out.push({label:'Teach me the sea.',quest:true,fn:()=>{TUT().sea={step:'ferry',note:false,from:null,target:null};tutSeaSync();tickTutSea();
      return story().act>=2?"Good — you'll need it before the Mark. Ferry first, then a hull, then your own crossing, then black sails. I'll be at whatever harbour you're at.":"Ferry first, then a hull, then your own crossing, then black sails. In that order, or you'll drown in the wrong one. I'll be at whatever harbour you're at.";}});return out;}
    if(E.step==='report')out.push({label:"I've taken a pirate's deck.",quest:true,fn:()=>{
      const reward=questGold(200+level*20);E.step='done';tutFinish('tut_sea',200+level*20);tutLog(`Salt Water: Corwin (${reward} gold).`);
      return story().act>=2?`Then the strait's yours as much as anyone's. ${reward} gold — the reeve paid a bounty on that crew and I took the liberty. Go and count the gates; you won't need the ferries.`:`Then you're a sailor, which is to say poorer and harder to kill. ${reward} gold — the reeve's bounty on that crew. When Aldwyn's commission comes through, the other islands stop being a rumour. You'll have a deck under you when they do.`;}});
    else if(E.step!=='done')out.push({label:'About the sea…',get response(){return tutSeaStage().desc.replace(/^Corwin: "/,'').replace(/"$/,'');}});
    return out;
  }
  function tickTutSea(){
    const E=TUT().sea;if(!E||E.step==='done')return;
    if(E.step==='ferry'&&(TUT().ferries>0||worldState.ship)){E.note=true;tutSeaAdvance('ship',"Corwin's note is in your pocket — any shipwright takes a quarter off a hull.");}
    if(E.step==='ship'&&worldState.ship){const f=foreignPortFrom(worldState.ship.x,worldState.ship.z);E.from=nationKeyOf(...cellOf(worldState.ship.x,worldState.ship.z));E.target=f?f.id:null;tutSeaAdvance('crossing',`A hull of your own. Now another island${f?` — ${f.name} is nearest`:''}.`);}
    if(E.step==='crossing'&&SHIP.mesh&&(SHIP.sailing||onDeck())){for(const p of allPorts()){if(nationKeyOf(...cellOf(p.x,p.z))===E.from)continue;if(Math.hypot(SHIP.x-p.x,SHIP.z-p.z)<200){tutSeaAdvance('board',`${p.name}, at your own wheel. Watch for black sails on the way back.`);break;}}}
    if(E.step==='board'&&OTHER.some(o=>o.kind==='pirate'&&o.boarded&&o.crew.length&&o.crew.every(e=>e.dead)))tutSeaAdvance('report','Her deck is yours. Corwin will want to hear it.');
  }
  function tutWantsPirate(){const E=TUT().sea;return !!E&&E.step==='board';}

  // ── ticks, markers, leads ──
  let _tutT=0;
  function tickTut(){_tutT--;if(_tutT>0)return;_tutT=30;try{tickTutTown();tickTutSea();}catch(e){console.warn('tut',e);}}
  function tutMarkers(push){
    const T=TUT().town;if(T&&T.step!=='done'){const s=tutTownSite();if(s&&(T.step==='route'||T.step==='invest'||T.step==='report'||(T.step==='work'&&!qActive().some(q=>q.giverSite===s.id))))push(s.x,s.z,GREEN,lordName(s));}
    const E=TUT().sea;if(E&&E.step!=='done'){
      if(E.step==='crossing'&&E.target){const t=siteAnywhere(E.target);if(t)push(t.x,t.z,GREEN,t.name);}
      if(E.step==='ferry'||E.step==='ship'||E.step==='report'){let best=null,bd=1e9;for(const p of allPorts()){const d=Math.hypot(px-p.x,pz-p.z);if(d<bd){bd=d;best=p;}}if(best&&!(E.step==='report'&&CORWIN.npc))push(best.x,best.z,GREEN,E.step==='report'?'Corwin — '+best.name:E.step==='ferry'?'harbourmaster — '+best.name:'shipwright — '+best.name);else if(CORWIN.npc&&E.step==='report')push(CORWIN.npc.g.position.x,CORWIN.npc.g.position.z,GREEN,'Corwin');}
    }
  }
  function tutLeads(){const out=[];const T=TUT();
    if(!T.town)out.push({title:'A Town Worth Keeping',text:"Any lord or elder has more than odd jobs, if you ask what the town needs. Roads, carts, and wells — how a town grows."});
    if(!T.sea&&tutSeaOpen())out.push({title:'Salt Water',text:"Corwin has taken to the harbours. Ask him to teach you the sea — ferries, a ship of your own, black sails."});
    return out;}

  // worldState.story = {act, step, proof:{gatelands,mark,aurenne}, choice, ending}
  // Steps: 'corwin' → 'proof' (three etched gates, one per island) → 'courier' (Oswy's log) → 'ashfeld' (the choice) → 'root' → 'end'
  function story(){return worldState.story||(worldState.story={act:1,step:null,proof:{},choice:null,ending:null,gates:{}});}
  function storyBegun(){return !!worldState.commissioned||(story().act>=2);}
  function etchedGateFor(nationKey){const S=story();if(S.gates[nationKey])return S.gates[nationKey];
    let best=null,bd=1e9;const seat=nationKey==='gatelands'?siteAnywhere('ironhaven'):nationKey==='mark'?anchoredPlaces().caer_slige:anchoredPlaces().compact_seat;if(!seat)return null;
    for(const e of sigilDoors()){const [i,j]=cellOf(e.x,e.z);if(nationKeyOf(i,j)!==nationKey)continue;const p=dungeonWorldPos[e.seed]||{x:e.x,z:e.z};const d=Math.hypot(p.x-seat.x,p.z-seat.z);if(d>120&&d<bd){bd=d;best=e;}}
    if(best){S.gates[nationKey]={seed:best.seed,name:best.canonicalName||(typeof dungeonName==='function'?dungeonName(best.seed,best.theme):'an old gate'),x:(dungeonWorldPos[best.seed]||best).x,z:(dungeonWorldPos[best.seed]||best).z};best.etched=true;}
    return S.gates[nationKey];
  }
  function storyQuest(id,title,giver,desc,objective,data){if(qFind(id))return qFind(id);return qAdd({id,giver,giverSite:null,title,desc,objective,kind:'story',data:data||{},reward:0,story:true});}
  function beginActII(){const S=story();if(S.act>=2)return;S.act=2;S.step='corwin';showMsg('Act II — The Widening Dark','#e8d8a0');if(typeof addLog==='function')addLog('📖','Act II — The Widening Dark. Corwin has gone ahead to the coast; find him at a harbour.');
    storyQuest('act2_corwin','The Widening Dark','Corwin',"Aldwyn's commission opens the sea. Corwin went ahead to the coast to see whether the etching stops at the water. It doesn't. Find him at a harbour.",'Find Corwin at any harbour');}
  // Corwin: the travelling face — at whichever port you land at when the story needs him
  const CORWIN={npc:null,site:null};
  function corwinLines(step,S){const g=etchedGateFor('gatelands'),m=etchedGateFor('mark'),a=etchedGateFor('aurenne');
    const sailed=TUT().sea&&TUT().sea.step==='done';
    if(step==='corwin')return {greet:sailed?"You came — and on your own deck, by the look of the salt on you. Good. I've been at three quays and they all say the same thing with different accents.":"You came. Good. I've been at three quays and they all say the same thing with different accents.",topics:[{label:'What did you find?',response:`Etching. The same hand, over the sigils — not clearing them, *writing over them*. It's on the home island — ${g?g.name:'an old gate'} — and the harbourmasters say the same of the Mark and Aurenne. I need someone to see all three. Not me: they know my face at the Compact.`},{label:"I'll go.",quest:true,fn:()=>{S.step='proof';const q=qFind('act2_corwin');if(q)qComplete(q);storyQuest('act2_proof','Proof from Three Islands','Corwin',`Three etched sigils, one on each island: ${g?g.name:'the home gate'} in the Gatelands, ${m?m.name:'a gate'} near Caer Slige in the Mark, ${a?a.name:'a gate'} near Fortargent in Aurenne. Stand in each. Then you'll understand the scale, and so will I.`,'Enter the three etched gates',{});return `${g?g.name:'The gate'} first; it's nearest. ${sailed?`Then the ${(worldState.ship&&worldState.ship.name)||'ship'} — you don't need the ferries.`:worldState.ship?'Then the ferries, or your own hull.':'Then the ferries. Or buy a hull and let me teach you the water on the way.'} Ask for me at whatever harbour you land at — I'll be the one arguing with the reeve.`;}}]};
    if(step==='proof')return {greet:"Still counting. Which have you seen?",topics:[{label:'Where am I with it?',get response(){const p=S.proof;return `${p.gatelands?'The Gatelands, yes.':'Not the Gatelands yet.'} ${p.mark?'The Mark, yes.':'Not the Mark.'} ${p.aurenne?'Aurenne, yes.':'Not Aurenne.'}`;}}]};
    if(step==='courier')return {greet:"Three. Then it's not a man with a chisel. Someone is *moving* what they take.",topics:[{label:'Moving it where?',response:`By sea. Every harbourmaster on the strait knows a black-sailed captain who pays in silver and asks no tithe — Oswy Blackhand, out of Port Blackhand in the Mark.${TUT().sea&&TUT().sea.step==='done'?" You've taken a black-sailed deck before; this one's the same, with a better captain.":''} He keeps a log. Captains like him always do; it's the only thing they're afraid of losing.`},{label:'And then?',response:"Then bring me the log, and we take it to whichever of them you trust — Caldric, Aldwyn, the Prior. I have opinions. Bring me the log first."}]};
    if(step==='ashfeld')return {greet:"You read it. So did I, over your shoulder — forgive me. 'The one who reads over my shoulder.' He wasn't writing to Varek.",topics:[{label:'Then who?',response:"I don't know. I know where he is. The Ashfeld. He always goes back to the Ashfeld. Whatever you decide there, decide it with your eyes open."}]};
    return {greet:"Go on. I'll be at the harbour.",topics:[]};}
  function tickCorwin(){const S=story();if(corwinInAshenmoor(S))return;const seaKey=(TUT().sea?TUT().sea.step:'none')+(tutSeaOpen()?'':'x');const early=S.act<2&&tutSeaOpen();if(!early&&(S.act<2||S.step==='root'||S.step==='end')){if(CORWIN.npc)removeCorwin();return;}
    // the nearest port within reach
    let best=null,bd=1e9;for(const t of SITES){if(t.kind!=='port')continue;const d=Math.hypot(px-t.x,pz-t.z);if(d<bd){bd=d;best=t;}}
    if(!best||bd>140){if(CORWIN.npc&&Math.hypot(px-CORWIN.npc.g.position.x,pz-CORWIN.npc.g.position.z)>220)removeCorwin();return;}
    const ckey=(early?'early':S.step)+'|'+seaKey;if(CORWIN.npc){if(CORWIN.step!==ckey){removeCorwin();}else return;}
    const q={x:best.x+3,z:best.z+3};const L=early?corwinEarly():corwinLines(S.step,S); // v80 S133 — on the plaza, not under the quay
    const def={name:'Corwin',role:'',ico:'📜',authored:true,people:'gatelander',sCol:0xe0b898,hairCol:0x3a2a1a,bodyScale:[1,1,1],bCol:0x3a4a5a,x:q.x-6,z:q.z+3,greeting:[L.greet],topics:[...L.topics,...tutCorwinTopics(),{label:'Farewell.',bye:true}]};def.temper='weary';
    const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(def.x,worldH(def.x,def.z),def.z);CORWIN.npc=n;CORWIN.site=best;CORWIN.step=ckey;}
  // S240 — while the merchant's own quest is his to give (Q3: available, active, or its reward owed) Corwin is in Ashenmoor,
  // where the journal sends you. Only the legacy village ever placed him there, so in the open world Q3 could not be taken.
  function corwinInAshenmoor(S){let due=false;try{due=S.act<2&&!tutSeaOpen()&&QUEST_DEFS.some(q=>q.giver==='Corwin'&&['available','active','reward'].includes(qState(q.id)));}catch(e){}
    if(!due){if(CORWIN.npc&&CORWIN.step==='ashenmoor')removeCorwin();return false;}const A=siteAnywhere('ashenmoor');if(!A)return false;
    if(Math.hypot(px-A.x,pz-A.z)>(A.pad||40)+180){if(CORWIN.npc)removeCorwin();return true;}
    if(CORWIN.npc&&CORWIN.step==='ashenmoor')return true;if(CORWIN.npc)removeCorwin();
    const src=(typeof NPC_DEF!=='undefined'&&NPC_DEF.find(n=>n.name==='Corwin'))||{name:'Corwin',role:'Traveling Merchant',ico:'\u{1F9F3}',greeting:['Just passing through.'],topics:[{label:'Safe travels.',bye:true}]};
    let x=A.x+6,z=A.z+4;for(let k=0;k<16;k++){const a=k*.785,r=5+Math.floor(k/8)*3,cx=A.x+Math.cos(a)*r,cz=A.z+Math.sin(a)*r;if(!solidAt(cx,cz)){x=cx;z=cz;break;}}
    const def=Object.assign({},src,{authored:true,people:'gatelander',x,z});def.temper='weary';
    const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(x,worldH(x,z),z);CORWIN.npc=n;CORWIN.site=A;CORWIN.step='ashenmoor';return true;}
  // before the commission: Corwin trading at the quays, with the sea to teach
  function corwinEarly(){const E=TUT().sea;const step=E?E.step:null;
    const greet=!E?"You again. Told you we'd cross paths. I've taken to the quays — there's more to buy on a harbour than in a village, and more to hear.":step==='done'?"The sailor. Go on — the tide won't wait and neither will I.":step==='report'?"You've the look of someone who's been shot at from a deck. Tell me.":"Still learning the water? Good. Nobody stops.";
    return {greet,topics:[{label:'What do you trade in, out here?',response:"Timber, rope, rumour. The rumour pays best. The harbourmasters say the marks in the old gates run on past the water — on the Mark, on Aurenne. I'd like to see that for myself, one day, with someone who can sail."}]};}
  function removeCorwin(){const n=CORWIN.npc;if(!n)return;sc.remove(n.g);sc.remove(n.dot);const k=npcs.indexOf(n);if(k>=0)npcs.splice(k,1);CORWIN.npc=null;}
  // entering an etched gate counts as proof
  function onEnterPortal(portal){const S=story();if(S.step!=='proof'||!portal)return;for(const nk of ['gatelands','mark','aurenne']){const g=S.gates[nk];if(g&&g.seed===portal.seed&&!S.proof[nk]){S.proof[nk]=true;showMsg(`${g.name}: the sigil is etched over. ${nk==='gatelands'?'One.':nk==='mark'?'Two.':'Three.'}`,'#e8d8a0');if(typeof addLog==='function')addLog('📖',`Proof: ${g.name} (${NATIONS[nk].name}).`);}}
    if(S.proof.gatelands&&S.proof.mark&&S.proof.aurenne){S.step='courier';const q=qFind('act2_proof');if(q)qComplete(q);storyQuest('act2_courier','The Courier','Corwin',"Three islands, one hand. Someone is carrying what the etching takes. Corwin will know who. Find him at a harbour.",'Find Corwin, then Oswy Blackhand at Port Blackhand',{});}}
  // Oswy Blackhand: a named pirate off Port Blackhand while the courier step is live; his log is in the captain's chest
  const OSWY={ship:null};
  function tickOswy(){const S=story();if(S.step!=='courier'){return;}const pb=anchoredPlaces().blackhand;if(!pb)return;if(Math.hypot(px-pb.x,pz-pb.z)>700)return;
    if(!OSWY.ship||!OTHER.includes(OSWY.ship)){const sd=pb.shore||[1,0];let x=pb.x+sd[0]*220,z=pb.z+sd[1]*220;for(let k=0;k<10&&worldH(x,z)>-4;k++){x+=sd[0]*40;z+=sd[1]*40;}const o=spawnOtherShip('pirate',x,z);o.name="Oswy Blackhand's ship, the Kestrel";o.oswy=true;o.speed=0;o.wp={x,z};OSWY.ship=o;o.crew.forEach((e,i)=>{if(i===0){e.name='Oswy Blackhand';e.hp=e.maxHp=Math.round(e.maxHp*2);}});
      showMsg('Black sails, at anchor off Port Blackhand. She isn\u2019t going anywhere.','#ffb060');}
    const o=OSWY.ship;if(o.boarded&&o.chest&&!o.chest._log){o.chest._log=true;o.chest.items.unshift({name:"Oswy's Log",ico:'📕',type:'misc',weight:.4,sellMult:0,buyPrice:0,qty:1,story:'log'});}
    if(typeof BAG!=='undefined'&&BAG.some(it=>it.story==='log')&&S.step==='courier'){S.step='ashfeld';const q=qFind('act2_courier');if(q)qComplete(q);storyQuest('act2_ashfeld','The Ashfeld','Corwin',"The log is written to 'the one who reads over my shoulder.' Corwin will want to see it; then there is only one person left to ask, and he is always at the Ashfeld.",'Talk to Corwin, then go to the Ashfeld',{});}}
  // the Ashfeld: Varek and the choice
  const ASH={npc:null};
  function tickAshfeld(){const S=story();if(S.step!=='ashfeld'){if(ASH.npc)removeAsh();return;}const f=siteAnywhere('ashfeld');if(!f)return;if(Math.hypot(px-f.x,pz-f.z)>200){if(ASH.npc&&Math.hypot(px-f.x,pz-f.z)>400)removeAsh();return;}if(ASH.npc)return;
    const def={name:'Varek',role:'',ico:'✒',authored:true,people:'oldblood',sCol:0xd0c8c4,hairCol:0x0e0c0c,bodyScale:[.92,.96,.92],bCol:0x2a2a30,x:f.x+3,z:f.z-4,greeting:["You have his log. I know what it says; I've had letters like it for a hundred years. Sailors think someone is behind them. Someone is. It isn't me."],
      topics:[{label:'Then what are you doing to the sigils?',response:"Writing over them. Every one I can reach. Not to take — to *close*. They were never a loom. They're a window, and the ones who built them opened it, and something has been reading us through it since. I've spent two hundred years pulling the shutters. You've spent a season undoing it, gate by gate, for coin."},
              {label:'Stop. Leave the gates.',quest:true,fn:()=>{S.choice='stop';S.step='root';finishAsh();return "You'd have me stop, and let it read. Then go and see what it is. The place beneath all the gates is on the far side of Aurenne, under the water. The Root. I'll be there before you, because I always am. Decide there.";}},
              {label:"I'll help you close them.",quest:true,fn:()=>{S.choice='help';S.step='root';finishAsh();return "Then there is one gate left that matters, and it isn't a gate. The Root, under the water off Aurenne's far shore. Everything runs back to it. Meet me there and we'll shut the last window with our hands.";}},
              {label:'Neither. I want to see it first.',quest:true,fn:()=>{S.choice='third';S.step='root';finishAsh();return "That's the first honest thing anyone has said to me on this field. The Root, then. Off Aurenne's far shore, under the water. Come and look, and then tell me what you see between us.";}},
              {label:'Farewell.',bye:true}]};def.temper='weary';
    const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(def.x,worldH(def.x,def.z),def.z);ASH.npc=n;showMsg('He is standing at the edge of the field, looking out.','#a0a8c0');}
  function finishAsh(){const q=qFind('act2_ashfeld');if(q)qComplete(q);const S=story();S.act=3;showMsg('Act III — What Was Bound','#e8d8a0');if(typeof addLog==='function')addLog('📖','Act III — What Was Bound. The Root, under the water off Aurenne\u2019s far shore.');storyQuest('act3_root','What Was Bound','Varek',"The place beneath all the gates. Under the water off Aurenne's far shore, on a rock in the east. You'll need to breathe down there, or a hull to reach it.",'Reach the Root and kill what guards it',{});}
  function removeAsh(){const n=ASH.npc;if(!n)return;sc.remove(n.g);sc.remove(n.dot);const k=npcs.indexOf(n);if(k>=0)npcs.splice(k,1);ASH.npc=null;}
  // the Root: when its beast is dead, Varek, and the ending
  const ROOTS={npc:null,done:false};
  function onLeavePortal(portal,cleared){if(portal&&cleared&&portal.lair){(worldState.masters||(worldState.masters={}))[portal.seed]=true;} // v80 — the master of a cavern dies once
    if(!portal||portal.seed!==9001)return;if(cleared){const S=story();S.rootCleared=true;showMsg('The Root is quiet. Something is standing at its mouth.','#a0a8c0');}}
  function tickRoot(){const S=story();if(S.step!=='root')return;const r=anchoredPlaces().root;if(!r)return;if(!S.rootCleared)return;if(ROOTS.npc)return;
    const c=S.choice;const def={name:'Varek',role:'',ico:'✒',authored:true,people:'oldblood',sCol:0xd0c8c4,hairCol:0x0e0c0c,bodyScale:[.92,.96,.92],bCol:0x2a2a30,x:r.x+3,z:r.z+4,greeting:["Here it is. The root of every gate. Put your hand on it and you'll feel them all — and you'll feel the other side. I've stood here a long time. When you look at me — what is between us?"],
      topics:[{label:'…',response:"You took too long to answer. That's the answer. Two hundred and fifty years. Every death written down. And I was the whole of your evening."},
              {label:'Break it. Let the world unbind.',quest:true,fn:()=>{ending('unbound');return "Then it comes down, all of it, and whatever is on the other side gets a new book to read. Your name goes in the first line. I'll be in the first gate, waiting to be found.";}},
              {label:'Seal it. Close the window.',quest:true,fn:()=>{ending('sealed');return "Then it narrows, and the reading stops, and the world is smaller and yours. My list has one line left in it, and I know whose.";}},
              {label:'Leave it open. Knowing.',quest:true,fn:()=>{ending('open');return "Stay, then. Knowing. That's more than any of us managed. Once in a long while someone will say a thing about you and go back to their bread, and you'll know what they meant. So will I.";}},
              {label:'Farewell.',bye:true}]};def.temper='weary';
    const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(def.x,worldH(def.x,def.z),def.z);ROOTS.npc=n;showMsg('Varek is standing at the mouth of the Root.','#a0a8c0');}
  function ending(kind){const S=story();S.ending=kind;S.step='end';const q=qFind('act3_root');if(q){qComplete(q);q.turnedIn=true;}
    if(kind==='unbound'){worldState.unbound=true;try{localStorage.setItem('og_carry',JSON.stringify({name:typeof playerName!=='undefined'?playerName:'',people:worldState.people,look:worldState.look||null,item:(typeof BAG!=='undefined'&&BAG[0])?BAG[0]:null,seed:Date.now()%100000}));}catch(e){}}
    if(kind==='open'){worldState.knowing=true;}
    if(typeof addLog==='function')addLog('📖',kind==='unbound'?'The Root broken. The world unbinds; a new book begins.':kind==='sealed'?'The Root sealed. The window narrows.':'The Root left open, knowing.');
    setTimeout(()=>endingScreen(kind),1500);}
  function endingScreen(kind){const text=kind==='unbound'?['THE LOOM RELEASED','Everything held comes loose, gently, the way a hand opens. Somewhere a new coast is being drawn, with your name in the first line of it.','A new world waits at the title screen — the same name, the same people, one thing carried through.']:kind==='sealed'?['THE WINDOW NARROWED','The reading stops. The stones go cold for good. The world is smaller, and safe, and yours.','Varek\u2019s list has its last line.']:['LEFT OPEN, KNOWING','The sigils warm again. Magic deepens. The world lives watched, and lives anyway.','Once in a long while, someone will say one of the three descriptions to you, and go back to their bread.'];
    try{const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;background:rgba(6,4,2,.96);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#e8dcc0;font-family:Georgia,serif;text-align:center;padding:40px';ov.innerHTML=`<div style="font-size:34px;letter-spacing:.25em;margin-bottom:18px">${text[0]}</div><div style="max-width:640px;font-size:17px;line-height:1.6;color:#c8b890">${text[1]}</div><div style="max-width:640px;font-size:14px;line-height:1.6;color:#8a7a60;margin-top:16px">${text[2]}</div><button style="margin-top:34px;padding:10px 22px;background:#3a2a16;color:#f0e2c0;border:1px solid #8a6a3a;border-radius:4px;cursor:pointer;font:15px Georgia,serif">Go on</button>`;ov.querySelector('button').onclick=()=>ov.remove();document.body.appendChild(ov);}catch(e){}}
  function tickStory(){if(activeZoneId!=='world')return;const S=story();if(S.act<2&&storyBegun())beginActII();tickTut();try{tickRival();tickFactionKinds();tickSieges();}catch(e){console.warn('story tick',e);}if(S.act<2){tickCorwin();return;}tickCorwin();tickOswy();tickAshfeld();tickRoot();}

  // ═══ BUILD / ENTER / TICK ════════════════════════════════════════════
  function build(){
    if(sc)return sc;
    sc=new THREE.Scene();
    sc.background=new THREE.Color(BIOME_PROFILES.plains.bgCol);
    sc.fog=new THREE.FogExp2(BIOME_PROFILES.plains.fogCol,.004);
    terrainTex=makeTerrainTex();terrainTex.repeat.set(CHUNK/4,CHUNK/4);
    terrainMat=new THREE.MeshLambertMaterial({map:terrainTex,vertexColors:true});
    buildProtos();
    buildLights();buildSky();buildWater();
    ZONES.world={scene:sc,sol:STATIC_SOL,solidFn:solidAt,npcs,enemies:[],gates:[],size:SIZE*GRID,portals,herbs:[],houses:[],getY:groundY,platforms:[],_cfg:{id:'world',size:SIZE*GRID,seed:SEED}};
    // the home cell now (everything the spawn needs); neighbours stream in via jobs
    loadCell(HOME_I,HOME_J);
    restoreShip();
    ZONES.world.beds=beds;
    if(!worldState.wdisc)worldState.wdisc={};
    if(!worldState.wcleared)worldState.wcleared={};
    sc.userData.dayNight={isLocked:true};
    return sc;
  }
  function bindZone(){
    scene=sc;ZE=ZONES.world.enemies;ZB=[];PORTALS=portals;
  }
  function enter(sx,sz,y,label){
    const go=()=>{
      _clearInteractPrompt();
      blocking=false;staggered=[];
      lid='overworld';currentHouse=null;activeZoneId='world';
      build();bindZone();
      // Null coords = the default spawn, which build() derives from the road.
      if(sx==null){sx=spawn.x;sz=spawn.z;y=spawn.yaw;}
      px=sx;pz=sz;yaw=y||0;pitch=0;velY=0;onGround=true;
      tickCells(0,true);stream(px,pz,true); // the destination cell (and its statics) load synchronously behind the fade
      tickSettlements(0,true);
      freeSpot();
      jumpY=worldH(px,pz);
      atmosphere(10);
      showZoneName(label||'🌍 The open country');
      const fb=document.getElementById('fbtn');if(fb)fb.style.display='block';
      if(typeof saveGame==='function')saveGame();
    };
    if(typeof doFade==='function')doFade(go);else go();
  }
  function tick(dt,now){
    if(activeZoneId!=='world'||!sc)return;
    tickCells(dt,false);runJobs();
    tickLightPool(dt);tickWeather(dt);tickSmoke(dt);tickShip(dt);tickSailTrim(dt);tickBehaviours(dt);cabinUpdate();tickSchoolCool(dt);tickWhales(dt,now||performance.now());tickBoarding(dt);tickHullCollisions(dt);tickOtherShips(dt,now||performance.now());tickCrew();tickSharks();tickFish(dt,now||performance.now());tickGulls(dt,now||performance.now());tickDolphins(dt,now||performance.now());
    stream(px,pz,false);
    houseLod();
    atmosphere(dt);
    tickSettlements(dt,false);
    tickNPCs(dt,now||performance.now());try{tickCrime(dt,now||performance.now());}catch(e){}
    tickChatter(dt);
    ensureTaskWorldObjects();tickPickups();qTick();
    tickHerbSync(dt);tickAshenmoorStory();tickProsperity();tickRents();tickCaravans(dt);tickCoaches(dt);tickStory();try{tickDuel(dt);}catch(e){console.warn('duel',e);}tickSiteDeaths();tickVarek(dt);sweepLights();
    tickCleared();
    tickDiscovery(dt);
  }
  function restore(sx,sz,y){
    try{anchoredPlaces();}catch(e){}
    build();activeZoneId='world';bindZone();
    px=sx;pz=sz;yaw=y||0;
    tickCells(0,true);stream(px,pz,true);
    tickSettlements(0,true);
    freeSpot();
    atmosphere(10);
    showZoneName('🌍 The open country');
  }
  // If the player is standing inside a trunk/rock/door, spiral outward to
  // the nearest open ground (also used on save restore, since scatter can
  // change between builds).
  function freeSpot(){
    if(!solidAt(px,pz))return;
    for(let r=1;r<=12;r+=1)for(let k=0;k<12;k++){
      const a=k/12*Math.PI*2,tx=px+Math.cos(a)*r,tz=pz+Math.sin(a)*r;
      if(!solidAt(tx,tz)&&worldH(tx,tz)>1){px=tx;pz=tz;return;}
    }
  }
  function setRadius(n){RADIUS=Math.max(1,Math.min(8,n|0));lastCX=null;lastCZ=null;if(sc)stream(px,pz,true);}
  // Where is everything — for the devlog / console.
  function gazetteer(){
    const out={sites:SITES.map(t=>`${t.name} (${t.kind}) ${t.x|0},${t.z|0}`),dungeons:[]};
    DOORS.forEach(e=>{const w=dungeonWorldPos[e.seed];if(w)out.dungeons.push(`${e.canonicalName||('#'+e.seed)} [${e.theme}/${e.diff}${e.kind==='fort_door'?'/fort':''}] ${w.x|0},${w.z|0}`);});
    return out;
  }

  function devUnlockAll(){if(!worldState.wdisc)worldState.wdisc={};let n=0;for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){const c=getCell(i,j);c.sites.forEach(t=>{if(t.kind==='portal'||t.pad<0)return;if(!discovered(t.id)){worldState.wdisc[t.id]=true;n++;}});c.doors.forEach(e=>{if(!discovered('door_'+e.seed)){worldState.wdisc['door_'+e.seed]=true;n++;}});c.peaks.forEach(p=>{if(!discovered(p.id)){worldState.wdisc[p.id]=true;n++;}});c.lakes.forEach(l=>{if(!discovered(l.id)){worldState.wdisc[l.id]=true;n++;}});}if(typeof showMsg==='function')showMsg(`Unlocked ${n} places across the continent.`,'#e8d8a0');return n;}
  return {SIZE,CARGO_GOODS,startTile,tileStep,withCellData,ridgeAt,cargoItem,ferryTopics,ferryPrice,shipRaiseCost,mapEntries,restoreShip,seaState,openWater,spawnShip,shipBarsUI,shipBars,shipWear,shipSpeedNow,shipMendCost,upgradeTopics,tickHullCollisions,volley,get boarders(){return BOARDERS;},cargoNation,cargoWorld,cargoBlockaded,cargoAsk,cargoBid,cargoBuy,cargoSell,cargoRows,cargoBoard,cargoTopic,holdCap,holdUsed,duelKill,duelDown,get duel(){return DUEL;},tickDuel,get rival(){return RIVAL;},liveRumours,shipTrim,windDir,smokeWant,smokeLegacy,shellWalls,shellFrame,get smoke(){return SMOKE;},windowView:windowTexture,townGateGeo,CHUNK,SEA_Y,GRID,MASK,wxAudio,get sky(){return SKY;},footprint:fpWalk,get footprints(){return FP;},get wx(){return WX;},chunkList(){return [...chunks.values()];},dominant(){return dominantRegion(px,pz).r.biome;},get scene(){return sc;},intDoorInteract,intDoorPrompt,get intDoors(){return INT_DOORS;},get intNpcs(){return INT_NPCS;},drawLocalMap,BLD,directionTopics,compassWord,get way(){return WAY;},set way(v){WAY=v;},get settle(){return SETTLE;},devUnlockAll,tutLeads,camSolid,devSurvey,get tut(){return TUT();},siteAnywhere,get jobs(){return JOBS;},CULTURES,shipInteract,shipPrompt,isSwimming,buyShip,get ship(){return SHIP;},diveTick,get dive(){return DIVE;},get others(){return OTHER;},despawnOtherShip,get STATIC_SOL(){return STATIC_SOL;},rainIndoor(m){WX.indoorMul=m;if(WX.rainG&&activeZoneId!=='world'){WX.rainG.gain.value+=(0-WX.rainG.gain.value)*.08;}},compassPlaces,cellarFor,doorAnywhere,doorAnywhere,spawnOtherShip,boardOther,allPorts,ferryTo,lordFor,nationOf,nationKeyOf,PEOPLES,NATIONS,NAMES,peopleOfSite,haltLines,yieldLines,guildGreet:GUILD_GREET,playerPeople,TS,prosperity,favor,addFavor,setProsperity,flag,stateLine,townCard,routes,coaches,coachInteract,compassMarkers,tickBehaviours,get arrows(){return ARROWS;},story,beginActII,onEnterPortal,onLeavePortal,etchedGateFor,canonicalGateName,get coachLines(){return COACHES;},FACTIONS,fstate,anchoredPlaces,get caravans(){return CARAVANS;},get wrecks(){return WRECKS;},nearestSigilDoor,onMasteryTouch,sigilDoors,GODS,priceMulAt(id){const t=SITE[id];return t&&(t.kind in BASE_P)?priceMul(t)*factionPriceMul(t):1;},priceMulHere(){let best=null,bd=1e9;for(const t of SITES){if(!(t.kind in BASE_P))continue;const d=Math.hypot(px-t.x,pz-t.z);if(d<t.pad+40&&d<bd){bd=d;best=t;}}return best?priceMul(best)*factionPriceMul(best):1;},mirrorLight,regLight,unregLight,sweepLights,seaBare,nearNpcName,get lightSources(){return LSRC;},get quests(){return QJ();},townQuestFor,qTurnIn,cargoBonus,catchFish,get whales(){return WHALES;},get boarders(){return BOARDERS;},get fish(){return LIFE.fish;},get herbLod(){return {list:HERB_IMS,lod:HERB_LOD};},treeProtos(){return PROTO;},houseProto(key,w,d,seed,opts){const r=pRng(seed>>>0);const st=STYLE[key];opts=Object.assign({chimney:true,twoStory:null},opts||{});const hi=buildingGeo(w,d,st,r,opts);return {hi,lo:hi.userData.lo,variant:hi.userData.variant,winTop:hi.userData.winTop,eaveLow:hi.userData.eaveLow,thatch:hi.userData.thatch};},houseStyles(){return Object.keys(STYLE);},poiGeo(k){return k==='tower'?towerGeoHi(38,4.6):k==='shrine'?shrineGeoHi():cragGeo(2,1);},furnProto(k,seed){const r=pRng(seed>>>0);const f={well:()=>wellGeo(),stall:()=>stallGeo(r),tent:()=>tentGeo(r),ruin:()=>ruinGeo(r),stone:()=>standingStoneGeo(r)}[k];const hi=f();return {hi,lo:hi.userData.lo};},civicProto(kind,w,d){const f=kind==='church'?churchGeo:keepGeo;const hi=f(w,d,STYLE.stone,Math.random);return {hi,lo:hi.userData.lo};},treeMix(){return TREE_MIX;},shipBake,boatBake,SHIP_MAT,boatBake,buildShipMesh,bedInteract,bedPrompt,hatchPrompt,hatchInteract,lootPrompt,lootInteract,get intLoot(){return INT_LOOT;},boxPrompt,boxInteract,boxCoins,get intBox(){return INT_BOX;},doorLockNow,doorLockFor,doorPicked,refusesTrade,bountyAt,tickCrimeDay,witnessOf,intSightLine,intClearLine,tickCrime,strikeNpc,guardKilled,guardsOf,guardDraw,dispatchGuard,get guardSent(){return CR.sent;},penanceTopics,nationRecord,factionTopics,guestPrompt,guestInteract,guestChapelHouse,noteDeath,noteSessionGap,tickRealClock,get varek(){return vstate();},fieldFor,varekDue,HOME_I,HOME_J,getCell,cellOf,LOADED,DOORS,REGIONS,SITES,SITE,ROAD_DEFS,STAMPS,PEAKS,LAKES,RIVERS,buildInteriorFor,shopClosedNow,npcInsideNow,drawMinimap,drawLocalMap,tickInterior,interiorTalk,guild:{onKill,onHarvest,onTalk,onEnterInterior,onCast,state:gstate,rankOf,GUILD_DEF},worldH,rawH,baseH,landH,roadInfo,bridgeGeo,buildSiteGeo,fortKeepGeoHi,wreckGeo,coachGeo,rockProto,lampPostGeo,doorLanternGeo,tradeSignGeo,signpostGeo,nameBoardGeo,loadCell,unloadCell,wallSegHi,gateTowerHi,quayGeoHi,breakwaterHeap,netHeapGeo,openMap,closeMap,fastTravel,discover,discovered,arrivalFor,regionWeights,dominantRegion,addStamp,build,enter,restore,tick,solidAt,setRadius,gazetteer,genSettlement,pickSeen,disposeSettlement,get settlements(){return SETTLE;},
          get scene(){return sc;},get chunks(){return chunks;},get portals(){return portals;},get cleared(){return cleared;},get roads(){return ROADS;},get dungeonPos(){return dungeonWorldPos;}};
})();
