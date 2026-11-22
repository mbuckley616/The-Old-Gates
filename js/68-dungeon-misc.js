
// ── RESPAWN ───────────────────────────────────────────────────
// v80 — light pools for non-world scenes: a fixed set of lights per scene; every other PointLight becomes a virtual
// source that follows its parent, and the nearest sources are mapped onto the pool before each render.
const _LPS=new Map();
function _sweepScenePool(scene){
  let P=_LPS.get(scene);if(!P){P={pool:[],src:[],set:new Set()};const nP=(scene.userData&&scene.userData.lightPool)||20;for(let i=0;i<nP;i++){const L=new THREE.PointLight(0xffffff,0,10);L.position.set(0,-100,0);scene.add(L);P.pool.push(L);P.set.add(L);}_LPS.set(scene,P);}
  const found=[];scene.traverse(o=>{if(o.isPointLight&&!P.set.has(o))found.push(o);});
  for(const l of found){const par=l.parent;if(l._swept&&l._sweptScene===scene&&P.src.includes(l._swept)){par&&par.remove(l);continue;}const v={mirror:l,follow:(par&&par!==scene)?par:null,offset:l.position.clone(),pos:new THREE.Vector3(),loose:!(par&&par!==scene)};l.getWorldPosition(v.pos);P.src.push(v);par&&par.remove(l);l._swept=v;l._sweptScene=scene;}
  const inScene=(o)=>{let p=o;while(p){if(p===scene)return true;p=p.parent;}return false;};
  const cand=[];const wp=new THREE.Vector3();
  // S1302 — in a gate (DZONE, 56-dungeon-build.js) the pool's 8 go to the nearest sources in the zones drawn, by their distance up and
  // down too, so floor two's torches never take a light from floor one's
  const inG=scene===dScene&&typeof DZONE!=='undefined'&&DZONE,shown=inG?dZoneShown():null,eyeY=inG?(currentFloor===2?FLOOR2_Y:0)+1.5:0;
  for(let i=P.src.length-1;i>=0;i--){const v=P.src[i];const m=v.mirror;if(v.follow){if(!inScene(v.follow)){P.src.splice(i,1);continue;}v.follow.getWorldPosition(wp);wp.add(v.offset);v.pos.copy(wp);}else v.pos.copy(m.position);
    if(m.intensity<=0){v._z=(v._z||0)+1;if(v._z>600){P.src.splice(i,1);}continue;}v._z=0;const d=inG?Math.hypot(v.pos.x-px,v.pos.z-pz,v.pos.y-eyeY):Math.hypot(v.pos.x-px,v.pos.z-pz);if(d>m.distance+60)continue;
    if(shown){const zz=dZoneAt(v.pos.x,v.pos.z,DZONE.two&&v.pos.y<FLOOR2_Y*.5?2:1);if(zz>=0&&!shown.has(zz))continue;}cand.push([d,v]);}
  cand.sort((a,b)=>a[0]-b[0]);
  for(let i=0;i<P.pool.length;i++){const L=P.pool[i];const c=cand[i];if(!c){L.intensity=0;continue;}const v=c[1],m=v.mirror;L.position.copy(v.pos);L.color.copy(m.color);L.intensity=m.intensity;L.distance=m.distance||10;}
}
// v80 — look-at looting: a container counts only when it's under the crosshair (within ~14°) and within reach (3u)
const _laDir=new THREE.Vector3(),_laTo=new THREE.Vector3();const _ray=new THREE.Raycaster();
// aimAt: true when the crosshair ray hits this object's mesh within reach — the interaction is the mesh, not an area
// S1269 — three's ray is cast at the plain meshes only. On 0.170 it skins every vertex of a SkinnedMesh on the CPU to test it (the
// builder's people: every level, shown or not), 235 ms a frame with one person in reach on CI's CPU; a skinned body is skinAimed's
const _aimList=[];
function aimAt(obj,reach){const m=obj&&(obj.mesh||obj.g||obj.group||obj.obj);if(!m)return false;CAM.getWorldDirection(_laDir);_ray.set(CAM.position,_laDir);_ray.camera=CAM;const _tpb=thirdPerson?TP.dist:0;_ray.far=(reach||3.2)+_tpb;_ray.near=Math.max(0,_tpb-.35);
  _aimList.length=0;m.traverse(o=>{if(!o.isSkinnedMesh)_aimList.push(o);});const hits=_aimList.length?_ray.intersectObjects(_aimList,false):_aimList;_aimList.length=0;if(hits.length>0)return true;
  return skinAimed(obj,m,_ray.near,_ray.far);}
// S596 — a skinned body (every townsperson since S153) is invisible to three's raycast for the reason S417 gives below, so
// aimAt never met a townsperson: no *Press 'E' to talk* and no talk cue facing one in the open world. The ray is tested
// against capsules along the body's bones, as bodyAimed does for a corpse; the bones are found once and kept on obj.
function skinAimed(obj,m,near,far){if(obj._aimBones===undefined||obj._aimM!==m||(obj._aimBones&&obj._aimBones.length&&!obj._aimBones[0].parent)){obj._aimM=m;obj._aimR=null;let sk=false;const bones=[];m.traverse(o=>{if(o.isSkinnedMesh)sk=true;if(o.isBone)bones.push(o);});obj._aimBones=sk?bones:null;}
  const bones=obj._aimBones;if(!bones||!bones.length||!m.visible)return false;m.updateMatrixWorld(true);
  if(obj._aimR==null){_baBox.makeEmpty();for(const b of bones)_baBox.expandByPoint(b.getWorldPosition(_baA));obj._aimR=Math.max(.16,Math.min(.6,_baBox.getSize(_baA).length()*.13));
    obj._aimX=_baBox.getSize(_baA).y*.15;obj._aimEnd=bones.map(b=>!b.children.some(c=>c.isBone));}
  // S880 (F2a) — an end bone (the head, a hand, a foot) carries its capsule on past the joint by .15 of the body's height: the head
  // bone sits at the jaw, and from an eye at 1.65 the crosshair on a face passed over a woman's head bone (1.35) out of reach
  const o=CAM.position;for(let i=0;i<bones.length;i++){const b=bones[i];b.getWorldPosition(_baA);if(b.parent&&b.parent.isBone)b.parent.getWorldPosition(_baB);else _baB.copy(_baA);
    if(obj._aimEnd&&obj._aimEnd[i]&&obj._aimX){const L=_baA.distanceTo(_baB);if(L>1e-4)_baA.addScaledVector(_baA.clone().sub(_baB),obj._aimX/L);}
    if(_raySegHit(o,_laDir,_baB,_baA,obj._aimR,near,far))return true;}
  return false;}
// S417 — a corpse is searched anywhere on its body, not at one spot over the kill point (Michael, 1 Oct). The crosshair
// ray is tested against capsules along the dead body's bones and against any plain meshes it has, within reach of the
// eye as aimAt. three's own raycast cannot see a skinned body here: it skins with the bones' world matrices and then
// applies the mesh's world matrix again (the people's and creatures' detached binding), so it misses the body.
const _baA=new THREE.Vector3(),_baB=new THREE.Vector3(),_baBox=new THREE.Box3();
function _raySegHit(o,d,a,b,r,near,far){for(let k=0;k<=6;k++){const u=k/6,x=a.x+(b.x-a.x)*u-o.x,y=a.y+(b.y-a.y)*u-o.y,z=a.z+(b.z-a.z)*u-o.z;
    const t=Math.max(near,Math.min(far,x*d.x+y*d.y+z*d.z)),qx=x-d.x*t,qy=y-d.y*t,qz=z-d.z*t;if(qx*qx+qy*qy+qz*qz<=r*r)return true;}return false;}
function bodyAimed(c,reach){const m=c.body;reach=reach||3.0;m.updateMatrixWorld(true);
  if(!c._bones||c._hbN!==HB_ATTACH_N){c._hbN=HB_ATTACH_N;c._r=null; /* S1259 — the builder's body is hung on a foe's driver after it dies (hbTick, one a frame): its bones are the body you see */
    const bones=[],plain=[];m.traverse(o=>{if(o.isBone)bones.push(o);else if(o.isMesh&&!o.isSkinnedMesh&&o.geometry&&o.geometry.type!=='PlaneGeometry')plain.push(o);});c._bones=bones;c._plain=plain;}
  if(c._r==null){_baBox.makeEmpty();if(c._bones.length)for(const b of c._bones)_baBox.expandByPoint(b.getWorldPosition(_baA));else _baBox.setFromObject(m);
    const ext=_baBox.isEmpty()?1:_baBox.getSize(_baA).length();c._ext=ext;c._r=Math.max(.2,Math.min(1.2,ext*.13));}
  if(Math.hypot(c.x-px,c.z-pz)>reach+c._ext*.6)return false;
  CAM.getWorldDirection(_laDir);const tpb=thirdPerson?TP.dist:0,far=reach+.6+tpb,near=Math.max(0,tpb-.35),o=CAM.position;
  for(const b of c._bones){b.getWorldPosition(_baA);if(b.parent&&b.parent.isBone)b.parent.getWorldPosition(_baB);else _baB.copy(_baA);
    if(_raySegHit(o,_laDir,_baB,_baA,c._r,near,far))return true;}
  const vis=c._plain.filter(x=>x.visible);if(vis.length){_ray.set(o,_laDir);_ray.camera=CAM;_ray.far=far;_ray.near=near;if(_ray.intersectObjects(vis,false).length)return true;}
  return false;}
function lookingAt(c,reach){if(c.body&&c.body.parent)return bodyAimed(c,reach); /* S417 — the whole body, in place of the old spot */
  if(c.standY!=null&&Math.abs(jumpY-c.standY)>1.2)return false; /* S2405 — a seal's chest on its ledge or gallery: from its height */
  const dx=c.x-px,dz=c.z-pz,dh=Math.hypot(dx,dz);if(dh>(reach||3.0))return false;if(c.mesh||c.g||c.group)return aimAt(c,(reach||3.0)+.6); // the mesh itself when there is one
  const floorY=(activeZoneId!=='world')?(currentFloor===2?FLOOR2_Y:0):((typeof WORLD!=='undefined')?WORLD.worldH(c.x,c.z):0);const cy=floorY+(c.y!=null?c.y:0.45);
  CAM.getWorldDirection(_laDir);_laTo.set(c.x-CAM.position.x,cy-CAM.position.y,c.z-CAM.position.z);const len=_laTo.length();if(len<.001)return true;_laTo.multiplyScalar(1/len);return _laTo.dot(_laDir)>0.96;}
// S645 — a bed answers E only with the crosshair on it (Michael, 6 Oct 2026: "E should need range AND the reticle on the
// object"; the inn's bed showed as usable from downstairs). In range as before (1.6 across, your own floor within .9), the
// crosshair ray meets the bed's frame (the kit's bed: .86 wide on x, 1.5 long on z, .72 to the posts, padded a little), and
// no wall stands between you. The prompt and E both ask this one function, so they cannot disagree.
// S646 — the same test for anything indoors without a mesh of its own to cast at: does the crosshair ray, out to 3.2 (plus the
// third-person camera's distance), meet the box x±hx, z±hz, y0 to y0+h; and does no wall stand between you and its centre.
function aimBox(x,z,y0,hx,hz,h,sx,sz){CAM.getWorldDirection(_laDir); /* S680 — sx, sz: where the wall test looks, when the box's centre is inside a wall (a door's leaf) */const o=CAM.position,lo=[x-hx,y0,z-hz],hi=[x+hx,y0+h,z+hz],O=[o.x,o.y,o.z],D=[_laDir.x,_laDir.y,_laDir.z];
  let t0=0,t1=3.2+(thirdPerson?TP.dist:0);
  for(let i=0;i<3;i++){if(Math.abs(D[i])<1e-9){if(O[i]<lo[i]||O[i]>hi[i])return false;continue;}let ta=(lo[i]-O[i])/D[i],tb=(hi[i]-O[i])/D[i];if(ta>tb){const t=ta;ta=tb;tb=t;}if(ta>t0)t0=ta;if(tb<t1)t1=tb;if(t0>t1)return false;}
  return typeof intSightLine!=='function'||intSightLine(px,pz,sx!=null?sx:x,sz!=null?sz:z);}
function bedAimed(b){return aimBox(b.x,b.z,b.y||0,.5,.82,.78);}
/* S656 — the stash chest (the safehouse's, the cabin's hold): in reach and under the crosshair, its body .85 × .55 and the lid */
function stashAimed(){return !!intStashPos&&Math.hypot(px-intStashPos.x,pz-intStashPos.z)<TOUCH&&Math.abs(jumpY)<.9&&aimBox(intStashPos.x,intStashPos.z,0,.48,.33,.72);}
function intBedTarget(){let best=null,bd=1e9;for(const b of (INT_BEDS||[])){const d=Math.hypot(px-b.x,pz-b.z);if(d>=TOUCH||d>=bd||Math.abs(jumpY-(b.y||0))>=.9)continue;if(bedAimed(b)){bd=d;best=b;}}return best;}
function lootTargetNow(){try{
  if(activeZoneId==='world'){const c=ZONE_CORPSES.find(c=>c.zone===activeZoneId&&c.items&&c.items.length>0&&lookingAt(c));if(c)return c;}
  else{const c=CORPSES.find(c=>!c.looted&&c.items&&c.items.length&&lookingAt(c));if(c)return c;const ch=CHESTS.find(c=>c.floor===currentFloor&&(!c.opened||c.items.length>0)&&lookingAt(c));if(ch)return ch;const b=(typeof BARRELS!=='undefined')?BARRELS.find(b=>b.floor===currentFloor&&(!b.opened||(b.items&&b.items.length>0))&&lookingAt(b,2.6)):null;if(b)return b;}
}catch(e){}return null;}
function emptyTargetNow(){try{const any=(activeZoneId==='world')?ZONE_CORPSES.filter(c=>c.zone===activeZoneId):[...CORPSES,...CHESTS.filter(c=>c.floor===currentFloor),...((typeof BARRELS!=='undefined')?BARRELS.filter(b=>b.floor===currentFloor):[])];for(const c of any){const has=c.items&&c.items.length>0&&!(c.looted);if(!has&&lookingAt(c))return c;}}catch(e){}return null;}
// S596 — of the people within 3.2 whose body the crosshair ray meets, the nearest: the one in front, not the first in the
// list (a second person behind them on the ray, or listed earlier, used to win). E (`talkNPC`) and the talk cue both read it.
function talkAimedNPC(L){let best=null,bd=1e9;for(const n of (L||[])){if(!n||n._retreated||!n.g)continue;const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);if(d>=3.2||d>=bd)continue;if(Math.abs(jumpY-n.g.position.y)>1.6)continue;if(aimAt(n,3.6)){bd=d;best=n;}}return best;}
function talkTargetNow(){try{if(activeZoneId==='world'){return talkAimedNPC((ZONES.world&&ZONES.world.npcs)||[]);}if(typeof INT_NPCS!=='undefined'){const n=INT_NPCS.find(n=>Math.hypot(px-n.g.position.x,pz-n.g.position.z)<3.2&&aimAt(n,3.6));if(n)return n;}if(typeof intNPCMesh!=='undefined'&&intNPCMesh&&Math.hypot(px-intNPCPos.x,pz-intNPCPos.z)<3.2&&aimAt({g:intNPCMesh},3.6))return {def:{name:''}};}catch(e){}return null;}
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
function _dContainer(kind,wx,wz,floorIdx,baseY,r,id){const g=new THREE.Group();let top=null,openTop=null;const K=_dKit(kind);
  const body=new THREE.Mesh(K.body,K.mat);body.userData.dunCont=kind;g.add(body);
  if(K.lid){top=new THREE.Mesh(K.lid,K.mat);top.position.y=K.lidY;g.add(top);
    // the sarcophagus's lid is pushed a third aside and tips onto the chest's edge; the urn's pops and sits askew as a barrel's does
    if(kind==='sarcophagus')openTop=()=>{top.position.x+=.34;top.position.z+=.12;top.rotation.z=-.1;top.rotation.y=.12;};}
  g.position.set(wx,baseY,wz);g.rotation.y=r()*Math.PI*2;dScene.add(g);
  BARRELS.push({id:id||null,x:wx,z:wz,floor:floorIdx,opened:false,items:_dLoot(kind,r),displayName:kind==='urn'?'Urn':kind==='sarcophagus'?'Sarcophagus':'Weapon Rack',mesh:g,top,openTop});}
// the cells a trap may stand on, [c, r, 'h'|'v'] on floor one's map: a run of corridor one cell wide (S1399: pulled out of
// decorateDungeonRooms as it was, so a suite can read it from the generator alone)
function dTrapCells(gen,map){map=map||gen.map;
  const isFloor=(c,rr)=>map[rr]&&map[rr][c]===1;
  const corridor=[];for(let rr=1;rr<map.length-1;rr++)for(let c=1;c<map[rr].length-1;c++){if(!isFloor(c,rr))continue;const h=isFloor(c-1,rr)&&isFloor(c+1,rr)&&!isFloor(c,rr-1)&&!isFloor(c,rr+1);const v=isFloor(c,rr-1)&&isFloor(c,rr+1)&&!isFloor(c-1,rr)&&!isFloor(c+1,rr);if(h||v)corridor.push([c,rr,h?'h':'v']);}
  // a real run: the two cells beyond on each side along the corridor are floor too, and nothing but wall to the sides
  const run=corridor.filter(([c,rr,dir])=>dir==='h'?(isFloor(c-2,rr)&&isFloor(c+2,rr)&&!isFloor(c,rr-1)&&!isFloor(c,rr+1)):(isFloor(c,rr-2)&&isFloor(c,rr+2)&&!isFloor(c-1,rr)&&!isFloor(c+1,rr)));
  // S1399 — a gate's traps keep to its side rooms and their ways in, and to its thresholds (gate-interiors-build.md, "What it touches"):
  // never on a space's floor, where a failing gate's gap beside a pier or the wall leaves a one-cell run (about 1 in 100 of the runs)
  const CS=gen.gate&&gen.cellSpace,TH=CS?new Set((gen.thresholds||[]).filter(t=>(t.floor||1)===1).map(t=>t.r*map[0].length+t.c)):null;
  return CS?run.filter(([c,rr])=>CS[rr][c]<0||TH.has(rr*map[0].length+c)):run;
}
function decorateDungeonRooms(gen,portal){
  D_TRAPS.length=0;if(!gen||!gen.rooms)return;window._lastGen=gen;const r=_dRng((portal&&portal.seed)||1);const theme=(portal&&portal.theme)||'ruins';
  const floors=[[gen.rooms,1,0],[gen.rooms2||[],2,FLOOR2_Y]];
  const TYPES={undead:['ossuary','shrine','collapsed','library'],haunted:['shrine','ossuary','flooded','library'],ruins:['library','collapsed','barracks','treasury'],goblin:['barracks','collapsed','flooded','treasury'],elemental:['flooded','collapsed','shrine','library'],deep:['flooded','ossuary','collapsed','shrine'],fort:['barracks','treasury','library','shrine']};
  const list=TYPES[theme]||TYPES.ruins;
  const occ=[];const seed=(BARRELS||[]).map(b=>({x:b.x,z:b.z,r:.7,f:b.floor})).concat((CHESTS||[]).map(c=>({x:c.x,z:c.z,r:.9,f:c.floor})));occ.push(...seed);
  const free=(x,z,rad,fi)=>!occ.some(o=>o.f===fi&&Math.hypot(o.x-x,o.z-z)<rad+o.r);const take=(x,z,rad,fi)=>{occ.push({x,z,r:rad,f:fi});};
  const _dBoxF=(w,hh,d,col,x,y,z,ry,fi)=>{if(!free(x,z,Math.max(w,d)/2,fi))return null;take(x,z,Math.max(w,d)/2,fi);return _dBox(w,hh,d,col,x,y,z,ry);};
  const _dcN={};const _dContainerF=(kind,wx,wz,fi,baseY,rr)=>{if(!free(wx,wz,.6,fi))return;take(wx,wz,.6,fi);const ck=fi+':'+kind;_dcN[ck]=(_dcN[ck]||0)+1; // S514 — its id, <seed>:<floor>:<kind>:<n>
    _dContainer(kind,wx,wz,fi,baseY,rr,`${dKeyOf(portal,fi)}:${kind}:${_dcN[ck]-1}`);};
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
  const map=gen.map||dMap;if(!map)return;const corridor=dTrapCells(gen,map);
  const nTraps=Math.min(corridor.length,2+Math.floor(r()*4));
  for(let k=0;k<nTraps;k++){const [c,rr,dir]=corridor[Math.floor(r()*corridor.length)];const x=c,z=rr; /* S582 — a cell is centred on its integer (c−½ to c+½): at c+.5 every trap stood on its cell's corner, a blade in the wall's line */if(D_TRAPS.some(t=>Math.hypot(t.x-x,t.z-z)<3))continue;
    if(r()<.6){const plate=_dBox(.62,.04,.62,0x3a3630,x,.02,z);const spikes=new THREE.Group();for(let i=0;i<9;i++){const s=new THREE.Mesh(new THREE.ConeGeometry(.04,.34,5),new THREE.MeshLambertMaterial({color:0x9a9ea6}));s.position.set(-.18+(i%3)*.18,.17,-.18+Math.floor(i/3)*.18);spikes.add(s);}spikes.position.set(x,-.4,z);dScene.add(spikes);D_TRAPS.push({kind:'spike',x,z,floor:1,plate,spikes,t:0,armed:true});}
    else{D_TRAPS.push(buildSwingBlade(x,z,dir,r));}}
}
// S580 — the blade cuts where it is (Michael's A on #170): the player's body, a column 0.3 round from the feet to 1.72, is
// tested against the blade's own box in the blade's own frame, so the hit follows whatever arc and shape the blade has.
// Was: anyone within 0.7 of the cell while the swing was near its bottom. The blade is t.blade, else the pivot's lowest mesh.
const _bladeV=new THREE.Vector3();
function bladeTouches(t){let b=t.blade||t._bl;if(!b){for(const c of t.pivot.children)if(c.isMesh&&(!b||c.position.y<b.position.y))b=c;t._bl=b;}if(!b||!b.geometry)return false;
  if(!b.geometry.boundingBox)b.geometry.computeBoundingBox();const bb=b.geometry.boundingBox,R=.3;t.pivot.updateMatrixWorld(true);
  for(let k=0;k<=8;k++){_bladeV.set(px,jumpY+k*.215,pz);b.worldToLocal(_bladeV);
    if(_bladeV.x>bb.min.x-R&&_bladeV.x<bb.max.x+R&&_bladeV.y>bb.min.y-R&&_bladeV.y<bb.max.y+R&&_bladeV.z>bb.min.z-R&&_bladeV.z<bb.max.z+R)return true;}
  return false;}
// S606 — a trap's hit rolls on its own stream (co-op rules): its id is the dungeon's seed, the floor and its place in the list
// the seeded placement made, `<seed>:<floor>:trap:<n>`, given the first time it is sprung, as a foe's is (`keyFoe`)
// S1061 — a trap and a wyrm's fire are the place's (the enemies-by-place sheet): their level term is the tier's level of the floor
// you stand on (tierHere: the door's tier, +1 below), not yours. A spike lands 8–15 on a tier-1 floor and 16–23 on a tier-3 one.
function trapTierLevel(){return tierLevel(tierHere());}
function spikeTrapRaw(t){return 8+Math.floor(trapRand(t)*8)+Math.floor(trapTierLevel()*.8);}
function bladeTrapRaw(){return 10+Math.floor(trapTierLevel()*1.2);}
function wyrmFireRaw(){return 18+trapTierLevel()*1.4;}
function trapRand(t){if(!t.rng){t.id=t.id||(((typeof currentPortal!=='undefined'&&currentPortal&&currentPortal.seed)||1)+':'+(t.floor||1)+':trap:'+D_TRAPS.indexOf(t));t.rng=seededRng('trap',t.id);}return t.rng();}
// S582 — the swinging blade across the passage (Michael's A on DECISION #170, the Session 573 prototype): a crescent of steel on an
// iron arm hung from a bracket in the roof, its flat face to you as you come up the corridor, swinging from wall to wall with the
// bottom of its arc at the waist (.95) and into a dark slot cut in each wall. The arm is as long as the roof is high (a lair's 4.4).
// The pivot swings about its own z (tickDungeonTraps), so it is turned to put that swing across the corridor: a corridor along x
// ('h') swings in z. t.blade is the steel, for the hit.
function buildSwingBlade(x,z,dir,r){const top=FLOOR_HEIGHT-.1,low=.95,L=top-low,pivot=new THREE.Group();pivot.position.set(x,top,z);pivot.rotation.y=dir==='h'?Math.PI/2:0;
  const iron=new THREE.MeshLambertMaterial({color:0x3a3a3c}),steel=new THREE.MeshLambertMaterial({color:0xc8ccd4,side:THREE.DoubleSide}),slotM=new THREE.MeshBasicMaterial({color:0x050403,side:THREE.DoubleSide});
  const arm=new THREE.Mesh(new THREE.BoxGeometry(.07,L-.25,.07),iron);arm.position.y=-(L-.25)/2;pivot.add(arm);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.22,10),iron);hub.rotation.x=Math.PI/2;pivot.add(hub);
  const sh=new THREE.Shape();sh.absarc(0,0,.55,Math.PI*1.15,Math.PI*1.85,false);sh.absarc(0,.32,.45,Math.PI*1.8,Math.PI*1.2,true);
  const bg=new THREE.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:true,bevelSize:.012,bevelThickness:.01,bevelSegments:1});bg.computeBoundingBox();const bc=new THREE.Vector3();bg.boundingBox.getCenter(bc);bg.translate(-bc.x,-bc.y,-bc.z); /* the steel's own centre is the mesh's origin, so its position is where the blade is */
  const blade=new THREE.Mesh(bg,steel);blade.position.set(bc.x,-L+.55+bc.y,0);blade.userData.trapBlade=true;pivot.add(blade);
  dScene.add(pivot);
  // the bracket in the roof: a bar across the passage the hub turns on
  const br=new THREE.Mesh(new THREE.BoxGeometry(dir==='h'?.12:1.0,.1,dir==='h'?1.0:.12),iron);br.position.set(x,top+.04,z);dScene.add(br);
  // the slots the blade passes into, one in each wall in the plane of its swing
  for(const s of[-1,1]){const sl=new THREE.Mesh(new THREE.PlaneGeometry(.12,1.3),slotM);if(dir==='h'){sl.position.set(x,1.35,z+s*.49);}else{sl.position.set(x+s*.49,1.35,z);sl.rotation.y=Math.PI/2;}dScene.add(sl);}
  return {kind:'blade',x,z,floor:1,pivot,blade,ph:r()*Math.PI*2,hitT:0};}
function tickDungeonTraps(dt){if(!D_TRAPS.length||typeof dScene==='undefined'||scene!==dScene)return;const gy=currentFloor===2?FLOOR2_Y:0;
  for(const t of D_TRAPS){if(t.floor!==currentFloor)continue;const d=Math.hypot(px-t.x,pz-t.z);
    if(t.kind==='spike'){if(t.armed&&d<.55&&Math.abs(jumpY-gy)<.3&&!lightFootNow()){ /* S976 — Light foot (Stealth 75) */t.armed=false;t.t=0;const dmg=_warded(spikeTrapRaw(t),TRAP_SRC);PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;armourUse();updateHUD();showMsg(`Spikes! ${dmg} damage.`,'#ff6060');if(typeof sfxNoise==='function')sfxNoise(.5,0,0,.1,900);if(PHP<=0)playerDead();}
      if(!t.armed){t.t+=dt;const up=t.t<.8?Math.min(1,t.t*6):Math.max(0,1-(t.t-.8)*1.5);t.spikes.position.y=-.4+up*.42;if(t.t>3){t.armed=true;t.spikes.position.y=-.4;}}}
    else{t.ph+=dt*2.2;const a=Math.sin(t.ph)*.42;t.pivot.rotation.z=a;const bx=t.x+Math.sin(t.pivot.rotation.y)*0,bz=t.z;t.hitT-=dt;if(t.hitT<=0&&d<2.5&&bladeTouches(t)){t.hitT=1.2;const dmg=_warded(blocking?Math.round(bladeTrapRaw()*.4):bladeTrapRaw(),TRAP_SRC);PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;armourUse();updateHUD();showMsg(`The blade catches you: ${dmg}.`,'#ff6060');if(typeof sfxNoise==='function')sfxNoise(.4,0,0,.08,1200);if(PHP<=0)playerDead();}}}}

// ═══ v80 — DUNGEON FEEL: sounds, monster detail, exteriors, lockpicking ═══

// ── sounds ──
// doors and hits: their sounds are 72-audio.js's alone (Session 2443). S112's versions here were declared earlier in the load,
// so 72's of the same names won from the first push; the hits by weapon class moved there, the doors keep 72's.
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
  for(const e of E){if(e.dead||!e.name||e.wild)continue;const d=Math.hypot(e.x-px,e.z-pz); /* S1707 — no growl from a deer */
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
function dressPortalExterior(sc,p,ty,sol,sigilOnly){try{const solid=(x,z,r)=>{if(sol)sol.push({cx:x,cz:z,rx:r,rz:r});};const h=(p.seed*2654435761)>>>0;const r=((k)=>{let s=(h^(k*7919))>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};})(1);
  const M=(c,em)=>new THREE.MeshLambertMaterial({color:c,emissive:em||0});const put=(m,x,y,z,ry)=>{m.position.set(x,y,z);if(ry)m.rotation.y=ry;sc.add(m);return m;};
  // a set piece that changes the silhouette: standing stones, a ruined arch, a fallen tower, a sunken approach — one per gate by seed
  const set=sigilOnly?'none':['stones','arch','tower','pit','none'][Math.floor(r()*5)];const M2=(c)=>new THREE.MeshLambertMaterial({color:c});const gy=(x,z)=>(typeof WORLD!=='undefined'&&activeZoneId==='world')?WORLD.worldH(x,z):ty;
  if(set==='stones'){const n=5+Math.floor(r()*3);for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r()*.3;const rr=4.2+r()*.8;const x=p.x+Math.cos(a)*rr,z=p.z+Math.sin(a)*rr;const hgt=1.6+r()*1.4;const m=new THREE.Mesh(new THREE.BoxGeometry(.5+r()*.3,hgt,.35+r()*.2),M2([0x6a665e,0x5a564e,0x74706a][i%3]));m.position.set(x,gy(x,z)+hgt/2-.1,z);m.rotation.y=r()*3;m.rotation.z=(r()-.5)*.12;m.castShadow=true;sc.add(m);solid(x,z,.45);}}
  else if(set==='arch'){for(let s=-1;s<=1;s+=2){const x=p.x+s*2.0,z=p.z+3.2;const m=new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,3.2,8),M2(0x8a8478));m.position.set(x,gy(x,z)+1.6,z);sc.add(m);solid(x,z,.45);const cap=new THREE.Mesh(new THREE.BoxGeometry(.9,.3,.9),M2(0x9a948a));cap.position.set(x,gy(x,z)+3.35,z);sc.add(cap);}const lin=new THREE.Mesh(new THREE.BoxGeometry(4.9,.42,.9),M2(0x9a948a));lin.position.set(p.x,gy(p.x,p.z+3.2)+3.7,p.z+3.2);lin.rotation.z=(r()-.5)*.06;sc.add(lin);for(let i=0;i<5;i++){const x=p.x+(r()-.5)*5,z=p.z+3.2+(r()-.5)*2;const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.35,.5),M2(0x7a766e));m.position.set(x,gy(x,z)+.15,z);m.rotation.y=r()*3;sc.add(m);}}
  else if(set==='tower'){const x=p.x+3.4,z=p.z-1.5;const h0=gy(x,z);const wall=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.6,3.4,10,1,true),new THREE.MeshLambertMaterial({color:0x6a665e,side:THREE.DoubleSide}));wall.position.set(x,h0+1.7,z);sc.add(wall);solid(x,z,1.7);for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const m=new THREE.Mesh(new THREE.BoxGeometry(.6,.5+r()*.6,.5),M2(0x5a564e));m.position.set(x+Math.cos(a)*1.55,h0+3.4+.3,z+Math.sin(a)*1.55);m.rotation.y=-a;sc.add(m);}for(let i=0;i<6;i++){const xx=x+(r()-.5)*5,zz=z+(r()-.5)*5;const m=new THREE.Mesh(new THREE.BoxGeometry(.4+r()*.5,.3,.4+r()*.5),M2(0x6a665e));m.position.set(xx,gy(xx,zz)+.12,zz);m.rotation.y=r()*3;sc.add(m);}}
  else if(set==='pit'){for(let i=0;i<2;i++)for(let s=-1;s<=1;s+=2){const x=p.x+s*1.6,z=p.z+2.2+i*1.6;const m=new THREE.Mesh(new THREE.BoxGeometry(.3,1.2+i*.3,.3),M2(0x5a564e));m.position.set(x,gy(x,z)+.6+i*.15,z);sc.add(m);}for(let i=0;i<6;i++){const z=p.z+1.6+i*.55;const m=new THREE.Mesh(new THREE.BoxGeometry(3.0,.1,.5),M2(0x7a766e));m.position.set(p.x,gy(p.x,z)-.02-i*.02,z);sc.add(m);}}
  const picks=[];const pool=['skull','chains','tree','bones','cairn','mist','ravens'];while(!sigilOnly&&picks.length<3){const k=pool[Math.floor(r()*pool.length)];if(!picks.includes(k))picks.push(k);}
  for(const k of picks){const a=r()*Math.PI*2,dd=2.6+r()*2.2;const x=p.x+Math.cos(a)*dd,z=p.z+Math.sin(a)*dd;const y=(typeof WORLD!=='undefined'&&activeZoneId==='world')?WORLD.worldH(x,z):ty;
    if(k==='skull'){solid(x,z,.18);put(new THREE.Mesh(new THREE.CylinderGeometry(.03,.04,1.6,5),M(0x3a2a1a)),x,y+.8,z);put(new THREE.Mesh(new THREE.SphereGeometry(.13,7,6),M(0xe0d8c8)),x,y+1.7,z);}
    else if(k==='chains'){solid(x+.15,z,.25);for(let i=0;i<2;i++){put(new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.2,4),M(0x4a4a50)),x+i*.3,y+1.4,z);put(new THREE.Mesh(new THREE.TorusGeometry(.08,.02,4,8),M(0x4a4a50)),x+i*.3,y+.78,z,0);}}
    else if(k==='tree'){solid(x,z,.3);put(new THREE.Mesh(new THREE.CylinderGeometry(.08,.16,2.6,6),M(0x2a2420)),x,y+1.3,z);for(let i=0;i<4;i++){const b=put(new THREE.Mesh(new THREE.CylinderGeometry(.02,.05,1.1,4),M(0x2a2420)),x,y+2.2+i*.15,z);b.rotation.z=.9*(i%2?1:-1);b.rotation.y=i*1.5;}}
    else if(k==='bones'){for(let i=0;i<7;i++)put(new THREE.Mesh(new THREE.BoxGeometry(.06,.05,.3+r()*.3),M(0xe8e0d0)),x+(r()-.5)*1.4,y+.03,z+(r()-.5)*1.4,r()*3);}
    else if(k==='cairn'){solid(x,z,.4);for(let i=0;i<5;i++)put(new THREE.Mesh(new THREE.BoxGeometry(.5-i*.07,.18,.4-i*.05),M(0x6a665e)),x,y+.09+i*.17,z,r()*.6);}
    else if(k==='mist'){const N=18;const pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=(r()-.5)*7;pos[i*3+1]=.2+r()*.5;pos[i*3+2]=(r()-.5)*7;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));const m=new THREE.Points(g,new THREE.PointsMaterial({color:0xd0d0d8,size:1.6,transparent:true,opacity:.18,depthWrite:false,sizeAttenuation:true}));m.position.set(p.x,ty,p.z);sc.add(m);PORTAL_FX.push({kind:'mist',m,ph:r()*6});}
    else if(k==='ravens'){for(let i=0;i<3;i++)put(new THREE.Mesh(new THREE.BoxGeometry(.14,.1,.22),M(0x101010)),x+(r()-.5),y+.06,z+(r()-.5),r()*3);}}
  if(p.sigil||p.kind==='fort_door'){const col=THEME_GLOW[p.theme]||0xffd060;const l=new THREE.PointLight(col,1.6,9);const fz=sigilOnly?-1.6:0;l.position.set(p.x,ty+1.4,p.z+.6+fz);sc.add(l);
    const N=28;const pos=new Float32Array(N*3);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));const pts=new THREE.Points(g,new THREE.PointsMaterial({color:col,size:.16,transparent:true,opacity:.85,depthWrite:false}));pts.position.set(p.x,ty,p.z+fz);sc.add(pts);
    const runes=[];for(let i=0;i<5;i++){const rm=put(new THREE.Mesh(new THREE.BoxGeometry(.16,.18,.03),M(col,col)),p.x-1.0+i*.5,ty+(sigilOnly?3.4:2.3),p.z+(sigilOnly?-1.02:.35));rm.material.emissiveIntensity=.8;runes.push(rm);}
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
  /* a steady hand buys time; S716 — never under 150 ms, the co-op rule's floor for a timing window (Michael's A on #119): it was 110 */
  const dwell=Math.round(Math.max(150,300-pins*28-(h%40)+fin*22));
  return {pins,dwell,fall:Math.round(420+ (h%120))};
}
// S150 — which dungeon chests are locked: every treasure chest, and ordinary ones by floor (1 in 5 on the
// first, 2 in 5 on the second). Steady per cell, so a mimic in the same place wears the same lock.
// S1283 — keyed by the chest's cell: called in cells while a dungeon is built (DCELL 1) and in metres after
function chestLockedAt(x,z,floor){
  const h=String(dCellOf(x)+'_'+dCellOf(z)+'_'+(floor||1)+'_c').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,17);
  return (h%100)<((floor||1)>=2?40:20);
}
function lockChest(ch){
  ch.locked=true;ch.lockBonus=ch.treasure?1:0;ch.lockTitle=ch.treasure?'A locked treasure chest':'A locked chest';
  ch.onPick=()=>{ch.locked=false;if(typeof openLoot==='function')openLoot(ch);};
  return ch;
}
// S732 — stolen picks are their own stack (sameStack), so the count on the lock adds the stacks
function lpPicks(){return BAG.reduce((a,b)=>a+(b.name==='Lockpick'?(b.qty||1):0),0);}
function lpSpendPick(){const i=BAG.findIndex(b=>b.name==='Lockpick');if(i<0)return 0;const it=BAG[i];it.qty=(it.qty||1)-1;if(it.qty<=0)BAG.splice(i,1);if(typeof renderInv==='function')renderInv();return lpPicks();}
function openLockpick(door){
  const d=lpDifficulty(door);
  LP.door=door;LP.cur=0;LP.phase='idle';LP.pushed=0;LP.dwell0=d.dwell;LP.dwell=d.dwell*(lpStiff()?2:1);LP.fall=d.fall;LP.broke=0;
  LP.pins=Array.from({length:d.pins},()=>({set:false,y:0}));
  // S327 (Michael's A on #54) — a town lock is picked in a running world: the watch walks and the clock turns, you stand still
  LP.live=!!(door&&door.live);LP.hp=PHP;if(LP.live){const KK=window._K;if(KK)for(const k in KK)KK[k]=false;blocking=false;}
  lockOpen=true;_releasePointerLockForMenu();
  const el=document.getElementById('lockpick');el.style.display='flex';
  document.getElementById('lpk-title').textContent=(door&&door.lockTitle)?(d.pins>=4?door.lockTitle+' — a good lock':door.lockTitle):(d.pins>=4?'A good lock':'A locked door');
  lpRender();lpStatus('Push a pin. Press again when it holds.'+(lpStiff()?' The works are stiff with frost.':''));
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
  const feel=perk('locks',25)&&lpPhase()==='hold'; /* S973 — Feel for it (Locks 25): the worked pin glows while it sits at the shear */
  LP.pins.forEach((p,i)=>{const el=box.children[i];el.className='lp-pin'+(p.set?' set':'')+(i===LP.cur&&!p.set?' cur':'')+(feel&&i===LP.cur&&!p.set?' feel':'');
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
    LP.dwell=(LP.dwell0||LP.dwell)*(lpStiff()?2:1); /* S1718 — read at each push: the frost may wear off mid-lock */
    LP.pushed=performance.now();LP.phase='rise';p.y=0;try{sfxTone(1500+Math.random()*400,1900,.03,.06,'square');}catch(e){}
    lpStatus('Now \u2014 let it go at the top.');lpRender();return;
  }
  if(ph==='rise'){lpBreak('Too soon \u2014 the pin hadn\u2019t reached the shear.');return;}
  if(ph==='fall'){lpBreak('Too late \u2014 the pin was already falling.');return;}
  // 'hold': the moment it sits at the shear
  p.set=true;p.y=1;LP.pushed=0;LP.phase='idle';skillUse('locks',1,LP.cur); /* S941 — a pin set */try{sfxTone(2200,2600,.04,.1,'square');}catch(e){}
  const left=LP.pins.filter(x=>!x.set).length;
  if(!left){lpWin();return;}
  lpNextPin();lpStatus('It holds. '+left+' to go.','#c8e88a');lpRender();
}
function lpNextPin(){const n=LP.pins.length;for(let k=1;k<=n;k++){const i=(LP.cur+k)%n;if(!LP.pins[i].set){LP.cur=i;LP.phase='idle';LP.pushed=0;LP.pins[i].y=0;lpRender();return;}}}
function lpPickPin(dir){const n=LP.pins.length;for(let k=1;k<=n;k++){const i=((LP.cur+dir*k)%n+n)%n;if(!LP.pins[i].set){LP.cur=i;LP.phase='idle';LP.pushed=0;LP.pins[i].y=0;lpRender();return;}}}
// S1718 — a lock Sioc's touch stiffened (#976 A, 64-spells.js's lockStiff): for its 30 s of play the pin holds twice as long, and a mistimed
// press drops the pin and spares the pick (none spent, no snap heard, the pins already set stay)
function lpStiff(){return typeof lockStiff==='function'&&!!LP.door&&lockStiff(LP.door);}
function lpBreak(why){
  if(lpStiff()){const p=LP.pins[LP.cur];if(p)p.y=0;LP.phase='idle';LP.pushed=0;try{sfxTone(900,700,.05,.1,'triangle');}catch(e){}
    lpRender();lpStatus(why+' The pin drops; the stiff works spare the pick.','#a8c8e8');return;}
  const p=LP.pins[LP.cur];if(p)p.y=0;LP.phase='idle';LP.pushed=0;LP.broke++;
  const left=lpSpendPick();
  try{sfxTone(2600,1400,.06,.16,'square');}catch(e){}
  if(LP.live&&typeof snapHeard==='function')try{snapHeard(LP.door);}catch(e){} /* S1542 — a snap is heard (#824 C): a shop's keeper comes to look */
  const box=document.getElementById('lp-pins');if(box&&box.children[LP.cur]){const el=box.children[LP.cur];el.classList.add('broke');setTimeout(()=>el.classList.remove('broke'),260);}
  // the last pin you set falls with it — the lock gives ground grudgingly; S973 — Sure hand (Locks 50) keeps them
  if(!perk('locks',50))for(let i=LP.pins.length-1;i>=0;i--){if(LP.pins[i].set){LP.pins[i].set=false;LP.pins[i].y=0;break;}}
  lpRender();
  if(left<=0){lpStatus(why+' That was your last pick.','#e88a8a');lpFail();return;}
  lpStatus(why+` The pick snaps. ${left} left.`,'#e8a880');
}
function lpFail(){
  LP.phase='done';
  setTimeout(()=>{closeLockpick();showMsg('No picks left. The lock holds.','#cc8844');},900);
}
function lpWin(){skillUse('locks',3,'open'); /* S941 — a lock opened */
  LP.phase='done';lpRender();lpStatus('The lock gives.','#ffd700');
  const door=LP.door;
  try{sndDoorUnlock();}catch(e){}
  setTimeout(()=>{
    closeLockpick();
    if(door&&door.onPick){try{door.onPick();}catch(e){console.error(e);}} // S150 — a chest opens itself
    else if(door){door.open=true;if(door.mesh&&typeof dScene!=='undefined')dScene.remove(door.mesh);
      try{const map=activeMap();if(map[door.r]&&map[door.r][door.c]===5)map[door.r][door.c]=1;}catch(e){}}
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
function pickChance(){const fin=attrEff('finesse');return Math.min(.92,.35+skillLv('locks')*.005+fin*.01);} /* S941 — Locks, half a point a level; Finesse at 1% (skills and perks A) */
function tryLockpick(door){const i=BAG.findIndex(b=>b.name==='Lockpick');if(i<0){showMsg('Locked. A lockpick would do it — the goods shops sell them.','#cc8844');try{sfxTone(400,300,.08,.1,'square');}catch(e){}return false;}
  openLockpick(door);return true; // v80 S142 — the lock is worked by hand now
  /* eslint-disable no-unreachable */
  const ok=Math.random()<pickChance();try{for(let k=0;k<3;k++)setTimeout(()=>sfxTone(1800+Math.random()*600,1200,.03,.08,'square'),k*140);}catch(e){}
  setTimeout(()=>{if(ok){sndDoorUnlock();door.open=true;dScene.remove(door.mesh);const map=activeMap();if(map[door.r]&&map[door.r][door.c]===5)map[door.r][door.c]=1;showMsg('The lock gives.','#ffd700');(worldState.stats||(worldState.stats={})).picked=((worldState.stats||{}).picked||0)+1;}
    else{const it=BAG[i];it.qty=(it.qty||1)-1;if(it.qty<=0)BAG.splice(i,1);try{sfxTone(2600,1400,.06,.16,'square');}catch(e){}showMsg(`The pick snaps. ${BAG.some(b=>b.name==='Lockpick')?'Try again.':'That was your last one.'}`,'#cc8844');if(typeof renderInv==='function')renderInv();}},460);return true;}

// ═══ v80 — LAIR CAVERNS AND DRAGONS ══════════════════════════════════
// Every lair carries a cavern (a portal flagged lair:{...}); the beast at the mouth still guards the approach,
// and inside, in the deepest room, the lair's true master waits on its hoard. Dragons are the largest antibodies:
// where the binding tore worst, what the world made has wings. The Salt Mouth has one; a few lairs beyond do too.
// S694 — worldState.masters[seed]: true (an old save: dead, the hoard gone) or {dead, hoard:{x,z,floor,items}}. The hoard rolls once
// and its items are the chest's own list, so what you take stays taken and a day's turn does not refill it; the master is dead from
// the blow that kills him (slayMaster), not from a cavern cleared to the last rat.
function lairHoardChest(portal,h,dragon){foundRestore(h.items);const group=new THREE.Group();const {lid}=buildChestShell(group,1.3,0xaa8030);group.position.set(h.x,(h.floor===2?FLOOR2_Y:0),h.z);dScene.add(group);
  CHESTS.push({id:`${dKeyOf(portal,h.floor||1)}:hoard`,x:h.x,z:h.z,opened:false,lid,treasure:true,floor:h.floor||1,mesh:group,items:h.items,displayName:dragon?"The Wyrm's Hoard":'The Hoard'});}
// S696 — the hoard's spot: beside the master, on an open cell of its own floor. It stood at the master's spot plus (1.2, .6),
// which was often inside a wall (Carrigowen's floor 2: the chest unseen, its prompt only when you looked down at the bricks). A
// cell is 1 unit and the chest 1.3 across, so a cell whose eight neighbours are open is first, then one with its four, then any.
function lairHoardSpot(e){const map=(e.floor===2&&dMap2)?dMap2:dMap;const fl=e.floor||1;
  const open=(c,r)=>!!(map&&r>=0&&r<dR&&c>=0&&c<dC&&map[r][c]!==0&&map[r][c]!==4&&map[r][c]!==5&&!CHESTS.some(ch=>(ch.floor||1)===fl&&Math.floor(ch.x+.5)===c&&Math.floor(ch.z+.5)===r));
  const room=(c,r,n)=>{for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){if(!i&&!j)continue;if(n===4&&i&&j)continue;if(!open(c+i,r+j))return false;}return true;};
  const c0=Math.floor(e.x+.5),r0=Math.floor(e.z+.5);const cells=[];
  for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){if(!i&&!j)continue;const c=c0+i,r=r0+j;if(open(c,r))cells.push({c,r,d:Math.hypot(c-e.x-1.2,r-e.z-.6)});}
  cells.sort((a,b)=>a.d-b.d);const best=cells.find(k=>room(k.c,k.r,8))||cells.find(k=>room(k.c,k.r,4))||cells[0];
  return best?{x:best.c,z:best.r}:{x:e.x,z:e.z};}
// S1885 — a hoard's items live in worldState and come back from a save without their enchant's functions: put them back by id
function foundRestore(items){if(!Array.isArray(items))return;for(const it of items){if(!it||!it.enchantId||(it.enchant&&typeof it.enchant.apply==='function'))continue;
  const e=ARMOR_ENCHANTS.find(x=>x.id===it.enchantId);if(e){it.enchant=e;it.enchantStats=e.apply(it);}}}
// S2370 — what a gate keeps (what-a-gate-keeps-build.md, Michael's C on #1092; the sheet's first session): a lesser gate's ring chamber is
// its keep, and on the middle of its dais stands a sealed coffer, the boss chest of Skyrim at the end of the walk. It opens at a touch once
// this gate's carving is read (worldState.sigilsRead[seed], the character's: whoever touched it, warrior or mage); before, the script round
// its lid is closed to you. It holds 2 pieces (GATE_KEEP, 14-items.js) of arms, armour or implements, never gold, potions or picks, rolled
// on the gate's own stream (<seed>:<floor>:coffer, no day: it never refills) at the floor's tier plus one, at most 4; the gate's orb, one
// gate in three, lies in it on top. A great gate keeps its vault (the sheet's later sessions) and its orb stays in the deepest chest until
// then; a gate with no carving of its own (a legacy dungeon's) has no coffer. Opened, its list is the world's: worldState.gateKeeps[seed]
// .coffer holds what is left in it, so what you take stays taken, as a lair's hoard does. A plain stone chest stands in for the look's coffer.
function gateKeepOf(seed){const K=worldState.gateKeeps||(worldState.gateKeeps={});return K[seed]||(K[seed]={});}
function gateCofferDue(portal){if(!portal||portal.seed==null||portal.tutorial||portal.lair)return false;
  if(!(portal.zone==='world'||portal.zone==='gen'))return false;if(typeof SIGIL_PLACEMENTS!=='undefined'&&SIGIL_PLACEMENTS[portal.seed])return false;
  try{if(typeof greatSchoolOf==='function'&&greatSchoolOf(portal))return false;return typeof gateCarving==='function'&&!!gateCarving(portal.seed);}catch(e){return false;}}
function gateCofferItems(portal,floor){const tier=Math.min(GATE_KEEP.tierMax,dungeonTier(portal,floor)+GATE_KEEP.tierUp),key=`${portal.seed}:${floor}:coffer`,was=LOOT_SCHOOL;
  LOOT_SCHOOL=gateOrbSchool(portal);let items;
  try{items=withLootRng(seededRng('loot',key),()=>withLootTier(tier,()=>{const out=[];for(let i=0;i<GATE_KEEP.cofferN;i++){const it=rollLoot(portal.diffScale,portal.theme,'coffer');if(it)out.push(it);}return out;}));}
  finally{LOOT_SCHOOL=was;}
  const orb=gateOrbFor(portal,floor);if(orb)items.unshift(orb);return items;}
function gateKeepLay(portal,gen){GATE_KEEP_LIE=null;if(!gen||!gen.gate||gen.ring==null||!gateCofferDue(portal))return null;
  const sp=gen.spaces[gen.ring],d=sp&&sp.dais;if(!d)return null;const fl=sp.floor||1,x=dAt((d.x0+d.x1)/2),z=dAt((d.z0+d.z1)/2),y=(fl===2?FLOOR2_Y:0)+.4;
  const K=gateKeepOf(portal.seed),was=Array.isArray(K.coffer),items=was?K.coffer:gateCofferItems(portal,fl);if(was)foundRestore(items);
  const group=new THREE.Group(),dress=window.OG_LOOK==='new'&&typeof gkeepCoffer==='function';let lid; /* S2375 — the new look dresses the keep (gkeep*, 56-dungeon-build.js) */
  if(dress){const C=gkeepCoffer(gateOrbSchool(portal));group.add(C.group);lid=C.lid;}else{lid=buildChestShell(group,.85,0x77726a).lid;group.scale.setScalar(DCELL);}
  group.position.set(x,y,z);group.name='gateCoffer';
  {const t=(gen.thresholds||[]).find(t=>(t.a===gen.ring||t.b===gen.ring)&&(t.floor||1)===fl);if(t){const dx=dAt(t.c)-x,dz=dAt(t.r)-z;group.rotation.y=Math.abs(dx)>Math.abs(dz)?(dx>0?Math.PI/2:-Math.PI/2):(dz>0?0:Math.PI);}} /* its front to the way in */
  dScene.add(group);
  if(dress)try{const f=D_CEIL[fl],h=(f?f(x/DCELL,z/DCELL):FLOOR_HEIGHT)-.4,S=gkeepShaft(h,gateOrbSchool(portal));S.position.set(x,y,z);dScene.add(S);}catch(e){console.warn('gkeepShaft',e);}
  const ch={id:`${portal.seed}:${fl}:coffer`,x,z,y:.4,opened:was,lid,treasure:true,coffer:portal.seed,floor:fl,mesh:group,items,displayName:'The Coffer'};
  if(was&&lid)lid.rotation.x=-Math.PI/3;CHESTS.push(ch);try{gateKeepThings(portal,gen,ch);}catch(e){console.warn('gateKeepThings',e);}try{gateDelverLay(portal,gen,ch);}catch(e){console.warn('gateDelverLay',e);}try{gateCacheLay(portal,gen);}catch(e){console.warn('gateCacheLay',e);}return ch;}
function gateCofferShut(ch){const S=worldState.sigilsRead;return !(S&&ch&&S[ch.coffer]!=null);}
// the named action (co-op rules): the coffer opened, its list the world's from now on
function openCoffer(ch){if(!ch||ch.coffer==null)return false;if(gateCofferShut(ch)){showMsg('The script round its lid is closed to you.','#c8b880');return false;}
  const K=gateKeepOf(ch.coffer);if(!Array.isArray(K.coffer))K.coffer=ch.items;else ch.items=K.coffer;openLoot(ch);return true;}
// S2371 — what a gate keeps, session 1's second half: the altar's arc and the crystal vein (what-a-gate-keeps-build.md). Both stand in the
// keep with the coffer, as plain stand-ins until the look builder dresses the room (the sheet's session 3).
// The altar, a stone block on the dais between the way in and the coffer, holds one arc of its school's armillary (a working name; the
// quest writer names them) in one lesser gate in three (seededRng('arc-has', seed); the rate is DECISION #1718, B built until answered).
// Taken once (worldState.gateKeeps[seed].arc, the world's), it is numbered in the order you find them (worldState.relicArcs.found[school],
// the character's): the first three of a school are its armillary's, a fourth is plain gate salvage. Weight 1, 40 at a counter, salvage.
// The vein, a cluster of the gate's crystal in the keep's corner farthest from the way in, gives 3 crystals in a steady gate, 4 in a
// failing one, 5 in a catastrophic one (worldState.gateKeeps[seed].vein: {n,s}, the world's), struck with a pick as a world vein is
// (VEIN_STRIKE, the same chance and Mining), and never returns. A crystal: weight 0.5, 25 at a counter. Joining the arcs and setting a
// crystal at the forge are the sheet's session 2.
const GATE_ARC={rate:1/3,per:3,weight:1,price:40},GATE_VEIN={steady:3,failing:4,catastrophic:5,weight:.5,price:25};
let GATE_KEEP_LIE=null; /* the keep's altar and vein as laid: {altar:{x,z,floor,seed,school,mesh,arc}, vein:{…}} */
function gateArcDue(portal){if(!gateCofferDue(portal))return false;const K=worldState.gateKeeps&&worldState.gateKeeps[portal.seed];if(K&&K.arc)return false;
  return seededRng('arc-has',portal.seed)()<GATE_ARC.rate;}
function schoolName(s){return (typeof SCHOOL_DEF!=='undefined'&&SCHOOL_DEF[s]&&SCHOOL_DEF[s].name)||s;}
function relicArcsOf(){const R=worldState.relicArcs||(worldState.relicArcs={});if(!R.found)R.found={};return R;}
function arcItem(school,n){const it={name:`Arc of ${schoolName(school)}'s armillary`,ico:'◠',type:'misc',weight:GATE_ARC.weight,buyPrice:GATE_ARC.price,sellMult:1};
  if(n<=GATE_ARC.per)it.arc={school,n};else{it.name=`Broken arc (${schoolName(school)})`;it.arcSpare=school;}return it;}
function gateCrystalItem(school){return {name:`Gate crystal of ${schoolName(school)}`,ico:'💠',type:'misc',weight:GATE_VEIN.weight,buyPrice:GATE_VEIN.price,sellMult:1,gateCrystal:school};}
// the bag's line for an arc: "2 of 3 of Tine's armillary"
function arcDesc(it){return it&&it.arc?`${it.arc.n} of ${GATE_ARC.per} of ${schoolName(it.arc.school)}'s armillary`:it&&it.arcSpare?'A spare: gate salvage':'';}
function gateVeinCap(cond){return GATE_VEIN[cond]||GATE_VEIN.steady;}
function gateVeinRec(seed,key){const K=worldState.gateKeeps&&worldState.gateKeeps[seed];return (K&&K[key||'vein'])||{n:0,s:0};}
function gateVeinLeft(v){return Math.max(0,v.cap-gateVeinRec(v.gate,v.key).n);}
// S2492 — rare materials B, session 2 (`docs/design/rare-materials.md`, Michael's B on #1840): the sigil stone. In a failing or catastrophic
// lesser gate's keep, one script stone stands against the wall beside the crystal vein (1.4 m along it, toward the room's middle). It is
// struck as a vein is (the strike's chance and Mining's use), but only with a steel pick or better, and gives one stone, once: it never
// returns (worldState.gateKeeps[seed].sigil {n,s}, the world's, beside the vein's record). The stone is gate salvage, always (it is cut from
// a gate), weight 2, 150 at a counter. At the forge it is tier 9's rare piece (50-travel.js), and its mark goes into the ingots and the piece.
// A plain stand-in slab, the school's script faint on its face, until the look builder's kit piece.
const GATE_SIGIL={weight:2,price:150,metal:4,along:1.4};
function gateSigilDue(cond){return cond==='failing'||cond==='catastrophic';}
function sigilStoneItem(school){return {name:`Sigil stone of ${schoolName(school)}`,ico:'🪨',type:'misc',weight:GATE_SIGIL.weight,buyPrice:GATE_SIGIL.price,sellMult:.5,sigilStone:school,salvage:true};}
function gateSigilLay(portal,gen,v,y,ox,oz){if(!v||!gateSigilDue(gen.cond))return null;
  const x=v.x-ox*GATE_SIGIL.along,z=v.z+oz*.35,s={id:`${portal.seed}:${v.floor}:sigil`,gate:portal.seed,school:v.school,cap:1,key:'sigil',x,z,floor:v.floor,g:null};
  {const k=typeof sigilKitMesh==='function'?sigilKitMesh(v.school,s.id,gateVeinLeft(s)<=0):null;if(k){const g=new THREE.Group();g.name='gateSigil';g.position.set(x,y,v.z+oz*.55);if(oz>0)k.rotation.y=Math.PI; /* S2519 — the kit's stone against the keep's wall (.55 past the vein), its face to the room */
    g.add(k);dScene.add(g);s.g=g;s.kit=true;GATE_KEEP_LIE.sigil=s;return s;}}
  const col=new THREE.Color((typeof SCHOOL_DEF!=='undefined'&&SCHOOL_DEF[v.school]&&SCHOOL_DEF[v.school].col)||'#9ad'),g=new THREE.Group();g.name='gateSigil';g.position.set(x,y,z);
  const slab=new THREE.Mesh(new THREE.BoxGeometry(.7,1.15,.2),new THREE.MeshLambertMaterial({color:0x3a3632}));slab.position.y=.575;slab.rotation.x=-oz*.06;
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.5,.85),new THREE.MeshBasicMaterial({color:col.clone().multiplyScalar(.55),transparent:true,opacity:.55}));face.position.set(0,.6,-oz*.105);if(oz>0)face.rotation.y=Math.PI;
  const k=new THREE.Group();k.add(slab,face);g.add(k);dScene.add(g);s.g=g;gateVeinShow(s);GATE_KEEP_LIE.sigil=s;return s;}
function gateSigilStrike(v){if(!hasPick())return {why:'You need a pick.'};if(toolMetal('pick')<GATE_SIGIL.metal)return {why:'The stone turns the iron. It wants a steel pick.'};
  let r=gateVeinRec(v.gate,'sigil');if(r.n>=v.cap)return {why:'The stone is cut out.'};
  const it=sigilStoneItem(v.school);if(!canCarry(it))return {why:'Too heavy to carry!'};
  const got=seededRng('sigil',v.id+':'+r.s)()<.35+.005*skillLv('mining');r={n:r.n+(got?1:0),s:r.s+1};gateKeepOf(v.gate).sigil=r;
  if(got){bagAdd(it);skillUse('mining',4);}else skillUse('mining',1);gateVeinShow(v);
  return {got:got?it.name:null,left:Math.max(0,v.cap-r.n)};}
// what E says at the keep's vein or stone
function gateVeinWord(v){if(!v)return '';const left=gateVeinLeft(v)>0;if(v.key==='sigil')return left?"Press 'E' to cut the sigil stone":'The stone is cut out';
  return left?"Press 'E' to cut the crystal":'The crystal is all cut out';}
// laid by gateKeepLay with the coffer, in metres
function gateKeepThings(portal,gen,coffer){GATE_KEEP_LIE={altar:null,vein:null,sigil:null};const sp=gen.spaces[gen.ring],fl=sp.floor||1,y=fl===2?FLOOR2_Y:0,school=gateOrbSchool(portal);
  if(!school)return GATE_KEEP_LIE;
  const t=(gen.thresholds||[]).find(t=>(t.a===gen.ring||t.b===gen.ring)&&(t.floor||1)===fl),tx=t?dAt(t.c):coffer.x,tz=t?dAt(t.r):coffer.z;
  {let dx=tx-coffer.x,dz=tz-coffer.z;const L=Math.hypot(dx,dz)||1;if(Math.abs(dx)>Math.abs(dz)){dx=Math.sign(dx);dz=0;}else{dz=Math.sign(dz||1);dx=0;} /* toward the way in, along the dais's axis */
    const x=coffer.x+dx*2.6,z=coffer.z+dz*2.6,g=new THREE.Group();g.name='gateAltar';g.position.set(x,y+.4,z);
    const dress=window.OG_LOOK==='new'&&typeof gkeepAltar==='function'; /* S2375 — dressed on the new look, its long side across the way in */
    if(dress){const a=gkeepAltar(school);a.rotation.y=dx?Math.PI/2:0;g.add(a);}
    else{const stone=new THREE.MeshLambertMaterial({color:0x7a756c}),block=new THREE.Mesh(new THREE.BoxGeometry(1.2,.95,.7),stone);block.position.y=.475;block.rotation.y=dx?Math.PI/2:0;g.add(block);}
    let arc=null;if(gateArcDue(portal)){if(dress){arc=gkeepArc(school);arc.position.y=.75;arc.rotation.y=dx?Math.PI/2:0;}
      else{arc=new THREE.Mesh(new THREE.TorusGeometry(.32,.035,6,18,Math.PI*.75),new THREE.MeshLambertMaterial({color:0xb08a3a,emissive:0x2a1c06}));arc.position.y=1.0;arc.rotation.x=-Math.PI/2+.25;arc.name='gateArc';}g.add(arc);}
    dScene.add(g);DUNGEON_COLUMNS.push({x,z,r:.62,floor:fl,altar:portal.seed});
    GATE_KEEP_LIE.altar={x,z,floor:fl,seed:portal.seed,school,mesh:g,arc};}
  {const R=[[sp.x,sp.y],[sp.x+sp.w-1,sp.y],[sp.x,sp.y+sp.h-1],[sp.x+sp.w-1,sp.y+sp.h-1]],M=fl===2?gen.map2:gen.map,CS=fl===2?gen.cellSpace2:gen.cellSpace;
    const ok=([c,r])=>M&&M[r]&&M[r][c]===1&&(!CS||CS[r][c]===sp.id),cs=R.filter(ok).sort((a,b)=>Math.hypot(dAt(b[0])-tx,dAt(b[1])-tz)-Math.hypot(dAt(a[0])-tx,dAt(a[1])-tz));
    const k=cs[0];if(k){const [c,r]=k,ox=c===sp.x?-1:1,oz=r===sp.y?-1:1,H=DCELL/2-.55,x=dAt(c)+ox*H,z=dAt(r)+oz*H,cap=gateVeinCap(gen.cond);
      const v={id:`${portal.seed}:${fl}:vein`,gate:portal.seed,school,cap,x,z,floor:fl,g:null};
      const g=new THREE.Group();g.name='gateVein';g.position.set(x,y,z);
      if(window.OG_LOOK==='new'&&typeof gkeepVein==='function'){const V=gkeepVein(school,v.id),ry=Math.atan2(-ox,-oz);V.rock.position.set(x,y,z);V.rock.rotation.y=ry;dScene.add(V.rock);
        V.clusters.position.set(x,y,z);V.clusters.rotation.y=ry;dScene.add(V.clusters);v.g=V.clusters;v.rock=V.rock;gateVeinShow(v);GATE_KEEP_LIE.vein=v;gateSigilLay(portal,gen,v,y,ox,oz);return GATE_KEEP_LIE;} /* S2375 — the dressed vein faces the room */
      const col=new THREE.Color((typeof SCHOOL_DEF!=='undefined'&&SCHOOL_DEF[school]&&SCHOOL_DEF[school].col)||'#9ad');
      const mat=new THREE.MeshLambertMaterial({color:col,emissive:col.clone().multiplyScalar(.35)}),rr=seededRng('gatevein',v.id);
      for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.16+rr()*.12,0),mat);m.scale.y=2+rr()*1.4;m.position.set((rr()-.5)*.6,.25+rr()*.2,(rr()-.5)*.6);m.rotation.set((rr()-.5)*.6,rr()*3,(rr()-.5)*.6);g.add(m);}
      dScene.add(g);v.g=g;gateVeinShow(v);GATE_KEEP_LIE.vein=v;gateSigilLay(portal,gen,v,y,ox,oz);}}
  return GATE_KEEP_LIE;}
function gateVeinShow(v){if(!v||!v.g)return;if(v.kit){const k=v.g.children[0],cut=gateVeinLeft(v)<=0;if(k&&k.userData.kit&&k.userData.kit.cut!==cut){const n=sigilKitMesh(v.school,v.id,cut);if(n){n.rotation.y=k.rotation.y;v.g.remove(k);k.traverse(o=>o.geometry&&o.geometry.dispose());v.g.add(n);}}return;} /* S2519 — the kit's stone, hewn out once cut */
  const left=gateVeinLeft(v),n=v.g.children.length;v.g.children.forEach((m,i)=>{m.visible=i<Math.ceil(n*left/v.cap);});}
/* S2380 — the critic's 18 Nov note: the altar stands 2.6 m before the coffer, so from between them E with the crosshair on the coffer's lock took the arc.
   The altar and the vein answer in reach as before, but give way to a chest the crosshair is on, unless the crosshair is on them too (interact()'s chest test, lookingAt) */
function gateKeepYields(o,reach){const ch=CHESTS.find(c=>c.floor===currentFloor&&(!c.opened||c.items.length>0)&&lookingAt(c));return !!ch&&!lookingAt(o,reach);}
function gateAltarNear(){const A=GATE_KEEP_LIE&&GATE_KEEP_LIE.altar;if(!A||!A.arc||activeZoneId!=='dungeon'||A.floor!==currentFloor)return null;return Math.hypot(px-A.x,pz-A.z)<TOUCH+.6&&!gateKeepYields(A,TOUCH+.6)?A:null;}
function gateVeinNear(){if(!GATE_KEEP_LIE||activeZoneId!=='dungeon')return null;let best=null,bd=1e9; /* S2492 — the vein or the sigil stone beside it, the nearer */
  for(const v of [GATE_KEEP_LIE.vein,GATE_KEEP_LIE.sigil]){if(!v||v.floor!==currentFloor)continue;const d=Math.hypot(px-v.x,pz-v.z);if(d<TOUCH+.5&&d<bd&&!gateKeepYields(v,TOUCH+.5)){best=v;bd=d;}}
  return best;}
// the named action (co-op rules): the altar's arc taken; returns the item, or null
function takeArc(seed){const A=GATE_KEEP_LIE&&GATE_KEEP_LIE.altar;if(!A||A.seed!==seed||!A.arc)return null;
  const R=relicArcsOf(),n=(R.found[A.school]||0)+1,it=arcItem(A.school,n);if(!canCarry(it)){showMsg('Too heavy to carry!','#cc8844');return null;}
  R.found[A.school]=n;gateKeepOf(seed).arc=1;if(typeof markSalvage==='function')markSalvage(it);bagAdd(it);
  if(A.arc.parent)A.arc.parent.remove(A.arc);A.arc=null;
  showMsg(n<=GATE_ARC.per?`An arc of ${schoolName(A.school)}'s armillary: ${n} of ${GATE_ARC.per}.`:`An arc of ${schoolName(A.school)}'s, and you have its armillary's three. This one is salvage.`,'#d8c890');
  if(typeof renderHubInv==='function')try{renderHubInv();}catch(e){}return it;}
// one strike at the keep's vein, on its own stream (the world vein's rule: 0.35 + 0.005 a Mining level); returns {got, left} or {why}
function gateVeinStrike(v){if(v&&v.key==='sigil')return gateSigilStrike(v);if(!hasPick())return {why:'You need a pick.'};let r=gateVeinRec(v.gate);if(r.n>=v.cap)return {why:'The crystal is all cut out.'};
  const it=gateCrystalItem(v.school);if(!canCarry(it))return {why:'Too heavy to carry!'};
  const got=seededRng('ore',v.id+':'+r.s)()<.35+.005*skillLv('mining');r={n:r.n+(got?1:0),s:r.s+1};gateKeepOf(v.gate).vein=r;
  if(got){bagAdd(it);skillUse('mining',4);}else skillUse('mining',1);gateVeinShow(v);
  return {got:got?it.name:null,left:Math.max(0,v.cap-r.n)};}
function gateMine(v){const st=v.key==='sigil';if(MINE&&MINE.v===v){MINE=null;showMsg(st?'You stop working the stone.':'You stop working the crystal.','#c8b890');return;}
  if(!hasPick()){showMsg('You need a pick.','#cc8844');return;}if(gateVeinLeft(v)<=0){showMsg(st?'The stone is cut out.':'The crystal is all cut out.','#cc8844');return;}
  if(st&&toolMetal('pick')<GATE_SIGIL.metal){showMsg('The stone turns the iron. It wants a steel pick.','#cc8844');return;} /* S2492 */
  MINE={v,t:toolStrike('pick')};showMsg(st?'You set to the sigil stone.':'You set to the crystal.','#c8b890');}
// S2376 — what a gate keeps, session 5's first half (what-a-gate-keeps-build.md): the delver. One lesser gate's keep in three
// (seededRng('delver-has', seed)) holds a dead man against the dais, beside the coffer, and his cold camp a few steps in from the
// door. The body, keyed <seed>:<floor>:delver and looted once, holds a purse of 8 to 20 gold (30 to 60 in a vault, when the vaults are
// built), a sword a tier below the gate, a torch and his journal; the camp holds his bedroll (camp and rest's blanket roll), with a
// cold hearth, a coil of rope and a dropped torch lying by it. All of it on <seed>:<floor>:delver, no day: it never refills. Opened,
// each list is the world's (worldState.gateKeeps[seed].delver: {body, camp}), as the coffer's is. The journal is one of the quest
// writer's eight by seed when they are written (the sheet's session 6); until then its pages are stuck together. Plain stand-ins for
// the look builder's body and camp (the sheet's session 3). The vault's delver waits for the vault.
const GATE_DELVER={rate:1/3,purse:[8,20],vaultPurse:[30,60],tierDown:1,camp:2.5};
BOOKS.push({id:'delver_journal',name:"A delver's journal",ico:'📓',attr:null,pages:['The pages are stuck together with damp.']});
function gateDelverDue(portal){return gateCofferDue(portal)&&seededRng('delver-has',portal.seed)()<GATE_DELVER.rate;}
// what he left, rolled on his own stream: {body, camp}
function gateDelverItems(portal,floor,vault){const r=seededRng('loot',`${portal.seed}:${floor}:delver`),P=vault?GATE_DELVER.vaultPurse:GATE_DELVER.purse;
  const gold={name:'Gold Coins',ico:'🪙',type:'gold',value:P[0]+Math.floor(r()*(P[1]-P[0]+1))};
  const tier=Math.max(1,dungeonTier(portal,floor)-GATE_DELVER.tierDown),sw=WEAPON_TYPES.find(w=>w.type==='Sword');
  const sword=withLootRng(r,()=>withLootTier(tier,()=>makeItem(lootMatTier(portal.diffScale),sw,null,false)));
  const book=Object.assign(makeBookItem(BOOKS.find(b=>b.id==='delver_journal')),{weight:.3,sellMult:0});
  return {body:[gold,sword,{...TORCH_ITEM,weight:1},book],camp:[rollItem('blanket')]};}
// laid by gateKeepLay after the altar and the vein, in metres; returns {body, camp} (the two containers) or null
function gateDelverLay(portal,gen,coffer){if(!gateDelverDue(portal))return null;const sp=gen.spaces[gen.ring],d=sp&&sp.dais;if(!d)return null;
  const fl=sp.floor||1,y=fl===2?FLOOR2_Y:0,M=fl===2?gen.map2:gen.map,CS=fl===2?gen.cellSpace2:gen.cellSpace;
  const ok=(x,z)=>{const c=dCellOf(x),r=dCellOf(z);return !!(M&&M[r]&&M[r][c]===1&&(!CS||CS[r][c]===sp.id))&&!(c>=d.x0&&c<=d.x1&&r>=d.z0&&r<=d.z1);};
  const t=(gen.thresholds||[]).find(t=>(t.a===gen.ring||t.b===gen.ring)&&(t.floor||1)===fl),tx=t?dAt(t.c):coffer.x,tz=t?dAt(t.r):coffer.z;
  let ax=tx-coffer.x,az=tz-coffer.z;if(Math.abs(ax)>Math.abs(az)){ax=Math.sign(ax)||1;az=0;}else{az=Math.sign(az)||1;ax=0;} /* toward the way in, along the dais's axis */
  const qx=-az,qz=ax,rr=seededRng('delver-side',portal.seed),side=rr()<.5?1:-1;
  const half=ax?(d.z1-d.z0+1)*DCELL/2:(d.x1-d.x0+1)*DCELL/2; /* the dais's half-width across the axis */
  let bx=null,bz=null,bs=side;for(const s of [side,-side]){const x=coffer.x+qx*s*(half+.6),z=coffer.z+qz*s*(half+.6);if(ok(x,z)){bx=x;bz=z;bs=s;break;}}
  if(bx==null)return null;
  const K=gateKeepOf(portal.seed),kept=K.delver&&Array.isArray(K.delver.body)?K.delver:null,items=kept?null:gateDelverItems(portal,fl,false);
  const body=kept?K.delver.body:items.body,camp=kept?K.delver.camp:items.camp;if(kept){foundRestore(body);}
  const cloth=new THREE.MeshLambertMaterial({color:0x5b4e3c}),skin=new THREE.MeshLambertMaterial({color:0x9a8e7c}),leather=new THREE.MeshLambertMaterial({color:0x4a3524});
  // the body: sat against the dais's side, legs out toward the room, head fallen forward
  const g=new THREE.Group();g.name='gateDelver';g.position.set(bx,y,bz);g.rotation.y=Math.atan2(qx*bs,qz*bs);
  {const add=(geo,m,x,yy,z,rx)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,yy,z);if(rx)o.rotation.x=rx;g.add(o);return o;};
    if(window.OG_LOOK==='new'&&typeof gkeepDelver==='function')g.add(gkeepDelver(portal.seed)); /* S2379 — dressed on the new look (56): his bones, cloak, pack and lantern */
    else{add(new THREE.BoxGeometry(.42,.6,.24),cloth,0,.42,-.22,-.2);add(new THREE.SphereGeometry(.12,8,6),skin,0,.78,-.12);
    add(new THREE.BoxGeometry(.14,.14,.8),cloth,-.11,.08,.22);add(new THREE.BoxGeometry(.14,.14,.8),cloth,.11,.08,.22);
    add(new THREE.BoxGeometry(.3,.3,.18),leather,.32,.15,-.12);}} /* his pack beside him */
  dScene.add(g);
  const bodyC={id:`${portal.seed}:${fl}:delver`,x:bx,z:bz,y:.4,opened:!!kept,delver:portal.seed,part:'body',floor:fl,mesh:g,items:body,displayName:'A dead delver',say:"Press 'E' — a dead delver"};
  CHESTS.push(bodyC);
  // the camp: a few steps in from the door, to one side of the way
  let camp_=null;{const bx0=tx-ax*GATE_DELVER.camp,bz0=tz-az*GATE_DELVER.camp;let cx=null,cz=null;
    for(const s of [1.6,-1.6,0]){const x=bx0+qx*s,z=bz0+qz*s;if(ok(x,z)){cx=x;cz=z;break;}}
    if(cx!=null){const c=new THREE.Group();c.name='gateCamp';c.position.set(cx,y,cz);c.rotation.y=Math.atan2(ax,az);
      let roll;if(window.OG_LOOK==='new'&&typeof gkeepCamp==='function'){const D=gkeepCamp(portal.seed);c.add(D.group);roll=D.roll;} /* S2379 — dressed on the new look (56) */
      else{roll=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.7,10),new THREE.MeshLambertMaterial({color:0x7a5f44}));roll.rotation.z=Math.PI/2;roll.position.set(0,.13,.5);roll.name='campRoll';c.add(roll);
      const stone=new THREE.MeshLambertMaterial({color:0x5e5a54});for(let i=0;i<7;i++){const a=i/7*Math.PI*2,s=new THREE.Mesh(new THREE.BoxGeometry(.14,.1,.12),stone);s.position.set(Math.cos(a)*.3,.05,Math.sin(a)*.3-.35);s.rotation.y=a;c.add(s);}
      const ash=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.02,10),new THREE.MeshLambertMaterial({color:0x2a2622}));ash.position.set(0,.01,-.35);c.add(ash);
      const rope=new THREE.Mesh(new THREE.TorusGeometry(.16,.035,6,14),new THREE.MeshLambertMaterial({color:0x9b8458}));rope.rotation.x=-Math.PI/2;rope.position.set(.55,.04,.1);c.add(rope);
      const brand=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.5,6),leather);brand.rotation.z=Math.PI/2-.2;brand.position.set(-.5,.04,-.1);c.add(brand);}
      dScene.add(c);camp_={id:`${portal.seed}:${fl}:camp`,x:cx,z:cz,y:.2,opened:!!kept,delver:portal.seed,part:'camp',floor:fl,mesh:c,rollMesh:roll,items:camp,displayName:'A cold camp',say:"Press 'E' — a cold camp"};
      if(!camp.some(x=>x.roll))roll.visible=false;CHESTS.push(camp_);}}
  if(GATE_KEEP_LIE)GATE_KEEP_LIE.delver={body:bodyC,camp:camp_};return {body:bodyC,camp:camp_};}
// the named action (co-op rules): the delver's body or camp opened, its list the world's from now on
function lootDelver(ch){if(!ch||ch.delver==null)return false;const K=gateKeepOf(ch.delver);
  if(!K.delver){const D=GATE_KEEP_LIE&&GATE_KEEP_LIE.delver;K.delver={body:D&&D.body?D.body.items:[],camp:D&&D.camp?D.camp.items:[]};}
  ch.items=K.delver[ch.part]||(K.delver[ch.part]=[]);openLoot(ch);return true;}
// S2469 — what a gate keeps, session 7: the cache (what-a-gate-keeps-build.md, "The cache"; spells-as-keys-build.md: "this sheet's
// seal of the gate's school, set in the keep's wall"; Michael's B on #1783). Every keep has one: a niche in a side wall of the ring
// chamber, on the side away from the delver's, shut by a seal of the gate's own school and opened by that school's key from the
// seals' table, at the niche's size: Tine, two braziers 6 m apart either side of it, both lit by Caor within 20 s; Uisce, a basin of
// the black water before it, frozen by Sioc touched (and bitter cold to stand in until then); Cloch, Cloch Ghéar laid at its foot;
// Scáth, a face a shade darker, walked up to with Oíche worn; Solas, Solas-Gheal laid within 3 m for 3 s; Gaoth, 3.8 m up over a
// gallery, stood on (Séideán's updraft and the mantle, or Second step and Catch). It is a record in GATE_SECRETS like a seal's
// (kind 'seal', keepCache: true; the plates' own .cache is their mesh), so the seals' tick, a laid word, a wrong word and openSecret all serve it; its number is 'k' in the
// world's record (worldState.gateSecrets[seed].o), as the barricade's is 'b'. Inside: a rubbing of the nearest unread carving not yet
// marked (chosen when taken, so it points onward from where you are in the story), and in one cache in three (seededRng('cache-arc',
// seed), the altar's rate) an arc of another school, by seed, numbered when taken as the altar's is. openCache(seed) is the named
// action that takes them; what is taken is the world's (worldState.gateKeeps[seed].cache: {rub, arc}). No chest: the sheet gives the
// cache the rubbing and the arc. Plain stand-ins until the look builder dresses it.
const GATE_CACHE={arcRate:1/3,w:1.4,h:1.1,y:1.0,brazier:3,basin:[2.0,1.2]};
const CACHE_SAY={scath:'The dark stone gives way, and a niche stands open.',gaoth:'You stand at the niche, and its seal gives.'};
function gateCacheSchool(portal){const s=gateOrbSchool(portal);return SECRET_SCHOOLS.includes(s)?s:'cloch';}
// the arc's school, another than the gate's, or null (two caches in three)
function gateCacheArc(portal){const r=seededRng('cache-arc',portal.seed);if(r()>=GATE_CACHE.arcRate)return null;const own=gateCacheSchool(portal),o=SECRET_SCHOOLS.filter(s=>s!==own);return o[Math.floor(r()*o.length)];}
// where the niche goes, in cells, from the generator alone: the ring space's side wall, straight out from the dais's middle across the
// axis from the way in, on the side away from the delver's (then the other). {c,r (the cell before it), ox,oz (out into the rock), ax,az, floor} or null
function gateCachePlace(gen,seed){if(!gen||!gen.gate||gen.ring==null)return null;const sp=gen.spaces[gen.ring],d=sp&&sp.dais;if(!d)return null;
  const fl=sp.floor||1,M=fl===2?gen.map2:gen.map,CS=fl===2?gen.cellSpace2:gen.cellSpace;
  const inSp=(c,r)=>!!(M&&M[r]&&M[r][c]===1&&(!CS||CS[r][c]===sp.id)),rock=(c,r)=>!(M&&M[r]&&M[r][c]>0);
  const c0=Math.round((d.x0+d.x1)/2),r0=Math.round((d.z0+d.z1)/2),t=(gen.thresholds||[]).find(t=>(t.a===gen.ring||t.b===gen.ring)&&(t.floor||1)===fl);
  let ax=t?t.c-c0:0,az=t?t.r-r0:1;if(Math.abs(ax)>Math.abs(az)){ax=Math.sign(ax)||1;az=0;}else{az=Math.sign(az)||1;ax=0;}
  const qx=-az,qz=ax,ds=seededRng('delver-side',seed)()<.5?1:-1;
  for(const s of [-ds,ds]){const ox=qx*s,oz=qz*s;
    for(const k of [0,-1,1,-2,2]){let c=c0+ax*k,r=r0+az*k,n=0;if(!inSp(c,r))continue; /* the dais's middle, then a cell or two either way along the axis */
      while(inSp(c+ox,r+oz)&&n++<200){c+=ox;r+=oz;}
      if(n<1||!rock(c+ox,r+oz))continue;if(c>=d.x0&&c<=d.x1&&r>=d.z0&&r<=d.z1)continue;
      return {c,r,ox,oz,ax,az,floor:fl};}}
  return null;}
// the nearest unread carving not yet marked, from the gate's own place in the world (not this gate): the rubbing's item, or null
function gateCacheRubbing(seed){const p=dungeonWorldPos[seed]||(typeof WORLD!=='undefined'&&WORLD.doorAnywhere&&WORLD.doorAnywhere(+seed));if(!p||typeof carvingsNear!=='function')return null;
  const read=worldState.sigilsRead||{},rub=worldState.rubbings||{},c=carvingsNear(p.x,p.z,Infinity).find(c=>c.seed!=seed&&!read[c.seed]&&!rub[c.seed]);
  return c?{name:`Rubbing: ${c.name}`,ico:'📜',type:'rubbing',seed:c.seed,gate:c.name,weight:.2,sellMult:.3,buyPrice:60,qty:1}:null;}
function gateCacheLeft(rec){const C=(worldState.gateKeeps&&worldState.gateKeeps[rec.seed]&&worldState.gateKeeps[rec.seed].cache)||{};return {rub:!C.rub,arc:!!rec.arc&&!C.arc};}
// what the open niche shows: the rolled rubbing and the arc, each until taken
function gateCacheShow(rec){const L=gateCacheLeft(rec),I=rec.inside;if(!I)return;I.rub.visible=rec.opened&&L.rub;if(I.arc)I.arc.visible=rec.opened&&L.arc;}
// laid by gateKeepLay, in metres, after the seals (GATE_SECRETS is built first)
function gateCacheLay(portal,gen){const P=gateCachePlace(gen,portal.seed);if(!P)return null;
  const school=gateCacheSchool(portal),fl=P.floor,y=fl===2?FLOOR2_Y:0,Hc=DCELL/2,id=`${portal.seed}:${fl}:cache`,opened=gateSecretOpen(portal.seed,'k');
  const fx=dAt(P.c)+P.ox*(Hc-.12),fz=dAt(P.r)+P.oz*(Hc-.12),high=school==='gaoth',base=y+(high?SECRET_GALLERY+.3:GATE_CACHE.y),W=GATE_CACHE.w,H=GATE_CACHE.h;
  const grp=new THREE.Group();grp.name='gateCache';grp.position.set(fx,base,fz);grp.rotation.y=Math.atan2(-P.ox,-P.oz); /* local +z into the room, x along the wall */
  const stone=new THREE.MeshLambertMaterial({color:0x6a655d}),mat=new THREE.MeshLambertMaterial({color:SECRET_SEAL_COL[school]||0x777777});
  const add=(geo,m,x,yy,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,yy,z);grp.add(o);return o;};
  add(new THREE.BoxGeometry(.18,H+.2,.24),stone,-W/2,H/2,0);add(new THREE.BoxGeometry(.18,H+.2,.24),stone,W/2,H/2,0);
  add(new THREE.BoxGeometry(W+.36,.2,.28),stone,0,H+.1,0);add(new THREE.BoxGeometry(W+.36,.14,.34),stone,0,-.07,.02);
  add(new THREE.BoxGeometry(W-.1,H-.05,.06),new THREE.MeshLambertMaterial({color:0x17130f}),0,H/2,-.1); /* the niche's dark back */
  const face=add(new THREE.BoxGeometry(W-.12,H-.08,.1),mat,0,H/2,.02);face.name='gateCacheFace';
  const arc=gateCacheArc(portal),inside={rub:null,arc:null};
  {const rb=add(new THREE.CylinderGeometry(.05,.05,.42,8),new THREE.MeshLambertMaterial({color:0xd8ccae}),-.25,.06,-.02);rb.rotation.z=Math.PI/2;rb.name='gateCacheRubbing';inside.rub=rb;}
  if(arc){let a;if(window.OG_LOOK==='new'&&typeof gkeepArc==='function'){a=gkeepArc(arc);a.scale.setScalar(.7);a.position.set(.25,.05,-.02);grp.add(a);}
    else a=add(new THREE.TorusGeometry(.22,.03,6,16,Math.PI*.75),new THREE.MeshLambertMaterial({color:0xb08a3a,emissive:0x2a1c06}),.25,.2,-.02);a.name='gateCacheArc';inside.arc=a;}
  dScene.add(grp);
  const kx=fx-P.ox*.3,kz=fz-P.oz*.3,along=P.ox?{x:0,z:1}:{x:1,z:0};
  const rec={id,n:'k',seed:portal.seed,kind:'seal',keepCache:true,school,floor:fl,c:P.c,r:P.r,x:fx,y,z:fz,kx,kz,area:{x0:kx-.3,x1:kx+.3,z0:kz-.3,z1:kz+.3},
    opened,group:grp,mat,solid:null,shut:face,chest:null,said:false,arc,inside,place:P};
  if(school==='tine'){rec.braziers=[];const M=fl===2?gen.map2:gen.map,CS=fl===2?gen.cellSpace2:gen.cellSpace,sp=gen.spaces[gen.ring];
    const ok=(x,z)=>{const c=dCellOf(x),r=dCellOf(z);return !!(M&&M[r]&&M[r][c]===1&&(!CS||CS[r][c]===sp.id));};
    for(const s of [-1,1]){let bx=null,bz=null;for(const d of [GATE_CACHE.brazier,1.2]){const x=fx-P.ox*.55+along.x*s*d,z=fz-P.oz*.55+along.z*s*d;if(ok(x,z)){bx=x;bz=z;break;}}
      if(bx==null)continue;const g2=gateBrazierProp();g2.position.set(bx,y,bz);dScene.add(g2);
      const b={id:id+':b'+(s<0?0:1),kind:'brazier',floor:fl,x:bx,y,z:bz,lit:false,group:g2,light:null,seal:id,litAt:null};
      DUNGEON_COLUMNS.push({x:bx,z:bz,r:.55,floor:fl,brazier:b.id});GATE_THINGS.push(b);rec.braziers.push(b);if(opened)gtBrazierShow(b,true);}}
  else if(school==='uisce'){const [bw,bd]=GATE_CACHE.basin,cx=fx-P.ox*bd/2,cz=fz-P.oz*bd/2,hx=P.ox?bd/2:bw/2,hz=P.ox?bw/2:bd/2;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(hx*2,hz*2).rotateX(-Math.PI/2),mat);m.position.set(cx,y+.04,cz);dScene.add(m);rec.water=m;rec.extra=[m];
    rec.area={x0:cx-hx,x1:cx+hx,z0:cz-hz,z1:cz+hz};const T={id:id+':water',kind:'sealwater',floor:fl,x:cx,y,z:cz,area:rec.area,frozen:opened,seal:id,group:m};GATE_THINGS.push(T);rec.thing=T;
    if(opened)mat.color.setHex(0x8fa8b6);}
  else if(school==='solas'){rec.pillar=face;if(opened)mat.emissive=new THREE.Color(0x8a8460);}
  else if(high){const d=1.2,w=2.4,cx=fx-P.ox*d/2,cz=fz-P.oz*d/2,hx=P.ox?d/2:w/2,hz=P.ox?w/2:d/2,top=y+SECRET_GALLERY;
    const m=new THREE.Mesh(new THREE.BoxGeometry(hx*2,.3,hz*2),new THREE.MeshLambertMaterial({color:SECRET_SEAL_COL.gaoth}));m.position.set(cx,top-.15,cz);dScene.add(m);rec.extra=[m];
    rec.gallery={x0:cx-hx,x1:cx+hx,z0:cz-hz,z1:cz+hz,y:top};rec.kx=cx;rec.kz=cz;FOOTHOLDS.push(Object.assign({gate:'gallery',secret:id},rec.gallery));}
  if(opened)face.visible=false;gateCacheShow(rec);GATE_SECRETS.push(rec);if(GATE_KEEP_LIE)GATE_KEEP_LIE.cache=rec;return rec;}
// the open niche in reach, with something left in it (on its gallery, for Gaoth's)
function gateCacheNear(){const rec=GATE_KEEP_LIE&&GATE_KEEP_LIE.cache;if(!rec||!rec.opened||activeZoneId!=='dungeon'||rec.floor!==currentFloor||!currentPortal||currentPortal.seed!==rec.seed)return null;
  const L=gateCacheLeft(rec);if(!L.rub&&!L.arc)return null;if(rec.gallery&&!(inArea(rec.gallery,px,pz,.3)&&jumpY>=rec.gallery.y-.1))return null;
  const o={x:rec.x,z:rec.z,mesh:rec.group};return Math.hypot(px-rec.x,pz-rec.z)<TOUCH+.8&&!gateKeepYields(o,TOUCH+.8)?rec:null;}
// the named action (co-op rules): what the open cache holds, taken; the items taken, or null while it is shut
function openCache(seed){const rec=GATE_SECRETS.find(s=>s.keepCache&&s.seed===seed);if(!rec||!rec.opened)return null;const K=gateKeepOf(seed),C=K.cache||(K.cache={}),got=[];
  if(!C.rub){const it=gateCacheRubbing(seed);C.rub=1;if(it){bagAdd(it);got.push(it);}}
  let heavy=false;if(rec.arc&&!C.arc){const R=relicArcsOf(),n=(R.found[rec.arc]||0)+1,it=arcItem(rec.arc,n);
    if(!canCarry(it))heavy=true;else{R.found[rec.arc]=n;C.arc=1;if(typeof markSalvage==='function')markSalvage(it);bagAdd(it);got.push(it);}}
  gateCacheShow(rec);
  const r=got.find(i=>i.type==='rubbing'),a=got.find(i=>i.arc||i.arcSpare);
  const bits=[];if(r)bits.push(`a rubbing of ${r.gate}`);if(a)bits.push(a.arc?`an arc of ${schoolName(a.arc.school)}'s armillary, ${a.arc.n} of ${GATE_ARC.per}`:`an arc of ${schoolName(a.arcSpare)}'s, and you have its armillary's three`);
  if(bits.length)showMsg(`In the niche: ${bits.join(', and ')}.`,'#d8c890');else if(!heavy)showMsg('The niche is empty.','#c8b890');
  if(heavy)showMsg('Too heavy to carry!','#cc8844');
  if(typeof renderHubInv==='function')try{renderHubInv();}catch(e){}return got;}
// S2372 — what a gate keeps, session 2 (what-a-gate-keeps-build.md), its parts that need no words: joining, the kept armillary's
// compass, and the crystal set at the forge. Three arcs of one school in the bag (the first three found: it.arc.n 1 to 3) are set
// together from the bag in 10 s, no skill (`joinArcs`, the named action): one armillary of the school, weight 3, 150 at a counter (the
// Mark's: no claimant there), salvage as its arcs were, and worldState.relicArcs.joined[school] set. Carried, it shows on the compass the
// nearest lesser gate of its school whose coffer you have not opened, within 2,600 m (the rubbings' reach). The Crown's 400 and service
// and the Prior's service wait on the quest writer's lines (the sheet's session 6). At a forge, Smithing 25 and one crystal of the
// school set a bought staff, wand, maul or tome of that school: it becomes found, its school's words 20% cheaper, not 10%; 20 minutes.
const ARMILLARY={join:10,weight:3,price:150,reach:2600},CRYSTAL_SET={smithing:25,min:20};
let ARC_JOIN=null;
function arcsHeld(school){return BAG.filter(b=>b&&b.arc&&b.arc.school===school);}
function armillaryItem(school){return {name:`${schoolName(school)}'s armillary`,ico:'◎',type:'misc',weight:ARMILLARY.weight,buyPrice:ARMILLARY.price,sellMult:1,armillary:school,salvage:true};}
function joinArcs(school){if(ARC_JOIN){if(ARC_JOIN.school===school){ARC_JOIN=null;showMsg('You leave the arcs as they are.','#c8b890');}return false;}
  const A=arcsHeld(school);if(A.length<GATE_ARC.per){showMsg(`${A.length} of ${GATE_ARC.per} of ${schoolName(school)}'s armillary.`,'#c8b890');return false;}
  ARC_JOIN={school,t:ARMILLARY.join};showMsg('You set the arcs together.','#c8b890');return true;}
function tickArcJoin(dt){const J=ARC_JOIN;if(!J)return;if(arcsHeld(J.school).length<GATE_ARC.per||(typeof dead!=='undefined'&&dead)){ARC_JOIN=null;return;}
  J.t-=dt;if(J.t>0)return;ARC_JOIN=null;const A=arcsHeld(J.school).slice(0,GATE_ARC.per);
  for(const a of A){const i=BAG.indexOf(a);if(i>=0)BAG.splice(i,1);}
  bagAdd(armillaryItem(J.school));const R=relicArcsOf();(R.joined||(R.joined={}))[J.school]=1;
  showMsg(`The three arcs close into one: ${schoolName(J.school)}'s armillary.`,'#e8d8a0');if(typeof renderHubInv==='function')try{renderHubInv();}catch(e){}}
// the kept armillary's needle: the nearest lesser gate of a carried armillary's school whose coffer is shut, {x,z,d,seed,school} or null
let _armCache=null;
function armillaryGate(){if(activeZoneId!=='world'||(typeof isInterior==='function'&&isInterior()))return null;
  const S=[...new Set(BAG.filter(b=>b&&b.armillary).map(b=>b.armillary))];if(!S.length||typeof carvingTable!=='function')return null;
  const now=performance.now(),key=S.join()+'|'+Math.round(px/20)+','+Math.round(pz/20);if(_armCache&&_armCache.key===key&&now-_armCache.t<1000)return _armCache.v;
  const K=worldState.gateKeeps||{};let best=null,bd=ARMILLARY.reach;
  for(const {D,e} of carvingTable().places){if(!D||!e||!S.includes(D.school)||(typeof SIGIL_PLACEMENTS!=='undefined'&&SIGIL_PLACEMENTS[e.seed]))continue;
    if(typeof greatSchoolOf==='function'&&greatSchoolOf({seed:e.seed,great:e.great}))continue;if(K[e.seed]&&Array.isArray(K[e.seed].coffer))continue;
    const p=(typeof dungeonWorldPos!=='undefined'&&dungeonWorldPos[e.seed])||e,d=Math.hypot(p.x-px,p.z-pz);if(d<bd){bd=d;best={x:p.x,z:p.z,d,seed:e.seed,school:D.school};}}
  _armCache={key,t:now,v:best};return best;}
// a piece the crystal can set: a staff, wand, maul or tome of a school, not found already
function crystalSettable(it){const k=implementOf(it);return !!(it&&it.school&&!it.found&&(k==='staff'||k==='wand'||k==='maul'||k==='tome'));}
function crystalPieces(){const out=[];for(const s of ['weapon','offhand']){const it=EQ[s];if(crystalSettable(it)&&!out.includes(it))out.push(it);}BAG.forEach(b=>{if(crystalSettable(b))out.push(b);});return out;}
// the named action: one crystal of its school set into the piece at a forge. Returns {done, why}
function forgeSetCrystal(it){if(!forgeHere())return {done:false,why:'You need a forge.'};if(!crystalSettable(it))return {done:false,why:it&&it.found?'It is found already.':'That takes no crystal.'};
  if(skillLv('smithing')<CRYSTAL_SET.smithing)return {done:false,why:`A crystal asks Smithing ${CRYSTAL_SET.smithing} (you have ${skillLv('smithing')}).`};
  const n=bagCount(b=>b.gateCrystal===it.school);if(n<1)return {done:false,why:`You need a gate crystal of ${schoolName(it.school)}.`};
  const f=forgeFee();if(f)return {done:false,why:f};
  bagTake(b=>b.gateCrystal===it.school,1);it.found=true;it.crystalSet=1;if(typeof implementDesc==='function')it.desc=implementDesc(it);
  skillUse('smithing',15,'c'+(_forgeN++));if(typeof advanceClock==='function')advanceClock(CRYSTAL_SET.min);return {done:true};}
function slayMaster(portal){if(!portal||!portal.lair)return;const M=worldState.masters||(worldState.masters={}),r=M[portal.seed];const was=r===true||!!(r&&r.dead);if(r&&typeof r==='object')r.dead=true;else M[portal.seed]=true;
  if(!was&&typeof cloakMasterSlain==='function')cloakMasterSlain(portal); /* S781 — the Wolf-Mother's Cloak off its master's corpse */
  if(!was&&typeof grantHead==='function')grantHead('skull');} /* S1734 — the first lair beast you kill gives the beast's skull, a figurehead (once) */
function lairFinish(portal){try{if(!portal||!portal.lair||!ENEMIES.length)return;const L=portal.lair;const M=worldState.masters||(worldState.masters={}),rec=M[portal.seed];
  if(rec===true||(rec&&rec.dead)){const h=rec&&rec.hoard;if(h&&h.items&&h.items.length){lairHoardChest(portal,h,!!L.dragon);showMsg('The master of this place is dead. Its hoard is where you left it.','#a89878');}else showMsg('The master of this place is dead. Its hoard is long gone.','#a89878');return;}
  // the deepest room: the enemy farthest from the entrance, on the lowest floor there is
  const ent={x:(typeof dEntranceX!=='undefined')?dEntranceX:0,z:(typeof dEntranceZ!=='undefined')?dEntranceZ:0};
  const pool=ENEMIES.filter(e=>!e.dead);const low=Math.max(...pool.map(e=>e.floor||1));const cand=pool.filter(e=>(e.floor||1)===low).sort((a,b)=>Math.hypot(b.x-ent.x,b.z-ent.z)-Math.hypot(a.x-ent.x,a.z-ent.z));
  const e=cand[0];if(!e)return;
  const dragon=!!L.dragon;const site=L.siteId&&typeof siteAnywhere==='function'?siteAnywhere(L.siteId):null;const bossName=site&&typeof lairBeast==='function'?lairBeast(site):L.boss; /* S699 — the beast of the lair where it stands now, as at the crag */e.name=dragon?`${L.place} Wyrm`:`${L.place} — ${bossName}`;e.boss=true;e.dragon=dragon;
  if(!dragon)lairMasterBody(e,bossName,portal); /* S706 — Michael's A on #225: the lair's own beast, not the deepest foe renamed */
  const LT=tierLevel(dungeonTier(portal,e.floor||1)); /* S1034 — the master grows with its cavern's tier's level, not yours (#373 A) */e.hp=e.maxHp=Math.round(e.maxHp*(dragon?6:3)*(1+LT*.08));{const k=(dragon?2.2:1.6)*(1+LT*.04);if(e.dmg)e.dmg=Math.round(e.dmg*k);e.dmgMult=(e.dmgMult||1)*k;}e.master=true;e.spd=(e.spd||1)*(dragon?.9:1.05); // v80 S130 — the master scales with level like the world's lair beast
  if(e.mesh){e.mesh.scale.multiplyScalar(dragon?2.6:1.5);e._detailed=false;}
  if(dragon)dragonBody(e,WOLF_KINDS.Dragon?WOLF_KINDS.Dragon.world:2.88);
  if(!dragon&&e._lairBody){e._detailed=true;masterUnderCeiling(e);delete e.posture;delete e.maxPosture;initPosture(e);} /* S706 — its posture from its own health, as the world's beast's */ // S219 — the world's dragon's size; S546 — read from the kind (4.5), held under the cavern's ceiling by dragonBody
  if(e.hpFg&&e.hpFg.parent&&e.hpFg.parent.material)e.hpFg.parent.material.color.setHex(dragon?0xff5020:0xffb040);
  // the hoard beside it
  if(rec&&rec.hoard){lairHoardChest(portal,rec.hoard,dragon);showMsg(dragon?'The air is hot, and something very large is breathing in the dark.':'Something large is waiting further in.','#ffb060');window._lairBoss=e;return;}
  // S514 — the hoard is <seed>:<floor>:hoard, and its goods roll on its stream and the day, not Math.random (co-op rules)
  const hid=`${dKeyOf(portal,e.floor||1)}:hoard`,hr=seededRng('loot',hid+':'+lootDay());
  const items=[];const gv=Math.round((60+tierLevel(dungeonTier(portal,e.floor||1))*25)*(dragon?3:1.8)); /* S1073 — the floor's tier's level, not yours (#394) */items.push({name:'Gold Coins',ico:'●',type:'gold',value:gv,qty:1});
  /* S717 — the piece is named for its tier's metal (Michael's A on #232: it named Iron/Steel/Silver, a wyrm's Silver/Gold/Mithril, on a draw
     of its own); that draw is still taken, so every roll after it comes out as before */
  hr();const tier=dragon?5+Math.floor(hr()*2):3+Math.floor(hr()*2);const mt=(MATERIALS.find(q=>q.tier===tier)||MATERIALS[2]).name;
  items.push(hr()<.5?{name:`${mt} Sword`,ico:'⚔',type:'equip',slot:'weapon',atk:[8+tier*2,11+tier*2],weaponShape:'sword',wType:'slash',weight:2.5,tier,material:mt,buyPrice:60*tier,sellMult:.45}:{name:`${mt} Cuirass`,ico:'👕',type:'equip',slot:'chest',def:2+tier,weight:6,tier,material:mt,buyPrice:70*tier,sellMult:.45});
  {const it=items[1];if(it.slot==='weapon'){const m=MATERIALS.find(q=>q.tier===tier);if(m&&m.reqAttr){it.reqAttr=m.reqAttr;it.reqVal=m.reqVal;}}else Object.assign(it,armorReq(tier,armorTypeOf(it)));} /* S708 — the hoard's piece asks what its tier asks of any other (it was built bare: a Steel Sword with no requirement) */
  if(dragon)items.push({name:'Dragon Scale',ico:'🔥',type:'misc',buyPrice:400,sellMult:.6,weight:.8,dragonScale:true,qty:1+Math.floor(hr()*2)});
  items.push({name:'Greater Potion',ico:'🧪',type:'potion',heal:60,buyPrice:45,sellMult:.4,qty:2});
  {const fr=seededRng('found-master',portal.seed);if(typeof foundImplement==='function'&&fr()<IMPLEMENT.foundMaster){const f=withLootRng(fr,()=>foundImplement(tier,null));if(f)items.splice(items.length-1,0,f);}} /* S1885 — #1169 A: one master in four keeps a found staff, wand or tome, on the lair's seed */
  const hs=lairHoardSpot(e);const hoard={x:hs.x,z:hs.z,floor:e.floor||1,items};M[portal.seed]={dead:false,hoard};lairHoardChest(portal,hoard,dragon);
  showMsg(dragon?'The air is hot, and something very large is breathing in the dark.':'Something large is waiting further in.','#ffb060');
  window._lairBoss=e;}catch(err){console.warn('lairFinish',err);}}
// S706 — a lair cavern's master is the lair's own beast (Michael's A on DECISION #225): the foe standing deepest gives up its
// place and floor, and is built again as the beast the lair is named for, on the open world's body for that kind (a Marsh Hag,
// a Frost Troll, an Ash Wight, a Cave Bear or an Ogre: buildZoneEnemy's rig, moved into the cavern's group as the wyrm's is).
// Its numbers are the kind's own at the cavern's scale, as any foe of the cavern is scaled: health by the gate's difficulty
// and the cavern's tier (its floor's, S1058; once your level and ×1.5 below); a blow by the same, its dmgMult set so the cavern's roll (10–20 before armour, 15 on
// average) lands the kind's own blow. lairFinish then makes it the master (×3 health, ×1.6 a blow, 1.5× the size) as before.
function lairMasterBody(e,kind,portal){const D=typeof ZONE_FOE_DEF!=='undefined'&&ZONE_FOE_DEF[kind];return foeRebody(e,kind,D,kind,portal);}
// S1933 — the same for any gate foe built again as a beast: kind is its name, D its numbers, body the kind whose driver it runs on (a gate's
// corrupted animal: a Frost Wraith Bear on the Cave Bear's, its own plan worn by the kit; gateCorruptBody, below)
function foeRebody(e,kind,D,body,portal){if(!D||!e||!e.mesh)return false;
  const z=buildZoneEnemy(new THREE.Group(),[],0,0,body,null);const rig=z.limbs&&(z.limbs.person||z.limbs.wolf);if(!rig||!rig.root)return false;
  const g=e.mesh,L=e.limbs&&!Array.isArray(e.limbs)?e.limbs:{};const hpBg=L.hpBg||e.hpBg;
  g.children.slice().forEach(c=>{if(c===hpBg||c===e.hpFg||c.isLight)return;g.remove(c);});g.scale.set(1,1,1);g.rotation.set(0,g.rotation.y,0);
  if(rig.root.parent)rig.root.parent.remove(rig.root);g.add(rig.root);rig.e=e;
  e.limbs={torso:z.limbs.torso,hpBg};if(z.limbs.person){e.limbs.person=z.limbs.person;e.limbs.armR=z.limbs.armR;}if(z.limbs.wolf)e.limbs.wolf=z.limbs.wolf;
  const ds=portal.diffScale||DIFF_SCALE.normal,fm=1; /* S1058 — the floor's step is its tier's +1 alone, as for every foe below (the enemies-by-place sheet) */
  const tr=dungeonTier(portal,e.floor||1); /* S1034 — the cavern's tier (#373 A) */e.hp=e.maxHp=Math.max(1,Math.round(D.hp*ds.hp*fm*enemyHpScale(tr)));e.dmgMult=D.dmg/15*ds.dmg*fm*enemyDmgScale(tr);delete e.dmg;e.tier=tr;
  e.spd=D.spd*ds.spd*(fm>1?1.1:1);e.rankSpd=D.spd;e.size=D.scale||1;e.def=D.def||0;e.resist={...(D.resist||{})};
  e.baseType=kind;e.buildFn=D.shape==='brute'?'brute':'humanoid';e._origCol=D.col;e.variant=null;e.xpMult=1;
  e.isWraith=false;e.ranged=false;e.disguised=false;e.dormant=false;e.shieldUp=false;e.canFlee=false;e._burstNext=false;
  e.baseY=(e.floor===2&&typeof FLOOR2_Y!=='undefined')?FLOOR2_Y:0;g.position.y=e.baseY;
  const top=(z.limbs.person?1.3:1.25)*(D.scale||1);if(hpBg)hpBg.position.y=top;if(e.hpFg)e.hpFg.position.y=top;
  if(e.el){e.el.color.setHex(D.eyeCol||0xffb040);e.el.intensity=.7;}
  e._lairBody=kind;e._detailed=true;return true;}
// S1933 (Michael's B on #1201) — a failing gate's corrupted animal (GATE_CORRUPT, 42-zone-enemies.js): the roster's foe built again on its
// kin's driver, its numbers its own row at the floor's tier, wearing the kit's corrupted plan by its name. It keeps its name and place
function gateCorruptBody(e,portal){const C=e&&gateCorruptOf(e.baseType);if(!C)return false;const D=gateCorruptDef(C.kind);
  if(!foeRebody(e,C.kind,D,C.body,portal))return false;const rig=e.limbs&&e.limbs.wolf;if(rig){rig.hcKind=C.kind;delete rig.hcKey;}
  e.name=C.kind;e.corrupt=C.school;e.shape=D.shape;delete e.posture;delete e.maxPosture;initPosture(e);return true;}
// S2115 — Gaoth's wisp (GALE_WISP, 42-zone-enemies.js): spawned on the Skeleton's row, it is built again as the coast's Shore Wisp's light,
// keeping the numbers it was given; it takes the Shore Wisp's resists and armour, Gaoth's words at ×0.7, and its shove
function gaothWispBody(e){if(!e||!e.mesh||e.baseType!=='Gale Wisp'||typeof buildZoneEnemy!=='function')return false;
  const W=GALE_WISP,z=buildZoneEnemy(new THREE.Group(),[],0,0,W.from,null,{tier:1});if(!z||!z.mesh)return false;
  const g=e.mesh,L=e.limbs&&!Array.isArray(e.limbs)?e.limbs:{},hpBg=L.hpBg||e.hpBg;
  g.children.slice().forEach(c=>{if(c===hpBg||c===e.hpFg||c.isLight)return;g.remove(c);});g.scale.set(1,1,1);g.rotation.set(0,g.rotation.y,0);
  for(const c of z.mesh.children.slice()){if(c===z.hpBg||c===z.hpFg||c.isLight)continue;z.mesh.remove(c);g.add(c);}
  if(z.el&&z.el.parent)z.el.parent.remove(z.el);g._hover=true;
  const D=ZONE_FOE_DEF[W.from];e.limbs={hpBg,body:z.limbs&&z.limbs.body};e.def=D.def||0;e.resist=Object.assign({},D.resist,{gaoth:W.ward});
  e.shove=W.shove;e.size=D.scale;e.buildFn='wisp';e._origCol=D.col;e.isWraith=false;e.ranged=false;e.shieldUp=false;e.school='gaoth';
  if(hpBg)hpBg.position.y=1.3;if(e.hpFg)e.hpFg.position.y=1.3;if(e.el){e.el.color.setHex(W.light);e.el.intensity=.7;}
  delete e.posture;delete e.maxPosture;initPosture(e);return true;}
// the wisp's blow that lands shoves you its length straight away from it, slid along the walls in tenths so nothing is passed through
function foeShoveYou(e){const m=e&&e.shove;if(!m||typeof activeZoneId==='undefined'||activeZoneId!=='dungeon'||typeof dSlideP!=='function')return 0;
  const d=Math.hypot(px-e.x,pz-e.z);if(!(d>1e-3))return 0;const ux=(px-e.x)/d,uz=(pz-e.z)/d,x0=px,z0=pz;
  for(let i=0;i<10;i++){const [nx,nz]=dSlideP(px,pz,ux*m/10,uz*m/10);if(nx===px&&nz===pz)break;px=nx;pz=nz;}
  return Math.hypot(px-x0,pz-z0);}
// S2116 — the dusk eagle (Michael's C on #1424; OG-088, the kit's `duskeagle`, the Crag Hawk grown ×2.6): in a failing or catastrophic
// Gaoth gate, in the first wisp's slot. The Dire Wolf's numbers at the floor's tier, Gaoth's words at ×0.7. It circles 4 to 6 m up (under
// the vault, `dCeil`), round its home and, once it has seen you, round you; out of a blade's reach there (`aloft`, as S1711's birds). It
// stops and hangs for its 0.9 s tell, then dives at where you stood when the tell ended: step aside and it strikes air. At the dive's foot
// it is 1 m up for 0.7 s, and a blade or a parry reaches it (a parry staggers it and it hangs there while staggered); then it climbs back
// and circles 2.5 s before the next. An arrow or a word reaches it always. Its body (S2118) is the kit's duskeagle near and the bird's
// stand-in far (buildBird('Dusk Eagle'), 34-creatures.js), posed by its flight: it soars, stoops on the dive and strikes at its foot
const DUSK_EAGLE={from:'Dire Wolf',ward:.7,alt:[4,6],ring:4.5,turn:.8,fly:5,tell:.9,dive:12,low:1,linger:.7,climb:4,rest:2.5,reach:1.6,aloft:2,sight:16,len:1.43,col:0x3b3f4c,light:0xa8ecff};
function duskEagleBody(e,portal){if(!e||!e.mesh||e.baseType!=='Dusk Eagle')return false;const E=DUSK_EAGLE,D=ZONE_FOE_DEF[E.from];if(!D)return false;
  const g=e.mesh,L=e.limbs&&!Array.isArray(e.limbs)?e.limbs:{},hpBg=L.hpBg||e.hpBg;
  g.children.slice().forEach(c=>{if(c===hpBg||c===e.hpFg||c.isLight)return;g.remove(c);});g.scale.set(1,1,1);g.rotation.set(0,g.rotation.y,0);
  const bird=typeof buildBird==='function'?buildBird('Dusk Eagle','gate:'+(e.id!=null?e.id:'')):null; /* S2118 — the kit's duskeagle near, the stand-in far (34-creatures.js) */
  const body=bird?bird.mesh:new THREE.Mesh(new THREE.SphereGeometry(.3,8,6),new THREE.MeshLambertMaterial({color:E.col}));g.add(bird?bird.root:body);if(bird)bird.e=e;
  const ds=portal&&portal.diffScale||DIFF_SCALE.normal,tr=dungeonTier(portal,e.floor||1);
  e.hp=e.maxHp=Math.max(1,Math.round(D.hp*ds.hp*enemyHpScale(tr)));e.dmgMult=D.dmg/15*ds.dmg*enemyDmgScale(tr);e.tier=tr;e.spd=D.spd*ds.spd;e.rankSpd=D.spd;
  e.def=D.def||0;e.resist=Object.assign({},D.resist,{gaoth:E.ward});e.size=1;e.buildFn='bird';e._origCol=E.col;e.variant=null;e.xpMult=1;e.school='gaoth';
  e.isWraith=false;e.ranged=false;e.shieldUp=false;e.disguised=false;e.dormant=false;e.limbs=bird?{hpBg,body,bird}:{hpBg,body};
  const r=seededRng('eagle',e.id||'');e.flier={mode:'circle',a:r()*Math.PI*2,dir:r()<.5?-1:1,alt:E.alt[0]+r()*(E.alt[1]-E.alt[0]),y:E.alt[0],t:0,cd:E.rest,tx:0,tz:0};
  if(hpBg)hpBg.position.y=.6;if(e.hpFg)e.hpFg.position.y=.6;if(e.el){e.el.color.setHex(E.light);e.el.intensity=.5;}
  delete e.posture;delete e.maxPosture;initPosture(e);return true;}
// the height it flies at here: its own, under the vault by 0.8 m, never under 2.2 m
function eagleAlt(e){const F=e.flier;let c=6;try{if(typeof dCeil==='function')c=dCeil(e.x,e.z);}catch(err){}return Math.max(2.2,Math.min(F.alt,c-.8));}
function eagleTick(e,dt,T,dist){const F=e.flier,E=DUSK_EAGLE;if(!F)return false;
  const now=performance.now(),ease=(v,to,r)=>v+Math.max(-r*dt,Math.min(r*dt,to-v)),go=(tx,tz,sp)=>{const dx=tx-e.x,dz=tz-e.z,d=Math.hypot(dx,dz);if(d<1e-3)return true;
    const st=Math.min(d,sp*dt),[nx,nz]=dSlide(e.x,e.z,dx/d*st,dz/d*st),moved=Math.hypot(nx-e.x,nz-e.z);e.x=nx;e.z=nz;if(moved>1e-4)e.combatYaw=Math.atan2(dx,dz);return moved>st*.5;};
  if(!e.alert&&dist<E.sight)e.alert=true;if(e.alert&&dist>E.sight*1.6)e.alert=false;
  F.cd=Math.max(0,F.cd-dt);const alt=eagleAlt(e);
  if(typeof isStaggered==='function'&&isStaggered(e)){e._wind=0;} /* staggered, it hangs where it is */
  else if(F.mode==='circle'){const cx=e.alert?T.x:e.homeX,cz=e.alert?T.z:e.homeZ;F.a+=dt*E.turn*F.dir;go(cx+Math.sin(F.a)*E.ring,cz+Math.cos(F.a)*E.ring,E.fly);F.y=ease(F.y,alt,E.climb);
    if(e.alert&&F.cd<=0&&dist<E.ring+4&&Math.abs(F.y-alt)<.3){F.mode='tell';F.t=E.tell;e.telegraphT=E.tell;e.telegraphMax=E.tell;}}
  else if(F.mode==='tell'){F.t-=dt;e._wind=Math.min(1,1-F.t/E.tell);e.combatYaw=Math.atan2(T.x-e.x,T.z-e.z);
    if(F.t<=0){F.mode='dive';F.tx=T.x;F.tz=T.z;e._wind=0;e.telegraphT=0;}}
  else if(F.mode==='dive'){const d=Math.hypot(F.tx-e.x,F.tz-e.z),sp=E.dive,k=Math.min(1,sp*dt/Math.max(1e-3,Math.hypot(d,F.y-E.low)));
    const ok=go(F.tx,F.tz,sp*(d/Math.max(1e-3,Math.hypot(d,F.y-E.low))));F.y=F.y+(E.low-F.y)*k;
    if((d<.25&&F.y-E.low<.15)||!ok){F.y=Math.min(F.y,E.low);F.mode='low';F.t=E.linger;e.atkAnim=.35;const dd=Math.hypot(T.x-e.x,T.z-e.z)||1;e.atkDir={x:(T.x-e.x)/dd,z:(T.z-e.z)/dd};
      if(ok&&dd<=E.reach)executeStrike(e,foeBlow(e),now);else if(typeof sndSwing==='function')sndSwing();}}
  else if(F.mode==='low'){F.t-=dt;if(F.t<=0)F.mode='climb';}
  else if(F.mode==='climb'){F.y=ease(F.y,alt,E.climb);if(Math.abs(F.y-alt)<.05){F.mode='circle';F.cd=E.rest;}}
  e.aloft=F.y>E.aloft;
  e.mesh.position.set(e.x,e.baseY+F.y,e.z);e.mesh.rotation.set(F.mode==='dive'?.5:0,e.combatYaw,0,'YXZ');if(e.el)e.el.position.set(e.x,e.baseY+F.y,e.z);return true;}
// the master is 1.5× the beast: one that would stand through the cavern's ceiling is made the largest that clears it
function masterUnderCeiling(e){const g=e&&e.mesh;if(!g)return;const rig=e.limbs&&(e.limbs.person||e.limbs.wolf);const root=rig&&rig.root;if(!root)return;
  g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),h=b.max.y-b.min.y,room=FLOOR_HEIGHT-.15;if(h>room)g.scale.multiplyScalar(room/h);}
// S219 — a lair's wyrm on the dragon's own body (S177, the wolf's bones with a neck, a tail and wings): the master keeps
// the numbers it was given (the lair's beast or the cavern's deepest foe, scaled up), and only its body is swapped. What it
// wore goes (a person's rig drops out of tickPeople once its root has no parent; a box brute's parts are removed); the
// health bar planes and the lights stay. rs is the dragon's scale in the world's own units, whatever the group's scale.
function dragonBody(e,rs){if(!e||!e.mesh||!WOLF_KINDS.Dragon)return;const g=e.mesh,L=e.limbs&&!Array.isArray(e.limbs)?e.limbs:{};
  g.children.slice().forEach(c=>{if(c===L.hpBg||c===e.hpFg||c===e.hpBg||c.isLight)return;g.remove(c);});
  let w=buildWolf('Dragon',rs/(g.scale.x||1));g.add(w.root);
  // S546 — a cavern's ceiling is FLOOR_HEIGHT over its floor: a wyrm taller than that is built again at the largest that clears it
  {g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(w.root),h=b.max.y-b.min.y,room=FLOOR_HEIGHT-.15;
  if(h>room){g.remove(w.root);w=buildWolf('Dragon',rs*room/h/(g.scale.x||1));g.add(w.root);}}
  w.e=e;e._wyrmScale=w.root.scale.x*(g.scale.x||1);
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
    if(dd<10&&diff<.45){const dmg=_warded(Math.round(wyrmFireRaw()*(blocking?.5:1)),FIRE_SRC);PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;armourUse();updateHUD();showMsg(`Fire! ${dmg} damage.`,'#ff6040');if(PHP<=0)playerDead();}
    else showMsg('The fire misses you.','#c8e88a');},900);}
function tickBreath(dt){for(let i=_BREATH.length-1;i>=0;i--){const b=_BREATH[i];b.t+=dt;const a=b.pts.geometry.attributes.position.array;for(let k=0;k<b.vel.length;k++){a[k*3]+=b.vel[k][0]*dt;a[k*3+1]+=b.vel[k][1]*dt;a[k*3+2]+=b.vel[k][2]*dt;b.vel[k][1]+=dt*.8;}b.pts.geometry.attributes.position.needsUpdate=true;b.pts.material.opacity=Math.max(0,.9-b.t*.9);b.l.intensity=Math.max(0,2.5-b.t*3);if(b.t>1.1){b.sc.remove(b.pts);b.sc.remove(b.l);_BREATH.splice(i,1);}}}
function tickDragons(dt){const E=activeZoneId==='world'?(ZONES.world&&ZONES.world.enemies||[]):(typeof ENEMIES!=='undefined'?ENEMIES:[]);for(const e of E){if(e.dead||!e.dragon)continue;if(!e._dragonBuilt)detailDragon(e);
    // wings beat while alert
    if(e.mesh&&e.alert){const t=performance.now()*.004;e.mesh.children.forEach(c=>{if(c._wing)c.rotation.z=c._wing*(.35+Math.sin(t)*.35);});}
    if(!e.alert)continue;e._breathT=(e._breathT==null?3:e._breathT)-dt;if(e._breathT<=0)dragonBreath(e);}
  tickBreath(dt);}

// v80 — step back into a saved place once the world around its door exists
// S1335 (card F5, the build sheet's "Saves" and `gatesave`) — a save made inside a dungeon carries, in its `where`, what you
// killed, opened and unlocked there, by the ids the co-op rule gives them (<seed>:<floor>:<index> for a foe, the containers' and
// doors' own); a load rebuilds the dungeon from its seed and lays them so again. No worldState key: it lives in the save made inside,
// and leaving the dungeon forgets it, as before.
function dunGone(){const foes=[],open={},doors=[];
  for(const e of ENEMIES)if(e.dead&&e.id)foes.push(e.id);
  for(const b of CHESTS.concat(BARRELS))if(b.opened&&b.id)open[b.id]=(b.items||[]).slice();
  for(const d of DOORS)if(d.open&&d.id)doors.push(d.id);
  return {foes,open,doors};}
function dunApplyGone(G){if(!G)return;const F=new Set(G.foes||[]),O=G.open||{},D=new Set(G.doors||[]);
  for(const e of ENEMIES){if(!e.id||!F.has(e.id))continue;e.dead=true;e.hp=0;if(e.el)e.el.intensity=0;if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);}
  for(const b of CHESTS.concat(BARRELS)){if(!b.id||!O[b.id])continue;b.opened=true;b.items=O[b.id].slice();
    if(b.lid&&b.lid.rotation.x===0)b.lid.rotation.x=-Math.PI/3;if(b.openTop&&!b.topOpened){b.openTop();b.topOpened=true;}
    if(b.top&&!b.topOpened){b.top.position.y+=.12;b.topOpened=true;}}
  for(const d of DOORS){if(!d.id||!D.has(d.id))continue;d.open=true;if(d.mesh&&d.mesh.parent)d.mesh.parent.remove(d.mesh);const M=d.floor===2&&dMap2?dMap2:dMap;if(M&&M[d.r]&&M[d.r][d.c]===5)M[d.r][d.c]=1;}}
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
    const p=makePortalDef(e);const wp=WORLD.dungeonPos[W.seed]||(WORLD.doorSpot&&WORLD.doorSpot(e));if(wp){p.x=wp.x;p.z=wp.z;}p.zone='world';p.sigil=!!(e.sigil||e.kind==='fort_door');p.theme=p.theme||e.theme;if(e.lair)p.lair=e.lair; /* S1976 — what the world's door gives its portal (82-world-structures.js): without the lair a lair saved in was rebuilt as an old gate, its master gone (the critic, 7 Nov) */ /* S1479 — where the door stands even when its cell has not loaded: the old zone's x, z was the world's corner, and its tier */
    if(W.gone)p._gone=W.gone;goToDungeon(p);return;} /* S1283 — a load inside a dungeon puts you at its entrance (the F2b sheet, until F13): the place saved was in cells of an older build, and a dungeon's cell is its kind's now */
}catch(err){console.warn('reenter',err);}}
function playerDead(){
  if(typeof FALL!=='undefined')FALL.pend=null; /* S429 — a fall's blow still waiting does not follow you past death */
  if(typeof WORLD!=='undefined'&&WORLD.duelDown&&WORLD.duelDown())return; /* S373 — the ring holds you at 1 health */
  if(typeof WORLD!=='undefined')WORLD.noteDeath(); // v80 — the reader counts
  if(dead)return;dead=true;
  // v80 S9 — no respawn, no bag wipe, no autosave: a death screen that loads a save.
  const dunName=(activeZoneId==='dungeon'&&currentPortal)?currentPortal.name:(activeZoneId==='world'?'the open country':'the wild'); /* S673 — currentPortal outlives the dungeon (goToOW keeps it): name it only while you are in it */
  addLog('💀','Fell in '+dunName+'.');
  silenceSigilHum();castT=0;blocking=false;staggered=[];
  {const ip=document.getElementById('ipr');if(ip){ip.style.opacity='0';ip.style.display='none';}const ob=document.getElementById('ob');if(ob)ob.textContent='';} /* S677 — the loop stops at death, so the last prompt stood behind the screen */
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
  ov.querySelector('#died-sub').textContent=d?`Last save: ${d.kind==='auto'?'autosave':'slot '+(d.slot+1)} — ${d.place||(d.zone==='world'?'the open country':d.zone||'…')}, level ${d.level||'?'}`:'No save found.';
  ov.style.display='flex';
}
// Reload the active slot in place (used by the death screen).
function reloadActiveSlot(){
  const key=ssActiveKey();if(!key||!ssEntry(key))return false;
  ssLoad(key).then(d=>{if(!d)return;
  const ov=document.getElementById('died');if(ov)ov.style.display='none';
  G.focus(); /* S624 — the click left focus on the hidden button, and the game reads keys only on #g */
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
// S2403 — spells as keys, and secrets (Michael's B on #1678; docs/design/spells-as-keys-build.md, its session 1: the seals). A gate's
// secrets are laid on its own stream (seededRng('secret', seed)) after its braziers, webs and pools, so none of theirs moves. This
// session lays the seals only, one a gate and two in a massive gate (the gate's own school first, then one other by seed); the
// mechanisms of sessions 3 to 5 come after them on the same stream, so a seal's room and id never move. A seal takes a side room
// with one mouth and no web or pool, and only one whose closing leaves every open cell joined to the floor's start (the entry,
// or the stair hall's foot on floor two) still reachable: a side room is a leaf, so nothing on the way on is ever shut. A gate with
// no such room has fewer seals. Each is {id:'<seed>:<floor>:secret<n>', kind:'seal', school, floor, c, r (the mouth), dc, dr (from
// the mouth into the room), room} in gen.secrets. The keys (Caor on both braziers, Sioc, Cloch Ghéar, Oíche, Solas-Gheal,
// Séideán) are session 2's; openSecret(id) is the named action they will call. Opened is the world's (worldState.gateSecrets[seed]:
// {o:[n…], t:{n:items}}), on the S242 list and not the character's.
const SECRET_SEAL_N={tiny:1,small:1,medium:1,large:1,massive:2};
const SECRET_SEAL_SHUT={tine:1,cloch:1,scath:1}; /* the stone leaf, the fallen block, the dark wall: the room's mouth is rock until opened */
const SECRET_SCHOOLS=['tine','uisce','gaoth','cloch','scath','solas'];
function gateSecrets(gen,seed,size,school){
  gen.secrets=[];if(!gen||!gen.gate)return gen.secrets;
  const r=seededRng('secret',seed|0),S=gen.secrets,W=gen.W,H=gen.H;
  const mapOf=fl=>fl===2?gen.map2:gen.map,open=(M,c,y)=>y>=0&&c>=0&&y<H&&c<W&&M[y][c]>0; /* a chasm's air and its piers too: a gap is crossed by its stones */
  const starts=fl=>{if(fl===1)return [[gen.entC,gen.entR]];const out=[],CS=gen.cellSpace2,hid=gen.hall&&gen.hall.id;
    if(CS&&hid!=null)for(let y=0;y<H;y++)for(let c=0;c<W;c++)if(CS[y][c]===hid&&open(gen.map2,c,y))out.push([c,y]);return out;};
  const reach=(fl,shut)=>{const M=mapOf(fl),got=new Uint8Array(W*H),q=[];
    for(const [c,y] of starts(fl)){const k=y*W+c;if(open(M,c,y)&&!shut.has(k)&&!got[k]){got[k]=1;q.push(k);}}
    for(let i=0;i<q.length;i++){const c=q[i]%W,y=(q[i]-c)/W;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+a,ny=y+b,k=ny*W+nc;
      if(!open(M,nc,ny)||shut.has(k)||got[k])continue;got[k]=1;q.push(k);}}return got;};
  const base={1:reach(1,new Set())};if(gen.map2)base[2]=reach(2,new Set());
  const taken=new Set((gen.things||[]).filter(t=>t.room).map(t=>t.floor+':'+t.room.x+','+t.room.y));
  const cand=[];
  for(const rm of gen.side||[]){const fl=rm.floor||1,M=mapOf(fl);if(!M||!base[fl]||rm.w<2||rm.h<2||taken.has(fl+':'+rm.x+','+rm.y))continue;
    const mouths=[],inRoom=(x,y)=>x>=rm.x&&x<rm.x+rm.w&&y>=rm.y&&y<rm.y+rm.h;
    for(let y=rm.y-1;y<=rm.y+rm.h;y++)for(let x=rm.x-1;x<=rm.x+rm.w;x++){if(inRoom(x,y))continue;
      if(!((x>=rm.x&&x<rm.x+rm.w)||(y>=rm.y&&y<rm.y+rm.h)))continue;if(open(M,x,y))mouths.push([x,y]);}
    if(mouths.length!==1)continue;const [mx,my]=mouths[0];
    if(fl===1&&Math.abs(mx-gen.entC)+Math.abs(my-gen.entR)<3)continue;
    const shut=new Set([my*W+mx]);for(let y=rm.y;y<rm.y+rm.h;y++)for(let x=rm.x;x<rm.x+rm.w;x++)shut.add(y*W+x);
    const got=reach(fl,shut),B=base[fl];let cuts=false;for(let k=0;k<W*H&&!cuts;k++)if(B[k]&&!got[k]&&!shut.has(k))cuts=true;
    if(cuts)continue;
    const dc=mx<rm.x?1:mx>=rm.x+rm.w?-1:0,dr=dc?0:(my<rm.y?1:-1);
    cand.push({floor:fl,c:mx,r:my,dc,dr,room:{x:rm.x,y:rm.y,w:rm.w,h:rm.h},path:shut,bare:M[my][mx]===1});}
  const own=SECRET_SCHOOLS.includes(school)?school:'cloch',others=SECRET_SCHOOLS.filter(s=>s!==own);
  const want=[own];if((SECRET_SEAL_N[size]||1)>1)want.push(others[Math.floor(r()*others.length)]);
  for(const sc of want){const pick=Math.floor(r()*Math.max(1,cand.length));if(!cand.length)break;const q=cand.splice(pick,1)[0];
    S.push({id:(seed|0)+':'+q.floor+':secret'+S.length,n:S.length,kind:'seal',school:sc,floor:q.floor,c:q.c,r:q.r,dc:q.dc,dr:q.dr,room:q.room,
      cells:[...q.path]});}
  // S2409 — the mechanisms (the sheet's session 3 on): after the seals, on the same stream, up to the table's count by size (two in a
  // medium gate, three in a large, four in a massive). Each slot draws its kind from those that can stand here (the lift where the gate
  // has a chasm, the sluice where it has a flooded hall, the turning chamber and the plates once a gate), then a side room among the
  // seals' leftovers, on a floor with that space for the lift and the sluice. Every kind is drawn now, so no later session moves a
  // room or an id; only the kinds in SECRET_BUILT are laid (gateSecretsBuild), the rest hold their rooms until their session.
  const hasSp=(fl,ty)=>(gen.spaces||[]).some(sp=>sp&&(sp.floor||1)===fl&&sp.type===ty),anySp=ty=>hasSp(1,ty)||hasSp(2,ty),used={};
  for(let k=want.length;k<(SECRET_N[size]||1);k++){
    const cut=(size==='large'||size==='massive')&&k===(SECRET_N[size]||1)-1?gateShortcut(gen,mapOf,open,starts,S):null; /* S2470 — the shortcut back (#1774 B), in the last slot */
    if(cut){const M=mapOf(cut.floor);M[cut.w[1]][cut.w[0]]=1; /* the wall cell opened in the map, so the shell leaves its passage; the slabs close it */
      S.push({id:(seed|0)+':'+cut.floor+':secret'+S.length,n:S.length,kind:'slide',shortcut:true,school:null,floor:cut.floor,c:cut.a[0],r:cut.a[1],dc:cut.dc,dr:cut.dr,
        room:{x:cut.w[0],y:cut.w[1],w:1,h:1},cells:[cut.w[1]*W+cut.w[0]],save:cut.save});continue;}
    const kinds=SECRET_MECH.filter(m=>!(used[m]&&SECRET_ONCE[m])&&(m!=='lift'||anySp('chasm'))&&(m!=='sluice'||anySp('flooded')));
    const kind=kinds[Math.floor(r()*kinds.length)],fit=cand.filter(q=>kind==='lift'?hasSp(q.floor,'chasm'):kind==='sluice'?hasSp(q.floor,'flooded'):true);
    const pick=Math.floor(r()*Math.max(1,fit.length));if(!fit.length)continue;const q=fit[pick];cand.splice(cand.indexOf(q),1);used[kind]=1;
    S.push({id:(seed|0)+':'+q.floor+':secret'+S.length,n:S.length,kind,school:null,floor:q.floor,c:q.c,r:q.r,dc:q.dc,dr:q.dr,room:q.room,cells:[...q.path]});}
  // S2411 — the barricade (the sheet's wordless stories): one gate in four, on its own stream (seededRng('barricade', seed)), so no secret
  // moves. Planks across the bare mouth of a side room that holds no secret, web or pool, and whose closing cuts nothing off (the
  // seals' own test, above). Which of the quest writer's six scenes stands behind it is drawn now (scene, 0 to 5) and drawn by its session.
  gen.barricade=null;
  {const rb=seededRng('barricade',seed|0);if(rb()<SECRET_BAR_P){const bc=cand.filter(q=>q.bare),q=bc[Math.floor(rb()*bc.length)],scene=Math.floor(rb()*6);
    if(q)gen.barricade={id:(seed|0)+':'+q.floor+':barricade',n:'b',kind:'barricade',school:null,floor:q.floor,c:q.c,r:q.r,dc:q.dc,dr:q.dr,room:q.room,cells:[...q.path],scene};}}
  return S;}
// S2470 — the shortcut back (spells-as-keys' table B; Michael's B on #1774: a sliding wall through one wall). In a large or massive gate
// the last mechanism slot is the shortcut where one fits: a rock cell of the ring's floor with an open floor cell either side of it in
// line, each in a space and in no secret's room, one (a, the deep side) at least as far from the entry by the walk (floor two's through the stair hall) as the nearest cell of the ring's space, the other (b)
// at most half that. Of those, the one that saves the most walk (by a's depth less b's; then the first in the grid). Where none fits the
// slot is drawn as any mechanism. The cell is opened in the map; slabs flush with both walls shut it, and only the deep side's has the
// pale stone. A mechanism is its own find (#1757 B): no chest. {floor, a:[c,r], w:[c,r], b:[c,r], dc, dr (a to w), save (cells)} or null.
function gateShortcut(gen,mapOf,open,starts,S){const sp=gen.spaces&&gen.spaces[gen.ring];if(!sp)return null;const fl=sp.floor||1,M=mapOf(fl),W=gen.W,H=gen.H,CS=fl===2?gen.cellSpace2:gen.cellSpace;
  if(!M||!CS)return null;
  const walk=(Mf,from,d0)=>{const D=new Int32Array(W*H).fill(-1),q=[];for(const [c,y] of from){const k=y*W+c;if(open(Mf,c,y)&&D[k]<0){D[k]=d0;q.push(k);}}
    for(let i=0;i<q.length;i++){const c=q[i]%W,y=(q[i]-c)/W;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+a,ny=y+b,k=ny*W+nc;if(!open(Mf,nc,ny)||D[k]>=0)continue;D[k]=D[q[i]]+1;q.push(k);}}return D;};
  let d0=0;if(fl===2){const D1=walk(mapOf(1),starts(1),0),hid=gen.hall&&gen.hall.id;d0=1e9; /* floor two counted from the entry: the walk to the stair hall first */
    for(let y=0;y<H;y++)for(let c=0;c<W;c++)if(gen.cellSpace[y][c]===hid&&D1[y*W+c]>=0)d0=Math.min(d0,D1[y*W+c]);if(d0>=1e9)return null;}
  const D=walk(M,starts(fl),d0);
  let ring=1e9;for(let y=0;y<H;y++)for(let c=0;c<W;c++)if(CS[y][c]===sp.id&&D[y*W+c]>=0)ring=Math.min(ring,D[y*W+c]);if(ring>=1e9)return null;
  const taken=new Set();for(const t of S)if(t.floor===fl)for(const k of t.cells)taken.add(k);
  const floorAt=(c,y)=>y>=0&&c>=0&&y<H&&c<W&&M[y][c]===1&&CS[y][c]>=0&&!taken.has(y*W+c); /* in a space, not a side room */
  let best=null;
  for(let y=1;y<H-1;y++)for(let c=1;c<W-1;c++){if(M[y][c]!==0)continue;
    for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const ac=c-dc,ar=y-dr,bc=c+dc,br=y+dr;if(!floorAt(ac,ar)||!floorAt(bc,br))continue;
      const da=D[ar*W+ac],db=D[br*W+bc];if(da<0||db<0||da<ring||db>ring/2)continue;
      if(!best||da-db>best.save)best={floor:fl,a:[ac,ar],w:[c,y],b:[bc,br],dc,dr,save:da-db};}}
  return best;}
const SECRET_BAR_P=1/4,SECRET_BAR_BLOWS=3;
const SECRET_N={tiny:1,small:1,medium:2,large:3,massive:4};
const SECRET_MECH=['slide','stair','lift','sluice','turn','plates'],SECRET_ONCE={turn:1,plates:1};
const SECRET_BUILT={seal:1,slide:1,stair:1,sluice:1,lift:1,turn:1,plates:1}; /* every kind is laid since S2423 (the sheet's session 5) */
// the world's record of a gate's secrets: o, the opened ones' numbers; t, what is left in each one's chest (session 2)
function gateSecretRec(seed){const G=worldState.gateSecrets||(worldState.gateSecrets={});return G[seed]||(G[seed]={o:[],t:{}});}
function gateSecretOpen(seed,n){const G=worldState.gateSecrets,R=G&&G[seed];return !!(R&&R.o&&R.o.indexOf(n)>=0);}
let GATE_SECRETS=[];
// in metres, after the scaling pass: placeholder props (the look builder's session 6 dresses them) and, for a shut seal, the mouth's solid
// S2405 — session 2: each seal's key and its chest. The six keys (the sheet's table): Tine, two braziers 6 m apart at the stone leaf,
// both lit by Caor within SECRET_TINE_S of the play clock (one alone goes cold again at the end of it); Uisce, the black water frozen
// by Sioc touched, the chest on a ledge 1.5 m over it (a plain mantle), and a swimmer in the unfrozen water loses 5% of health a second;
// Cloch, Cloch Ghéar laid within 1.8 m of the fallen block (it lifts and lodges: open); Scáth, the dark wall shows a doorway while Oíche
// is worn and is walked through once to stay one; Solas, Solas-Gheal laid within 3 m of the crystal pillar for 3 s; Gaoth, the gallery
// 3.8 m up, open once you stand on it (Séideán's updraft and the mantle, or Second step and Catch). A wrong word near a seal says so,
// once. Each seal holds one chest a tier above its floor (dungeonTier + 1, at most 4: the open number's B, built until #1757 is
// answered), rolled on its own key (<id>:chest, no day: it never refills); opened, what is left in it is the world's record's t[n].
const SECRET_SEAL_COL={tine:0x6d6862,uisce:0x0b1418,gaoth:0x77736a,cloch:0x8a7a62,scath:0x2e2a33,solas:0xe8e2c8};
const SECRET_KEY={tine:'caor',uisce:'sioc',cloch:'cloch_ghear',scath:'suil_oiche',solas:'solas_gheal',gaoth:'sideen'};
const SECRET_TINE_S=20,SECRET_COLD=.05,SECRET_LEDGE=1.5,SECRET_GALLERY=3.8,SECRET_SOLAS_R=3,SECRET_SOLAS_S=3,SECRET_CLOCH_R=1.8,SECRET_WRONG_R=3,SECRET_TIER_UP=1;
const SECRET_SAY={tine:'The stone leaf grinds aside.',uisce:'The black water freezes over.',cloch:'The block lifts and lodges on the lintel.',
  scath:'The dark wall stays a doorway.',solas:'The script on the crystal lights, and a niche turns open.',gaoth:'You stand in the gallery.'};
let GATE_SECRETS_GEN=null,DPROP_Y=null; /* DPROP_Y: the feet a prop with a top is tested at (the ledge), set only for your own step */
function gateSecretsBuild(gen,portal){GATE_SECRETS=[];GATE_SECRETS_GEN=gen;STAIR_PRY=null;SLUICE_TURN=null;LIFT_HOLD=null;if(!gen||!gen.secrets||!(gen.secrets.length||gen.barricade)||!portal)return GATE_SECRETS;
  const Hc=DCELL/2,G0=worldState.gateSecrets&&worldState.gateSecrets[portal.seed];
  for(const t of gen.secrets){if(!SECRET_BUILT[t.kind])continue;const y=t.floor===2?FLOOR2_Y:0,cx=dAt(t.c),cz=dAt(t.r),R=t.room,opened=gateSecretOpen(portal.seed,t.n);
    const mat=new THREE.MeshLambertMaterial({color:SECRET_SEAL_COL[t.school]||0x777777}),grp=new THREE.Group();grp.name='gateSecret';
    const x0=dAt(R.x-.5),x1=dAt(R.x+R.w-.5),z0=dAt(R.y-.5),z1=dAt(R.y+R.h-.5),mx=(x0+x1)/2,mz=(z0+z1)/2;
    const dir=t.dc||t.dr,far=t.dc?(t.dc>0?x1:x0):(t.dr>0?z1:z0),at=(d,lat)=>t.dc?[far-t.dc*d,lat==null?mz:lat]:[lat==null?mx:lat,far-t.dr*d];
    const rec={id:t.id,n:t.n,seed:portal.seed,kind:t.kind,school:t.school,floor:t.floor,c:t.c,r:t.r,x:cx,y,z:cz,kx:cx,kz:cz,area:{x0,x1,z0,z1},
      opened,group:grp,mat,solid:null,shut:null,chest:null,said:false};
    let chestY=y,chestAt=at(1.0);
    if(t.kind==='slide')slideBuild(t,rec,grp,y,cx,cz,opened);
    else if(t.kind==='stair'){stairBuild(t,rec,grp,y,opened);chestY=y-STAIR_DROP;} /* S2416 — the chest in the cellar, against the far wall */
    else if(t.kind==='sluice')sluiceBuild(t,rec,grp,y,cx,cz,opened); /* S2417 */
    else if(t.kind==='lift')liftBuild(t,rec,grp,y,gen,opened); /* S2418 */
    else if(t.kind==='plates'){platesBuild(t,rec,grp,y,opened,portal);chestAt=rec.chestAt;} /* S2423 */
    else if(t.kind==='turn'){turnBuild(t,rec,grp,y,opened);chestAt=rec.chestAt;} /* S2423 */
    else if(SECRET_SEAL_SHUT[t.school]){const x=cx+t.dc*(Hc-.3),z=cz+t.dr*(Hc-.3),h=Math.min(FLOOR_HEIGHT,6);
      const m=new THREE.Mesh(new THREE.BoxGeometry(t.dc?.5:DCELL,h,t.dc?DCELL:.5),mat);m.position.set(x,y+h/2,z);grp.add(m);rec.shut=m;rec.kx=x;rec.kz=z;
      rec.solid=t.dc?{x0:x-.3,x1:x+.3,z0:z-Hc,z1:z+Hc,floor:t.floor,secret:t.id}:{x0:x-Hc,x1:x+Hc,z0:z-.3,z1:z+.3,floor:t.floor,secret:t.id};
      if(!opened)DUNGEON_PROPS.push(rec.solid);else m.visible=false;
      if(t.school==='tine'){const M=t.floor===2?gen.map2:gen.map,oc=t.c-t.dc,orr=t.r-t.dr,pc=t.dr?1:0,pr=t.dc?1:0,k=Hc-.55;rec.braziers=[];
        const ok=(c,r)=>!!(M&&M[r]&&M[r][c]>0&&M[r][c]!==8&&M[r][c]!==9);
        for(const s of [-1,1]){const c=oc+pc*s,r=orr+pr*s; /* the cells either side of the way to the mouth, against the wall; else that way's own corners */
          const bx=ok(c,r)?dAt(c)+t.dc*k:dAt(oc)+pc*s*k+t.dc*k,bz=ok(c,r)?dAt(r)+t.dr*k:dAt(orr)+pr*s*k+t.dr*k;
          const g2=gateBrazierProp();g2.position.set(bx,y,bz);dScene.add(g2);
          const b={id:t.id+':b'+(s<0?0:1),kind:'brazier',floor:t.floor,x:bx,y,z:bz,lit:false,group:g2,light:null,seal:t.id,litAt:null};
          DUNGEON_COLUMNS.push({x:bx,z:bz,r:.55,floor:t.floor,brazier:b.id});GATE_THINGS.push(b);rec.braziers.push(b);if(opened)gtBrazierShow(b,true);}}}
    else if(t.school==='uisce'){const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0-.2,z1-z0-.2).rotateX(-Math.PI/2),mat);m.position.set(mx,y+.04,mz);grp.add(m);rec.water=m;
      const W={id:t.id+':water',kind:'sealwater',floor:t.floor,x:mx,y,z:mz,area:{x0,x1,z0,z1},frozen:opened,seal:t.id,group:m};GATE_THINGS.push(W);rec.thing=W;
      if(opened)mat.color.setHex(0x8fa8b6);
      const d=1.2,top=y+SECRET_LEDGE,[lx,lz]=at(d/2),w=t.dc?z1-z0:x1-x0; /* the ledge along the far wall, 1.5 m over the water */
      const L=new THREE.Mesh(new THREE.BoxGeometry(t.dc?d:w,SECRET_LEDGE,t.dc?w:d),new THREE.MeshLambertMaterial({color:0x5d5a55}));L.position.set(lx,y+SECRET_LEDGE/2,lz);grp.add(L);
      const B=t.dc?{x0:lx-d/2,x1:lx+d/2,z0:z0,z1:z1}:{x0:x0,x1:x1,z0:lz-d/2,z1:lz+d/2};
      FOOTHOLDS.push(Object.assign({y:top,gate:'ledge',secret:t.id},B));DUNGEON_PROPS.push(Object.assign({floor:t.floor,top,secret:t.id},B));
      chestY=top;chestAt=at(.6);}
    else if(t.school==='solas'){const m=new THREE.Mesh(new THREE.BoxGeometry(.6,2.2,.6),mat);rec.kx=cx+t.dc*2.5;rec.kz=cz+t.dr*2.5;m.position.set(rec.kx,y+1.1,rec.kz);grp.add(m);rec.pillar=m;
      if(opened)mat.emissive=new THREE.Color(0x8a8460);chestAt=at(.6);}
    else if(t.school==='gaoth'){const d=1.2,w=t.dc?z1-z0:x1-x0,[gx,gz]=at(d/2),top=y+SECRET_GALLERY; /* the gallery along the far wall, 3.8 m up */
      const m=new THREE.Mesh(new THREE.BoxGeometry(t.dc?d:w,.3,t.dc?w:d),mat);m.position.set(gx,top-.15,gz);grp.add(m);rec.kx=gx;rec.kz=gz;
      rec.gallery=t.dc?{x0:gx-d/2,x1:gx+d/2,z0:z0,z1:z1,y:top}:{x0:x0,x1:x1,z0:gz-d/2,z1:gz+d/2,y:top};
      FOOTHOLDS.push(Object.assign({gate:'gallery',secret:t.id},rec.gallery));chestY=top;chestAt=at(.6);}
    dScene.add(grp);GATE_SECRETS.push(rec);
    if(t.kind!=='lift'&&!t.shortcut)try{rec.chest=secretChest(t,portal,rec,chestAt[0],chestAt[1],chestY,G0);}catch(e){console.warn('secretChest',e);}} /* S2418 — #1757's B: the lift is its own find, the second bridge */
  if(gen.barricade)try{barricadeBuild(gen.barricade,portal,G0);}catch(e){console.warn('barricadeBuild',e);}
  return GATE_SECRETS;}
// a seal's chest: what is left in it is the world's once opened (t[n]), else rolled on its own key a tier above the floor. Solas's
// stands in its niche and is in the gate's chests only once the niche turns open.
function secretChest(t,portal,rec,x,z,yy,G0){const was=G0&&G0.t&&Array.isArray(G0.t[t.n]),key=t.id+':chest';
  const up=t.kind==='seal'||t.kind==='plates'?SECRET_TIER_UP:0; /* #1757's B: a seal's chest a tier above its floor, a mechanism's at the floor's own; S2423 — the plates' cache a rich chest a tier above */
  const items=was?G0.t[t.n]:rollContainerLoot(t.kind==='plates'?'treasure':'chest',portal.diffScale,portal.theme,undefined,key,Math.min(4,dungeonTier(portal,t.floor)+up));
  if(was)foundRestore(items);
  const group=new THREE.Group(),lid=buildChestShell(group,.75,0x6e5a40).lid;group.scale.setScalar(DCELL);group.position.set(x,yy,z);group.name='secretChest';
  group.rotation.y=t.dc?(t.dc<0?Math.PI/2:-Math.PI/2):(t.dr<0?0:Math.PI);dScene.add(group); /* its front to the room's mouth */
  const ch={id:key,x,z,y:yy-rec.y,standY:yy,opened:was,lid,floor:t.floor,mesh:group,items,displayName:'Chest',secret:t.id};
  if(was&&lid)lid.rotation.x=-Math.PI/3;
  if((t.school==='solas'||t.kind==='stair'||t.kind==='plates'||t.kind==='turn')&&!rec.opened)group.visible=false;else if(!(t.kind==='sluice'&&!rec.opened))CHESTS.push(ch); /* S2416 — the cellar's, too; S2417 — the sluice's is seen behind its grate, and taken once it is open */
  return ch;}
// openSecret: the named action. A secret of the gate you stand in opens for good: its number is kept in the world's record, a shut
// mouth's rock goes, and its key's mark stays (the braziers lit, the water frozen, the script lit, the niche open).
function openSecret(id){const rec=GATE_SECRETS.find(s=>s.id===id);if(!rec||rec.opened)return false;rec.opened=true;
  const R=gateSecretRec(rec.seed);if(R.o.indexOf(rec.n)<0)R.o.push(rec.n);
  if(rec.solid){const i=DUNGEON_PROPS.indexOf(rec.solid);if(i>=0)DUNGEON_PROPS.splice(i,1);}if(rec.shut){if(rec.kind==='slide')rec.slideAt=playClockS;else rec.shut.visible=false;} /* S2409 — a sliding wall slides */
  for(const b of rec.braziers||[])if(!b.lit)gtBrazierShow(b,true);
  if(rec.thing){rec.thing.frozen=true;rec.mat.color.setHex(0x8fa8b6);}
  if(rec.pillar)rec.mat.emissive=new THREE.Color(0x8a8460);
  if(rec.kind==='stair')stairOpen(rec); /* S2416 */
  if(rec.kind==='sluice')sluiceOpen(rec); /* S2417 */
  if(rec.kind==='lift')liftOpen(rec); /* S2418 */
  if(rec.kind==='plates'&&rec.cache){rec.cache.visible=false;const i=DUNGEON_PROPS.indexOf(rec.cacheSolid);if(i>=0)DUNGEON_PROPS.splice(i,1);} /* S2423 */
  if(rec.keepCache)gateCacheShow(rec); /* S2469 — the keep's cache: its face gone, what it holds shown */
  if(rec.kind==='turn')turnOpen(rec); /* S2423 — its chest is shown once the drum has turned (turnTick) */
  else if(rec.chest&&CHESTS.indexOf(rec.chest)<0){rec.chest.mesh.visible=true;CHESTS.push(rec.chest);}
  return true;}
// takeSecret: the named action. A seal's chest opened: from now on its list is the world's record's, so what you take stays taken
function takeSecret(id){const rec=GATE_SECRETS.find(s=>s.id===id),ch=rec&&rec.chest;if(!ch||CHESTS.indexOf(ch)<0)return false;
  const R=gateSecretRec(rec.seed);if(Array.isArray(R.t[rec.n]))ch.items=R.t[rec.n];else R.t[rec.n]=ch.items;openLoot(ch);return true;}
function secretOpenSay(rec){if(openSecret(rec.id)){showMsg((rec.keepCache&&CACHE_SAY[rec.school])||SECRET_SAY[rec.school]||'Something opens.','#c8b880');return true;}return false;}
// a brazier of a seal's pair gone cold again
function gtBrazierCold(b){b.lit=false;b.litAt=null;const f=b.group.userData.fire;if(f)f.visible=false;
  if(b.light){if(b.light.parent)b.light.parent.remove(b.light);const i=TORCHES.findIndex(q=>q.l===b.light);if(i>=0)TORCHES.splice(i,1);b.light=null;}}
function inArea(A,x,z,pad){pad=pad||0;return x>A.x0-pad&&x<A.x1+pad&&z>A.z0-pad&&z<A.z1+pad;}
// the seals' tick, in a gate: the pair's 20 s, the cold water, the dark wall seen and walked through, the light on the pillar, the gallery
function gateSecretsTick(){if(!GATE_SECRETS.length||activeZoneId!=='dungeon'||!currentPortal){if(SLIDE_AIR.on)sndDraught(0);return;}
  let air=0;
  for(const rec of GATE_SECRETS){if(rec.seed!==currentPortal.seed)continue;const here=currentFloor===rec.floor;
    if(rec.kind==='slide'){air=Math.max(air,slideTick(rec,here));continue;}
    if(rec.kind==='stair'){if(STAIR_PRY&&STAIR_PRY.rec===rec)stairPryTick(rec,here);continue;}
    if(rec.kind==='sluice'){sluiceTick(rec,here);continue;}
    if(rec.kind==='lift'){liftTick(rec,here);continue;}
    if(rec.kind==='plates'){platesTick(rec,here);continue;} /* S2423 */
    if(rec.kind==='turn'){turnTick(rec,here);continue;} /* S2423 */
    if(rec.opened)continue;
    if(rec.school==='tine'){const B=rec.braziers||[];for(const b of B)if(b.lit&&b.litAt==null)b.litAt=playClockS;
      if(B.length===2&&B[0].lit&&B[1].lit&&Math.abs(B[0].litAt-B[1].litAt)<=SECRET_TINE_S){secretOpenSay(rec);continue;}
      for(const b of B)if(b.lit&&playClockS-b.litAt>SECRET_TINE_S)gtBrazierCold(b);}
    else if(rec.school==='uisce'){
      if(here&&inArea(rec.area,px,pz,-.3)&&jumpY<rec.y+.5&&!dead){const t0=rec.coldT!=null?rec.coldT:playClockS,dt=Math.max(0,Math.min(1,playClockS-t0));rec.coldT=playClockS;
        rec.cold=(rec.cold||0)+dt*SECRET_COLD*maxHP;const dmg=Math.floor(rec.cold);
        if(dmg>0){rec.cold-=dmg;PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;updateHUD();if(!rec.chill){rec.chill=true;showMsg('The black water is bitter cold.','#a8c8e8');}if(PHP<=0)playerDead();}}
      else rec.coldT=null;}
    else if(rec.school==='scath'){const see=here&&typeof oicheWorn==='function'&&oicheWorn();
      if(see&&dCellOf(px)===rec.c&&dCellOf(pz)===rec.r){secretOpenSay(rec);continue;}
      if(see!==!!rec.seen){rec.seen=see;const i=rec.solid?DUNGEON_PROPS.indexOf(rec.solid):0; /* S2469 — the cache has no solid */
        if(see){if(i>=0&&rec.solid)DUNGEON_PROPS.splice(i,1);rec.mat.transparent=true;rec.mat.opacity=.3;}else{if(i<0)DUNGEON_PROPS.push(rec.solid);rec.mat.transparent=false;rec.mat.opacity=1;}
        rec.mat.needsUpdate=true;}}
    else if(rec.school==='solas'){const L=typeof laidLive==='function'?laidLive():null;
      if(here&&L&&L.light&&Math.hypot(L.x-rec.kx,L.z-rec.kz)<=SECRET_SOLAS_R+1e-6){if(rec.lit0==null)rec.lit0=playClockS;else if(playClockS-rec.lit0>=SECRET_SOLAS_S-1e-6)secretOpenSay(rec);}
      else rec.lit0=null;}
    else if(rec.school==='gaoth'){const g=rec.gallery;if(here&&g&&inArea(g,px,pz)&&jumpY>=g.y-.05)secretOpenSay(rec);}}
  if(air>0||SLIDE_AIR.on)sndDraught(air);}
// a word laid at x,z near a seal: Cloch Ghéar's pillar at the fallen block opens it; another word near a seal says once that the stone
// does not answer (Solas-Gheal at the pillar and Séideán at the gallery are their keys, and work in the tick and the jump). The id opened, or null.
function secretLaid(word,rider,x,z){{const st=stairLaid(word,x,z);if(st)return st;} /* S2416 — Cloch Ghéar on a hollow slab */
  const S=secretNear(x,z,SECRET_WRONG_R);if(!S)return null;
  if(S.school==='cloch'&&word==='cloch_ghear'&&Math.hypot(S.kx-x,S.kz-z)<=SECRET_CLOCH_R+1e-6){secretOpenSay(S);return S.id;}
  if(word===SECRET_KEY[S.school]||(S.school==='solas'&&rider==='solas_gheal'))return null;
  secretWrong(S);return null;}
// a touched word near a seal that is not its key: once
function secretTouched(word){const reach=FORMS.touched.reach+HULL_YOU+1,S=secretNear(px,pz,reach);if(!S||word===SECRET_KEY[S.school])return null;secretWrong(S);return S.id;}
function secretNear(x,z,r){if(activeZoneId!=='dungeon'||!currentPortal)return null;let best=null,bd=r;
  for(const s of GATE_SECRETS){if(s.opened||s.kind!=='seal'||s.floor!==currentFloor||s.seed!==currentPortal.seed)continue;const d=Math.hypot(s.kx-x,s.kz-z);if(d<=bd){bd=d;best=s;}}return best;}
function secretWrong(S){if(S.said)return;S.said=true;showMsg('The stone does not answer that word.','#c8b880');}
// S2409 — the sliding wall (the sheet's session 3; its table B). A side room's one mouth closed by a slab of the gate's own wall, flush
// with the wall it stands in, on the side you come from; one stone of it, at the height of a hand, 15% paler. Its tells: every flame
// within SLIDE_LEAN_R (4 m) of the wall leans toward it while it is shut (the torches' embers and the braziers' fires), dust drifts
// toward it, and within SLIDE_AIR_R (2 m) the air sounds in it (sndDraught, 72-audio.js). E on the pale stone (slideStoneNear, aimed
// at within reach) opens it through openSecret: the slab slides into the rock beside it over SLIDE_S of the play clock, and the room is
// open for good. It holds a chest at the floor's own tier (#1757's B, built until it is answered): a mechanism is its own find.
const SLIDE_LEAN_R=4,SLIDE_AIR_R=2,SLIDE_LEAN=.35,SLIDE_PALE=.15,SLIDE_S=1.2,SLIDE_DUST=14;
const SLIDE_AIR={on:false};
function slideBuild(t,rec,grp,y,cx,cz,opened){const Hc=DCELL/2,x=cx+t.dc*(Hc+.25),z=cz+t.dr*(Hc+.25),h=Math.min(FLOOR_HEIGHT,6); /* just past the mouth's edge, its face flush with the wall line */
  const sh=dScene.children.find(o=>o.userData&&o.userData.dunShell==='walls'),wm=sh&&sh.material&&!Array.isArray(sh.material)?sh.material:rec.mat;
  const look=slideShellLook(sh,x,y,z,h,t.dc?{n:'x',at:x-t.dc*.25}:{n:'z',at:z-t.dr*.25});
  const m=new THREE.Mesh(slideDress(new THREE.BoxGeometry(t.dc?.5:DCELL,h,t.dc?DCELL:.5),look,[x,y+h/2,z]),wm);m.position.set(x,y+h/2,z);grp.add(m);rec.shut=m;rec.mat=wm;rec.look=look;
  const pm=wm.clone();pm.color=wm.color.clone().multiplyScalar(1+SLIDE_PALE);rec.paleMat=pm; /* the pale stone: the wall's own stone (its texture too), 15% lighter */
  const sx=x-t.dc*.27,sz=z-t.dr*.27,st=new THREE.Mesh(slideDress(new THREE.BoxGeometry(t.dc?.06:.5,.36,t.dc?.5:.06),look,[sx,y+1.2,sz]),pm);st.position.set(sx-x,1.2-h/2,sz-z);m.add(st);
  rec.stone={x:sx,z:sz,y:y+1.2,mesh:st};rec.kx=x;rec.kz=z;rec.slideDir=t.dc?[0,1]:[1,0];rec.slideH=h;rec.base=[x,z];
  rec.solid=t.dc?{x0:x-.3,x1:x+.3,z0:z-Hc,z1:z+Hc,floor:t.floor,secret:t.id}:{x0:x-Hc,x1:x+Hc,z0:z-.3,z1:z+.3,floor:t.floor,secret:t.id};
  if(t.shortcut){const wx=cx+t.dc*DCELL,wz=cz+t.dr*DCELL,L=2*(Hc-.25),bx=x+t.dc*L,bz=z+t.dr*L; /* S2470 — the shortcut: the passage's whole cell solid while shut, and a plain slab flush with the far wall that slides with it */
    rec.solid={x0:wx-Hc,x1:wx+Hc,z0:wz-Hc,z1:wz+Hc,floor:t.floor,secret:t.id};rec.shortcut=true;rec.sdc=t.dc;rec.sdr=t.dr;
    const look2=slideShellLook(sh,bx,y,bz,h,t.dc?{n:'x',at:bx+t.dc*.25}:{n:'z',at:bz+t.dr*.25});
    const back=new THREE.Mesh(slideDress(new THREE.BoxGeometry(t.dc?.5:DCELL,h,t.dc?DCELL:.5),look2,[bx,y+h/2,bz]),wm);back.position.set(bx-x,0,bz-z);back.name='shortcutBack';m.add(back);rec.back=back;}
  if(!opened){DUNGEON_PROPS.push(rec.solid);
    const N=SLIDE_DUST,pos=new Float32Array(N*3),g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const dust=new THREE.Points(g2,new THREE.PointsMaterial({color:0xb8ad98,size:.035,transparent:true,opacity:.55,depthWrite:false}));dust.frustumCulled=false;
    rec.dust={pts:dust,seed:[],y}; for(let i=0;i<N;i++)rec.dust.seed.push([((i*7919)%97)/97,((i*104729)%89)/89,((i*1299709)%83)/83]);grp.add(dust);}
  else m.visible=false;}
// S2445 — the slab wears the wall's own look. The shell's material draws by vertex colour (its shade by height and corner), and a plain
// box has none, so the slab drew black (the critic's s1778, seed 922). slideShellLook reads the shell round the mouth: the mean
// colour of its vertices within SLIDE_LOOK_R of the slab's face, and the metres one turn of its texture spans (median of |dy|/|dv| over
// its edges); slideDress gives a box that colour and texture coordinates at that density, so its stone matches the brick either side.
const SLIDE_LOOK_R=2.5;
// S2458 — and the courses run on across it. The shell lays its texture by place (u along the wall, v up it, one turn a 1.6 m), so the
// slab, laid from its own corner, sat at its own phase against the brick either side: a seam at both edges. `pl` names the wall's plane
// (its normal's axis and where it stands); the shell's vertices on that plane, on faces that run along it, give the phase of u and of v
// (a circular mean, since the shell's warp moves a vertex and not its uv), and slideDress lays the slab's uv from its place plus that phase.
function slideShellLook(sh,x,y,z,h,pl){const out={k:[.8,.8,.8],tex:1.6,ph:[0,0],phN:0};const g=sh&&sh.geometry;if(!g||!g.attributes.position)return out;
  const P=g.attributes.position,C=g.attributes.color,U=g.attributes.uv,o=sh.position,q=sh.scale;let r=0,gg=0,b=0,n=0;const den=[],on=[];
  const W=i=>[P.getX(i)*q.x+o.x,P.getY(i)*q.y+o.y,P.getZ(i)*q.z+o.z]; /* dunScaleWhole stretches the shell by its scale, not its vertices */
  for(let i=0;i<P.count;i++){const [vx,vy,vz]=W(i);
    if(Math.abs(vx-x)>SLIDE_LOOK_R||Math.abs(vz-z)>SLIDE_LOOK_R||vy<y-.05||vy>y+h+.05)continue;
    if(C){r+=C.getX(i);gg+=C.getY(i);b+=C.getZ(i);n++;}
    if(U&&i+1<P.count&&den.length<400){const dv=Math.abs(U.getY(i+1)-U.getY(i)),dy=Math.abs(P.getY(i+1)-P.getY(i))*q.y;if(dv>1e-4&&dy>1e-3)den.push(dy/dv);}
    if(U&&pl&&i+1<P.count){const [wx,,wz]=W(i+1),nI=pl.n==='x'?vx:vz,nJ=pl.n==='x'?wx:wz,aI=pl.n==='x'?vz:vx,aJ=pl.n==='x'?wz:wx;
      if(Math.abs(nI-pl.at)<.35&&Math.abs(aJ-aI)>.1&&Math.abs(aJ-aI)>3*Math.abs(nJ-nI))on.push([i,aI,vy]);}}
  if(n)out.k=[r/n,gg/n,b/n];if(den.length){den.sort((a,c)=>a-c);out.tex=den[den.length>>1];}
  if(on.length){const T=2*Math.PI;let su=0,cu=0,sv=0,cv=0;
    for(const [i,a,vy] of on){const fu=U.getX(i)-a/out.tex,fv=U.getY(i)-vy/out.tex;su+=Math.sin(T*fu);cu+=Math.cos(T*fu);sv+=Math.sin(T*fv);cv+=Math.cos(T*fv);}
    const fr=w=>((w/T)%1+1)%1;out.ph=[fr(Math.atan2(su,cu)),fr(Math.atan2(sv,cv))];out.phN=on.length;}
  return out;}
// at: the box's place in the dungeon (the mesh's position, or the pale stone's), so its uv are the shell's at the same place
function slideDress(geo,look,at){const P=geo.attributes.position,U=geo.attributes.uv,N=geo.attributes.normal,co=new Float32Array(P.count*3),A=at||[0,0,0],ph=look.ph||[0,0];
  for(let i=0;i<P.count;i++){co[i*3]=look.k[0];co[i*3+1]=look.k[1];co[i*3+2]=look.k[2];
    const nx=Math.abs(N.getX(i)),ny=Math.abs(N.getY(i)),X=P.getX(i)+A[0],Y=P.getY(i)+A[1],Z=P.getZ(i)+A[2];
    const a=nx>.5?Z:X,c=ny>.5?Z:Y;U.setXY(i,a/look.tex+ph[0],c/look.tex+(ny>.5?0:ph[1]));}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(co,3));U.needsUpdate=true;return geo;}
// S2411 — the barricade's build: four planks nailed across the room's mouth, flush with its wall line, solid until broken; a thing of
// the gate's (GATE_THINGS, kind 'barricade') so Caor touched finds it as it finds a web; its chest, at the floor's own tier, against the
// far wall. A record in GATE_SECRETS like a secret's, its number 'b' in the world's record (o holds 'b' once broken, t.b what is left).
function barricadeBuild(t,portal,G0){const Hc=DCELL/2,y=t.floor===2?FLOOR2_Y:0,cx=dAt(t.c),cz=dAt(t.r),R=t.room,opened=gateSecretOpen(portal.seed,t.n);
  const x=cx+t.dc*(Hc+.12),z=cz+t.dr*(Hc+.12),grp=new THREE.Group();grp.name='gateBarricade';const mat=new THREE.MeshLambertMaterial({color:0x6b4f33});
  const planks=new THREE.Group();grp.add(planks);
  for(const [h,tilt] of [[.45,.06],[.95,-.09],[1.5,.04],[2.05,-.05]]){const p=new THREE.Mesh(new THREE.BoxGeometry(t.dc?.08:DCELL+.3,.22,t.dc?DCELL+.3:.08),mat);
    p.position.set(x,y+h,z);p.rotation.set(t.dc?tilt:0,0,t.dc?0:tilt);planks.add(p);}
  const x0=dAt(R.x-.5),x1=dAt(R.x+R.w-.5),z0=dAt(R.y-.5),z1=dAt(R.y+R.h-.5),mx=(x0+x1)/2,mz=(z0+z1)/2,far=t.dc?(t.dc>0?x1:x0):(t.dr>0?z1:z0);
  const rec={id:t.id,n:t.n,seed:portal.seed,kind:'barricade',school:null,floor:t.floor,c:t.c,r:t.r,x:cx,y,z:cz,kx:x,kz:z,opened,group:grp,mat,
    solid:t.dc?{x0:x-.2,x1:x+.2,z0:z-Hc,z1:z+Hc,floor:t.floor,secret:t.id}:{x0:x-Hc,x1:x+Hc,z0:z-.2,z1:z+.2,floor:t.floor,secret:t.id},shut:planks,chest:null,blows:0,scene:t.scene};
  const T={id:t.id+":planks",kind:"barricade",floor:t.floor,x,y,z,solid:rec.solid,burnt:opened,seal:t.id,group:grp};rec.planks=T; /* not rec.thing: openSecret reads that as the black water */
  if(!opened){DUNGEON_PROPS.push(rec.solid);GATE_THINGS.push(T);}else planks.visible=false;
  dScene.add(grp);GATE_SECRETS.push(rec);
  const at=t.dc?[far-t.dc*1.0,mz]:[mx,far-t.dr*1.0];rec.chest=secretChest(t,portal,rec,at[0],at[1],y,G0);return rec;}
// a blow of doBash: the barricade in front of you within the bash's reach of its planks takes it; the third breaks it
function barricadeBash(){if(activeZoneId!=='dungeon'||!currentPortal)return null;
  for(const r of GATE_SECRETS){if(r.kind!=='barricade'||r.opened||r.floor!==currentFloor||r.seed!==currentPortal.seed)continue;const S=r.solid;
    const qx=Math.max(S.x0,Math.min(S.x1,px)),qz=Math.max(S.z0,Math.min(S.z1,pz)),d=Math.hypot(px-qx,pz-qz);if(d>BASH_RANGE+HULL_YOU+1e-6)continue;
    const h=d||1;if(d>1e-3&&(-(qx-px)*Math.sin(yaw)-(qz-pz)*Math.cos(yaw))/h<.5)continue;
    r.blows++;if(r.blows>=SECRET_BAR_BLOWS)barricadeBreak(r,'bash');else showMsg('The planks crack.','#c8b880');return r;}
  return null;}
// barricadeBreak: the planks gone, by blows or by fire; open for good (openSecret keeps it in the world's record)
function barricadeBreak(r,how){if(!r||r.opened||!openSecret(r.id))return false;if(r.planks){r.planks.burnt=true;const i=GATE_THINGS.indexOf(r.planks);if(i>=0)GATE_THINGS.splice(i,1);}
  if(how!=='fire')showMsg('The barricade gives way.','#c8b880');return true;} /* fire's line is the touch's (TOUCH_THING_SAY) */
// the pale stone in reach and under the crosshair, its wall still shut
function slideStoneNear(){if(activeZoneId!=='dungeon'||!currentPortal)return null;
  for(const s of GATE_SECRETS){if(s.kind!=='slide'||s.opened||s.floor!==currentFloor||s.seed!==currentPortal.seed||!s.stone)continue;
    if(s.shortcut&&(px-s.stone.x)*s.sdc+(pz-s.stone.z)*s.sdr>0)continue; /* S2470 — the shortcut opens from the deep side only */
    if(Math.hypot(px-s.stone.x,pz-s.stone.z)<TOUCH+.6&&aimAt({mesh:s.stone.mesh},TOUCH+.6))return s;}return null;}
function slideStonePress(s){if(!s||!openSecret(s.id))return false;showMsg('The wall slides into the rock.','#c8b880');try{sfxNoise(SLIDE_S,0,0,.18,180);}catch(e){}return true;}
// the flames that lean: a torch's ember or a lit brazier's fire within 4 m of the wall, on its floor. Gathered once, when first near.
function slideFlames(rec){const out=[],y0=rec.y;
  for(const T of TORCHES){const f=T.fl;if(!f||!f.isMesh)continue;const p=f.position;if(Math.abs(p.y-y0)>FLOOR_HEIGHT||Math.hypot(p.x-rec.kx,p.z-rec.kz)>SLIDE_LEAN_R)continue;
    out.push({o:f,h:0,p0:p.clone(),s0:f.scale.clone()});}
  for(const b of GATE_THINGS){if(b.kind!=='brazier'||b.floor!==rec.floor||!b.group||!b.group.userData.fire)continue;if(Math.hypot(b.x-rec.kx,b.z-rec.kz)>SLIDE_LEAN_R)continue;
    const f=b.group.userData.fire;out.push({o:f,h:1.25,p0:f.position.clone(),s0:f.scale.clone(),b});}
  return out;}
// a flame's lean toward the wall (θ, with a little sway): tilted about the point h up its own origin, so the bowl stays put and the tips go over
function slideLean(F,rec,th){const o=F.o,wp=o.parent?o.parent.localToWorld(F.p0.clone()):F.p0,dx=rec.kx-wp.x,dz=rec.kz-wp.z,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d;
  o.rotation.set(uz*th,0,-ux*th);
  if(F.h>0){o.position.set(F.p0.x-ux*F.h*Math.sin(th),F.p0.y,F.p0.z-uz*F.h*Math.sin(th));}
  else{o.scale.set(F.s0.x*(th?.8:1),F.s0.y*(th?1.7:1),F.s0.z*(th?.8:1));o.position.set(F.p0.x+ux*.03*(th?1:0),F.p0.y,F.p0.z+uz*.03*(th?1:0));}
  F.th=th;}
// the sliding wall's tick: the slab sliding once opened; while shut, the flames' lean and the dust; the draught's level for the sound
function slideTick(rec,here){
  if(rec.opened){if(rec.slideAt!=null&&rec.shut.visible){const k=Math.min(1,(playClockS-rec.slideAt)/SLIDE_S),L=DCELL*k;
      rec.shut.position.x=rec.base[0]+rec.slideDir[0]*L;rec.shut.position.z=rec.base[1]+rec.slideDir[1]*L;rec.shut.position.y=rec.y+rec.slideH/2-.04*k;if(k>=1)rec.shut.visible=false;}
    if(rec.flames){for(const F of rec.flames)slideLean(F,rec,0);rec.flames=null;}
    if(rec.dust){rec.dust.pts.visible=false;}return 0;}
  if(!here)return 0;const dW=Math.hypot(px-rec.kx,pz-rec.kz);
  if(dW<SLIDE_LEAN_R+12){if(!rec.flames)rec.flames=slideFlames(rec);
    const sway=Math.sin(playClockS*2.3+rec.n)*.06;for(const F of rec.flames){if(F.b&&!F.b.lit)continue;slideLean(F,rec,SLIDE_LEAN+sway);}
    const D=rec.dust;if(D){const a=D.pts.geometry.attributes.position,tx=rec.slideDir[0],tz=rec.slideDir[1],ox=rec.kx,oz=rec.kz;
      const inx=rec.slideDir[1],inz=rec.slideDir[0]; /* the wall's normal: across the slide */
      const sgn=rec.stone?Math.sign((rec.stone.x-ox)*inx+(rec.stone.z-oz)*inz)||1:1;
      for(let i=0;i<D.seed.length;i++){const q=D.seed[i],ph=(playClockS*.25+q[0])%1,lat=(q[1]-.5)*DCELL*.9,out=(1-ph)*1.1*sgn,hy=.15+q[2]*1.9+ph*.15;
        a.setXYZ(i,ox+tx*lat+inx*out,D.y+hy,oz+tz*lat+inz*out);}a.needsUpdate=true;}}
  return dW<SLIDE_AIR_R?1-dW/SLIDE_AIR_R*.6:0;}
// S2416 — the stair under the floor (the sheet's session 3; its table B). Its side room stays a plain room; under it, 3 m down, a
// cellar of the room's own footprint holds the chest. The slab lies on one cell of the room (the middle of its width, short of halfway
// in from the mouth, so the stair's foot lands on the cellar's floor). Its tell: the footstep turns hollow on the slab and the eight
// cells round it that are the room's (tickFootsteps, 78; sndHollowStep, 72). Opened by Cloch Ghéar laid within 1.8 m of the slab
// (stairLaid, from layWord's secretLaid), or by 20 s of the pick (E with a pick in the bag; E again stops, and what is done is kept,
// on the play clock): the pick is loud, and every foe on the floor within 30 m comes. Opened, the slab is gone, the floor's cell is cut
// open (stairCut), and eleven steps of 0.25 m go down the cell to the cellar's floor. Under the floor the ground is the cellar's
// (stairBase, read by dPitBase, 56), and the mouth's edge is a wall to you there (a prop with `under`, dPropHit). The chest is the
// floor's own tier (#1757's B: a mechanism's find), hidden until the slab comes up. Placeholder props: the look builder's session 7.
const STAIR_DROP=3,STAIR_STEPS=12,STAIR_PICK_S=20,STAIR_LOUD=30,STAIR_CLOCH_R=1.8,STAIR_STRIKE=.7,STAIR_ALERT=2;
let STAIR_PRY=null;
function stairBuild(t,rec,grp,y,opened){const R=t.room,H=DCELL/2,D=t.dc?R.w:R.h,Wd=t.dc?R.h:R.w,i=Math.floor((D-1)/2),j=Math.floor((Wd-1)/2);
  const cellAt=(ii,jj)=>t.dc?[t.dc>0?R.x+ii:R.x+R.w-1-ii,R.y+jj]:[R.x+jj,t.dr>0?R.y+ii:R.y+R.h-1-ii];
  const [hc,hr]=cellAt(i,j),hx=dAt(hc),hz=dAt(hr),A=rec.area,lo=y-STAIR_DROP;
  rec.hole={c:hc,r:hr,x0:hx-H,x1:hx+H,z0:hz-H,z1:hz+H};rec.kx=hx;rec.kz=hz;rec.level=y;
  // the slab: a stone of the floor a shade off its neighbours, lying flush on the cell (shut)
  const slab=new THREE.Mesh(new THREE.BoxGeometry(DCELL*.82,.04,DCELL*.82),new THREE.MeshLambertMaterial({color:0x7d766b}));slab.position.set(hx,y+.02,hz);grp.add(slab);rec.shut=slab;
  if(opened)slab.visible=false;
  // the cellar: its floor, its roof (the room's floor seen from under, but for the hole), its four walls, all inward
  const sh=dScene.children.find(o=>o.userData&&o.userData.dunShell==='walls'),wm0=sh&&sh.material&&!Array.isArray(sh.material)?sh.material:null;
  const wm=wm0?wm0.clone():new THREE.MeshLambertMaterial({color:0x6a645c});wm.vertexColors=false;wm.side=THREE.DoubleSide;
  const fm=new THREE.MeshLambertMaterial({color:0x5e5850,side:THREE.DoubleSide});
  const quad=(w,h,m,uw,uh)=>{const g=new THREE.PlaneGeometry(w,h),u=g.attributes.uv;for(let k=0;k<u.count;k++)u.setXY(k,u.getX(k)*uw,u.getY(k)*uh);return new THREE.Mesh(g,m);};
  const W=A.x1-A.x0,Dz=A.z1-A.z0,mx=(A.x0+A.x1)/2,mz=(A.z0+A.z1)/2,cel=new THREE.Group();cel.name='stairCellar';grp.add(cel);
  {const f=quad(W,Dz,fm,1,1);f.rotation.x=-Math.PI/2;f.position.set(mx,lo,mz);cel.add(f);}
  for(let r=R.y;r<R.y+R.h;r++)for(let c=R.x;c<R.x+R.w;c++){if(c===hc&&r===hr)continue;const q=quad(DCELL,DCELL,fm,1,1);q.rotation.x=Math.PI/2;q.position.set(dAt(c),y-.02,dAt(r));cel.add(q);}
  for(const [x,z,w,ry] of [[mx,A.z0,W,0],[mx,A.z1,W,0],[A.x0,mz,Dz,Math.PI/2],[A.x1,mz,Dz,Math.PI/2]]){const q=quad(w,STAIR_DROP,wm,w/DCELL,STAIR_DROP/DCELL);q.rotation.y=ry;q.position.set(x,lo+STAIR_DROP/2,z);cel.add(q);}
  // the stair: eleven steps down the hole's cell, away from the mouth, each a block from the cellar's floor to its tread
  const sm=new THREE.MeshLambertMaterial({color:0x6f685e}),run=DCELL/STAIR_STEPS,ux=t.dc,uz=t.dr,n0=t.dc?hx-ux*H:hz-uz*H;rec.steps=[];
  for(let k=0;k<STAIR_STEPS-1;k++){const top=y-(k+1)*STAIR_DROP/STAIR_STEPS,a=n0+(t.dc?ux:uz)*k*run,b=a+(t.dc?ux:uz)*run,lo2=Math.min(a,b),hi2=Math.max(a,b);
    const h=top-lo,m=new THREE.Mesh(new THREE.BoxGeometry(t.dc?run:DCELL*.9,h,t.dc?DCELL*.9:run),sm);m.position.set(t.dc?(lo2+hi2)/2:hx,lo+h/2,t.dc?hz:(lo2+hi2)/2);cel.add(m);
    const B=t.dc?{x0:lo2,x1:hi2,z0:hz-H*.9,z1:hz+H*.9}:{x0:hx-H*.9,x1:hx+H*.9,z0:lo2,z1:hi2};rec.steps.push(Object.assign({y:top,gate:'stair',secret:t.id},B));}
  // the chest's place: against the far wall, on the cellar's floor
  const far=t.dc?(t.dc>0?A.x1:A.x0):(t.dr>0?A.z1:A.z0);rec.chestAt=t.dc?[far-t.dc*1.0,mz]:[mx,far-t.dr*1.0];
  // the mouth's edge, a wall to you under the floor only (dPropHit reads `under` against your feet)
  const ex=dAt(t.c)+t.dc*H,ez=dAt(t.r)+t.dr*H;
  rec.under=t.dc?{x0:ex-.15,x1:ex+.15,z0:ez-H,z1:ez+H,floor:t.floor,under:y-1,secret:t.id}:{x0:ex-H,x1:ex+H,z0:ez-.15,z1:ez+.15,floor:t.floor,under:y-1,secret:t.id};
  DUNGEON_PROPS.push(rec.under);
  if(opened){for(const f of rec.steps)FOOTHOLDS.push(f);stairCut(rec);}}
// the slab up: its steps are footholds, and the floor's cell is cut open (once the shell is in the scene)
function stairOpen(rec){if(STAIR_PRY&&STAIR_PRY.rec===rec)STAIR_PRY=null;if(rec.steps)for(const f of rec.steps)if(FOOTHOLDS.indexOf(f)<0)FOOTHOLDS.push(f);stairCut(rec);}
// the floor's triangles over the hole's cell, made empty: the shell is one mesh a floor, so its index loses them
function stairCut(rec){if(rec.cutDone||!rec.hole)return false;const h=rec.hole,v=new THREE.Vector3();let n=0;
  for(const o of dScene.children){if(!o.isMesh||!o.userData||o.userData.dunShell!=='floor'||!o.geometry||!o.geometry.index)continue;o.updateMatrixWorld(true);
    const P=o.geometry.attributes.position,I=o.geometry.index,a=I.array;let hit=false;
    for(let k=0;k<a.length;k+=3){if(a[k]===a[k+1]&&a[k]===a[k+2])continue;let sx=0,sy=0,sz=0;for(let q=0;q<3;q++){v.fromBufferAttribute(P,a[k+q]).applyMatrix4(o.matrixWorld);sx+=v.x;sy+=v.y;sz+=v.z;}
      sx/=3;sy/=3;sz/=3;if(Math.abs(sy-rec.level)>.3||sx<h.x0+.01||sx>h.x1-.01||sz<h.z0+.01||sz>h.z1-.01)continue;a[k+1]=a[k];a[k+2]=a[k];hit=true;n++;}
    if(hit)I.needsUpdate=true;}
  rec.cutDone=true;rec.cutN=n;return n>0;}
// S2425 — S2416's owed note: a foe walked across an opened stair's hole at the floor's height, its feet on nothing (foes have no floors
// under floors). The hole is a wall to a foe's step (dSlide, 56), as a chasm's air is, padded by a body's 0.3; a foe already standing over
// it when it opens is not held there: it walks off. You still go down it (dSlideP and stairBase).
const STAIR_FOE_PAD=.3;
function stairHoleAt(x,z){if(!GATE_SECRETS.length||activeZoneId!=='dungeon'||!currentPortal)return false;
  for(const s of GATE_SECRETS)if(s.kind==='stair'&&s.opened&&s.hole&&s.floor===currentFloor&&s.seed===currentPortal.seed&&inArea(s.hole,x,z,STAIR_FOE_PAD))return true;return false;}
function stairHoleBlocks(x,z,nx,nz){return stairHoleAt(nx,nz)&&!stairHoleAt(x,z);}
// the ground under you here (dPitBase, 56): the hole's cell opened, or anywhere in the cellar once you are under the floor
function stairBase(x,z,b){if(!GATE_SECRETS.length||activeZoneId!=='dungeon'||!currentPortal)return b;
  for(const s of GATE_SECRETS){if(s.kind!=='stair'||!s.opened||s.floor!==currentFloor||s.seed!==currentPortal.seed)continue;
    if(inArea(s.hole,x,z)||(inArea(s.area,x,z)&&jumpY<s.level-1))return Math.min(b,s.level-STAIR_DROP);}
  return b;}
// a shut slab under you: the hollow step (the slab's cell and the eight round it, the room's only)
function stairHollowHere(){if(!GATE_SECRETS.length||activeZoneId!=='dungeon'||!currentPortal)return false;const c=dCellOf(px),r=dCellOf(pz);
  for(const s of GATE_SECRETS){if(s.kind!=='stair'||s.opened||s.floor!==currentFloor||s.seed!==currentPortal.seed||!s.hole)continue;
    if(Math.abs(c-s.hole.c)<=1&&Math.abs(r-s.hole.r)<=1&&inArea(s.area,px,pz)&&Math.abs(jumpY-s.level)<.3)return true;}return false;}
// the shut slab in reach (for the pick)
function stairSlabNear(){if(!GATE_SECRETS.length||activeZoneId!=='dungeon'||!currentPortal)return null;
  for(const s of GATE_SECRETS){if(s.kind!=='stair'||s.opened||s.floor!==currentFloor||s.seed!==currentPortal.seed||!s.hole)continue;
    if(Math.hypot(px-s.kx,pz-s.kz)<TOUCH+.6&&Math.abs(jumpY-s.level)<.6)return s;}return null;}
// Cloch Ghéar laid on a shut slab lifts it: the id, or null
function stairLaid(word,x,z){if(word!=='cloch_ghear'||!GATE_SECRETS.length||activeZoneId!=='dungeon'||!currentPortal)return null;
  for(const s of GATE_SECRETS){if(s.kind!=='stair'||s.opened||s.floor!==currentFloor||s.seed!==currentPortal.seed||!s.hole)continue;
    if(Math.hypot(s.kx-x,s.kz-z)<=STAIR_CLOCH_R+1e-6&&openSecret(s.id)){showMsg('The pillar lifts the slab, and a stair goes down.','#c8b880');return s.id;}}
  return null;}
// E on the slab with a pick: set to it, or stop. Its progress (rec.pry, seconds of the play clock) is kept either way.
function stairPry(s){if(STAIR_PRY&&STAIR_PRY.rec===s){STAIR_PRY=null;showMsg('You stop working the slab.','#c8b890');return;}
  if(!hasPick()){showMsg('You need a pick.','#cc8844');return;}
  STAIR_PRY={rec:s,last:playClockS,strike:0,alert:0};s.pry=s.pry||0;showMsg('You set the pick under the slab.','#c8b890');stairLoud(s);}
// the pick is loud: every foe on this floor within 30 m comes
function stairLoud(s){let n=0;for(const e of ENEMIES||[]){if(!e||e.dead||(e.floor||1)!==s.floor)continue;if(Math.hypot(e.x-s.kx,e.z-s.kz)<=STAIR_LOUD){if(!e.alert)n++;e.alert=true;}}return n;}
function stairPryTick(rec,here){const P=STAIR_PRY,dt=Math.max(0,Math.min(1,playClockS-P.last));P.last=playClockS;
  if(rec.opened||!here||dead||!hasPick()||Math.hypot(px-rec.kx,pz-rec.kz)>TOUCH+1.2){STAIR_PRY=null;return;}
  rec.pry=(rec.pry||0)+dt;P.strike+=dt;P.alert+=dt;
  if(P.strike>=STAIR_STRIKE){P.strike-=STAIR_STRIKE;try{sfxNoise(.06,1,1,.2,1600);sfxTone(520,380,.08,.05,'triangle');}catch(e){}}
  if(P.alert>=STAIR_ALERT){P.alert-=STAIR_ALERT;stairLoud(rec);}
  if(rec.pry>=STAIR_PICK_S-1e-6&&openSecret(rec.id)){STAIR_PRY=null;showMsg('The slab comes up, and a stair goes down.','#c8b880');try{sfxNoise(.5,0,0,.2,200);}catch(e){}}}
// S2417 — the sluice (the sheet's session 4; its table B). A side room on a floor with a flooded hall stands at 0.8 m of black water
// behind an iron grate across its mouth, flush with the wall line; the chest is seen in it. Beside the grate, on your side, a wheel on a
// post. Held (E held down, within reach and aimed at it) for 8 s of the play clock, or Tonn laid within 2.5 m of the grate (layWord asks
// sluiceLaid first: Tonn has no laid shape of its own yet), the sluice opens: it is kept at once in the world's record (openSecret), the
// water drains over 10 s, and then the grate rises into the lintel in 1.5 s and the room is open. Letting go keeps what is turned (the
// co-op rule for a held wheel). Its chest is the floor's own tier (#1757's B: a mechanism's find). Placeholders: the look builder's session 7.
const SLUICE_DEPTH=.8,SLUICE_HOLD=8,SLUICE_DRAIN=10,SLUICE_RISE=1.5,SLUICE_TONN_R=2.5,SLUICE_SPIN=1.6;
let SLUICE_TURN=null;
function sluiceBuild(t,rec,grp,y,cx,cz,opened){const H=DCELL/2,h=Math.min(FLOOR_HEIGHT,6),gx=cx+t.dc*(H+.08),gz=cz+t.dr*(H+.08),A=rec.area;
  const iron=new THREE.MeshLambertMaterial({color:0x3a3633}),grate=new THREE.Group();grate.name='sluiceGrate';grate.position.set(gx,y,gz);grp.add(grate);
  const lx=t.dr?1:0,lz=t.dc?1:0; /* along the wall line */
  for(let k=0;k<9;k++){const o=(k/8-.5)*(DCELL-.12),b=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,h,6),iron);b.position.set(lx*o,h/2,lz*o);grate.add(b);}
  for(const hy of [.25,1.4,2.6]){const f=new THREE.Mesh(new THREE.BoxGeometry(lx?DCELL:.06,.08,lz?DCELL:.06),iron);f.position.set(0,hy,0);grate.add(f);}
  rec.grate=grate;rec.grateH=h;rec.kx=gx;rec.kz=gz;
  rec.grateSolid=t.dc?{x0:gx-.12,x1:gx+.12,z0:gz-H,z1:gz+H,floor:t.floor,secret:t.id}:{x0:gx-H,x1:gx+H,z0:gz-.12,z1:gz+.12,floor:t.floor,secret:t.id};
  // the water: one plane over the room's floor, 0.8 m up
  const wm=new THREE.MeshLambertMaterial({color:0x1d2a2e,transparent:true,opacity:.86,depthWrite:false}),water=new THREE.Mesh(new THREE.PlaneGeometry(A.x1-A.x0-.1,A.z1-A.z0-.1).rotateX(-Math.PI/2),wm);
  water.position.set((A.x0+A.x1)/2,y+SLUICE_DEPTH,(A.z0+A.z1)/2);grp.add(water);rec.water=water;
  // the wheel on its post, on your side of the grate and to one side of the mouth, its face to the corridor
  const wx=cx+t.dc*(H-.55)+lx*(H-.45),wz=cz+t.dr*(H-.55)+lz*(H-.45),post=new THREE.Mesh(new THREE.BoxGeometry(.14,1.05,.14),new THREE.MeshLambertMaterial({color:0x4a3a2a}));
  post.position.set(wx,y+.52,wz);grp.add(post);
  const wheel=new THREE.Group();wheel.position.set(wx-t.dc*.1,y+1.05,wz-t.dr*.1);wheel.rotation.y=t.dc?Math.PI/2:0;grp.add(wheel);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.32,.035,6,16),iron);wheel.add(rim);
  for(let k=0;k<4;k++){const sp=new THREE.Mesh(new THREE.BoxGeometry(.62,.035,.035),iron);sp.rotation.z=k*Math.PI/4;wheel.add(sp);}
  rec.wheel={x:wx,z:wz,y:y+1.05,mesh:wheel,turned:0};
  if(opened){water.visible=false;grate.visible=false;}else DUNGEON_PROPS.push(rec.grateSolid);}
// openSecret's part: the drain starts now (kept already); the tick lowers the water and then raises the grate
function sluiceOpen(rec){if(SLUICE_TURN&&SLUICE_TURN.rec===rec)SLUICE_TURN=null;rec.drainAt=playClockS;}
// the wheel in reach and under the crosshair, its sluice shut
function sluiceWheelNear(){if(!GATE_SECRETS.length||activeZoneId!=='dungeon'||!currentPortal)return null;
  for(const s of GATE_SECRETS){if(s.kind!=='sluice'||s.opened||s.floor!==currentFloor||s.seed!==currentPortal.seed||!s.wheel)continue;
    if(Math.hypot(px-s.wheel.x,pz-s.wheel.z)<TOUCH+.6&&aimAt({mesh:s.wheel.mesh},TOUCH+.6))return s;}return null;}
// E on the wheel: you take hold of it (the tick turns it while E is held)
function sluiceGrip(s){if(!s||s.opened)return false;if(!SLUICE_TURN||SLUICE_TURN.rec!==s)SLUICE_TURN={rec:s,last:playClockS};return true;}
// Tonn laid within 2.5 m of a shut grate opens its sluice: the id, or null
function sluiceLaid(word,x,z){if(word!=='tonn'||!GATE_SECRETS.length||activeZoneId!=='dungeon'||!currentPortal)return null;
  for(const s of GATE_SECRETS){if(s.kind!=='sluice'||s.opened||s.floor!==currentFloor||s.seed!==currentPortal.seed)continue;
    if(Math.hypot(s.kx-x,s.kz-z)<=SLUICE_TONN_R+1e-6&&openSecret(s.id)){showMsg('The wave strikes the sluice gate, and the water begins to run out.','#a8c8e8');return s.id;}}
  return null;}
function sluiceTick(rec,here){const W=rec.wheel;
  if(!rec.opened){const T=SLUICE_TURN;if(!T||T.rec!==rec)return;const dt=Math.max(0,Math.min(1,playClockS-T.last));T.last=playClockS;
    if(!here||dead||!K['KeyE']||Math.hypot(px-W.x,pz-W.z)>TOUCH+1.2){SLUICE_TURN=null;return;} /* let go: what is turned is kept */
    W.turned+=dt;W.mesh.rotation.z+=dt*SLUICE_SPIN;
    if(W.turned>=SLUICE_HOLD-1e-6&&openSecret(rec.id)){showMsg('The wheel turns home, and the water begins to run out.','#a8c8e8');try{sfxNoise(1.2,0,0,.12,320);}catch(e){}}
    return;}
  if(rec.drainAt==null)return;const k=(playClockS-rec.drainAt)/SLUICE_DRAIN;
  if(rec.water.visible){rec.water.position.y=rec.y+SLUICE_DEPTH*Math.max(0,1-k)+.02;if(k>=1)rec.water.visible=false;}
  if(k>=1&&rec.grate.visible){const i=DUNGEON_PROPS.indexOf(rec.grateSolid);if(i>=0){DUNGEON_PROPS.splice(i,1);showMsg('The grate rises.','#c8b880');}
    const q=Math.min(1,(playClockS-rec.drainAt-SLUICE_DRAIN)/SLUICE_RISE);rec.grate.position.y=rec.y+rec.grateH*q;if(q>=1)rec.grate.visible=false;}}
// S2418 — the counterweight lift (the sheet's session 4; its table B). Its side room is on a floor with a chasm. In the room, a chain
// hangs from the dark into an iron pan on the floor (the tell); by the far wall a lever, and beside it a vane on a spindle. Out in the
// chasm (the nearest on the floor), a second bridge hangs 8 m over the deck's line on four chains: a timber deck 2 m wide from landing to
// landing, one cell of air beside the bridge's line (where the floating stones hang when its spans are gone). The lever held for 6 s of
// the play clock (E held, as the sluice's wheel; let go and what is wound is kept), or Séideán sent into the vane (the bolt within 0.7 m
// of it spins it 1 s), opens it: kept at once in the world's record, the bridge comes down in 4 s and stays down, a foothold over the
// chasm's air at the deck's height. #1757's B: the lift is its own find, so it has no chest. Placeholders: the look builder's session 7.
const LIFT_HOLD_S=6,LIFT_DOWN_S=4,LIFT_HANG=8,LIFT_VANE_R=.7,LIFT_SPIN_S=1,LIFT_W=2;
let LIFT_HOLD=null;
function liftBuild(t,rec,grp,y,gen,opened){const A=rec.area,mx=(A.x0+A.x1)/2,mz=(A.z0+A.z1)/2,far=t.dc?(t.dc>0?A.x1:A.x0):(t.dr>0?A.z1:A.z0);
  const iron=new THREE.MeshLambertMaterial({color:0x3a3633}),wood=new THREE.MeshLambertMaterial({color:0x5a4330});
  let top=y+6;try{const c=dCeil(mx,mz);if(c>0)top=y+c;}catch(e){}
  // the tell: a chain from the dark into a pan on the floor, in the room's middle
  const pan=new THREE.Mesh(new THREE.CylinderGeometry(.55,.45,.18,14),iron);pan.position.set(mx,y+.09,mz);grp.add(pan);
  const chain=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,top-y,5),iron);chain.position.set(mx,(top+y)/2,mz);grp.add(chain);rec.chain=chain;
  // the lever by the far wall, and the vane beside it
  const lat=t.dc?[0,1]:[1,0],L=(t.dc?A.z1-A.z0:A.x1-A.x0)/2,at=(d,s)=>t.dc?[far-t.dc*d,mz+s]:[mx+s,far-t.dr*d];
  const [lx,lz]=at(.45,-Math.min(1,L-.5)),base=new THREE.Mesh(new THREE.BoxGeometry(.3,.5,.3),iron);base.position.set(lx,y+.25,lz);grp.add(base);
  const arm=new THREE.Group();arm.position.set(lx,y+.5,lz);grp.add(arm);const stick=new THREE.Mesh(new THREE.BoxGeometry(.06,.9,.06),wood);stick.position.y=.45;arm.add(stick);
  arm.rotation.set(t.dc?0:-t.dr*.5,0,t.dc?t.dc*.5:0);rec.lever={x:lx,z:lz,y:y+.95,mesh:arm,wound:0};
  const [vx,vz]=at(.45,Math.min(1,L-.5)),spindle=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.6,5),iron);spindle.position.set(vx,y+.8,vz);grp.add(spindle);
  const vane=new THREE.Group();vane.position.set(vx,y+1.6,vz);grp.add(vane);
  for(let k=0;k<4;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(.5,.03,.16),iron);b.position.x=.25;const h=new THREE.Group();h.rotation.y=k*Math.PI/2;h.add(b);vane.add(h);}
  rec.vane={x:vx,y:y+1.6,z:vz,mesh:vane};
  // the bridge, over the nearest chasm on this floor: the deck's line moved two cells across (v = mid + 2), landing to landing
  let best=null,bd=1e9;for(const sp of gen.spaces||[]){if(!sp||sp.type!=='chasm'||(sp.floor||1)!==t.floor)continue;const R=gateRect(sp),d=Math.hypot(dAt(R.x+R.w/2)-mx,dAt(R.y+R.h/2)-mz);if(d<bd){bd=d;best=sp;}}
  if(!best)return;const sp=best,v=sp.A/2+2,[c0,r0]=gateCellAt(sp,3,v),[c1,r1]=gateCellAt(sp,sp.L-4,v);
  const x0=Math.min(dAt(c0),dAt(c1))-DCELL/2,x1=Math.max(dAt(c0),dAt(c1))+DCELL/2,z0=Math.min(dAt(r0),dAt(r1))-DCELL/2,z1=Math.max(dAt(r0),dAt(r1))+DCELL/2;
  const ax=sp.axis==='x',bx0=ax?x0:(x0+x1)/2-LIFT_W/2,bx1=ax?x1:(x0+x1)/2+LIFT_W/2,bz0=ax?(z0+z1)/2-LIFT_W/2:z0,bz1=ax?(z0+z1)/2+LIFT_W/2:z1;
  const deck=new THREE.Group();deck.name='liftBridge';grp.add(deck);const dk=new THREE.Mesh(new THREE.BoxGeometry(bx1-bx0,.25,bz1-bz0),wood);dk.position.set((bx0+bx1)/2,-.125,(bz0+bz1)/2);deck.add(dk);
  let vault=y+20;try{const c=dCeil((bx0+bx1)/2,(bz0+bz1)/2);if(c>0)vault=y+c;}catch(e){}rec.vault=vault;rec.chains=[];
  for(const [qx,qz] of [[bx0+.15,bz0+.15],[bx1-.15,bz0+.15],[bx0+.15,bz1-.15],[bx1-.15,bz1-.15]]){const ch=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1,5),iron);ch.userData.at=[qx,qz];grp.add(ch);rec.chains.push(ch);}
  rec.bridge={deck,x0:bx0,x1:bx1,z0:bz0,z1:bz1,space:sp.id,hold:Object.assign({y,gate:'liftBridge',secret:t.id},{x0:bx0,x1:bx1,z0:bz0,z1:bz1})};
  liftPlace(rec,opened?0:LIFT_HANG);if(opened)FOOTHOLDS.push(rec.bridge.hold);}
// the bridge at h over the deck's height, and its chains from it to the vault
function liftPlace(rec,h){const B=rec.bridge;if(!B)return;B.deck.position.y=rec.y+h;B.h=h;
  for(const ch of rec.chains){const lo=rec.y+h,len=Math.max(.1,rec.vault-lo);ch.scale.y=len;ch.position.set(ch.userData.at[0],lo+len/2,ch.userData.at[1]);}}
function liftOpen(rec){if(LIFT_HOLD&&LIFT_HOLD.rec===rec)LIFT_HOLD=null;rec.downAt=playClockS;}
// the lever in reach and under the crosshair, its lift still up
function liftLeverNear(){if(!GATE_SECRETS.length||activeZoneId!=='dungeon'||!currentPortal)return null;
  for(const s of GATE_SECRETS){if(s.kind!=='lift'||s.opened||s.floor!==currentFloor||s.seed!==currentPortal.seed||!s.lever)continue;
    if(Math.hypot(px-s.lever.x,pz-s.lever.z)<TOUCH+.6&&aimAt({mesh:s.lever.mesh},TOUCH+.6))return s;}return null;}
function liftGrip(s){if(!s||s.opened)return false;if(!LIFT_HOLD||LIFT_HOLD.rec!==s)LIFT_HOLD={rec:s,last:playClockS};return true;}
// a Sent bolt in a gate (the loop's BALLS): Séideán's within 0.7 m of a vane spins it, and the lift is let go; true if it struck one
function liftVaneHit(fb){const sp=fb&&fb.userData&&fb.userData.spell;if(!sp||sp.id!=='sideen'||!GATE_SECRETS.length||activeZoneId!=='dungeon'||!currentPortal)return false;
  for(const s of GATE_SECRETS){if(s.kind!=='lift'||s.floor!==currentFloor||s.seed!==currentPortal.seed||!s.vane)continue;const V=s.vane,p=fb.position;
    if(Math.hypot(p.x-V.x,p.y-V.y,p.z-V.z)>LIFT_VANE_R)continue;
    if(!s.opened&&s.spinAt==null){s.spinAt=playClockS;showMsg('The vane spins, and somewhere a counterweight drops.','#c8d8e8');}return true;}
  return false;}
function liftTick(rec,here){
  if(rec.spinAt!=null&&!rec.opened){rec.vane.mesh.rotation.y+=.4;if(playClockS-rec.spinAt>=LIFT_SPIN_S-1e-6)openSecret(rec.id);return;}
  if(!rec.opened){const T=LIFT_HOLD;if(!T||T.rec!==rec)return;const dt=Math.max(0,Math.min(1,playClockS-T.last));T.last=playClockS;
    if(!here||dead||!K['KeyE']||Math.hypot(px-rec.lever.x,pz-rec.lever.z)>TOUCH+1.2){LIFT_HOLD=null;return;} /* let go: what is wound is kept */
    rec.lever.wound+=dt;const k=Math.min(1,rec.lever.wound/LIFT_HOLD_S),m=rec.lever.mesh;if(rec.lever.r0==null)rec.lever.r0=[m.rotation.x,m.rotation.z];m.rotation.x=rec.lever.r0[0]*(1-2*k);m.rotation.z=rec.lever.r0[1]*(1-2*k);
    if(rec.lever.wound>=LIFT_HOLD_S-1e-6&&openSecret(rec.id)){showMsg('The lever locks over, and somewhere a counterweight drops.','#c8b880');try{sfxNoise(1.5,0,0,.14,140);}catch(e){}}
    return;}
  if(rec.downAt==null||!rec.bridge||rec.bridge.h<=0)return;const k=Math.min(1,(playClockS-rec.downAt)/LIFT_DOWN_S);
  if(rec.vane&&k<1)rec.vane.mesh.rotation.y+=.2;
  liftPlace(rec,LIFT_HANG*(1-k*k));if(k>=1){if(FOOTHOLDS.indexOf(rec.bridge.hold)<0)FOOTHOLDS.push(rec.bridge.hold);try{sfxNoise(.6,0,0,.2,120);}catch(e){}}}
// S2423 — the plates in sequence and the script (the sheet's session 5; its tables B and "The script"). Four plates in a row across the
// room, 2.2 m short of its far wall, one already sunk; above them, on the far wall, a lintel cut in the script; against the wall behind
// them a sealed cache, a stone block round a rich chest a tier above the floor (#1757's B, built until it is answered). The order is the
// secret's own (seededRng('plates', id)), and the sunk plate is its first, so three plates are left: six orders. A plate is pressed by
// stepping onto it (pressPlate, the named action); when the three free plates are down, the right order opens the cache for good and a
// wrong one fires the plates' spikes for 12% of your health, the same in every gate, and the three rise again. The script on the lintel
// is read once for good (readScript, the named action; the world's record's r): for one banked reading, or for 1 Cold by an Old Blood
// reader who chooses it (Shift+E), or for nothing by one who holds all four words of the gate's school. Read, the lintel shows each
// plate's place in the order as cut marks over it. Placeholders: the look builder's session 7.
const PLATES_N=4,PLATES_HURT=.12,PLATE_HALF=.4,PLATES_IN=2.2,PLATES_LINTEL_Y=2.3,PLATES_SPIKE_S=.6;
function plateOrder(id,n){const r=seededRng('plates',id),o=[...Array(n).keys()];for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]];}return o;}
// the room's frame for a mechanism's layout: at(d, s) is d metres in from the far wall and s across, to the right of one walking in
function secretFrame(t,A){const far=t.dc?(t.dc>0?A.x1:A.x0):(t.dr>0?A.z1:A.z0),near=t.dc?(t.dc>0?A.x0:A.x1):(t.dr>0?A.z0:A.z1),mx=(A.x0+A.x1)/2,mz=(A.z0+A.z1)/2;
  const rx=-t.dr,rz=t.dc,Wd=t.dc?A.z1-A.z0:A.x1-A.x0,D=Math.abs(far-near);
  return {mx,mz,Wd,D,rx,rz,at:(d,s)=>t.dc?[far-t.dc*d,mz+rz*(s||0)]:[mx+rx*(s||0),far-t.dr*d]};}
function platesBuild(t,rec,grp,y,opened,portal){const F=secretFrame(t,rec.area),stone=new THREE.MeshLambertMaterial({color:0x6a665e});
  const sp=Math.min(1.2,(F.Wd-.8)/PLATES_N),sz=Math.min(PLATE_HALF*2,sp-.2),order=plateOrder(t.id,PLATES_N);
  rec.order=order;rec.pressed=[];rec.onPlate=-1;rec.plates=[];rec.plateSchool=gateOrbSchool(portal);
  for(let i=0;i<PLATES_N;i++){const [x,z]=F.at(PLATES_IN,(i-(PLATES_N-1)/2)*sp),m=new THREE.Mesh(new THREE.BoxGeometry(sz,.1,sz),stone);m.position.set(x,y+.05,z);grp.add(m);
    const spikes=new THREE.Group();for(let k=0;k<4;k++){const c=new THREE.Mesh(new THREE.ConeGeometry(.05,.45,5),new THREE.MeshLambertMaterial({color:0x8a8a8a}));c.position.set((k%2-.5)*sz*.5,.2,((k>>1)-.5)*sz*.5);spikes.add(c);}
    spikes.position.set(x,y,z);spikes.visible=false;grp.add(spikes);
    rec.plates.push({x,z,half:sz/2,mesh:m,spikes,sunk:i===order[0]||opened});}
  for(const p of rec.plates)p.mesh.position.y=y+(p.sunk?-.02:.05);
  // the lintel over them on the far wall, and the cut marks shown once the script is read
  const span=sp*PLATES_N+.4,[lx,lz]=F.at(.12,0),lin=new THREE.Mesh(new THREE.BoxGeometry(t.dc?.24:span,.5,t.dc?span:.24),new THREE.MeshLambertMaterial({color:0x4d4a44}));
  lin.position.set(lx,y+PLATES_LINTEL_Y,lz);grp.add(lin);rec.lintel={x:lx,z:lz,y:y+PLATES_LINTEL_Y,mesh:lin};rec.kx=lx;rec.kz=lz;
  const glyph=new THREE.MeshLambertMaterial({color:0xb8b0a0});
  for(let g=0;g<7;g++){const [gx,gz]=F.at(.24,(g-3)*span/8),q=new THREE.Mesh(new THREE.BoxGeometry(t.dc?.02:.1,.22,t.dc?.1:.02),glyph);q.position.set(gx,y+PLATES_LINTEL_Y+.02,gz);grp.add(q);}
  rec.marks=new THREE.Group();rec.marks.visible=false;grp.add(rec.marks);
  for(let i=0;i<PLATES_N;i++){const n=order.indexOf(i)+1;for(let k=0;k<n;k++){const [mx,mz]=F.at(.25,(i-(PLATES_N-1)/2)*sp+(k-(n-1)/2)*.07),q=new THREE.Mesh(new THREE.BoxGeometry(t.dc?.02:.03,.18,t.dc?.03:.02),glyph);
    q.position.set(mx,y+PLATES_LINTEL_Y-.38,mz);rec.marks.add(q);}}
  if(scriptRead(rec))rec.marks.visible=true;
  // the cache: a stone block round the chest against the far wall
  const [cx,cz]=F.at(.6,0),blk=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.1,1.1),stone);blk.position.set(cx,y+.55,cz);grp.add(blk);rec.cache=blk;
  rec.cacheSolid={x0:cx-.55,x1:cx+.55,z0:cz-.55,z1:cz+.55,floor:t.floor,secret:t.id};
  if(opened)blk.visible=false;else DUNGEON_PROPS.push(rec.cacheSolid);
  rec.chestAt=[cx,cz];}
function scriptRead(rec){const R=worldState.gateSecrets&&worldState.gateSecrets[rec.seed];return !!(R&&Array.isArray(R.r)&&R.r.indexOf(rec.n)>=0);}
// the ways the script is open to you now: know (all four words of the gate's school held), reading (one banked), cold (the Old Blood)
function scriptWays(rec){const S=rec.plateSchool,ws=WORDS.filter(w=>w.school===S);
  return {know:ws.length>0&&ws.every(w=>knownWords[w.id]>0),reading:readingsHeld()>=1,cold:typeof WORLD!=='undefined'&&WORLD.playerPeople()==='oldblood'};}
// the named action: the script read by one way ('know', 'reading' or 'cold'); 'read', or why not ('noop', 'none')
function readScript(id,way){const rec=GATE_SECRETS.find(s=>s.id===id);if(!rec||rec.kind!=='plates')return 'none';if(scriptRead(rec))return 'noop';
  const W=scriptWays(rec);if(!W[way])return 'none';
  if(way==='reading')registerOf().readings--;else if(way==='cold'){worldState.cold=(worldState.cold||0)+1;}
  const R=gateSecretRec(rec.seed);if(!Array.isArray(R.r))R.r=[];R.r.push(rec.n);rec.marks.visible=true;return 'read';}
// the lintel in reach and under the crosshair, its script unread and its plates not yet solved
function scriptLintelNear(){if(!GATE_SECRETS.length||activeZoneId!=='dungeon'||!currentPortal)return null;
  for(const s of GATE_SECRETS){if(s.kind!=='plates'||s.opened||scriptRead(s)||s.floor!==currentFloor||s.seed!==currentPortal.seed||!s.lintel)continue;
    if(Math.hypot(px-s.lintel.x,pz-s.lintel.z)<PLATES_IN+1.4&&aimAt({mesh:s.lintel.mesh},PLATES_IN+2.4))return s;}return null;}
function scriptPrompt(s){const W=scriptWays(s);if(W.know)return "Press 'E' to read the script";
  const a=[];if(W.reading)a.push("Press 'E' to read the script (a reading)");if(W.cold)a.push((W.reading?"Shift+E":"Press 'E'")+' to read it (you grow colder)');
  return a.length?a.join(' · '):'The script is closed to you';}
// E at the lintel: Shift chooses the Old Blood's way where both are open
function scriptE(s){const W=scriptWays(s),cold=W.cold&&(!W.reading||K['ShiftLeft']||K['ShiftRight']);
  const way=W.know?'know':cold?'cold':W.reading?'reading':null;if(!way){showMsg('The script is closed to you.','#c8b880');return null;}
  const r=readScript(s.id,way);if(r!=='read')return null;
  showMsg(way==='cold'?'The cuts come clear over the plates. Something at the edge of your attention turns to look. You are colder.':'The cuts come clear: the order is marked over the plates.',way==='cold'?'#a0a8c0':'#c8b880');return way;}
// the named action: plate n of a plates secret (or of a turning chamber's three) pressed. When every free plate is down the order is
// judged: right, the secret opens; wrong, the plates rise again (and a plates secret's spikes take 12% of your health). 'down',
// 'open', 'wrong' or 'noop'.
function pressPlate(id,n){const rec=GATE_SECRETS.find(s=>s.id===id);if(!rec||rec.opened)return 'noop';const P=rec.plates||rec.tplates,p=P&&P[n];if(!p||p.sunk)return 'noop';
  p.sunk=true;p.mesh.position.y=rec.y-.02;rec.pressed.push(n);try{sfxNoise(.15,0,0,.08,260);}catch(e){}
  if(P.some(q=>!q.sunk))return 'down';
  const want=rec.kind==='plates'?rec.order.slice(1):rec.torder;
  if(want.every((v,i)=>rec.pressed[i]===v)){if(rec.kind==='plates'){openSecret(id);showMsg('The last plate sinks home, and the cache\'s stone drops into the floor.','#c8b880');}
    else{openSecret(id);showMsg('The plates hold, and the floor begins to turn.','#c8b880');}return 'open';}
  rec.pressed=[];for(let i=0;i<P.length;i++){if(rec.kind==='plates'&&i===rec.order[0])continue;P[i].sunk=false;P[i].mesh.position.y=rec.y+.05;}
  if(rec.kind==='plates'){const hurt=Math.round(maxHP*PLATES_HURT);PHP=Math.max(0,PHP-hurt);lvAct.damageTaken+=hurt;rec.spikeAt=playClockS;for(const q of P)q.spikes.visible=true;
    updateHUD();showMsg('Spikes drive up through the plates.','#e08a6a');try{sfxNoise(.3,0,0,.2,900);}catch(e){}if(PHP<=0)playerDead();}
  else showMsg('The plates rise again.','#c8b880');
  return 'wrong';}
// the plate under your feet, stepped onto (not stood on: a plate that rises under you is pressed again only once you step off it)
function platesStep(rec,P,here){let on=-1;if(here&&!dead&&jumpY<rec.y+.35)for(let i=0;i<P.length;i++){const p=P[i];if(Math.abs(px-p.x)<p.half&&Math.abs(pz-p.z)<p.half){on=i;break;}}
  if(on!==rec.onPlate){rec.onPlate=on;if(on>=0&&!P[on].sunk)pressPlate(rec.id,on);}}
function platesTick(rec,here){if(rec.spikeAt!=null&&playClockS-rec.spikeAt>=PLATES_SPIKE_S){rec.spikeAt=null;for(const q of rec.plates)q.spikes.visible=false;}
  if(rec.opened){if(rec.cache.visible){rec.cache.visible=false;const i=DUNGEON_PROPS.indexOf(rec.cacheSolid);if(i>=0)DUNGEON_PROPS.splice(i,1);}return;}
  platesStep(rec,rec.plates,here);}
// S2423 — the rotating chamber (table B): a ring of floor stones in another course (the tell) under a stone drum in the room's middle,
// its one open quarter, the chest in it, turned to the side wall. Solas-Gheal laid within 3 m of the crystal pillar by the mouth for 3 s
// (the seal's own light rule), or three plates by the mouth stepped on in the order painted on the far wall (painted, not written: the
// fighter's tell; a wrong order lets them rise, nothing more), opens it: kept at once, the drum turns 90° in 4 s to face you, and then
// the chest in it can be opened, at the floor's own tier (#1757's B: a mechanism's find). Placeholders: the look builder's session 7.
const TURN_S=4,TURN_PLATES=3,TURN_H=1.5,TURN_COLS=[0xb08a3a,0x4f8a7a,0x9a3a2a];
function turnBuild(t,rec,grp,y,opened){const F=secretFrame(t,rec.area),half=Math.min(F.Wd,F.D)/2,r=Math.max(.8,Math.min(1.3,half-1.3)),h=TURN_H;
  const stone=new THREE.MeshLambertMaterial({color:0x6e6a62,side:THREE.DoubleSide});
  // the ring of floor stones laid in another course
  const ring=new THREE.Mesh(new THREE.RingGeometry(r+.05,r+.45,28,1).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:0x8a8070}));ring.position.set(F.mx,y+.015,F.mz);grp.add(ring);
  for(let k=0;k<14;k++){const a=k/14*Math.PI*2,j=new THREE.Mesh(new THREE.BoxGeometry(.03,.01,.4),new THREE.MeshLambertMaterial({color:0x3c3934}));j.position.set(F.mx+Math.sin(a)*(r+.25),y+.025,F.mz+Math.cos(a)*(r+.25));j.rotation.y=a;grp.add(j);}
  // the drum: three quarters of a cylinder, its open quarter at its local +z, the two cut faces closed
  const drum=new THREE.Group();drum.position.set(F.mx,y,F.mz);grp.add(drum);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24,1,false,Math.PI/4,Math.PI*1.5),stone);body.position.y=h/2;drum.add(body);
  const lidT=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.08,24),stone);lidT.position.y=h+.04;drum.add(lidT);
  for(const s of [-1,1]){const f=new THREE.Mesh(new THREE.BoxGeometry(.08,h,r),stone);f.position.set(Math.sin(s*Math.PI/4)*r/2,h/2,Math.cos(s*Math.PI/4)*r/2);f.rotation.y=s*Math.PI/4;drum.add(f);}
  const open=Math.atan2(-t.dc,-t.dr);rec.turnOpen=open;rec.drum=drum;rec.drumR=r;drum.rotation.y=opened?open:open-Math.PI/2;
  rec.col={x:F.mx,z:F.mz,r,floor:t.floor,secret:t.id};DUNGEON_COLUMNS.push(rec.col);
  rec.chestAt=[F.mx-t.dc*(r-.5),F.mz-t.dr*(r-.5)];
  // the crystal pillar by the mouth, to the left of one walking in
  const ps=-(F.Wd/2-.5),[kx,kz]=F.at(F.D-.6,ps),pm=new THREE.Mesh(new THREE.BoxGeometry(.5,2,.5),new THREE.MeshLambertMaterial({color:0xe8e2c8}));pm.position.set(kx,y+1,kz);grp.add(pm);
  rec.kx=kx;rec.kz=kz;rec.pillar=pm;if(opened)pm.material.emissive=new THREE.Color(0x8a8460);
  // three plates across the way in, coloured; the painting on the far wall gives their order, left to right
  const order=plateOrder(t.id+':turn',TURN_PLATES),din=Math.max(F.D/2+r+.55,F.D-1.4);rec.torder=order;rec.pressed=[];rec.onPlate=-1;rec.tplates=[];
  for(let i=0;i<TURN_PLATES;i++){const [x,z]=F.at(din,(i-1)*1.1),m=new THREE.Mesh(new THREE.BoxGeometry(.7,.1,.7),new THREE.MeshLambertMaterial({color:TURN_COLS[i]}));m.position.set(x,y+(opened?-.02:.05),z);grp.add(m);
    rec.tplates.push({x,z,half:.35,mesh:m,sunk:!!opened});}
  for(let k=0;k<TURN_PLATES;k++){const [x,z]=F.at(.05,(k-1)*.7),q=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),new THREE.MeshLambertMaterial({color:TURN_COLS[order[k]],side:THREE.DoubleSide}));
    q.position.set(x,y+2.2,z);q.rotation.y=t.dc?Math.PI/2:0;grp.add(q);}}
function turnTick(rec,here){
  if(rec.opened){if(rec.turnAt==null)return;const k=Math.min(1,(playClockS-rec.turnAt)/TURN_S);rec.drum.rotation.y=rec.turnOpen-Math.PI/2*(1-k);
    if(k>=1){rec.turnAt=null;if(rec.chest&&CHESTS.indexOf(rec.chest)<0){rec.chest.mesh.visible=true;CHESTS.push(rec.chest);}try{sfxNoise(.5,0,0,.15,110);}catch(e){}}
    return;}
  const L=typeof laidLive==='function'?laidLive():null; /* the seal's own light rule: Solas-Gheal laid within 3 m for 3 s */
  if(here&&L&&L.light&&Math.hypot(L.x-rec.kx,L.z-rec.kz)<=SECRET_SOLAS_R+1e-6){if(rec.lit0==null)rec.lit0=playClockS;else if(playClockS-rec.lit0>=SECRET_SOLAS_S-1e-6&&openSecret(rec.id)){showMsg('The light runs down the crystal into the floor, and the floor begins to turn.','#c8b880');return;}}
  else rec.lit0=null;
  platesStep(rec,rec.tplates,here);}
function turnOpen(rec){rec.turnAt=playClockS;if(rec.pillar)rec.pillar.material.emissive=new THREE.Color(0x8a8460);for(const p of rec.tplates||[]){p.sunk=true;p.mesh.position.y=rec.y-.02;}try{sfxNoise(TURN_S,0,0,.12,90);}catch(e){}}
