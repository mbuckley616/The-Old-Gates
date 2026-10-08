// ═══════════════════════════════════════
// v80 — Session 492 — THE MESH INSPECTOR
//
// Every mesh the game builds, in one place, built by the game's own builders so it never drifts from what ships:
// a nested list by group (people, creatures, buildings, ships, plants and trees and rocks, props and furniture, weapons and
// armour), a thumbnail grid per group,
// and a stage where one piece turns under an orbit camera, animated by its own poses and gaits, at any hour's light,
// with a bandit beside it for scale and its distant copy beside that; pinned pieces stay on the stage, side by side. Opened from the title screen or the game with
// `openInspector()` (the console), or by loading the page as `index.html?inspector`; the control room links to it.
// While it is open the main loop hands it the frame (90-main.js) and nothing else ticks. Closing it hands the
// renderer's canvas back and resumes the game where it was. Nothing here runs unless it is opened.
// ═══════════════════════════════════════
const INSPECTOR={open:false,entries:[],groups:[],built:new Map(),sel:null,pins:[],shown:[],ui:null,scene:null,cam:null,orbit:null,opts:{anim:true,wire:false,lo:true,figure:true,ground:true,hour:12},t:0,prevT:0};

// ── the registry: groups → entries, each built by the builder the game uses ──
function inspRegistry(){
  const E=[];const slug=x=>String(x).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const add=(group,sub,name,file,build)=>E.push({id:E.length,key:slug(group)+'/'+slug(sub)+'/'+slug(name),group,sub,name,file,build});
  const idlePerson=rig=>(t)=>pwApply(rig,pwIdle(t,pwOpts(rig)));
  const personAnim=rig=>{let ph=0;return (t,dt,mode)=>{if(mode==='walk'){ph=(ph+dt*1.4)%1;pwApply(rig,pwWalk(ph,pwOpts(rig)));}
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
    const rig=buildFoe(type,0,0);PEOPLE_RIGS.delete(rig);if(FOE_DRESS[type].goblin)rig.root.scale.multiplyScalar(.72); /* S535 — at the size the game builds a goblin */const anim=personAnim(rig);anim(0,0,'idle');return {obj:rig.root,anim,modes:['idle','walk','wave']};});
  // 2. Creatures — the wolf kit's kinds, the spider kit's, then the zone and dungeon foes that have a body of their own
  for(const name of Object.keys(WOLF_KINDS))add('Creatures','On the wolf kit',name,'34-creatures.js',()=>{
    const rig=buildWolf(name,WOLF_KINDS[name].world||WOLF_KINDS[name].play||1);WOLF_RIGS.delete(rig);let ph=0; /* S524 — at the size the game builds it (the dragon's 2.88); S632 — the wolves' and the bear's too (play) */
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
  for(const k of ['tower','shrine'])add('Buildings','Places','poi '+k,'87-world-quests.js',()=>({obj:inspMesh(WORLD.poiGeo(k))}));
  // S557 — the lair, the glade and the bandit camp (Michael's note, S541: "maybe a few others that should probably be in this list"),
  // on the systems builder's geometry-only previews (S545, WORLD.poiPreview, seed 7): the look alone, with no stamp, foe, chest or light.
  // From the title screen the world's tree prototypes are not built yet; the glade's ring of trees needs them, as the trees' own entries do
  if(typeof WORLD!=='undefined'&&WORLD.poiPreview)for(const [k,n] of [['glade','poi glade'],['lair','poi lair'],['bcamp','poi bandit camp']])add('Buildings','Places',n,'87-world-quests.js',()=>{if(!PROTO.oak)buildProtos();return {obj:WORLD.poiPreview(k,7)};}); /* the glade's trees are the world's prototypes, built at world entry */
  for(const k of ['well','stall','tent','ruin','stone'])add('Buildings','Town furniture',k,'82-world-structures.js',()=>{
    const r=WORLD.furnProto(k,pHash('insp|'+k));return {obj:inspMesh(r.hi),lo:r.lo&&inspMesh(r.lo)};});
  // S541 — the dungeons (Michael: "No dungeon mesh in the inspector either"): one small floor of each theme, laid out by the game's
  // makeDungeon and dressed by its buildDunShell in the theme's colours and damp, without its ceiling so the stage looks in
  for(const theme of Object.keys(THEME_DEF))add('Buildings','Dungeons',theme+' floor','56-dungeon-build.js',()=>{const th=THEME_DEF[theme],seed=pHash('insp|'+theme)%1e5+1,gen=makeDungeon('tiny',seed),map=gen.map;
    const sh=buildDunShell(map,0,th.wallCol,th.floorCol,{seed,damp:DUN_DAMP[theme]||DUN_DAMP.ruins,rooms:gen.rooms||[]}),g=new THREE.Group();
    [sh.walls,sh.floor,sh.beams].forEach(m=>{if(m)g.add(m);});if(sh.ceil){sh.ceil.geometry.dispose();}g.position.set(-map[0].length/2,0,-map.length/2);const o=new THREE.Group();o.add(g);return {obj:o};});
  // 4. Ships — each class in each look with its rig, the sails trimming to a wind that walks round; the harbour boats
  for(const [kind,L,W] of [['sloop',13,4.4],['cog',17,5.6],['galleon',22,7]])for(const look of ['player','pirate','merchant'])
    add('Ships',kind,look,'85-world-sea.js',()=>{const m=WORLD.buildShipMesh(L,W,look);let th=0;
      return {obj:m,anim:(t,dt)=>{th=Math.sin(t*.25)*Math.PI;shipTrim(m,th,dt);},modes:['sails']};});
  for(let v=0;v<4;v++)add('Ships','Harbour boats','boat '+(v+1),'85-world-sea.js',()=>{const r=WORLD.boatBake(v);return {obj:new THREE.Mesh(r.geo,SHIP_MAT)};});
  // 5. Plants, trees and rocks — every herb whole and picked, the tree and scrub prototypes, the rocks of each biome
  for(const key of Object.keys(HERB_DEF))add('Plants, trees, rocks','Herbs',HERB_DEF[key].name||key,'30-plants.js',()=>{
    const g=plantGeo(key,false),p=plantGeo(key,true);return {obj:new THREE.Mesh(g,PLANT_MAT),lo:p&&new THREE.Mesh(p,PLANT_MAT),loLabel:'picked'};});
  const TREES=['oak','birch','broadleaf','conifer','pine','spruce','snowpine','willow','autumn','autumnRed','autumnGold','oakAutumn','birchAutumn','dead','bush','scrub','ember'];
  for(const k of TREES)add('Plants, trees, rocks','Trees and scrub',k,'80-world-terrain.js',()=>{if(!PROTO.oak)buildProtos();const g=PROTO[k];if(!g)throw new Error('no prototype '+k);return {obj:inspMesh(g)};});
  // S526 — the swamp's mushrooms, a section of their own (Michael's note on the one mushroom: "maybe its own subcategory")
  for(const [k,n] of [['mushroom','red'],['mushroomBrown','brown'],['mushroomPurple','purple bell'],['mushroomTan','tan parasol'],['mushroomBlue','blue clump']])
    add('Plants, trees, rocks','Mushrooms',n,'80-world-terrain.js',()=>{if(!PROTO.oak)buildProtos();return {obj:inspMesh(PROTO[k])};});
  for(const dress of Object.keys(ROCK_DRESS))for(const kind of ['boulder','outcrop','cluster'])add('Plants, trees, rocks','Rocks: '+dress,kind,'80-world-terrain.js',()=>{
    const key=rockProto(dress,kind);return {obj:inspMesh(PROTO[key])};});
  // S541 — the "poi crag" was not a place (Michael: "Not even sure what this is meant to be"): it is the lumpy boulder that lairs,
  // bandit camps' fire rings and rock piles are laid from (cragGeo). It is listed with the rocks now, by what it is.
  add('Plants, trees, rocks','Rocks','crag boulder (lairs, camps, rock piles)','87-world-quests.js',()=>({obj:inspMesh(WORLD.poiGeo('crag'))}));
  // 6. Props and furniture: the furniture kit every room is dressed from, the dungeon's chest and barrel, the sigil stones,
  //    and the town's lamp, signpost, trade signs, camp tents, the coach's cart and a quay
  const FURN=[['table',(K,N)=>K.table(1.4,.8,N,3)],['bench',(K,N)=>K.bench(1.6,N,5)],['chair',(K,N)=>K.chair(N,7)],['stool',(K,N)=>K.stool(N,9)],
    ['bed',(K,N)=>K.bed(N,11,1.9,1.1)],['chest',(K,N)=>K.chest(N,13)],['shelf',(K,N)=>K.shelf(1.4,N,17,true)],['dresser',(K,N)=>K.dresser(1.1,N,37)],['counter',(K,N)=>K.counter(2.4,N,29,false)],
    ['hearth',(K,N)=>K.hearth(4,2.6,N,23)],['cask',(K,N)=>K.cask(N,27)],['crate',(K,N)=>K.crate(.6,N,29)],['sack',(K,N)=>K.sack(71)],['rug',(K,N)=>K.rug(1.2,.8,N,19)],
    ['forge',(K,N)=>K.forge(2.8,N,51)],['anvil',(K,N)=>K.anvil(N,37)],['tub',(K,N)=>K.tub(N,39)],['rack',(K,N)=>K.rack(N,41)],['grindstone',(K,N)=>K.grindstone(N,43)],
    ['armour stand',(K,N)=>K.armourStand('mail',N,63)],['wall shield',(K,N)=>K.wallShield('round',0xa83a2a,47)],['armour bench',(K,N)=>K.armourBench(N,49)],['herb bundle',(K,N)=>K.herbBundle(.6,67)],
    ['still',(K,N)=>K.still(N,53)],['scales',(K,N)=>K.scales(55)],['pew',(K,N)=>K.pew(2.2,N,73)],['altar',(K,N)=>K.altar(N,59)],['dais',(K,N)=>K.dais(3,2,.3,77)],['pulpit',(K,N)=>K.pulpit(N,63)],
    ['column',(K,N)=>K.column(3,.3,65)],['banner',(K,N)=>K.banner(0x7a2a1e,67)],['throne',(K,N)=>K.throne(N,69)],['brazier',(K,N)=>K.brazier(87)],['notice board',(K,N)=>K.noticeBoard(1.4,1.1,N,89)],
    ['desk',(K,N)=>K.desk(1.6,N,91)],['bookcase',(K,N)=>K.bookcase(1.6,N,93)],['ladder',(K,N)=>K.ladder(2.6,N,95)],['wine rack',(K,N)=>K.wineRack(1.4,N,97)]];
  for(const nk of Object.keys(furnKit().WOOD))for(const [name,fn] of FURN)add('Props and furniture','The furniture kit: '+nk,name,'56-dungeon-build.js',()=>{const K=furnKit();const parts=fn(K,nk);return {obj:K.bake(parts)};});
  add('Props and furniture','The dungeon','chest','52-dungeon-gen.js',()=>{const g=new THREE.Group();buildChestShell(g,1);return {obj:g};});
  add('Props and furniture','The dungeon','barrel','52-dungeon-gen.js',()=>{const r=kitBarrel(1,0x8b5a2b);const g=new THREE.Group();for(const k of ['body','top']){const o=r[k];if(!o)continue;g.add(o.isObject3D?o:inspMesh(o));}return {obj:g};});
  for(const sp of SPELLS)add('Props and furniture','Sigil stones',sp.name||sp.id,'64-spells.js',()=>{const m=buildSigilMesh(sp.id);if(!m)throw new Error('no sigil');return {obj:m};});
  add('Props and furniture','The town','lamp post','82-world-structures.js',()=>({obj:inspMesh(lampPostGeo())}));
  add('Props and furniture','The town','signpost','82-world-structures.js',()=>({obj:inspMesh(signpostGeo([0,2.1,-1.6],7))}));
  for(const t of ['weapon','armor','potion','misc','inn','shipwright','general','smith'])add('Props and furniture','The town','sign: '+t,'82-world-structures.js',()=>{const g=new THREE.Group();buildTradeSign(g,t,'The '+t,0,0,1,0,0,0);return {obj:g};});
  for(let k=0;k<3;k++)add('Props and furniture','The town','camp tent '+(k+1),'87-world-quests.js',()=>({obj:inspMesh(campTentGeo(k))}));
  add('Props and furniture','The town','the coach’s cart','87-world-quests.js',()=>({obj:cartMesh()}));
  add('Props and furniture','The town','quay','84-world-interiors.js',()=>({obj:inspMesh(quayGeoHi(20,6,3,pRng(5)))}));
  // 7. Weapons and armour: the weapon kit's pieces (and rusted), the shields, the first-person viewmodel of each weapon type
  //    and of the fists and the shield, and your own body in each material's full kit
  const KIT=['dagger','sword','longsword','claymore','cutlass','axe','greataxe','mace','warhammer','flail','greatclub','staff','bow','bowbare'];
  for(const k of KIT)add('Weapons and armour','The weapon kit',k,'32-people.js',()=>({obj:buildWeapon(k)}));
  for(const k of ['sword','axe','mace'])add('Weapons and armour','The weapon kit',k+' (rusted)','32-people.js',()=>({obj:buildWeapon(k,{rust:true})}));
  for(const k of ['round','kite','tower'])add('Weapons and armour','Shields',k,'32-people.js',()=>({obj:buildWeapon(k)}));
  const withEQ=(set,fn)=>{const was={};for(const k in EQ)was[k]=EQ[k];try{set();return fn();}finally{for(const k in was)EQ[k]=was[k];for(const k in EQ)if(!(k in was))delete EQ[k];}};
  const armorOf=(tier,type)=>makeItem(tier,ARMOR_TYPES.find(a=>a.type===type),null,true);
  const grabVM=()=>{const g=new THREE.Group();for(const o of [vmSword,vmArmR]){if(!o)continue;if(o.parent)o.parent.remove(o);g.add(o);}if(vmSword&&vmSword.userData.fistL){const f=vmSword.userData.fistL;if(f.parent)f.parent.remove(f);g.add(f);}return g;};
  for(const w of WEAPON_TYPES)add('Weapons and armour','First person, in hand',w.type,'16-viewmodel.js',()=>withEQ(()=>{EQ.weapon=makeItem(3,w,null,false);},()=>{buildViewmodel();const g=grabVM();return {obj:g,vm:true};}));
  add('Weapons and armour','First person, in hand','fists','16-viewmodel.js',()=>withEQ(()=>{EQ.weapon=null;},()=>{buildViewmodel();const g=grabVM();return {obj:g,vm:true};}));
  add('Weapons and armour','First person, in hand','shield','16-viewmodel.js',()=>withEQ(()=>{EQ.offhand=armorOf(3,'Buckler');},()=>{buildShieldViewmodel();const g=new THREE.Group();for(const o of [vmShield,vmArmL]){if(!o)continue;if(o.parent)o.parent.remove(o);g.add(o);}return {obj:g,vm:true};}));
  for(const tier of [1,2,3,4,5,7,9])add('Weapons and armour','Your body in a full kit',MATERIALS[tier-1].name,'54-thirdperson.js',()=>withEQ(()=>{
      for(const t of ['Cuirass','Greaves','Helmet','Gauntlets','Boots'])EQ[ARMOR_TYPES.find(a=>a.type===t).slot]=armorOf(tier,t);EQ.weapon=makeItem(tier,WEAPON_TYPES.find(w=>w.type==='Sword'),null,false);EQ.offhand=armorOf(tier,'Buckler');},
    ()=>{const R=tpBuild(null,'gatelander');if(R.rig)PEOPLE_RIGS.delete(R.rig);return {obj:R.root};}));
  // S569 — your body in the light and robe lines (Michael's A on #161), each piece the heavy one's item with the systems builder's `line`
  const LINE_NAMES={light:{Helmet:'Hood',Cuirass:'Jerkin',Gauntlets:'Bracers',Greaves:'Leggings',Boots:'Soft Boots'},robe:{Helmet:'Cowl',Cuirass:'Robe',Gauntlets:'Wraps',Greaves:'Under-robe'}};
  for(const ln of ['light','robe'])for(const tier of [1,3,5,7,10])add('Weapons and armour',ln==='light'?'Your body in light armour':'Your body in robes',MATERIALS[tier-1].name,'32-people.js',()=>withEQ(()=>{
      for(const t in LINE_NAMES[ln]){const it=armorOf(tier,t);it.line=ln;it.name=MATERIALS[tier-1].name+' '+LINE_NAMES[ln][t];EQ[it.slot]=it;}if(ln==='robe')EQ.feet=null;EQ.weapon=ln==='light'?makeItem(tier,WEAPON_TYPES.find(w=>w.type==='Bow'),null,false):null;EQ.offhand=null;},
    ()=>{const R=tpBuild(null,'gatelander');if(R.rig)PEOPLE_RIGS.delete(R.rig);return {obj:R.root};}));
  // S560 — your body in each of the six cloaks (Michael's B on #148), over the starting clothes; the back slot is EQ.back
  for(const k of Object.keys(TP_CLOAK))add('Weapons and armour','Your body in a cloak',k,'54-thirdperson.js',()=>withEQ(()=>{EQ.back={slot:'back',cloak:k,name:'cloak '+k};},
    ()=>{const R=tpBuild(null,'gatelander');if(R.rig)PEOPLE_RIGS.delete(R.rig);R.root.rotation.y=Math.PI+.25;return {obj:R.root};})); /* turned to show the back */
  add('Weapons and armour','Your body in a full kit','as equipped now','54-thirdperson.js',()=>{const R=tpBuild(null,'gatelander');if(R.rig)PEOPLE_RIGS.delete(R.rig);return {obj:R.root};});
  return E;
}
function inspMesh(geo){const m=new THREE.Mesh(geo,VC_MAT);m.castShadow=true;m.receiveShadow=true;return m;}

// ── stats of a built thing ──
function inspStats(obj){let tris=0,calls=0;obj.updateMatrixWorld(true);obj.traverse(o=>{if(!o.isMesh||!o.visible)return;const g=o.geometry;if(!g)return;
  const n=(g.index?g.index.count:g.attributes.position?g.attributes.position.count:0)/3;tris+=n*(o.isInstancedMesh?o.count:1);calls++;});return {tris:Math.round(tris),calls};}
// S557 — an instanced mesh counts each instance where it stands (Box3 reads only its geometry, at the mesh's own place): the glade's
// ring of trees framed from inside it
function inspBox(obj){obj.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(obj);
  obj.traverse(o=>{if(!o.isInstancedMesh||!o.geometry.attributes.position)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const m=new THREE.Matrix4(),q=new THREE.Box3();
    for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);b.union(q.copy(o.geometry.boundingBox).applyMatrix4(m.premultiply(o.matrixWorld)));}});if(b.isEmpty())b.set(new THREE.Vector3(-.5,0,-.5),new THREE.Vector3(.5,1,.5));return b;}

// ── building and showing ──
function inspBuild(e){if(INSPECTOR.built.has(e.id))return INSPECTOR.built.get(e.id);
  let r;try{r=e.build();if(r&&r.vm){buildViewmodel();buildShieldViewmodel();}if(!r||!r.obj)throw new Error('builder returned nothing');r.obj.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    const b=inspBox(r.obj);r.box=b;r.stats=inspStats(r.obj);r.mode=r.modes?r.modes[0]:null;}
  catch(err){r={obj:null,err:String(err&&err.message||err)};console.warn('inspector: '+e.name,err);}
  INSPECTOR.built.set(e.id,r);return r;}
function inspShow(e){const I=INSPECTOR;I.sel=e;const r=inspBuild(e);const S=I.stage;while(S.children.length)S.remove(S.children[0]);
  const bar=I.ui.querySelector('#insp-name');const st=I.ui.querySelector('#insp-stats');const modes=I.ui.querySelector('#insp-modes');modes.innerHTML='';
  if(!r.obj){bar.textContent=e.name+' — failed';st.textContent=r.err;I.shown=[];inspPinsUI();return;}
  // the row: the pinned pieces, then this one (once), side by side with a gap, the whole row centred; a piece alone also shows its distant copy
  const row=[...I.pins.filter(x=>x.id!==e.id),e].filter(x=>{const q=inspBuild(x);return q.obj;});I.shown=row;
  const sizes=row.map(x=>{const q=I.built.get(x.id);return q.box.getSize(new THREE.Vector3());});
  const gap=Math.max(.4,Math.max(...sizes.map(z=>z.x))*.25);let total=sizes.reduce((a,z)=>a+z.x,0)+gap*(row.length-1);
  const single=row.length===1;const lo=single&&r.lo&&I.opts.lo?r.lo:null;const loSz=lo?inspBox(lo).getSize(new THREE.Vector3()):null;if(lo)total+=gap+loSz.x;
  let cur=-total/2;const sz=new THREE.Vector3();
  row.forEach((x,i)=>{const q=I.built.get(x.id);const b=q.box,c=b.getCenter(new THREE.Vector3());q.obj.position.set(cur-b.min.x,-b.min.y,-c.z);S.add(q.obj);cur+=sizes[i].x+gap;sz.x=Math.max(sz.x,sizes[i].x);sz.y=Math.max(sz.y,sizes[i].y);sz.z=Math.max(sz.z,sizes[i].z);});
  if(lo){const lb=inspBox(lo),lc=lb.getCenter(new THREE.Vector3());lo.position.set(cur-lb.min.x,-lb.min.y,-lc.z);S.add(lo);}
  const rad=Math.max(total,sz.y,sz.z,.4)/2;
  if(I.opts.figure&&I.figure){I.figure.root.position.set(-total/2-gap-.3,0,0);S.add(I.figure.root);}
  if(I.opts.ground){const gr=new THREE.Mesh(new THREE.CircleGeometry(Math.max(rad*2.2,3),48),new THREE.MeshLambertMaterial({color:0x4d5540}));gr.rotation.x=-Math.PI/2;gr.position.y=-.005;gr.receiveShadow=true;S.add(gr);}
  I.orbit.target.set(0,sz.y*.45,0);I.orbit.dist=rad/Math.sin(I.cam.fov*Math.PI/360)*1.25+rad*.2;I.orbit.theta=.65;I.orbit.phi=1.2;
  inspWire(I.opts.wire);inspPinsUI();
  bar.textContent=e.group+' › '+e.sub+' › '+e.name;st.textContent=`${r.stats.tris.toLocaleString()} triangles · ${r.stats.calls} draw call${r.stats.calls===1?'':'s'} · ${e.file}`+(r.lo?` · ${r.loLabel||'distant copy'}: ${inspStats(r.lo).tris.toLocaleString()} triangles`:'');
  if(r.modes)for(const m of r.modes){const bt=document.createElement('button');bt.textContent=m;bt.className=m===r.mode?'on':'';bt.onclick=()=>{r.mode=m;[...modes.children].forEach(x=>x.className=x.textContent===m?'on':'');};modes.appendChild(bt);}
  const sun=I.sun;const s=Math.max(rad*2.5,4);sun.shadow.camera.left=-s;sun.shadow.camera.right=s;sun.shadow.camera.top=s;sun.shadow.camera.bottom=-s;sun.shadow.camera.far=s*6;sun.shadow.camera.updateProjectionMatrix();
  I.ui.querySelectorAll('#insp-tree .ent').forEach(x=>x.classList.toggle('on',+x.dataset.id===e.id));}
function inspPinsUI(){const I=INSPECTOR;const box=I.ui.querySelector('#insp-pins');box.innerHTML='';for(const e of I.pins){const c=document.createElement('span');c.className='chip';c.textContent=e.name+' ';const b=document.createElement('b');b.title='unpin';b.textContent='×';b.onclick=()=>{I.pins=I.pins.filter(x=>x.id!==e.id);if(I.sel)inspShow(I.sel);};c.appendChild(b);box.appendChild(c);}
  const pb=I.ui.querySelector('#insp-pin');const pinned=!!(I.sel&&I.pins.some(x=>x.id===I.sel.id));pb.className='b'+(pinned?' on':'');pb.textContent=pinned?'Unpin':'Pin';}
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
  const cam=new THREE.PerspectiveCamera(32,W/H,.05,2000);const dist=rad/Math.sin(cam.fov*Math.PI/360)*1.15;const flat=sz.y<Math.max(sz.x,sz.z)*.18;cam.position.set(Math.sin(.7)*dist*(flat?.55:1),sz.y*.45+dist*(flat?.85:.35),Math.cos(.7)*dist*(flat?.55:1));cam.lookAt(0,sz.y*.45,0);
  REN.setRenderTarget(I.rt);REN.render(sc,cam);REN.readRenderTargetPixels(I.rt,0,0,W,H,I.rtPix);REN.setRenderTarget(null);
  sc.remove(r.obj);if(par)par.add(r.obj);r.obj.position.copy(pos);
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d');const img=ctx.createImageData(W,H);
  for(let y=0;y<H;y++){const src=(H-1-y)*W*4,dst=y*W*4;img.data.set(I.rtPix.subarray(src,src+W*4),dst);}ctx.putImageData(img,0,0);return cv;}
function inspShowGroup(group){const I=INSPECTOR;const grid=I.ui.querySelector('#insp-grid');grid.innerHTML='';grid.style.display='block';I.ui.querySelector('#insp-stage').style.display='none';
  const h=document.createElement('h3');h.textContent=group;grid.appendChild(h);let sub=null,row=null;
  for(const e of I.entries){if(e.group!==group)continue;if(e.sub!==sub){sub=e.sub;const hs=document.createElement('h4');hs.textContent=sub;hs.className='open';grid.appendChild(hs);row=document.createElement('div');row.className='row';grid.appendChild(row);const rr=row;hs.onclick=()=>{const o=rr.style.display!=='none';rr.style.display=o?'none':'flex';hs.className=o?'':'open';};}
    const card=document.createElement('div');card.className='card';const cv=inspThumb(e);if(cv)card.appendChild(cv);else{const x=document.createElement('div');x.className='x';x.textContent='failed';card.appendChild(x);}
    const cap=document.createElement('div');cap.className='cap';const r=I.built.get(e.id);cap.textContent=e.name+(r&&r.stats?` · ${r.stats.tris.toLocaleString()}`:'');card.appendChild(cap);card.onclick=()=>{inspSelect(e);};row.appendChild(card);}}
function inspSelect(e){const I=INSPECTOR;I.ui.querySelector('#insp-grid').style.display='none';I.ui.querySelector('#insp-stage').style.display='block';inspResize();inspShow(e);
  if(I.openGroups){I.openGroups.add(e.group);I.openSubs.add(e.group+'/'+e.sub);I.fillTree(I.ui.querySelector('#insp-find').value.trim().toLowerCase());const el=I.ui.querySelector('#insp-tree .ent.on');if(el&&el.scrollIntoView)el.scrollIntoView({block:'nearest'});}}

// ── the frame, while open ──
INSPECTOR.frame=function(now){const I=INSPECTOR;const dt=Math.min((now-I.prevT)/1000,.05);I.prevT=now;I.t+=dt;
  if(I.ui.querySelector('#insp-stage').style.display==='none')return;
  for(const e of I.shown||[]){const r=I.built.get(e.id);if(r&&r.anim&&I.opts.anim)r.anim(I.t,dt,r.mode);}
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
INSPECTOR.select=function(id){const e=INSPECTOR.entries.find(x=>x.key===id||x.id===id||x.name===id);if(e)inspSelect(e);return !!e;};
INSPECTOR.catalogue=function(){return INSPECTOR.entries.map(e=>{const r=INSPECTOR.built.get(e.id);return {key:e.key,group:e.group,sub:e.sub,name:e.name,file:e.file,tris:r&&r.stats?r.stats.tris:null};});};
INSPECTOR.BOARD='https://claude.ai/artifact/5JW73WtXPAWDToUkWapngV';
INSPECTOR.group=function(g){inspShowGroup(g);};
INSPECTOR.pin=function(id){const e=INSPECTOR.entries.find(x=>x.id===id||x.name===id);if(!e)return false;if(!INSPECTOR.pins.some(x=>x.id===e.id))INSPECTOR.pins.push(e);if(INSPECTOR.sel)inspShow(INSPECTOR.sel);return true;};
INSPECTOR.unpinAll=function(){INSPECTOR.pins=[];if(INSPECTOR.sel)inspShow(INSPECTOR.sel);};

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
#insp-tree .grp::before,#insp-tree .sub::before{content:'▸';display:inline-block;width:1em;transition:transform .12s;color:#9a9484}
#insp-tree .grp.open::before,#insp-tree .sub.open::before{transform:rotate(90deg)}
#insp-tree .sub{padding:4px 14px 2px 22px;color:#9a9484;font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
#insp-tree .sub:hover{color:#d8d0bc}
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
#insp-pins .chip{display:inline-flex;align-items:center;gap:5px;background:#2a2f38;border:1px solid #3a4250;border-radius:12px;padding:1px 8px;margin-right:4px;font-size:12px;color:#d8d0bc}
#insp-pins .chip b{cursor:pointer;color:#c8a84a}
#insp button.b.on{background:#3a3220;border-color:#c8a84a;color:#f0e0b0}
#insp-stage{flex:1;position:relative;min-height:0;cursor:grab;background:#1a2030}
#insp-stage canvas{display:block;width:100%;height:100%}
#insp-grid{flex:1;overflow:auto;padding:10px 18px;display:none}
#insp-grid h3{font-size:18px;color:#e8c0a0;margin:8px 0 4px}
#insp-grid h4{font-size:12px;color:#9a9484;letter-spacing:.06em;text-transform:uppercase;margin:14px 0 6px;cursor:pointer}
#insp-grid h4::before{content:'▸';display:inline-block;width:1em;transition:transform .12s}
#insp-grid h4.open::before{transform:rotate(90deg)}
#insp-grid .row{display:flex;flex-wrap:wrap;gap:8px}
#insp-grid .card{width:180px;background:#1b1f26;border:1px solid #2a2f38;border-radius:4px;cursor:pointer;overflow:hidden}
#insp-grid .card:hover{border-color:#c8a84a}
#insp-grid .card canvas{display:block;width:180px;height:135px}
#insp-grid .card .x{width:180px;height:135px;display:flex;align-items:center;justify-content:center;color:#b05040}
#insp-grid .card .cap{padding:4px 7px;font-size:11px;color:#c8c0ac;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;ui.appendChild(css);
  ui.innerHTML+=`<div id="insp-side"><div class="head"><h2>Mesh inspector</h2><button class="b" id="insp-close">Close</button></div><input id="insp-find" placeholder="find…"><div id="insp-tree"></div></div>
<div id="insp-main"><div id="insp-bar"><span id="insp-name">—</span><span id="insp-stats"></span><span id="insp-modes"></span>
<button class="b" id="insp-pin">Pin</button><button class="b" id="insp-note" title="Open the control room's Meshes tab at this piece, to leave a note for the team">Note for the team</button><span id="insp-pins"></span><label><input type="checkbox" id="insp-anim" checked> animate</label><label><input type="checkbox" id="insp-wire"> wireframe</label><label><input type="checkbox" id="insp-lo" checked> distant copy</label><label><input type="checkbox" id="insp-fig" checked> bandit for scale</label><label><input type="checkbox" id="insp-ground" checked> ground</label>
<label>hour <input type="range" id="insp-hour" min="0" max="24" step="0.5" value="12"> <span id="insp-hourv">12:00</span></label></div><div id="insp-stage"></div><div id="insp-grid"></div></div>`;
  I.ui=ui;
  const tree=ui.querySelector('#insp-tree');I.openGroups=I.openGroups||new Set();I.openSubs=I.openSubs||new Set();
  const fill=(q)=>{tree.innerHTML='';let g=null,s=null,gBox=null,sBox=null;
    for(const e of I.entries){if(q&&!(e.name+' '+e.sub+' '+e.group).toLowerCase().includes(q))continue;
      if(e.group!==g){g=e.group;s=null;const open=!!q||I.openGroups.has(g);const d=document.createElement('div');d.className='grp'+(open?' open':'');d.textContent=g;const gg=g;
        d.onclick=()=>{if(I.openGroups.has(gg))I.openGroups.delete(gg);else I.openGroups.add(gg);fill(q);if(I.openGroups.has(gg))inspShowGroup(gg);};tree.appendChild(d);
        gBox=document.createElement('div');gBox.className='gbox';gBox.style.display=open?'block':'none';tree.appendChild(gBox);}
      if(e.sub!==s){s=e.sub;const k=g+'/'+s;const open=!!q||I.openSubs.has(k)||(I.sel&&I.sel.group===g&&I.sel.sub===s);const d=document.createElement('div');d.className='sub'+(open?' open':'');d.textContent=s;
        d.onclick=()=>{if(I.openSubs.has(k))I.openSubs.delete(k);else I.openSubs.add(k);fill(q);};gBox.appendChild(d);
        sBox=document.createElement('div');sBox.className='sbox';sBox.style.display=open?'block':'none';gBox.appendChild(sBox);}
      const d=document.createElement('div');d.className='ent'+(I.sel&&I.sel.id===e.id?' on':'');d.dataset.id=e.id;d.textContent=e.name;d.onclick=()=>inspSelect(e);sBox.appendChild(d);}};
  I.fillTree=fill;fill('');ui.querySelector('#insp-find').oninput=ev=>fill(ev.target.value.trim().toLowerCase());
  ui.querySelector('#insp-close').onclick=closeInspector;
  ui.querySelector('#insp-note').onclick=()=>{if(!I.sel)return;window.open(INSPECTOR.BOARD+'#meshes='+encodeURIComponent(I.sel.key),'_blank','noopener');};
  ui.querySelector('#insp-pin').onclick=()=>{if(!I.sel)return;const i=I.pins.findIndex(x=>x.id===I.sel.id);if(i>=0)I.pins.splice(i,1);else I.pins.push(I.sel);inspShow(I.sel);};
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

if(/[?&]inspector\b/.test(location.search))setTimeout(()=>{try{openInspector();const m=/[?&]inspector=([^&]+)/.exec(location.search);if(m)INSPECTOR.select(decodeURIComponent(m[1]));}catch(e){console.error('inspector',e);}},50);
