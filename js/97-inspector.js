// ═══════════════════════════════════════
// v80 — Session 492 — THE MESH INSPECTOR
//
// Every mesh the game builds, in one place, built by the game's own builders so it never drifts from what ships:
// a nested list by group (people, creatures, buildings, ships, plants and trees and rocks), a thumbnail grid per group,
// and a stage where one piece turns under an orbit camera, animated by its own poses and gaits, at any hour's light,
// with a bandit beside it for scale and its distant copy beside that. Opened from the title screen or the game with
// `openInspector()` (the console), or by loading the page as `index.html?inspector`; the control room links to it.
// While it is open the main loop hands it the frame (90-main.js) and nothing else ticks. Closing it hands the
// renderer's canvas back and resumes the game where it was. Nothing here runs unless it is opened.
// ═══════════════════════════════════════
const INSPECTOR={open:false,entries:[],groups:[],built:new Map(),sel:null,ui:null,scene:null,cam:null,orbit:null,opts:{anim:true,wire:false,lo:true,figure:true,ground:true,hour:12},t:0,prevT:0};

// ── the registry: groups → entries, each built by the builder the game uses ──
function inspRegistry(){
  const E=[];const add=(group,sub,name,file,build)=>E.push({id:E.length,group,sub,name,file,build});
  const idlePerson=rig=>(t)=>pwApply(rig,pwIdle(t,{holds:rig.holds,gear:rig.g.gear,elder:rig.g.age==='elder'}));
  const personAnim=rig=>{let ph=0;return (t,dt,mode)=>{if(mode==='walk'){ph=(ph+dt*1.4)%1;pwApply(rig,pwWalk(ph,{holds:rig.holds,gear:rig.g.gear}));}
    else if(mode==='wave')pwApply(rig,pwWave(t,{holds:rig.holds,gear:rig.g.gear,elder:rig.g.age==='elder'}));else idlePerson(rig)(t);};};
  // 1. People — the townsfolk of each people in their nation's dress, by role, then the foes on the people's body
  const PEOPLE=[['gatelander','gatelands','Gatelanders'],['markman','mark','Markmen'],['aurennais','aurenne','Aurennais'],['oldblood','gatelands','Oldblood']];
  const ROLES=[['villager',0],['villager',1],['farmer',0],['fisher',1],['merchant',0],['innkeeper',1],['smith',0],['apothecary',1],['guard',0],['captain',0],['priest',0],['sister',1],['scholar',0],['lord',0],['lady',1],['elder',0],['child',0]];
  for(const [pk,nk,label] of PEOPLE)for(const [role,female] of ROLES){
    add('People',label,role+(female?' (f)':''),'32-people.js',()=>{
      const g=personGenome({name:'Inspector '+label+' '+role+female,role,people:pk,female:!!female},{nation:nk,key:'inspector'});
      const rig=buildPerson(g,{noLod:true});PEOPLE_RIGS.delete(rig);const anim=personAnim(rig);anim(0,0,'idle');
      return {obj:rig.root,anim,modes:['idle','walk','wave']};});}
  for(const type of Object.keys(FOE_DRESS))add('People','Foes on the body',type,'32-people.js',()=>{
    const rig=buildFoe(type,0,0);PEOPLE_RIGS.delete(rig);const anim=personAnim(rig);anim(0,0,'idle');return {obj:rig.root,anim,modes:['idle','walk','wave']};});
  // 2. Creatures — the wolf kit's kinds, the spider kit's, then the zone and dungeon foes that have a body of their own
  for(const name of Object.keys(WOLF_KINDS))add('Creatures','On the wolf kit',name,'34-creatures.js',()=>{
    const rig=buildWolf(name,1);WOLF_RIGS.delete(rig);let ph=0;
    const anim=(t,dt,mode)=>{WG_L=wolfLegs(rig.k);WG_LK=rig.k.legK||1;const s=rig.root.scale.x;let out;
      if(mode==='trot'||mode==='gallop'){const G=mode==='gallop'?WG.GALLOP:WG.TROT;const v=mode==='gallop'?5.2:2.2;ph=(ph+v*dt/(G.cycle*s*WG_LK))%1;out=wgStride(G,ph,t,mode==='gallop');}
      else out=wgStand(t);
      if(rig.B.wingL){rig.wing=1;rig.flap=((rig.flap||0)+dt*6.5)%(Math.PI*2);}
      wgApply(rig,out);WG_L=WOLF_LEGS;WG_LK=1;};
    anim(0,0,'stand');return {obj:rig.root,anim,modes:['stand','trot','gallop']};});
  for(const name of Object.keys(SPIDER_KINDS))add('Creatures','On the spider kit',name,'34-creatures.js',()=>{
    const rig=buildSpider(name,1);WOLF_RIGS.delete(rig);let ph=0;
    const anim=(t,dt,mode)=>{const K=rig.k;if(mode==='walk'||mode==='run'){ph=(ph+(mode==='run'?2.4:1.3)*dt)%1;sgApply(rig,sgStride(ph,t,mode==='run'?SG.RUN:SG,K));}else sgApply(rig,sgStand(t,K));};
    anim(0,0,'stand');return {obj:rig.root,anim,modes:['stand','walk','run']};});
  for(const type of ['Shore Wisp','Shark'])add('Creatures','Of their own shape',type,'42-zone-enemies.js',()=>{
    const sc=new THREE.Group();const e=buildZoneEnemy(sc,[],0,0,type);const obj=(e&&e.g)||(e&&e.mesh)||sc.children[0]||sc;if(obj.parent)obj.parent.remove(obj);
    return {obj,anim:null};});
  // the dungeon's own table is local to buildDungeon; these four carry its colours and scales so its builder can be called here
  const DUN={'Slime':{col:0x5fd85f,scale:.8,buildFn:'slime',eyeCol:0xffdd44,light:0x44ff44},
    'Small Slime':{col:0x5fd85f,scale:.42,buildFn:'slime',eyeCol:0xffdd44,light:0x44ff44},
    'Fire Elemental':{col:0xff5522,scale:.9,buildFn:'elemental',eyeCol:0xffff66,light:0xff7733},
    'Mimic':{col:0x6a4a2a,scale:1,buildFn:'mimic',eyeCol:0xffee88,light:0}};
  for(const name of Object.keys(DUN))add('Creatures','Of their own shape',name,'56-dungeon-build.js',()=>{
    if(typeof _dungeonBuildEnemy!=='function')throw new Error('no dungeon built yet');const m=_dungeonBuildEnemy(DUN[name],name);
    const obj=m&&m.isObject3D?m:(m&&(m.g||m.mesh));if(obj.parent)obj.parent.remove(obj);return {obj,anim:null};});
  // 3. Buildings — a house of every style with its distant copy, the civic shapes, the walls, the fort keep, a bridge, the POIs, the town's furniture
  for(const key of WORLD.houseStyles())add('Buildings','Houses by style',key,'82-world-structures.js',()=>{
    const r=WORLD.houseProto(key,7,6,pHash('insp|'+key),{chimney:true});return {obj:inspMesh(r.hi),lo:r.lo&&inspMesh(r.lo)};});
  for(const [kind,w,d] of [['church',9,14],['keep',10,10]])add('Buildings','Civic',kind,'82-world-structures.js',()=>{
    const r=WORLD.civicProto(kind,w,d);return {obj:inspMesh(r.hi),lo:r.lo&&inspMesh(r.lo)};});
  add('Buildings','Civic','fort keep','82-world-structures.js',()=>({obj:inspMesh(fortKeepGeoHi(11,9,7.2,0xaa2222,pRng(7)))}));
  add('Buildings','Walls and gates','wall segment','82-world-structures.js',()=>({obj:inspMesh(wallSegHi(1.2,12,4.5,0,new THREE.Color(0x8a8478),new THREE.Color(0x6e695f),0,0,pRng(11),false))}));
  add('Buildings','Walls and gates','gate tower','82-world-structures.js',()=>({obj:inspMesh(gateTowerHi(1.2,6.5,new THREE.Color(0x6e695f),new THREE.Color(0x5a3a2a),pRng(13)))}));
  add('Buildings','Walls and gates','bridge','82-world-structures.js',()=>({obj:inspMesh(bridgeGeo(24,2,7))}));
  for(const k of ['tower','shrine','crag'])add('Buildings','Places','poi '+k,'87-world-quests.js',()=>({obj:inspMesh(WORLD.poiGeo(k))}));
  for(const k of ['well','stall','tent','ruin','stone'])add('Buildings','Town furniture',k,'82-world-structures.js',()=>{
    const r=WORLD.furnProto(k,pHash('insp|'+k));return {obj:inspMesh(r.hi),lo:r.lo&&inspMesh(r.lo)};});
  // 4. Ships — each class in each look with its rig, the sails trimming to a wind that walks round; the harbour boats
  for(const [kind,L,W] of [['sloop',13,4.4],['cog',17,5.6],['galleon',22,7]])for(const look of ['player','pirate','merchant'])
    add('Ships',kind,look,'85-world-sea.js',()=>{const m=WORLD.buildShipMesh(L,W,look);let th=0;
      return {obj:m,anim:(t,dt)=>{th=Math.sin(t*.25)*Math.PI;shipTrim(m,th,dt);},modes:['sails']};});
  for(let v=0;v<4;v++)add('Ships','Harbour boats','boat '+(v+1),'85-world-sea.js',()=>{const r=WORLD.boatBake(v);return {obj:new THREE.Mesh(r.geo,SHIP_MAT)};});
  // 5. Plants, trees and rocks — every herb whole and picked, the tree and scrub prototypes, the rocks of each biome
  for(const key of Object.keys(HERB_DEF))add('Plants, trees, rocks','Herbs',HERB_DEF[key].name||key,'30-plants.js',()=>{
    const g=plantGeo(key,false),p=plantGeo(key,true);return {obj:new THREE.Mesh(g,PLANT_MAT),lo:p&&new THREE.Mesh(p,PLANT_MAT),loLabel:'picked'};});
  const TREES=['oak','birch','broadleaf','conifer','pine','spruce','snowpine','willow','autumn','dead','bush','scrub','mushroom','ember'];
  for(const k of TREES)add('Plants, trees, rocks','Trees and scrub',k,'80-world-terrain.js',()=>{if(!PROTO.oak)buildProtos();const g=PROTO[k];if(!g)throw new Error('no prototype '+k);return {obj:inspMesh(g)};});
  for(const dress of Object.keys(ROCK_DRESS))for(const kind of ['boulder','outcrop','cluster'])add('Plants, trees, rocks','Rocks: '+dress,kind,'80-world-terrain.js',()=>{
    const key=rockProto(dress,kind);return {obj:inspMesh(PROTO[key])};});
  return E;
}
function inspMesh(geo){const m=new THREE.Mesh(geo,VC_MAT);m.castShadow=true;m.receiveShadow=true;return m;}

// ── stats of a built thing ──
function inspStats(obj){let tris=0,calls=0;obj.updateMatrixWorld(true);obj.traverse(o=>{if(!o.isMesh||!o.visible)return;const g=o.geometry;if(!g)return;
  const n=(g.index?g.index.count:g.attributes.position?g.attributes.position.count:0)/3;tris+=n*(o.isInstancedMesh?o.count:1);calls++;});return {tris:Math.round(tris),calls};}
function inspBox(obj){obj.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(obj);if(b.isEmpty())b.set(new THREE.Vector3(-.5,0,-.5),new THREE.Vector3(.5,1,.5));return b;}

// ── building and showing ──
function inspBuild(e){if(INSPECTOR.built.has(e.id))return INSPECTOR.built.get(e.id);
  let r;try{r=e.build();if(!r||!r.obj)throw new Error('builder returned nothing');r.obj.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    const b=inspBox(r.obj);r.box=b;r.stats=inspStats(r.obj);r.mode=r.modes?r.modes[0]:null;}
  catch(err){r={obj:null,err:String(err&&err.message||err)};console.warn('inspector: '+e.name,err);}
  INSPECTOR.built.set(e.id,r);return r;}
function inspShow(e){const I=INSPECTOR;I.sel=e;const r=inspBuild(e);const S=I.stage;while(S.children.length)S.remove(S.children[0]);
  const bar=I.ui.querySelector('#insp-name');const st=I.ui.querySelector('#insp-stats');const modes=I.ui.querySelector('#insp-modes');modes.innerHTML='';
  if(!r.obj){bar.textContent=e.name+' — failed';st.textContent=r.err;return;}
  const b=r.box,c=b.getCenter(new THREE.Vector3()),sz=b.getSize(new THREE.Vector3());const rad=Math.max(sz.x,sz.y,sz.z,.4)/2;
  r.obj.position.set(-c.x,-b.min.y,-c.z);S.add(r.obj);
  if(r.lo&&I.opts.lo){const lb=inspBox(r.lo),lc=lb.getCenter(new THREE.Vector3());r.lo.position.set(-lc.x+sz.x+rad*.6,-lb.min.y,-lc.z);S.add(r.lo);}
  if(I.opts.figure&&I.figure){I.figure.root.position.set(-(sz.x/2+rad*.5+.5),0,0);S.add(I.figure.root);}
  if(I.opts.ground){const gr=new THREE.Mesh(new THREE.CircleGeometry(Math.max(rad*2.2,3),48),new THREE.MeshLambertMaterial({color:0x4d5540}));gr.rotation.x=-Math.PI/2;gr.position.y=-.005;gr.receiveShadow=true;S.add(gr);}
  I.orbit.target.set(0,sz.y*.45,0);I.orbit.dist=rad/Math.sin(I.cam.fov*Math.PI/360)*1.25+rad*.2;I.orbit.theta=.65;I.orbit.phi=1.2;
  inspWire(I.opts.wire);
  bar.textContent=e.group+' › '+e.sub+' › '+e.name;st.textContent=`${r.stats.tris.toLocaleString()} triangles · ${r.stats.calls} draw call${r.stats.calls===1?'':'s'} · ${e.file}`+(r.lo?` · ${r.loLabel||'distant copy'}: ${inspStats(r.lo).tris.toLocaleString()} triangles`:'');
  if(r.modes)for(const m of r.modes){const bt=document.createElement('button');bt.textContent=m;bt.className=m===r.mode?'on':'';bt.onclick=()=>{r.mode=m;[...modes.children].forEach(x=>x.className=x.textContent===m?'on':'');};modes.appendChild(bt);}
  const sun=I.sun;const s=Math.max(rad*2.5,4);sun.shadow.camera.left=-s;sun.shadow.camera.right=s;sun.shadow.camera.top=s;sun.shadow.camera.bottom=-s;sun.shadow.camera.far=s*6;sun.shadow.camera.updateProjectionMatrix();
  I.ui.querySelectorAll('#insp-tree .ent').forEach(x=>x.classList.toggle('on',+x.dataset.id===e.id));}
function inspWire(on){INSPECTOR.stage.traverse(o=>{if(o.isMesh&&o.material&&o.material.wireframe!==undefined){if(!o.userData._mat)o.userData._mat=o.material;o.material=on?(o.userData._wire||(o.userData._wire=new THREE.MeshBasicMaterial({wireframe:true,color:0xe8d8a0}))):o.userData._mat;}});}

// ── the light of the hour ──
function inspLight(h){const I=INSPECTOR;const a=(h-6)/12*Math.PI;const el=Math.sin(a),az=Math.cos(a);const up=Math.max(el,0);
  I.sun.position.set(az*8,Math.max(el,-.2)*8+.5,3.5);I.sun.intensity=.25+1.0*up;const warm=new THREE.Color(0xffb070),white=new THREE.Color(0xfff2dc),night=new THREE.Color(0x6070a0);
  I.sun.color.copy(el<0?night:warm.clone().lerp(white,Math.min(1,up*1.6)));I.hemi.intensity=.25+.45*up;I.amb.intensity=.12+.3*up;
  const sky=new THREE.Color(0x1a2030).lerp(new THREE.Color(0x8fb4e0),Math.min(1,up*1.3+.05));I.scene.background=sky;}

// ── thumbnails: each entry of a group rendered once, small ──
function inspThumb(e){const I=INSPECTOR;const r=inspBuild(e);if(!r.obj)return null;const W=180,H=135;
  if(!I.rt){I.rt=new THREE.WebGLRenderTarget(W,H);I.rtPix=new Uint8Array(W*H*4);}
  const sc=new THREE.Scene();sc.background=new THREE.Color(0x242a33);sc.add(new THREE.HemisphereLight(0xbcd6ff,0x6b7a48,.8));const d=new THREE.DirectionalLight(0xfff2dc,1.0);d.position.set(3,6,4);sc.add(d);
  const b=r.box,c=b.getCenter(new THREE.Vector3()),sz=b.getSize(new THREE.Vector3());const rad=Math.max(sz.x,sz.y,sz.z,.4)/2;
  const par=r.obj.parent,pos=r.obj.position.clone();r.obj.position.set(-c.x,-b.min.y,-c.z);sc.add(r.obj);
  const cam=new THREE.PerspectiveCamera(32,W/H,.05,2000);const dist=rad/Math.sin(cam.fov*Math.PI/360)*1.15;cam.position.set(Math.sin(.7)*dist,sz.y*.45+dist*.35,Math.cos(.7)*dist);cam.lookAt(0,sz.y*.45,0);
  REN.setRenderTarget(I.rt);REN.render(sc,cam);REN.readRenderTargetPixels(I.rt,0,0,W,H,I.rtPix);REN.setRenderTarget(null);
  sc.remove(r.obj);if(par)par.add(r.obj);r.obj.position.copy(pos);
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d');const img=ctx.createImageData(W,H);
  for(let y=0;y<H;y++){const src=(H-1-y)*W*4,dst=y*W*4;img.data.set(I.rtPix.subarray(src,src+W*4),dst);}ctx.putImageData(img,0,0);return cv;}
function inspShowGroup(group){const I=INSPECTOR;const grid=I.ui.querySelector('#insp-grid');grid.innerHTML='';grid.style.display='block';I.ui.querySelector('#insp-stage').style.display='none';
  const h=document.createElement('h3');h.textContent=group;grid.appendChild(h);let sub=null,row=null;
  for(const e of I.entries){if(e.group!==group)continue;if(e.sub!==sub){sub=e.sub;const hs=document.createElement('h4');hs.textContent=sub;grid.appendChild(hs);row=document.createElement('div');row.className='row';grid.appendChild(row);}
    const card=document.createElement('div');card.className='card';const cv=inspThumb(e);if(cv)card.appendChild(cv);else{const x=document.createElement('div');x.className='x';x.textContent='failed';card.appendChild(x);}
    const cap=document.createElement('div');cap.className='cap';const r=I.built.get(e.id);cap.textContent=e.name+(r&&r.stats?` · ${r.stats.tris.toLocaleString()}`:'');card.appendChild(cap);card.onclick=()=>{inspSelect(e);};row.appendChild(card);}}
function inspSelect(e){const I=INSPECTOR;I.ui.querySelector('#insp-grid').style.display='none';I.ui.querySelector('#insp-stage').style.display='block';inspResize();inspShow(e);}

// ── the frame, while open ──
INSPECTOR.frame=function(now){const I=INSPECTOR;const dt=Math.min((now-I.prevT)/1000,.05);I.prevT=now;I.t+=dt;
  if(I.ui.querySelector('#insp-stage').style.display==='none')return;
  const r=I.sel&&I.built.get(I.sel.id);if(r&&r.anim&&I.opts.anim)r.anim(I.t,dt,r.mode);
  if(I.figure&&I.opts.figure)pwApply(I.figure,pwIdle(I.t,{holds:I.figure.holds,gear:I.figure.g.gear}));
  const o=I.orbit;const c=I.cam;c.position.set(o.target.x+o.dist*Math.sin(o.phi)*Math.sin(o.theta),o.target.y+o.dist*Math.cos(o.phi),o.target.z+o.dist*Math.sin(o.phi)*Math.cos(o.theta));c.lookAt(o.target);
  REN.render(I.scene,I.cam);};
function inspResize(){const I=INSPECTOR;if(!I.open)return;const st=I.ui.querySelector('#insp-stage');const w=st.clientWidth||800,h=st.clientHeight||600;REN.setSize(w,h,false);REN.domElement.style.width='100%';REN.domElement.style.height='100%';I.cam.aspect=w/h;I.cam.updateProjectionMatrix();}

// ── open and close ──
function openInspector(){const I=INSPECTOR;if(I.open)return I;I.open=true;
  if(!I.entries.length){I.entries=inspRegistry();I.groups=[...new Set(I.entries.map(e=>e.group))];}
  if(!I.scene){I.scene=new THREE.Scene();I.stage=new THREE.Group();I.scene.add(I.stage);I.cam=new THREE.PerspectiveCamera(38,1,.05,3000);
    I.hemi=new THREE.HemisphereLight(0xbcd6ff,0x6b7a48,.6);I.scene.add(I.hemi);I.amb=new THREE.AmbientLight(0x90a0c0,.3);I.scene.add(I.amb);
    I.sun=new THREE.DirectionalLight(0xfff0d0,1.1);I.sun.castShadow=true;I.sun.shadow.mapSize.set(2048,2048);I.scene.add(I.sun);I.scene.add(I.sun.target);
    I.orbit={target:new THREE.Vector3(0,.8,0),dist:5,theta:.65,phi:1.2};
    try{const f=buildFoe('Bandit',0,0);PEOPLE_RIGS.delete(f);pwApply(f,pwIdle(0,{holds:f.holds,gear:f.g.gear}));I.figure=f;}catch(e){I.figure=null;}}
  if(!I.ui)inspBuildUI();
  I.canvasHome=REN.domElement.parentNode;I.ui.querySelector('#insp-stage').appendChild(REN.domElement);
  I.shadowWas=REN.shadowMap.enabled;REN.shadowMap.enabled=true;REN.shadowMap.needsUpdate=true;
  I.ovWas=document.getElementById('ov').style.display;document.getElementById('ov').style.display='none';
  document.body.appendChild(I.ui);I.ui.style.display='flex';I.prevT=performance.now();inspLight(I.opts.hour);inspResize();window.addEventListener('resize',inspResize);
  if(!I.sel)inspShowGroup(I.groups[0]);return I;}
function closeInspector(){const I=INSPECTOR;if(!I.open)return;I.open=false;window.removeEventListener('resize',inspResize);
  I.canvasHome.appendChild(REN.domElement);REN.domElement.style.width='';REN.domElement.style.height='';I.ui.style.display='none';document.getElementById('ov').style.display=I.ovWas||'';
  REN.setRenderTarget(null);REN.shadowMap.enabled=I.shadowWas;if(typeof resize==='function')resize();}
INSPECTOR.close=closeInspector;
// for a test: build every entry of a group and report
INSPECTOR.buildAll=function(group){const out=[];for(const e of INSPECTOR.entries){if(group&&e.group!==group)continue;const r=inspBuild(e);out.push({id:e.id,group:e.group,sub:e.sub,name:e.name,file:e.file,err:r.err||null,tris:r.stats?r.stats.tris:0,calls:r.stats?r.stats.calls:0,lo:!!r.lo,anim:!!r.anim,modes:r.modes||null});}return out;};
INSPECTOR.select=function(id){const e=INSPECTOR.entries.find(x=>x.id===id||x.name===id);if(e)inspSelect(e);return !!e;};
INSPECTOR.group=function(g){inspShowGroup(g);};

// ── the UI ──
function inspBuildUI(){const I=INSPECTOR;const ui=document.createElement('div');ui.id='insp';
  const css=document.createElement('style');css.textContent=`
#insp{position:fixed;inset:0;z-index:9000;display:flex;background:#14171c;color:#d8d0bc;font-family:sans-serif;font-size:13px}
#insp h2,#insp h3,#insp h4{font-family:Cinzel,serif;font-weight:normal;margin:0}
#insp-side{width:300px;min-width:300px;border-right:1px solid #2a2f38;display:flex;flex-direction:column;background:#101216}
#insp-side .head{padding:12px 14px;border-bottom:1px solid #2a2f38;display:flex;align-items:center;justify-content:space-between}
#insp-side .head h2{font-size:17px;color:#e8c0a0}
#insp-side input{margin:10px 14px;padding:6px 8px;background:#1b1f26;border:1px solid #2a2f38;color:#d8d0bc;border-radius:4px}
#insp-tree{overflow:auto;flex:1;padding:4px 0 20px}
#insp-tree .grp{padding:7px 14px;cursor:pointer;color:#e8c0a0;font-family:Cinzel,serif;font-size:14px;border-top:1px solid #1e2228}
#insp-tree .grp:hover{background:#1b1f26}
#insp-tree .sub{padding:4px 14px 2px 22px;color:#9a9484;font-size:11px;letter-spacing:.06em;text-transform:uppercase}
#insp-tree .ent{padding:3px 14px 3px 30px;cursor:pointer;color:#c8c0ac}
#insp-tree .ent:hover{background:#1b1f26;color:#fff}
#insp-tree .ent.on{background:#2a2f38;color:#fff}
#insp-main{flex:1;display:flex;flex-direction:column;min-width:0}
#insp-bar{padding:8px 14px;border-bottom:1px solid #2a2f38;display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;background:#101216}
#insp-bar #insp-name{font-family:Cinzel,serif;font-size:15px;color:#e8c0a0;min-width:200px}
#insp-bar #insp-stats{color:#9a9484;font-size:12px}
#insp-bar label{display:flex;align-items:center;gap:5px;color:#c8c0ac;cursor:pointer}
#insp-bar input[type=range]{width:120px}
#insp-modes button,#insp button.b{background:#1b1f26;border:1px solid #2a2f38;color:#d8d0bc;padding:3px 9px;border-radius:4px;cursor:pointer;margin-right:4px}
#insp-modes button.on{background:#3a3220;border-color:#c8a84a;color:#f0e0b0}
#insp-stage{flex:1;position:relative;min-height:0;cursor:grab;background:#1a2030}
#insp-stage canvas{display:block;width:100%;height:100%}
#insp-grid{flex:1;overflow:auto;padding:10px 18px;display:none}
#insp-grid h3{font-size:18px;color:#e8c0a0;margin:8px 0 4px}
#insp-grid h4{font-size:12px;color:#9a9484;letter-spacing:.06em;text-transform:uppercase;margin:14px 0 6px}
#insp-grid .row{display:flex;flex-wrap:wrap;gap:8px}
#insp-grid .card{width:180px;background:#1b1f26;border:1px solid #2a2f38;border-radius:4px;cursor:pointer;overflow:hidden}
#insp-grid .card:hover{border-color:#c8a84a}
#insp-grid .card canvas{display:block;width:180px;height:135px}
#insp-grid .card .x{width:180px;height:135px;display:flex;align-items:center;justify-content:center;color:#b05040}
#insp-grid .card .cap{padding:4px 7px;font-size:11px;color:#c8c0ac;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;ui.appendChild(css);
  ui.innerHTML+=`<div id="insp-side"><div class="head"><h2>Mesh inspector</h2><button class="b" id="insp-close">Close</button></div><input id="insp-find" placeholder="find…"><div id="insp-tree"></div></div>
<div id="insp-main"><div id="insp-bar"><span id="insp-name">—</span><span id="insp-stats"></span><span id="insp-modes"></span>
<label><input type="checkbox" id="insp-anim" checked> animate</label><label><input type="checkbox" id="insp-wire"> wireframe</label><label><input type="checkbox" id="insp-lo" checked> distant copy</label><label><input type="checkbox" id="insp-fig" checked> bandit for scale</label><label><input type="checkbox" id="insp-ground" checked> ground</label>
<label>hour <input type="range" id="insp-hour" min="0" max="24" step="0.5" value="12"> <span id="insp-hourv">12:00</span></label></div><div id="insp-stage"></div><div id="insp-grid"></div></div>`;
  I.ui=ui;
  const tree=ui.querySelector('#insp-tree');const fill=(q)=>{tree.innerHTML='';let g=null,s=null;for(const e of I.entries){if(q&&!(e.name+' '+e.sub+' '+e.group).toLowerCase().includes(q))continue;
    if(e.group!==g){g=e.group;s=null;const d=document.createElement('div');d.className='grp';d.textContent=g;d.onclick=()=>inspShowGroup(g);tree.appendChild(d);}
    if(e.sub!==s){s=e.sub;const d=document.createElement('div');d.className='sub';d.textContent=s;tree.appendChild(d);}
    const d=document.createElement('div');d.className='ent';d.dataset.id=e.id;d.textContent=e.name;d.onclick=()=>inspSelect(e);tree.appendChild(d);}};
  fill('');ui.querySelector('#insp-find').oninput=ev=>fill(ev.target.value.trim().toLowerCase());
  ui.querySelector('#insp-close').onclick=closeInspector;
  const re=()=>{if(I.sel)inspShow(I.sel);};
  ui.querySelector('#insp-anim').onchange=ev=>{I.opts.anim=ev.target.checked;};
  ui.querySelector('#insp-wire').onchange=ev=>{I.opts.wire=ev.target.checked;inspWire(I.opts.wire);};
  ui.querySelector('#insp-lo').onchange=ev=>{I.opts.lo=ev.target.checked;re();};
  ui.querySelector('#insp-fig').onchange=ev=>{I.opts.figure=ev.target.checked;re();};
  ui.querySelector('#insp-ground').onchange=ev=>{I.opts.ground=ev.target.checked;re();};
  ui.querySelector('#insp-hour').oninput=ev=>{I.opts.hour=+ev.target.value;const h=Math.floor(I.opts.hour),m=I.opts.hour%1?'30':'00';ui.querySelector('#insp-hourv').textContent=`${h}:${m}`;inspLight(I.opts.hour);};
  // the orbit: drag turns, wheel zooms, right-drag or shift-drag pans
  const st=ui.querySelector('#insp-stage');let drag=null;
  st.addEventListener('pointerdown',ev=>{drag={x:ev.clientX,y:ev.clientY,pan:ev.button===2||ev.shiftKey};st.setPointerCapture(ev.pointerId);st.style.cursor='grabbing';});
  st.addEventListener('pointermove',ev=>{if(!drag)return;const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;drag.x=ev.clientX;drag.y=ev.clientY;const o=I.orbit;
    if(drag.pan){const k=o.dist*.0018;const right=new THREE.Vector3(Math.cos(o.theta),0,-Math.sin(o.theta));o.target.addScaledVector(right,-dx*k);o.target.y+=dy*k;}
    else{o.theta-=dx*.008;o.phi=Math.max(.08,Math.min(Math.PI-.08,o.phi-dy*.008));}});
  st.addEventListener('pointerup',()=>{drag=null;st.style.cursor='grab';});st.addEventListener('contextmenu',ev=>ev.preventDefault());
  st.addEventListener('wheel',ev=>{ev.preventDefault();I.orbit.dist*=Math.exp(ev.deltaY*.0012);},{passive:false});}

if(/[?&]inspector\b/.test(location.search))setTimeout(()=>{try{openInspector();}catch(e){console.error('inspector',e);}},50);
