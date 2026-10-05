let thirdPerson=false,PLAYER_MODEL=null; // v80 S12 — V toggles third person
// ═══ THIRD PERSON (Session 126) ════════════════════════════════════
// V toggles. A jointed body at NPC scale (≈1.05u), dressed from EQ and
// rebuilt when the kit changes; posed each frame from the same state the
// first-person viewmodel reads (swingT + its variant, blocking, the bow
// draw, castT, sneaking, airborne, a hit, death); and a camera on a boom
// over the right shoulder that is pulled in by walls — dungeon cells,
// interior bounds and ceilings, the world's larger solids, the ground and
// the sea — and eases back out. The mouse wheel sets the boom length.
// Joint convention: the model faces +z, its right is −x. A negative x
// rotation swings a limb forward; knees bend with positive x.
// S244: the viewmodel's variants (0 the forehand diagonal, 1 the backhand diagonal, 2 the overhead chop) as the body's
// (0 the flat cut, 1 the overhead chop, 2 the rising diagonal)
const TP_SWING_OF=[0,2,1];
const TP={rig:null,sig:'',dist:1.9,want:1.9,cur:1.9,phase:0,lastHP:null,hurtT:0,deadT:0,swingSeen:0,swMax:0,swVar:0,swPow:false,hidVM:false,near:0};
try{const v=localStorage.getItem('og_tp');if(v==='1')thirdPerson=true;const d=parseFloat(localStorage.getItem('og_tp_d'));if(d>0)TP.want=d;}catch(e){}
// ── the look (Session 127): worldState.look = {skin,hair,style,beard,tunic,breeches,boots}
// Chosen in the creator; the rig, the first-person hands and the base garments read it.
const LOOK_TUNICS=[0x6a5a44,0x5a2a20,0x2a3a6a,0x3a4a2a,0x6a4a1a,0x2a2a2a,0x7a6a5a,0x4a2a4a];
const LOOK_BREECHES=[0x3a2a1a,0x4a4030,0x2a2a3a,0x5a3a2a,0x1a1a1a];
const LOOK_BOOTS=[0x2a1c10,0x4a3018,0x1a1a1a,0x5a4a3a];
// S560 — the six cloaks' cuts and colours (docs/design/capes-and-cloaks.md): the plain wool, the dark hood, oilskin, the Markish
// fur-lined, the Aurennais short cape to the waist with a gold hem, the pilgrim's grey with its hood
const TP_CLOAK={wool:{col:0x6a5a46,cut:'long'},hood:{col:0x24242a,cut:'long',hood:true},oilskin:{col:0x4e4a2e,cut:'long'},
  fur:{col:0x4a382a,cut:'long',fur:0x9a8a70},cape:{col:0x2a3a7a,cut:'short',trim:0xc8a040},pilgrim:{col:0x8a8880,cut:'long',hood:true}};
const LOOK_STYLES=[['short','Cropped'],['long','Long'],['tied','Tied back'],['bald','Shorn'],['braid','A braid'],['twin','Two braids'],['warrior','Warrior braids'],['mohawk','A crest'],['curly','Curly'],['afro','An afro'],['shaggy','Shaggy'],['bun','A bun'],['thin','Thinning']];
const LOOK_BEARDS=[['no','None'],['full','Full'],['short','Trimmed'],['long','Long'],['braided','Braided'],['forked','Forked'],['goatee','Goatee'],['vandyke','Goatee and moustache'],['walrus','Walrus'],['handlebar','Handlebar'],['pencil','Pencil'],['horseshoe','Horseshoe'],['mutton','Mutton chops'],['chinstrap','Chinstrap'],['stubble','Stubble']];
function lookDefault(pp,arch,name){let P=null;try{P=WORLD.PEOPLES[pp];}catch(e){}const h=[...(name||'you')].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
  return {skin:P&&P.skin?P.skin[h%P.skin.length]:0xd4a878,hair:P&&P.hair?P.hair[(h>>3)%P.hair.length]:0x3a2a1a,style:h%3===0?'long':'short',beard:false,tunic:arch==='mage'?0x2a3a6a:arch==='rogue'?0x2a2a2a:0x5a2a20,breeches:0x3a2a1a,boots:0x2a1c10};}
function lookNow(){return (typeof worldState!=='undefined'&&worldState.look)||null;}
function applyLook(){const L=lookNow();if(!L||L.skin==null)return;HAND_SKIN.palm=L.skin;const c=new THREE.Color(L.skin);c.multiplyScalar(.82);HAND_SKIN.cuff=c.getHex();}
function tpHex(s,def){if(typeof s==='number')return s;if(typeof s==='string'&&s[0]==='#')return parseInt(s.slice(1),16);return def;}
function tpMatColor(it,def){if(!it)return def;if(it.matCol!=null)return it.matCol;const name=(it.name||'').toLowerCase();for(const k in ICO_MAT){if((it.material||'').toLowerCase()===k||name.startsWith(k+' ')||name.includes(' '+k+' '))return tpHex(ICO_MAT[k],def);}
  if(/leather|hide|hood|cap\b|boots|breeches|gloves/.test(name))return 0x6a4a2e;if(/tunic|robe|cloth|shirt|trousers/.test(name))return 0x6a5a44;if(/iron|rusty/.test(name))return 0x8a8f98;if(/steel|plate|chain|mail/.test(name))return 0xb8bcc4;return def;}
function tpIsCloth(it){if(!it)return true;const n=(it.name||'').toLowerCase();return /tunic|robe|cloth|breeches|trousers|shirt|hood|cap\b|leather|hide|worn|tattered|boots|gloves/.test(n)&&!/cuirass|plate|mail|helm|greaves|gauntlet|sabaton/.test(n);}
function tpSig(){const L=lookNow();const k=(L?JSON.stringify(L):'')+['head','chest','hands','legs','feet','weapon','offhand','amulet','ammo','back'].map(s=>EQ[s]?(EQ[s].name||'?')+(EQ[s].col!=null?'~'+EQ[s].col:''):'-').join('|');let pp='gatelander';try{pp=WORLD.playerPeople();}catch(e){}return k+'#'+pp+'#'+(playerName||'')+'#'+playerArchetype;}
function tpBox(w,h,d,col,parent,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:col}));m.position.set(x||0,y||0,z||0);parent.add(m);return m;}
function tpGroup(parent,x,y,z){const g=new THREE.Group();g.position.set(x||0,y||0,z||0);g.rotation.order='YXZ';parent.add(g);return g;}
// ── weapons: built along +y from the grip (the hand's local "up" once the forearm is raised) ──
function tpWeapon(it){const g=new THREE.Group();if(!it)return g;
  const blade=tpHex(it.matCol,0xb8bcc4),guard=tpHex(it.matGuard,0x6a5030),grip=0x3a2616;const sh=it.weaponShape||(/bow/i.test(it.name)?'bow':/staff/i.test(it.name)?'staff':/axe/i.test(it.name)?'axe':/mace|hammer|club/i.test(it.name)?'mace':/dagger|knife/i.test(it.name)?'dagger':'sword');
  // S227 — the weapon kit (Michael's A on Session 220), tinted by the item's own metal, guard and glow; the bow's wood is its
  // material colour, and it turns to put the string on your side of the grip, as the box bow had it
  const kind={scimitar:'cutlass',flail:'flail',greatclub:'greatclub',greataxe:'greataxe',claymore:'claymore'}[sh]||(WPN_KINDS.includes(sh)?sh:'sword');
  const w=buildWeapon(kind,{tint:{metal:blade,guard,glow:tpHex(it.matGlow,0x88c0ff),wood:sh==='bow'?tpHex(it.matCol,0x6a4428):null}});g.add(w);
  if(kind==='bow'){w.rotation.y=Math.PI;g.userData.bow=true;}g.userData.kit=kind;
  return g;}
const TP_LINEN=0xa89c80;
function tpBuild(lookIn,ppIn){
  let pp=ppIn||'gatelander',P=null;try{if(!ppIn)pp=WORLD.playerPeople();P=WORLD.PEOPLES[pp];}catch(e){}
  const LK=Object.assign(lookDefault(pp,playerArchetype,playerName),lookIn||lookNow()||{});
  const archCol=playerArchetype==='mage'?0x2a3a6a:playerArchetype==='rogue'?0x3a3a2a:0x5a2a20;
  const ch=EQ.chest,lg=EQ.legs,ft=EQ.feet,hd=EQ.head,gl=EQ.hands;
  // your own clothes under whatever you buy: a cloth item with no material colour takes the look's
  const own=it=>it&&it.matCol==null&&tpIsCloth(it);
  const chestCol=!ch?LK.tunic:own(ch)?LK.tunic:tpMatColor(ch,archCol),chestCloth=tpIsCloth(ch);
  const legCol=!lg?LK.breeches:own(lg)?LK.breeches:tpMatColor(lg,0x3a2a1a),legCloth=tpIsCloth(lg);
  const bootCol=!ft?LK.boots:own(ft)?LK.boots:tpMatColor(ft,0x2a1c10);
  // the genome: the look's choices over the people's build, never re-rolled
  const styleMap={short:'crop',long:'straight',bald:'buzz'};
  // S384 — the worn armour kit: under a piece of it the tunic and breeches are your own cloth, and its helm replaces the bowl
  const AR=AR_FROM_EQ(EQ),clothCol=AR&&AR.chest?LK.tunic:chestCol,legsCol=AR&&AR.legs?LK.breeches:legCol;
  const g=personGenome({name:playerName||'you',role:'',people:pp,sCol:LK.skin,hairCol:LK.hair,bCol:chestCol},{key:'player'});
  Object.assign(g,{skin:new THREE.Color(LK.skin),hair:new THREE.Color(LK.hair),style:styleMap[LK.style]||LK.style||'crop',beard:LK.beard===true?'full':LK.beard||'none',
    cloth:new THREE.Color(clothCol),sleeve:new THREE.Color(clothCol).multiplyScalar(.9),legs:new THREE.Color(legsCol),boot:new THREE.Color(bootCol),
    dress:!!(ch&&/robe/i.test(ch.name||'')),cloak:false,apron:null,gear:null,extras:[],freckles:false,ruddy:false,age:'adult',child:false,height:1,build:1,
    hat:hd?(tpIsCloth(hd)?'hood':AR&&AR.head?'none':'helm'):'none',hoodCol:hd?tpMatColor(hd,0x8a8f98):null,helmCol:hd?tpMatColor(hd,0x8a8f98):null,
    eq:{armour:AR,chest:ch?{col:chestCol,cloth:chestCloth}:null,legs:lg?{col:legCol,cloth:legCloth}:null,hands:gl?{col:tpMatColor(gl,0x5a3a20)}:null,amulet:!!EQ.amulet,quiver:!!(EQ.ammo||(EQ.weapon&&EQ.weapon.weaponShape==='bow'))},
    bodyScale:[P&&P.width||1,P&&P.height||1,P&&P.width||1]});
  // S560 — the cloak in the back slot (Michael's B on #148; the slot and the six kinds are the systems builder's, EQ.back.cloak):
  // its cut and colour by kind (TP_CLOAK), a dyed one by its own colour (EQ.back.col, the dyer's)
  {const bk=EQ.back,K=bk&&bk.cloak?(TP_CLOAK[bk.cloak]||TP_CLOAK.wool):null;
    if(K)Object.assign(g,{cloak:true,cloakCol:bk.col!=null?bk.col:K.col,cloakCut:K.cut,cloakHood:!!K.hood,cloakFur:K.fur!=null?K.fur:null,cloakTrim:K.trim!=null?K.trim:null});}
  // S394 — an empty slot is the body's own underclothes (Michael's B on #83): an undyed linen shirt cut at the shoulder,
  // linen braies, bare feet; the look's colours dye the starting tunic, breeches and boots, which are items
  if(!ch){g.shirt=true;g.bareArms=true;g.dress=false;g.cloth=new THREE.Color(TP_LINEN);g.sleeve=g.skin.clone();}
  if(!lg)g.legs=new THREE.Color(TP_LINEN).multiplyScalar(.93);
  if(!ft){g.bareFeet=true;g.boot=g.skin.clone();}
  // S411 — Michael's D on #99: an empty hand is a folded fist; a torch, a tome, a shield's strap or a bow keeps the mitten
  const w=EQ.weapon,oh=EQ.offhand,bowW=!!(w&&w.weaponShape==='bow');g.fists={R:!w,L:!oh&&!bowW};
  const rig=buildPerson(g,{noLod:true});PEOPLE_RIGS.delete(rig); // tpPose drives this one, not tickPeople
  const B=rig.B;for(const k in B){if(B[k].isBone)B[k].rotation.order='YXZ';}
  rig.mesh.castShadow=false;rig.mesh.userData.tp=true;
  const root=rig.root;root.rotation.order='YXZ';
  const R={root,rig,hips:B.hips,hipsY0:PW.HIPS,thighL:B.thL,thighR:B.thR,kneeL:B.knL,kneeR:B.knR,ankleL:B.anL,ankleR:B.anR,torso:B.spine,head:B.head,shL:B.shL,shR:B.shR,elL:B.elL,elR:B.elR,handL:B.wrL,handR:B.wrR};
  // what the hands hold (the weapon kit itself is a later pass)
  R.twoH=!!(w&&w.twoHand&&w.weaponShape!=='bow');R.bow=bowW;R.unarmed=!w&&!oh;
  const grip=(hand,m)=>{m.position.set(0,-.04,.008);hand.add(m);return m;};
  if(w){const wm=tpWeapon(w);
    // S246: where the left hand goes on a two-handed grip: a hand's width from the right fist towards the pommel (the
    // shorter end of the weapon from the fist), in the weapon's own frame
    if(R.twoH){const bb=new THREE.Box3().setFromObject(wm),dn=Math.abs(bb.min.y)<Math.abs(bb.max.y)?-1:1,end=Math.abs(dn<0?bb.min.y:bb.max.y);R.gripL=new THREE.Vector3(0,dn*Math.max(.05,Math.min(.1,end*.7)),0);}
    const wb=w.enchant&&w.enchant.col!=null?new THREE.Box3().setFromObject(wm):null;
    if(R.bow){wm.rotation.set(0,0,0);R.weaponL=grip(R.handL,wm);}else{wm.rotation.set(Math.PI/2,0,0);R.weapon=grip(R.handR,wm);}
    if(wb&&!wb.isEmpty())tpMotes(R,wm,w.enchant.col,wb);}
  R.shield=null;R.torch=null;
  if(oh&&oh.shieldType==='shield'){const c=tpHex(oh.matCol,0x8a6030),rim=tpHex(oh.matGuard,0x4a3418);const big=/tower|kite/i.test(oh.name||''),round=/buckler|round/i.test(oh.name||'');const sg=new THREE.Group();
    // S227 — the kit's shields: planked and round with a rim and boss, the kite, or (S231) the tower shield; the face is
    // the item's material colour, the rim and boss its guard's
    const kk=round?'round':big&&!/kite/i.test(oh.name||'')?'tower':'kite';const k=buildWeapon(kk,{tint:{face:c,guard:rim,metal:rim}});if(round&&/buckler/i.test(oh.name||''))k.scale.setScalar(.8);sg.add(k);sg.userData.kit=kk; // S231 — a tower shield its own shape
    sg.position.set(.07,-.08,0);R.elL.add(sg);R.shield=sg;
    if(oh.enchant){const sb=new THREE.Box3().setFromObject(k);if(!sb.isEmpty())tpMotes(R,sg,oh.enchant.col!=null?oh.enchant.col:tpHex(oh.matGlow,TP_MOTE.armour),sb);}}
  else if(oh&&oh.torchType==='torch'){const tg=new THREE.Group();tpBox(.03,.3,.03,0x4a3018,tg,0,.1,0);const f=new THREE.Mesh(new THREE.ConeGeometry(.045,.12,5),new THREE.MeshBasicMaterial({color:0xff8830}));f.position.y=.3;tg.add(f);tg.rotation.x=Math.PI/2;R.torch=grip(R.handL,tg);}
  else if(oh){R.tome=tpBox(.12,.16,.05,tpMatColor(oh,0x5a3a5a),R.handL,0,-.06,.06);}
  // the worn pieces: a box about the bone each hangs on, in that bone's frame
  const BX=(x0,y0,z0,x1,y1,z1)=>new THREE.Box3(new THREE.Vector3(x0,y0,z0),new THREE.Vector3(x1,y1,z1));
  [[hd,B.head,BX(-.19,.04,-.19,.19,.32,.19)],[ch,B.spine,BX(-.24,-.02,-.2,.24,.36,.2)],[gl,B.elR,BX(-.07,-.2,-.07,.07,0,.07)],[gl,B.elL,BX(-.07,-.2,-.07,.07,0,.07)],
    [lg,B.knL,BX(-.085,-.3,-.085,.085,0,.085)],[lg,B.knR,BX(-.085,-.3,-.085,.085,0,.085)],[ft,B.anL,BX(-.07,-.06,-.07,.07,.04,.12)]].forEach(([it,b,bx])=>{
    if(it&&it.enchant&&b)tpMotes(R,b,it.enchant.col!=null?it.enchant.col:tpHex(it.matGlow,TP_MOTE.armour),bx,true);});
  root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.userData.tp=true;}});
  return R;}
// S539 — an enchanted piece shows it with "some very very light particle effect" (Michael, the inspector, with the Demonic kit's
// note): a few faint motes in the enchantment's colour (an armour enchantment has none: the material's glow, else a pale blue)
// drifting up through the piece and round again, additive, a few millimetres each. One Points object per enchanted piece, on the
// bone or in the hand that carries it; tpMotesTick moves them in tpPose. TP_MOTE is how many and how faint.
const TP_MOTE={n:7,size:.045,opacity:.55,rise:.07,armour:0xb8d0ff,map:null};
// a soft round glint, made once: white at the heart fading out, which the material's colour tints
function tpMoteMap(){if(TP_MOTE.map)return TP_MOTE.map;const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),gr=x.createRadialGradient(16,16,0,16,16,16);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,32,32);return TP_MOTE.map=new THREE.CanvasTexture(c);}
function tpMotes(R,parent,col,box,shell){const n=TP_MOTE.n,P=new Float32Array(n*3),seed=[],cx=(box.min.x+box.max.x)/2,cz=(box.min.z+box.max.z)/2,hx=(box.max.x-box.min.x)/2,hz=(box.max.z-box.min.z)/2;
  // in a held piece's bounds; round a worn piece, on the ring of its box (shell), so they drift just outside the plate
  for(let i=0;i<n;i++){const u=(i*.618+.13)%1,v=(i*.382+.71)%1,a=u*Math.PI*2;
    seed.push([shell?cx+hx*Math.sin(a):box.min.x+2*hx*u,shell?cz+hz*Math.cos(a):box.min.z+2*hz*v,(i/n),.6+((i*.53)%1)*.8]);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({color:col,size:TP_MOTE.size,map:tpMoteMap(),transparent:true,opacity:TP_MOTE.opacity,blending:THREE.AdditiveBlending,depthWrite:false}));
  pts.userData={box,seed,motes:true};pts.frustumCulled=false;parent.add(pts);(R.motes||(R.motes=[])).push(pts);tpMotesTick(R,0);return pts;}
function tpMotesTick(R,t){if(!R||!R.motes)return;for(const m of R.motes){const {box,seed}=m.userData,a=m.geometry.attributes.position,h=box.max.y-box.min.y||.1;
  for(let i=0;i<seed.length;i++){const [x,z,ph,sp]=seed[i],f=(ph+t*TP_MOTE.rise*sp/h)%1;a.setXYZ(i,x+.012*Math.sin(t*1.3+i*2.1),box.min.y+f*h,z+.012*Math.cos(t*1.1+i*1.7));}
  a.needsUpdate=true;}}
function tpDispose(R){if(!R)return;if(R.root.parent)R.root.parent.remove(R.root);R.root.traverse(o=>{if(o.isMesh||o.isPoints){o.geometry.dispose();if(o.material!==PEOPLE_MAT)o.material.dispose();}});}
const _tpL=(a,b,k)=>a+(b-a)*k;
function tpSet(g,x,y,z,k){g.rotation.x=_tpL(g.rotation.x,x,k);g.rotation.y=_tpL(g.rotation.y,y||0,k);g.rotation.z=_tpL(g.rotation.z,z||0,k);}
// ── camera collision ──
function tpInteriorBox(){const _intW={weapon:11,armor:11,potion:9,misc:10,inn:13,church:10,castle:18},_intD={weapon:10,armor:10,potion:9,misc:9,inn:11,church:16,castle:22},_ceil={weapon:2.4,armor:2.4,potion:2.2,misc:2.3,inn:2.5,church:3.8,castle:5.2};const t=currentHouse&&currentHouse.type||'misc';return {W:(currentHouse&&currentHouse._roomW)||_intW[t]||10,D:(currentHouse&&currentHouse._roomD)||_intD[t]||9,C:(currentHouse&&currentHouse._ceilH)||_ceil[t]||2.3};}
function tpBlocked(x,z){
  if(isInterior()){const b=tpInteriorBox();return x<.18||z<.18||x>b.W-.18||z>b.D-.18;}
  if(lid&&lid.startsWith('dyn_')){const r=.14;return dSolid(x-r,z-r)||dSolid(x+r,z-r)||dSolid(x-r,z+r)||dSolid(x+r,z+r);}
  if(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.camSolid)return WORLD.camSolid(x,z);
  return currentZoneSolid(x,z);}
function tpCeil(){if(isInterior())return tpInteriorBox().C-.22;if(lid&&lid.startsWith('dyn_'))return (currentFloor===2?FLOOR2_Y:0)+FLOOR_HEIGHT-.25;return 1e9;}
function tpFloorAt(x,z,fallback){if(isInterior())return .15;if(lid&&lid.startsWith('dyn_'))return fallback+.15;let y=fallback;try{y=activeTerrainH(x,z);}catch(e){}if(activeZoneId==='world'&&typeof WORLD!=='undefined')y=Math.max(y,WORLD.SEA_Y);return y+.22;}
function tpCamera(dt,camY){
  const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);const cp=Math.cos(pitch),sp=Math.sin(pitch);
  const inD=lid&&lid.startsWith('dyn_'),inI=isInterior();
  const maxD=inI?Math.min(TP.want,1.5):inD?Math.min(TP.want,1.7):TP.want;
  const pivY=camY+.12,side=.34;
  // shoulder first: slide right until blocked
  let sx=px,sz=pz,so=0;for(let s=.05;s<=side+1e-6;s+=.05){const tx=px+rx*s,tz=pz+rz*s;if(tpBlocked(tx,tz))break;so=s;sx=tx;sz=tz;}
  // then back along the view
  let d=0;const step=.08;const ceil=tpCeil();
  for(let t=step;t<=maxD+1e-6;t+=step){const tx=sx-fx*cp*t,tz=sz-fz*cp*t;if(tpBlocked(tx,tz))break;d=t;}
  d=Math.max(0,d-.12);
  // pulled in at once, eased out
  TP.cur=d<TP.cur?d:_tpL(TP.cur,d,Math.min(1,dt*4));
  let cx=sx-fx*cp*TP.cur,cz=sz-fz*cp*TP.cur,cy=pivY-sp*TP.cur;
  cy=Math.min(cy,ceil);cy=Math.max(cy,tpFloorAt(cx,cz,jumpY));
  CAM.position.set(cx,cy,cz);CAM.rotation.y=yaw;CAM.rotation.x=pitch;
  TP.near=Math.hypot(cx-px,cz-pz);TP.dist=Math.hypot(cx-px,cy-camY,cz-pz);
}
// ── the pose ──
// S269 — the player's swings in third person (Michael's A on Session 245, as shown): keyed to the first person's own phases
// (ANIM_PARAMS.swing: the wind-up to antEnd, the hit at impactPoint, the follow-through to sweepEnd), a wind-up that eases
// into a held coil with the weight on the back foot, a strike that accelerates into the hit with a step of the front foot
// and the torso unwinding, a carry past the hit, then back to guard; the first person's three swings, not the body's
// nearest; a power swing a quarter wider; the arm eased fast enough (dt*50) through the ~60 ms strike. false for the old swing.
const TP_SWING_NEW=true;
function tpPose(R,dt,st){
  const k=Math.min(1,dt*14),kf=Math.min(1,dt*22);
  const now=st.now/1000;
  if(R.motes)tpMotesTick(R,now); // S539
  // hurt / death
  if(TP.lastHP!=null&&PHP<TP.lastHP-.5)TP.hurtT=.28;TP.lastHP=PHP;TP.hurtT=Math.max(0,TP.hurtT-dt);
  if(dead){TP.deadT=Math.min(1,TP.deadT+dt*2.2);}else TP.deadT=Math.max(0,TP.deadT-dt*4);
  const sneak=_sneaking,air=!onGround&&Math.abs(velY)>.5;
  const spd=st.moving?(st.sprinting?13:sneak?6:9):0;TP.phase+=dt*spd;const ph=TP.phase;
  const amp=st.moving?(st.sprinting?.9:sneak?.45:.62):0;
  // legs
  let thL=Math.sin(ph)*-amp,thR=Math.sin(ph+Math.PI)*-amp,knL=Math.max(0,Math.sin(ph-1.2))*amp*1.4,knR=Math.max(0,Math.sin(ph+Math.PI-1.2))*amp*1.4;
  if(sneak){thL-=.55;thR-=.55;knL+=.9;knR+=.9;}
  if(air){thL=-.7;thR=-.25;knL=1.1;knR=.6;}
  if(blocking&&!st.moving){thL=-.25;knL=.3;thR=.2;knR=.25;}
  // the gait (S154): on the new rig, walking legs are placed by the planted-foot stride, driven by ground covered
  let anL=0,anR=0,hipsY=(R.hipsY0||.38)+(st.moving&&!air?Math.abs(Math.sin(ph))*(st.sprinting?.035:.02):Math.sin(now*1.6)*.004);
  let gait=false;
  let GP=null;
  if(R.rig&&st.moving&&!air&&!sneak){const rw=TP.rw||0,W=pwWalk(TP.gph||0,{holds:false}),U=rw>.001?pwRun(TP.gph||0,{holds:false}):W,m=(a,b)=>a+(b-a)*rw;
    GP={shL:m(W.shL[0],U.shL[0]),shR:m(W.shR[0],U.shR[0]),elL:m(W.elL[0],U.elL[0]),elR:m(W.elR[0],U.elR[0]),spine:m(W.spine[0],U.spine[0])};
    thL=m(W.thL[0],U.thL[0]);knL=m(W.knL[0],U.knL[0]);anL=m(W.anL[0],U.anL[0]);thR=m(W.thR[0],U.thR[0]);knR=m(W.knR[0],U.knR[0]);anR=m(W.anR[0],U.anR[0]);hipsY=m(W.hipsY,U.hipsY);gait=true;}
  const kl=gait?1:k; // the gait's legs land exactly; eased legs would slide the planted foot
  tpSet(R.thighL,thL,0,0,kl);tpSet(R.thighR,thR,0,0,kl);tpSet(R.kneeL,knL,0,0,kl);tpSet(R.kneeR,knR,0,0,kl);
  if(R.ankleL){tpSet(R.ankleL,anL,0,0,kl);tpSet(R.ankleR,anR,0,0,kl);}
  R.hips.position.y=_tpL(R.hips.position.y,hipsY-(sneak?.1:0)-(blocking?.02:0),kl);
  // torso
  // S162: on this rig a positive turn of the spine leans forward (the old rig's was negative, and sneak and sprint leant back)
  let tx=sneak?.4:GP?GP.spine+(st.sprinting?.08:0):0,ty=0,tz=0;
  // arms: locomotion swing by default
  let wR=0,shY=R.shield?-.25:0,shZ=0;
  let aL={x:Math.sin(ph)*amp*.6,y:0,z:.06},aR={x:Math.sin(ph+Math.PI)*amp*.6,y:0,z:-.06},eL=-.2-(st.sprinting?.6:0),eR=-.2-(st.sprinting?.6:0);
  // on the gait the arms swing with the legs, pumping bent at a run
  if(GP){aL.x=GP.shL;aR.x=GP.shR;eL=GP.elL;eR=GP.elR;}
  if(sneak){aL.x=-.4;aR.x=-.4;eL=-.9;eR=-.9;}
  if(air){aL={x:-.5,y:0,z:.5};aR={x:-.5,y:0,z:-.5};}
  // weapon at rest: blade up and forward
  if(R.weapon&&!air){if(!st.moving){aR.x=-.22;aR.z=-.12;eR=-.5;}wR=.35;}
  // S246: the fist at the middle of the chest, where the short left arm can reach the grip below it (out on the right, it
  // was 11 cm out of reach); the blade slants up across the body
  if(R.twoH&&!air){aR={x:-.9,y:1.1,z:0};eR=-.6;aL={x:-.75,y:-.2,z:0};eL=-.7;wR=.55;if(st.moving){aR.x-=Math.sin(ph)*.08;aL.x-=Math.sin(ph)*.08;}}
  if(R.shield&&!air){eL=Math.min(eL,-.6);}
  if(R.torch){aL.x=Math.min(aL.x,-.3);eL=-1.2;}
  // S411 — Michael's D on #99: with both hands empty the jab's guard is carried, the right fist by the chin and the left by
  // the face, standing and on the move (bobbing a little with the stride); a sprint or a jump drops to the swinging arms,
  // and the punch, the block and the cast take over from it as before
  if(R.unarmed&&!air&&!st.sprinting){const sw=st.moving?Math.sin(ph)*.06:Math.sin(now*1.6)*.015;
    aR={x:-1.1+sw,y:.3,z:0};eR=-1.75;aL={x:-1.25-sw,y:-.32,z:0};eL=-1.85;wR=0;}
  // swing — read the viewmodel's own record of the current swing
  const vu=(typeof vmSword!=='undefined'&&vmSword)?vmSword.userData:{};
  // S244: the viewmodel picks a swing's variant and power later in the frame than this runs (and clears them when a
  // swing ends), so on a swing's first frame they still read 0: wait a frame for them, or every swing was the flat cut
  let ka=kf;const vmReady=!(typeof vmSword!=='undefined'&&vmSword)||vu.swingMax>0;
  if(swingT>0&&vmReady){if(!TP.swMax||swingT>TP.swingSeen+.001){TP.swMax=vu.swingMax||swingT;TP.swVar=TP_SWING_OF[vu.swingVariant||0]||0;TP.swRaw=vu.swingVariant||0;TP.swPow=!!vu.swingIsPower;}TP.swingSeen=swingT;
    const p=Math.max(0,Math.min(1,1-swingT/(TP.swMax||swingT)));const wind=p<.3?p/.3:1,strike=p<.3?0:p<.6?(p-.3)/.3:1,rec=p<.6?0:(p-.6)/.4;const ease=x=>x*x*(3-2*x);const S=ease(strike),W=ease(wind),Rc=ease(rec);const mag=TP.swPow?1.35:1;
    // S269 — Michael's A on Session 245: the swing keyed to the first person's phases, a coil, a step and a carry
    if(TP_SWING_NEW){const SP=ANIM_PARAMS.swing,A=SP.antEnd,I=SP.impactPoint,F=SP.sweepEnd;
      const cl=x=>Math.max(0,Math.min(1,x)),sm=x=>x*x*(3-2*x),eo=x=>1-(1-x)*(1-x)*(1-x);
      const w=eo(cl(p/(A-.06))),s=cl((p-A)/(I-.01-A)),s2=Math.pow(s,1.6),f=eo(cl((p-I+.01)/(F-I+.01))),r=sm(cl((p-F)/(1-F)));
      const L3=(a,b,c,d)=>{const x=_tpL(a,b,w),y=_tpL(x,c,s2),z=_tpL(y,d,f);return _tpL(z,a,r);};
      const V=[
        // forehand: high on the right, down across to the low left
        {sx:[-.22,-2.5,-1.15,-.55],sy:[0,-1.0,.55,1.15],el:[-.5,-1.0,-.12,-.3],wr:[.35,.7,1.45,1.2],ty:[0,-.6,.35,.65],tx:[0,-.08,.18,.28]},
        // backhand: high across on the left, down to the low right
        {sx:[-.22,-2.3,-1.2,-.7],sy:[0,1.05,-.35,-.95],el:[-.5,-1.5,-.12,-.25],wr:[.35,1.0,1.4,1.2],ty:[0,.5,-.3,-.6],tx:[0,-.05,.15,.22]},
        // overhead chop: up behind the head, straight down in front
        {sx:[-.22,-3.0,-1.2,-.8],sy:[0,-.12,-.05,0],el:[-.5,-1.2,-.08,-.2],wr:[.35,1.25,1.15,1.0],ty:[0,-.12,0,.05],tx:[0,-.18,.32,.4]}][TP.swRaw||0];
      // S402 — the empty hand's punch (Michael's A on #80, the first person's jab): from a guard by the chin, a short draw
      // with the shoulder turned back, the arm straight out at shoulder height on the body's middle line as the strike
      // lands, held a beat, back to guard; the left fist keeps its guard by the face throughout. The sword's arcs are not
      // played with an empty hand.
      const fist=!!vu.fists&&!R.weapon&&!R.bow;
      const VF={sx:[-1.1,-1.0,-1.62,-1.58],sy:[.3,.22,.26,.26],el:[-1.75,-1.95,-.04,-.08],ty:[0,-.22,.4,.36],tx:[0,-.04,.1,.1]};
      const mg=TP.swPow?1.25:1;ka=Math.min(1,dt*50);
      if(fist){const pv=TP.swPow?1.3:1;aR={x:L3(...VF.sx),y:L3(...VF.sy),z:0};eR=L3(...VF.el);wR=0;ty=L3(...VF.ty.map(v=>v*pv));tx=L3(...VF.tx.map(v=>v*pv));
        aL={x:-1.25,y:-.32,z:0};eL=-1.85;}
      else{
      aR={x:L3(...V.sx.map((v,i)=>i?v*(i===1?mg:1):v)),y:L3(...V.sy.map((v,i)=>v*(i?mg:1))),z:0};eR=L3(...V.el);wR=L3(...V.wr);ty=L3(...V.ty.map(v=>v*mg));tx=L3(...V.tx);}
      // the weight: back onto the right foot through the coil, a step of the left into the hit, held through the carry
      const coil=w*(1-s2),step=s2*(1-r);thL=_tpL(thL,-.5*mg,step)+.12*coil;thR=_tpL(thR,.22,step)-.1*coil;
      tpSet(R.thighL,thL,0,0,kf);tpSet(R.thighR,thR,0,0,kf);tpSet(R.kneeL,.1+.45*step+.2*coil,0,0,kf);tpSet(R.kneeR,.15+.25*step+.3*coil,0,0,kf);
    }
    else if(TP.swVar===0){ // flat cut, right to left
      aR={x:-1.45,y:_tpL(_tpL(0,-1.2*mag,W),1.0*mag,S)*(1-Rc*.7),z:0};eR=-.35;wR=_tpL(.4,1.6,Math.max(W*.5,S))*(1-Rc);ty=_tpL(_tpL(0,-.45*mag,W),.5*mag,S)*(1-Rc);}
    else if(TP.swVar===1){ // overhead chop
      aR={x:_tpL(_tpL(-.4,-2.9,W),-.7,S)*(1-Rc*.6)+(-.35)*Rc*.6,y:-.1,z:0};eR=_tpL(_tpL(-.6,-1.3,W),-.1,S);wR=_tpL(.4,1.1,S)*(1-Rc);tx=_tpL(_tpL(0,.15,W),-.35*mag,S)*(1-Rc);}
    else{ // rising diagonal / thrust
      aR={x:_tpL(_tpL(-.6,-.9,W),-1.7,S),y:_tpL(_tpL(0,-.6,W),.12,S)*(1-Rc*.7),z:0};eR=_tpL(_tpL(-1,-1.9,W),-.05,S);wR=_tpL(.2,1.6,S)*(1-Rc);ty=_tpL(_tpL(0,-.3,W),.3,S)*(1-Rc);}
    if(R.twoH){aL={x:aR.x+.05,y:aR.y+.45,z:0};eL=eR-.15;}
    if(!TP_SWING_NEW){thL-=.25*S*(1-Rc)*mag;tpSet(R.thighL,thL,0,0,kf);}
  } else TP.swMax=0;
  // block
  if(blocking&&swingT<=0){if(R.shield){aL={x:-1.3,y:-.95,z:0};eL=-1.2;shY=.5;shZ=-.4;}else if(R.twoH||R.weapon){aR={x:-1.3,y:.6,z:0};eR=-1.2;wR=1.2;if(R.twoH){aL={x:-1.3,y:-.4,z:0};eL=-1.3;}}else{aL={x:-1.5,y:-.3,z:0};aR={x:-1.5,y:.3,z:0};eL=eR=-1.6;}}
  // the bow: left arm out along the aim, right hand draws to the cheek
  const drawing=typeof _bowDrawing!=='undefined'&&_bowDrawing;
  if(R.bow&&(drawing||blocking)){const s=drawing?Math.min(1,_bowDrawT/BOW_DRAW_MAX):.3;const aim=-Math.PI/2-pitch*.9;ty=-.55;aL={x:aim,y:.55,z:0};eL=-.05;aR={x:aim,y:.55+.3+s*.45,z:0};eR=-.4-s*2.0;}
  else if(R.bow&&!air){aL.x=Math.min(aL.x,-.25);eL=-.5;}
  // casting: both hands out, the right leading
  if(typeof castT!=='undefined'&&castT>0){const c=castT/CAST_ANIM_DURATION;const push=Math.sin((1-c)*Math.PI);aR={x:-1.45-pitch*.8,y:.15,z:0};eR=-.25-.5*(1-push);aL={x:-1.1-pitch*.6,y:-.25,z:0};eL=-.9;ty=-.15;tx=-.1*push;}
  // a hit rocks you back
  if(TP.hurtT>0){tx+=.35*(TP.hurtT/.28);}
  tpSet(R.torso,tx,ty,tz,ka);tpSet(R.shL,aL.x,aL.y,aL.z,ka);tpSet(R.shR,aR.x,aR.y,aR.z,ka);tpSet(R.elL,eL,0,0,ka);tpSet(R.elR,eR,0,0,ka);
  // weapon grip follows the forearm; the bow stays vertical in the fist
  tpSet(R.handR,wR,0,0,ka);if(R.shield)tpSet(R.shield,0,shY,shZ,kf);
  if(R.weaponL){R.weaponL.rotation.x=-(R.shL.rotation.x+R.elL.rotation.x);}
  // S246: a two-handed weapon is held in both hands through every pose: the left wrist is put on the grip
  if(R.gripL&&R.weapon&&TP.deadT<.01&&!(typeof castT!=='undefined'&&castT>0))tpGripL(R);
  // the head looks where you look
  tpSet(R.head,Math.max(-.6,Math.min(.5,-pitch*.6))-tx*.3,-ty*.6,0,kf);
  // death: down on the back
  R.root.rotation.x=-TP.deadT*Math.PI/2;R.root.position.y-=TP.deadT*.1;
}
// S246: the left arm reaches the two-handed grip as a two-bone reach: the elbow (a hinge, bent one way as the pose
// bends it) is bent until shoulder to wrist is shoulder to grip, found by halving on the bones themselves, then the
// shoulder turns the wrist onto the grip. Out of reach, the arm straightens towards it.
const _tgQ=new THREE.Quaternion(),_tgQ2=new THREE.Quaternion(),_tgA=new THREE.Vector3(),_tgB=new THREE.Vector3(),_tgS=new THREE.Vector3(),_tgW=new THREE.Vector3(),_tgT=new THREE.Vector3();
function tpGripL(R){
  R.root.updateMatrixWorld(true);const T=R.weapon.localToWorld(_tgT.copy(R.gripL));R.shL.getWorldPosition(_tgS);const dT=_tgS.distanceTo(T);
  const reach=b=>{R.elL.rotation.set(b,0,0);R.elL.updateMatrixWorld(true);return R.handL.getWorldPosition(_tgW).distanceTo(_tgS);};
  let lo=-2.5,hi=0;if(reach(hi)>dT){for(let k=0;k<14;k++){const m=(lo+hi)/2;if(reach(m)>dT)hi=m;else lo=m;}reach((lo+hi)/2);}
  R.handL.getWorldPosition(_tgW);_tgA.subVectors(_tgW,_tgS);_tgB.subVectors(T,_tgS);
  if(_tgA.lengthSq()<1e-8||_tgB.lengthSq()<1e-8)return;
  // the turn in the world, carried into the shoulder's own frame: q_local' = parentWorld⁻¹ · turn · jointWorld
  _tgQ.setFromUnitVectors(_tgA.normalize(),_tgB.normalize());R.shL.getWorldQuaternion(_tgQ2);_tgQ.multiply(_tgQ2);R.shL.parent.getWorldQuaternion(_tgQ2);_tgQ.premultiply(_tgQ2.invert());R.shL.quaternion.copy(_tgQ);
  R.shL.updateMatrixWorld(true);
}
function tpUpdate(dt,st){
  if(!thirdPerson){
    if(TP.rig&&TP.rig.root.visible)TP.rig.root.visible=false;
    if(TP.hidVM){TP.hidVM=false;VM_SCENE.visible=true;}
    return;}
  if(!TP.hidVM){TP.hidVM=true;VM_SCENE.visible=false;}
  const sig=tpSig();if(!TP.rig||sig!==TP.sig){const old=TP.rig;TP.rig=tpBuild();TP.sig=sig;if(old){TP.rig.root.rotation.copy(old.root.rotation);tpDispose(old);}}
  const R=TP.rig;if(!scene)return;
  if(R.root.parent!==scene){if(R.root.parent)R.root.parent.remove(R.root);scene.add(R.root);}
  tpCamera(dt,st.camY);
  // on a ship's deck or a platform jumpY already carries the height
  R.root.position.set(px,jumpY,pz);R.root.rotation.y=yaw+Math.PI;
  // S154 — the stride follows the ground; S162 — and runs past PW.RUN.on heights a second, as the townsfolk do
  {let d=TP.lx==null?0:Math.hypot(px-TP.lx,pz-TP.lz);TP.lx=px;TP.lz=pz;if(d>1.5)d=0;const s=R.root.scale.x||1,v=dt>0?d/dt:0;
    TP.v=(TP.v||0)+(v-(TP.v||0))*(1-Math.exp(-dt/.15));
    if(!TP.run&&TP.v/s>PW.RUN.on)TP.run=true;else if(TP.run&&TP.v/s<PW.RUN.off)TP.run=false;
    TP.gph=((TP.gph||0)+d/(pwCycle({walk:1-(TP.rw||0),run:TP.rw||0})*s))%1;
    TP.rw=(TP.rw||0)+((TP.run?1:0)-(TP.rw||0))*(1-Math.exp(-dt/.11));}
  tpPose(R,dt,st);
  if(R.rig.B.cloak||R.rig.B.hairB)peopleSwing(R.rig,dt); // S277 — your own back hair (and a cloak, should you wear one) swings as the townsfolk's (S267)
  tpRollTumble(R,st.roll);
  // too close to see past: step out of the way
  R.root.visible=TP.near>.32||TP.dist>.55;
}
// S275 — through a roll the body turns once head over heels about its middle, forward or back as you roll, the
// middle dropping to a crouch at the top of the turn. The pose sets the root's pitch every frame (the fall), so
// outside a roll this leaves it alone.
function tpRollTumble(R,roll){
  if(!roll||!(roll.p<1)||dead)return;
  const s=R.root.scale.y||1,h=.85*s,th=Math.PI*2*roll.p*(ROLL&&ROLL.fwd<0?-1:1);
  const hp=h*(1-.45*Math.sin(Math.PI*roll.p)),fx=-Math.sin(yaw),fz=-Math.cos(yaw);
  R.root.rotation.x=th;
  R.root.position.set(px-fx*h*Math.sin(th),jumpY+hp-h*Math.cos(th),pz-fz*h*Math.sin(th));
}
// S175 — in third person a shot leaves the hand that makes it (the bow hand for an arrow, the right hand for
// a spell) and flies to where the crosshair points, a point AIM_REACH along the camera's line. In first person
// (or with the body hidden, too close to see past) it returns null and the caller keeps its eye-side origin.
const AIM_REACH=30;
function tpAimPoint(){const d=CAM.getWorldDirection(new THREE.Vector3());return CAM.position.clone().addScaledVector(d,AIM_REACH);}
function tpShotFrom(hand,sc,aim){
  if(!thirdPerson||!TP.rig||!TP.rig.root.visible||TP.rig.root.parent!==sc)return null;
  const b=hand==='L'?TP.rig.handL:TP.rig.handR;if(!b)return null;
  TP.rig.root.updateMatrixWorld(true);const from=b.getWorldPosition(new THREE.Vector3());
  const dir=(aim||tpAimPoint()).clone().sub(from).normalize();
  return {from,dir};
}
function tpToggle(){thirdPerson=!thirdPerson;TP.cur=0;try{localStorage.setItem('og_tp',thirdPerson?'1':'0');}catch(e){}showMsg(thirdPerson?'Third person — mouse wheel to zoom':'First person','#c8b880');}
window.addEventListener('wheel',e=>{if(!thirdPerson||!started||dead)return;if(invOpen||shopOpen||lootOpen||stashOpen||hubOpen)return;if(typeof MAP!=='undefined'&&MAP.mode==='map')return;TP.want=Math.max(.9,Math.min(3.2,TP.want+(e.deltaY>0?.2:-.2)));try{localStorage.setItem('og_tp_d',String(TP.want));}catch(e2){}},{passive:true});
