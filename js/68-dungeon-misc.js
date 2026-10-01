
// ── RESPAWN ───────────────────────────────────────────────────
// v80 — light pools for non-world scenes: a fixed set of lights per scene; every other PointLight becomes a virtual
// source that follows its parent, and the nearest sources are mapped onto the pool before each render.
const _LPS=new Map();
function _sweepScenePool(scene){
  let P=_LPS.get(scene);if(!P){P={pool:[],src:[],set:new Set()};for(let i=0;i<20;i++){const L=new THREE.PointLight(0xffffff,0,10);L.position.set(0,-100,0);scene.add(L);P.pool.push(L);P.set.add(L);}_LPS.set(scene,P);}
  const found=[];scene.traverse(o=>{if(o.isPointLight&&!P.set.has(o))found.push(o);});
  for(const l of found){const par=l.parent;if(l._swept&&l._sweptScene===scene&&P.src.includes(l._swept)){par&&par.remove(l);continue;}const v={mirror:l,follow:(par&&par!==scene)?par:null,offset:l.position.clone(),pos:new THREE.Vector3(),loose:!(par&&par!==scene)};l.getWorldPosition(v.pos);P.src.push(v);par&&par.remove(l);l._swept=v;l._sweptScene=scene;}
  const inScene=(o)=>{let p=o;while(p){if(p===scene)return true;p=p.parent;}return false;};
  const cand=[];const wp=new THREE.Vector3();
  for(let i=P.src.length-1;i>=0;i--){const v=P.src[i];const m=v.mirror;if(v.follow){if(!inScene(v.follow)){P.src.splice(i,1);continue;}v.follow.getWorldPosition(wp);wp.add(v.offset);v.pos.copy(wp);}else v.pos.copy(m.position);
    if(m.intensity<=0){v._z=(v._z||0)+1;if(v._z>600){P.src.splice(i,1);}continue;}v._z=0;const d=Math.hypot(v.pos.x-px,v.pos.z-pz);if(d>m.distance+60)continue;cand.push([d,v]);}
  cand.sort((a,b)=>a[0]-b[0]);
  for(let i=0;i<P.pool.length;i++){const L=P.pool[i];const c=cand[i];if(!c){L.intensity=0;continue;}const v=c[1],m=v.mirror;L.position.copy(v.pos);L.color.copy(m.color);L.intensity=m.intensity;L.distance=m.distance||10;}
}
// v80 — look-at looting: a container counts only when it's under the crosshair (within ~14°) and within reach (3u)
const _laDir=new THREE.Vector3(),_laTo=new THREE.Vector3();const _ray=new THREE.Raycaster();
// aimAt: true when the crosshair ray hits this object's mesh within reach — the interaction is the mesh, not an area
function aimAt(obj,reach){const m=obj&&(obj.mesh||obj.g||obj.group||obj.obj);if(!m)return false;CAM.getWorldDirection(_laDir);_ray.set(CAM.position,_laDir);_ray.camera=CAM;const _tpb=thirdPerson?TP.dist:0;_ray.far=(reach||3.2)+_tpb;_ray.near=Math.max(0,_tpb-.35);const hits=_ray.intersectObject(m,true);return hits.length>0;}
function lookingAt(c,reach){const dx=c.x-px,dz=c.z-pz,dh=Math.hypot(dx,dz);if(dh>(reach||3.0))return false;if(c.mesh||c.g||c.group)return aimAt(c,(reach||3.0)+.6); // the mesh itself when there is one
  const floorY=(activeZoneId!=='world')?(currentFloor===2?FLOOR2_Y:0):((typeof WORLD!=='undefined')?WORLD.worldH(c.x,c.z):0);const cy=floorY+(c.y!=null?c.y:0.45);
  CAM.getWorldDirection(_laDir);_laTo.set(c.x-CAM.position.x,cy-CAM.position.y,c.z-CAM.position.z);const len=_laTo.length();if(len<.001)return true;_laTo.multiplyScalar(1/len);return _laTo.dot(_laDir)>0.96;}
function lootTargetNow(){try{
  if(activeZoneId==='world'){const c=ZONE_CORPSES.find(c=>c.zone===activeZoneId&&c.items&&c.items.length>0&&lookingAt(c));if(c)return c;}
  else{const c=CORPSES.find(c=>!c.looted&&c.items&&c.items.length&&lookingAt(c));if(c)return c;const ch=CHESTS.find(c=>c.floor===currentFloor&&(!c.opened||c.items.length>0)&&lookingAt(c));if(ch)return ch;const b=(typeof BARRELS!=='undefined')?BARRELS.find(b=>b.floor===currentFloor&&(!b.opened||(b.items&&b.items.length>0))&&lookingAt(b,2.6)):null;if(b)return b;}
}catch(e){}return null;}
function emptyTargetNow(){try{const any=(activeZoneId==='world')?ZONE_CORPSES.filter(c=>c.zone===activeZoneId):[...CORPSES,...CHESTS.filter(c=>c.floor===currentFloor),...((typeof BARRELS!=='undefined')?BARRELS.filter(b=>b.floor===currentFloor):[])];for(const c of any){const has=c.items&&c.items.length>0&&!(c.looted);if(!has&&lookingAt(c))return c;}}catch(e){}return null;}
function talkTargetNow(){try{if(activeZoneId==='world'){const L=(ZONES.world&&ZONES.world.npcs)||[];return L.find(n=>!n._retreated&&Math.hypot(px-n.g.position.x,pz-n.g.position.z)<3.2&&aimAt(n,3.6))||null;}if(typeof INT_NPCS!=='undefined'){const n=INT_NPCS.find(n=>Math.hypot(px-n.g.position.x,pz-n.g.position.z)<3.2&&aimAt(n,3.6));if(n)return n;}if(typeof intNPCMesh!=='undefined'&&intNPCMesh&&Math.hypot(px-intNPCPos.x,pz-intNPCPos.z)<3.2&&aimAt({g:intNPCMesh},3.6))return {def:{name:''}};}catch(e){}return null;}
function tickCrosshair(){const xh=document.getElementById('xh');if(!xh)return;const t=lootTargetNow();const tk=t?null:talkTargetNow();const kind=t?'loot':tk?'talk':null;if(kind!==xh._k){xh._k=kind;xh.textContent=kind==='loot'?'◇':kind==='talk'?'◦':'+';xh.style.color=kind==='loot'?'#e8c040':kind==='talk'?'#8ad0ff':'';xh.style.fontSize=kind?'22px':'';}xh._t=t;
  let lab=document.getElementById('xh-empty');if(!lab){lab=document.createElement('div');lab.id='xh-empty';lab.style.cssText='position:absolute;left:50%;top:calc(50% + 22px);transform:translateX(-50%);font:12px Georgia,serif;color:#8a7a60;pointer-events:none;display:none;text-shadow:0 1px 2px #000';(xh.parentElement||document.body).appendChild(lab);}
  const em=t?null:emptyTargetNow();if(em){lab.textContent=`${em.displayName||em.name||(em.isEW!=null?'Chest':'Remains')} — empty`;lab.style.display='block';}else lab.style.display='none';}
// ═══ v80 — DUNGEON VARIANCE: a decoration pass after any generator ═══
// Rooms get a type by theme and seed; traps live in corridors; new containers
// join BARRELS so the loot/look-at code sees them. Everything is placed into
// dScene at the floor's base Y and cleaned with the dungeon.
const D_TRAPS=[];
function _dRng(seed){let s=(seed*2654435761)>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function _dBox(w,h,d,col,x,y,z,ry){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:col}));m.position.set(x,y,z);if(ry)m.rotation.y=ry;dScene.add(m);return m;}
function _dCyl(r0,r1,h,col,x,y,z,seg){const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,seg||8),new THREE.MeshLambertMaterial({color:col}));m.position.set(x,y,z);dScene.add(m);return m;}
function _dLoot(kind,r){const L=[];const n=1+Math.floor(r()*3);for(let i=0;i<n;i++){const q=r();if(kind==='urn')L.push(q<.4?{name:'Gold Coins',ico:'●',type:'gold',value:6+Math.floor(r()*20),qty:1}:q<.55?{name:'Lockpick',ico:'🗝',type:'misc',buyPrice:12,sellMult:.4,weight:.05,qty:1+Math.floor(r()*2)}:q<.8?{name:'Health Potion',ico:'🧪',type:'potion',heal:25,buyPrice:18,sellMult:.4,qty:1}:{name:'Old Bones',ico:'🦴',type:'misc',buyPrice:2,sellMult:.5,weight:.4,qty:1});
    else if(kind==='sarcophagus')L.push(q<.35?{name:'Silver Ring',ico:'💍',type:'equip',slot:'ring',def:0,weight:.1,tier:4,material:'Silver',buyPrice:90,sellMult:.5}:q<.7?{name:'Gold Coins',ico:'●',type:'gold',value:20+Math.floor(r()*40),qty:1}:{name:'Grave Dust',ico:'🌿',type:'herb',mana:10,buyPrice:12,sellMult:.6,weight:.1,qty:1});
    else L.push(q<.5?{name:'Iron Sword',ico:'⚔',type:'equip',slot:'weapon',atk:[9,12],weaponShape:'sword',wType:'slash',weight:2,tier:3,material:'Iron',buyPrice:70,sellMult:.4}:q<.8?{name:'Iron Helm',ico:'🪖',type:'equip',slot:'head',def:3,weight:3,tier:3,material:'Iron',buyPrice:60,sellMult:.4}:{name:'Arrows',ico:'➶',type:'misc',buyPrice:1,sellMult:.5,weight:.05,qty:8+Math.floor(r()*10)});}
  return L;}
// S318 — the rooms' containers on the kit (H.7, #46 A): a lathed urn with a lid, a sarcophagus with a carved chest and an effigy
// on its lid, and a timber rack of leaning arms. One bake a kind, shared by every copy; the lid a separate mesh that opens
const D_KIT=new Map();
function _dKitPart(P,geo,col,x,y,z,rx,ry,rz,sx,sy,sz){P.push([geo,new THREE.Color(col),new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(sx||1,sy||sx||1,sz||sx||1))]);}
function _dKit(kind){let k=D_KIT.get(kind);if(k)return k;const A=[],B=[],p=(L,...a)=>_dKitPart(L,...a);
  if(kind==='urn'){const C=0x7e6248,D=0x5a4a3a;
    // a burial urn: foot ring, a full belly, a shoulder, a short neck and a rolled rim; loop handles at the shoulder, a painted band
    A.push([SK.lathe([[.001,0],[.13,0],[.14,.02],[.12,.05],[.17,.14],[.215,.28],[.21,.38],[.17,.48],[.12,.54],[.11,.57],[.13,.6],[.125,.62],[.1,.615],[.1,.56],[.001,.56]],16),new THREE.Color(C),new THREE.Matrix4()]);
    p(A,SK.torus(.214,.012,6,20),D,0,.3,0,Math.PI/2);p(A,SK.torus(.2,.008,6,20),D,0,.4,0,Math.PI/2);
    for(const s of [-1,1])p(A,SK.torus(.065,.017,8,8,Math.PI),new THREE.Color(C).multiplyScalar(.9),s*.175,.44,0,0,0,-s*Math.PI/2);
    // the lid: a low dome with a knob, its skirt inside the neck
    p(B,SK.lathe([[.001,.05],[.03,.05],[.035,.07],[.02,.085],[.001,.09]],10),D,0,0,0);p(B,SK.lathe([[.098,-.025],[.1,0],[.135,.005],[.13,.02],[.09,.045],[.03,.05],[.001,.05]],16),D,0,0,0);
    k={body:dunMerge(A,'urn').geometry,lid:dunMerge(B,'urn').geometry,lidY:.62};}
  else if(kind==='sarcophagus'){const S=0x8a8478,Dk=new THREE.Color(S).multiplyScalar(.82),Lt=new THREE.Color(S).multiplyScalar(1.08);
    // a stepped plinth, the chest with corner pilasters and sunk panels on every face, a moulded cornice
    p(A,SK.rbox(1.02,.1,2.12,.03,1),Dk,0,.05,0);p(A,SK.rbox(.9,.56,2.0,.03,2),S,0,.38,0);p(A,SK.rbox(.96,.06,2.06,.02,1),Lt,0,.63,0);
    for(const sx of [-1,1])for(const sz of [-1,1])p(A,SK.rbox(.1,.56,.1,.02,1),Lt,sx*.44,.38,sz*.99);
    for(const sx of [-1,1])for(let i=0;i<3;i++)p(A,SK.rbox(.02,.34,.5,.01,1),Dk,sx*.451,.37,-.6+i*.6);
    for(const sz of [-1,1])p(A,SK.rbox(.62,.34,.02,.01,1),Dk,0,.37,sz*1.001);
    // the lid: a slab with a moulded edge and a lying effigy, hands folded, head on a cushion, feet to the south
    p(B,SK.rbox(.98,.08,2.08,.025,1),S,0,.04,0);p(B,SK.rbox(.86,.05,1.96,.02,1),Lt,0,.1,0);
    const E=new THREE.Color(0x7a766e);p(B,SK.rbox(.34,.07,.24,.03,2),Dk,0,.155,-.78);p(B,SK.ball(.1,10,8),E,0,.22,-.72,0,0,0,1,.9,1.1);
    p(B,SK.lathe([[.001,0],[.12,.04],[.16,.3],[.15,.7],[.11,1.1],[.08,1.28],[.001,1.3]],12),E,0,.14,-.6,Math.PI/2,0,0,1,1,.5);
    for(const s of [-1,1])p(B,SK.limb(.34,.04,.035),E,s*.13,.2,-.52,-Math.PI/2+.1,0,-s*.3);p(B,SK.ball(.05,8,6),E,0,.24,-.22,0,0,0,1.4,.8,1);
    for(const s of [-1,1])p(B,SK.ball(.05,8,6),E,s*.05,.2,.72,0,0,0,1,1.3,1.4);
    k={body:dunMerge(A,'sarcophagus').geometry,lid:dunMerge(B,'sarcophagus').geometry,lidY:.66};}
  else{const W=0x5a3a1a,Wd=new THREE.Color(W).multiplyScalar(.8),Ir=0xb8bcc4,Gr=0x3a2412,Br=0x8a6a2a;
    // a rack of oak: two uprights on splayed feet, a notched foot rail and a top rail with pegs; two swords, a spear and an axe lean in it
    for(const s of [-1,1]){p(A,SK.rbox(.08,1.5,.08,.015,1),W,s*.6,.75,0);p(A,SK.rbox(.1,.08,.5,.02,1),Wd,s*.6,.04,0);}
    p(A,SK.rbox(1.28,.08,.1,.02,1),W,0,1.46,-.02);p(A,SK.rbox(1.28,.1,.18,.02,1),Wd,0,.3,.06);
    for(let i=0;i<4;i++)p(A,SK.cyl(.015,.015,.12,6),Wd,-.39+i*.26,1.4,.07,Math.PI/2);
    const sword=(x,lean)=>{const L=[];p(L,SK.rbox(.055,.8,.012,.005,1),Ir,0,.55,0);p(L,SK.cone(.028,.08,4),Ir,0,.99,0,0,Math.PI/4,0,1,1,.22);p(L,SK.rbox(.2,.03,.04,.012,1),Br,0,.13,0);
      p(L,SK.cyl(.018,.02,.14,6),Gr,0,.05,0);p(L,SK.ball(.03,8,6),Br,0,-.03,0);const m=new THREE.Matrix4().compose(new THREE.Vector3(x,.37,.07),new THREE.Quaternion().setFromEuler(new THREE.Euler(lean,0,0)),new THREE.Vector3(1,1,1));for(const q of L){q[2].premultiply(m);A.push(q);}};
    sword(-.39,-.08);sword(-.13,-.1);
    {const L=[];p(L,SK.cyl(.018,.018,1.7,6),W,0,.85,0);p(L,SK.cone(.035,.2,4),Ir,0,1.8,0);p(L,SK.cyl(.022,.022,.05,6),Ir,0,1.69,0);const m=new THREE.Matrix4().compose(new THREE.Vector3(.13,0,.08),new THREE.Quaternion().setFromEuler(new THREE.Euler(-.05,0,0)),new THREE.Vector3(1,1,1));for(const q of L){q[2].premultiply(m);A.push(q);}}
    {const L=[];p(L,SK.cyl(.02,.022,1.0,6),W,0,.5,0);p(L,SK.rbox(.02,.16,.18,.008,1),Ir,0,.9,.1);p(L,SK.cone(.02,.1,4),Ir,0,.93,-.03,Math.PI/2,0,0,1,1,.3);const m=new THREE.Matrix4().compose(new THREE.Vector3(.39,.3,.08),new THREE.Quaternion().setFromEuler(new THREE.Euler(-.1,0,0)),new THREE.Vector3(1,1,1));for(const q of L){q[2].premultiply(m);A.push(q);}}
    k={body:dunMerge(A,'rack').geometry,lid:null,lidY:0};}
  k.mat=new THREE.MeshLambertMaterial({vertexColors:true});D_KIT.set(kind,k);return k;}
function _dContainer(kind,wx,wz,floorIdx,baseY,r){const g=new THREE.Group();let top=null,openTop=null;const K=_dKit(kind);
  const body=new THREE.Mesh(K.body,K.mat);body.userData.dunCont=kind;g.add(body);
  if(K.lid){top=new THREE.Mesh(K.lid,K.mat);top.position.y=K.lidY;g.add(top);
    // the sarcophagus's lid is pushed a third aside and tips onto the chest's edge; the urn's pops and sits askew as a barrel's does
    if(kind==='sarcophagus')openTop=()=>{top.position.x+=.34;top.position.z+=.12;top.rotation.z=-.1;top.rotation.y=.12;};}
  g.position.set(wx,baseY,wz);g.rotation.y=r()*Math.PI*2;dScene.add(g);
  BARRELS.push({x:wx,z:wz,floor:floorIdx,opened:false,items:_dLoot(kind,r),displayName:kind==='urn'?'Urn':kind==='sarcophagus'?'Sarcophagus':'Weapon Rack',mesh:g,top,openTop});}
function decorateDungeonRooms(gen,portal){
  D_TRAPS.length=0;if(!gen||!gen.rooms)return;window._lastGen=gen;const r=_dRng((portal&&portal.seed)||1);const theme=(portal&&portal.theme)||'ruins';
  const floors=[[gen.rooms,1,0],[gen.rooms2||[],2,FLOOR2_Y]];
  const TYPES={undead:['ossuary','shrine','collapsed','library'],haunted:['shrine','ossuary','flooded','library'],ruins:['library','collapsed','barracks','treasury'],goblin:['barracks','collapsed','flooded','treasury'],elemental:['flooded','collapsed','shrine','library'],deep:['flooded','ossuary','collapsed','shrine'],fort:['barracks','treasury','library','shrine']};
  const list=TYPES[theme]||TYPES.ruins;
  const occ=[];const seed=(BARRELS||[]).map(b=>({x:b.x,z:b.z,r:.7,f:b.floor})).concat((CHESTS||[]).map(c=>({x:c.x,z:c.z,r:.9,f:c.floor})));occ.push(...seed);
  const free=(x,z,rad,fi)=>!occ.some(o=>o.f===fi&&Math.hypot(o.x-x,o.z-z)<rad+o.r);const take=(x,z,rad,fi)=>{occ.push({x,z,r:rad,f:fi});};
  const _dBoxF=(w,hh,d,col,x,y,z,ry,fi)=>{if(!free(x,z,Math.max(w,d)/2,fi))return null;take(x,z,Math.max(w,d)/2,fi);return _dBox(w,hh,d,col,x,y,z,ry);};
  const _dContainerF=(kind,wx,wz,fi,baseY,rr)=>{if(!free(wx,wz,.6,fi))return;take(wx,wz,.6,fi);_dContainer(kind,wx,wz,fi,baseY,rr);};
  for(const [rooms,fi,baseY] of floors){for(const rm of rooms){if(rm.kind)continue;if(rm.w<5||rm.h<5)continue;if(r()<.45)continue;const type=list[Math.floor(r()*list.length)];
      const cx=rm.x+rm.w/2,cz=rm.y+rm.h/2;
      // not the stairwell's room, and not one the engine has filled with chests
      if(gen.stairC!=null&&gen.stairC>=rm.x-1&&gen.stairC<=rm.x+rm.w&&gen.stairR>=rm.y-1&&gen.stairR<=rm.y+rm.h)continue;
      if((CHESTS||[]).filter(c=>c.floor===fi&&c.x>=rm.x&&c.x<rm.x+rm.w&&c.z>=rm.y&&c.z<rm.y+rm.h).length>=2)continue;
      rm.vtype=type;
      // S309 — the shrine, library and barracks on the kit (#46 A, H.7's props): one bake a room at the kit's sizes (the town
      // interiors', for the same .92 eye), tagged dunFurn; the wall's inside face is half a cell out from the room's first cell
      const K=furnKit(),P=K.Parts(),n='gatelands',ks=((portal&&portal.seed)|0)*7+rm.x*31+rm.y*17,wN=rm.y-.5,wW=rm.x-.5,jr=_dRng(ks); // S310: jr for the looks, so the room dice r() draw as before
      const bakeRoom=()=>{const G=K.bake(P);G.position.y=baseY;G.userData.dunFurn={type,x0:wW,z0:wN,w:rm.w,h:rm.h};dScene.add(G);};
      if(type==='shrine'){if(!free(cx,cz,1.2,fi))continue;take(cx,cz,1.2,fi);
        // a flagged dais, a dressed plinth with a moulded slab, and four candles in dishes at the dais's corners
        P.put(K.dais(1.9,1.3,.18,ks),cx,cz,0);P(SK.rbox(1.2,.5,.7,.03,1),0x8a8478,cx,.18+.25,cz);P(SK.rbox(1.32,.07,.82,.025,2),0xb0a898,cx,.18+.535,cz);
        for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])K.candle(P,cx+sx*.8,.18,cz+sz*.5);bakeRoom();
        const l=new THREE.PointLight(0xffc070,1.0,5);l.position.set(cx,baseY+1.2,cz);dScene.add(l);if(r()<.6)_dContainerF('urn',cx+rm.w/2-1.4,cz+rm.h/2-1.4,fi,baseY,r);}
      else if(type==='library'){
        // the kit's bookcases, backs to the north wall (the old boxes stood a unit out from it), and a reading table with books
        for(let k=0;k<Math.min(4,rm.w-2);k++)P.put(K.bookcase(.9,n,ks+k),rm.x+1.2+k*1.0,wN+.01,0);
        if(free(cx,cz,1.1,fi)){take(cx,cz,1.1,fi);P.put(K.table(1.6,.9,n,ks+9),cx,cz,0);K.candle(P,cx-.55,.46,cz-.2);
          P(SK.rbox(.18,.05,.24,.008,1),0x5a2a1a,cx+.1,.485,cz+.15,0,.3,0);for(const sd of [-1,1])P(SK.rbox(.16,.02,.22,.004,1),0xe8dcc0,cx+.45+sd*.08,.472,cz-.05,0,0,sd*-.08);}
        bakeRoom();}
      else if(type==='barracks'){
        // the cots became the kit's bed, 1.8 by .8, along the west wall where they lay
        for(let k=0;k<Math.min(3,Math.floor(rm.h/2));k++)P.put(K.bed(n,ks+k,1.8,.8),wW+.45,wN+1.05+k*2.0,0); // two units apart from the north wall (at 2.2 from 1.4 the third ran through the south wall)
        bakeRoom();if(r()<.7)_dContainerF('rack',rm.x+rm.w-1.1,rm.y+1.1,fi,baseY,r);}
      else if(type==='flooded'){const w=new THREE.Mesh(new THREE.PlaneGeometry(rm.w-.4,rm.h-.4),new THREE.MeshLambertMaterial({color:0x1a3a4a,transparent:true,opacity:.75}));w.rotation.x=-Math.PI/2;w.position.set(cx,baseY+.12,cz);dScene.add(w);const l=new THREE.PointLight(0x4090b0,.7,7);l.position.set(cx,baseY+1.0,cz);dScene.add(l);rm.flooded=true;}
      else if(type==='collapsed'){
        // S310 — fallen stones as lumpy boulders (a bumped ball squashed to the old box's size), and the broken slab a dressed
        // block tipped on its side, where the boxes fell; the same dice and the same room kept clear. The slab is 2.0 long (the
        // old 2.6, turned at random half a cell east of the room's middle, went through a wall five wide) and truly centred
        const lump=SK.bumpy(SK.ball(.5,9,6),.06,5,ks%7);
        for(let k=0;k<5+Math.floor(r()*4);k++){const sz=.3+r()*.5,x=rm.x+1.0+r()*(rm.w-2.0),z=rm.y+1.0+r()*(rm.h-2.0),ry=r()*3;if(!free(x,z,sz/2,fi))continue;take(x,z,sz/2,fi);
          P(lump,new THREE.Color(0x5a564e).offsetHSL(0,0,(jr()-.5)*.08),x,sz*.36,z,0,ry,0,sz,sz*.7,sz);}
        {const ry=r()*3;if(free(cx,cz,1.3,fi)){take(cx,cz,1.3,fi);P(SK.rbox(1.0,.4,2.0,.06,1),0x4a4640,cx-.5,.2,cz-.5,.04,ry,.06);}}
        bakeRoom();}
      else if(type==='ossuary'){
        // S310 — bone niches of dressed stone against the north wall (the boxes stood .8 out from it), two shelves of skulls
        // and long bones in each, and bones strewn on the floor where the boxes lay; the sarcophagus as it was
        const ST=0x9a9488,BN=0xe8e0d0;
        for(let k=0;k<Math.min(3,rm.w-2);k++){const x=rm.x+1.0+k*1.1,z=wN+.2;
          P(SK.rbox(.8,.9,.06,.015,1),ST,x,.45,wN+.03);for(const sx of [-1,1])P(SK.rbox(.06,.9,.36,.015,1),new THREE.Color(ST).multiplyScalar(.9),x+sx*.37,.45,z);
          for(const y of [.03,.45,.87])P(SK.rbox(.8,.06,.38,.015,1),new THREE.Color(ST).multiplyScalar(.95),x,y,z);
          for(const y of [.06,.48]){for(let j=0;j<3;j++)P(SK.ball(.065,8,6),new THREE.Color(BN).offsetHSL(0,0,(jr()-.5)*.08),x-.22+j*.22,y+.06,z+.04,0,(jr()-.5)*.6,0,1,.9,1.1);
            P(SK.cyl(.018,.018,.6,5),BN,x,y+.02,z-.1,0,0,Math.PI/2);}}
        for(let k=0;k<12;k++){const x=rm.x+.6+r()*(rm.w-1.2),z=rm.y+.6+r()*(rm.h-1.2),ry=r()*3;P(SK.cyl(.02,.02,.22,5),BN,x,.02,z,0,ry,Math.PI/2);if(k%4===0)P(SK.ball(.06,8,6),BN,x+.12,.055,z+.05);}
        bakeRoom();if(r()<.8)_dContainerF('sarcophagus',cx,cz,fi,baseY,r);}
      else if(type==='treasury'){_dContainerF('urn',cx-1.2,cz-1.2,fi,baseY,r);_dContainerF('urn',cx+1.2,cz+1.2,fi,baseY,r);if(r()<.5)_dContainerF('rack',cx+1.6,cz-1.6,fi,baseY,r);}
    }}
  // traps in corridors: spike plates (a pressure plate, spikes rise for a moment) and swinging blades (a blade sweeps a corridor cell)
  const map=gen.map||dMap;if(!map)return;const isFloor=(c,rr)=>map[rr]&&map[rr][c]===1;
  const corridor=[];for(let rr=1;rr<map.length-1;rr++)for(let c=1;c<map[rr].length-1;c++){if(!isFloor(c,rr))continue;const h=isFloor(c-1,rr)&&isFloor(c+1,rr)&&!isFloor(c,rr-1)&&!isFloor(c,rr+1);const v=isFloor(c,rr-1)&&isFloor(c,rr+1)&&!isFloor(c-1,rr)&&!isFloor(c+1,rr);if(h||v)corridor.push([c,rr,h?'h':'v']);}
  // a real run: the two cells beyond on each side along the corridor are floor too, and nothing but wall to the sides
  const run=corridor.filter(([c,rr,dir])=>dir==='h'?(isFloor(c-2,rr)&&isFloor(c+2,rr)&&!isFloor(c,rr-1)&&!isFloor(c,rr+1)):(isFloor(c,rr-2)&&isFloor(c,rr+2)&&!isFloor(c-1,rr)&&!isFloor(c+1,rr)));
  corridor.length=0;corridor.push(...run);
  const nTraps=Math.min(corridor.length,2+Math.floor(r()*4));
  for(let k=0;k<nTraps;k++){const [c,rr,dir]=corridor[Math.floor(r()*corridor.length)];const x=c+.5,z=rr+.5;if(D_TRAPS.some(t=>Math.hypot(t.x-x,t.z-z)<3))continue;
    if(r()<.6){const plate=_dBox(.62,.04,.62,0x3a3630,x,.02,z);const spikes=new THREE.Group();for(let i=0;i<9;i++){const s=new THREE.Mesh(new THREE.ConeGeometry(.04,.34,5),new THREE.MeshLambertMaterial({color:0x9a9ea6}));s.position.set(-.18+(i%3)*.18,.17,-.18+Math.floor(i/3)*.18);spikes.add(s);}spikes.position.set(x,-.4,z);dScene.add(spikes);D_TRAPS.push({kind:'spike',x,z,floor:1,plate,spikes,t:0,armed:true});}
    else{const pivot=new THREE.Group();pivot.position.set(x,FLOOR_HEIGHT-.1,z);const arm=_dBox(.06,1.4,.06,0x3a2e22,0,-.7,0);dScene.remove(arm);pivot.add(arm);const blade=new THREE.Mesh(new THREE.BoxGeometry(.7,.5,.04),new THREE.MeshLambertMaterial({color:0xb8bcc4}));blade.position.set(0,-1.55,0);pivot.add(blade);pivot.rotation.y=dir==='h'?0:Math.PI/2;dScene.add(pivot);D_TRAPS.push({kind:'blade',x,z,floor:1,pivot,ph:r()*Math.PI*2,hitT:0});}}
}
function tickDungeonTraps(dt){if(!D_TRAPS.length||typeof dScene==='undefined'||scene!==dScene)return;const gy=currentFloor===2?FLOOR2_Y:0;
  for(const t of D_TRAPS){if(t.floor!==currentFloor)continue;const d=Math.hypot(px-t.x,pz-t.z);
    if(t.kind==='spike'){if(t.armed&&d<.55&&Math.abs(jumpY-gy)<.3){t.armed=false;t.t=0;const dmg=_warded(8+Math.floor(Math.random()*8)+Math.floor(level*.8));PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;updateHUD();showMsg(`Spikes! ${dmg} damage.`,'#ff6060');if(typeof sfxNoise==='function')sfxNoise(.5,0,0,.1,900);if(PHP<=0)playerDead();}
      if(!t.armed){t.t+=dt;const up=t.t<.8?Math.min(1,t.t*6):Math.max(0,1-(t.t-.8)*1.5);t.spikes.position.y=-.4+up*.42;if(t.t>3){t.armed=true;t.spikes.position.y=-.4;}}}
    else{t.ph+=dt*2.2;const a=Math.sin(t.ph)*.42;t.pivot.rotation.z=a;const bx=t.x+Math.sin(t.pivot.rotation.y)*0,bz=t.z;const sweep=Math.abs(a)<.35;t.hitT-=dt;if(sweep&&d<.7&&t.hitT<=0){t.hitT=1.2;const dmg=_warded(blocking?Math.round((10+Math.floor(level*1.2))*.4):10+Math.floor(level*1.2));PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;updateHUD();showMsg(`The blade catches you: ${dmg}.`,'#ff6060');if(typeof sfxNoise==='function')sfxNoise(.4,0,0,.08,1200);if(PHP<=0)playerDead();}}}}

// ═══ v80 — DUNGEON FEEL: sounds, monster detail, exteriors, lockpicking ═══

// ── sounds ──
// doors: a creak of old wood on iron, then the latch
function sndDoorOpen(){try{sfxTone(160,70,.55,.10,'sawtooth');sfxNoise(.35,0,0,.08,900);setTimeout(()=>{sfxTone(420,200,.06,.12,'square');sfxNoise(.05,0,0,.1,2600);},380);}catch(e){}}
function sndDoorClose(){try{sfxNoise(.12,0,0,.14,700);sfxTone(90,50,.22,.16,'sine');setTimeout(()=>sfxTone(600,300,.05,.1,'square'),120);}catch(e){}}
function sndDoorUnlock(){try{sfxTone(2400,1800,.05,.12,'square');setTimeout(()=>sfxTone(1500,900,.06,.12,'square'),90);setTimeout(()=>{sfxTone(120,60,.3,.14,'sine');sfxNoise(.2,0,0,.08,600);},220);}catch(e){}}
// hits: by weapon class, and whether the thing resisted it
function sndHitEnemy(wt,resisted){try{
  if(wt==='blunt'){if(resisted){sfxTone(90,45,.28,.28,'sine');sfxNoise(.08,0,0,.12,300);}else{sfxNoise(.2,0,0,.3,380);sfxTone(140,55,.22,.26,'triangle');setTimeout(()=>sfxNoise(.1,0,0,.12,700),60);}}
  else if(wt==='pierce'){if(resisted){sfxTone(3200,2400,.07,.16,'square');sfxNoise(.04,0,0,.08,4000);}else{sfxNoise(.06,0,0,.22,1400);sfxTone(320,120,.1,.16,'triangle');}}
  else if(wt==='slash'||!wt){if(resisted){sfxTone(2100,1700,.16,.22,'square');sfxNoise(.12,0,0,.14,3500);}else{sfxNoise(.14,0,0,.26,2600);sfxTone(700,260,.09,.12,'triangle');}}
  else{sfxNoise(.1,0,0,.2,1500);}
}catch(e){}}
// monsters: a voice by kind — on detection, and now and then while they're close
function _voiceOf(e){const n=(e.name||'').toLowerCase();if(/wolf|hound|boar|bear/.test(n))return 'growl';if(/skeleton|bone/.test(n))return 'rattle';if(/ghoul|zombie|wight|ghost|wraith|hag|spectre|shade/.test(n))return 'moan';if(/goblin|kobold/.test(n))return 'chitter';if(/ogre|troll|golem|giant|dragon/.test(n))return 'roar';if(/spider|scorpion|crawler|snake|rat/.test(n))return 'hiss';if(/bandit|highwayman|deserter|captain|cultist|archer|slinger|pirate/.test(n))return 'shout';return 'growl';}
function sndMonster(e,kind){try{const v=_voiceOf(e);const d=Math.hypot(e.x-px,e.z-pz);const vol=Math.max(.06,Math.min(1,1-(d/18)))*(kind==='alert'?1:.55);
  if(v==='growl'){sfxTone(95,60,.55,.22*vol,'sawtooth');sfxNoise(.5,0,0,.12*vol,500);if(kind==='alert')setTimeout(()=>{sfxTone(130,70,.25,.24*vol,'sawtooth');sfxNoise(.2,0,0,.16*vol,900);},420);}
  else if(v==='rattle'){for(let i=0;i<5;i++)setTimeout(()=>sfxNoise(.03,0,0,.14*vol,2600+Math.random()*800),i*70);if(kind==='alert')setTimeout(()=>sfxTone(2000,1200,.08,.1*vol,'square'),380);}
  else if(v==='moan'){sfxTone(150,85,1.2,.16*vol,'sine');setTimeout(()=>sfxTone(120,70,.9,.12*vol,'triangle'),300);if(kind==='alert')sfxNoise(.8,0,0,.06*vol,400);}
  else if(v==='chitter'){for(let i=0;i<4;i++)setTimeout(()=>sfxTone(700+Math.random()*400,500,.07,.1*vol,'square'),i*90);if(kind==='alert')setTimeout(()=>sfxTone(1200,600,.18,.12*vol,'square'),380);}
  else if(v==='roar'){sfxTone(70,42,.9,.3*vol,'sawtooth');sfxNoise(.9,0,0,.18*vol,300);setTimeout(()=>sfxTone(60,38,.6,.24*vol,'sawtooth'),500);}
  else if(v==='hiss'){sfxNoise(1.1,0,0,.14*vol,3200);if(kind==='alert')setTimeout(()=>sfxNoise(.3,0,0,.18*vol,5000),300);}
  else if(v==='shout'){sfxNoise(.16,0,0,.16*vol,900);sfxTone(220,140,.22,.14*vol,'sawtooth');if(kind==='alert')setTimeout(()=>{sfxNoise(.12,0,0,.14*vol,1100);sfxTone(260,160,.18,.12*vol,'sawtooth');},260);}
}catch(e){}}
function tickMonsterSounds(dt){const E=activeZoneId==='world'?(ZONES.world&&ZONES.world.enemies||[]):(typeof ENEMIES!=='undefined'?ENEMIES:[]);const now=performance.now();
  for(const e of E){if(e.dead||!e.name)continue;const d=Math.hypot(e.x-px,e.z-pz);
    if((e.alert||e._agg)&&!e._alertSnd){e._alertSnd=true;if(d<26)sndMonster(e,'alert');}
    if(!e.alert&&!e._agg)e._alertSnd=false;
    if(d<14){e._idleT=(e._idleT==null?1+Math.random()*3:e._idleT)-dt;if(e._idleT<=0){e._idleT=2.5+Math.random()*4;sndMonster(e,'idle');}}}
}

// ── monster detail: features by creature, added once to the mesh group ──
function _emat(c,em){return new THREE.MeshLambertMaterial({color:c,emissive:em||0x000000});}
function detailEnemyMesh(e){if(!e||e._detailed||!e.mesh||!e.mesh.isGroup)return;e._detailed=true;const g=e.mesh;const n=(e.name||'').toLowerCase();
  // find the head: the child with the highest centre
  let head=null,hy=-1e9;g.children.forEach(c=>{if(!c.isMesh||!c.geometry||c.geometry.type!=='BoxGeometry'||(c.userData&&c.userData.hpBar))return;const p=c.geometry.parameters;if(p&&p.height>1.2)return;if(c.position.y>hy){hy=c.position.y;head=c;}});if(!head)return;const hx=head.position.x,hz=head.position.z;const hs=(head.geometry&&head.geometry.parameters&&(head.geometry.parameters.width||head.geometry.parameters.radius*2))||.4;
  const add=(m,x,y,z,rx,ry,rz)=>{m.position.set(x,y,z);if(rx)m.rotation.x=rx;if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;m.castShadow=false;m.userData._detail=true;g.add(m);return m;};
  const dark=_emat(0x1a1612),bone=_emat(0xe8e0d0),steel=_emat(0xb8bcc4),leather=_emat(0x4a3018);
  if(/wolf|hound/.test(n)){const ew=Math.min(.07,hs*.18),el=Math.min(.2,hs*.5);add(new THREE.Mesh(new THREE.ConeGeometry(ew,el,4),dark),hx-Math.min(.12,hs*.28),hy+Math.min(.18,hs*.45),hz,0,0,.15);add(new THREE.Mesh(new THREE.ConeGeometry(ew,el,4),dark),hx+Math.min(.12,hs*.28),hy+Math.min(.18,hs*.45),hz,0,0,-.15);add(new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.7),dark),0,hy*.6,-hs*1.6,-.6);add(new THREE.Mesh(new THREE.ConeGeometry(.03,.14,4),bone),hx-.08,hy-hs*.4,hz+hs*.55,Math.PI);add(new THREE.Mesh(new THREE.ConeGeometry(.03,.14,4),bone),hx+.08,hy-hs*.4,hz+hs*.55,Math.PI);}
  else if(/boar/.test(n)){add(new THREE.Mesh(new THREE.ConeGeometry(.04,.3,5),bone),hx-.14,hy-hs*.3,hz+hs*.6,-1.1,0,.4);add(new THREE.Mesh(new THREE.ConeGeometry(.04,.3,5),bone),hx+.14,hy-hs*.3,hz+hs*.6,-1.1,0,-.4);add(new THREE.Mesh(new THREE.BoxGeometry(hs*1.4,.12,.6),_emat(0x3a2a1a)),0,hy+hs*.3,-.2);}
  else if(/bear/.test(n)){add(new THREE.Mesh(new THREE.SphereGeometry(hs*.2,6,6),_emat(0x3a2a1a)),hx-hs*.35,hy+hs*.45,hz);add(new THREE.Mesh(new THREE.SphereGeometry(hs*.2,6,6),_emat(0x3a2a1a)),hx+hs*.35,hy+hs*.45,hz);for(let k=0;k<3;k++)add(new THREE.Mesh(new THREE.ConeGeometry(.03,.16,4),bone),-.3+k*.12,hy*.35,hs*.9,-1.4);}
  else if(/skeleton/.test(n)){const limbs=new Set(Array.isArray(e.limbs)?e.limbs.flat(2):[]);let torso=null,tv=0;g.children.forEach(c=>{if(!c.isMesh||c===head||limbs.has(c)||!c.geometry||!c.geometry.parameters)return;const p=c.geometry.parameters;const v=(p.width||0)*(p.height||0)*(p.depth||0);if(v>tv){tv=v;torso=c;}});
    const tp=torso?torso.geometry.parameters:{width:.5,height:.7,depth:.3};const ty=torso?torso.position.y:hy*.55;const tw=tp.width||.5,th=tp.height||.7;if(torso)torso.visible=false;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,th*1.05,6),bone),0,ty,-tp.depth*.15);for(let k=0;k<4;k++){add(new THREE.Mesh(new THREE.TorusGeometry(tw*.42-k*.03,.02,5,12,Math.PI),bone),0,ty+th*.38-k*th*.16,0,0,0,Math.PI);}add(new THREE.Mesh(new THREE.BoxGeometry(tw*.8,th*.18,tp.depth*.6),bone),0,ty-th*.45,0);add(new THREE.Mesh(new THREE.BoxGeometry(tw*.9,.05,.06),bone),0,ty+th*.5,0);}
  else if(/ghoul|zombie/.test(n)){for(let s=-1;s<=1;s+=2)for(let k=0;k<3;k++)add(new THREE.Mesh(new THREE.ConeGeometry(.02,.12,4),bone),s*.34,hy*.45,.18+k*.05,-1.5);add(new THREE.Mesh(new THREE.BoxGeometry(hs*.9,.06,hs*.3),_emat(0x3a4a2a)),hx,hy+hs*.1,hz+hs*.5);}
  else if(/wight|wraith|ghost|spectre|shade/.test(n)){const ring=add(new THREE.Mesh(new THREE.TorusGeometry(hs*1.3,.03,6,24),_emat(0x7a4a9a,0x5a2a8a)),hx,hy+hs*.8,hz,Math.PI/2);ring._spin=true;for(let k=0;k<5;k++){const a=k/5*Math.PI*2;add(new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.02),_emat(0xc0a0ff,0x8060c0)),hx+Math.cos(a)*hs*1.3,hy+hs*.8,hz+Math.sin(a)*hs*1.3,0,-a);}}
  else if(/ogre|troll|giant/.test(n)){add(new THREE.Mesh(new THREE.ConeGeometry(.08,.4,5),bone),hx-hs*.35,hy+hs*.5,hz,0,0,.5);add(new THREE.Mesh(new THREE.ConeGeometry(.08,.4,5),bone),hx+hs*.35,hy+hs*.5,hz,0,0,-.5);add(new THREE.Mesh(new THREE.BoxGeometry(hs*2.6,hs*.5,hs*1.2),leather),0,hy-hs*.9,0);add(new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,1.6,6),_emat(0x5a3a1a)),hs*1.5,hy*.5,.1,0,0,-.4);}
  else if(/goblin|kobold/.test(n)){const ew=Math.min(.09,hs*.2),el=Math.min(.28,hs*.6);add(new THREE.Mesh(new THREE.ConeGeometry(ew,el,4),_emat(0x4a5a2a)),hx-Math.min(.22,hs*.5),hy+.02,hz,0,0,1.25);add(new THREE.Mesh(new THREE.ConeGeometry(ew,el,4),_emat(0x4a5a2a)),hx+Math.min(.22,hs*.5),hy+.02,hz,0,0,-1.25);add(new THREE.Mesh(new THREE.BoxGeometry(.03,.3,.05),steel),Math.min(.3,hs*.8),hy*.45,.15,0,0,.3);}
  else if(/spider|scorpion|crawler/.test(n)){for(let k=0;k<4;k++)add(new THREE.Mesh(new THREE.ConeGeometry(.04,.3,4),dark),0,hy+.15+k*.08,-hs*(1.2+k*.25),-1.2);add(new THREE.Mesh(new THREE.ConeGeometry(.05,.22,4),_emat(0x2a1a1a)),0,hy+.5,-hs*2.2,-2.2);}
  else if(/cultist/.test(n)){add(new THREE.Mesh(new THREE.ConeGeometry(hs*.75,hs*1.3,8,1,true),_emat(0x2a1a2a)),hx,hy+hs*.55,hz);add(new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.02),_emat(0xff5040,0xa02010)),0,hy*.6,hs*.62);}
  else if(/captain/.test(n)){for(let k=0;k<5;k++){const a=k/5*Math.PI*2;add(new THREE.Mesh(new THREE.ConeGeometry(.04,.14,4),_emat(0xe0c060,0x4a3a10)),hx+Math.cos(a)*hs*.45,hy+hs*.6,hz+Math.sin(a)*hs*.45);}add(new THREE.Mesh(new THREE.BoxGeometry(hs*1.0,.12,hs*.9),_emat(0x7a2020)),hx,hy-hs*.55,hz);}
  else if(/archer|slinger/.test(n)){add(new THREE.Mesh(new THREE.TorusGeometry(.5,.025,5,12,Math.PI),_emat(0x5a3a1a)),0,hy*.55,-.2,0,Math.PI/2);add(new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.5,6),leather),.22,hy*.7,-.2,.2);}
  else if(/bandit|highwayman|deserter|pirate/.test(n)){add(new THREE.Mesh(new THREE.ConeGeometry(hs*.7,hs*.9,7,1,true),_emat(0x3a2a1a)),hx,hy+hs*.5,hz);add(new THREE.Mesh(new THREE.BoxGeometry(.26,.12,.26),leather),-hs*.65,hy-hs*.2,0);add(new THREE.Mesh(new THREE.BoxGeometry(.4,.06,.1),leather),0,hy*.55,.2);}
  else if(/hag|witch/.test(n)){add(new THREE.Mesh(new THREE.ConeGeometry(hs*.6,hs*1.6,7),dark),hx,hy+hs*.9,hz);add(new THREE.Mesh(new THREE.ConeGeometry(.03,.18,4),bone),hx,hy-hs*.15,hz+hs*.6,-1.5);}
  else if(/rat/.test(n)){add(new THREE.Mesh(new THREE.CylinderGeometry(.015,.03,.5,4),_emat(0xc8a090)),0,hy*.5,-hs*1.4,-1.3);}
  else{ /* a belt and a brooch keep even the plain ones from being bare */ add(new THREE.Mesh(new THREE.BoxGeometry(hs*1.05,.06,hs*.7),leather),0,hy*.5,0);}
}
function tickEnemyDetail(){const E=activeZoneId==='world'?(ZONES.world&&ZONES.world.enemies||[]):(typeof ENEMIES!=='undefined'?ENEMIES:[]);for(const e of E){if(!e._detailed&&!e.dead)detailEnemyMesh(e);if(e.mesh&&e._detailed){if(e.dead&&!e._detailHidden){e._detailHidden=true;e.mesh.children.forEach(c=>{if(c.userData&&c.userData._detail)c.visible=false;});}else e.mesh.children.forEach(c=>{if(c._spin)c.rotation.z+=.02;});}}}

// ── exteriors: mystery by seed, and a sigil glow in the theme's colour ──
const THEME_GLOW={undead:0x9a60ff,goblin:0x60ff80,elemental:0xff8040,deep:0x4080ff,haunted:0x40e0d0,ruins:0xffd060,fort:0xffd060};
const PORTAL_FX=[];
function dressPortalExterior(sc,p,ty,sol){try{const solid=(x,z,r)=>{if(sol)sol.push({cx:x,cz:z,rx:r,rz:r});};const h=(p.seed*2654435761)>>>0;const r=((k)=>{let s=(h^(k*7919))>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};})(1);
  const M=(c,em)=>new THREE.MeshLambertMaterial({color:c,emissive:em||0});const put=(m,x,y,z,ry)=>{m.position.set(x,y,z);if(ry)m.rotation.y=ry;sc.add(m);return m;};
  // a set piece that changes the silhouette: standing stones, a ruined arch, a fallen tower, a sunken approach — one per gate by seed
  const set=['stones','arch','tower','pit','none'][Math.floor(r()*5)];const M2=(c)=>new THREE.MeshLambertMaterial({color:c});const gy=(x,z)=>(typeof WORLD!=='undefined'&&activeZoneId==='world')?WORLD.worldH(x,z):ty;
  if(set==='stones'){const n=5+Math.floor(r()*3);for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r()*.3;const rr=4.2+r()*.8;const x=p.x+Math.cos(a)*rr,z=p.z+Math.sin(a)*rr;const hgt=1.6+r()*1.4;const m=new THREE.Mesh(new THREE.BoxGeometry(.5+r()*.3,hgt,.35+r()*.2),M2([0x6a665e,0x5a564e,0x74706a][i%3]));m.position.set(x,gy(x,z)+hgt/2-.1,z);m.rotation.y=r()*3;m.rotation.z=(r()-.5)*.12;m.castShadow=true;sc.add(m);solid(x,z,.45);}}
  else if(set==='arch'){for(let s=-1;s<=1;s+=2){const x=p.x+s*2.0,z=p.z+3.2;const m=new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,3.2,8),M2(0x8a8478));m.position.set(x,gy(x,z)+1.6,z);sc.add(m);solid(x,z,.45);const cap=new THREE.Mesh(new THREE.BoxGeometry(.9,.3,.9),M2(0x9a948a));cap.position.set(x,gy(x,z)+3.35,z);sc.add(cap);}const lin=new THREE.Mesh(new THREE.BoxGeometry(4.9,.42,.9),M2(0x9a948a));lin.position.set(p.x,gy(p.x,p.z+3.2)+3.7,p.z+3.2);lin.rotation.z=(r()-.5)*.06;sc.add(lin);for(let i=0;i<5;i++){const x=p.x+(r()-.5)*5,z=p.z+3.2+(r()-.5)*2;const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.35,.5),M2(0x7a766e));m.position.set(x,gy(x,z)+.15,z);m.rotation.y=r()*3;sc.add(m);}}
  else if(set==='tower'){const x=p.x+3.4,z=p.z-1.5;const h0=gy(x,z);const wall=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.6,3.4,10,1,true),new THREE.MeshLambertMaterial({color:0x6a665e,side:THREE.DoubleSide}));wall.position.set(x,h0+1.7,z);sc.add(wall);solid(x,z,1.7);for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const m=new THREE.Mesh(new THREE.BoxGeometry(.6,.5+r()*.6,.5),M2(0x5a564e));m.position.set(x+Math.cos(a)*1.55,h0+3.4+.3,z+Math.sin(a)*1.55);m.rotation.y=-a;sc.add(m);}for(let i=0;i<6;i++){const xx=x+(r()-.5)*5,zz=z+(r()-.5)*5;const m=new THREE.Mesh(new THREE.BoxGeometry(.4+r()*.5,.3,.4+r()*.5),M2(0x6a665e));m.position.set(xx,gy(xx,zz)+.12,zz);m.rotation.y=r()*3;sc.add(m);}}
  else if(set==='pit'){for(let i=0;i<2;i++)for(let s=-1;s<=1;s+=2){const x=p.x+s*1.6,z=p.z+2.2+i*1.6;const m=new THREE.Mesh(new THREE.BoxGeometry(.3,1.2+i*.3,.3),M2(0x5a564e));m.position.set(x,gy(x,z)+.6+i*.15,z);sc.add(m);}for(let i=0;i<6;i++){const z=p.z+1.6+i*.55;const m=new THREE.Mesh(new THREE.BoxGeometry(3.0,.1,.5),M2(0x7a766e));m.position.set(p.x,gy(p.x,z)-.02-i*.02,z);sc.add(m);}}
  const picks=[];const pool=['skull','chains','tree','bones','cairn','mist','ravens'];while(picks.length<3){const k=pool[Math.floor(r()*pool.length)];if(!picks.includes(k))picks.push(k);}
  for(const k of picks){const a=r()*Math.PI*2,dd=2.6+r()*2.2;const x=p.x+Math.cos(a)*dd,z=p.z+Math.sin(a)*dd;const y=(typeof WORLD!=='undefined'&&activeZoneId==='world')?WORLD.worldH(x,z):ty;
    if(k==='skull'){solid(x,z,.18);put(new THREE.Mesh(new THREE.CylinderGeometry(.03,.04,1.6,5),M(0x3a2a1a)),x,y+.8,z);put(new THREE.Mesh(new THREE.SphereGeometry(.13,7,6),M(0xe0d8c8)),x,y+1.7,z);}
    else if(k==='chains'){solid(x+.15,z,.25);for(let i=0;i<2;i++){put(new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.2,4),M(0x4a4a50)),x+i*.3,y+1.4,z);put(new THREE.Mesh(new THREE.TorusGeometry(.08,.02,4,8),M(0x4a4a50)),x+i*.3,y+.78,z,0);}}
    else if(k==='tree'){solid(x,z,.3);put(new THREE.Mesh(new THREE.CylinderGeometry(.08,.16,2.6,6),M(0x2a2420)),x,y+1.3,z);for(let i=0;i<4;i++){const b=put(new THREE.Mesh(new THREE.CylinderGeometry(.02,.05,1.1,4),M(0x2a2420)),x,y+2.2+i*.15,z);b.rotation.z=.9*(i%2?1:-1);b.rotation.y=i*1.5;}}
    else if(k==='bones'){for(let i=0;i<7;i++)put(new THREE.Mesh(new THREE.BoxGeometry(.06,.05,.3+r()*.3),M(0xe8e0d0)),x+(r()-.5)*1.4,y+.03,z+(r()-.5)*1.4,r()*3);}
    else if(k==='cairn'){solid(x,z,.4);for(let i=0;i<5;i++)put(new THREE.Mesh(new THREE.BoxGeometry(.5-i*.07,.18,.4-i*.05),M(0x6a665e)),x,y+.09+i*.17,z,r()*.6);}
    else if(k==='mist'){const N=18;const pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=(r()-.5)*7;pos[i*3+1]=.2+r()*.5;pos[i*3+2]=(r()-.5)*7;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));const m=new THREE.Points(g,new THREE.PointsMaterial({color:0xd0d0d8,size:1.6,transparent:true,opacity:.18,depthWrite:false,sizeAttenuation:true}));m.position.set(p.x,ty,p.z);sc.add(m);PORTAL_FX.push({kind:'mist',m,ph:r()*6});}
    else if(k==='ravens'){for(let i=0;i<3;i++)put(new THREE.Mesh(new THREE.BoxGeometry(.14,.1,.22),M(0x101010)),x+(r()-.5),y+.06,z+(r()-.5),r()*3);}}
  if(p.sigil||p.kind==='fort_door'){const col=THEME_GLOW[p.theme]||0xffd060;const l=new THREE.PointLight(col,1.6,9);l.position.set(p.x,ty+1.4,p.z+.6);sc.add(l);
    const N=28;const pos=new Float32Array(N*3);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));const pts=new THREE.Points(g,new THREE.PointsMaterial({color:col,size:.16,transparent:true,opacity:.85,depthWrite:false}));pts.position.set(p.x,ty,p.z);sc.add(pts);
    const runes=[];for(let i=0;i<5;i++){const rm=put(new THREE.Mesh(new THREE.BoxGeometry(.16,.18,.03),M(col,col)),p.x-1.0+i*.5,ty+2.3,p.z+.35);rm.material.emissiveIntensity=.8;runes.push(rm);}
    PORTAL_FX.push({kind:'sigil',pts,N,l,col,ph:r()*6,base:l.intensity});}
}catch(e){}}
function tickPortalFx(dt){const t=performance.now()*.001;for(const f of PORTAL_FX){if(f.kind==='mist'){f.m.material.opacity=.14+Math.sin(t*.4+f.ph)*.06;f.m.rotation.y+=dt*.03;}
  else{const a=f.pts.geometry.attributes.position.array;for(let i=0;i<f.N;i++){const k=(t*.35+f.ph+i*.37)%1;const ang=i*2.4+t*.5;const rr=.4+k*1.4;a[i*3]=Math.cos(ang)*rr;a[i*3+1]=.2+k*2.6;a[i*3+2]=.5+Math.sin(ang)*rr*.6;}f.pts.geometry.attributes.position.needsUpdate=true;f.l.intensity=f.base*(.8+Math.sin(t*2.1+f.ph)*.2);}}}

// ── lockpicking (v80 S142): Oblivion's lock, not a die roll ──
// Each pin is pushed with the pick and must be let go at the top, where it holds for a moment.
// Let go early or late and the pick snaps. Harder locks hold for less time and have more pins.
let lockOpen=false;
const LP={door:null,pins:[],cur:0,phase:'idle',pushed:0,raf:0,rise:170,dwell:260,fall:520,broke:0};
function lpDifficulty(door){ // steady per door: how many pins, and how long the top holds
  const h=String((door&&(door.seed!=null?door.seed:(door.x+'_'+door.z+'_'+(door.floor||0)))) ).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,17);
  const depth=Math.max(0,(door&&door.floor||1)-1);
  const pins=Math.min(5,Math.max((door&&door.minPins)||0,2+(h%3)+(depth>2?1:0)+((door&&door.lockBonus)||0))); // S150 — chests carry a bonus or a floor
  const fin=attrEff('finesse');
  const dwell=Math.round(Math.max(110,300-pins*28-(h%40)+fin*22)); // a steady hand buys time
  return {pins,dwell,fall:Math.round(420+ (h%120))};
}
// S150 — which dungeon chests are locked: every treasure chest, and ordinary ones by floor (1 in 5 on the
// first, 2 in 5 on the second). Steady per cell, so a mimic in the same place wears the same lock.
function chestLockedAt(x,z,floor){
  const h=String(Math.round(x)+'_'+Math.round(z)+'_'+(floor||1)+'_c').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,17);
  return (h%100)<((floor||1)>=2?40:20);
}
function lockChest(ch){
  ch.locked=true;ch.lockBonus=ch.treasure?1:0;ch.lockTitle=ch.treasure?'A locked treasure chest':'A locked chest';
  ch.onPick=()=>{ch.locked=false;if(typeof openLoot==='function')openLoot(ch);};
  return ch;
}
function lpPicks(){const i=BAG.findIndex(b=>b.name==='Lockpick');return i<0?0:(BAG[i].qty||1);}
function lpSpendPick(){const i=BAG.findIndex(b=>b.name==='Lockpick');if(i<0)return 0;const it=BAG[i];it.qty=(it.qty||1)-1;if(it.qty<=0)BAG.splice(i,1);if(typeof renderInv==='function')renderInv();return lpPicks();}
function openLockpick(door){
  const d=lpDifficulty(door);
  LP.door=door;LP.cur=0;LP.phase='idle';LP.pushed=0;LP.dwell=d.dwell;LP.fall=d.fall;LP.broke=0;
  LP.pins=Array.from({length:d.pins},()=>({set:false,y:0}));
  // S327 (Michael's A on #54) — a town lock is picked in a running world: the watch walks and the clock turns, you stand still
  LP.live=!!(door&&door.live);LP.hp=PHP;if(LP.live){const KK=window._K;if(KK)for(const k in KK)KK[k]=false;blocking=false;}
  lockOpen=true;_releasePointerLockForMenu();
  const el=document.getElementById('lockpick');el.style.display='flex';
  document.getElementById('lp-title').textContent=(door&&door.lockTitle)?(d.pins>=4?door.lockTitle+' — a good lock':door.lockTitle):(d.pins>=4?'A good lock':'A locked door');
  lpRender();lpStatus('Push a pin. Press again when it holds.');
  if(!LP.raf)LP.raf=requestAnimationFrame(lpTick);
}
function closeLockpick(){
  lockOpen=false;LP.live=false;if(LP.raf){cancelAnimationFrame(LP.raf);LP.raf=0;}
  const el=document.getElementById('lockpick');if(el)el.style.display='none';
  LP.door=null;LP.phase='idle';const G=document.getElementById('g');if(G)G.focus();
}
// S327 — each frame of a town pick: seen by anyone, it is the lock crime and the pick breaks off; hurt, halted or dead, you leave it
function lpWatch(){if(!lockOpen||!LP.live||LP.phase==='done')return;
  if(dead){closeLockpick();return;}
  if(dlgOpen||PHP<LP.hp){closeLockpick();showMsg('You leave the lock alone.','#c8b880');return;}
  const d=LP.door;const w=(d&&d.house&&typeof WORLD!=='undefined'&&WORLD.pickSeen)?WORLD.pickSeen(d.house):null;
  if(w)closeLockpick();}
function lpStatus(t,col){const el=document.getElementById('lp-status');if(el){el.textContent=t;el.style.color=col||'#c8b890';}}
function lpRender(){
  const box=document.getElementById('lp-pins');if(!box)return;
  if(box.children.length!==LP.pins.length){box.innerHTML='';LP.pins.forEach(()=>{const d=document.createElement('div');d.className='lp-pin';d.appendChild(document.createElement('i'));box.appendChild(d);});}
  LP.pins.forEach((p,i)=>{const el=box.children[i];el.className='lp-pin'+(p.set?' set':'')+(i===LP.cur&&!p.set?' cur':'');
    el.firstChild.style.transform=`translateY(${-(p.set?74:p.y*74)}px)`;});
  const pk=document.getElementById('lp-picks');if(pk)pk.innerHTML=`picks: <b>${lpPicks()}</b> \u00b7 pins set: <b>${LP.pins.filter(p=>p.set).length}/${LP.pins.length}</b>`;
}
// The pin's travel is read from the clock, not from the last animation frame: a press is judged
// against where the pin actually is, even if a frame was dropped.
function lpPhase(){
  if(LP.phase==='done')return 'done';
  if(!LP.pushed)return 'idle';
  const dt=performance.now()-LP.pushed;
  if(dt<LP.rise)return 'rise';
  if(dt<LP.rise+LP.dwell)return 'hold';
  if(dt<LP.rise+LP.dwell+LP.fall)return 'fall';
  return 'idle';
}
function lpPinY(){
  if(!LP.pushed)return 0;
  const dt=performance.now()-LP.pushed,ph=lpPhase();
  if(ph==='rise')return Math.min(1,dt/LP.rise);
  if(ph==='hold')return 1;
  if(ph==='fall')return Math.max(0,1-(dt-LP.rise-LP.dwell)/LP.fall);
  return 0;
}
function lpTick(){
  LP.raf=requestAnimationFrame(lpTick);
  const p=LP.pins[LP.cur];if(!p){lpRender();return;}
  const ph=lpPhase();
  if(!p.set)p.y=lpPinY();
  if(ph==='idle'&&LP.pushed){LP.pushed=0;p.y=0;lpStatus('It slipped back. Push again.');}
  LP.phase=ph;
  lpRender();
}
function lpPress(){
  if(!lockOpen||LP.phase==='done')return;
  const p=LP.pins[LP.cur];if(!p||p.set){lpNextPin();return;}
  const ph=lpPhase();
  if(ph==='idle'){ // push it up
    LP.pushed=performance.now();LP.phase='rise';p.y=0;try{sfxTone(1500+Math.random()*400,1900,.03,.06,'square');}catch(e){}
    lpStatus('Now \u2014 let it go at the top.');lpRender();return;
  }
  if(ph==='rise'){lpBreak('Too soon \u2014 the pin hadn\u2019t reached the shear.');return;}
  if(ph==='fall'){lpBreak('Too late \u2014 the pin was already falling.');return;}
  // 'hold': the moment it sits at the shear
  p.set=true;p.y=1;LP.pushed=0;LP.phase='idle';try{sfxTone(2200,2600,.04,.1,'square');}catch(e){}
  const left=LP.pins.filter(x=>!x.set).length;
  if(!left){lpWin();return;}
  lpNextPin();lpStatus('It holds. '+left+' to go.','#c8e88a');lpRender();
}
function lpNextPin(){const n=LP.pins.length;for(let k=1;k<=n;k++){const i=(LP.cur+k)%n;if(!LP.pins[i].set){LP.cur=i;LP.phase='idle';LP.pushed=0;LP.pins[i].y=0;lpRender();return;}}}
function lpPickPin(dir){const n=LP.pins.length;for(let k=1;k<=n;k++){const i=((LP.cur+dir*k)%n+n)%n;if(!LP.pins[i].set){LP.cur=i;LP.phase='idle';LP.pushed=0;LP.pins[i].y=0;lpRender();return;}}}
function lpBreak(why){
  const p=LP.pins[LP.cur];if(p)p.y=0;LP.phase='idle';LP.pushed=0;LP.broke++;
  const left=lpSpendPick();
  try{sfxTone(2600,1400,.06,.16,'square');}catch(e){}
  const box=document.getElementById('lp-pins');if(box&&box.children[LP.cur]){const el=box.children[LP.cur];el.classList.add('broke');setTimeout(()=>el.classList.remove('broke'),260);}
  // the last pin you set falls with it — the lock gives ground grudgingly
  for(let i=LP.pins.length-1;i>=0;i--){if(LP.pins[i].set){LP.pins[i].set=false;LP.pins[i].y=0;break;}}
  lpRender();
  if(left<=0){lpStatus(why+' That was your last pick.','#e88a8a');lpFail();return;}
  lpStatus(why+` The pick snaps. ${left} left.`,'#e8a880');
}
function lpFail(){
  LP.phase='done';
  setTimeout(()=>{closeLockpick();showMsg('No picks left. The lock holds.','#cc8844');},900);
}
function lpWin(){
  LP.phase='done';lpRender();lpStatus('The lock gives.','#ffd700');
  const door=LP.door;
  try{sndDoorUnlock();}catch(e){}
  setTimeout(()=>{
    closeLockpick();
    if(door&&door.onPick){try{door.onPick();}catch(e){console.error(e);}} // S150 — a chest opens itself
    else if(door){door.open=true;if(door.mesh&&typeof dScene!=='undefined')dScene.remove(door.mesh);
      try{const map=activeMap();if(map[door.z]&&map[door.z][door.x]===5)map[door.z][door.x]=1;}catch(e){}}
    (worldState.stats||(worldState.stats={})).picked=((worldState.stats||{}).picked||0)+1;
    showMsg('The lock gives.','#ffd700');
  },620);
}
// input: the overlay takes the click, the window takes the keys
(function(){
  const el=document.getElementById('lockpick');
  if(el)el.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();lpPress();});
  window.addEventListener('keydown',e=>{
    if(!lockOpen)return;
    if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();lpPress();return;}
    if(e.code==='ArrowLeft'){e.preventDefault();lpPickPin(-1);return;}
    if(e.code==='ArrowRight'){e.preventDefault();lpPickPin(1);return;}
    if(e.code==='Escape'){e.preventDefault();e.stopPropagation();closeLockpick();showMsg('You leave the lock alone.','#c8b880');return;}
    e.preventDefault();e.stopPropagation();
  },true);
})();
// ── lockpicking: the floating key is gone; a lock is worked with a pick and a steady hand ──
function pickChance(){const fin=attrEff('finesse');return Math.min(.92,.35+fin*.07+(level||1)*.01);}
function tryLockpick(door){const i=BAG.findIndex(b=>b.name==='Lockpick');if(i<0){showMsg('Locked. A lockpick would do it — the goods shops sell them.','#cc8844');try{sfxTone(400,300,.08,.1,'square');}catch(e){}return false;}
  openLockpick(door);return true; // v80 S142 — the lock is worked by hand now
  /* eslint-disable no-unreachable */
  const ok=Math.random()<pickChance();try{for(let k=0;k<3;k++)setTimeout(()=>sfxTone(1800+Math.random()*600,1200,.03,.08,'square'),k*140);}catch(e){}
  setTimeout(()=>{if(ok){sndDoorUnlock();door.open=true;dScene.remove(door.mesh);const map=activeMap();if(map[door.z]&&map[door.z][door.x]===5)map[door.z][door.x]=1;showMsg('The lock gives.','#ffd700');(worldState.stats||(worldState.stats={})).picked=((worldState.stats||{}).picked||0)+1;}
    else{const it=BAG[i];it.qty=(it.qty||1)-1;if(it.qty<=0)BAG.splice(i,1);try{sfxTone(2600,1400,.06,.16,'square');}catch(e){}showMsg(`The pick snaps. ${BAG.some(b=>b.name==='Lockpick')?'Try again.':'That was your last one.'}`,'#cc8844');if(typeof renderInv==='function')renderInv();}},460);return true;}

// ═══ v80 — LAIR CAVERNS AND DRAGONS ══════════════════════════════════
// Every lair carries a cavern (a portal flagged lair:{...}); the beast at the mouth still guards the approach,
// and inside, in the deepest room, the lair's true master waits on its hoard. Dragons are the largest antibodies:
// where the binding tore worst, what the world made has wings. The Salt Mouth has one; a few lairs beyond do too.
function lairFinish(portal){try{if(!portal||!portal.lair||!ENEMIES.length)return;const L=portal.lair;if(worldState.masters&&worldState.masters[portal.seed]){showMsg('The master of this place is dead. Its hoard is long gone.','#a89878');return;}
  // the deepest room: the enemy farthest from the entrance, on the lowest floor there is
  const ent={x:(typeof dEntranceX!=='undefined')?dEntranceX:0,z:(typeof dEntranceZ!=='undefined')?dEntranceZ:0};
  const pool=ENEMIES.filter(e=>!e.dead);const low=Math.max(...pool.map(e=>e.floor||1));const cand=pool.filter(e=>(e.floor||1)===low).sort((a,b)=>Math.hypot(b.x-ent.x,b.z-ent.z)-Math.hypot(a.x-ent.x,a.z-ent.z));
  const e=cand[0];if(!e)return;
  const dragon=!!L.dragon;e.name=dragon?`${L.place} Wyrm`:`${L.place} — ${L.boss}`;e.boss=true;e.dragon=dragon;
  e.hp=e.maxHp=Math.round(e.maxHp*(dragon?6:3)*(1+level*.08));{const k=(dragon?2.2:1.6)*(1+level*.04);if(e.dmg)e.dmg=Math.round(e.dmg*k);e.dmgMult=(e.dmgMult||1)*k;}e.master=true;e.spd=(e.spd||1)*(dragon?.9:1.05); // v80 S130 — the master scales with level like the world's lair beast
  if(e.mesh){e.mesh.scale.multiplyScalar(dragon?2.6:1.5);e._detailed=false;}
  if(dragon)dragonBody(e,2.88); // S219 — the world's dragon's size (its zone scale 1.8 × 1.6)
  if(e.hpFg&&e.hpFg.parent&&e.hpFg.parent.material)e.hpFg.parent.material.color.setHex(dragon?0xff5020:0xffb040);
  // the hoard beside it
  const group=new THREE.Group();const {lid}=buildChestShell(group,1.3,0xaa8030);group.position.set(e.x+1.2,(e.floor===2?FLOOR2_Y:0),e.z+.6);dScene.add(group);
  const items=[];const gv=Math.round((60+level*25)*(dragon?3:1.8));items.push({name:'Gold Coins',ico:'●',type:'gold',value:gv,qty:1});
  const MATS=dragon?['Silver','Gold','Mithril']:['Iron','Steel','Silver'];const mt=MATS[Math.floor(Math.random()*MATS.length)];const tier=dragon?5+Math.floor(Math.random()*2):3+Math.floor(Math.random()*2);
  items.push(Math.random()<.5?{name:`${mt} Sword`,ico:'⚔',type:'equip',slot:'weapon',atk:[8+tier*2,11+tier*2],weaponShape:'sword',wType:'slash',weight:2.5,tier,material:mt,buyPrice:60*tier,sellMult:.45}:{name:`${mt} Cuirass`,ico:'👕',type:'equip',slot:'chest',def:2+tier,weight:6,tier,material:mt,buyPrice:70*tier,sellMult:.45});
  if(dragon)items.push({name:'Dragon Scale',ico:'🔥',type:'misc',buyPrice:400,sellMult:.6,weight:.8,qty:1+Math.floor(Math.random()*2)});
  items.push({name:'Greater Potion',ico:'🧪',type:'potion',heal:60,buyPrice:45,sellMult:.4,qty:2});
  CHESTS.push({x:e.x+1.2,z:e.z+.6,opened:false,lid,treasure:true,floor:e.floor||1,mesh:group,items,displayName:dragon?"The Wyrm's Hoard":'The Hoard'});
  showMsg(dragon?'The air is hot, and something very large is breathing in the dark.':'Something large is waiting further in.','#ffb060');
  window._lairBoss=e;}catch(err){console.warn('lairFinish',err);}}
// S219 — a lair's wyrm on the dragon's own body (S177, the wolf's bones with a neck, a tail and wings): the master keeps
// the numbers it was given (the lair's beast or the cavern's deepest foe, scaled up), and only its body is swapped. What it
// wore goes (a person's rig drops out of tickPeople once its root has no parent; a box brute's parts are removed); the
// health bar planes and the lights stay. rs is the dragon's scale in the world's own units, whatever the group's scale.
function dragonBody(e,rs){if(!e||!e.mesh||!WOLF_KINDS.Dragon)return;const g=e.mesh,L=e.limbs&&!Array.isArray(e.limbs)?e.limbs:{};
  g.children.slice().forEach(c=>{if(c===L.hpBg||c===e.hpFg||c===e.hpBg||c.isLight)return;g.remove(c);});
  const w=buildWolf('Dragon',rs/(g.scale.x||1));g.add(w.root);w.e=e;
  e.limbs={torso:w.mesh,wolf:w,hpBg:L.hpBg};e._dragonBuilt=true;e._detailed=true;return w;}
// dragon: wings, a long neck and head, a tail, horns — grown on the creature's base mesh
function detailDragon(e){if(!e.mesh||!e.mesh.isGroup||e._dragonBuilt)return;if(e.limbs&&e.limbs.wolf){e._dragonBuilt=true;return;}e._dragonBuilt=true;const g=e.mesh;const s=1/(g.scale.x||1); // parts are in local units; the group is scaled
  const M=(c,em)=>new THREE.MeshLambertMaterial({color:c,emissive:em||0,side:THREE.DoubleSide});const add=(m,x,y,z,rx,ry,rz)=>{m.position.set(x,y,z);if(rx)m.rotation.x=rx;if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;g.add(m);return m;};
  const scale=M(0x5a2a1a),belly=M(0x9a6a3a),horn=M(0xe0d0b0);
  // neck and head
  for(let i=0;i<4;i++)add(new THREE.Mesh(new THREE.BoxGeometry(.28-i*.03,.28-i*.03,.36),scale),0,1.0+i*.22,.7+i*.32,-.5);
  const head=add(new THREE.Mesh(new THREE.BoxGeometry(.36,.28,.6),scale),0,1.9,2.0);add(new THREE.Mesh(new THREE.BoxGeometry(.3,.12,.4),belly),0,1.78,2.2);
  add(new THREE.Mesh(new THREE.ConeGeometry(.05,.3,5),horn),-.12,2.1,1.8,-.4,0,.3);add(new THREE.Mesh(new THREE.ConeGeometry(.05,.3,5),horn),.12,2.1,1.8,-.4,0,-.3);
  add(new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.06),M(0xff8020,0xff4000)),-.1,1.95,2.3);add(new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.06),M(0xff8020,0xff4000)),.1,1.95,2.3);
  // wings: two folded membranes on spars
  for(let s2=-1;s2<=1;s2+=2){const w=add(new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.1),M(0x3a1a12)),s2*1.1,1.3,-.2,0,0,s2*.35);w._wing=s2;add(new THREE.Mesh(new THREE.CylinderGeometry(.03,.04,1.9,5),scale),s2*1.1,1.32,-.2,0,0,s2*(Math.PI/2-.35));}
  // tail
  for(let i=0;i<5;i++)add(new THREE.Mesh(new THREE.BoxGeometry(.24-i*.04,.22-i*.03,.4),scale),0,.55-i*.04,-.9-i*.36,.15);
  add(new THREE.Mesh(new THREE.ConeGeometry(.08,.4,5),horn),0,.4,-2.85,-1.3);
  // dorsal spines
  for(let i=0;i<5;i++)add(new THREE.Mesh(new THREE.ConeGeometry(.05,.22,4),horn),0,.95,.5-i*.3);
}
// breath: a cone of fire every few seconds within range; damage if you're in it
const _BREATH=[];
function dragonBreath(e){const d=Math.hypot(e.x-px,e.z-pz);if(d>11)return;const ang=Math.atan2(px-e.x,pz-e.z);e._breathT=5.5+Math.random()*2;
  showMsg(`${e.name} draws breath.`,'#ffb060');try{sfxNoise(.5,0,0,.2,700);}catch(err){}
  setTimeout(()=>{if(e.dead)return;const N=60;const pos=new Float32Array(N*3);const vel=[];for(let i=0;i<N;i++){pos[i*3]=e.x;pos[i*3+1]=(e.floor===2?FLOOR2_Y:0)+1.6;pos[i*3+2]=e.z;const a=ang+(Math.random()-.5)*.6;vel.push([Math.sin(a)*(6+Math.random()*4),(Math.random()-.3)*1.5,Math.cos(a)*(6+Math.random()*4)]);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const pts=new THREE.Points(geo,new THREE.PointsMaterial({color:0xff7020,size:.45,transparent:true,opacity:.9,depthWrite:false}));const sc=(typeof scene!=='undefined')?scene:dScene;sc.add(pts);
    const l=new THREE.PointLight(0xff6020,2.5,12);l.position.set(e.x,(e.floor===2?FLOOR2_Y:0)+1.5,e.z);sc.add(l);_BREATH.push({pts,vel,t:0,l,sc});
    try{sfxNoise(1.1,0,0,.35,1200);sfxTone(120,60,1.0,.2,'sawtooth');}catch(err){}
    const dx=px-e.x,dz=pz-e.z,dd=Math.hypot(dx,dz);const ta=Math.atan2(dx,dz);let diff=Math.abs(ta-ang);if(diff>Math.PI)diff=Math.PI*2-diff;
    if(dd<10&&diff<.45){const dmg=_warded(Math.round((18+level*1.4)*(blocking?.5:1)));PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;updateHUD();showMsg(`Fire! ${dmg} damage.`,'#ff6040');if(PHP<=0)playerDead();}
    else showMsg('The fire misses you.','#c8e88a');},900);}
function tickBreath(dt){for(let i=_BREATH.length-1;i>=0;i--){const b=_BREATH[i];b.t+=dt;const a=b.pts.geometry.attributes.position.array;for(let k=0;k<b.vel.length;k++){a[k*3]+=b.vel[k][0]*dt;a[k*3+1]+=b.vel[k][1]*dt;a[k*3+2]+=b.vel[k][2]*dt;b.vel[k][1]+=dt*.8;}b.pts.geometry.attributes.position.needsUpdate=true;b.pts.material.opacity=Math.max(0,.9-b.t*.9);b.l.intensity=Math.max(0,2.5-b.t*3);if(b.t>1.1){b.sc.remove(b.pts);b.sc.remove(b.l);_BREATH.splice(i,1);}}}
function tickDragons(dt){const E=activeZoneId==='world'?(ZONES.world&&ZONES.world.enemies||[]):(typeof ENEMIES!=='undefined'?ENEMIES:[]);for(const e of E){if(e.dead||!e.dragon)continue;if(!e._dragonBuilt)detailDragon(e);
    // wings beat while alert
    if(e.mesh&&e.alert){const t=performance.now()*.004;e.mesh.children.forEach(c=>{if(c._wing)c.rotation.z=c._wing*(.35+Math.sin(t)*.35);});}
    if(!e.alert)continue;e._breathT=(e._breathT==null?3:e._breathT)-dt;if(e._breathT<=0)dragonBreath(e);}
  tickBreath(dt);}

// v80 — step back into a saved place once the world around its door exists
function _reenterPlace(W,tries){tries=tries||0;try{
  if(W.kind==='house'){const houses=(ZONES.world&&ZONES.world.houses)||[];let hs=houses.find(x=>x.id===W.id);
    // S243 — a save from before house ids followed their lots can name another building: the door it was saved behind decides
    if(W.door&&W.door.x!=null&&!W.parent){const at=h=>Math.hypot(h.exitX-W.door.x,h.exitZ-W.door.z);if(!hs||at(hs)>1){const b=houses.find(h=>h.exitX!=null&&at(h)<.5);if(b)hs=b;}}
    if(!hs&&W.parent){const p=houses.find(x=>x.id===W.parent);if(p&&typeof WORLD!=='undefined'&&WORLD.cellarFor)hs=WORLD.cellarFor(p);}
    // S326 — the town is built here and now rather than waited for behind the world's job queue, which a slow machine drains a job or two a frame; the wait is 30 s of the clock, not 60 tries
    if(!hs&&typeof WORLD!=='undefined'&&WORLD.genSettlement){const sid=W.site||((/^g_(.+)_\d+(?:_cellar)?$/.exec(W.parent||W.id||'')||[])[1]);
      if(sid&&!WORLD.settle.has(sid)){const s=WORLD.siteAnywhere(sid);if(s&&s.pad>0){try{WORLD.genSettlement(s);}catch(err){console.warn('reenter gen',err);}if(WORLD.settle.has(sid))return _reenterPlace(W,tries+1);}}}
    if(W._t0==null)W._t0=performance.now();
    if(!hs){if(tries<60||performance.now()-W._t0<30000){if(typeof WORLD!=='undefined')WORLD.tick(1/60,performance.now());setTimeout(()=>_reenterPlace(W,tries+1),100);}else showMsg('The door you saved behind has moved on. You are outside it.','#c8b880');return;}
    window._pendingPos={x:W.x,z:W.z,yaw:W.yaw,jumpY:W.jumpY};goToInterior(hs);return;}
  if(W.kind==='dungeon'){const e=(typeof WORLD!=='undefined')&&WORLD.doorAnywhere(W.seed);if(!e){showMsg('The gate you saved in is closed to you. You are outside it.','#c8b880');return;}
    const p=makePortalDef(e);const wp=WORLD.dungeonPos[W.seed];if(wp){p.x=wp.x;p.z=wp.z;}p.zone='world';
    goToDungeon(p);setTimeout(()=>{try{if(W.floor===2&&typeof FLOOR2_Y!=='undefined'){currentFloor=2;}if(W.x!=null){px=W.x;pz=W.z;}if(W.yaw!=null)yaw=W.yaw;if(W.jumpY!=null)jumpY=W.jumpY;else jumpY=(currentFloor===2?FLOOR2_Y:0);}catch(err){}},900);return;}
}catch(err){console.warn('reenter',err);}}
function playerDead(){
  if(typeof WORLD!=='undefined'&&WORLD.duelDown&&WORLD.duelDown())return; /* S373 — the ring holds you at 1 health */
  if(typeof WORLD!=='undefined')WORLD.noteDeath(); // v80 — the reader counts
  if(dead)return;dead=true;
  // v80 S9 — no respawn, no bag wipe, no autosave: a death screen that loads a save.
  const dunName=currentPortal?currentPortal.name:(activeZoneId==='world'?'the open country':'the wild');
  addLog('💀','Fell in '+dunName+'.');
  silenceSigilHum();castT=0;blocking=false;staggered=[];
  if(typeof _releasePointerLockForMenu==='function')_releasePointerLockForMenu();
  let ov=document.getElementById('died');
  if(!ov){
    ov=document.createElement('div');ov.id='died';
    ov.style.cssText='position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(10,4,4,.86);color:#e8d8b0;font-family:Georgia,serif;';
    ov.innerHTML='<div style="font-size:64px;letter-spacing:.2em;color:#b02828;text-shadow:0 0 24px #600">YOU DIED</div>'+
      '<div id="died-sub" style="margin:10px 0 28px;color:#a89878;font-size:16px"></div>'+
      '<div style="display:flex;gap:14px"><button type="button" id="died-load" style="padding:12px 22px;font:16px Georgia,serif;background:#3a2a16;color:#f0e2c0;border:1px solid #8a6a3a;border-radius:4px;cursor:pointer">Load last save</button>'+
      '<button type="button" id="died-menu" style="padding:12px 22px;font:16px Georgia,serif;background:#2a2020;color:#c8b8a0;border:1px solid #5a4a3a;border-radius:4px;cursor:pointer">Main menu</button></div>';
    document.body.appendChild(ov);
    ov.querySelector('#died-load').onclick=()=>{ if(!reloadActiveSlot()){ov.querySelector('#died-sub').textContent='No save to load — start a new adventure from the menu.';} };
    ov.querySelector('#died-menu').onclick=()=>{location.reload();};
  }
  const _k=(typeof ssActiveKey==='function')?ssActiveKey():null;const d=_k?ssEntry(_k):null;
  ov.querySelector('#died-sub').textContent=d?`Last save: ${d.kind==='auto'?'autosave':'slot '+(d.slot+1)} — ${d.zone==='world'?'the open country':d.zone||'…'}, level ${d.level||'?'}`:'No save found.';
  ov.style.display='flex';
}
// Reload the active slot in place (used by the death screen).
function reloadActiveSlot(){
  const key=ssActiveKey();if(!key||!ssEntry(key))return false;
  ssLoad(key).then(d=>{if(!d)return;
  const ov=document.getElementById('died');if(ov)ov.style.display='none';
  dead=false;
  doFade(()=>{
    _applyLoadData(d);
    _applyZoneFromSave(d);
    PHP=Math.max(1,PHP);blocking=false;staggered=[];
    updateHUD();
    showMsg('Loaded.','#c8b880');
  });
  });
  return true;
}
