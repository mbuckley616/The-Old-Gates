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
// S1466 — your spear's blow in third person is a thrust (#745 1 A), keyed as the swing's arcs are (rest, the coil's end, the hit,
// the carry): the fist drawn back to the hip with the elbow bent, then driven out at the chest's height with the arm straight and the
// shoulder turned into it, the shaft levelled along your facing by the wrist
const TP_THRUST={sx:[-.22,.4,-1.25,-1.15],sy:[0,.2,-.25,-.25],el:[-.5,-1.6,-.15,-.25],wr:[.35,1.6,1.45,1.45],ty:[0,-.35,.25,.3],tx:[0,-.05,.15,.2]};
const TP={rig:null,sig:'',dist:SCALE.TP_DIST,want:SCALE.TP_DIST,cur:SCALE.TP_DIST,phase:0,lastHP:null,hurtT:0,deadT:0,swingSeen:0,swMax:0,swVar:0,swPow:false,hidVM:false,near:0,hbHold:{L:0,R:0,S:0,lean:0}};
try{const v=localStorage.getItem('og_tp');if(v==='1')thirdPerson=true;const d=parseFloat(localStorage.getItem('og_tp_m'));if(d>0)TP.want=Math.max(SCALE.TP_MIN,Math.min(SCALE.TP_MAX,d));}catch(e){}
// ── the look (Session 127): worldState.look = {skin,hair,style,beard,tunic,breeches,boots}
// Chosen in the creator; the rig, the first-person hands and the base garments read it.
const LOOK_TUNICS=[0x6a5a44,0x5a2a20,0x2a3a6a,0x3a4a2a,0x6a4a1a,0x2a2a2a,0x7a6a5a,0x4a2a4a];
const LOOK_BREECHES=[0x3a2a1a,0x4a4030,0x2a2a3a,0x5a3a2a,0x1a1a1a];
const LOOK_BOOTS=[0x2a1c10,0x4a3018,0x1a1a1a,0x5a4a3a];
// S560 — the six cloaks' cuts and colours (docs/design/capes-and-cloaks.md): the plain wool, the dark hood, oilskin, the Markish
// fur-lined, the Aurennais short cape to the waist with a gold hem, the pilgrim's grey with its hood
const TP_CLOAK={wool:{col:0x6a5a46,cut:'long'},hood:{col:0x24242a,cut:'long',hood:true},oilskin:{col:0x4e4a2e,cut:'long'},
  fur:{col:0x4a382a,cut:'long',fur:0x9a8a70},cape:{col:0x2a3a7a,cut:'short',trim:0xc8a040},pilgrim:{col:0x8a8880,cut:'long',hood:true}};
const LOOK_STYLES=[['short','Cropped'],['long','Long'],['tied','Tied back'],['bald','Shorn'],['braid','A braid'],['twin','Two braids'],['warrior','Warrior braids'],['mohawk','A crest'],['curly','Curly'],['afro','An afro'],['shaggy','Shaggy'],['bun','A bun'],['thin','Thinning']].concat(window.OG_LOOK==='new'?[['crown','A crown braid'],['plait','A plait over the shoulder'],['shaved','Shaved sides']]:[]);
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
  const w=buildWeapon(kind==='crossbow'?'crossbowbare':kind==='bow'&&BOW_LEN[it.bowKind]?it.bowKind:kind,{tint:{metal:blade,guard,glow:tpHex(it.matGlow,0x88c0ff),wood:sh==='bow'?tpHex(it.matCol,0x6a4428):null}});g.add(w);
  if(kind==='bow'){w.rotation.y=Math.PI;g.userData.bow=true;g.userData.bowLen=bowLenOf(it);} /* S1550 — a longbow or a war bow is the kit's own, longer */if(kind==='crossbow'){w.rotation.x=Math.PI;g.userData.xbow=xbowRig(w);}g.userData.kit=kind; /* S1476 — its string and bolt drawn by the span */
  return g;}
const TP_LINEN=0xa89c80;
const TP_BOW_TIP=.5; /* S1550 — a long bow carried at rest, tipped forward: the war bow (1.7) .35 rad */
// ── F10 (Session 1246): the player's own body from the builder's genome, in the new look ──
// worldState.look.hb is the saved genome (HB.toSaved: the sliders, the face, the palette, the hair and beard; a few hundred bytes),
// in the character row (look is in SS_CHAR_WS). The creator and the barber write it through tpBuild (TP.rig.hbSaved, copied back
// into the look they are editing); every build reads it, so a character is the same body on every load. A look with none (a save
// from before F10; F13 maps those) is rolled from its seed, `player:<name>`, inside its people's ranges, the same on every load.
// The look's choices are laid over it: the skin, the hair's colour and cut, the beard, the body (man or woman), the height and the
// build. What is worn is not in it: tpHBDress dresses a copy from EQ on each build, as tpBuild dresses the old body.
const LOOK_HB_STYLE={short:['short',.22],long:['loose',.7],tied:['tail',.6],bald:['short',.03],braid:['braid',.75],twin:['braids',.7],warrior:['braids',.55],mohawk:['short',.3],curly:['short',.35],afro:['short',.42],shaggy:['loose',.45],bun:['bun',.65],thin:['short',.12],crown:['crown',.8],plait:['plait',.8],shaved:['shaved',.8]};
const LOOK_HB_BEARD={no:0,stubble:.12,pencil:.18,goatee:.35,chinstrap:.35,short:.45,vandyke:.45,mutton:.5,handlebar:.5,horseshoe:.55,walrus:.6,full:.85,long:1,braided:1,forked:1};
const LOOK_HB_TALL=[[0,'Short'],[.5,'Middling'],[1,'Tall']],LOOK_HB_BUILD=[[0,'Slight'],[.5,'Middling'],[1,'Strong']];
const TP_HB={cache:new Map(),ms:0,n:0};
function hbRGB(h){return [(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];}
// the genome for a look (cached by everything that goes into it): {G, saved}; null on the old look or if the builder fails
function lookHBGenome(L,pp,name,female){if(typeof hbOn!=='function'||!hbOn())return null;
  HB.loadPack();const people=HB.PEOPLES[pp]?pp:'gatelander',g=L.body?(L.body==='woman'?0:1):(female?0:1),sx=g?'m':'f',P=HB.PEOPLES[people];
  const key=JSON.stringify([L.hb||null,people,g,L.seed||null,name||'',L.skin,L.hair,L.style,L.beard,L.tall,L.build]);
  let E=TP_HB.cache.get(key);if(E)return E;
  const own=!!(L.hb&&L.hb.people===people&&L.hb.sliders&&L.hb.sliders.g===g);
  const G=own?HB.fromSaved(L.hb):HB.rollGenome(L.seed||('player:'+(name||'you')),{people,g});
  if(L.skin!=null)G.skin=hbRGB(L.skin);if(L.hair!=null)G.hairCol=hbRGB(L.hair);
  const st=LOOK_HB_STYLE[L.style];if(st)G.hair={style:st[0],len:st[1]};
  G.beard=g?(LOOK_HB_BEARD[L.beard===true?'full':L.beard||'no']||0):0;
  const B=P.body[sx],lerp=(r,t)=>r[0]+(r[1]-r[0])*t;
  if(L.build!=null){G.muscle=lerp(B.muscle,L.build);G.weight=lerp(B.weight,L.build);}
  // the height slider for a stature in metres is found by measuring the morphed body (nine morphs): only when the choice changes
  if(L.tall!=null&&!(own&&L.hbTall===L.tall&&L.hbBuild===L.build))G.height=HB.heightFor(G,lerp(B.metres,L.tall));
  E={G,saved:HB.toSaved(Object.assign({},G,{dress:{}}))};
  if(TP_HB.cache.size>16)TP_HB.cache.clear();TP_HB.cache.set(key,E);return E;}
// what the player wears, on a copy of the genome: the worn pieces as tpBuild reads them for the old body
function tpHBDress(G0,o){const G=JSON.parse(JSON.stringify(G0)),D=Object.assign({},HB.DRESS_FLAGS),AR=o.AR;G.dress=D;D.skirt='short';
  D.tunic=hbRGB(o.ch?o.clothCol:TP_LINEN);D.trousers=hbRGB(o.lg?o.legsCol:new THREE.Color(TP_LINEN).multiplyScalar(.93).getHex());D.boots=o.ft?hbRGB(o.bootCol):null;
  if(o.ch)D.belt=[.3,.2,.12];
  if(o.robe)D.robe=hbRGB(o.chestCol);
  if(AR&&AR.chest){const P=AR.chest;if(P.line==='light')D.tunic=hbRGB(armourLineLeather(P.tier));else if(P.line==='robe')D.robe=hbRGB(LINE_ROBE[P.tier]);else{D.mail=hbRGB(P.fam==='lamellar'?new THREE.Color(P.metal).lerp(new THREE.Color(0xc89a62),.3).getHex():P.metal);
    // S1260 — the heavy line's chest by its family (AR_FAM): Wooden's lamellar as the builder's scales in the wood's own tone, Bronze's
    // muscle cuirass and the plate of Steel up as its sheet metal (people.js's D.plate), Iron's mail as it was
    if(P.fam==='lamellar')D.scales=true;else if(P.fam==='muscle'||P.fam==='plate')D.plate=P.fam;}}
  // S1256 — the heavy line's helm is the builder's helm of its tier (helms.js; Michael's C of 18 Oct: from Steel up the face shut),
  // fitted to the player's own head; Iron's is the kit's kettle helm, in the tier's metal
  if(AR&&AR.head&&!AR.head.line){D.helm=hbRGB(AR.head.metal);D.tier=AR.head.tier;}else if(o.hd&&!AR&&!tpIsCloth(o.hd))D.helm=hbRGB(o.helmCol);
  // S1263 — gauntlets and greaves by family, as the old kit drew them (people.js's vambrace, gloves, greaves and cuisses): Wooden's boards
  // (the scales in the wood's tone) over leather gloves, Bronze's sheet over leather, Iron's mail, Steel up plate with a knee cop, the
  // cuisses up the thigh with mail and plate; the light line's bracers and gloves in its leather; gloves of no metal in their own colour
  const fam=P=>P.fam==='lamellar'?'scales':P.fam==='mail'?'mail':'sheet',col=P=>hbRGB(P.fam==='lamellar'?new THREE.Color(P.metal).lerp(new THREE.Color(0xc89a62),.3).getHex():P.metal);
  const Hn=AR&&AR.hands,Lg=AR&&AR.legs;
  if(Hn&&Hn.line==='light'){D.vambrace=D.gloves=hbRGB(armourLineLeather(Hn.tier));D.vambraceKind='leather';}
  else if(Hn&&!Hn.line){D.vambrace=col(Hn);D.vambraceKind=fam(Hn);if(Hn.fam==='mail'||Hn.fam==='plate'){D.gloves=hbRGB(Hn.metal);D.glovesKind=Hn.fam==='mail'?'mail':'sheet';}else D.gloves=hbRGB(0x4a3020);}
  else if(o.gl&&!Hn)D.gloves=hbRGB(tpMatColor(o.gl,0x5a3a20));
  if(Lg&&!Lg.line){D.greaves=col(Lg);D.greavesKind=fam(Lg);if(Lg.fam==='mail'||Lg.fam==='plate')D.cuisses=true;}
  // S1265 — the tier's signature on its plate (AR_SIG: fluted, heavy, faceted, scaled, spiked, inlaid; Mithril to Cosmic) and its glow,
  // drawn by people.js's plate shader on the cuirass, the gauntlets and the greaves; the first plate piece's, chest first
  {const S=[AR&&AR.chest,Hn,Lg].find(P=>P&&!P.line&&P.fam==='plate'&&P.sig);if(S){D.plateSig=S.sig;if(S.glow!=null)D.plateGlow=hbRGB(S.glow);}}
  // S1269 — the light line's hood (the old kit's: the leather darkened toward green) is the builder's hood up, alone or as the cloak's
  // S1271 — the robe line's cowl (the old kit's: a hood up over a roll at the neck, in the robe's dye) is the same hood up in LINE_ROBE's colour
  const Lh=AR&&AR.head&&(AR.head.line==='light'||AR.head.line==='robe')?AR.head:null;
  if(Lh&&!(o.cloak&&o.cloak.hood))D.cowl=hbRGB(Lh.line==='robe'?LINE_ROBE[Lh.tier]:new THREE.Color(armourLineLeather(Lh.tier)).lerp(new THREE.Color(0x2a3424),.5).getHex());
  const K=o.cloak;if(K){D.cloak=hbRGB(K.col);if(K.cut==='short'){D.cape=true;D.cloakLen=.6;}else D.cloakLen=.85;D.brooch=[.62,.47,.22];
    if(K.fur!=null)D.cloakFur=hbRGB(K.fur);if(K.trim!=null)D.cloakHem=hbRGB(K.trim);if(K.hood)D.hood=o.hd&&(tpIsCloth(o.hd)||Lh)?'up':'down';}
  return G;}
function tpBuild(lookIn,ppIn,reuse){
  let pp=ppIn||'gatelander',P=null;try{if(!ppIn)pp=WORLD.playerPeople();P=WORLD.PEOPLES[pp];}catch(e){}
  const LK=Object.assign(lookDefault(pp,playerArchetype,playerName),lookIn||lookNow()||{});
  const archCol=playerArchetype==='mage'?0x2a3a6a:playerArchetype==='rogue'?0x3a3a2a:0x5a2a20;
  const ch=EQ.chest,lg=EQ.legs,ft=EQ.feet,hd=EQ.head,gl=EQ.hands;
  // your own clothes under whatever you buy: a cloth item with no material colour takes the look's
  const own=it=>it&&it.matCol==null&&tpIsCloth(it);
  const chestCol=!ch?LK.tunic:own(ch)?LK.tunic:tpMatColor(ch,archCol),chestCloth=tpIsCloth(ch);
  const legCol=!lg?LK.breeches:own(lg)?LK.breeches:tpMatColor(lg,0x3a2a1a),legCloth=tpIsCloth(lg);
  const bootCol=!ft?LK.boots:ft.line==='light'&&ft.tier?armourLineLeather(ft.tier):own(ft)?LK.boots:tpMatColor(ft,0x2a1c10); /* S569 — soft boots are leather, not the metal */
  // the genome: the look's choices over the people's build, never re-rolled
  const styleMap={short:'crop',long:'straight',bald:'buzz'};
  // S384 — the worn armour kit: under a piece of it the tunic and breeches are your own cloth, and its helm replaces the bowl
  const AR=AR_FROM_EQ(EQ),clothCol=AR&&AR.chest?LK.tunic:chestCol,legsCol=AR&&AR.legs?LK.breeches:legCol;
  const g=personGenome({name:playerName||'you',role:'',people:pp,sCol:LK.skin,hairCol:LK.hair,bCol:chestCol},{key:'player'});
  Object.assign(g,{skin:new THREE.Color(LK.skin),hair:new THREE.Color(LK.hair),style:styleMap[LK.style]||LK.style||'crop',beard:LK.beard===true?'full':LK.beard||'none',
    cloth:new THREE.Color(clothCol),sleeve:new THREE.Color(clothCol).multiplyScalar(.9),legs:new THREE.Color(legsCol),boot:new THREE.Color(bootCol),
    dress:!!(ch&&!ch.line&&/robe/i.test(ch.name||'')),cloak:false,apron:null,gear:null,extras:[],freckles:false,ruddy:false,age:'adult',child:false,height:1,build:1,
    hat:hd?(hd.line&&AR&&AR.head?'none':tpIsCloth(hd)?'hood':AR&&AR.head?'none':'helm'):'none',hoodCol:hd?tpMatColor(hd,0x8a8f98):null,helmCol:hd?tpMatColor(hd,0x8a8f98):null,
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
  // S1458 — a crossbow is carried in the right fist alone, by the wrist of its tiller, its prod down behind (people.js carries it
  // point down): two hands on it held it up before the face as a claymore, the prod over the head
  R.twoH=!!(w&&w.twoHand&&w.weaponShape!=='bow'&&w.weaponShape!=='crossbow');R.bow=bowW;R.unarmed=!w&&!oh;R.spear=!!(w&&w.weaponShape==='spear');
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
  // F10 — on the new look the builder's body over this driver (F4's hbAttach and hbPose), at the genome's own stature
  const E=lookHBGenome(LK,pp,playerName,g.female);
  if(E){const K=EQ.back&&EQ.back.cloak?(TP_CLOAK[EQ.back.cloak]||TP_CLOAK.wool):null;
    rig.hbG=tpHBDress(E.G,{AR,ch,lg,ft,hd,gl,clothCol,legsCol,chestCol,bootCol,helmCol:hd?tpMatColor(hd,0x8a8f98):0x8a8f98,robe:!!(ch&&!ch.line&&/robe/i.test(ch.name||'')),
      cloak:K?{col:EQ.back.col!=null?EQ.back.col:K.col,cut:K.cut,hood:!!K.hood,fur:K.fur,trim:K.trim}:null});
    // F10, part two — a change of kit that leaves the dressed genome as it was (a weapon, a shield, a ring) keeps the builder's body
    // that was built for it: carried over from the body this one replaces (reuse, TP.rig) onto the new driver, not built again
    const key=JSON.stringify(rig.hbG),old=reuse&&reuse.rig&&reuse.rig.hb&&reuse.hbKey===key?reuse:null;R.hbKey=key;
    const t0=performance.now();
    if(old){const H=old.rig.hb;if(old.hbHeld)for(const h of old.hbHeld)h.c.removeFromParent();old.hbHeld=null;old.rig.hb=null;old.rig.mesh.visible=true;
      rig.hb=H;H.L=-1;H.drv=rig.mesh.material;rig.root.add(H.root);TP_HB.kept=(TP_HB.kept||0)+1;}
    else{rig.hbLazy=true;try{hbAttach(rig);}catch(e){rig.hb=null;console.warn('F10: the player\'s body failed',e);}
      if(rig.hb){TP_HB.ms+=performance.now()-t0;TP_HB.n++;}}
    // S1435 — your arms under a cloak are held in the walk as the townsfolk's are (hbCloakArms, S1434), each arm only while it is on the
    // gait's swing (tpPose's TP.hbHold): a blow, a guard, a draw, a cast, a torch, a shield, the swim and the climb keep the arm
    if(rig.hb){R.hbSaved=E.saved;rig.tpHold=rig.hb.hold?TP.hbHold:null;
      root.scale.setScalar(rig.hb.st*PW.BODY/SCALE.PERSON_MODEL);hbLevel(rig,0);tpTrue(R);
      // what the hands hold rides in the builder's group: a copy of each piece (its geometry shared) in a carrier that follows the piece,
      // which stays on its driver bone where tpPose turns it, each frame (tpHBHold); a weapon's grip goes to the builder's curled fingers
      R.hbHeld=[];const by=rig.hb.P.byName,sw=HBODY.swap,side=s=>sw?(s==='L'?'R':'L'):s;
      for(const [o,sd,grip] of [[R.weapon,'R',true],[R.weaponL,'L',true],[R.shield,'L',false],[R.torch,'L',true],[R.tome,'L',false]]){if(!o)continue;
        const c=new THREE.Group();c.matrixAutoUpdate=false;c.name='held';c.add(tpHBCopy(o,true));rig.hb.root.add(c);
        const s=side(sd);R.hbHeld.push({o,c,f:grip?[2,3,4,5].map(f=>by[`finger${f}-2.${s}`]).filter(Boolean):null,arm:[B['el'+sd],B['wr'+sd],by['lowerarm01.'+s],by['wrist.'+s]]});}
      // Michael's D on #99: an empty hand is a folded fist, and a hand that holds something closes on it; a tome is held open-handed
      hbCloseFist(by,side('R'));hbThumb(by,side('R'));R.hbHook=R.bow?tpHBHookOf(by,side('R')):null;if(!R.tome){hbCloseFist(by,side('L'));hbThumb(by,side('L'));}else for(let f=1;f<=5;f++)for(let j=1;j<=3;j++){const b=by[`finger${f}-${j}.${side('L')}`];if(b)b.quaternion.identity();} /* a body carried over may have closed it */
      root.traverse(o=>{if(o.isMesh)o.userData.tp=true;});}}
  if(!R.trueK)tpTrue(R);
  return R;}
// S1509 — a knife, a spear or a crossbow at its true size in the hand (wpnTrue): the kit's piece under the carried group, and with it the
// group's other things drawn in that piece's frame (an enchantment's motes, the left hand's place on a two-handed grip), by the body's scale
function tpTrue(R){const W=R.weapon||R.weaponL,k=W&&W.children[0];R.trueK=1;if(!k||!WPN_TRUE.has(W.userData.kit))return;
  wpnTrue(W.userData.kit,k,R.root);const f=k.scale.x;R.trueK=f;for(const c of W.children)if(c.isPoints)c.scale.setScalar(f);if(R.gripL)R.gripL.multiplyScalar(f);}
// a held piece's copy for the builder's group: its meshes and points on the same geometry and materials, its own turns below the top
// (Object3D.clone copies userData through JSON, which the kit's pieces do not all survive)
function tpHBCopy(o,top){const k=o.isMesh?new THREE.Mesh(o.geometry,o.material):o.isPoints?new THREE.Points(o.geometry,o.material):new THREE.Group();k.name=o.name;k.visible=o.visible;k.frustumCulled=o.frustumCulled;
  if(!top){k.position.copy(o.position);k.quaternion.copy(o.quaternion);k.scale.copy(o.scale);}for(const ch of o.children)k.add(tpHBCopy(ch,false));return k;}
// F10 — each frame after tpPose: the builder's bones copy the driver's, and what the hands hold follows its driver piece
const _tpHm=new THREE.Matrix4(),_tpHv=new THREE.Vector3(),_tpHv2=new THREE.Vector3();
// S1253 — each piece is carried from the driver's forearm to the builder's: turned about the elbow by the turn that takes the driver's
// elbow-to-wrist line onto the builder's, and moved with it (the two bodies' forearms rest 18° apart, which tilted the blade and left
// the shield on the driver's arm); a grip is then set in the builder's fingers as before
const _tpHq=new THREE.Quaternion(),_tpHa=new THREE.Vector3(),_tpHb=new THREE.Vector3(),_tpHe=new THREE.Vector3(),_tpHm2=new THREE.Matrix4();
function tpHBHold(R){const H=R.rig.hb;if(!H||!R.hbHeld)return;R.root.updateMatrixWorld(true);_tpHm.copy(H.root.matrixWorld).invert();
  for(const h of R.hbHeld){const XS=h.o===R.weapon&&R.xspan;h.c.matrix.multiplyMatrices(_tpHm,XS?XS.carry:h.o.matrixWorld);
    const A=h.arm;if(A&&A[0]&&A[1]&&A[2]&&A[3]){const P=o=>new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).applyMatrix4(_tpHm);
      const De=P(A[0]),Be=P(A[2]);_tpHa.copy(P(A[1])).sub(De);_tpHb.copy(P(A[3])).sub(Be);
      if(_tpHa.lengthSq()>1e-10&&_tpHb.lengthSq()>1e-10){_tpHq.setFromUnitVectors(_tpHa.normalize(),_tpHb.normalize());
        _tpHm2.makeRotationFromQuaternion(_tpHq).setPosition(_tpHe.copy(De).applyQuaternion(_tpHq).negate().add(Be));h.c.matrix.premultiply(_tpHm2);}}
    if(h.f&&h.f.length){const v=_tpHv.set(0,0,0);for(const b of h.f)v.add(_tpHv2.setFromMatrixPosition(b.matrixWorld));v.multiplyScalar(1/h.f.length).applyMatrix4(_tpHm);h.c.matrix.setPosition(v);}
    if(XS){tpXbowPlace(R);_tpHm2.multiplyMatrices(_tpHm,XS.mid); /* S1504 — set down to span, by way of the middle key */
      if(XS.w<.5)tpBlendM(h.c.matrix,h.c.matrix,_tpHm2,XS.w*2);else tpBlendM(h.c.matrix,_tpHm2,_txJ.multiplyMatrices(_tpHm,XS.free),XS.w*2-1);}
    h.c.matrixWorldNeedsUpdate=true;}}
function tpHBPose(R){if(!R||!R.rig.hb)return;hbPose(R.rig);if(R.mantle)tpHBMantle(R);if(R.hbHook)tpHBBowHand(R);R.root.updateMatrixWorld(true);tpHBHold(R);}
// S1270 — the bow's draw on the builder's fingers: the right hand, a fist while the bow is carried, opens into the archer's hook as the
// string comes back (or is held at the ready): the first three fingers bent round the string at their last two joints and barely at the
// knuckle, the little finger and the thumb left folded. The knuckles' line is hbCloseFist's, read once when the body is built; the hand
// eases toward its shape each frame (a look only: the draw's timing and the arrow are the bow's own)
const TP_HOOK=[.12,1.45,.85],TP_FIST=[1.15,1.35,.95];
function tpHBHookOf(by,sd){const m=by[`metacarpal2.${sd}`],a=by[`finger2-1.${sd}`],b=by[`finger5-1.${sd}`];if(!m||!a||!b)return null;by.root.parent.updateMatrixWorld(true);
  const at=o=>new THREE.Vector3().setFromMatrixPosition(o.matrixWorld),h=at(a).sub(at(b)).normalize().applyQuaternion(m.getWorldQuaternion(new THREE.Quaternion()).invert());
  const f=[];for(let i=2;i<=4;i++)f.push([1,2,3].map(j=>by[`finger${i}-${j}.${sd}`]||null));return {h,sg:sd==='R'?1:-1,f,k:0};}
function tpHBBowHand(R){const H=R.hbHook,drawing=typeof _bowDrawing!=='undefined'&&_bowDrawing,t=drawing?Math.min(1,_bowDrawT/BOW_DRAW_MAX*3):blocking?1:0;
  const k0=H.k;H.k+=(t-H.k)*.3;if(Math.abs(H.k-t)<.002)H.k=t;if(H.k===k0&&H.set)return;H.set=true;
  for(const F of H.f)for(let j=0;j<3;j++)if(F[j])F[j].quaternion.setFromAxisAngle(H.h,H.sg*(TP_FIST[j]+(TP_HOOK[j]-TP_FIST[j])*H.k));}
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
function tpDispose(R){if(!R)return;if(R.rig&&R.rig.hb){if(R.hbHeld)for(const h of R.hbHeld)h.c.removeFromParent();hbDrop(R.rig);} /* F10: the held copies share the pieces' geometry, disposed once below */if(R.root.parent)R.root.parent.remove(R.root);R.root.traverse(o=>{if(o.isMesh||o.isPoints){o.geometry.dispose();if(o.material!==PEOPLE_MAT)o.material.dispose();}});}
const _tpL=(a,b,k)=>a+(b-a)*k;
function tpSet(g,x,y,z,k){g.rotation.x=_tpL(g.rotation.x,x,k);g.rotation.y=_tpL(g.rotation.y,y||0,k);g.rotation.z=_tpL(g.rotation.z,z||0,k);}
// ── camera collision ──
function tpInteriorBox(){const _intW={weapon:11,armor:11,potion:9,misc:10,inn:13,church:10,castle:18},_intD={weapon:10,armor:10,potion:9,misc:9,inn:11,church:16,castle:22},_ceil={weapon:2.4,armor:2.4,potion:2.2,misc:2.3,inn:2.5,church:3.8,castle:5.2};const t=currentHouse&&currentHouse.type||'misc';return {W:(currentHouse&&currentHouse._roomW)||_intW[t]||10,D:(currentHouse&&currentHouse._roomD)||_intD[t]||9,C:(currentHouse&&currentHouse._ceilH)||_ceil[t]||2.3};}
function tpBlocked(x,z){
  if(isInterior()){const b=tpInteriorBox();return x<.18||z<.18||x>b.W-.18||z>b.D-.18||!!(currentHouse&&currentHouse._base&&currentHouse._eyeMax&&intSolidAt(x,z,.1,currentHouse._eyeMax-.2));}
  if(lid&&lid.startsWith('dyn_')){const r=.14;return dSolid(x-r,z-r)||dSolid(x+r,z-r)||dSolid(x-r,z+r)||dSolid(x+r,z+r);}
  if(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.camSolid)return WORLD.camSolid(x,z);
  return currentZoneSolid(x,z);}
function tpCeil(){if(isInterior()){const c=tpInteriorBox().C-.22,e=currentHouse&&currentHouse._eyeMax;return e?Math.min(c,e+.12):c;}if(lid&&lid.startsWith('dyn_'))return (currentFloor===2?FLOOR2_Y:0)+dCeil(px,pz)-.25;return 1e9;} /* S1293 — the roof over you (a gate's spaces) */
/* S1572 — below deck (a room with house._eyeMax, the ship bases) the camera keeps under the beams' undersides, 8 cm clear (the eye
   stoops to 0.2 under them, the pivot is 0.12 over the eye), and the hull's planking and the masts stop it as the room's walls do */
function tpFloorAt(x,z,fallback){if(isInterior())return .15;if(lid&&lid.startsWith('dyn_'))return fallback+.15;let y=fallback;try{y=activeTerrainH(x,z);}catch(e){}if(activeZoneId==='world'&&typeof WORLD!=='undefined')y=Math.max(y,WORLD.SEA_Y);return y+.22;}
function tpCamera(dt,camY){
  const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);const cp=Math.cos(pitch),sp=Math.sin(pitch);
  const inD=lid&&lid.startsWith('dyn_'),inI=isInterior();
  const maxD=inI?Math.min(TP.want,2.2):inD?Math.min(TP.want,2.45):TP.want; /* S880 (F2a): 1.5 and 1.7 at the old person's size, ×1.44 */
  const pivY=camY+.12,side=SCALE.TP_SIDE;
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
// S1476 — the crossbow's string and bolt by the span (xbowSpanPose, 16-viewmodel.js), on the driver's piece and the builder's copy of it
function tpXbowSpan(R){const S=xbowSpanPose();xbowRigSet(R.weapon.userData.xbow,S.f,S.bolt);
  if(R.hbHeld)for(const h of R.hbHeld)if(h.o===R.weapon)xbowRigSet(h.c,S.f,S.bolt);}
// S1504 — the body spans it (owed since S1476). Standing, the bow is set down nose first, its stirrup on the ground a short stride
// ahead with the right foot in it and the tiller leaning back to the belt; the body bows over it, both hands take the string either
// side of the tiller and haul it up the groove to the nut as the back comes up (xbowSpanPose's f), and over the span's last 0.4 s the
// bow comes back up into the right fist (its d). Walking, blocking, a blow, the air, the water or a pull: carried as before. The hands
// are the mantle's two-handed reach (R.mantle, tpMantleArms; the builder's wrists by tpHBMantle); the piece is set in the world, its
// carry kept in R.xspan for the builder's copy (tpHBHold). Metres: the stirrup's foot of the bow, the butt's height, the wrist over the string
const TP_XSPAN={fwd:.62,side:.07,up:.04,toe:.07,buttFwd:.85,lean:[1.35,1.08],drop:[.32,.15],hand:.07,ease:10};
const _txA=new THREE.Vector3(),_txB=new THREE.Vector3(),_txC=new THREE.Vector3(),_txQa=new THREE.Quaternion(),_txQb=new THREE.Quaternion(),_txSa=new THREE.Vector3(),_txSb=new THREE.Vector3();
const _txM=new THREE.Matrix4(),_txJ=new THREE.Matrix4(),_txF=new THREE.Matrix4(),_txI=new THREE.Matrix4(),_txX=new THREE.Vector3(),_txY=new THREE.Vector3(),_txZ=new THREE.Vector3();
function tpBlendM(out,a,b,w){a.decompose(_txA,_txQa,_txSa);b.decompose(_txB,_txQb,_txSb);_txA.lerp(_txB,w);_txQa.slerp(_txQb,w);_txSa.lerp(_txSb,w);return out.compose(_txA,_txQa,_txSa);}
function tpXbowSpanBody(R,dt,st){const W=R.weapon,k=W.userData.xbow,X=TP_XSPAN;if(!R.xhome)R.xhome={p:W.position.clone(),q:W.quaternion.clone()};
  if(W.parent!==R.handR){R.handR.add(W);W.visible=true;}W.position.copy(R.xhome.p);W.quaternion.copy(R.xhome.q);W.scale.set(1,1,1);
  const S=xbowSpanPose(),free=!st.moving&&!st.roll&&onGround&&!blocking&&swingT<=0&&TP.hurtT<=0&&!TP.swim&&!dead&&TP.deadT<.01&&!R.mantle&&
    !(typeof castT!=='undefined'&&castT>0)&&!(typeof climbPose==='function'&&climbPose());
  const want=free?S.d:0,w0=R.xw||0;R.xw=w0+(want-w0)*Math.min(1,dt*X.ease);if(Math.abs(R.xw-want)<.002)R.xw=want;
  if(R.xw<=0){R.xspan=null;if(!st.moving&&onGround&&R.ankleL){R.root.updateMatrixWorld(true);R.xank=R.root.worldToLocal(R.ankleL.getWorldPosition(_txB)).y;}return;}
  const w=R.xw,f=S.f;
  // the body: bowed over the bow, the back coming up with the string; the right foot forward in the stirrup, the left knee bent
  // the arm is short (0.4 m) to a bow that stands 1.3 m: the knees bend and the hips go down (the root, set afresh each frame) until the
  // left ankle is as high over the ground as it stands at rest (R.xank, read while you stand); the stirrup goes under the right foot
  const rs=R.root.matrixWorld.getMaxScaleOnAxis(),j=1-f;
  tpSet(R.torso,X.lean[0]+(X.lean[1]-X.lean[0])*f,0,0,w);tpSet(R.head,-.7+.3*f,0,0,w);
  tpSet(R.thighL,-.9+.2*f,0,0,w);tpSet(R.kneeL,1.9-.5*f,0,0,w);tpSet(R.thighR,-1.45+.25*f,0,0,w);tpSet(R.kneeR,1.45-.25*f,0,0,w);
  if(R.ankleL){tpSet(R.ankleL,-.7+.3*f,0,0,w);tpSet(R.ankleR,-.15,0,0,w);}
  R.root.updateMatrixWorld(true);let drop=(X.drop[0]*j+X.drop[1]*f)*w;
  if(R.ankleL&&R.xank!=null)drop=Math.max(0,R.root.worldToLocal(R.ankleL.getWorldPosition(_txB)).y-R.xank)*rs;
  const foot=R.ankleR?R.root.worldToLocal(R.ankleR.getWorldPosition(_txA)):_txA.set(-X.side*rs,0,X.fwd*rs);
  R.root.position.y-=drop;R.root.updateMatrixWorld(true);
  // where the bow stands, in the body's frame (+z ahead, +y up, −x the right): the stirrup's foot (the kit's 0.70) on the ground, the
  // tiller upright with its butt (−0.30) a little further out, clear of the chest bowed over it, the string's face (the kit's +x) toward you
  const ku=_txB.setFromMatrixColumn(k.matrixWorld,1).length()/rs,m=1/rs,L=1.0*ku;
  const dz=Math.max(-L*.5,Math.min(L*.5,(X.fwd-X.buttFwd)*m)),dy=Math.sqrt(L*L-dz*dz);
  _txY.set(0,-dy,dz).normalize();_txX.set(0,0,-1).addScaledVector(_txY,_txY.z).normalize();_txZ.crossVectors(_txX,_txY);
  _txF.makeBasis(_txX,_txY,_txZ).scale(_txSa.set(ku,ku,ku)).setPosition(_txC.set(foot.x,(X.up+drop)*m,foot.z+X.toe*m).addScaledVector(_txY,-.70*ku));
  _txF.premultiply(R.root.matrixWorld);
  // the kit's frame, carried (in the fist, its prod down behind) and set down, blended by w by way of a middle key: the fist where it is
  // and the bow hanging down beside the right leg, tipped out a little, so the bow goes round the body, not through it; the piece (the kit's parent)
  // placed to match
  const XS=R.xspan||(R.xspan={carry:new THREE.Matrix4(),want:new THREE.Matrix4(),free:new THREE.Matrix4(),mid:new THREE.Matrix4(),w:0});XS.w=w;
  W.updateMatrixWorld(true);XS.carry.copy(W.matrixWorld);_txC.setFromMatrixPosition(k.matrixWorld);
  _txI.copy(k.matrix).invert();XS.free.multiplyMatrices(_txF,_txI);
  _txM.makeBasis(_txX.set(.89,-.45,0),_txY.set(-.45,-.89,0),_txZ.set(0,0,-1)).scale(_txSa.set(ku,ku,ku)).premultiply(R.root.matrixWorld).setPosition(_txC);
  XS.mid.multiplyMatrices(_txM,_txI);
  if(w<.5)tpBlendM(_txM,k.matrixWorld,_txM,w*2);else tpBlendM(_txM,_txM,_txF,w*2-1);
  XS.want.copy(_txM.multiply(_txI));tpXbowPlace(R);
  // the hands on the string, either side of the tiller where the string runs from its middle (f of the way to the nut) to the prod's tips
  const K=XBOW_RIG,my=K.restY+(K.nutY-K.restY)*f,T=[-1,1].map(sd=>k.localToWorld(new THREE.Vector3(K.px+.012,my+(K.tipY-my)*.16,sd*.052)).add(_txA.set(0,X.hand,0)));
  if(R.root.worldToLocal(_txB.copy(T[0])).x<R.root.worldToLocal(_txC.copy(T[1])).x)T.reverse(); /* the left hand on the body's left (+x) */
  R.mantle={w,T,q:[R.shL.quaternion.clone(),R.elL.quaternion.clone(),R.shR.quaternion.clone(),R.elR.quaternion.clone()],xbow:true};
  tpMantleArms(R,null);tpXbowPlace(R);}
// the piece where the span wants it in the world (R.xspan.want), hung from the body's root while it is set down: the hand's bones are
// scaled unevenly, which a turn under them would shear; there it shows only when the driver's body does (the builder's copy is what shows)
function tpXbowPlace(R){const W=R.weapon;if(W.parent!==R.root)R.root.add(W);W.visible=R.rig.mesh.visible; /* off the driver's hidden mesh, it hides with it */
  R.root.updateMatrixWorld(true);_txI.copy(R.root.matrixWorld).invert().multiply(R.xspan.want).decompose(W.position,W.quaternion,W.scale);W.updateMatrixWorld(true);}
function tpPose(R,dt,st){
  const k=Math.min(1,dt*14),kf=Math.min(1,dt*22);
  const now=st.now/1000;
  if(R.motes)tpMotesTick(R,now); // S539
  if(R.weapon&&R.weapon.userData.xbow)tpXbowSpan(R);
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
  // S1594 — the double jump's tuck: the knees drawn up to the chest; the air dash's lean: one leg trailing, the other drawn under
  // (a dash back, both reaching ahead). Weights from airPose (16-viewmodel.js); the roll, the water and the fall take none
  const AP=airPose(now),ln=st.roll||dead||TP.swim?0:AP.lean,tk=st.roll||dead||TP.swim?0:AP.tuck*(1-ln),bk=AP.f<-.3;
  if(tk>0){thL+=(-1.6-thL)*tk;thR+=(-1.35-thR)*tk;knL+=(2.1-knL)*tk;knR+=(1.9-knR)*tk;}
  if(ln>0){thL+=((bk?-.75:.25)-thL)*ln;thR+=((bk?-.55:-.15)-thR)*ln;knL+=((bk?.35:.95)-knL)*ln;knR+=((bk?.3:.45)-knR)*ln;}
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
  // S1594 — in the tuck the arms come forward and out round the knees, the body curled over them; in the dash they sweep back behind
  // you (forward against a dash back), the body itself leant into it about its middle (tpAirLean). A swing, a block, the bow and a cast
  // below take the arms over as in any jump
  if(tk>0){aL={x:aL.x+(-1-aL.x)*tk,y:aL.y*(1-tk),z:aL.z+(.55-aL.z)*tk};aR={x:aR.x+(-1-aR.x)*tk,y:aR.y*(1-tk),z:aR.z+(-.55-aR.z)*tk};
    eL+=(-1.1-eL)*tk;eR+=(-1.1-eR)*tk;tx+=.3*tk;}
  if(ln>0){const ax=bk?-.95:.6;aL={x:aL.x+(ax-aL.x)*ln,y:aL.y*(1-ln),z:aL.z+(.3-aL.z)*ln};aR={x:aR.x+(ax-aR.x)*ln,y:aR.y*(1-ln),z:aR.z+(-.3-aR.z)*ln};
    eL+=(-.3-eL)*ln;eR+=(-.3-eR)*ln;}
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
        {sx:[-.22,-3.0,-1.2,-.8],sy:[0,-.12,-.05,0],el:[-.5,-1.2,-.08,-.2],wr:[.35,1.25,1.15,1.0],ty:[0,-.12,0,.05],tx:[0,-.18,.32,.4]}][TP.swRaw||0],VT=R.spear?TP_THRUST:V;
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
      aR={x:L3(...VT.sx.map((v,i)=>i?v*(i===1?mg:1):v)),y:L3(...VT.sy.map((v,i)=>v*(i?mg:1))),z:0};eR=L3(...VT.el);wR=L3(...VT.wr);ty=L3(...VT.ty.map(v=>v*mg));tx=L3(...VT.tx);}
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
  // S1272 — swimming (card F10): under way a breaststroke, still a tread. The stroke's cycle (TP.swPh, a look only, eased by the time
  // swum) reaches the arms forward and glides with the legs drawn out straight, sweeps them out and back, draws the hands in to the chest
  // and the knees up, and kicks out into the next reach; treading, the arms scull out to the sides and the legs pedal. The legs and arms are
  // the driver's, which the builder's body copies (the legs set outright: the gait above sets them so each frame), a two-handed grip
  // let go while you swim (tpGripL); the swimmer's depth is tpUpdate's, unchanged
  TP.swim=activeZoneId==='world'&&typeof WORLD!=='undefined'&&!!WORLD.isSwimming&&WORLD.isSwimming()&&!dead;
  if(TP.swim){
    TP.swPh=((TP.swPh||0)+dt*(st.moving?(st.sprinting?.95:.7):.45))%1;const u=TP.swPh,S=x=>.5-.5*Math.cos(Math.PI*Math.max(0,Math.min(1,x)));
    if(st.moving){const out=S((u-.3)/.3)*(1-S((u-.62)/.18)),inn=S((u-.62)/.16)*(1-S((u-.86)/.14)),kick=S((u-.62)/.2)*(1-S((u-.86)/.12));
      tx=.2;aL={x:-1.55+.85*out+.55*inn,y:0,z:.15+.75*out+.1*inn};aR={x:aL.x,y:0,z:-aL.z};eL=eR=-.1-.5*out-1.7*inn;
      thL=thR=-.15-.75*kick;knL=knR=.1+1.5*kick;}
    else{const a=Math.sin(u*Math.PI*2);tx=.08;aL={x:-.35+.18*a,y:0,z:.72};aR={x:-.35+.18*a,y:0,z:-.72};eL=eR=-.45-.15*a;
      thL=-.35+.3*a;thR=-.35-.3*a;knL=.75-.35*a;knR=.75+.35*a;}
    tpSet(R.thighL,thL,0,0,1);tpSet(R.thighR,thR,0,0,1);tpSet(R.kneeL,knL,0,0,1);tpSet(R.kneeR,knR,0,0,1);}
  // a hit rocks you back
  if(TP.hurtT>0){tx+=.35*(TP.hurtT/.28);}
  // S1435 — an arm still on the gait's swing (its pose the gait's own, nothing above took it) is held under a cloak by the builder's
  // body (hbPose, rig.tpHold); the hold eases in and out at the arm's own rate, so a blow begun mid-stride comes up from the hold
  // standing, the same for an arm left as it hangs, and the blade's rest up and forward, which put the fist 18 cm out through a cloak
  {const HH=TP.hbHold,free=!TP.swim&&!dead&&TP.deadT<.01&&!(typeof climbPose==='function'&&climbPose())&&!(typeof MANTLE!=='undefined'&&MANTLE.t0!=null),
      on=GP&&free,stand=free&&!st.moving&&!air&&!sneak;
    const fL=on&&aL.x===GP.shL&&aL.y===0&&eL===GP.elL||stand&&!aL.x&&!aL.y&&eL===-.2?1:0,
      fR=on&&aR.x===GP.shR&&aR.y===0&&eR===GP.elR||stand&&(!aR.x&&!aR.y&&eR===-.2||R.weapon&&aR.x===-.22&&aR.y===0&&aR.z===-.12&&eR===-.5)?1:0;
    HH.L+=(fL-HH.L)*ka;HH.R+=(fR-HH.R)*ka;if(Math.abs(HH.L-fL)<.002)HH.L=fL;if(Math.abs(HH.R-fR)<.002)HH.R=fR;
    // the walk's forward lean (0.2 rad) carried the shoulders 5 cm out through a cloak that rides the pelvis: under one, while the torso
    // is the gait's, you walk upright (HH.S eases it as the arms' hold does; HH.lean is the lean taken off)
    const lean=GP?GP.spine+(st.sprinting?.08:0):0,fS=R.rig&&R.rig.tpHold&&on&&tx===lean?1:0;if(fS)HH.lean=lean;
    HH.S+=(fS-HH.S)*ka;if(Math.abs(HH.S-fS)<.002)HH.S=fS;tx-=HH.S*(HH.lean||0);}
  tpSet(R.torso,tx,ty,tz,ka);tpSet(R.shL,aL.x,aL.y,aL.z,ka);tpSet(R.shR,aR.x,aR.y,aR.z,ka);tpSet(R.elL,eL,0,0,ka);tpSet(R.elR,eR,0,0,ka);
  // weapon grip follows the forearm; the bow stays vertical in the fist
  tpSet(R.handR,wR,0,0,ka);if(R.shield)tpSet(R.shield,0,shY,shZ,kf);
  // S1550 — a longbow or a war bow carried at rest is tipped forward about the fist (TP_BOW_TIP radians for each whole length past the plain
  // bow's), so its upper limb clears the face; drawn or held at the ready it stands upright again
  if(R.weaponL){const bl=R.weaponL.userData.bowLen||1,tip=R.bow&&bl>1&&!drawing&&!blocking?TP_BOW_TIP*(bl-1):0;R.bowTip=(R.bowTip||0)+(tip-(R.bowTip||0))*ka;
    R.weaponL.rotation.x=-(R.shL.rotation.x+R.elL.rotation.x)+R.bowTip;}
  // S246: a two-handed weapon is held in both hands through every pose: the left wrist is put on the grip
  if(R.gripL&&R.weapon&&TP.deadT<.01&&!TP.swim&&!(typeof castT!=='undefined'&&castT>0))tpGripL(R);
  // the head looks where you look
  tpSet(R.head,Math.max(-.6,Math.min(.5,-pitch*.6))-tx*.3,-ty*.6,0,kf);
  // S743 — Michael's A on #237: up a boarding net hand over hand, three reaches in the climb, the elbows bending as each hand
  // comes down, the knees stepping up the mesh in time, the head tipped up and the torso leaning in; over the rail (the last
  // fifth) the legs straighten and the body comes upright; laid over this frame's pose with a weight that comes up in .08 s
  const CP=(typeof climbPose==='function')?climbPose():null;
  TP.climbW=CP?Math.min(1,(TP.climbW||0)+dt*12):0;
  if(CP){const s=Math.sin(CP.u*3*Math.PI*2),q=Math.max(0,(CP.u-.8)/.2),w=1-q,c=TP.climbW;
    tpSet(R.shL,-2.55*w-.3*q+.45*s*w,-.15*w,.12*w,c);tpSet(R.elL,(-.55-.45*(1+s)/2)*w-.3*q,0,0,c);
    tpSet(R.shR,-2.55*w-.3*q-.45*s*w,.15*w,-.12*w,c);tpSet(R.elR,(-.55-.45*(1-s)/2)*w-.3*q,0,0,c);
    tpSet(R.thighL,(-.95-.35*s)*w-.3*q,0,0,c);tpSet(R.kneeL,(1.35+.3*s)*w+.3*q,0,0,c);tpSet(R.thighR,(-.95+.35*s)*w-.3*q,0,0,c);tpSet(R.kneeR,(1.35-.3*s)*w+.3*q,0,0,c);
    if(R.ankleL){tpSet(R.ankleL,0,0,0,c);tpSet(R.ankleR,0,0,0,c);}
    tpSet(R.torso,.18+.25*q,0,0,c);tpSet(R.head,-.4+.3*q,0,0,c);}
  // S1401 — the mantle's pull (S1385, the systems builder's ask): both hands planted on the ledge a hand's breadth past its edge, shoulder
  // width apart, and kept there while the pull lifts you (tpReach); the arms bend as the shoulders come level with the ledge and press
  // straight under you past it; the right knee comes up onto it as the pull carries you on, and the body stands up over the last fifth,
  // the hands let go. Read from MANTLE and the loop's clock, as the pull itself is.
  tpMantle(R);
  if(R.weapon&&R.weapon.userData.xbow)tpXbowSpanBody(R,dt,st);
  // death: down on the back
  R.root.rotation.x=-TP.deadT*Math.PI/2;R.root.position.y-=TP.deadT*.1;
  tpAirLean(R,ln*AP.f*TP_AIR.pitch,ln*AP.s*TP_AIR.roll);
}
// S1594 — the dash's lean on the whole body, about its middle (TP_AIR.mid of its stature up from the feet), so the head goes into the dash
// and the feet trail: pitched forward as much as the dash runs along your facing (back for a dash back), rolled toward your right as much
// as it runs to it. The root's roll is set every frame here (nothing else sets it); its pitch is the death fall's, added to
const TP_AIR={pitch:.5,roll:.4,mid:.55},_taV=new THREE.Vector3();
function tpAirLean(R,rx,rz){R.root.rotation.z=0;if(!rx&&!rz)return;
  const h=TP_AIR.mid*(R.rig.hb?R.rig.hb.st:SCALE.PERSON_MODEL*(R.root.scale.y||1));
  R.root.rotation.x+=rx;R.root.rotation.z=rz;_taV.set(0,h,0).applyEuler(R.root.rotation);
  R.root.position.x-=_taV.x;R.root.position.y+=h-_taV.y;R.root.position.z-=_taV.z;}
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
// S1401 — the pull's holds on the builder's body: twice, the driver's wrists aimed short by how far the builder's miss, and copied again
const _tmE=[new THREE.Vector3(),new THREE.Vector3()],_tmW=new THREE.Vector3();
function tpHBMantle(R){const H=R.rig.hb,M=R.mantle;if(M.w<=0)return;const wb=[H.P.byName['wrist.L'],H.P.byName['wrist.R']];if(!wb[0]||!wb[1])return;
  _tmE[0].set(0,0,0);_tmE[1].set(0,0,0);
  for(let k=0;k<2;k++){R.root.updateMatrixWorld(true);for(let i=0;i<2;i++){wb[i].getWorldPosition(_tmW);_tmE[i].add(_tmW.sub(M.T[i]));}
    tpMantleArms(R,_tmE);hbPose(R.rig);}}
// S1401 — a two-bone reach for any arm, as tpGripL's for the left: the elbow bent until shoulder to wrist is shoulder to T, then the
// shoulder turned to put the wrist on T; out of reach the arm points straight at it
function tpReach(sh,el,wr,T){
  sh.getWorldPosition(_tgS);const dT=_tgS.distanceTo(T);
  const reach=b=>{el.rotation.set(b,0,0);el.updateMatrixWorld(true);return wr.getWorldPosition(_tgW).distanceTo(_tgS);};
  let lo=-2.5,hi=0;if(reach(hi)>dT){for(let k=0;k<14;k++){const m=(lo+hi)/2;if(reach(m)>dT)hi=m;else lo=m;}reach((lo+hi)/2);}
  wr.getWorldPosition(_tgW);_tgA.subVectors(_tgW,_tgS);_tgB.subVectors(T,_tgS);
  if(_tgA.lengthSq()<1e-8||_tgB.lengthSq()<1e-8)return;
  _tgQ.setFromUnitVectors(_tgA.normalize(),_tgB.normalize());sh.getWorldQuaternion(_tgQ2);_tgQ.multiply(_tgQ2);sh.parent.getWorldQuaternion(_tgQ2);_tgQ.premultiply(_tgQ2.invert());sh.quaternion.copy(_tgQ);
  sh.updateMatrixWorld(true);}
const _tmT=new THREE.Vector3(),_tmQ=[new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion()];
// the pull's pose (S1401): p is the pull's own time, 0 to 1; the ledge's edge is MANTLE's start plus its run less the 0.35 m past it
function tpMantle(R){
  if(typeof MANTLE==='undefined'||MANTLE.t0==null||dead||!R.rig){R.mantle=null;return;}
  const p=Math.max(0,Math.min(1,(FALL.clock-MANTLE.t0)/MANTLE_DUR)),sm=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const dx=MANTLE.x1-MANTLE.x0,dz=MANTLE.z1-MANTLE.z0,d=Math.hypot(dx,dz)||1,fx=dx/d,fz=dz/d,e=Math.max(0,d-.35)+.1;
  const s=R.root.scale.x||1,knee=sm((p-.4)/.3)*(1-sm((p-.8)/.2)),stand=sm((p-.8)/.2),hang=1-sm((p-.35)/.3);
  // legs: hanging a little bent, then the right knee up onto the ledge and the left trailing, then standing
  tpSet(R.thighL,-.25*hang+.15*knee,0,0,1);tpSet(R.kneeL,.45*hang+.35*knee,0,0,1);
  tpSet(R.thighR,-.25*hang-1.55*knee,0,0,1);tpSet(R.kneeR,.45*hang+1.9*knee,0,0,1);
  if(R.ankleL){tpSet(R.ankleL,0,0,0,1);tpSet(R.ankleR,.3*knee,0,0,1);}
  // the body bows forward over the ledge as it comes up past the hands, so they stay on it, and straightens as it stands
  tpSet(R.torso,.12+1.05*sm((p-.2)/.35)*(1-stand),0,0,1);tpSet(R.head,-.25+.35*sm((p-.2)/.35)*(1-stand),0,0,1);
  // arms: the hands on the ledge until they let go over the last part of the pull
  R.root.updateMatrixWorld(true);
  R.mantle={w:1-sm((p-.72)/.2),T:[0,1].map(i=>{const side=i?1:-1;
    return new THREE.Vector3(MANTLE.x0+fx*e-fz*side*.2*s,MANTLE.y1+.04*s,MANTLE.z0+fz*e+fx*side*.2*s);}), /* the body's right is (−fz, fx) from its facing (fx, fz) */
    q:[R.shL.quaternion.clone(),R.elL.quaternion.clone(),R.shR.quaternion.clone(),R.elR.quaternion.clone()]};
  tpMantleArms(R,null);
}
// the arms onto the pull's two holds (R.mantle, set by tpMantle this frame); err, the builder's wrists less the holds, aims the driver's
// wrists that much short so that the builder's body, whose arms are its own length, puts its wrists on them (tpHBPose)
function tpMantleArms(R,err){const M=R.mantle;if(!M||M.w<=0)return;
  const arms=[[R.shL,R.elL,R.handL],[R.shR,R.elR,R.handR]];
  for(let i=0;i<2;i++){const[sh,el,wr]=arms[i];_tmT.copy(M.T[i]);if(err)_tmT.sub(err[i]);
    tpReach(sh,el,wr,_tmT);
    if(M.w<1){_tmQ[0].copy(sh.quaternion);_tmQ[1].copy(el.quaternion);sh.quaternion.slerpQuaternions(M.q[i*2],_tmQ[0],M.w);el.quaternion.slerpQuaternions(M.q[i*2+1],_tmQ[1],M.w);sh.updateMatrixWorld(true);}}
}
// the body for what is worn now, built (or its builder's body carried over) when the kit or the look has changed; first person's hands
// are cut from it too (fpHBFist), so it is kept current in either view when the hands are built
function tpEnsure(){const sig=workWield(tpSig);if(!TP.rig||sig!==TP.sig){const old=TP.rig;TP.rig=workWield(()=>tpBuild(null,null,old));TP.sig=sig;TP.armSig=tpArmSig();if(old){TP.rig.root.rotation.copy(old.root.rotation);tpDispose(old);}}return TP.rig;}
// what the hands' cut depends on: the look and what is worn, not what is held (a weapon sheathed after five seconds at peace rebuilds the
// view model with an empty hand; that must not build the body again)
function tpArmSig(){const L=lookNow();let pp='gatelander';try{pp=WORLD.playerPeople();}catch(e){}
  return (L?JSON.stringify(L):'')+['head','chest','hands','legs','feet','back'].map(s=>EQ[s]?(EQ[s].name||'?')+(EQ[s].col!=null?'~'+EQ[s].col:''):'-').join('|')+'#'+pp+'#'+(playerName||'')+'#'+playerArchetype;}
// S1520 — the pick and the hatchet in hand while you work a vein or a tree (50-travel.js's MINE and CHOP): shown in both views in place
// of what you carry (buildViewmodel and tpBuild take WORK_TOOL's piece as the weapon for the call, as the sheath's view does), with an
// overhead chop each strike, begun so that its hit (ANIM_PARAMS.swing.impactPoint) lands on the strike. A war axe at a tree is its own
// tool and swings as it is. Nothing here decides an outcome: the strikes are tickMining's and tickFelling's, on their own clocks.
const WORK_TOOL={pick:{name:'Pick',weaponShape:'pick',twoHand:true,matCol:0x7a7e86,matGuard:0x5a3a22},hatchet:{name:'Hatchet',weaponShape:'hatchet',matCol:0x9a9ea6,matGuard:0x5a3a22}};
const WORK_SWING=.72;
const WORK={tool:null,axe:null,swung:false,left:1e9,n:0};
function workKind(){if(typeof MINE!=='undefined'&&MINE)return 'pick';if(typeof CHOP!=='undefined'&&CHOP)return chopTool()==='axe'?'axe':'hatchet';return null;}
function workShown(){const k=WORK.tool;return k==='axe'?WORK.axe:k?WORK_TOOL[k]:null;}
// fn run with the work's piece as the weapon in hand, and the real one put back after
function workWield(fn){const t=workShown(),w=EQ.weapon;if(!t||t===w)return fn();EQ.weapon=t;try{return fn();}finally{EQ.weapon=w;}}
function workTick(){const k=workKind();
  if(k!==WORK.tool){WORK.tool=k;WORK.axe=k==='axe'?EQ.weapon:null;WORK.swung=false;WORK.left=1e9;
    if(typeof sheathView==='function')sheathView();else if(typeof buildViewmodel==='function')buildViewmodel();}
  if(!k)return;
  const left=MINE?MINE.t:CHOP.tm;if(left>WORK.left+.05)WORK.swung=false;WORK.left=left;
  if(WORK.swung||left>ANIM_PARAMS.swing.impactPoint*WORK_SWING||swingT>0||(typeof SWING!=='undefined'&&SWING)||typeof vmSword==='undefined'||!vmSword)return;
  WORK.swung=true;WORK.n++;swingT=WORK_SWING;const u=vmSword.userData;u.swingMax=WORK_SWING;u.swingVariant=2;u.swingIsPower=false;}
function tpUpdate(dt,st){
  workTick();
  if(!thirdPerson){
    if(TP.rig&&TP.rig.root.visible)TP.rig.root.visible=false;
    if(TP.hidVM){TP.hidVM=false;VM_SCENE.visible=true;}
    if(typeof fpHBCheck==='function')fpHBCheck();
    return;}
  if(!TP.hidVM){TP.hidVM=true;VM_SCENE.visible=false;}
  tpEnsure();
  const R=TP.rig;if(!scene)return;
  if(R.root.parent!==scene){if(R.root.parent)R.root.parent.remove(R.root);scene.add(R.root);}
  tpCamera(dt,st.camY);
  // on a ship's deck or a platform jumpY already carries the height
  R.root.position.set(px,jumpY,pz);R.root.rotation.y=yaw+Math.PI;
  /* S880 (F2a) — swimming, the body sinks to its shoulders: the head's top a quarter metre over the sea; S1084 (F2b) reads the swimmer's line (SWIM_Y, 1.45 under it now) */
  /* F10 (S1253): the builder's body is hb.st tall in the world (its genome's stature), not PERSON_MODEL × the root's scale (that is hb.st × PW.BODY, its crown 0.44 over the sea) */
  if(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.isSwimming())R.root.position.y=jumpY+(SEA_Y+.25-SWIM_Y)-(R.rig.hb?R.rig.hb.st:SCALE.PERSON_MODEL*(R.root.scale.y||1));
  {const cp=(typeof climbPose==='function')?climbPose():null;if(cp)R.root.rotation.y=cp.ry;} /* S743 — on a net the body faces the hull */
  // S154 — the stride follows the ground; S162 — and runs past PW.RUN.on heights a second, as the townsfolk do
  {let d=TP.lx==null?0:Math.hypot(px-TP.lx,pz-TP.lz);TP.lx=px;TP.lz=pz;if(d>1.5)d=0;const s=R.root.scale.x||1,v=dt>0?d/dt:0;
    TP.v=(TP.v||0)+(v-(TP.v||0))*(1-Math.exp(-dt/.15));
    if(!TP.run&&TP.v/s>PW.RUN.on)TP.run=true;else if(TP.run&&TP.v/s<PW.RUN.off)TP.run=false;
    TP.gph=((TP.gph||0)+d/(pwCycle({walk:1-(TP.rw||0),run:TP.rw||0})*s))%1;
    TP.rw=(TP.rw||0)+((TP.run?1:0)-(TP.rw||0))*(1-Math.exp(-dt/.11));}
  tpPose(R,dt,st);
  if(R.rig.B.cloak||R.rig.B.hairB)peopleSwing(R.rig,dt); // S277 — your own back hair (and a cloak, should you wear one) swings as the townsfolk's (S267)
  tpRollTumble(R,st.roll);
  tpHBPose(R); // F10 — the builder's body follows the driver
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
window.addEventListener('wheel',e=>{if(!thirdPerson||!started||dead)return;if(invOpen||shopOpen||lootOpen||stashOpen||hubOpen)return;if(typeof MAP!=='undefined'&&MAP.mode==='map')return;TP.want=Math.max(SCALE.TP_MIN,Math.min(SCALE.TP_MAX,TP.want+(e.deltaY>0?.3:-.3)));try{localStorage.setItem('og_tp_m',String(TP.want));}catch(e2){}},{passive:true});
