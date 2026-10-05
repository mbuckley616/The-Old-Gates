
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
    if(!RV.ready)routeWorld();
    let h=landH(x,z);
    // S432 — the routed rivers and lakes, from the carve grid: the same cut whether the cell is loaded or not. A deep cut
    // (a channel through high ground) widens its blend, so it reads as a valley and not a slot
    const bk=RVG.get(sgKey(Math.floor(x/RVSG),Math.floor(z/RVSG)));
    if(bk){for(let q=0;q<bk.length;q++){const e=bk[q];
      if(e.lk){const lk=e.lk;let d=Math.hypot(x-lk.x,z-lk.z);if(lk.routed)d+=(_smoothNoise(x,z,SEED+63,lk.r*.6)-.5)*lk.r*.5; /* a routed lake's shore wanders: a disc reads as a dish */const bl=Math.max(lk.blend,Math.min(160,(h-lk.depth)*1.2));if(d>=lk.r+bl)continue;const t=d<=lk.r?1:1-(d-lk.r)/bl,ee=t*t*(3-2*t);h=h*(1-ee)+lk.depth*ee;continue;}
      const rv=e.rv;riverSample(rv,e.i0,e.i1,x,z,_rs);const d=_rs[0],w=_rs[1];const depth=rv.depth!=null?rv.depth:rvDepth(w);let bl=rv.blend!=null?rv.blend:8+w;bl=Math.max(bl,Math.min(60,(h-depth)*.9));if(d>=w+bl)continue;
      const t=d<=w?1:1-(d-w)/bl,ee=t*t*(3-2*t);const bed=Math.min(h,depth);h=h*(1-ee)+bed*ee;}}
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
  const PEAKS=[],RIVERS=[],LAKES=[],INLETS=[],CELL_DOORS=[]; // live: landmarks/doors of loaded cells
  const RV={ready:false,routing:false,spines:null,masses:null,peaks:null,reaches:[],great:[],lakes:[],stats:null}; // S432 — the ranges and the routed rivers
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
    const amp=RV.routing?0:regionScalar(x,z,'amp'); /* S433 — the routing reads the bare land: no cell's regions, whatever is loaded, so the rivers are the same from any boot */
    const cont=(fbm(x,z,420,SEED+1,3)-.5)*2*11+7;
    const hills=(fbm(x,z,110,SEED+2,3)-.5)*2*amp;
    const rg=(ridged(x,z,60,SEED+7)-.5)*amp*.55;         // ridgelines
    const det=(_smoothNoise(x,z,SEED+3,24)-.5)*1.4+(_smoothNoise(x,z,SEED+4,8)-.5)*.4;
    let h=cont+hills+rg+det;
    const bf=basinAt(x,z);if(bf<1)h*=bf; // S432 — the horseshoe's basin floor and the valley out through its gap
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
      const s=arr[i];if(s.noFlat)continue; /* S433 — a stamp that only clears the scatter (a river quay's bank) */
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
    const ds=CELL_DOORS.filter(e=>{const p=dungeonWorldPos[e.seed];return p&&Math.hypot(p.x-px,p.z-pz)<R;});lines.push(`doors within ${R}u: ${ds.map(e=>`${e.canonicalName||e.seed} [${e.kind}]`).join(', ')||'none'}`);
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
    autumn:[['autumnRed',.2],['autumnGold',.18],['birchAutumn',.14],['oakAutumn',.12],['conifer',.1]],snowpine:[['spruce',.16],['dead',.08]],willow:[['birch',.25],['dead',.1]]};
  // S519 — a limb from the point it grows out of: a tapered cylinder turned by rx then rz (mergeParts' Euler order),
  // placed so its wide end sits at `base` (on the trunk's axis, or on a parent limb). Each call logs its base and tip.
  const LIMB_LOG=[];
  function limbPart(rTop,rBot,h,seg,base,rx,rz,color){
    const d=new THREE.Vector3(0,1,0).applyEuler(new THREE.Euler(rx,0,rz));
    const c=new THREE.Vector3(...base).addScaledVector(d,h/2);LIMB_LOG.push({base:base.slice(),tip:[c.x+d.x*h/2,c.y+d.y*h/2,c.z+d.z*h/2],r:rBot});
    return {geo:new THREE.CylinderGeometry(rTop,rBot,h,seg),color,x:c.x,y:c.y,z:c.z,rx,rz,jitter:.06};
  }
  const AUTUMN_KINDS=['autumn','autumnRed','autumnGold','birchAutumn','oakAutumn'];
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
    // Broadleaf: trunk + three low-poly blobs. S521: the leaves' four colours are a parameter, for the autumn variants
    const broadleafParts=L=>[
      {geo:new THREE.CylinderGeometry(.38,.7,6.0,7),color:barkDk,y:3.0},
      {geo:new THREE.CylinderGeometry(.12,.22,3.2,5),color:barkDk,y:6.6,x:1.2,rz:-.7,jitter:.05},
      {geo:new THREE.CylinderGeometry(.12,.22,3.0,5),color:barkDk,y:6.4,x:-1.1,z:.4,rz:.75,jitter:.05},
      {geo:new THREE.IcosahedronGeometry(3.6,1),color:new THREE.Color(L[0]),y:8.6,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(2.8,1),color:new THREE.Color(L[1]),y:9.6,x:2.2,z:.8,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(2.6,1),color:new THREE.Color(L[2]),y:9.4,x:-2.0,z:-1.0,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(2.2,1),color:new THREE.Color(L[3]),y:11.4,x:.3,z:.3,jitter:.14},
    ];
    PROTO.broadleaf=mergeParts(broadleafParts([0x4f8a34,0x5a9a3a,0x45803a,0x559040]));
    // Dead tree: a bare trunk that forks and ends in a broken stub, its limbs rooted on the trunk (S519 — Michael, the
    // inspector: "one is floating unconnected"; the old top limb began above the trunk's cut and the others poked through).
    {const bk=new THREE.Color(0x3a3028),bk2=new THREE.Color(0x342a22),bk3=new THREE.Color(0x2e261e);
      PROTO.dead=mergeParts([
        {geo:new THREE.CylinderGeometry(.2,.58,7.4,7),color:bk,y:3.7},
        {geo:new THREE.CylinderGeometry(.04,.2,1.1,6),color:bk3,y:7.9,x:.05,rz:-.12,jitter:.1},
        limbPart(.08,.22,4.2,5,[0,5.7,0],0,-.95,bk),
        limbPart(.05,.11,1.6,4,[1.85,7.0,0],.3,-.25,bk2),
        limbPart(.07,.2,3.4,5,[0,4.6,0],.32,.95,bk2),
        limbPart(.05,.14,2.6,4,[0,6.6,0],-.85,.35,bk2),
        limbPart(.04,.09,1.3,4,[-.05,3.2,0],.9,-.5,bk3)]);
      PROTO.dead.userData.limbs=LIMB_LOG.splice(0);}
    // Coastal scrub: one squat wind-stunted blob.
    // autumn broadleaf (tinted per instance), snow-capped pine, mushroom, willow
    const c=x=>new THREE.Color(x);
    // S521 — autumn's trees in autumn's colours (Michael, the inspector: "Leaves of this tree are still green ... variants of the
    // current trees with red, yellow, orange and mixed leaves"). The autumn tree was the broadleaf itself, and the instance tint,
    // a multiplier near white, only browned its green. Each is now the broadleaf, oak or birch with the leaves coloured.
    PROTO.autumn=mergeParts(broadleafParts([0xb8421e,0xd8862a,0xd6aa30,0x9a3a1c]));       // mixed: red, orange, gold
    PROTO.autumnRed=mergeParts(broadleafParts([0xa8321c,0xbe4422,0x922a18,0xc85a26]));
    PROTO.autumnGold=mergeParts(broadleafParts([0xd8a42a,0xe6bc3a,0xc89026,0xeccb52]));
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
    const birchParts=L=>[
      {geo:new THREE.CylinderGeometry(.14,.26,7.6,7),color:birchBark,y:3.8,jitter:.05},
      ...[[1.1,.3],[2.0,2.1],[2.9,4.0],[3.8,1.2],[4.9,3.3],[5.9,.6]].map(([y,a])=>({geo:new THREE.CylinderGeometry(.262-.0155*y,.262-.0155*y,.09,7,1,true,a,1.1),color:mark,y,jitter:.02})),
      {geo:new THREE.CylinderGeometry(.05,.09,2.6,4),color:birchBark,y:6.2,x:.7,rz:-.6,jitter:.05},
      {geo:new THREE.CylinderGeometry(.05,.08,2.2,4),color:birchBark,y:5.8,x:-.6,z:.3,rz:.65,jitter:.05},
      {geo:new THREE.IcosahedronGeometry(1.7,1),color:c(L[0]),y:7.2,x:1.3,sy:1.2,jitter:.16},
      {geo:new THREE.IcosahedronGeometry(1.5,1),color:c(L[1]),y:6.6,x:-1.2,z:.4,sy:1.2,jitter:.16},
      {geo:new THREE.IcosahedronGeometry(1.6,1),color:c(L[2]),y:8.6,z:-.2,sy:1.3,jitter:.16}];
    PROTO.birch=mergeParts(birchParts([0x7aa84a,0x86b050,0x72a044]));
    PROTO.birchAutumn=mergeParts(birchParts([0xe0b432,0xeec848,0xd29a28]));  // S521 — a birch turns butter-yellow
    const oakParts=L=>[
      {geo:new THREE.CylinderGeometry(.6,1.0,4.4,8),color:c(0x3a2a1a),y:2.2,jitter:.1},
      {geo:new THREE.CylinderGeometry(.22,.42,3.6,6),color:c(0x3a2a1a),y:4.9,x:1.3,rz:-.85,jitter:.08},
      {geo:new THREE.CylinderGeometry(.2,.4,3.4,6),color:c(0x362618),y:4.8,x:-1.2,z:.5,rz:.8,rx:.2,jitter:.08},
      {geo:new THREE.CylinderGeometry(.18,.34,3.0,6),color:c(0x362618),y:5.2,z:-1.1,rx:-.8,jitter:.08},
      {geo:new THREE.IcosahedronGeometry(3.3,1),color:c(L[0]),y:7.0,x:2.4,z:.4,sy:.78,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(3.1,1),color:c(L[1]),y:6.9,x:-2.3,z:.9,sy:.78,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(3.0,1),color:c(L[2]),y:7.1,z:-2.2,sy:.78,jitter:.14},
      {geo:new THREE.IcosahedronGeometry(3.4,1),color:c(L[3]),y:8.4,x:.2,z:.2,sy:.72,jitter:.14}];
    PROTO.oak=mergeParts(oakParts([0x3f6f2a,0x467a30,0x3a6a28,0x4a7e34]));
    PROTO.oakAutumn=mergeParts(oakParts([0xa8561e,0x8e4418,0xb86a26,0x7a3a16]));  // S521 — an oak goes russet and copper
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
        if(AUTUMN_KINDS.includes(sp)){const k=.9+(t.t-.5)*.22;c.setRGB(k,k*(.97+t.t*.06),k*.94);return;} // S521 — the colour is in the leaves; the tint only lights it
        if(sp==='mushroom'){hue=.02+t.t*.08;sat=.35;lig=.55;}
        if(sp==='willow'){hue=.22+t.t*.05;sat=.3;lig=.42;}
        c.setHSL(hue,sat,lig);
        // Vertex colour already carries the base; the tint is a multiplier
        // around white, so normalise toward 1.
        c.r=.72+c.r*.5;c.g=.72+c.g*.5;c.b=.72+c.b*.5;
      },true,sp==='scrub'?0:({oak:.85,oakAutumn:.85,birch:.35,birchAutumn:.35,spruce:.45,pine:.45}[sp]||.5));
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
      // S521 — the autumn wood's canopy russet from afar, as its trees are near
      if(h>1.6&&h<30){if(dominantRegion(x,z).r.biome==='autumn')_tmpC2.setRGB(.5,.26,.1);else _tmpC2.setRGB(.22,.36,.18);c.lerp(_tmpC2,Math.min(.75,dens*.9));}
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
