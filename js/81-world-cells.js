
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
  // v80 S442 — after a hyphen the name takes a capital (Saint-Rouge); no draw changes (quest review run 6, Finding 8)
  function genName(r,reg){const s=SYL[reg]||SYL.irish;const a=s[0][Math.floor(r()*s[0].length)];let k=Math.floor(r()*s[1].length);if(a.replace('-','').toLowerCase()===s[1][k])k=(k+1)%s[1].length;const b=s[1][k];return a.endsWith('-')?a+b.charAt(0).toUpperCase()+b.slice(1):a+b;}
  const REGION_NAMES={forest:['Wood','Weald','Holt','Shaw'],plains:['Vale','Downs','Reach','March'],coast:['Strand','Shore','Coast','Haven'],wastes:['Waste','Barrens','Scar','Heath'],tundra:['Tundra','Snows','Whites','Frost'],fen:['Fen','Marsh','Mire','Carr'],moor:['Moor','Heath','Tops','Rise'],autumn:['Rust','Amber Wood','Gold Weald','Fall'],dunes:['Dunes','Sands','Shingle','Wash'],swamp:['Swamp','Bog','Sump','Drowned Wood'],wasteland:['Cinders','Blight','Ash','Burn']};
  // ── cell data ──
  const CELLS=new Map();
  function cellKey(i,j){return i+','+j;}
  function getCell(i,j){
    const key=cellKey(i,j);if(CELLS.has(key))return CELLS.get(key);
    const c=(i===HOME_I&&j===HOME_J)?homeCellData():genCellData(i,j);
    c.sites.forEach(t=>{if(t.kind==='lair'&&!c.doors.some(d=>d.lairDoor&&d.lairSite===t.id)){const e=lairDoorFor(t,c);e.lairSite=t.id;c.doors.push(e);}}); // v80 — lair caverns
    CELLS.set(key,c);
    if(!_namesDone&&!_namesBusy){_namesBusy=true;for(let jj=0;jj<GRID;jj++)for(let ii=0;ii<GRID;ii++)getCell(ii,jj);uniqueSiteNames();_namesDone=true;_namesBusy=false;}
    return c;
  }
  // v80 S432 — one name per place, world-wide (Michael's A on #110). The first cell asked for makes every cell of the grid
  // (each is a pure function of its coordinates, so the order cannot change one), then this pass runs once. Home's
  // hand-placed names are kept and reserved. The rest keep the name their cell drew unless a place ranked before them
  // holds it (cities, then towns, ports, villages, outposts; then by cell and site order). Every keeper is settled first,
  // so no new name takes one another place drew. A place that lost its name then takes a free one from its culture's bank, starting from a hash of its id, and when the bank's two halves run out,
  // a longer name from the same sounds. It reads no cell's random draws, so nothing else in a cell moves.
  let _namesDone=false,_namesBusy=false;
  const NAME_RANK={city:0,town:1,port:2,village:3,outpost:4};
  function nameHash(s){let h=2166136261;for(let k=0;k<s.length;k++){h^=s.charCodeAt(k);h=Math.imul(h,16777619);}return h>>>0;}
  // v80 S442 — a short name never doubles a word (Montmont, Ardard) and capitalises after a hyphen; the French long form is
  // a short name and a real qualifier (was -le- and a second ending: Valclair-le-Ancy) (quest review run 6, Finding 8)
  function nameBanks(reg){const s=SYL[reg]||SYL.irish,A=s[0],B=s[1],short=[],long=[];
    const cap=w=>w.charAt(0).toUpperCase()+w.slice(1);
    A.forEach(a=>B.forEach(b=>{if(a.toLowerCase()===b)return;short.push(a.endsWith('-')?a+cap(b):a+b);}));
    if(reg==='irish')A.forEach(a=>B.forEach(b=>long.push(a+'na'+b)));
    else if(reg==='french')short.forEach(n=>['-sur-Mer','-le-Vieux','-la-Forêt','-en-Val','-les-Prés','-sous-Bois'].forEach(q=>long.push(n+q)));
    else if(reg==='anglo')A.forEach(a=>B.forEach(b=>long.push(a+'en'+b)));
    else A.forEach(a=>A.forEach(a2=>{if(a2!==a)B.forEach(b=>long.push(a+a2.toLowerCase()+b));}));
    return [short,long];}
  function uniqueSiteNames(){
    const taken=new Set(['Caer Slige','Port Blackhand']),list=[];
    for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){const c=CELLS.get(cellKey(i,j));if(!c)continue;const home=i===HOME_I&&j===HOME_J;
      c.sites.forEach(t=>{if(!home&&t.name&&t.kind in NAME_RANK)list.push(t);else if(t.name)taken.add(t.name);});}
    list.sort((a,b)=>NAME_RANK[a.kind]-NAME_RANK[b.kind]);
    const banks={},lost=[];let renamed=0;
    for(const t of list){if(taken.has(t.name)||/^(.+)\1$/i.test(t.name))lost.push(t);else taken.add(t.name);}
    for(const t of lost){
      const bk=banks[t.reg]||(banks[t.reg]=nameBanks(t.reg));let got=null;
      for(const L of bk){const st=nameHash(t.id)%L.length;for(let k=0;k<L.length&&!got;k++){const n=L[(st+k)%L.length];if(!taken.has(n))got=n;}if(got)break;}
      for(let k=2;!got;k++)if(!taken.has(t.name+' '+k))got=t.name+' '+k;
      t.drawnName=t.name;t.name=got;taken.add(got);renamed++;}
    return renamed;}
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
    // landmarks (S432): the peaks stand along the ranges' spines, named here; the lakes and rivers are the routing's (routeWorld)
    if(!isIsland)spinePeaks().forEach(p=>{if(p.i!==i||p.j!==j)return;const rp=cellRng(i,j,9+p.k);const f=PEAK_FORM[formReg(reg,i,j)][Math.floor(rp()*2)];c.peaks.push({id:`c${i}_${j}_pk${p.k}`,name:f(genName(rp,reg)),x:p.x,z:p.z,r:p.r,h:p.h,kind:'peak'});});
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
    if(sea>0&&!RV.routing){const arr=stampsNear(x,z);for(let k=0;k<arr.length;k++){const st=arr[k];if(st.kind!=='site')continue;const d=Math.hypot(x-st.x,z-st.z);
      if(st.port){const R=st.r*.95;if(d<R)sea*=sstep(st.r*.7,R,d);} // ports: the water line sits at the quay
      else{const R=st.r+st.blend;if(d<R)sea*=sstep(st.r,R,d);}}}
    return sea;
  }
  function ridgeAt(x,z){ // S432 — from the chain's spine (it measured from the cell border, so the ranges were boxes)
    const sp=rvSpines();let m=0;
    const wob=(_smoothNoise(x,z,SEED+72,190)-.5)*80;                        // the range wanders ±40u
    for(let k=0;k<sp.length;k++){const s=sp[k];const bb=s.bb;if(x<bb[0]||z<bb[1]||x>bb[2]||z>bb[3])continue;
      const d=polyDistM(s.pts,x+wob,z-wob,s.hw+80);if(d>=s.hw)continue;
      const vary=s.fixed?1:.55+fbm(x,z,240,SEED+73,2)*.9;                      // peaks and shoulders along it
      const pass=s.fixed?1-sstep(220,60,Math.abs(x-s.notchX)):sstep(.18,.34,fbm(x,z,320,SEED+74,2)); // gaps in the range; the Ferrous has one, at the Border Road
      const b=sstep(s.hw,s.hw*.18,d)*vary*pass*(s.h/150);if(b>m)m=b;}
    return Math.min(1,m);
  }
  // ═══ RANGES AND RIVERS (Session 432 — Michael's C on #112: the horseshoe) ═══════════════════════
  // The ranges are chains, not bands on cell borders: on each landmass a ring of ranges round a basin, open on one
  // side (the rule Michael chose), and the Ferrous wall along the home province's north; ridgeAt measures from the
  // chain's spine, the peaks stand along it, and the basin's floor is lowered with a valley out through the gap.
  // The rivers are not drawn by hand. Once per seed, at the first call for terrain, the real height is sampled on
  // an 80u lattice, every settlement pad raised so no channel runs through one, the pits flooded (Barnes 2014) so
  // every node drains to the sea, and the flow accumulated; a channel begins where the catchment passes 1 km², its
  // width follows the catchment, tributaries join, the basin's lake takes the ring's water and lets it out through
  // the gap, and each nation's largest river fans into a delta. The result is carved in rawH from a bucket grid
  // (RVG), so a chunk is cut the same whether its cell is loaded or not; each cell keeps its pieces (c.rivers,
  // c.lakes) for the bridges, the map and the rumours. The home cell keeps its authored rivers and lakes.
  const RV_STEP=80,RV_T=1e6/(RV_STEP*RV_STEP);              // the lattice; 156 nodes of catchment (1 km²) make a river
  const RV_NAV=16;                                             // a ship (13 by 4.4) needs sixteen units of water
  const rvWidth=a=>2+6.5*Math.log(1+a*RV_STEP*RV_STEP/400000); // catchment (nodes) → wet width: 10u at 1 km², 16u at 3.2 km², 25u at 12 km²
  const RIVER_NAMES={gatelands:['An Dubh','An Bhán','An Fhada','An Ghlas','An Rua','An Chaol'],mark:['Blackwater','Wulfwater','Greywater','Stanwater','Hagwater','Oxwater'],aurenne:['La Dorée','La Blanche','La Sauvage','La Verte','La Lente','La Claire']};
  // a feature's word is its people's (quest review, Finding 9): a generated culture takes its nation's people's register
  const PEAK_FORM={irish:[n=>`Sliabh ${n}`,n=>`Cnoc ${n}`],french:[n=>`Mont ${n}`,n=>`Pic ${n}`],anglo:[n=>`${n} Fell`,n=>`${n} Tor`]};
  const LAKE_FORM={irish:n=>`Loch ${n}`,french:n=>`Lac ${n}`,anglo:n=>/mere$/.test(n)?`${n} Water`:`${n} Mere`};
  const REG_OF_PEOPLE={gatelander:'irish',markman:'anglo',aurennais:'french',oldblood:'irish'};
  function formReg(reg,i,j){return PEAK_FORM[reg]?reg:REG_OF_PEOPLE[nationOf(i,j).people]||'irish';}
  function polyDistM(pts,x,z,m){ // polyDist with its own bbox margin (polyDist rejects beyond 80u; a range reaches 520)
    let best=1e9;
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1];
      if(x<Math.min(a[0],b[0])-m||x>Math.max(a[0],b[0])+m||z<Math.min(a[1],b[1])-m||z>Math.max(a[1],b[1])+m)continue;
      const vx=b[0]-a[0],vz=b[1]-a[1],l2=vx*vx+vz*vz||1;
      let t=((x-a[0])*vx+(z-a[1])*vz)/l2;t=t<0?0:t>1?1:t;
      const d=Math.hypot(x-(a[0]+vx*t),z-(a[1]+vz*t));if(d<best)best=d;
    }
    return best;
  }
  // ── the landmasses, as the mask gives them: the cells, the centre, the principal axis and the extents along it ──
  function landMasses(){
    if(RV.masses)return RV.masses;
    const seen={},out=[];const land=(i,j)=>i>=0&&j>=0&&i<GRID&&j<GRID&&(MASK[j][i]==='land'||MASK[j][i]==='coast');
    for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){if(!land(i,j)||seen[i+','+j])continue;const cells=[],st=[[i,j]];seen[i+','+j]=1;
      while(st.length){const [a,b]=st.pop();cells.push([a,b]);[[1,0],[-1,0],[0,1],[0,-1]].forEach(([di,dj])=>{const x=a+di,y=b+dj;if(land(x,y)&&!seen[x+','+y]){seen[x+','+y]=1;st.push([x,y]);}});}
      if(cells.length<3)continue;
      const cx=cells.reduce((s,c)=>s+c[0]+.5,0)/cells.length,cz=cells.reduce((s,c)=>s+c[1]+.5,0)/cells.length;
      let sxx=0,szz=0,sxz=0;for(const [a,b] of cells){const dx=a+.5-cx,dz=b+.5-cz;sxx+=dx*dx;szz+=dz*dz;sxz+=dx*dz;}
      const ang=.5*Math.atan2(2*sxz,sxx-szz);const ax=Math.cos(ang),az=Math.sin(ang);
      let lo=1e9,hi=-1e9,wlo=1e9,whi=-1e9;for(const [a,b] of cells){const t=(a+.5-cx)*ax+(b+.5-cz)*az,u=-(a+.5-cx)*az+(b+.5-cz)*ax;lo=Math.min(lo,t);hi=Math.max(hi,t);wlo=Math.min(wlo,u);whi=Math.max(whi,u);}
      out.push({cells,cx,cz,ax,az,lo,hi,wlo,whi,nat:nationKeyOf(cells[0][0],cells[0][1]),home:cells.some(c=>c[0]===HOME_I&&c[1]===HOME_J)});}
    RV.masses=out;return out;
  }
  const rvInLand=(m,x,z)=>{const i=Math.floor(x/SIZE),j=Math.floor(z/SIZE);if(i===HOME_I&&j===HOME_J)return false;return m.cells.some(c=>c[0]===i&&c[1]===j);};
  // a line across a mass, wandered so it reads as a chain of hills; only its longest run inside the land is kept
  function rvWander(m,pts,seed,amp){
    const out=[];for(let k=0;k<pts.length;k++){const [x,z]=pts[k];const t=k/(pts.length-1);const w=Math.sin(t*Math.PI)*amp;out.push([x+(_smoothNoise(x,z,seed,1700)-.5)*2*w,z+(_smoothNoise(x+5000,z,seed+1,1700)-.5)*2*w]);}
    let best=[],cur=[];for(const p of out){if(rvInLand(m,p[0],p[1]))cur.push(p);else{if(cur.length>best.length)best=cur;cur=[];}}if(cur.length>best.length)best=cur;
    return best;
  }
  // C — a horseshoe of ranges round a basin, open on one side: the basin holds a lake and drains through the gap as one great river
  function rvHorseshoe(m,seed){const open=(seed%4)*Math.PI/2;const R=Math.min(m.hi-m.lo,m.whi-m.wlo)*.34;const pts=[];
    const cx=m.cx-(m.ax*Math.cos(open)-m.az*Math.sin(open))*R*.25,cz=m.cz-(m.az*Math.cos(open)+m.ax*Math.sin(open))*R*.25;
    for(let k=0;k<=12;k++){const a=open+Math.PI*(.4+1.2*k/12);const u=Math.cos(a)*R,v=Math.sin(a)*R;pts.push([(cx+m.ax*u-m.az*v)*SIZE,(cz+m.az*u+m.ax*v)*SIZE]);}
    const ox=m.ax*Math.cos(open)-m.az*Math.sin(open),oz=m.az*Math.cos(open)+m.ax*Math.sin(open);
    const basin={x:cx*SIZE,z:cz*SIZE,dx:ox,dz:oz,R:R*SIZE};basin.lakeR=Math.max(250,Math.min(650,basin.R*.18));
    return {pts:rvWander(m,pts,seed,SIZE*.2),h:150,hw:520,basin};}
  // the Ferrous wall: the home cell's north border in every layout (the canon's impassable northern wall), with one notch where the Border Road crosses
  function rvFerrous(){const x0=HOME_I*SIZE,z=HOME_J*SIZE;const px_=edgePortal(HOME_I,HOME_J,'N').x;return {pts:[[x0-200,z+40],[x0+SIZE*.5,z-60],[x0+SIZE+200,z+40]],h:150,hw:380,name:'The Ferrous Mountains',fixed:true,notchX:px_};}
  function rvSpines(){
    if(RV.spines)return RV.spines;
    const sp=[];landMasses().forEach((m,k)=>{const s=rvHorseshoe(m,SEED+k*17);if(s.pts.length>=2){s.mass=k;s.nat=m.nat;sp.push(s);}});
    sp.push(rvFerrous());
    for(const s of sp){let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(const p of s.pts){x0=Math.min(x0,p[0]);z0=Math.min(z0,p[1]);x1=Math.max(x1,p[0]);z1=Math.max(z1,p[1]);}s.bb=[x0-s.hw-80,z0-s.hw-80,x1+s.hw+80,z1+s.hw+80];}
    RV.spines=sp;return sp;
  }
  // the basin's floor and the valley out through the gap, as a factor on the land's base height (1 = untouched)
  function basinAt(x,z){
    const sp=rvSpines();let f=1;
    for(const s of sp){const B=s.basin;if(!B)continue;const qx=x-B.x,qz=z-B.z;if(Math.abs(qx)>B.R*2.4||Math.abs(qz)>B.R*2.4)continue;
      const d=Math.hypot(qx,qz);const t=(qx*B.dx+qz*B.dz)/B.R,u=Math.abs(-qx*B.dz+qz*B.dx)/B.R;
      if(t<0){if(d<B.R*1.3)f*=1-sstep(B.R*1.3,B.R*.6,d)*.5;}
      else if(t<2.2)f*=1-sstep(1.0,.35,u)*(.5+.15*Math.min(1,t))*(1-sstep(1.6,2.2,t));}
    if(f<1){const i=Math.floor(x/SIZE),j=Math.floor(z/SIZE);if(i===HOME_I&&j===HOME_J)return 1;}
    return f;
  }
  // the peaks along the spines, one every 600u or so; a cell names those that fall in it (genCellData)
  function spinePeaks(){
    if(RV.peaks)return RV.peaks;
    const out=[];rvSpines().forEach((s,si)=>{let acc=0,next=300,k=0;
      for(let i=1;i<s.pts.length;i++){const a=s.pts[i-1],b=s.pts[i];const d=Math.hypot(b[0]-a[0],b[1]-a[1]);
        while(next<=acc+d){const u=(next-acc)/d;const x=a[0]+(b[0]-a[0])*u,z=a[1]+(b[1]-a[1])*u;const ci=Math.floor(x/SIZE),cj=Math.floor(z/SIZE);
          if(!(ci===HOME_I&&cj===HOME_J)&&isLandCell(ci,cj)&&seaBare(x,z,[])<.3)out.push({x,z,i:ci,j:cj,k:out.length,r:180+cellHash(si,k,77)*80,h:40+cellHash(si,k,78)*45});
          next+=600;k++;}
        acc+=d;}});
    RV.peaks=out;return out;
  }
  const RVG=new Map();const RVSG=160;                          // the carve grid: bucket → [{rv,i0,i1}|{lk}]
  function rvgAdd(x0,z0,x1,z1,fn){for(let gz=Math.floor(z0/RVSG);gz<=Math.floor(z1/RVSG);gz++)for(let gx=Math.floor(x0/RVSG);gx<=Math.floor(x1/RVSG);gx++){const k=sgKey(gx,gz);let a=RVG.get(k);if(!a){a=[];RVG.set(k,a);}fn(a,k);}}
  function rvgRiver(rv){const P=rv.pts,WS=rv.ws;const seen=new Map();
    for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];const reach=Math.max(WS[i],WS[i+1])+64;
      rvgAdd(Math.min(a[0],b[0])-reach,Math.min(a[1],b[1])-reach,Math.max(a[0],b[0])+reach,Math.max(a[1],b[1])+reach,(arr,k)=>{let e=seen.get(k);if(!e){e={rv,i0:i,i1:i};seen.set(k,e);arr.push(e);}else{if(i<e.i0)e.i0=i;if(i>e.i1)e.i1=i;}});}}
  function rvgLake(lk){const reach=lk.r+Math.max(lk.blend||60,160);rvgAdd(lk.x-reach,lk.z-reach,lk.x+reach,lk.z+reach,arr=>arr.push({lk}));}
  const _rs=[0,0];
  const rvDepth=w=>-(2.2+.18*w);                             // a routed channel's bed by its half-width: −3.1 at 10u wide, −3.6 at 16u, −4.5 at 25u
  function riverSample(rv,i0,i1,x,z,out){ // the nearest distance to the reach's segments i0..i1, and the half-width there
    const P=rv.pts,WS=rv.ws;let best=1e9,bw=0;
    for(let i=i0;i<=i1;i++){const a=P[i],b=P[i+1];
      if(x<Math.min(a[0],b[0])-90||x>Math.max(a[0],b[0])+90||z<Math.min(a[1],b[1])-90||z>Math.max(a[1],b[1])+90)continue;
      const vx=b[0]-a[0],vz=b[1]-a[1],l2=vx*vx+vz*vz||1;let t=((x-a[0])*vx+(z-a[1])*vz)/l2;t=t<0?0:t>1?1:t;
      const d=Math.hypot(x-(a[0]+vx*t),z-(a[1]+vz*t));if(d<best){best=d;bw=WS[i]*(1-t)+WS[i+1]*t;}}
    out[0]=best;out[1]=bw;}
  function rvNearest(rv,x,z){ // the nearest point of a piece's centreline, its half-width and the flow's direction there (not hot: allocates)
    const P=rv.pts,WS=rv.ws;let best=1e9,out=null;
    for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];const vx=b[0]-a[0],vz=b[1]-a[1],l2=vx*vx+vz*vz||1;let t=((x-a[0])*vx+(z-a[1])*vz)/l2;t=t<0?0:t>1?1:t;
      const qx=a[0]+vx*t,qz=a[1]+vz*t;const d=Math.hypot(x-qx,z-qz);if(d<best){best=d;const L=Math.sqrt(l2);out={d,w:WS[i]*(1-t)+WS[i+1]*t,px:qx,pz:qz,tx:vx/L,tz:vz/L};}}
    return out||{d:1e9,w:0,px:x,pz:z,tx:1,tz:0};
  }
  function rvChaikin(pts,n){let p=pts;for(let k=0;k<n;k++){if(p.length<3)return p;const o=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25]);o.push([a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}o.push(p[p.length-1]);p=o;}return p;}
  function routeWorld(){
    if(RV.ready||RV.routing)return;RV.routing=true;const t0=performance.now();
    const W=SIZE*GRID,STEP=RV_STEP,N=Math.round(W/STEP);
    const cells=[];for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++)cells.push(getCell(i,j));
    const lentP=[];for(const c of cells){if(LOADED.has(cellKey(c.i,c.j)))continue;for(const p of c.peaks){PEAKS.push(p);lentP.push(p);}}
    // ── the lattice: the real height (ranges, peaks, the basin), the sea where it is under half a unit ──
    const H=new Float32Array(N*N),raw=new Float32Array(N*N),sea=new Uint8Array(N*N),home=new Uint8Array(N*N),lk0=new Uint8Array(N*N);
    for(let b=0;b<N;b++)for(let a=0;a<N;a++){const n=b*N+a;const x=(a+.5)*STEP,z=(b+.5)*STEP;const i=Math.floor(x/SIZE),j=Math.floor(z/SIZE);home[n]=(i===HOME_I&&j===HOME_J)?1:0;let h=landH(x,z);if(h<.5){sea[n]=1;h=-5;}raw[n]=h;H[n]=h;}
    for(const p of lentP){const i=PEAKS.indexOf(p);if(i>=0)PEAKS.splice(i,1);}
    const tLat=performance.now()-t0;
    const xz=n=>[((n%N)+.5)*STEP,(((n/N)|0)+.5)*STEP];
    const nodeAt=(x,z)=>{const a=Math.floor(x/STEP),b=Math.floor(z/STEP);return (a<0||b<0||a>=N||b>=N)?-1:b*N+a;};
    // the basin lakes, authored: a sink the ring drains into, so the great river leaves it through the gap
    const lakes=[];
    for(const s of rvSpines()){const B=s.basin;if(!B)continue;const lk={x:B.x,z:B.z,r:B.lakeR,depth:-4,blend:120,basin:true,routed:true};lakes.push(lk);
      for(let b=Math.floor((B.z-B.lakeR)/STEP);b<=Math.floor((B.z+B.lakeR)/STEP);b++)for(let a=Math.floor((B.x-B.lakeR)/STEP);a<=Math.floor((B.x+B.lakeR)/STEP);a++){if(a<0||b<0||a>=N||b>=N)continue;const n=b*N+a;if(sea[n]||home[n])continue;const [x,z]=xz(n);if(Math.hypot(x-B.x,z-B.z)<B.lakeR){H[n]=-4;raw[n]=-4;lk0[n]=1;}}}
    // the settlements stand in the way: every pad is raised, so a channel bends round it instead of running through
    const sites=[];for(const c of cells)for(const t of c.sites){if(t.pad>0&&t.kind!=='portal'&&t.kind!=='bridge')sites.push(t);}
    for(const t of sites){const R=t.pad+90;for(let b=Math.floor((t.z-R)/STEP);b<=Math.floor((t.z+R)/STEP);b++)for(let a=Math.floor((t.x-R)/STEP);a<=Math.floor((t.x+R)/STEP);a++){if(a<0||b<0||a>=N||b>=N)continue;const n=b*N+a;if(sea[n]||lk0[n])continue;const [x,z]=xz(n);const d=Math.hypot(x-t.x,z-t.z);if(d<R)H[n]+=14*sstep(R,t.pad*.5,d);}}
    // ── priority flood (Barnes 2014): a surface with no pits, every land node draining to the sea ──
    const heap=[];const push=(n,h)=>{heap.push([h,n]);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
    const pop=()=>{const top=heap[0];const last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let s=i;if(l<heap.length&&heap[l][0]<heap[s][0])s=l;if(r<heap.length&&heap[r][0]<heap[s][0])s=r;if(s===i)break;[heap[s],heap[i]]=[heap[i],heap[s]];i=s;}}return top;};
    const done=new Uint8Array(N*N);const order=new Int32Array(N*N);let no=0;
    for(let n=0;n<N*N;n++)if(sea[n]){done[n]=1;push(n,H[n]);}
    const NB=[-1,1,-N,N,-N-1,-N+1,N-1,N+1];const NA=[-1,1,0,0,-1,1,-1,1],NBb=[0,0,-1,1,-1,-1,1,1];
    while(heap.length){const [h,n]=pop();order[no++]=n;const a=n%N,b=(n/N)|0;
      for(let k=0;k<8;k++){const na=a+NA[k],nb=b+NBb[k];if(na<0||nb<0||na>=N||nb>=N)continue;const m=n+NB[k];if(done[m])continue;done[m]=1;if(H[m]<=h)H[m]=h+1e-3;push(m,H[m]);}}
    // flow direction: steepest descent on the filled surface; accumulation, highest first
    const down=new Int32Array(N*N).fill(-1);
    for(let b=0;b<N;b++)for(let a=0;a<N;a++){const n=b*N+a;if(sea[n])continue;let best=-1,bs=0;
      for(let k=0;k<8;k++){const na=a+NA[k],nb=b+NBb[k];if(na<0||nb<0||na>=N||nb>=N)continue;const m=n+NB[k];const s=(H[n]-H[m])/(k<4?1:1.4142);if(s>bs){bs=s;best=m;}}
      down[n]=best;}
    const acc=new Float32Array(N*N).fill(1);
    for(let k=no-1;k>=0;k--){const n=order[k];if(sea[n]||home[n])continue;const d=down[n];if(d>=0&&!home[d])acc[d]+=acc[n];}
    // lakes: where the flood raised the ground more than a little (and the authored basin lakes); only a pit a river
    // flows into is kept as a lake (the rest are ponds the hills' noise makes, 800 of them), decided once the reaches are traced
    const lake=new Uint8Array(N*N);for(let n=0;n<N*N;n++)if(!sea[n]&&!home[n]&&(lk0[n]||H[n]-raw[n]>2.5))lake[n]=1;
    const blobOf=new Int32Array(N*N).fill(-1);const blobs=[];
    {const seen=new Uint8Array(N*N);for(let s=0;s<N*N;s++){if(!lake[s]||seen[s]||lk0[s])continue;let sx=0,sz=0,size=0;const st=[s];seen[s]=1;let touches=false;const id=blobs.length;
      while(st.length){const m=st.pop();size++;blobOf[m]=id;const [x,z]=xz(m);sx+=x;sz+=z;const a=m%N,b=(m/N)|0;for(let k=0;k<4;k++){const na=a+NA[k],nb=b+NBb[k];if(na<0||nb<0||na>=N||nb>=N)continue;const t=m+NB[k];if(lk0[t])touches=true;if(lake[t]&&!seen[t]){seen[t]=1;st.push(t);}}}
      blobs.push({x:sx/size,z:sz/size,size,touches,inflow:0});}}
    // ── channels: a reach from a source or a junction down to the next junction, a lake or the sea ──
    const chan=new Uint8Array(N*N);for(let n=0;n<N*N;n++)if(!sea[n]&&!home[n]&&acc[n]>=RV_T&&!lake[n])chan[n]=1;
    const upc=new Uint8Array(N*N);for(let n=0;n<N*N;n++)if(chan[n]&&down[n]>=0&&chan[down[n]])upc[down[n]]++;
    const reaches=[];
    for(let n=0;n<N*N;n++){if(!chan[n]||upc[n]===1)continue;
      let m=n;const pts=[],ws=[];let end=null,endNode=-1;
      for(let guard=0;guard<6000;guard++){pts.push(xz(m));ws.push(rvWidth(acc[m]));const d=down[m];
        if(d<0||sea[d]||lake[d]){end=d<0?'sink':sea[d]?'sea':'lake';if(d>=0){pts.push(xz(d));ws.push(rvWidth(acc[m]));endNode=d;}break;}
        if(!chan[d]){end='sink';pts.push(xz(d));ws.push(rvWidth(acc[m]));break;}
        m=d;if(upc[m]>=2){pts.push(xz(m));ws.push(ws[ws.length-1]);end='join';break;}} /* a tributary keeps its own width to the junction */
      reaches.push({pts,ws,acc:acc[m],end,src:n,last:m,endNode});}
    for(const r of reaches){if(r.end==='lake'&&r.endNode>=0&&blobOf[r.endNode]>=0)blobs[blobOf[r.endNode]].inflow++;}
    for(const b of blobs){if(b.size<3||b.touches||!b.inflow)continue;const r=Math.max(50,Math.min(900,Math.sqrt(b.size*STEP*STEP/Math.PI)*1.15));lakes.push({x:b.x,z:b.z,r,depth:-4,blend:60,routed:true});}
    // the great rivers: the mouths with the largest catchment, each nation's four at most, the stem traced upstream by the larger branch
    const mouths=reaches.filter(r=>r.end==='sea').sort((a,b)=>b.acc-a.acc);
    const upOf={};for(const r of reaches){(upOf[r.last]=upOf[r.last]||[]).push(r);}
    const great=[];const perNat={};
    for(const mo of mouths){if(mo.acc*STEP*STEP<3e6)break;const [si,sj]=cellOf(...xz(mo.src));const nat=nationKeyOf(si,sj);perNat[nat]=(perNat[nat]||0);if(perNat[nat]>=4)continue;
      const name=(RIVER_NAMES[nat]||RIVER_NAMES.gatelands)[perNat[nat]%6];perNat[nat]++;const stem=[mo];let cur=mo;
      for(let g=0;g<80;g++){const ups=(upOf[cur.src]||[]).filter(r=>r!==cur&&r.last===cur.src);if(!ups.length)break;ups.sort((a,b)=>b.acc-a.acc);cur=ups[0];stem.push(cur);}
      for(const r of stem)r.name=name;let len=0;for(const r of stem)len+=r.pts.reduce((s,p,i)=>i?s+Math.hypot(p[0]-r.pts[i-1][0],p[1]-r.pts[i-1][1]):0,0);
      great.push({name,nat,mouth:mo.pts[mo.pts.length-1],area:mo.acc*STEP*STEP,wMouth:rvWidth(mo.acc),len,reaches:stem.length,forkAt:stem.length>1?stem[0].pts[0]:null,stem});}
    // a delta for each nation's largest: the last stretch fans into two distributaries
    const seenNat={};for(const g of great){if(seenNat[g.nat]||g.area<6e6)continue;seenNat[g.nat]=1;const stem=g.stem[0].pts;const n=stem.length;if(n<6)continue;const k=Math.max(0,n-9);const a=stem[k],b=stem[n-1];
      const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1;const ux=dx/L,uz=dz/L;g.delta=[];
      for(const side of [-1,1]){const ang=side*.42;const cx=Math.cos(ang),sx=Math.sin(ang);const vx=ux*cx-uz*sx,vz=ux*sx+uz*cx;const pts=[a];let x=a[0],z=a[1];
        for(let s=0;s<40;s++){x+=vx*45+(side*uz)*Math.sin(s*.3)*8;z+=vz*45-(side*ux)*Math.sin(s*.3)*8;pts.push([x,z]);const nn=nodeAt(x,z);if(nn<0||sea[nn])break;}
        if(pts.length>=3){const w=g.wMouth*.55;reaches.push({pts,ws:pts.map(()=>w),acc:0,end:'sea',src:-1,last:-1,endNode:-1,name:g.name,arm:true});g.delta.push(pts);}}}
    // ── into the cells: each reach smoothed and cut at the cell borders; the pieces carry their width per point ──
    for(const c of cells){if(!c.home){c.rivers=[];c.lakes=[];}}
    const halfW=w=>w*.5;
    let pieces=0;
    for(const r of reaches){const P=rvChaikin(r.pts,1);const WS=[];for(let i=0;i<P.length;i++){const u=i/(P.length-1)*(r.ws.length-1);const k=Math.min(r.ws.length-2,Math.floor(u)),f=u-k;WS.push(halfW(r.ws[k]*(1-f)+r.ws[k+1]*f));}
      let start=0;let [ci,cj]=cellOf(P[0][0],P[0][1]);
      const cut=(i0,i1,i,j)=>{if(i1-i0<1)return;const c=CELLS.get(cellKey(i,j));if(!c||c.home)return;const pts=P.slice(i0,i1+1),ws=WS.slice(i0,i1+1);const wmax=Math.max(...ws);
        c.rivers.push({id:`c${i}_${j}_rv${c.rivers.length}`,pts,ws,w:wmax,name:r.name||null,nav:wmax*2>=RV_NAV,end:r.end,arm:!!r.arm});pieces++;};
      for(let i=1;i<P.length;i++){const [ni,nj]=cellOf(P[i][0],P[i][1]);if(ni!==ci||nj!==cj){cut(start,i,ci,cj);start=i;ci=ni;cj=nj;}}
      cut(start,P.length-1,ci,cj);}
    for(const lk of lakes){const [i,j]=cellOf(lk.x,lk.z);const c=CELLS.get(cellKey(i,j));if(!c||c.home)continue;const rl=cellRng(i,j,41+c.lakes.length);lk.id=`c${i}_${j}_lk${c.lakes.length}`;lk.name=LAKE_FORM[formReg(c.reg,i,j)](genName(rl,c.reg));c.lakes.push(lk);}
    // ── the carve grid: every piece and lake of every cell, the home's authored ones too ──
    RVG.clear();
    for(const c of cells){for(const rv of c.rivers){if(!rv.ws)rv.ws=rv.pts.map(()=>rv.w);rvgRiver(rv);}for(const lk of c.lakes)rvgLake(lk);}
    shoreSites(cells);
    // the bank towns (S433): a settlement within a short walk of navigable water keeps the nearest point of the channel,
    // the way to it and the flow's direction there, and the settlement builder puts a quay on that bank
    const navPieces=[];for(const c of cells)for(const rv of c.rivers){if(!rv.nav||rv.arm)continue;let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(const p of rv.pts){if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<z0)z0=p[1];if(p[1]>z1)z1=p[1];}navPieces.push({rv,bb:[x0,z0,x1,z1]});}
    let banks=0;for(const t of sites){t.bank=null;if(t.kind==='port'||!['city','town','village','garrison','outpost'].includes(t.kind))continue;const R=t.pad+220;let best=null;
      for(const q of navPieces){if(t.x<q.bb[0]-R||t.x>q.bb[2]+R||t.z<q.bb[1]-R||t.z>q.bb[3]+R)continue;const nr=rvNearest(q.rv,t.x,t.z);if(nr.w*2<RV_NAV||nr.d>=R||nr.d-nr.w<t.pad*.8)continue;if(!best||nr.d<best.d)best=nr;}
      if(best){const dx=best.px-t.x,dz=best.pz-t.z,L=Math.hypot(dx,dz)||1;t.bank={dx:dx/L,dz:dz/L,tx:best.tx,tz:best.tz,w:best.w,d:best.d};banks++;}}
    // a navigable reach: the ship can enter from the sea; the sailable length is the sum of reaches sixteen wide or more
    let navLen=0,navMouths=0;for(const r of reaches){if(r.arm)continue;const w=r.ws[r.ws.length-1];if(w>=RV_NAV){navLen+=r.pts.reduce((s,p,i)=>i?s+Math.hypot(p[0]-r.pts[i-1][0],p[1]-r.pts[i-1][1]):0,0);if(r.end==='sea')navMouths++;}}
    RV.reaches=reaches;RV.great=great;RV.lakes=lakes;RV.N=N;RV.STEP=STEP;
    RV.stats={ms:Math.round(performance.now()-t0),latticeMs:Math.round(tLat),nodes:N*N,land:Array.from(sea).reduce((s,v)=>s+(v?0:1),0),reaches:reaches.length,mouths:mouths.length,sinks:reaches.filter(r=>r.end==='sink').length,joins:reaches.filter(r=>r.end==='join').length,toLake:reaches.filter(r=>r.end==='lake').length,great:great.length,deltas:great.filter(g=>g.delta&&g.delta.length).length,lakes:lakes.length,navMouths,navLen:Math.round(navLen),pieces,sites:sites.length,banks};
    RV.ready=true;RV.routing=false;
    dryDoors();
  }
  // v80 S447 — a generated gate is never drawn into a lake, a river or the surf, and whether it stands is one answer for the
  // whole game. Its cell drew it before the rivers were routed, so 48 of 392 gates stood under 1.5 (33 under water) and
  // placeDoor refused them by the ground it read at load, which moved with whatever cells and stamps were loaded (Session 445).
  // Once the carve is known, a gate on ground under 1.5 is drawn again in its own cell from a stream of its own (no other
  // draw moves) onto ground of 1.8 or more, clear of the pads and the sea as the cell's draw keeps it; with none in 24 tries it is wet
  // and is never built or named. The ground is the bare land (the routing's: no cell's regions), so no load order can change it.
  function doorGround(x,z){const was=RV.routing;RV.routing=true;const h=rawH(x,z);RV.routing=was;return h;}
  // v80 S452 — a place the lakes were laid over moves to the shore (Michael's A on #121). Its cell drew it before the routing,
  // and the basin lakes (and a few rivers) took the ground all round it: 42 places stood on their pad's plug with no way out
  // but swimming. Once the carve is known, a place is cut off when no straight line from its pad's edge out to three pads
  // stays dry on any of 24 bearings. It is set down at the nearest spot in its own cell where the pad and a ring 30 beyond it
  // stand on dry bare land (1.5 or more, the centre 1.8), off the sea, clear of every other pad by 40 and of the gates by the
  // cell's own margins; the search walks out from where it stood, so the first spot is the near shore. Id, name and kind
  // are kept, and so is everything keyed by id (roads, saves, the town's state); a lair's cavern door moves with it. The
  // bare land is the routing's (no cell's regions), so every boot moves the same places to the same spots.
  function shoreCutOff(t){const R0=t.pad*1.2;
    for(let k=0;k<24;k++){const a=k/24*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);let dry=true;
      for(let f=0;f<=4&&dry;f++){const r=R0+(t.pad*3-R0)*f/4;if(doorGround(t.x+ca*r,t.z+sa*r)<SEA_Y+.3)dry=false;}if(dry)return false;}
    return true;}
  function shoreSpotOk(t,c,x,z){const m=Math.max(150,t.pad+40);
    if(x<c.ox+m||x>c.ox+SIZE-m||z<c.oz+m||z>c.oz+SIZE-m)return false;
    if(seaBare(x,z,c.islets)>=.08||doorGround(x,z)<1.8)return false;
    for(const s of c.sites){if(s===t||!(s.pad>0)||s.kind==='portal')continue;if(Math.hypot(s.x-x,s.z-z)<s.pad+t.pad+40)return false;}
    for(const e of c.doors){if(e.wet||(e.lairDoor&&e.lairSite===t.id))continue;if(Math.hypot(e.x-x,e.z-z)<t.pad+(e.kind==='fort_door'?110:60))return false;}
    for(const R of [t.pad*.5,t.pad,t.pad+30])for(let k=0;k<16;k++){const a=k/16*Math.PI*2;if(doorGround(x+Math.cos(a)*R,z+Math.sin(a)*R)<1.5)return false;}
    return true;}
  function shoreSites(cells){let moved=0,stuck=0;const list=[];
    for(const c of cells){if(c.home||c.type==='sea')continue;
      for(const t of c.sites){if(!(t.pad>0)||t.islet||t.drawnAt||['port','portal','bridge'].includes(t.kind))continue;if(!shoreCutOff(t))continue;
        const a0=(nameHash(t.id)%360)*Math.PI/180;let got=null;
        for(let r=20;r<=1600&&!got;r+=20){const n=Math.max(12,Math.round(r/20));for(let k=0;k<n;k++){const a=a0+k/n*Math.PI*2,x=t.x+Math.cos(a)*r,z=t.z+Math.sin(a)*r;if(shoreSpotOk(t,c,x,z)){got={x,z};break;}}}
        if(!got){stuck++;t.cutOff=true;continue;}
        const dx=got.x-t.x,dz=got.z-t.z;t.drawnAt={x:t.x,z:t.z};t.x=got.x;t.z=got.z;moved++;list.push({id:t.id,from:t.drawnAt,dx,dz,pad:t.pad});
        for(const e of c.doors)if(e.lairDoor&&e.lairSite===t.id){e.x+=dx;e.z+=dz;}}}
    RV.shore={moved,stuck,list};}
  // S455 — a save made standing in a place the routing moved (on its pad, at its gate, or behind one of its doors) reads
  // ground that is now open water. The place moved whole, so the spot moves with it: within 1.5 pads of where the place
  // was drawn, a position in the water is carried by the place's own offset. Anywhere else, or on dry ground, null.
  function movedPlaceAt(x,z){if(!RV.ready)routeWorld();const L=RV.shore&&RV.shore.list;if(!L)return null;
    for(const m of L){if(Math.hypot(x-m.from.x,z-m.from.z)>m.pad*1.5)continue;if(worldH(x,z)>=.5)return null;return m;}
    return null;}
  function dryDoors(){
    for(const c of CELLS.values()){if(c.home||!c.doors)continue;
      c.doors.forEach((e,n)=>{if(e.zone!=='gen'||e.lairDoor||e.cell!==cellKey(c.i,c.j)||e.wet)return;if(doorGround(e.x,e.z)>=1.5)return;
        const fort=e.kind==='fort_door',r=cellRng(c.i,c.j,300+n);
        for(let t=0;t<24;t++){const x=c.ox+200+r()*(SIZE-400),z=c.oz+200+r()*(SIZE-400);
          if(c.sites.some(s=>s.pad>0&&Math.hypot(s.x-x,s.z-z)<s.pad+(fort?110:60))||seaBare(x,z,c.islets)>=.1||doorGround(x,z)<1.8)continue;
          e.drawnAt={x:e.x,z:e.z};e.x=x;e.z=z;return;}
        e.wet=true;});}
  }



  // ── stamp spatial grid (worldH is called a lot) ──
  const SGRID=new Map();const STAMP_G=160;
  function sgKey(gx,gz){return gx*100003+gz;}
  function stampsNear(x,z){return SGRID.get(sgKey(Math.floor(x/STAMP_G),Math.floor(z/STAMP_G)))||[];}
  function sgAdd(s){const R=s.r+s.blend;for(let gz=Math.floor((s.z-R)/STAMP_G);gz<=Math.floor((s.z+R)/STAMP_G);gz++)for(let gx=Math.floor((s.x-R)/STAMP_G);gx<=Math.floor((s.x+R)/STAMP_G);gx++){const k=sgKey(gx,gz);let a=SGRID.get(k);if(!a){a=[];SGRID.set(k,a);}a.push(s);}}
  function sgRemove(s){const R=s.r+s.blend;for(let gz=Math.floor((s.z-R)/STAMP_G);gz<=Math.floor((s.z+R)/STAMP_G);gz++)for(let gx=Math.floor((s.x-R)/STAMP_G);gx<=Math.floor((s.x+R)/STAMP_G);gx++){const a=SGRID.get(sgKey(gx,gz));if(a){const i=a.indexOf(s);if(i>=0)a.splice(i,1);}}}

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
      ()=>{c.regions.forEach(r_=>REGIONS.push(r_));c.peaks.forEach(p=>PEAKS.push(p));c.lakes.forEach(l=>LAKES.push(l));c.rivers.forEach(rv=>RIVERS.push(rv));(c.inlets||[]).forEach(inl=>INLETS.push(inl));try{refreshChunksNearWater([...(c.inlets||[]),...c.peaks]);}catch(e){console.warn('refresh',e);}
           c.sites.forEach(t=>{SITES.push(t);SITE[t.id]=t;});if(c.home&&SITE.ashenmoor){ASH_X=SITE.ashenmoor.x;ASH_Z=SITE.ashenmoor.z;}c.sites.forEach(t=>{if(t.pad>0){const s=addStamp({id:'site_'+t.id,kind:'site',port:t.kind==='port',x:t.x,z:t.z,r:t.kind==='port'?t.pad*.72:t.pad,blend:t.kind==='port'?t.pad*.3:Math.max(30,t.pad*.7),y:t.kind==='port'?Math.max(SEA_Y+1.3,Math.min(landH(t.x,t.z),3.0)):Math.max(SEA_Y+1.6,landH(t.x,t.z))});L.stamps.push(s);}});
           // ports: the shore shelf that meets the quay, stamped now so the chunks are built with it
           c.sites.forEach(t=>{if(t.kind!=='port')return;const sd=shoreDir(t);if(!sd)return;let x=t.x+sd.dx*t.pad,z=t.z+sd.dz*t.pad,n=0;while(worldH(x,z)>1.3&&n<80){x+=sd.dx*3;z+=sd.dz*3;n++;}t.quayStart={x,z};const q=addStamp({id:'quay_'+t.id,kind:'door',x:x-sd.dx*6,z:z-sd.dz*6,r:9,blend:16,y:1.05,cell:cellKey(c.i,c.j)});L.stamps.push(q);
             // the shipwright's own flat pad at the quay head
             const lx=x-sd.dx*9-sd.dz*11,lz=z-sd.dz*9+sd.dx*11;t.shipwrightLot={x:lx,z:lz};const q2=addStamp({id:'swpad_'+t.id,kind:'door',x:lx,z:lz,r:8,blend:12,y:1.05,cell:cellKey(c.i,c.j)});L.stamps.push(q2);});
           // S433 — a bank town's quay spot: the water line below the pad, found now; a stamp there clears the trees and rocks off the bank without flattening it
           c.sites.forEach(t=>{if(!t.bank||t.kind==='port')return;const B=t.bank;let x=t.x+B.dx*t.pad,z=t.z+B.dz*t.pad,n=0;while(worldH(x,z)>1.3&&n<160){x+=B.dx*2;z+=B.dz*2;n++;}if(n>=160)return;let wx=x,wz=z;n=0;while(worldH(wx,wz)>0&&n<40){wx+=B.dx;wz+=B.dz;n++;}if(Math.hypot(wx-x,wz-z)>30)return;
             t.quaySpot={x:wx,z:wz};const qs=addStamp({id:'rquay_'+t.id,kind:'door',noFlat:true,x:wx-B.dx*5,z:wz-B.dz*5,r:17,blend:2,y:1.05,cell:cellKey(c.i,c.j)});L.stamps.push(qs);});},
      ()=>{c.roadDefs.forEach(def=>{const rd=buildRoad(def);if(rd){rd.cell=k;L.roads.push(rd);}});try{track(()=>buildBridges(c,k,L));}catch(e){console.warn('bridges',e);}},
      ()=>{solStart=STATIC_SOL.length;c.doors.forEach(e=>{const w=placeDoor(e,k);if(w)L.doorSeeds.push(e.seed);});c.doors.forEach(e=>{if(e.kind==='fort_door'&&dungeonWorldPos[e.seed])addFortSpur(e,k);});L.stamps.push(...STAMPS.filter(s=>s.cell===k&&s.kind==='door'));try{L.cleared=clearScatterUnder(L.stamps);}catch(e){console.warn('clear',e);}},
      ()=>track(()=>buildImpostorsFor(c)),
      ()=>track(()=>buildFarFor(c)),
      ()=>{for(let n=solStart;n<STATIC_SOL.length;n++)STATIC_SOL[n].cell=k;L.pending=false;if(c.home)homeLoaded();},
    ];
    return steps;
  }
