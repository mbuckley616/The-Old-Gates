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
function tpSig(){const L=lookNow();const k=(L?JSON.stringify(L):'')+['head','chest','hands','legs','feet','weapon','offhand','amulet','ammo','back'].map(s=>EQ[s]?(EQ[s].name||'?')+(EQ[s].col!=null?'~'+EQ[s].col:''):'-').join('|');let pp='gatelander';try{pp=WORLD.playerPeople();}catch(e){}return k+'#'+pp+'#'+(playerName||'')+'#'+playerArchetype+'#'+tpPackKind()+(tpSheathed()?'#sheathed':'');}
// S2217 — the pack in the bag (Michael's B on #1504, the systems builder's packItem), drawn on your back by island: the Gatelands' wicker
// creel, the Mark's birch pack frame with its hide bundle, Aurenne's striped saddle-roll (people.js's D.backpack, buildBackpack)
const TP_PACK={gatelands:{kind:'creel',col:[.92,.74,.48]},mark:{kind:'frame',col:[.42,.3,.2]},aurenne:{kind:'roll',col:[.55,.16,.1]}};
function tpPackKind(){if(typeof BAG==='undefined')return '';const it=BAG.find(b=>b&&b.tool==='pack');return it?(TP_PACK[it.pack]?it.pack:'gatelands'):'';}
function tpBox(w,h,d,col,parent,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:col}));m.position.set(x||0,y||0,z||0);parent.add(m);return m;}
function tpGroup(parent,x,y,z){const g=new THREE.Group();g.position.set(x||0,y||0,z||0);g.rotation.order='YXZ';parent.add(g);return g;}
// ── weapons: built along +y from the grip (the hand's local "up" once the forearm is raised) ──
function tpWeapon(it){const g=new THREE.Group();if(!it)return g;
  const blade=tpHex(it.matCol,0xb8bcc4),guard=tpHex(it.matGuard,0x6a5030),grip=0x3a2616;const sh=it.weaponShape||(/bow/i.test(it.name)?'bow':/staff/i.test(it.name)?'staff':/axe/i.test(it.name)?'axe':/mace|hammer|club/i.test(it.name)?'mace':/dagger|knife/i.test(it.name)?'dagger':'sword');
  // S227 — the weapon kit (Michael's A on Session 220), tinted by the item's own metal, guard and glow; the bow's wood is its
  // material colour, and it turns to put the string on your side of the grip, as the box bow had it
  // S1856 — a staff, wand or maul that is an implement is the kit's implement in its island's make with its school's emblem (implKind)
  const im=typeof implementOf==='function'?implementOf(it):null;if(im==='staff'||im==='wand'||im==='maul'){g.add(buildWeapon(implKind(it)));g.userData.kit='impl';return g;}
  let kind={scimitar:'cutlass',flail:'flail',greatclub:'greatclub',greataxe:'greataxe',claymore:'claymore'}[sh]||(WPN_KINDS.includes(sh)?sh:'sword');
  if((kind==='sword'||kind==='cutlass')&&it.swordMake&&window.OG_LOOK==='new'&&typeof HB!=='undefined'&&HB.SWORDS&&HB.SWORDS[it.swordMake])kind='sword:'+it.swordMake; /* S2118 — the make's own blade (#1425 B) */
  if(kind==='spear'&&it.spearHead&&it.spearHead!=='leaf'&&window.OG_LOOK==='new'&&typeof HB!=='undefined'&&HB.SPEAR_HEADS&&HB.SPEAR_HEADS[it.spearHead])kind='spear:'+it.spearHead; /* S2182 — its island's head (S2180) */
  if(kind==='crossbow'&&it.crossbowMake&&window.OG_LOOK==='new'&&typeof HB!=='undefined'&&HB.CROSSBOWS&&HB.CROSSBOWS[it.crossbowMake])kind='crossbow:'+it.crossbowMake; /* S2185 — its island's make (S2180) */
  const xb=/^crossbow(:|$)/.test(kind),w=buildWeapon(xb?kind.replace('crossbow','crossbowbare'):kind==='bow'&&BOW_LEN[it.bowKind]?it.bowKind:kind,{tint:{metal:blade,guard,glow:tpHex(it.matGlow,0x88c0ff),wood:sh==='bow'?tpHex(it.matCol,0x6a4428):null}});g.add(w);
  if(kind==='bow'){w.rotation.y=Math.PI;g.userData.bow=true;g.userData.bowLen=bowLenOf(it);} /* S1550 — a longbow or a war bow is the kit's own, longer */if(xb){w.rotation.x=Math.PI;g.userData.xbow=xbowRig(w,it.crossbowMake&&kind!=='crossbow'?it.crossbowMake:null);}g.userData.kit=kind; /* S1476 — its string and bolt drawn by the span */
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
    // muscle cuirass and the plate of Steel up as its sheet metal (people.js's D.plate), Iron's mail as it was (S2547: the wood's boards matte, D.scales 'wood')
    if(P.fam==='lamellar')D.scales='wood';else if(P.fam==='muscle'||P.fam==='plate')D.plate=P.fam;}}
  // S1256 — the heavy line's helm is the builder's helm of its tier (helms.js; Michael's C of 18 Oct: from Steel up the face shut),
  // fitted to the player's own head; Iron's is the kit's kettle helm, in the tier's metal
  if(AR&&AR.head&&!AR.head.line){D.helm=hbRGB(AR.head.metal);D.tier=AR.head.tier;}else if(o.hd&&!AR&&!tpIsCloth(o.hd))D.helm=hbRGB(o.helmCol);
  // S1263 — gauntlets and greaves by family, as the old kit drew them (people.js's vambrace, gloves, greaves and cuisses): Wooden's boards
  // (the scales in the wood's tone) over leather gloves, Bronze's sheet over leather, Iron's mail, Steel up plate with a knee cop, the
  // cuisses up the thigh with mail and plate; the light line's bracers and gloves in its leather; gloves of no metal in their own colour
  const fam=P=>P.fam==='lamellar'?'wood':P.fam==='mail'?'mail':'sheet',col=P=>hbRGB(P.fam==='lamellar'?new THREE.Color(P.metal).lerp(new THREE.Color(0xc89a62),.3).getHex():P.metal);
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
  // S2109 — a robe's raised hood takes its tier's dressing (helms.js's hoodDress; OG-052's antlered and haloed hoods on the high robes):
  // Mithril's and Obsidian's a ring, Adamant's antlers, Draconic's crescent, Demonic's horns, Cosmic's halo; the low tiers' hoods stay plain
  if(Lh&&Lh.line==='robe'&&Lh.tier)D.tier=Lh.tier;
  {const Pk=TP_PACK[o.pack];if(Pk){D.backpack=Pk.col;D.backpackKind=Pk.kind;}}
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
  const w0=EQ.weapon,shW=tpSheathed()?w0:null,w=shW?null:w0,oh=EQ.offhand,bowW=!!(w&&w.weaponShape==='bow');g.fists={R:!w,L:!oh&&!bowW};
  const rig=buildPerson(g,{noLod:true});PEOPLE_RIGS.delete(rig); // tpPose drives this one, not tickPeople
  const B=rig.B;for(const k in B){if(B[k].isBone)B[k].rotation.order='YXZ';}
  rig.mesh.castShadow=false;rig.mesh.userData.tp=true;
  const root=rig.root;root.rotation.order='YXZ';
  const R={root,rig,hips:B.hips,hipsY0:PW.HIPS,thighL:B.thL,thighR:B.thR,kneeL:B.knL,kneeR:B.knR,ankleL:B.anL,ankleR:B.anR,torso:B.spine,head:B.head,shL:B.shL,shR:B.shR,elL:B.elL,elR:B.elR,handL:B.wrL,handR:B.wrR};
  // what the hands hold (the weapon kit itself is a later pass)
  // S1458 — a crossbow is carried in the right fist alone, by the wrist of its tiller, its prod down behind (people.js carries it
  // point down): two hands on it held it up before the face as a claymore, the prod over the head
  R.twoH=!!(w&&w.twoHand&&w.weaponShape!=='bow'&&w.weaponShape!=='crossbow');R.bow=bowW;R.wItem=w0;R.unarmed=!w0&&!oh; /* S2451 — a sheathed weapon is a walker's empty hand, not the fist-fighter's guard */R.spear=!!(w&&w.weaponShape==='spear');
  const grip=(hand,m)=>{m.position.set(0,-.04,.008);hand.add(m);return m;};
  if(w){const wm=tpWeapon(w);
    // S246: where the left hand goes on a two-handed grip: a hand's width from the right fist towards the pommel (the
    // shorter end of the weapon from the fist), in the weapon's own frame
    if(R.twoH){const bb=new THREE.Box3().setFromObject(wm),dn=Math.abs(bb.min.y)<Math.abs(bb.max.y)?-1:1,end=Math.abs(dn<0?bb.min.y:bb.max.y);R.gripL=new THREE.Vector3(0,dn*Math.max(.05,Math.min(.1,end*.7)),0);}
    const wb=w.enchant&&w.enchant.col!=null?new THREE.Box3().setFromObject(wm):null;
    if(R.bow){wm.rotation.set(0,0,0);R.weaponL=grip(R.handL,wm);}else{wm.rotation.set(Math.PI/2,0,0);R.weapon=grip(R.handR,wm);}
    if(wb&&!wb.isEmpty())tpMotes(R,wm,w.enchant.col,wb);}
  /* S2451 — a sheathed weapon is built as in the hand and kept on the driver's hips, hidden (disposed with the body); the builder's body
     wears a copy at the hip or on the back (tpSheath). The hand is empty and the arms hang as a bare-handed walker's */
  if(shW){const wm=tpWeapon(shW);wm.visible=false;R.hips.add(wm);R.sheathW=wm;}
  /* S2472 — a blade in the hand leaves its scabbard on the body, empty: the same worn group (scabbard, frog, baldric), its blade hidden */
  else if(w&&!bowW){const wm=tpWeapon(w);if(tpScabOn(wm)){wm.visible=false;R.hips.add(wm);R.sheathW=wm;R.scabOnly=true;}}
  R.sheathed=!!shW;
  R.shield=null;R.torch=null;
  if(oh&&oh.shieldType==='shield'){const c=tpHex(oh.matCol,0x8a6030),rim=tpHex(oh.matGuard,0x4a3418);const big=/tower|kite/i.test(oh.name||''),round=/buckler|round/i.test(oh.name||'');const sg=new THREE.Group();
    // S227 — the kit's shields: planked and round with a rim and boss, the kite, or (S231) the tower shield; the face is
    // the item's material colour, the rim and boss its guard's
    const kk=round?'round':big&&!/kite/i.test(oh.name||'')?'tower':'kite';const k=buildWeapon(kk,{tint:{face:c,guard:rim,metal:rim}});if(round&&/buckler/i.test(oh.name||''))k.scale.setScalar(.8);sg.add(k);sg.userData.kit=kk; // S231 — a tower shield its own shape
    sg.position.set(.07,-.08,0);R.elL.add(sg);R.shield=sg;
    if(oh.enchant){const sb=new THREE.Box3().setFromObject(k);if(!sb.isEmpty())tpMotes(R,sg,oh.enchant.col!=null?oh.enchant.col:tpHex(oh.matGlow,TP_MOTE.armour),sb);}}
  else if(oh&&oh.torchType==='torch'){const tg=new THREE.Group();tpBox(.03,.3,.03,0x4a3018,tg,0,.1,0);const f=new THREE.Mesh(new THREE.ConeGeometry(.045,.12,5),new THREE.MeshBasicMaterial({color:0xff8830}));f.position.y=.3;tg.add(f);tg.rotation.x=Math.PI/2;R.torch=grip(R.handL,tg);}
  // S1856 — the tome and the orb are the kit's (implKind): the tome open-handed, its covers to the sides; the orb's
  // grip in the closed left fist as a torch's is, the glass ahead. How each is held, and in first person, is the next session's (#1111 B)
  else if(oh&&typeof implementOf==='function'&&(implementOf(oh)==='tome'||implementOf(oh)==='orb')){const tg=new THREE.Group();tg.add(buildWeapon(implKind(oh)));tg.userData.kit='impl';
    if(implementOf(oh)==='tome'){tg.rotation.y=Math.PI/2;tg.position.set(0,-.08,-.04); /* S1862 — in the palm, the hand on its fore-edge */R.handL.add(tg);R.tome=tg;}else{tg.rotation.x=Math.PI/2;R.orbG=implGlowOwn(tg);R.orb=grip(R.handL,tg);}}
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
      cloak:K?{col:EQ.back.col!=null?EQ.back.col:K.col,cut:K.cut,hood:!!K.hood,fur:K.fur,trim:K.trim}:null,pack:tpPackKind()});
    // F10, part two — a change of kit that leaves the dressed genome as it was (a weapon, a shield, a ring) keeps the builder's body
    // that was built for it: carried over from the body this one replaces (reuse, TP.rig) onto the new driver, not built again
    const key=JSON.stringify(rig.hbG),old=reuse&&reuse.rig&&reuse.rig.hb&&reuse.hbKey===key?reuse:null;R.hbKey=key;
    const t0=performance.now();
    if(old){const H=old.rig.hb;tpDrawEnd(old);if(old.hbHeld)for(const h of old.hbHeld)h.c.removeFromParent();old.hbHeld=null;
      /* S2471 — a draw: the worn copy (scabbard, frog, baldric) stays on the carried-over body while the hand takes the blade from it (tpDrawTick) */
      if(old.hbSheath&&old.sheathed&&!shW&&w&&old.wItem===w0&&tpDrawOn()){R.tpDraw={way:'draw',G:old.hbSheath,at:old.sheathAt,t0:fpDrawNow()};old.hbSheath=null;}
      if(old.hbSheath){tpSheathDrop(old.hbSheath);old.hbSheath=null;}old.rig.hb=null;old.rig.mesh.visible=true;
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
      for(const [o,sd,grip] of [[R.weapon,'R',true],[R.weaponL,'L',true],[R.shield,'L',false],[R.torch,'L',true],[R.orb,'L',true],[R.tome,'L',false]]){if(!o)continue;
        const c=new THREE.Group();c.matrixAutoUpdate=false;c.name='held';c.add(tpHBCopy(o,true));rig.hb.root.add(c);
        const s=side(sd);R.hbHeld.push({o,c,f:grip?[2,3,4,5].map(f=>by[`finger${f}-2.${s}`]).filter(Boolean):null,arm:[B['el'+sd],B['wr'+sd],by['lowerarm01.'+s],by['wrist.'+s]]});}
      // Michael's D on #99: an empty hand is a folded fist, and a hand that holds something closes on it; a tome is held open-handed
      tpCloakUntent(rig.hb);if(R.sheathW)tpSheath(R,shW||w);
      if(R.scabOnly&&R.hbSheath){R.hbSheath.children[0].visible=false;if(R.tpDraw&&R.tpDraw.way==='draw'){tpSheathDrop(R.tpDraw.G);R.tpDraw.G=R.hbSheath;}} /* the draw's blade comes out of the scabbard that stays */
      /* S2471 — a sheathe: the blade rides in the fist (a carrier on an anchor where the hand held it) until the hand has put it in (tpDrawTick) */
      if(old&&R.hbSheath&&!old.sheathed&&old.weapon&&old.wItem===shW&&tpDrawOn()){const a=new THREE.Group();a.position.set(0,-.04,.008);a.rotation.set(Math.PI/2,0,0);R.handR.add(a);
        const c=new THREE.Group();c.matrixAutoUpdate=false;c.name='held';const k=tpHBCopy(R.sheathW,true);k.visible=true;c.add(k);rig.hb.root.add(c);
        const h={o:a,c,f:[2,3,4,5].map(f=>by[`finger${f}-2.${side('R')}`]).filter(Boolean),arm:[B.elR,B.wrR,by['lowerarm01.'+side('R')],by['wrist.'+side('R')]],draw:true};R.hbHeld.push(h);
        R.tpDraw={way:'sheathe',G:R.hbSheath,at:R.sheathAt,t0:fpDrawNow(),h,a,gl:old.gripL?old.gripL.clone():null};} /* S2484 — the left grip of a two-hander, which the left hand leaves */
      if(R.tpDraw)R.tpDraw.G.children[0].visible=false;
      tpCloakTent(R); /* S2478 — the cloak lifted over what is worn at the hip */
      hbCloseFist(by,side('R'));hbThumb(by,side('R'));R.hbHook=R.bow?tpHBHookOf(by,side('R')):null;if(!R.tome){hbCloseFist(by,side('L'));hbThumb(by,side('L'));}else for(let f=1;f<=5;f++)for(let j=1;j<=3;j++){const b=by[`finger${f}-${j}.${side('L')}`];if(b)b.quaternion.identity();} /* a body carried over may have closed it */
      root.traverse(o=>{if(o.isMesh)o.userData.tp=true;});}}
  if(!R.trueK)tpTrue(R);
  return R;}
// S1509 — a knife, a spear or a crossbow at its true size in the hand (wpnTrue): the kit's piece under the carried group, and with it the
// group's other things drawn in that piece's frame (an enchantment's motes, the left hand's place on a two-handed grip), by the body's scale
// S1862 — the off hand's implement each frame (tpPose): the orb's light, brighter raised or in a cast and pulsing while it keeps a word.
// Returns what tpPose needs for the left arm, or null with neither in hand
// the left arm's poses, [shoulder x, y, z, elbow] (negative x raises the arm forward): the raised orb's forearm level, so the glass stands
// upright over the fist; the tome read, held up before the chest with its emblemed cover to the foe
const TP_IMPL={rest:[-.2,-.8],raised:[-1.1,-.45,0,-.45],kept:[.7,.1,.35,-1],read:[-.6,-.3,0,-1.2]};
function tpImplHold(R){if(!R.orb&&!R.tome)return null;
  const raised=!!R.orb&&typeof orbRaised==='function'&&orbRaised(),kept=!!R.orb&&typeof ORB_KEPT!=='undefined'&&!!ORB_KEPT,cast=typeof castT!=='undefined'&&castT>0;
  if(R.orbG)implGlowSet(R.orbG,kept?1.6+.25*Math.sin(performance.now()/1000*5):raised||cast?1.25:1);
  return {orb:!!R.orb,raised,kept};}
function tpTrue(R){for(const o of [R.tome,R.orb])if(o&&o.userData.kit==='impl'&&o.children[0])wpnTrue('impl',o.children[0],R.root);const W=R.weapon||R.weaponL,k=W&&W.children[0];R.trueK=1;if(!k||!wpnIsTrue(W.userData.kit))return;
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
// S2451 — the weapon sheathed (74-strikes.js's H, or five seconds at peace) is worn, not held: a blade or a wand at the left hip, its grip
// before the belt and the point down and back; an axe, a mace or a hatchet through the belt at the left hip, head up; anything longer
// across the back, a blade's hilt over the right shoulder and a haft's head there. The copy rides the builder's own bone (spine05 for the
// hip, spine02 for the back), whose bind turn is none, so its place is in the bind's metres: the belt's height and the hip's side from the
// belt and the garments under it (inside the hip joint's 13 cm: the bind's arms hang beside it), the back's surface (a cloak, a pack) from what is worn there, measured once a build. A look only.
const TP_SHEATH={hip:{dir:[.06,-.85,-.52],at:.06,out:0,fwd:.05},belt:{dir:[-.12,1,.18],up:.6,out:.03,fwd:.04},
  back:{blade:[.5,-.86,0],haft:[-.5,.86,0],gap:.012}};
// S2472 — whether a weapon is worn in a scabbard when sheathed (tpSheath's own rule): a blade at the hip, a claymore or a longsword on the back
function tpScabOn(W){const k=(W.userData.kit||'').split(':')[0];return /^(dagger|sword|cutlass|longsword|claymore)$/.test(k);}
function tpSheathed(){return typeof SHEATHED!=='undefined'&&SHEATHED&&!!EQ.weapon&&EQ.weapon===_sheathedItem;}
function tpSheathAt(W,it){const k=(W.userData.kit||'').split(':')[0];if(k==='impl')return implementOf(it)==='wand'?'hip':'back';
  return /^(dagger|sword|cutlass|longsword)$/.test(k)?'hip':/^(axe|mace|hatchet|flail)$/.test(k)?'belt':'back';}
const _tsM=new THREE.Matrix4(),_tsV=new THREE.Vector3(),_tsB=new THREE.Box3();
function tpSheathFit(H){const P=H.P,sk=P.skeleton,bind=b=>_tsM.copy(sk.boneInverses[sk.bones.indexOf(b)]).invert(),bp=b=>new THREE.Vector3().setFromMatrixPosition(bind(b));
  const p5=bp(P.byName.spine05),p2=bp(P.byName.spine02),xL=P.byName['upperleg01.L']?bp(P.byName['upperleg01.L']).x+.13:.25,F={p5,p2,yB:p5.y+.05,side:.14,back:p2.z-.12};
  const belt=H.full.find(m=>m.isSkinnedMesh&&m.name==='belt');
  const each=(m,fn)=>{const pa=m.geometry.attributes.position,ix=m.geometry.index,n=ix?ix.count:pa.count;for(let i=0;i<n;i++){const j=ix?ix.getX(i):i;fn(pa.getX(j),pa.getY(j),pa.getZ(j));}};
  if(belt&&belt.material&&belt.material.color)F.leather=belt.material.color.getHex(); /* S2463 — the frog and the baldric are cut from the belt's own leather */
  if(belt){let lo=1e9,hi=-1e9;each(belt,(x,y,z)=>{if(Math.abs(z)<.12&&x>0){lo=Math.min(lo,y);hi=Math.max(hi,y);}});if(hi>lo)F.yB=(lo+hi)/2;
    /* S2459: the belt's outside where the frog hangs (the side of the hip, not the buckle's front) and its top. The kit's belt is cut from
       the shell's triangles, which overrun the 4.4 cm band its leather draws (11 cm of points at the hip), so the top is the band's, about yB */
    const zf=p5.z+TP_SHEATH.hip.fwd;let xo=0;each(belt,(x,y,z)=>{if(Math.abs(z-zf)<.03&&Math.abs(y-F.yB)<.022)xo=Math.max(xo,x);});if(xo>0){F.xBelt=xo;F.yBt=F.yB+.022;}}
  let side=0,back=0;
  for(const m of H.full){if(m.isSkinnedMesh){if(/hair|brow/.test(m.name))continue;const cl=m.name==='cloak';
      each(m,(x,y,z)=>{if(!cl&&x<xL&&Math.abs(y-F.yB)<.05&&Math.abs(z-p5.z)<.1&&x>side)side=x; /* the bind's arms hang out past the hip: not the hip */if(Math.abs(x)<.12&&Math.abs(y-p2.y)<.16&&z<back)back=z;});continue;}
    // a piece on a bone (the pack, its straps): its box in the bind's frame, by way of the bone it hangs from
    let b=m,L=new THREE.Matrix4();while(b&&!b.isBone){b.updateMatrix();L.premultiply(b.matrix);b=b.parent;}
    if(!b||b.name==='head'||!m.geometry)continue;if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
    _tsB.copy(m.geometry.boundingBox).applyMatrix4(L.premultiply(bind(b)));
    if(_tsB.min.x<.12&&_tsB.max.x>-.12&&_tsB.min.y<p2.y+.16&&_tsB.max.y>p2.y-.16&&_tsB.min.z<back)back=_tsB.min.z;}
  if(side>0)F.side=side;if(back<0)F.back=back;return F;}
function tpSheath(R,it){const W=R.sheathW,H=R.rig.hb;if(!W||!H)return;const k=W.children[0];if(k&&wpnIsTrue(W.userData.kit))wpnTrue(W.userData.kit,k,R.root);
  const s=R.root.scale.x,at=tpSheathAt(W,it),T=TP_SHEATH,F=tpSheathFit(H),par=W.parent;if(par)par.remove(W);W.updateMatrixWorld(true);_tsB.setFromObject(W);if(par)par.add(W); /* its own frame's box */
  const lo=_tsB.min.y*s,hi=_tsB.max.y*s,th=(_tsB.max.z-_tsB.min.z)*s,X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
  let d,xa,pos,bone;
  let bald=null;
  if(at==='back'){const blade=/^(claymore|longsword)$/.test((W.userData.kit||'').split(':')[0]);d=new THREE.Vector3(...(blade?T.back.blade:T.back.haft)).normalize();
    bone=H.P.byName.spine02;pos=new THREE.Vector3(0,F.p2.y+.02,F.back-th/2-T.back.gap);
    /* S2462 — a blade on the back hangs from a baldric, and lies on the strap's back run: its axis in the strap's plane, its leather on the strap */
    if(blade&&(bald=tpBaldric(H,F))){const B=bald.userData.baldric,e1=new THREE.Vector3(...B.e1),o=new THREE.Vector3(...B.o);d=e1.clone().negate();
      pos.copy(o).addScaledVector(e1,(F.p2.y+.02-o.y)/e1.y);pos.z=Math.min(B.zBack,F.back)-th/2;}
    xa=new THREE.Vector3().crossVectors(Z,d).normalize();pos.addScaledVector(d,-(lo+hi)/2);}
  else{const S=T[at];d=new THREE.Vector3(...S.dir).normalize();xa=new THREE.Vector3().crossVectors(d,X).normalize();bone=H.P.byName.spine05;
    pos=new THREE.Vector3(F.side+S.out,F.yB,F.p5.z+S.fwd).addScaledVector(d,at==='hip'?-S.at:-S.up*hi);}
  const za=new THREE.Vector3().crossVectors(xa,d),c=new THREE.Group();c.name='sheathed';c.add(tpHBCopy(W,true));c.children[0].visible=true;
  c.quaternion.setFromRotationMatrix(_tsM.makeBasis(xa,d,za));c.scale.setScalar(s);
  // the bone's own place at the bind: the piece's place is about it
  const sc=(at==='hip'||at==='back'&&/^(claymore|longsword)$/.test((W.userData.kit||'').split(':')[0]))?tpScabbard(W,it):null; /* S2456 — a blade worn goes in a scabbard */
  if(sc){const m=new THREE.Mesh(sc.geo,[WPN_MAT.matte,WPN_MAT.metal]);m.name='scabbard';c.add(m);const o=Math.max(0,sc.ht*s-th/2);if(at==='hip')pos.x+=o;else pos.z-=o;} /* the leather is thicker than the blade: out from the body by the difference */
  if(bald){if(sc)c.userData.baldric=bald;else{bald.removeFromParent();bald.geometry.dispose();}}
  c.position.copy(pos).sub(at==='back'?F.p2:F.p5);if(sc&&at==='hip'){const f=tpFrog(c,sc,F);if(f)c.add(f);}
  bone.add(c);c.traverse(o=>{if(o.isMesh)o.userData.tp=true;});R.hbSheath=c;R.sheathAt=at;R.scabbard=sc;}
// S2459 — the frog (S2456's owed note: the scabbard rode at the belt with nothing tying it on). A loop of leather round the scabbard just
// under the locket, and a strap from the loop's flat against the hip up the outside of the belt, over its top and down behind it. Built
// per body in the bone's bind metres (the belt's place is the body's), then carried into the sheathed group's frame; its own geometry,
// disposed with the group (tpSheathDrop)
const TP_FROG={h:.026,t:.003,gap:.0015,w:.024,below:.012,over:.006,behind:.022,col:0x34200f};
function tpFrog(c,sc,F){if(F.yBt==null)return null;const K=TP_FROG;c.updateMatrix();const M=c.matrix,Mi=new THREE.Matrix4().copy(M).invert(),s=c.scale.x;
  const R=sc.R,yf=sc.mouth+TP_SCAB_K.locket+K.below/s+K.h/s/2;let i=1;while(i<R.length-1&&R[i].y<yf)i++;const A=R[i-1],B=R[i],t=Math.min(1,Math.max(0,(yf-A.y)/((B.y-A.y)||1)));
  const r={cx:A.cx+(B.cx-A.cx)*t,cz:A.cz+(B.cz-A.cz)*t,hw:A.hw+(B.hw-A.hw)*t,ht:A.ht+(B.ht-A.ht)*t};
  const P=[],C=[],I=[],col=new THREE.Color(F.leather!=null?F.leather:K.col),G=TP_SCAB_K.seg,quad=(a,b,c2,d)=>I.push(a,b,c2,a,c2,d),put=v=>{P.push(v.x,v.y,v.z);C.push(col.r,col.g,col.b);return P.length/3-1;};
  // the loop: four rings (in and out, top and bottom) round the leather's lens, in the weapon's own units
  const lens=(grow,y)=>{const o=[];for(let j=0;j<G;j++){const a=j/G*Math.PI*2,cs=Math.cos(a),sn=Math.sin(a),k=Math.pow(Math.abs(sn),.6)*Math.sign(sn);
      o.push(put(new THREE.Vector3(r.cx+cs*(r.hw+grow),y,r.cz+k*(r.ht+grow))));}return o;};
  const g0=K.gap/s,g1=(K.gap+K.t)/s,y0=yf-K.h/s/2,y1=yf+K.h/s/2,rg=[lens(g0,y0),lens(g1,y0),lens(g1,y1),lens(g0,y1)];
  for(let q=0;q<4;q++){const a=rg[q],b=rg[(q+1)%4];for(let j=0;j<G;j++){const j1=(j+1)%G;quad(a[j],a[j1],b[j1],b[j]);}}
  // which flat of the lens lies against the hip: the one whose outward side faces the body (−x in the bone's frame)
  const inw=new THREE.Vector3(-1,0,0).transformDirection(Mi),side=inw.z<0?-1:1;
  const p0=new THREE.Vector3(r.cx,yf,r.cz+side*(r.ht+g1)).applyMatrix4(M);
  // the strap's line in the bone's frame: from the loop up the belt's outside, over its top, down behind it
  const xo=(F.xBelt||F.side)-F.p5.x+K.t,yt=F.yBt-F.p5.y+K.over,z=p0.z,top=new THREE.Vector3(xo,yt,z);
  const line=[p0,new THREE.Vector3(Math.max(p0.x,xo),Math.min(p0.y+.4*(yt-p0.y),yt-.004),z),top,new THREE.Vector3(xo-.016,yt+.002,z),new THREE.Vector3(xo-.02,yt-K.behind,z)];
  if(p0.y>yt-.004)return null;
  const Zb=new THREE.Vector3(0,0,1),sec=[];
  for(let k=0;k<line.length;k++){const a=line[Math.max(0,k-1)],b=line[Math.min(line.length-1,k+1)],tg=b.clone().sub(a).normalize(),n=new THREE.Vector3().crossVectors(Zb,tg).normalize(); /* across the strap is z; its face looks out from the belt */
    const q=[];for(const [u,v] of [[-1,-1],[1,-1],[1,1],[-1,1]])q.push(put(line[k].clone().addScaledVector(Zb,u*K.w/2).addScaledVector(n,v*K.t/2).applyMatrix4(Mi)));sec.push(q);}
  for(let k=0;k<sec.length-1;k++)for(let e=0;e<4;e++){const e1=(e+1)%4;quad(sec[k][e],sec[k+1][e],sec[k+1][e1],sec[k][e1]);}
  for(const [q,f] of [[sec[0],1],[sec[sec.length-1],0]])f?quad(q[0],q[3],q[2],q[1]):quad(q[0],q[1],q[2],q[3]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();
  const m=new THREE.Mesh(g,WPN_MAT.matte);m.name='frog';m.userData.own=true;m.userData.frog={yf,line:line.map(v=>v.toArray()),tris:I.length/3};return m;}
function tpSheathDrop(c){if(!c)return;c.removeFromParent();c.traverse(o=>{if(o.isMesh&&o.userData.own)o.geometry.dispose();});
  const b=c.userData.baldric;if(b){b.removeFromParent();b.geometry.dispose();c.userData.baldric=null;}}
// S2471 — the draw and the sheathe seen in third person (S2466's owed note: the worn copy swapped to the fist in one frame). The rig is
// rebuilt when SHEATHED turns (tpSig) and the builder's body is carried over; tpBuild keeps what the change would have thrown away: on a
// draw the worn group (the scabbard, the frog, the baldric) with its blade hidden, on a sheathe a carrier of the blade on an anchor in the
// fist. Over TP_DRAW.dur (0.56 s, the first person's) the right arm reaches the hilt where it is worn (a two-bone reach on the driver's
// arm, blended in and out) and the held blade's carrier is blended between the fist and its place in the scabbard. A draw: the hand goes
// to the hilt (0–0.22 s), then brings the blade out to the hand's pose; a sheathe: the hand takes the blade to the scabbard (0–0.3 s),
// then comes away empty. A look only: SHEATHED and the swing are 74-strikes.js's; a swing, a rebuild or the first person ends it
const TP_DRAW={dur:.56,reach:.22,put:.3};
function tpDrawOn(){return typeof thirdPerson!=='undefined'&&!!thirdPerson;}
const _tdS=x=>x<=0?0:x>=1?1:x*x*(3-2*x),_tdO=x=>x<=0?0:x>=1?1:1-Math.pow(1-x,3);
// the arm's weight toward the hilt (a) and the blade's place, 0 the fist and 1 the scabbard (s), at t seconds
function tpDrawPhase(D,t){const T=TP_DRAW;if(D.way==='draw')return t<T.reach?{a:_tdS(t/T.reach),s:1}:{a:1-_tdS((t-T.reach)/(T.dur-T.reach)),s:1-_tdO((t-T.reach)/(T.dur-T.reach))};
  return t<T.put?{a:_tdS(t/T.put),s:_tdS(t/T.put)}:{a:1-_tdS((t-T.put)/(T.dur-T.put)),s:1};}
function tpDrawEnd(R){const D=R&&R.tpDraw;if(!D)return;R.tpDraw=null;
  if(D.way==='draw'){if(D.G!==R.hbSheath)tpSheathDrop(D.G);}
  else{if(D.h){D.h.c.removeFromParent();if(R.hbHeld){const i=R.hbHeld.indexOf(D.h);if(i>=0)R.hbHeld.splice(i,1);}}if(D.a)D.a.removeFromParent();if(D.G.children[0])D.G.children[0].visible=true;}}
const _tdQw=new THREE.Quaternion(),_tdQk=new THREE.Quaternion(),_tdQi=new THREE.Quaternion(),_tdT=new THREE.Vector3(),_tdT2=new THREE.Vector3(),_tdV=new THREE.Vector3(),_tdV2=new THREE.Vector3(),_tdQ=new THREE.Quaternion(),_tdQ2=new THREE.Quaternion(),_tdQs=new THREE.Quaternion(),_tdQe=new THREE.Quaternion(),_tdM=new THREE.Matrix4();
// the elbow's way (tpReach's shortest turn put the upper arm through the chest): the arm turned about the shoulder-to-wrist line until the
// elbow points forward and out from the body (at the hip or the belt), or up and out (to a hilt over the shoulder)
const _tpP={u:new THREE.Vector3(),e:new THREE.Vector3(),p:new THREE.Vector3(),f:new THREE.Vector3(),o:new THREE.Vector3(),s:new THREE.Vector3(),q:new THREE.Quaternion(),q2:new THREE.Quaternion()};
function tpDrawPole(R,at,T){const S=R.shR,E=R.elR,X=_tpP;R.root.updateMatrixWorld(true);S.getWorldPosition(X.s);X.u.copy(T).sub(X.s);if(X.u.lengthSq()<1e-6)return;X.u.normalize();
  R.root.getWorldQuaternion(X.q);X.f.set(0,0,1).applyQuaternion(X.q);R.torso.getWorldPosition(X.o);X.o.subVectors(X.s,X.o).setY(0).normalize();
  if(at==='back')X.p.set(0,1,0).addScaledVector(X.f,.4).addScaledVector(X.o,.6);else X.p.copy(X.f).addScaledVector(X.o,.45).add(new THREE.Vector3(0,-.1,0));
  E.getWorldPosition(X.e).sub(X.s);X.e.addScaledVector(X.u,-X.e.dot(X.u));X.p.addScaledVector(X.u,-X.p.dot(X.u));if(X.e.lengthSq()<1e-8||X.p.lengthSq()<1e-8)return;X.e.normalize();X.p.normalize();
  const ang=Math.atan2(X.u.dot(new THREE.Vector3().crossVectors(X.e,X.p)),X.e.dot(X.p));X.q.setFromAxisAngle(X.u,ang);S.getWorldQuaternion(X.q2);X.q2.premultiply(X.q);
  S.parent.getWorldQuaternion(X.q).invert();S.quaternion.copy(X.q2.premultiply(X.q));S.updateMatrixWorld(true);}
// a hilt out of the arm's reach (a mace or an axe low through the belt at the left hip): the body turns to it and leans, by as much as the
// shoulder lacks, up to 0.5 rad of turn and 0.4 of lean at a third of the arm's length short
function tpDrawTurn(B,ax,ang){const X=_tpP;X.q.setFromAxisAngle(ax,ang);B.getWorldQuaternion(X.q2);X.q2.premultiply(X.q);B.parent.getWorldQuaternion(X.q).invert();B.quaternion.copy(X.q2.premultiply(X.q));B.updateMatrixWorld(true);}
function tpDrawBend(R,T,a){const S=R.shR,E=R.elR,W=R.handR,B=R.torso,X=_tpP;if(!B||!B.parent)return 0;R.root.updateMatrixWorld(true);
  const s=S.getWorldPosition(new THREE.Vector3()),L=s.distanceTo(E.getWorldPosition(X.e))+X.e.distanceTo(W.getWorldPosition(X.p)),need=Math.max(0,Math.min(1,(s.distanceTo(T)-.95*L)/(.3*L)))*a;
  if(need<=0)return 0;const o=B.getWorldPosition(X.o),up=new THREE.Vector3(0,1,0),v1=s.clone().sub(o).setY(0);R.root.getWorldQuaternion(X.q);const fwd=new THREE.Vector3(0,0,1).applyQuaternion(X.q).setY(0).normalize();
  /* the shoulder turned forward round the body, never back round it; the chest leaned forward over the hilt */
  const lean=new THREE.Vector3().crossVectors(up,fwd).normalize();tpDrawTurn(B,up,.5*need*Math.sign(v1.cross(fwd).y||1));tpDrawTurn(B,lean,.4*need);return need;}
function tpDrawTick(R,stage){const D=R.tpDraw;if(!D)return;const t=fpDrawNow()-D.t0;
  if(t>=TP_DRAW.dur||(typeof SWING!=='undefined'&&SWING)||!tpDrawOn()||!R.rig.hb||!D.G.parent){tpDrawEnd(R);return;}
  if(D.way==='sheathe'&&t>=TP_DRAW.put&&D.h){D.h.c.removeFromParent();const i=R.hbHeld.indexOf(D.h);if(i>=0)R.hbHeld.splice(i,1);D.h=null;D.G.children[0].visible=true;}
  const P=tpDrawPhase(D,t),k=D.G.children[0];D.G.updateWorldMatrix(true,true);D.last={t:+t.toFixed(3),a:+P.a.toFixed(3),s:+P.s.toFixed(3)};
  if(stage==='held'){const h=D.h||(D.way==='draw'?R.hbHeld&&R.hbHeld.find(x=>x.o===R.weapon):null);if(!h)return;
    R.root.updateMatrixWorld(true);_tdM.copy(R.rig.hb.root.matrixWorld).invert().multiply(k.matrixWorld);tpBlendM(h.c.matrix,h.c.matrix,_tdM,P.s);h.c.matrixWorldNeedsUpdate=true;return;}
  tpDrawArm(R,D,P,k);tpDrawLeft(R,D,P,k);}
// the reach: the wrist to the hilt (tpReach), blended over the pose by a
function tpDrawArm(R,D,P,k){
  const S=R.shR,E=R.elR,W=R.handR;if(!S||!E||!W||P.a<=0)return;R.root.updateMatrixWorld(true);
  /* the builder's arm is not the driver's (S1253): the driver's wrist is aimed so that the builder's grip, its fingers' middle, lands on the
     hilt, four times over, each time by 0.6 of the miss (as the mantle's hands are, tpHBMantle) */
  const q0s=_tdQs.copy(S.quaternion),q0e=_tdQe.copy(E.quaternion),by=R.rig.hb.P.byName,sd=HBODY.swap?'L':'R',fg=[2,3,4,5].map(f=>by[`finger${f}-2.${sd}`]).filter(Boolean);
  k.getWorldPosition(_tdT);
  /* through the belt the grip hangs low and back at the left hip: the hand takes the haft 12 cm up it and 16 cm before it, not through the belly */
  if(D.at==='belt'){k.getWorldQuaternion(_tdQ);R.root.getWorldQuaternion(_tdQ2);_tdT.addScaledVector(_tdV.set(0,1,0).applyQuaternion(_tdQ),.12).addScaledVector(_tdV.set(0,0,1).applyQuaternion(_tdQ2),.16);}
  _tdT2.copy(_tdT);tpDrawBend(R,_tdT,P.a);
  /* S2478 — the hand turned to take the hilt (S2471's note: it arrived palm up): the wrist set so that the blade it holds would lie as the
     worn blade lies, the grip's way in the fist (thumb to the guard: across the body, knuckles out; over the shoulder, palm forward); not a haft
     through the belt, which is beyond the arm's reach (the turn put the fingers 12 cm off it, not 4) */
  const q0w=_tdQw.copy(W.quaternion),hw=D.at==='belt'?null:D.way==='draw'?R.weapon:D.a,wt=hw&&hw.parent===W?_tdQk.copy(k.getWorldQuaternion(_tdQk)).multiply(_tdQi.copy(hw.quaternion).invert()):null;
  const turn=()=>{if(!wt)return;W.parent.updateWorldMatrix(true,false);W.parent.getWorldQuaternion(_tdQi).invert();W.quaternion.copy(_tdQi.multiply(wt));W.updateMatrixWorld(true);};
  for(let i=0;i<4;i++){tpReach(S,E,W,_tdT2);tpDrawPole(R,D.at,_tdT2);turn();if(!fg.length)break;R.root.updateMatrixWorld(true);hbPose(R.rig);R.root.updateMatrixWorld(true);
    _tdV.set(0,0,0);for(const b of fg)_tdV.add(_tdV2.setFromMatrixPosition(b.matrixWorld));_tdV.multiplyScalar(1/fg.length);D.err=+_tdV.distanceTo(_tdT).toFixed(3);_tdT2.addScaledVector(_tdV2.copy(_tdT).sub(_tdV),.6);}
  _tdQ.copy(S.quaternion);_tdQ2.copy(E.quaternion);S.quaternion.copy(q0s).slerp(_tdQ,P.a);E.quaternion.copy(q0e).slerp(_tdQ2,P.a);
  if(wt){_tdQk.copy(W.quaternion);W.quaternion.copy(q0w).slerp(_tdQk,P.a);D.turn=+(2*Math.acos(Math.min(1,Math.abs(q0w.dot(_tdQk))))).toFixed(3);}R.root.updateMatrixWorld(true);}
// S2484 — the left hand on a two-hander's grip through the draw and the sheathe (S2479's owed note: drawing a claymore, tpGripL kept the left
// wrist on the driver's blade, which the reach carries up behind the right shoulder, so the left hand rose empty to the shoulder while the
// blade came out of the scabbard; sheathing, it let go of the grip in one frame). Drawing, the left arm keeps the pose's (tpGripL waits) while
// the right hand reaches and pulls, and joins the grip as the blade comes down past the shoulder: weighted in from the blade's place s 0.55 to
// 0.1 (TP_DRAW.lj), aimed at the left grip of the blade where it is seen, between the scabbard and the fist by s; it ends on tpGripL's own
// mark, so the hold after the draw takes over unchanged. Sheathing, it leaves the grip by s 0.45 as the blade rises to the back. A look only
TP_DRAW.lj=[.55,.1,.45];
const _tdL={q0:new THREE.Quaternion(),q1:new THREE.Quaternion(),e0:new THREE.Quaternion(),e1:new THREE.Quaternion(),a:new THREE.Vector3(),b:new THREE.Vector3(),T:new THREE.Vector3()};
function tpDrawLeft(R,D,P,k){const draw=D.way==='draw',gl=draw?R.gripL:D.gl,hw=draw?R.weapon:D.a,S=R.shL,E=R.elL,W=R.handL;D.lw=0;
  if(!gl||!hw||!hw.parent||!S||!E||!W||!k)return;const J=TP_DRAW.lj,X=_tdL;
  const w=draw?_tdS((J[0]-P.s)/(J[0]-J[1])):1-_tdS(P.s/J[2]);D.lw=+w.toFixed(3);if(w<=0)return;
  R.root.updateMatrixWorld(true);k.updateWorldMatrix(true,false);hw.localToWorld(X.a.copy(gl));k.localToWorld(X.b.copy(gl));X.T.copy(X.a).lerp(X.b,P.s);
  X.q0.copy(S.quaternion);X.e0.copy(E.quaternion);tpReach(S,E,W,X.T);X.q1.copy(S.quaternion);X.e1.copy(E.quaternion);
  if(w<1){S.quaternion.copy(X.q0).slerp(X.q1,w);E.quaternion.copy(X.e0).slerp(X.e1,w);}R.root.updateMatrixWorld(true);D.lerr=+W.getWorldPosition(X.a).distanceTo(X.T).toFixed(3);
  R.gAim={gl,o:draw?R.weapon:null,h:draw?null:D.h,w,q0:X.q0.clone(),e0:X.e0.clone(),qa:S.quaternion.clone(),ea:E.quaternion.clone()};}
// S2478 — the cloak over what is worn at the hip (S2451's note, standing since: under a cloak a hip weapon hung inside the sheet, its hilt
// lost in it and the scabbard's point out through its back). The sheet and its hem are lifted over the worn group (the blade if sheathed,
// the scabbard, the frog; a mace or an axe through the belt) in the bind's metres: about the hips' upright, each point of the sheet stands
// at least as far out as anything worn at its bearing and height, plus 1.5 cm, less 0.45 of its distance from it across and above, 0.3
// below (the sheet falls from the chape), so it tents over the hilt and hangs from the point. A look only, the player's own body: the
// sheet's points are kept (tent0) and put back before every build's sheath (tpSheathFit reads the cloak), a body carried over included
const TP_TENT={gap:.015,up:.45,down:.3,bins:72,dy:.02,step:2};
function tpCloakUntent(H){if(!H)return;for(const m of H.full){if(!m.isSkinnedMesh||!/^(cloak|cloakHem)$/.test(m.name))continue;const g=m.geometry,u=g.userData;if(!u.tent0)continue;
  g.attributes.position.array.set(u.tent0);g.attributes.position.needsUpdate=true;if(u.tentN&&g.attributes.normal){g.attributes.normal.array.set(u.tentN);g.attributes.normal.needsUpdate=true;}u.tent=null;}}
function tpCloakTent(R){const H=R.rig.hb,c=R.hbSheath;if(!H||!c||!c.parent||!(R.sheathAt==='hip'||R.sheathAt==='belt'))return null;
  const sheets=H.full.filter(m=>m.isSkinnedMesh&&/^(cloak|cloakHem)$/.test(m.name));if(!sheets.length)return null;
  const T=TP_TENT,sk=H.P.skeleton,b=c.parent,bi=sk.bones.indexOf(b);if(bi<0)return null;R.root.updateMatrixWorld(true);
  const bind=new THREE.Matrix4().copy(sk.boneInverses[bi]).invert(),toB=new THREE.Matrix4().multiplyMatrices(bind,new THREE.Matrix4().copy(b.matrixWorld).invert()),M=new THREE.Matrix4(),v=new THREE.Vector3();
  const o=new THREE.Vector3().setFromMatrixPosition(bind),bins=new Map(),tw=2*Math.PI;let n=0;
  /* what will be worn once the draw or the sheathe is done: the blade only while sheathed */
  c.children.forEach((k,i)=>{if(i===0&&!R.sheathed)return;k.traverse(m=>{if(!m.isMesh||!m.geometry)return;M.multiplyMatrices(toB,m.matrixWorld);const p=m.geometry.attributes.position;
    for(let j=0;j<p.count;j+=T.step){v.fromBufferAttribute(p,j).applyMatrix4(M);const dx=v.x-o.x,dz=v.z-o.z,r=Math.hypot(dx,dz),th=Math.atan2(dx,dz);n++;
      const key=Math.floor((th+Math.PI)/tw*T.bins)+'|'+Math.floor(v.y/T.dy),e=bins.get(key);if(!e||r>e.r)bins.set(key,{th,y:v.y,r});}});});
  const B=[...bins.values()];let moved=0,most=0;
  for(const m of sheets){const g=m.geometry,u=g.userData,pa=g.attributes.position,A=pa.array;if(!u.tent0){u.tent0=A.slice();if(g.attributes.normal)u.tentN=g.attributes.normal.array.slice();}
    let any=false;for(let j=0;j<pa.count;j++){const x=A[j*3]-o.x,y=A[j*3+1],z=A[j*3+2]-o.z,r=Math.hypot(x,z);if(r<1e-4)continue;const th=Math.atan2(x,z);let need=0;
      for(const e of B){let d=th-e.th;d-=tw*Math.round(d/tw);const dy=y-e.y,q=Math.hypot(d*e.r*T.up,dy*(dy<0?T.down:T.up)),w=e.r+T.gap-q;if(w>need)need=w;}
      if(need>r){const k=need/r;A[j*3]=o.x+x*k;A[j*3+2]=o.z+z*k;moved++;most=Math.max(most,need-r);any=true;}}
    if(any){pa.needsUpdate=true;if(g.attributes.normal)g.computeVertexNormals();g.computeBoundingSphere();u.tent={moved,most};}}
  return R.cloakTent={pts:n,bins:B.length,moved,most:+most.toFixed(3)};}
// S2462 — the baldric (S2459's owed note: the claymore on the back hung from nothing). A strap 4.5 cm wide and 4 mm thick over the right
// shoulder (halfway from the neck to the joint), across the chest to the left flank 7 cm over the belt's middle, and round under the arm
// and up the back; the scabbard lies on its back run (tpSheath sets the blade's axis in the strap's plane and its leather on the strap's
// hindmost point). The strap is the section of the body by one plane, the line between those two points and the body's depth: in each of
// 128 turns round the section's middle the outermost point of the body and what it wears (not the arms, the neck or the head, and nothing
// under the belt's middle, where a tunic's skirt is not the body), padded 3 mm, smoothed. Skinned to the body's own bones by the six
// nearest points of the body and garments (not the cloak, which rides the pelvis), so it bends with the chest and the shoulder; detached
// with an identity bind, as hbAttach leaves every skinned piece; its own geometry, dropped with the sheathed group. Its leather, and the
// frog's, is the belt's own colour (F.leather, Session 2463); K.col only where no belt is worn
const TP_BALD={over:-.04,cut:-.08,w:.045,t:.004,gap:.003,N:128,col:0x3a2414,skip:/^(upperarm|lowerarm|wrist|hand|finger|thumb|metacarpal|neck|head|jaw|eye|tongue|teeth|special|levator|oris|orbicularis|temporalis|risorius)/i};
function tpBaldric(H,F){const K=TP_BALD,P=H.P,sk=P.skeleton,names=sk.bones.map(b=>b.name),Z=new THREE.Vector3(0,0,1),yMin=F.yB+K.cut;
  /* the plane: over the right shoulder halfway from the neck to the joint, and the left flank over the belt; it holds the body's depth */
  const by=P.byName,bp=b=>new THREE.Vector3().setFromMatrixPosition(_tsM.copy(sk.boneInverses[sk.bones.indexOf(b)]).invert()),sh=by['shoulder01.R']||by['clavicle.R'],nk=by.neck01;if(!sh||!nk)return null;
  const S=bp(sh),Nk=bp(nk),o=new THREE.Vector3((S.x+Nk.x)/2,S.y,F.p2.z);
  const e1=o.clone().sub(new THREE.Vector3(F.side,F.yB+K.over,o.z)).normalize(),n=new THREE.Vector3().crossVectors(e1,Z).normalize();
  const slab=K.w/2+.006,pts=[],src=[],v=new THREE.Vector3();
  for(const m of H.full){if(!m.isSkinnedMesh||/hair|brow|lash/.test(m.name))continue;const g=m.geometry,pa=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;if(!si||!sw)continue;
    const cl=m.name==='cloak';
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i);if(v.y<yMin)continue;v.sub(o);const h=v.dot(n);if(Math.abs(h)>slab)continue;
      let bi=0,bw=-1;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;bi=si.getComponent(i,k);}}if(K.skip.test(names[bi]||''))continue;
      const a=v.dot(e1),b=v.z;pts.push(a,b);
      if(!cl){const ix=[],ws=[];for(let k=0;k<4;k++){ix.push(si.getComponent(i,k));ws.push(sw.getComponent(i,k));}src.push({a,b,h,ix,ws});}}}
  if(pts.length<60||src.length<20)return null;
  let ca=0,cb=0;const np=pts.length/2;for(let i=0;i<np;i++){ca+=pts[i*2];cb+=pts[i*2+1];}ca/=np;cb/=np;
  const N=K.N,r=new Float32Array(N).fill(-1);
  for(let i=0;i<np;i++){const da=pts[i*2]-ca,db=pts[i*2+1]-cb,j=((Math.round(Math.atan2(db,da)/(Math.PI*2)*N)%N)+N)%N,rr=Math.hypot(da,db);if(rr>r[j])r[j]=rr;}
  const W_=k=>((k%N)+N)%N,r0=Float32Array.from(r);for(let j=0;j<N;j++)if(r0[j]<0){let a=j,b=j;while(r0[W_(a-1)]<0&&j-a<N)a--;while(r0[W_(b+1)]<0&&b-j<N)b++;const ra=r0[W_(a-1)],rb=r0[W_(b+1)],t=(j-a+1)/(b-a+2);r[j]=ra+(rb-ra)*t;}
  const mx=new Float32Array(N),sm=new Float32Array(N);for(let j=0;j<N;j++){let q=0;for(let k=-2;k<=2;k++)q=Math.max(q,r[(j+k+N)%N]);mx[j]=q;}
  for(let j=0;j<N;j++){let q=0;for(let k=-2;k<=2;k++)q+=mx[(j+k+N)%N];sm[j]=Math.max(r[j],q/5)+K.gap+K.t/2;}
  const ring=[];for(let j=0;j<N;j++){const th=j/N*Math.PI*2;ring.push([ca+Math.cos(th)*sm[j],cb+Math.sin(th)*sm[j]]);}
  const Pp=[],C=[],I=[],SI=[],SW=[],col=new THREE.Color(F.leather!=null?F.leather:K.col),q=new THREE.Vector3(),ou=new THREE.Vector3();
  const skin=(a,b,h)=>{const best=[];for(const s of src){const dd=(s.a-a)**2+(s.b-b)**2+(s.h-h)**2;if(best.length<6||dd<best[best.length-1].dd){best.push({s,dd});best.sort((x,y)=>x.dd-y.dd);if(best.length>6)best.pop();}}
    const acc=new Map();for(const {s,dd} of best){const f=1/(Math.sqrt(dd)+.004);for(let k=0;k<4;k++)if(s.ws[k]>0)acc.set(s.ix[k],(acc.get(s.ix[k])||0)+s.ws[k]*f);}
    const top=[...acc].sort((x,y)=>y[1]-x[1]).slice(0,4),tot=top.reduce((u,x)=>u+x[1],0)||1;for(let k=0;k<4;k++){SI.push(top[k]?top[k][0]:0);SW.push(top[k]?top[k][1]/tot:0);}};
  const sec=[];for(let j=0;j<N;j++){const [a,b]=ring[j],[a0,b0]=ring[(j+N-1)%N],[a1,b1]=ring[(j+1)%N],ta=a1-a0,tb=b1-b0,tl=Math.hypot(ta,tb)||1,oa=tb/tl,ob=-ta/tl;
      /* outward: away from the section's middle */const sgn=(oa*(a-ca)+ob*(b-cb))<0?-1:1;const qs=[];
      for(const [u,w] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const A=a+sgn*oa*w*K.t/2,B=b+sgn*ob*w*K.t/2,hh=u*K.w/2;
        q.copy(o).addScaledVector(e1,A).addScaledVector(Z,B).addScaledVector(n,hh);Pp.push(q.x,q.y,q.z);C.push(col.r,col.g,col.b);skin(A,B,hh);qs.push(Pp.length/3-1);}sec.push(qs);}
  const quad=(a,b,c2,dd)=>I.push(a,b,c2,a,c2,dd);
  for(let j=0;j<N;j++){const A=sec[j],B=sec[(j+1)%N];for(let e=0;e<4;e++){const e1_=(e+1)%4;quad(A[e],B[e],B[e1_],A[e1_]);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(Pp,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));g.setIndex(I);g.computeVertexNormals();
  const m=new THREE.SkinnedMesh(g,WPN_MAT.matte);m.name='baldric';m.castShadow=false;m.frustumCulled=false;m.userData.tp=true;m.userData.own=true;
  /* the back run's outside, where the scabbard's leather lies: the strap's hindmost point over the back */
  let zb=0;for(const [a,b] of ring)if(b<cb)zb=Math.min(zb,b-K.t/2);
  m.userData.baldric={o:o.toArray(),e1:e1.toArray(),n:n.toArray(),ring,ca,cb,zBack:o.z+zb,tris:I.length/3,src:src.length};
  P.root.add(m);m.bind(sk,new THREE.Matrix4());m.bindMode='detached';m.bindMatrixInverse.identity();return m;} /* as hbAttach leaves every skinned piece: detached, identity */
// S2456 — the scabbard (S2451's owed note: the blade hung bare at the hip). Measured from the blade itself in the weapon's own frame (the
// grip about y 0, the blade up +y): the guard is whatever stands out past three quarters of the blade's width below a quarter of its length,
// and the mouth sits just over it; from there to the point the scabbard follows the blade's own middle (a cutlass's or a nimcha's curve) at
// its width and thickness, plus the leather (7 mm a side across, 6 mm on the flat), never widening toward the point, and closes past the
// tip. A locket at the mouth and a chape over the last 6 cm in the guard's metal. One geometry, two groups (leather, metal), cached by kind
// and metal: the sheathed copy shares it and nothing disposes it
const TP_SCAB=new Map(),TP_SCAB_K={wall:.007,flat:.006,minW:.011,minT:.009,past:.018,locket:.028,chape:.06,lip:.0025,seg:12};
function tpScabbard(W,it){const kit=W.userData.kit||'',gc=tpHex(it&&it.matGuard,0xb08a48),key=kit+'|'+gc;if(TP_SCAB.has(key))return TP_SCAB.get(key);
  const K=TP_SCAB_K,par=W.parent;if(par)par.remove(W);W.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(W.matrixWorld).invert(),pts=[],v=new THREE.Vector3(),M=new THREE.Matrix4();
  // S2459: the points along every edge of every triangle, 5 mm apart, not the corners alone: the cutlass's spine is a few long triangles,
  // and the surface between their corners stood 4 mm proud of a scabbard sized from the corners (seen through the leather)
  W.traverse(o=>{if(!o.isMesh||!o.geometry)return;M.multiplyMatrices(inv,o.matrixWorld);const p=o.geometry.attributes.position,ix=o.geometry.index,q=[];
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(M);q.push([v.x,v.y,v.z]);pts.push(q[i]);}
    const nT=ix?ix.count:p.count,at=k=>ix?ix.getX(k):k;
    for(let t=0;t+2<nT;t+=3)for(let e=0;e<3;e++){const A=q[at(t+e)],B=q[at(t+(e+1)%3)],L=Math.hypot(B[0]-A[0],B[1]-A[1],B[2]-A[2]),n=Math.floor(L/.005);
      for(let k=1;k<n;k++){const f=k/n;pts.push([A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f,A[2]+(B[2]-A[2])*f]);}}});
  if(par)par.add(W);if(!pts.length)return null;
  const tip=Math.max(...pts.map(p=>p[1])),mb={};for(const p of pts){if(p[1]<=.12||p[1]>=tip-.05)continue;const k=Math.round(p[1]*100),b=mb[k]||(mb[k]=[9,-9]);b[0]=Math.min(b[0],p[0]);b[1]=Math.max(b[1],p[0]);}
  let bw=0;for(const k in mb)bw=Math.max(bw,(mb[k][1]-mb[k][0])/2);if(!bw)bw=.025; /* the blade's half-width across each section, not from the axis: a cutlass curves off it */
  let mouth=-1;for(const p of pts)if(p[1]<tip*.25&&p[1]>-.02&&Math.abs(p[0])>bw*1.5)mouth=Math.max(mouth,p[1]);mouth=(mouth<0?.06:mouth)+.006;
  // the blade's sections, a centimetre apart: its middle and half-widths on x and z, an empty one taken from its neighbours
  const n=Math.max(4,Math.ceil((tip-mouth)/.01)),S=[];for(let i=0;i<=n;i++)S.push(null);
  for(const p of pts){if(p[1]<mouth)continue;const i=Math.min(n,Math.round((p[1]-mouth)/(tip-mouth)*n)),s=S[i]||(S[i]=[9,-9,9,-9]);s[0]=Math.min(s[0],p[0]);s[1]=Math.max(s[1],p[0]);s[2]=Math.min(s[2],p[2]);s[3]=Math.max(s[3],p[2]);}
  for(let i=0;i<=n;i++)if(!S[i]){let a=i-1,b=i+1;while(a>=0&&!S[a])a--;while(b<=n&&!S[b])b++;const A=a>=0?S[a]:null,B=b<=n?S[b]:null;S[i]=A&&B?A.map((x,j)=>x+(B[j]-x)*(i-a)/(b-a)):(A||B).slice();}
  // the leather's half-width and half-thickness: the blade's plus the wall, the widest yet from the point back (a scabbard never swells toward the point)
  const R=S.map(s=>({y:0,cx:(s[0]+s[1])/2,cz:(s[2]+s[3])/2,hw:Math.max(K.minW,(s[1]-s[0])/2+K.wall),ht:Math.max(K.minT,(s[3]-s[2])/2+K.flat)}));
  R.forEach((r,i)=>r.y=mouth+(tip-mouth)*i/n);for(let i=n-1;i>=0;i--){R[i].hw=Math.max(R[i].hw,R[i+1].hw);R[i].ht=Math.max(R[i].ht,R[i+1].ht);}
  const e=R[n];R.push({y:tip+K.past*.55,cx:e.cx,cz:e.cz,hw:e.hw*.8,ht:e.ht*.85},{y:tip+K.past,cx:e.cx,cz:e.cz,hw:e.hw*.35,ht:e.ht*.5});
  const P=[],C=[],I=[],G=K.seg,lea=new THREE.Color(0x4a2e1a),met=new THREE.Color(gc),cA=new THREE.Color(),g=new THREE.BufferGeometry();
  const ring=(r,grow,col)=>{const b=P.length/3;for(let j=0;j<G;j++){const a=j/G*Math.PI*2,c=Math.cos(a),s=Math.sin(a),k=Math.pow(Math.abs(s),.6)*Math.sign(s); /* a lens: full width, the flats eased */
      P.push(r.cx+c*(r.hw+grow),r.y,r.cz+k*(r.ht+grow));C.push(col.r,col.g,col.b);}return b;};
  const tube=(rs,grow,col,shade,cap)=>{const g0=I.length;let prev=-1;rs.forEach((r,i)=>{cA.copy(col).multiplyScalar(shade(i,rs.length));const b=ring(r,grow,cA);
      if(prev>=0)for(let j=0;j<G;j++){const j1=(j+1)%G;I.push(prev+j,b+j,prev+j1,prev+j1,b+j,b+j1);}prev=b;});
    if(cap){const r=rs[rs.length-1],c=P.length/3;P.push(r.cx,r.y,r.cz);C.push(cA.r,cA.g,cA.b);for(let j=0;j<G;j++)I.push(prev+j,c,prev+(j+1)%G);}return [g0,I.length-g0];};
  const lea0=tube(R,0,lea,(i,N)=>.95+.06*Math.abs(Math.sin(i*1.7))-.08*i/N,true);
  const lk=R.filter(r=>r.y<=mouth+K.locket),lk2=lk.length>1?lk:R.slice(0,2),ch=R.filter(r=>r.y>=tip-K.chape);
  const m1=tube(lk2,K.lip,met,()=>1,false),m2=tube(ch.length>1?ch:R.slice(-2),K.lip,met,()=>1,true);
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);
  g.addGroup(lea0[0],lea0[1],0);g.addGroup(m1[0],m1[1],1);g.addGroup(m2[0],m2[1],1);g.computeVertexNormals();g.computeBoundingSphere();
  const out={geo:g,mouth,tip,hw:R[0].hw,ht:R[0].ht,tris:I.length/3,R};TP_SCAB.set(key,out);return out;}
function tpHBPose(R){if(!R||!R.rig.hb)return;hbPose(R.rig);if(R.mantle)tpHBMantle(R);if(R.hbHook)tpHBBowHand(R);R.root.updateMatrixWorld(true);tpHBHold(R);if(R.tpDraw)tpDrawTick(R,'held');if(R.gAim&&R.mantle&&R.mantle.pull)R.gAim.w*=1-R.mantle.w;if(R.gAim)tpHBGripL(R);}
/* S2711 — a pull's hands are both on the ledge: a two-handed weapon rides in the right fist, the left hand lets go of the grip while it is
   planted (the grip's weight is what the pull leaves, 1 - M.w) and takes it again as the hands let go of the ledge. S2700: the left wrist
   stayed on the haft, 0.38-0.43 m off its hold */
// S2485 — the builder's left hand on a two-hander's grip (S2484's note): tpGripL (and the draw's tpDrawLeft) aim the driver's left wrist at
// the driver's blade, but the blade that is seen rides in the builder's right fingers (tpHBHold), 0.30 m from the driver's, and the builder's
// arm, copied joint for joint and of its own length, puts its wrist 0.24 m from the driver's: the left fist hung 0.31 m under the grip,
// holding nothing. Aiming the driver short does not converge (the builder's hand lands 0.25 m off whatever the driver's aim), so the
// builder's own arm is reached after hbPose, as the bow hand's fingers are set (tpHBBowHand): twice, the elbow (lowerarm01) bent about its
// own hinge until shoulder to fingers is shoulder to the seen blade's left grip mark, then the upper arm (upperarm01) swung to put the
// fingers' middle on it; laid over the copied arm by the grip's weight. Only while nothing since has moved the driver's left arm (the climb,
// the mantle, the rod, the net and the glass set it after the grip), and used once and cleared, so a pose that does not set it (the sheet's
// portrait, the creator) is never pulled to a grip.
// S2489 — and the fist closed round the grip (S2485's note: the hand was placed, not turned; the fingers wrapped from the side, the palm
// beside the grip, the knuckles' line 0.68 rad off the blade). Between the reaches the wrist (wrist.L) is turned so the knuckles' line
// (little finger to forefinger) lies along the grip, the forefinger toward the blade, and the back of the hand along the forearm (as
// straight a wrist as the grip allows); the point put on the grip mark is then the curl's middle (the circle through each finger's three
// joints, averaged), not the second joints, so the grip runs through the fist and not through the fingers. Three passes
const _tgF={S:new THREE.Vector3(),F:new THREE.Vector3(),s:new THREE.Vector3(),e:new THREE.Vector3(),u:new THREE.Vector3(),v:new THREE.Vector3(),n:new THREE.Vector3(),q:new THREE.Quaternion(),q2:new THREE.Quaternion(),u0:new THREE.Quaternion(),l0:new THREE.Quaternion()};
function tpHBTurnBone(b,q){const X=_tgF;b.getWorldQuaternion(X.q2);X.q2.premultiply(q);b.parent.getWorldQuaternion(X.q).invert();b.quaternion.copy(X.q.multiply(X.q2));b.updateMatrixWorld(true);}
function tpHBCurl(by,sd,out){out.set(0,0,0);const a=_tgC.a,b=_tgC.b,c=_tgC.c,ab=_tgC.ab,ac=_tgC.ac,n=_tgC.n,t=_tgC.t;let k=0;
  for(let f=2;f<=5;f++){const A=by[`finger${f}-1.${sd}`],B=by[`finger${f}-2.${sd}`],C=by[`finger${f}-3.${sd}`];if(!A||!B||!C)continue;
    a.setFromMatrixPosition(A.matrixWorld);b.setFromMatrixPosition(B.matrixWorld);c.setFromMatrixPosition(C.matrixWorld);ab.subVectors(b,a);ac.subVectors(c,a);n.crossVectors(ab,ac);const nn=n.lengthSq();
    if(nn<1e-14){out.add(b);k++;continue;}
    t.crossVectors(n,ab).multiplyScalar(ac.lengthSq()).add(_tgC.u.crossVectors(ac,n).multiplyScalar(ab.lengthSq())).multiplyScalar(1/(2*nn));out.add(a).add(t);k++;}
  return k?out.multiplyScalar(1/k):null;}
const _tgC={a:new THREE.Vector3(),b:new THREE.Vector3(),c:new THREE.Vector3(),ab:new THREE.Vector3(),ac:new THREE.Vector3(),n:new THREE.Vector3(),t:new THREE.Vector3(),u:new THREE.Vector3(),
  k:new THREE.Vector3(),l:new THREE.Vector3(),m:new THREE.Vector3(),A:new THREE.Vector3(),Lt:new THREE.Vector3(),M:new THREE.Vector3(),B0:new THREE.Matrix4(),B1:new THREE.Matrix4(),q:new THREE.Quaternion(),w0:new THREE.Quaternion()};
/* the wrist turned so the knuckles' line runs along the grip's axis (Ax, toward the blade) and the hand's length along the forearm */
function tpHBFistTurn(by,sd,Wb,Ax){const X=_tgC,f2=by[`finger2-1.${sd}`],f5=by[`finger5-1.${sd}`],f3=by[`finger3-1.${sd}`],la=by[`lowerarm01.${sd}`];if(!f2||!f5||!f3||!la)return;
  X.a.setFromMatrixPosition(f2.matrixWorld);X.k.setFromMatrixPosition(f5.matrixWorld);X.k.subVectors(X.a,X.k);
  X.b.setFromMatrixPosition(Wb.matrixWorld);X.l.setFromMatrixPosition(f3.matrixWorld).sub(X.b);X.c.setFromMatrixPosition(la.matrixWorld);X.Lt.subVectors(X.b,X.c);
  if(X.k.lengthSq()<1e-10||X.l.lengthSq()<1e-10)return;X.k.normalize();X.l.addScaledVector(X.k,-X.l.dot(X.k));
  X.Lt.addScaledVector(Ax,-X.Lt.dot(Ax));if(X.l.lengthSq()<1e-10||X.Lt.lengthSq()<1e-10)return;X.l.normalize();X.Lt.normalize();
  X.m.crossVectors(X.k,X.l);X.M.crossVectors(Ax,X.Lt);X.B0.makeBasis(X.k,X.l,X.m);X.B1.makeBasis(Ax,X.Lt,X.M);X.B0.transpose();X.B1.multiply(X.B0);
  tpHBTurnBone(Wb,X.q.setFromRotationMatrix(X.B1));}
const _tgR={c:new THREE.Vector3(),p0:new THREE.Vector3(),p1:new THREE.Vector3(),v:new THREE.Vector3(),w0:new THREE.Quaternion(),q:new THREE.Quaternion(),Mi:new THREE.Matrix4()};
function tpHBGripR(R,G,h,by,Ax){const sd=HBODY.swap?'L':'R',Wb=by['wrist.'+sd],f2=by['finger2-1.'+sd],f5=by['finger5-1.'+sd],Y=_tgR;if(!Wb||!f2||!f5||!h.f||!h.f.length||!h.c.parent)return null;
  const fm=o=>{o.set(0,0,0);for(const b of h.f)o.add(Y.v.setFromMatrixPosition(b.matrixWorld));return o.multiplyScalar(1/h.f.length);};
  fm(Y.p0);Y.w0.copy(Wb.quaternion);tpHBFistTurn(by,sd,Wb,Ax);
  if(G.w<1){Y.q.copy(Wb.quaternion);Wb.quaternion.copy(Y.w0).slerp(Y.q,G.w);Wb.updateMatrixWorld(true);}
  fm(Y.p1);if(tpHBCurl(by,sd,Y.c)){Y.c.sub(Y.p1);Y.p1.add(Y.c.addScaledVector(Ax,-Y.c.dot(Ax)).multiplyScalar(G.w));}
  h.c.parent.updateMatrixWorld(true);Y.Mi.copy(h.c.parent.matrixWorld).invert();Y.p0.applyMatrix4(Y.Mi);Y.p1.applyMatrix4(Y.Mi).sub(Y.p0);
  const e=h.c.matrix.elements;e[12]+=Y.p1.x;e[13]+=Y.p1.y;e[14]+=Y.p1.z;h.c.matrixWorldNeedsUpdate=true;
  return +Y.v.setFromMatrixPosition(f2.matrixWorld).sub(Y.p0.setFromMatrixPosition(f5.matrixWorld)).angleTo(Ax).toFixed(3);}
function tpHBGripL(R){const G=R.gAim,H=R.rig.hb;R.gAim=null;if(!G||!H||G.w<=0)return;const h=G.h||(G.o&&R.hbHeld&&R.hbHeld.find(x=>x.o===G.o));if(!h||!h.c.parent)return;
  /* only an arm still as the grip left it: the climb, the mantle, the rod, the net and the glass set the left arm after it */
  if(Math.abs(G.qa.dot(R.shL.quaternion))<.99999||Math.abs(G.ea.dot(R.elL.quaternion))<.99999)return;
  const sd=HBODY.swap?'R':'L',by=H.P.byName,U=by['upperarm01.'+sd],L=by['lowerarm01.'+sd],Wb=by['wrist.'+sd],fg=[2,3,4,5].map(f=>by[`finger${f}-2.${sd}`]).filter(Boolean);if(!U||!L||!fg.length)return;const X=_tgF;
  const fing=()=>{X.F.set(0,0,0);for(const b of fg)X.F.add(X.v.setFromMatrixPosition(b.matrixWorld));return X.F.multiplyScalar(1/fg.length);};
  const aim=()=>tpHBCurl(by,sd,X.F)||fing();
  R.root.updateMatrixWorld(true);h.c.updateMatrixWorld(true);X.S.copy(G.gl).applyMatrix4(h.c.matrixWorld);const miss0=fing().distanceTo(X.S);X.u0.copy(U.quaternion);X.l0.copy(L.quaternion);
  /* the grip's axis, toward the blade (the left mark is on the pommel's side of the right hand) */
  const Ax=_tgC.A.set(0,1,0).transformDirection(h.c.matrixWorld).multiplyScalar(G.gl.y>0?-1:1);
  /* S2499 — the right fist turned the same way (S2489's note: its knuckles' line lay 0.42 rad off the blade, the driver's wrist carried
     across): wrist.R set by the grip's weight, then the held copy moved with the fingers that place it and across to the curl's middle (as the
     left's, tpHBCurl), so the grip runs through the fist and the left mark follows */
  const kAngR=tpHBGripR(R,G,h,by,Ax);if(kAngR!=null){h.c.updateMatrixWorld(true);X.S.copy(G.gl).applyMatrix4(h.c.matrixWorld);}
  if(Wb)_tgC.w0.copy(Wb.quaternion);
  for(let k=0;k<3;k++){if(Wb)tpHBFistTurn(by,sd,Wb,Ax);X.s.setFromMatrixPosition(U.matrixWorld);X.e.setFromMatrixPosition(L.matrixWorld);aim();
    const a=X.s.distanceTo(X.e),b=X.e.distanceTo(X.F),d=Math.max(Math.abs(a-b)+1e-3,Math.min(a+b-1e-3,X.s.distanceTo(X.S)));
    X.u.subVectors(X.F,X.e);X.v.subVectors(X.s,X.e);X.n.crossVectors(X.v,X.u);
    if(X.n.lengthSq()>1e-10){X.n.normalize();const want=Math.acos(Math.max(-1,Math.min(1,(a*a+b*b-d*d)/(2*a*b)))),now=X.u.angleTo(X.v);tpHBTurnBone(L,X.q.setFromAxisAngle(X.n,want-now));}
    aim();X.u.subVectors(X.F,X.s);X.v.subVectors(X.S,X.s);if(X.u.lengthSq()<1e-10||X.v.lengthSq()<1e-10)break;tpHBTurnBone(U,X.q.setFromUnitVectors(X.u.normalize(),X.v.normalize()));}
  let kAng=null;if(Wb){const f2=by['finger2-1.'+sd],f5=by['finger5-1.'+sd];if(f2&&f5)kAng=+X.v.setFromMatrixPosition(f2.matrixWorld).sub(X.u.setFromMatrixPosition(f5.matrixWorld)).angleTo(Ax).toFixed(3);}
  const after=+aim().distanceTo(X.S).toFixed(3);
  if(G.w<1){X.q.copy(U.quaternion);U.quaternion.copy(X.u0).slerp(X.q,G.w);X.q.copy(L.quaternion);L.quaternion.copy(X.l0).slerp(X.q,G.w);if(Wb){X.q.copy(Wb.quaternion);Wb.quaternion.copy(_tgC.w0).slerp(X.q,G.w);}U.updateMatrixWorld(true);}
  R.gMiss={before:+miss0.toFixed(3),after,w:G.w,kAng,kAngR};}
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
function tpDispose(R){if(!R)return;tpDrawEnd(R);if(R.rig&&R.rig.hb){if(R.hbHeld)for(const h of R.hbHeld)h.c.removeFromParent();if(R.hbSheath)tpSheathDrop(R.hbSheath);hbDrop(R.rig);} /* F10: the held copies share the pieces' geometry, disposed once below */if(R.root.parent)R.root.parent.remove(R.root);R.root.traverse(o=>{if(o.isMesh||o.isPoints){o.geometry.dispose();if(o.material!==PEOPLE_MAT)o.material.dispose();}});}
const _tpL=(a,b,k)=>a+(b-a)*k;
// S1899 — your deflect's beat after a perfect parry (74-strikes.js sets _lastParryG on the play clock): w, the sword arm's; s, the shield's
const TP_DEFLECT={rise:.06,hold:.18,out:.42,w:{aR:[-1.05,-.6,0],eR:-.45,wR:.35},s:{aL:[-1.15,-.3,0],eL:-.55,shY:.15,shZ:-.65}};
function tpDeflectK(){if(typeof _lastParryG!=='number')return 0;const D=TP_DEFLECT,t=playClockS-_lastParryG;if(t<0||t>=D.out)return 0;
  const u=t<D.rise?t/D.rise:t<D.hold?1:1-(t-D.hold)/(D.out-D.hold);return u*u*(3-2*u);}
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
  if(R.hbHeld)for(const h of R.hbHeld)if(h.o===R.weapon)xbowRigSet(h.c,S.f,S.bolt,R.weapon.userData.xbow.userData.xbowK);}
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
  // S1862 — the orb in the off hand (#1111 B, the hold): at rest it is carried as a torch is, the glass up before the waist; the tome hangs
  // at your side as before (tpImplHold below takes the raised orb, the kept word and the reading)
  if(R.orb&&!air){aL.x=Math.min(aL.x,TP_IMPL.rest[0]);eL=TP_IMPL.rest[1];}
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
  // S1899 (Michael's A on #1192, the deflect; your side of the beat that 32-people.js' foeDeflect is the foe's): a perfect parry beats the
  // foe's blade aside: the guard's sword is swept out to your right, the arm straightening, or the shield punched out to the left and
  // forward; quicker than the foe's (in by .06 s, back by .42 on the play clock), so the riposte's swing (which takes the arm) is yours
  // within the 0.8 s. Nothing is held, and the off hand keeps what it carries
  const dk=tpDeflectK();
  if(dk>0&&swingT<=0&&!R.bow){const D=TP_DEFLECT;
    if(R.shield){aL={x:_tpL(aL.x,D.s.aL[0],dk),y:_tpL(aL.y,D.s.aL[1],dk),z:_tpL(aL.z,D.s.aL[2],dk)};eL=_tpL(eL,D.s.eL,dk);shY=_tpL(shY,D.s.shY,dk);shZ=_tpL(shZ,D.s.shZ,dk);}
    else if(R.weapon||R.twoH){aR={x:_tpL(aR.x,D.w.aR[0],dk),y:_tpL(aR.y,D.w.aR[1],dk),z:_tpL(aR.z,D.w.aR[2],dk)};eR=_tpL(eR,D.w.eR,dk);wR=_tpL(wR,D.w.wR,dk);}}
  // the bow: left arm out along the aim, right hand draws to the cheek
  const drawing=typeof _bowDrawing!=='undefined'&&_bowDrawing;
  if(R.bow&&(drawing||blocking)){const s=drawing?Math.min(1,_bowDrawT/BOW_DRAW_MAX):.3;const aim=-Math.PI/2-pitch*.9;ty=-.55;aL={x:aim,y:.55,z:0};eL=-.05;aR={x:aim,y:.55+.3+s*.45,z:0};eR=-.4-s*2.0;}
  else if(R.bow&&!air){aL.x=Math.min(aL.x,-.25);eL=-.5;}
  // S1862 — the orb raised (the guard held with an orb, orbRaised) is held out before the chest at the eye's pitch, the glass between you
  // and the foe; a kept word (ORB_KEPT) is carried low and behind the left hip, cocked to let go (OG-045), standing and on the move; neither
  // takes a swing's arm
  const IH=tpImplHold(R);
  if(IH&&IH.orb&&!air&&!(swingT>0)&&!TP.swim){const P=IH.raised?TP_IMPL.raised:IH.kept?TP_IMPL.kept:null;if(P){aL={x:P[0]-(IH.raised?pitch*.6:0),y:P[1],z:P[2]};eL=P[3];}}
  // casting: both hands out, the right leading; with an orb the left leads (the word goes into the orb and leaves from it), and with a
  // tome the left holds the book up open before the chest, read aloud, while the right makes the cast
  if(typeof castT!=='undefined'&&castT>0){const c=castT/CAST_ANIM_DURATION;const push=Math.sin((1-c)*Math.PI);aR={x:-1.45-pitch*.8,y:.15,z:0};eR=-.25-.5*(1-push);aL={x:-1.1-pitch*.6,y:-.25,z:0};eL=-.9;ty=-.15;tx=-.1*push;
    if(R.orb){aL={x:-1.45-pitch*.8,y:-.15,z:0};eL=-.25-.5*(1-push);aR={x:-.6,y:.15,z:-.1};eR=-.9;ty=.15;}
    else if(R.tome){const P=TP_IMPL.read;aL={x:P[0]-pitch*.3,y:P[1],z:P[2]};eL=P[3];}}
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
  R.gAim=null;if(R.gripL&&R.weapon&&TP.deadT<.01&&!TP.swim&&!(typeof castT!=='undefined'&&castT>0)&&!(R.tpDraw&&R.tpDraw.way==='draw')){const q0=R.shL.quaternion.clone(),e0=R.elL.quaternion.clone();tpGripL(R);R.gAim={gl:R.gripL,o:R.weapon,w:1,q0,e0,qa:R.shL.quaternion.clone(),ea:R.elL.quaternion.clone()};} /* S2484 — drawing, tpDrawLeft takes the left hand; S2485 — the builder's hand set on the seen grip, tpHBGripL */
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
// S2087 — the sheet's portrait (66-hub.js) stands you at rest with what you hold planted rather than hung from the fist, which put a staff's
// head, a spear's point and an axe's blade through the floor. TP_REST by the weapon's shape: `side`, held upright in the right hand beside
// the right foot, the butt down (a staff, a spear); `front`, stood on its point or its head before you, the right hand on top and the left at rest (a two-hander).
// `hand` is the right wrist's height as a share of your stature (its bounds when the weapon does not set it), `down` the end on the floor:
// `long` (the end further from the fist) or `short`; `haft`, the hands may sit anywhere along it, so it slides through the fist to stand on
// the floor. A bow, a crossbow and every one-handed weapon keep the hang (TP_REST has no row for them)
const TP_REST={staff:{at:'side',hand:[.55,.6],down:'short',haft:true},spear:{at:'side',hand:[.55,.6],down:'short',haft:true},
  claymore:{at:'front',hand:[.44,.7],down:'long'},greataxe:{at:'front',hand:[.44,.6],down:'long',haft:true},warhammer:{at:'front',hand:[.44,.6],down:'long',haft:true},
  greatclub:{at:'front',hand:[.44,.6],down:'long',haft:true},pick:{at:'front',hand:[.44,.6],down:'long',haft:true}};
const TP_REST_AT={side:[-.3,.14],front:[-.12,.3]}; /* the wrist's place about your feet in metres, turned with you: x (−x is your right), z ahead */
const _trP=new THREE.Vector3(),_trS=new THREE.Vector3(),_trW=new THREE.Matrix4(),_trW2=new THREE.Vector3(),_trB=new THREE.Box3(),_trM=new THREE.Matrix4(),_trM2=new THREE.Matrix4(),_trE=new THREE.Vector3(),_trD=new THREE.Vector3(),_trQ=new THREE.Quaternion();
// the weapon's extent along its own length (its y), from the fist: [lowest, highest]
function tpRestSpan(W){W.updateMatrixWorld(true);_trM.copy(W.matrixWorld).invert();let lo=0,hi=0;
  W.traverse(m=>{if(!m.isMesh||!m.geometry)return;if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();_trB.copy(m.geometry.boundingBox).applyMatrix4(_trM2.multiplyMatrices(_trM,m.matrixWorld));lo=Math.min(lo,_trB.min.y);hi=Math.max(hi,_trB.max.y);});
  return [lo,hi];}
// pose R's arms for the portrait (after pwApply, before tpHBPose): the right wrist set where the weapon stands, turned so its down end
// points down; true when the weapon has a row (then tpRestHeld plants the builder's copy after tpHBPose). The driver's weapon is not moved
function tpRestPose(R){const W=R.weapon,it=EQ.weapon,T=W&&it&&!R.bow&&TP_REST[it.weaponShape];R.rest=null;if(!T||!R.rig)return false;
  const st=(R.rig.hb&&R.rig.hb.st)||1.76,[lo,hi]=tpRestSpan(W),dn=T.down==='long'?(Math.abs(lo)>Math.abs(hi)?-1:1):(Math.abs(lo)>Math.abs(hi)?1:-1),
    at=TP_REST_AT[T.at],y0=R.root.position.y;
  let h=(T.hand[0]+T.hand[1])/2*st;const fix=new THREE.Quaternion();
  const place=()=>{R.root.updateMatrixWorld(true);R.root.getWorldQuaternion(_trQ);tpReach(R.shR,R.elR,R.handR,_tgT.set(at[0],0,at[1]).applyQuaternion(_trQ).add(R.root.position).setY(y0+h));
    // the weapon's down end turned straight down, the least turn of the wrist that does it, so the fist keeps its hold round the grip
    R.root.updateMatrixWorld(true);W.getWorldQuaternion(_trQ);_trD.set(0,dn,0).applyQuaternion(_trQ).normalize();
    _tgQ.setFromUnitVectors(_trD,_tgA.set(0,-1,0));R.handR.getWorldQuaternion(_tgQ2);_tgQ.multiply(_tgQ2);R.handR.parent.getWorldQuaternion(_tgQ2);
    _tgQ.premultiply(fix);R.handR.quaternion.copy(_tgQ.premultiply(_tgQ2.invert()));R.root.updateMatrixWorld(true);};
  // the builder's fist is where its arm puts it, not the driver's (its forearm turns the copy, tpHBHold): five times, the driver's wrist
  // moved by what the builder's fist (the copy's pivot, its fingers' middle) misses its height by (for a haft the row's middle, else the
  // weapon's down end on the floor), and turned by what the copy misses straight down by (`fix`), so the hilt runs through the fist
  const hd=R.hbHeld&&R.hbHeld.find(x=>x.o===W),lim=y=>Math.max(T.hand[0]*st,Math.min(T.hand[1]*st,y)),wantH=h;
  for(let k=0;k<5;k++){place();if(!hd||!hd.f||!hd.f.length||!R.rig.hb)break;tpHBPose(R);_trP.set(0,0,0);
    const want=lim(T.haft?wantH:Math.abs(dn>0?hi:lo)*hd.c.getWorldScale(_trS).y); /* the copy's own scale, not the driver's */for(const b of hd.f)_trP.add(_trW2.setFromMatrixPosition(b.matrixWorld));
    h+=want-(_trP.y/hd.f.length-y0);
    hd.c.updateMatrixWorld(true);hd.c.getWorldQuaternion(_trQ);_trD.set(0,dn,0).applyQuaternion(_trQ).normalize();fix.premultiply(_tgQ.setFromUnitVectors(_trD,_tgA.set(0,-1,0)));}
  place();R.rest={dn,lo,hi,haft:!!T.haft,y0};return true;}
// after tpHBPose: the builder's copy of the weapon (set in the builder's fingers, and turned with its forearm) stood straight up and down
// about the fist, and a haft slid through the fist until its end is on the floor
function tpRestHeld(R){const S=R.rest,h=S&&R.hbHeld&&R.hbHeld.find(x=>x.o===R.weapon);if(!h)return;const c=h.c,par=c.parent;if(!par)return;
  par.updateMatrixWorld(true);_trW.multiplyMatrices(par.matrixWorld,c.matrix).decompose(_trP,_trQ,_trS);
  _trD.set(0,S.dn,0).applyQuaternion(_trQ).normalize();_tgQ.setFromUnitVectors(_trD,_tgA.set(0,-1,0));_trQ.premultiply(_tgQ);
  if(S.haft){const e=Math.abs(S.dn>0?S.hi:S.lo)*_trS.y;_trP.y=S.y0+.005+e;}
  _trW.compose(_trP,_trQ,_trS);c.matrix.copy(_trM.copy(par.matrixWorld).invert().multiply(_trW));c.matrixWorldNeedsUpdate=true;c.updateMatrixWorld(true);}
// S1401 — the pull's holds on the builder's body: up to eight times (S2532), the driver's wrists aimed short by how far the builder's miss, and copied again
const _tmE=[new THREE.Vector3(),new THREE.Vector3()],_tmW=new THREE.Vector3(),_tmB=[new THREE.Vector3(),new THREE.Vector3()],_tmBm=[new THREE.Vector3(),new THREE.Vector3()];
function tpHBMantle(R){const H=R.rig.hb,M=R.mantle;if(M.w<=0)return;const wb=[H.P.byName['wrist.L'],H.P.byName['wrist.R']];if(!wb[0]||!wb[1])return;
  _tmE[0].set(0,0,0);_tmE[1].set(0,0,0);
  /* S2532 — up to eight passes, ended once both wrists are within a centimetre: two left the left wrist 9–13 cm off the ledge early in the
     pull, where the driver's arm is straight and out of reach and each pass takes only part of the miss */
  /* S2551 — and each arm keeps its best aim: the aim adds each pass's whole miss, and where the arm is in reach that can overshoot and
     swing (the spyglass's right wrist 5 cm off at the third pass, then 16 to 26 cm by the eighth). An arm whose miss has failed to shrink
     twice running is held at its best aim while the other goes on; the passes end when both are held or within a centimetre */
  /* S2593 — a hold part-way in (M.w under 1: the glass coming up, the pull letting go) is aimed for the whole hold and then blended:
     measured against the hold while the arm was only part-way to it, each pass added the blend's own shortfall to the aim, and the
     raise's left wrist swung from 0.10 to 0.92 m off the barrel and back */
  const part=M.w<1;if(part){tpMantleArms(R,_tmE,true);hbPose(R.rig);}
  /* S2593 — and a pass that misses by more than the best goes back to the best aim and steps half as far, then half again: the whole
     miss swung on in reach, now each pass starts from the hold's own first pose (the glass's right wrist 0.35, 0.22, 0.24, 0.21, 0.17,
     0.18 m off its hold). Out of reach every pass shrinks the miss, so the pull keeps its whole steps */
  const best=[1e9,1e9],gain=[1,1];
  for(let k=0;k<=8;k++){R.root.updateMatrixWorld(true);let mx=0,live=0;
    for(let i=0;i<2;i++){wb[i].getWorldPosition(_tmW);_tmW.sub(M.T[i]);const d=_tmW.length();mx=Math.max(mx,d);
      if(d<best[i]){best[i]=d;_tmB[i].copy(_tmE[i]);_tmBm[i].copy(_tmW);}else gain[i]*=.5;
      if(best[i]>=.01&&gain[i]>.07){_tmE[i].copy(_tmB[i]).addScaledVector(_tmBm[i],gain[i]);live++;}else _tmE[i].copy(_tmB[i]);}
    if(k===8||!live&&mx<=Math.max(best[0],best[1])+1e-4)break;
    tpMantleArms(R,_tmE,true);hbPose(R.rig);}
  /* the last pass's pose may be the worse for an arm: pose both at their best aims */
  R.root.updateMatrixWorld(true);let bad=false;for(let i=0;i<2;i++){wb[i].getWorldPosition(_tmW);if(_tmW.sub(M.T[i]).length()>best[i]+1e-4)bad=true;}
  if(bad){_tmE[0].copy(_tmB[0]);_tmE[1].copy(_tmB[1]);}
  if(bad||part){tpMantleArms(R,_tmE);hbPose(R.rig);}
  /* S2593 — the builder's body holds the pose now; the hidden driver's arms go back to the pose the hold began on, which tpPose eases
     from (tpSet) on the next frame. Left on the reach, a part of each frame's reach came into the next frame's start, and the raise's
     right shoulder swung 0.15 rad between one frame and the next */
  R.shL.quaternion.copy(M.q[0]);R.elL.quaternion.copy(M.q[1]);R.shR.quaternion.copy(M.q[2]);R.elR.quaternion.copy(M.q[3]);R.root.updateMatrixWorld(true);}
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
    q:[R.shL.quaternion.clone(),R.elL.quaternion.clone(),R.shR.quaternion.clone(),R.elR.quaternion.clone()],pull:true};
  tpMantleArms(R,null);
}
// the arms onto the pull's two holds (R.mantle, set by tpMantle this frame); err, the builder's wrists less the holds, aims the driver's
// wrists that much short so that the builder's body, whose arms are its own length, puts its wrists on them (tpHBPose)
/* S2593 — each reach starts from the pose the hold began on (M.q), so an aim gives one pose: begun from the last pass's, the shoulder's
   twist about the reach carried over pass to pass and frame to frame, and the builder's wrist, off the driver's by its own proportions,
   turned with it (the spyglass's right wrist 4 to 10 cm off the eye and the glass 11 to 18 cm off the fist from one frame to the next,
   held still). full: the reach alone, without the blend by M.w (tpHBMantle's passes) */
function tpMantleArms(R,err,full){const M=R.mantle;if(!M||M.w<=0)return;
  const arms=[[R.shL,R.elL,R.handL],[R.shR,R.elR,R.handR]];
  for(let i=0;i<2;i++){const[sh,el,wr]=arms[i];_tmT.copy(M.T[i]);if(err)_tmT.sub(err[i]);
    sh.quaternion.copy(M.q[i*2]);el.quaternion.copy(M.q[i*2+1]);sh.updateMatrixWorld(true);
    tpReach(sh,el,wr,_tmT);
    if(M.w<1&&!full){_tmQ[0].copy(sh.quaternion);_tmQ[1].copy(el.quaternion);sh.quaternion.slerpQuaternions(M.q[i*2],_tmQ[0],M.w);el.quaternion.slerpQuaternions(M.q[i*2+1],_tmQ[1],M.w);sh.updateMatrixWorld(true);}}
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
const WORK_TOOL={pick:{name:'Pick',weaponShape:'pick',twoHand:true,matCol:0x7a7e86,matGuard:0x5a3a22},hatchet:{name:'Hatchet',weaponShape:'hatchet',matCol:0x9a9ea6,matGuard:0x5a3a22},
  rod:{name:'Fishing Rod',weaponShape:'rod',matCol:0x8a6a44,matGuard:0x8a6a44},
  net:{name:'(the net)',bare:true},
  glass:{name:'Spyglass',weaponShape:'glass',matCol:0xb8903c,matGuard:0xb8903c}}; /* S2224 — the rod while a line is out (ROD_FX below); S2225 — the hands bare on the net's rope (NET_FX); S2236 — the spyglass raised (GLASS_FX) */
const WORK_SWING=.72;
const WORK={tool:null,axe:null,swung:false,left:1e9,n:0};
function workKind(){if(typeof MINE!=='undefined'&&MINE)return 'pick';if(typeof CHOP!=='undefined'&&CHOP)return chopTool()==='axe'?'axe':'hatchet';return rodOut()?'rod':netOut()?'net':glassOut()?'glass':null;}
function workShown(){const k=WORK.tool;return k==='axe'?WORK.axe:k?WORK_TOOL[k]:null;}
// fn run with the work's piece as the weapon in hand, and the real one put back after
function workWield(fn){const t=workShown(),w=EQ.weapon;if(!t||t===w)return fn();EQ.weapon=t.bare?null:t;try{return fn();}finally{EQ.weapon=w;}}
function workTick(){const k=workKind();
  if(k!==WORK.tool){WORK.tool=k;WORK.axe=k==='axe'?EQ.weapon:null;WORK.swung=false;WORK.left=1e9;
    if(typeof sheathView==='function')sheathView();else if(typeof buildViewmodel==='function')buildViewmodel();}
  if(!k||k==='rod'||k==='net'||k==='glass')return;
  const left=MINE?MINE.t:CHOP.tm;if(left>WORK.left+.05)WORK.swung=false;WORK.left=left;
  if(WORK.swung||left>ANIM_PARAMS.swing.impactPoint*WORK_SWING||swingT>0||(typeof SWING!=='undefined'&&SWING)||typeof vmSword==='undefined'||!vmSword)return;
  WORK.swung=true;WORK.n++;swingT=WORK_SWING;const u=vmSword.userData;u.swingMax=WORK_SWING;u.swingVariant=2;u.swingIsPower=false;}
// S2224 — the rod's cast (Michael's B on #1504, the bodies part; 86-world-crime.js's ROD): while a line is out the rod is in your hand
// in both views (WORK_TOOL.rod, as the pick is), and it plays the cast: drawn back over the shoulder (0–0.3 s), flicked out low (to
// 0.55 s), settled at 35° over the water (to 1 s), its tip nodding when a fish takes; when the cast ends (struck, reeled in, walked
// off) it is lifted to 75° for 0.7 s and put away. The line runs from the tip's loop (ROD_TIP up the kit's rod) to a cork float that
// flies out with the flick (0.42–0.75 s) and lies at the cast's spot (ROD.cast.wx, wz) on the water, bobbing, pulled under at the bite.
// All of it is read from ROD.cast and the wall clock; nothing here decides an outcome (the bite and the strike are tickRod's)
const ROD_TIP=2.606,ROD_E={rest:35,back:100,flick:15,lift:75},ROD_FX={c:null,t0:0,end:0,until:0,e:35,line:null,bob:null,tip:new THREE.Vector3(),fl:new THREE.Vector3(),seen:false};
const _rdV=new THREE.Vector3(),_rdD=new THREE.Vector3(),_rdQ=new THREE.Quaternion(),_rdQ2=new THREE.Quaternion(),_rdP=new THREE.Vector3(),_rdS=new THREE.Vector3(),_rdY=new THREE.Vector3(0,1,0);
// the cast's start and end, noticed by whoever asks first (workKind asks each frame, before the tool is put away)
function rodWatch(){const F=ROD_FX,C=typeof ROD!=='undefined'?ROD.cast:null,now=performance.now();if(C===F.c)return C;
  if(C){F.t0=now;F.until=0;F.last=C;}else if(F.c){F.end=now;F.until=now+700;F.e0=F.e;}F.c=C;return C;}
function rodOut(){return !!rodWatch()||performance.now()<ROD_FX.until;}
function _rdEase(x){x=Math.max(0,Math.min(1,x));return (1-Math.cos(x*Math.PI))/2;}
// the rod's elevation over the level (degrees) and the float's flight (0 at the tip, 1 on the water; null when it is not out)
function rodPhase(){const F=ROD_FX,C=rodWatch(),now=performance.now(),E=ROD_E;
  let e,fly=null,bite=false;
  if(C){const t=(now-F.t0)/1000;bite=(worldState.gameTimeAbsMinutes||0)>=C.bite;
    e=t<.3?E.rest+(E.back-E.rest)*_rdEase(t/.3):t<.55?E.back+(E.flick-E.back)*_rdEase((t-.3)/.25):t<1?E.flick+(E.rest-E.flick)*_rdEase((t-.55)/.45):E.rest;
    if(t>=1&&bite)e=E.rest-4+3*Math.sin(now*.025);fly=t<.42?null:Math.min(1,(t-.42)/.33);}
  else if(now<F.until){const u=(now-F.end)/250;e=F.e0+(E.lift-F.e0)*_rdEase(u);fly=u<1?1-u:null;}
  else e=E.rest;
  F.e=e;return {e,fly,bite};}
// the direction the rod points in the world: ahead of you at its elevation, a little out to the right so it clears the head when drawn back
function rodDir(e,out){const a=e*Math.PI/180,f=_rdV.set(-Math.sin(yaw),0,-Math.cos(yaw)),c=Math.cos(a);return out.set(f.x*c+Math.cos(yaw)*.12,Math.sin(a),f.z*c-Math.sin(yaw)*.12).normalize();}
function rodMesh(o){let m=null;if(o)o.traverse(x=>{if(!m&&x.isMesh)m=x;});return m;}
// third person, after tpPose: the right arm held out (drawn up toward the shoulder as the rod goes back)
function tpRodArm(R,P){const r=Math.max(0,Math.min(1,(P.e-ROD_E.rest)/(ROD_E.back-ROD_E.rest)));
  tpSet(R.shR,-.7-1.15*r,0,-.15,1);tpSet(R.elR,-.8-.65*r,0,0,1);}
// after tpHBPose: the builder's copy of the rod turned about the fist to point along rodDir; its tip's loop is where the line starts
function tpRodHeld(R,P){const W=R.weapon,H=R.rig.hb,h=H&&R.hbHeld&&R.hbHeld.find(x=>x.o===W);let o=W;
  if(h){const c=h.c;H.root.updateMatrixWorld(true);H.root.getWorldQuaternion(_rdQ2).invert();rodDir(P.e,_rdD).applyQuaternion(_rdQ2);
    c.matrix.decompose(_rdP,_rdQ,_rdS);_rdQ2.setFromUnitVectors(_rdV.copy(_rdY).applyQuaternion(_rdQ).normalize(),_rdD);_rdQ.premultiply(_rdQ2);
    c.matrix.compose(_rdP,_rdQ,_rdS);c.matrixWorldNeedsUpdate=true;c.updateMatrixWorld(true);o=c;}
  const m=rodMesh(o);if(!m)return false;m.updateMatrixWorld(true);ROD_FX.tip.set(0,ROD_TIP,0).applyMatrix4(m.matrixWorld);return true;}
// first person: the rod's level (FP_LEVEL's pivot) turned through the cast, and its tip carried from the view model's camera to the
// world's at the same place on the screen (the two cameras' fields differ)
function fpRodHeld(P){if(typeof vmSword==='undefined'||!vmSword)return false;const pv=vmSword.userData.level,k=vmSword.userData.kit;if(!pv||!k||k.userData.kit!=='rod')return false;
  pv.rotation.x=-(Math.PI/2-P.e*Math.PI/180);const m=rodMesh(k);if(!m)return false;vmSword.updateMatrixWorld(true);
  const p=ROD_FX.tip.set(0,ROD_TIP,0).applyMatrix4(m.matrixWorld),s=Math.tan(CAM.fov*Math.PI/360)/Math.tan(VM_CAM.fov*Math.PI/360);p.x*=s;p.y*=s;CAM.updateMatrixWorld();p.applyMatrix4(CAM.matrixWorld);return true;}
function rodFloat(){const g=new THREE.Group(),M=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8});
  const b=new THREE.Mesh(new THREE.SphereGeometry(.022,10,8),M(0xc8a070));b.scale.y=1.35;g.add(b);
  const q=new THREE.Mesh(new THREE.CylinderGeometry(.003,.004,.07,6),M(0xe8e0d0));q.position.y=.06;g.add(q);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.0045,.004,.025,6),M(0xb03020));t.position.y=.1;g.add(t);g.name='rodFloat';return g;}
function rodLine(){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(24*3),3));
  const l=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xd8d2c0,transparent:true,opacity:.75}));l.frustumCulled=false;l.name='rodLine';return l;}
function rodHide(){const F=ROD_FX;for(const o of [F.line,F.bob])if(o&&o.parent)o.parent.remove(o);F.seen=false;}
// each frame (tpUpdate): the hold, the float and the line
function rodTick(R){if(!rodOut()||typeof activeZoneId==='undefined'||activeZoneId!=='world'||typeof scene==='undefined'||!scene){rodHide();return;}
  const P=rodPhase(),F=ROD_FX,C=ROD.cast||F.last;
  const held=thirdPerson?(R&&R.weapon&&R.weapon.userData.kit==='rod'&&tpRodHeld(R,P)):fpRodHeld(P);
  if(!held||P.fly==null||!C){rodHide();return;}
  if(!F.line){F.line=rodLine();F.bob=rodFloat();}
  for(const o of [F.line,F.bob])if(o.parent!==scene)scene.add(o);F.seen=true;
  const now=performance.now()/1000,sea=typeof SEA_Y==='number'?SEA_Y:0,s=_rdEase(P.fly),
    wy=sea+(P.bite&&ROD.cast?-.05-.03*Math.sin(now*14):.006*Math.sin(now*2.1));
  F.fl.set(F.tip.x+(C.wx-F.tip.x)*s,F.tip.y+(wy-F.tip.y)*s+Math.sin(Math.PI*s)*.8,F.tip.z+(C.wz-F.tip.z)*s);F.bob.position.copy(F.fl);
  F.bob.rotation.z=P.fly<1?(1-P.fly)*1.2:P.bite?.25*Math.sin(now*9):0;
  const a=F.line.geometry.attributes.position,n=a.count,d=F.tip.distanceTo(F.fl),sag=(P.fly<1?.02:P.bite?.01:.07)*d;
  for(let i=0;i<n;i++){const u=i/(n-1);a.setXYZ(i,F.tip.x+(F.fl.x-F.tip.x)*u,F.tip.y+(F.fl.y+.11-F.tip.y)*u-sag*4*u*(1-u),F.tip.z+(F.fl.z-F.tip.z)*u);}
  a.needsUpdate=true;}
// S2225 — the net's cast (Michael's B on #1504; 86-world-crime.js's NET): from your deck the net is paid out over the side and laid round
// in a ring on the water, a purse seine: a head rope of cork floats on the surface and a curtain of mesh 1.4 m deep under it, 12 m long,
// ringed 2.2 m about a point 3 m off you toward the school (or ahead). It runs out over the first 3 s (NET_MS is 8) while the curtain sinks,
// lies to the haul, and in the 1.2 s after NET.on ends it is pursed (the ring drawn in to 0.3 m) and lifted to your hands. A rope runs from
// your hands to the head rope's first float. Third person: both arms out low, paying out hand over hand, then hauling. All of it is read
// from NET.on and the wall clock; nothing here decides an outcome (the haul is netHaul's)
const NET_LEN=12,NET_R=2.2,NET_OFF2=3,NET_DEEP=1.4,NET_COLS=41,NET_ROWS=6,NET_CORKS=14;
const NET_FX={c:null,t0:0,end:0,until:0,last:null,ctr:new THREE.Vector3(),a0:0,mesh:null,corks:null,rope:null,hand:new THREE.Vector3(),seen:false};
function netWatch(){const F=NET_FX,N=typeof NET!=='undefined'?NET.on:null,now=performance.now();if(N===F.c)return N;
  if(N){F.t0=now;F.until=0;F.last=N;const s=N.s;let dx=s?s.cx-px:0,dz=s?s.cz-pz:0,d=Math.hypot(dx,dz);if(d<.5){dx=-Math.sin(yaw);dz=-Math.cos(yaw);d=1;}
    F.ctr.set(px+dx/d*NET_OFF2,0,pz+dz/d*NET_OFF2);F.a0=Math.atan2(-dx/d,-dz/d);}
  else if(F.c){F.end=now;F.until=now+1200;}F.c=N;return N;}
function netOut(){return !!netWatch()||performance.now()<NET_FX.until;}
// pay: how much of the net is out (0–1); sink: how far the curtain hangs (0–1); purse: the haul (0–1)
function netPhase(){const F=NET_FX,N=netWatch(),now=performance.now();
  if(N){const t=(now-F.t0)/1000;return {t,pay:_rdEase(t/3),sink:_rdEase((t-.4)/3),purse:0};}
  const u=(now-F.end)/1200;return {t:u,pay:1,sink:1,purse:_rdEase(u)};}
function netBuild(){const F=NET_FX;
  const g=new THREE.BufferGeometry(),n=(NET_ROWS*(NET_COLS-1)+NET_COLS*(NET_ROWS-1))*2;g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
  F.mesh=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x9a8a66,transparent:true,opacity:.8}));F.mesh.frustumCulled=false;F.mesh.name='netMesh';
  F.corks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.05,.05,.07,8),new THREE.MeshStandardMaterial({color:0xb08a58,roughness:.85}),NET_CORKS);F.corks.frustumCulled=false;F.corks.name='netCorks';
  F.rope=rodLine();F.rope.material=F.rope.material.clone();F.rope.material.color.setHex(0x8a7a58);F.rope.material.opacity=.95;F.rope.name='netRope';}
function netHide(){const F=NET_FX;for(const o of [F.mesh,F.corks,F.rope])if(o&&o.parent)o.parent.remove(o);F.seen=false;}
const _ntM=new THREE.Matrix4(),_ntP=new THREE.Vector3();
// the point of the head rope at u (0 at the first float, 1 at the net's end), and row v's depth under it
function netAt(P,u,v,out){const F=NET_FX,sea=typeof SEA_Y==='number'?SEA_Y:0,r=NET_R+(.3-NET_R)*P.purse,L=Math.min(NET_LEN/r,Math.PI*1.9),a=F.a0+u*P.pay*L,
    cx=F.ctr.x+(F.hand.x-F.ctr.x)*P.purse*.6,cz=F.ctr.z+(F.hand.z-F.ctr.z)*P.purse*.6,lift=(F.hand.y-.3-sea)*P.purse;
  return out.set(cx+Math.sin(a)*r,sea+.02+lift-v*NET_DEEP*P.sink*(1-.6*P.purse),cz+Math.cos(a)*r);}
function netTick(R){if(!netOut()||typeof activeZoneId==='undefined'||activeZoneId!=='world'||typeof scene==='undefined'||!scene){netHide();return;}
  const F=NET_FX,P=netPhase();if(!F.mesh)netBuild();
  // your hands: the builder's wrists in third person, else a little ahead of and under the eye
  let hd=false;if(thirdPerson&&R&&R.rig.hb){const by=R.rig.hb.P.byName,a=by&&by['wrist.L'],b=by&&by['wrist.R'];if(a&&b){F.hand.setFromMatrixPosition(a.matrixWorld).add(_ntP.setFromMatrixPosition(b.matrixWorld)).multiplyScalar(.5);hd=true;}}
  if(!hd){CAM.updateMatrixWorld();F.hand.set(.1,-.45,-.5).applyMatrix4(CAM.matrixWorld);}
  for(const o of [F.mesh,F.corks,F.rope])if(o.parent!==scene)scene.add(o);F.seen=true;
  const a=F.mesh.geometry.attributes.position;let k=0;const put=(u,v)=>{netAt(P,u,v,_ntP);a.setXYZ(k++,_ntP.x,_ntP.y,_ntP.z);};
  for(let j=0;j<NET_ROWS;j++)for(let i=0;i<NET_COLS-1;i++){put(i/(NET_COLS-1),j/(NET_ROWS-1));put((i+1)/(NET_COLS-1),j/(NET_ROWS-1));}
  for(let i=0;i<NET_COLS;i++)for(let j=0;j<NET_ROWS-1;j++){put(i/(NET_COLS-1),j/(NET_ROWS-1));put(i/(NET_COLS-1),(j+1)/(NET_ROWS-1));}
  a.needsUpdate=true;
  const bob=performance.now()/1000;for(let c=0;c<NET_CORKS;c++){netAt(P,c/(NET_CORKS-1),0,_ntP);_ntP.y+=.01*Math.sin(bob*2+c);F.corks.setMatrixAt(c,_ntM.makeTranslation(_ntP.x,_ntP.y,_ntP.z));}
  F.corks.instanceMatrix.needsUpdate=true;
  const r=F.rope.geometry.attributes.position,n=r.count;netAt(P,0,0,_ntP);const d=F.hand.distanceTo(_ntP);
  for(let i=0;i<n;i++){const u=i/(n-1);r.setXYZ(i,F.hand.x+(_ntP.x-F.hand.x)*u,F.hand.y+(_ntP.y-F.hand.y)*u-.06*d*4*u*(1-u),F.hand.z+(_ntP.z-F.hand.z)*u);}
  r.needsUpdate=true;}
// third person, after tpPose: both arms out low on the rope, hand over hand as it pays out and as it is hauled
function tpNetArms(R,P){const now=performance.now()/1000,w=P.purse>0?.35*Math.sin(now*10):P.t<3?.25*Math.sin(now*6):0;
  tpSet(R.shL,-.95+w,0,.12,1);tpSet(R.shR,-.95-w,0,-.12,1);tpSet(R.elL,-.45-Math.max(0,w),0,0,1);tpSet(R.elR,-.45-Math.max(0,-w),0,0,1);}
// S2236 — the spyglass raised (Michael's B on #1504, the bodies part; 86-world-crime.js's GLASS): while it is up it is in your right fist
// (WORK_TOOL.glass, the kit's draw-tube) and both hands hold it to the right eye, the right on the first draw by the eye and the left
// under the barrel, along the view (yaw and pitch). It comes up over GLASS_MS from the fist's carry and goes down the same way when it
// is lowered, then is put away. In third person the camera comes to the eye as it comes up (by GLASS_CAM of the raise), so the narrow
// view is the eye's, and the body, too close to see past, is hidden; lowered, the camera goes back out. In first person the view model is
// hidden while it is up or going down: the glass's ring is the view. Read from GLASS.up and the wall clock; nothing here decides an outcome
const GLASS_MS=450,GLASS_CAM=.6,GLASS_EYE=.1155,GLASS_FX={up:false,t0:0,end:0,until:0,u0:0,u:0,eye:new THREE.Vector3(),dir:new THREE.Vector3()};
const _glM=new THREE.Matrix4(),_glP=new THREE.Vector3(),_glQ=new THREE.Quaternion(),_glS=new THREE.Vector3(),_glP2=new THREE.Vector3(),_glQ2=new THREE.Quaternion(),_glR=new THREE.Vector3();
function glassWatch(){const F=GLASS_FX,up=typeof GLASS!=='undefined'&&!!GLASS.up,now=performance.now();if(up===F.up)return up;
  if(up){F.t0=now-F.u*GLASS_MS;F.until=0;}else{F.end=now;F.u0=F.u;F.until=now+F.u*GLASS_MS;}F.up=up;return up;}
function glassOut(){return glassWatch()||performance.now()<GLASS_FX.until;}
// how far it is raised, 0 (in the fist's carry) to 1 (at the eye)
function glassPhase(){const F=GLASS_FX,now=performance.now();F.u=glassWatch()?_rdEase((now-F.t0)/GLASS_MS):now<F.until?F.u0*_rdEase((F.until-now)/(F.u0*GLASS_MS||1)):0;return F.u;}
// the eye the glass is put to (the gameplay eye, where the narrow view is drawn from) and the view's direction
function glassEye(camY){const F=GLASS_FX,cp=Math.cos(pitch);F.dir.set(-Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp);F.eye.set(px,camY,pz);return F;}
// third person, after tpPose: both wrists aimed at the glass's hold (R.mantle's two-handed reach, as the crossbow's span uses it; the
// builder's wrists by tpHBMantle), the right on the first draw 6 cm ahead of the eye cup, the left under the barrel 0.4 m out
function tpGlassArms(R,u,camY){const F=glassEye(camY),D=F.dir,rt=_glR.set(Math.cos(yaw),0,-Math.sin(yaw)),dn=_glP2.crossVectors(D,rt).normalize();
  const at=(f,r,d)=>F.eye.clone().addScaledVector(D,f).addScaledVector(rt,r).addScaledVector(dn,d);
  R.root.updateMatrixWorld(true);
  R.mantle={w:u,T:[at(.4,-.02,.06),at(.03,.035,.07)],q:[R.shL.quaternion.clone(),R.elL.quaternion.clone(),R.shR.quaternion.clone(),R.elR.quaternion.clone()],glass:true};
  tpMantleArms(R,null);}
// after tpHBPose: the builder's copy of the glass turned in the fist onto the view by u and, by u³, set from the fist's place to the eye's
// (it rides in the fist as the arm comes up and closes the last centimetres at the top), its eye cup at the eye and its barrel along the view
function tpGlassHeld(R,u,camY){const W=R.weapon,H=R.rig.hb,h=H&&R.hbHeld&&R.hbHeld.find(x=>x.o===W);if(!h)return false;const c=h.c,F=glassEye(camY);
  H.root.updateMatrixWorld(true);c.updateMatrixWorld(true);c.matrixWorld.decompose(_glP,_glQ,_glS);
  _glQ2.setFromUnitVectors(_rdY,F.dir);_glQ.slerp(_glQ2,u);_glP.lerp(_glP2.copy(F.eye).addScaledVector(F.dir,GLASS_EYE+.005),u*u*u);
  _glM.compose(_glP,_glQ,_glS).premultiply(_tpHm.copy(H.root.matrixWorld).invert());c.matrix.copy(_glM);c.matrixWorldNeedsUpdate=true;c.updateMatrixWorld(true);return true;}
// the third-person camera brought to the eye as the glass comes up (after tpCamera)
function tpGlassCam(u,camY){if(u<=0)return;const k=_rdEase(u/GLASS_CAM),F=glassEye(camY);CAM.position.lerp(F.eye,k);
  TP.near=Math.hypot(CAM.position.x-px,CAM.position.z-pz);TP.dist=Math.hypot(CAM.position.x-px,CAM.position.y-camY,CAM.position.z-pz);}
// S2694 — your own fall (Michael, 25 Nov 2026: "Death ragdoll needs to be implemented for the player"). At death your body falls on the
// foes' ragdoll (S419's 21 points, ragdollStart): pushed away from the nearest live foe, or let go backwards when nothing struck (a fall,
// the cold, a drowning). The loop stops at `dead` before tpUpdate, so tickPeople (which ticks the ragdolls every frame) calls tpDeathTick:
// the builder's body follows the driver's bones, and in first person the camera rides the head down to where it lies, rolled with it.
// The first live frame after a load (tpUpdate) puts the body back on its feet. Nothing here decides an outcome; the fall's roll is cosmetic.
const TP_DEATH={on:false,R:null,hips0:null,cull:true,off:null,t:0,roll:0,pitch:0};
function tpDeathGround(){
  if(activeZoneId==='dungeon'){const f=(typeof currentFloor!=='undefined'&&currentFloor===2&&typeof FLOOR2_Y!=='undefined')?FLOOR2_Y:0;return ()=>f;}
  if(typeof isInterior==='function'&&isInterior()){const f=jumpY;return ()=>f;}
  if(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.isSwimming&&WORLD.isSwimming()){const f=SEA_Y-.2;return ()=>f;}
  if(typeof activeTerrainH!=='function')return ()=>jumpY;
  const t=activeTerrainH(px,pz),f=jumpY;return (typeof onGround!=='undefined'&&onGround&&f-t>.35)?()=>f:activeTerrainH; /* on a deck or a platform its boards are the floor */}
function tpDeathSolid(){
  if(typeof isInterior==='function'&&isInterior())return typeof intSolidAt==='function'?(x,z)=>intSolidAt(x,z,.05,0):null;
  if(activeZoneId==='dungeon')return typeof dSolid==='function'?(x,z)=>dSolid(x,z):null;
  if(activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.solidAt)return WORLD.solidAt;return null;}
function tpDeathPush(){let best=null,bd=6;
  const list=activeZoneId==='dungeon'?(typeof ENEMIES!=='undefined'?ENEMIES:[]):(typeof ZE!=='undefined'?ZE:[]);
  for(const e of list){if(!e||e.dead||(activeZoneId==='dungeon'&&e.floor!==currentFloor))continue;const d=Math.hypot(px-e.x,pz-e.z);if(d<bd){bd=d;best=e;}}
  let dx,dz,k;if(best&&bd>1e-3){dx=(px-best.x)/bd;dz=(pz-best.z)/bd;k=1.6+Math.random()*.7;}else{dx=Math.sin(yaw);dz=Math.cos(yaw);k=.5+Math.random()*.3;}
  return new THREE.Vector3(dx*k,0,dz*k);}
function tpDeathStart(){const D=TP_DEATH;if(D.on||!scene||typeof ragdollStart!=='function')return false;
  let R=null;try{R=tpEnsure();}catch(e){console.warn('death: no body',e);}if(!R||!R.rig||!R.rig.B)return false;
  if(R.root.parent!==scene){if(R.root.parent)R.root.parent.remove(R.root);scene.add(R.root);}
  R.root.position.set(px,jumpY,pz);R.root.rotation.set(0,yaw+Math.PI,0);R.root.visible=!!thirdPerson;R.root.updateMatrixWorld(true);
  const B=R.rig.B;D.hips0=B.hips.position.clone();D.cull=R.rig.mesh.frustumCulled;
  if(!ragdollStart(R.rig,tpDeathPush(),{ground:tpDeathGround(),solid:tpDeathSolid()}))return false;
  D.on=true;D.R=R;D.t=0;D.look=null;D.roll=CAM.rotation.z||0;D.pitch=CAM.rotation.x;
  D.off=CAM.position.clone().sub(B.head.getWorldPosition(new THREE.Vector3()));
  return true;}
const _tpdV=new THREE.Vector3(),_tpdN=new THREE.Vector3();
function tpDeathTick(dt){const D=TP_DEATH,R=D.R;if(!D.on||!R)return;dt=Math.min(Math.max(dt||0,0),.05);D.t+=dt;
  if(R.rig.hb){hbPose(R.rig);R.root.updateMatrixWorld(true);tpHBHold(R);}
  if(thirdPerson){ /* the camera keeps its side of you and its distance (2 to 3.5 m), rises to 1.9 m over the ground and looks down at the hips */
    const hp=R.rig.B.hips.getWorldPosition(_tpdV),dx=CAM.position.x-hp.x,dz=CAM.position.z-hp.z,hd=Math.hypot(dx,dz)||1,k2=Math.max(2,Math.min(3.5,hd))/hd,e2=1-Math.exp(-dt/.35);
    const gy=tpDeathGround()(hp.x,hp.z);CAM.position.x+=(hp.x+dx*k2-CAM.position.x)*e2;CAM.position.z+=(hp.z+dz*k2-CAM.position.z)*e2;CAM.position.y+=(gy+1.9-CAM.position.y)*e2;
    if(!D.look)D.look=hp.clone().setY(hp.y+.6);D.look.lerp(hp,e2);CAM.lookAt(D.look);return;}
  const B=R.rig.B,h=B.head.getWorldPosition(_tpdV),k=Math.min(1,D.t/.5),e=1-Math.exp(-dt/.12);
  CAM.position.copy(h).addScaledVector(D.off,1-k*k);
  {const g=tpDeathGround()(CAM.position.x,CAM.position.z)+.14;if(CAM.position.y<g)CAM.position.y=g;}
  // the eye tips with the head: rolled by how far it lies to a side, pitched to the sky on its back and to the ground face down
  B.neck.getWorldPosition(_tpdN);const v=_tpdV.sub(_tpdN),l=v.length()||1,vr=(v.x*Math.cos(yaw)-v.z*Math.sin(yaw))/l,vf=(-v.x*Math.sin(yaw)-v.z*Math.cos(yaw))/l,vy=v.y/l;
  const roll=Math.max(-1.3,Math.min(1.3,-Math.atan2(vr,Math.abs(vy)+Math.abs(vf)))),pit=Math.max(-1.1,Math.min(1.1,-.7*Math.atan2(vf,Math.abs(vy)+Math.abs(vr))));
  D.roll+=(roll-D.roll)*e;D.pitch+=(pit-D.pitch)*e;CAM.rotation.set(D.pitch,yaw,D.roll);}
function tpDeathEnd(){const D=TP_DEATH,R=D.R;D.on=false;D.R=null;CAM.rotation.set(pitch,yaw,0);if(!R||!R.rig)return;
  if(typeof RAGDOLLS!=='undefined')for(const r of RAGDOLLS)if(r.rig===R.rig)RAGDOLLS.delete(r);
  R.rig.limp=false;R.rig.mesh.frustumCulled=D.cull;if(D.hips0)R.rig.B.hips.position.copy(D.hips0);R.root.rotation.x=0;TP.deadT=0;}
function tpUpdate(dt,st){
  workTick();
  if(TP_DEATH.on&&!dead)tpDeathEnd(); /* S2694 — up again after the load */
  if(!thirdPerson){
    if(TP.rig&&TP.rig.root.visible)TP.rig.root.visible=false;
    if(TP.hidVM){TP.hidVM=false;VM_SCENE.visible=true;}
    if(typeof fpHBCheck==='function')fpHBCheck();
    rodTick(null);netTick(null);
    {const gh=glassOut();if(gh)VM_SCENE.visible=false;else if(TP.glassVM)VM_SCENE.visible=true;TP.glassVM=gh;} /* S2236 — the glass's ring is the view */
    return;}
  if(!TP.hidVM){TP.hidVM=true;VM_SCENE.visible=false;}
  tpEnsure();
  const R=TP.rig;if(!scene)return;
  if(R.root.parent!==scene){if(R.root.parent)R.root.parent.remove(R.root);scene.add(R.root);}
  tpCamera(dt,st.camY);
  const glassU=glassOut()?glassPhase():0;tpGlassCam(glassU,st.camY); /* S2236 — the camera to the eye as the glass comes up */
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
  const rodK=R.weapon&&R.weapon.userData.kit==='rod'&&rodOut()?rodPhase():null;if(rodK)tpRodArm(R,rodK); /* S2224 — the rod held out */
  if(!rodK&&netOut())tpNetArms(R,netPhase()); /* S2225 — the net on its rope */
  const glassK=glassU>0&&R.weapon&&R.weapon.userData.kit==='glass'&&!R.mantle;if(glassK)tpGlassArms(R,glassU,st.camY); /* S2236 — the glass to the eye */
  tpDrawTick(R,'arm'); // S2471 — the hand to the hilt while a weapon is drawn or sheathed
  tpHBPose(R); // F10 — the builder's body follows the driver
  if(glassK)tpGlassHeld(R,glassU,st.camY);
  rodTick(R);netTick(R);
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
