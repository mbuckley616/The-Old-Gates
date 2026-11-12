  // ── interior extras: members who wander and talk ──
  let INT_NPCS=[];
  // ── v80 S143: doors inside buildings ──
  // The dungeon's doors are grid cells with a mesh and an open flag; interiors cut doorways but hung
  // nothing in them. A leaf now hangs on the hinge side of every doorway a partition cuts: solid when
  // shut, swung clear when open, on the same E press and the same sounds as a cave door.
  function intDoorAt(sc_,SOL,x,z,by,ang,beamC,dim){ /* S1161 — dim {w, h}: a doorway's own size in metres (the kit's taproom); without it the old unit's */
    const w=dim&&dim.w||1.34,h=dim&&dim.h||1.46,dir=(Math.floor(Math.abs(x*7+z*13))%2)?1:-1; // which way it swings, steady per doorway
    const ux=Math.sin(ang),uz=Math.cos(ang);                          // along the wall
    const hx=x-ux*w/2,hz=z-uz*w/2;                                    // the hinge post
    const g=new THREE.Group();g.position.set(hx,by,hz);g.rotation.y=ang;sc_.add(g);
    const leaf=new THREE.Mesh(new THREE.BoxGeometry(.07,h,w),new THREE.MeshLambertMaterial({color:beamC}));
    leaf.position.set(0,h/2+.02,w/2);g.add(leaf);
    for(const t of [-.34,.34]){const br=new THREE.Mesh(new THREE.BoxGeometry(.05,.1,w*.86),new THREE.MeshLambertMaterial({color:0x2a2622}));br.position.set(.05,h/2+t,w/2);g.add(br);} // iron bands
    const kn=new THREE.Mesh(new THREE.SphereGeometry(.05,7,6),new THREE.MeshLambertMaterial({color:0x6a5a2a}));kn.position.set(.08,h/2,w*.86);g.add(kn);
    const sol={x0:x-Math.abs(ux)*w/2-.07,x1:x+Math.abs(ux)*w/2+.07,z0:z-Math.abs(uz)*w/2-.07,z1:z+Math.abs(uz)*w/2+.07,y0:by,y1:by+h};
    SOL.push(sol);
    // S517 — its id, <house id>:door:<n> in the order the room hangs them (co-op rules); buildInteriorFor names the house
    // S1412 — the leaf's own w and h with it (the kit's rooms hang 0.76 m leaves; the old unit's is 1.34), for intdoors to swing
    INT_DOORS.push({id:(INT_DOORS.house||'room')+':door:'+INT_DOORS.length,x,z,y:by,w,h,g,ang,dir,open:false,a:0,from:0,want:0,t0:0,sol,box:{x0:sol.x0,x1:sol.x1,z0:sol.z0,z1:sol.z1}});
    return INT_DOORS[INT_DOORS.length-1];
  }
  // S680 — in reach AND under the crosshair (Michael, 6 Oct playtest): the ray meets the doorway, shut or open, and nothing stands
  // between you and its near face (the sight line stops short of the leaf on your side, which would block a line to its middle)
  function intDoorAimed(d){if(typeof aimBox!=='function')return true;const b=d.box,nx=Math.cos(d.ang),nz=-Math.sin(d.ang),side=((px-d.x)*nx+(pz-d.z)*nz)<0?-1:1;
    return aimBox((b.x0+b.x1)/2,(b.z0+b.z1)/2,d.y,(b.x1-b.x0)/2,(b.z1-b.z0)/2,1.5,d.x+nx*side*.2,d.z+nz*side*.2);}
  function intDoorNear(){return INT_DOORS.find(d=>Math.hypot(px-d.x,pz-d.z)<TOUCH&&Math.abs(jumpY-d.y)<1.3&&intDoorAimed(d))||null;}
  function intDoorPrompt(){const d=intDoorNear();if(!d)return null;return d.open?"Press 'E' to close the door":"Press 'E' to open the door";}
  function intDoorInteract(door){ /* S680 — door: the one to work, named (a test, a later host); none, the one in reach under the crosshair */
    const d=door||intDoorNear();if(!d)return false;
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
  // S1812 — under a room's water (INT_WATER, the grotto's sea, a sump: roomWaterTick, 88) the world's underwater blue (atmosphere, 80):
  // while the eye is under the room's surface the room's fog and background turn to the sea's blue, darker than the open sea's for the
  // rock over it (ROOM_DEEP), and close in to 0.5 to 14 m, and they turn back to the room's own as the eye comes up. Its view only.
  const ROOM_DEEP=0x123a50;
  function roomUnderwater(){const W=typeof roomWater==='function'?roomWater():null;if(!W||W.bed(px,pz)==null)return false;
    return jumpY+(typeof _eyeHeightCur==='number'?_eyeHeightCur:SCALE.EYE_SWIM)<W.y-.05;}
  function tickRoomUnderwater(){const S=interiorScene;if(!S||!S.fog||!S.fog.isFog)return;const u=roomUnderwater(),D=S.userData;
    if(u&&!D._dry){D._dry={fog:S.fog.color.getHex(),near:S.fog.near,far:S.fog.far,bg:S.background&&S.background.isColor?S.background.getHex():null};
      S.fog.color.setHex(ROOM_DEEP);S.fog.near=.5;S.fog.far=14;if(S.background&&S.background.isColor)S.background.setHex(ROOM_DEEP);}
    else if(!u&&D._dry){const d=D._dry;S.fog.color.setHex(d.fog);S.fog.near=d.near;S.fog.far=d.far;if(d.bg!=null&&S.background&&S.background.isColor)S.background.setHex(d.bg);D._dry=null;}}
  function tickInterior(dt,now){
    try{tickSent(dt,true);}catch(e){} // S239 — a guard sent after you
    try{tickRoomUnderwater();}catch(e){} /* S1812 — the blue under a room's water */
    tickIntDoors(); // v80 S143
    if(interiorScene&&interiorScene.userData.hallTick)interiorScene.userData.hallTick(performance.now()); /* S1521 — a hall's torches, sconces and lamps */
    try{tickSleeper();}catch(e){} /* S739 — a householder sleeps 23h to 5h */
    try{tickKeeperLook(dt);}catch(e){} /* S1542 — a keeper who heard a pick snap comes to look (86-world-crime.js) */
    for(const r of FURN_LIVE)if(r.userData.fire&&r.parent===interiorScene)furnKit().flicker(r.userData.fire,performance.now()*.001);
    for(const r of FURN_LIVE){const hf=r.userData.hearthFire;if(!hf||r.parent!==interiorScene)continue; /* S676 — the cold hearth catches once its task is done */
      if(!hf.visible&&!coldHearthHouse(r.userData.coldHouse)){hf.visible=true;
        for(const hl of r.userData.hearthLights||[r.userData.hearthLight])if(hl){hl.intensity=hl.userData.lit||1.2;const P=_LPS.get(interiorScene);if(!P||!P.src.includes(hl._swept)){hl._swept=null;interiorScene.add(hl);}}} /* the room's light pool drops a dark source after 600 sweeps: hand it back (S1437: a townhouse's four fires, hearthLights) */
      if(hf.visible)furnKit().flicker(hf,performance.now()*.001);}
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
    RUMORS[id]=[`The ${word(2)} clan still pays no tithe. Nobody makes them.`,`They say ${(w=>aOrAn(w)+' '+w)(word(1).toLowerCase())} walks the ${pick_(['marsh','ridge','shore','wood'])} at dusk. They say a lot of things.`,`The old road to ${word(2)} is closed. Or it closed itself.`,`There's a door in the ${pick_(['hills','cliffs','wood','fen'])} that was shut when my father was a boy. Still shut.`,`Ships from ${word(2)} stopped coming two seasons back.`];
    return {id,name:word(2)+pick_(['ish','ic','an','ari','ese']),reg:id,thatch};
  }
  const CULTURES={irish:{id:'irish',name:'Irish'},french:{id:'french',name:'Royale'},anglo:{id:'anglo',name:'Anglic'},aurennais:{id:'aurennais',name:'Aurennais'}}; /* S1474 — Aurenne's own register; no capital, so CULTURE_IDS keeps its draws */
  const CULTURE_IDS=['irish','french','anglo'];
  for(let k=0;k<5;k++){const id='cul'+k;CULTURES[id]=makeCulture(id,1000+k);CULTURE_IDS.push(id);}
  // spread: each culture has a capital cell; a cell takes the culture of the
  // nearest capital with a little noise; the home cell is irish.
  const CAPITALS=(()=>{const r=cellRng(4242,1,1);const caps=[{id:'irish',i:HOME_I,j:HOME_J}];CULTURE_IDS.slice(1).forEach(id=>caps.push({id,i:1+Math.floor(r()*(GRID-2)),j:1+Math.floor(r()*(GRID-2))}));return caps;})();
  function cultureOfCell(i,j){
    if(i===HOME_I&&j===HOME_J)return 'irish';
    if(nationKeyOf(i,j)==='aurenne')return 'aurennais'; /* S1474 — a place's name is its nation's (the Aurennais Register) */
    let best='irish',bd=1e9;CAPITALS.forEach(c=>{const d=Math.hypot(c.i-i,c.j-j)+(cellHash(i,j,300+c.id.length)-.5)*1.4;if(d<bd){bd=d;best=c.id;}});
    return best;
  }
  // climate by latitude with noise; polity by seed
  function climateOfCell(i,j){return nationOf(i,j).climate;}
  function polityOfCell(i,j){const q=cellHash(i,j,32);return q<.45?'realm':q<.78?'marches':'wilds';}
  // snow line and ground tint by climate (used by groundColor)
  // S1751 — the temperate line was 38 m, from before the ranges (S432): 6.2% of the Gatelands' land stands over it, every range and the
  // sites on them (the abbey c7_9_s5 at 99 m in a plains region, white at noon all year). The canon's Gatelands are fens, moors and low
  // ranges: 130 m leaves snow on the highest summits only (it begins at 122 with the noise: 0.25% of the land; the highest site, c7_9_s8,
  // stands at 117.5). Warm goes to 160 so it stays above
  // temperate (Aurenne's land tops out at 126 m: no lasting snow there). The Mark's 18 is untouched. furWarm reads the same line.
  function snowLineAt(x,z){const [i,j]=cellOf(x,z);const cl=climateOfCell(i,j);return cl==='cold'?18:cl==='warm'?160:130;}

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
  const CARGO_HOME=.6,CARGO_ABROAD=1.4,CARGO_CUT=.9,CARGO_STEP=.04,CARGO_HEAL=.7,CARGO_TITHE=.1,CARGO_HOLD={sloop:40,cog:60,galleon:90,cutter:25,caravel:55};
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
  function holdCap(){const st=shipCfg();return Math.max(0,(CARGO_HOLD[st.cls||'sloop']||40)+25*(st.cargo||0)-(typeof shipFitWeight==='function'?shipFitWeight():0));} /* S1726 — her fittings take hold weight (#979 B) */
  function holdUsed(){const h=holdOf();let w=0;for(const k in h)if(CARGO_GOODS[k])w+=h[k]*CARGO_GOODS[k].w;return w+(typeof shipShotWeight==='function'?shipShotWeight():0);} /* S1820 — and her ballista's bolts, 20 to 1 */
  function cargoItem(key){const g=CARGO_GOODS[key];return {name:g.n,ico:'📦',type:'cargo',cargo:key,weight:g.w,qty:1,desc:`Trade goods. A harbour's factor buys them.`};}
  function cargoHave(key){const b=BAG.find(it=>it.type==='cargo'&&it.cargo===key);return {bag:b?(b.qty||1):0,hold:(worldState.ship&&worldState.ship.hold&&worldState.ship.hold[key])||0};}
  function cargoBuy(site,key){const g=CARGO_GOODS[key];if(!g||g.home!==cargoNation(site))return 'That is not sold here.';const p=cargoAsk(site,key);
    if(gold<p)return `A ${g.n.toLowerCase()} is ${p} gold.`;
    const here=shipHere(site);let where='';
    if(here&&holdUsed()+g.w<=holdCap()){const h=holdOf();h[key]=(h[key]||0)+1;where=' Into the hold.';}
    else if(!g.hold&&canCarry(cargoItem(key))){bagAdd(cargoItem(key));if(here)where=' The hold is full: you carry it.';}
    else if(g.hold)return shipHere(site)?`No room in the hold for a horse.`:`A horse goes in a ship's hold, and your ship is not here.`;
    else return shipHere(site)?`No room in the hold, and too heavy to carry.`:`Too heavy to carry.`;
    gold-=p;cargoPush(site,key,1+CARGO_STEP);if(typeof updateHUD==='function')updateHUD();if(typeof sndGoldJingle==='function')sndGoldJingle();
    return `Bought a ${g.n.toLowerCase()} for ${p} gold.`+where;} /* S758 — where it went, when your ship is here (the critic, s585: 7 of 12 crates went on your back without a word) */
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
  function cargoTopic(site){return {label:'Cargo — the factor’s prices',quest:true,panel:()=>openCargoPanel(site)};} /* S641 — the factor's panel (86-world-crime.js) in place of the chat rows; cargoRows and cargoBoard stay for the suites */
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
  // the quay's line from the pad edge out past the waterline, from the ground alone (S457: the Compact's ship is moored at a
  // harbour that may not be loaded)
  function quayLine(site,sd,QY){
    let x=site.quayStart?site.quayStart.x:site.x+sd.dx*site.pad,z=site.quayStart?site.quayStart.z:site.z+sd.dz*site.pad,n=0;
    if(!site.quayStart){while(worldH(x,z)>QY+.2&&n<80){x+=sd.dx*3;z+=sd.dz*3;n++;}}
    const startX=x,startZ=z;
    while(worldH(x,z)>0&&n<120){x+=sd.dx*3;z+=sd.dz*3;n++;}
    const endX=x+sd.dx*34,endZ=z+sd.dz*34;const len=Math.max(24,Math.hypot(endX-startX,endZ-startZ));
    return {startX,startZ,endX,endZ,len,mx:(startX+endX)/2,mz:(startZ+endZ)/2};
  }
  function buildHarbour(S,site,r){
    const sd=shoreDir(site);if(!sd)return;
    const {group,sol}=S;
    // walk from the pad edge toward the sea until the water line
    const QW=8,QY=1.1;
    // walk seaward from the pad edge: the quay starts where the ground falls
    // to quay height, and runs 34u past the waterline
    const {startX,startZ,endX,endZ,len,mx,mz}=quayLine(site,sd,QY);const ang=Math.atan2(sd.dx,sd.dz);
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

  // S433 — a quay on a river bank (Michael's C on #112, the towns on the banks): a settlement within a short walk of
  // navigable water gets a stone quay along the bank on the harbour's kit, narrower (5 across, 20 long), its outer face
  // a little over the water; bollards on the water side, a boat or two moored to it, crates and a net on the land
  // side, a lantern at one end. Walkable as four short platforms along it (the platforms are axis-aligned boxes; a
  // quay at the river's angle would float the player at a long box's corners).
  function buildRiverQuay(S,site,r){
    const B=site.bank;if(!B)return;const {group,sol}=S;
    const QW=5,len=20;
    let wx,wz;if(site.quaySpot){wx=site.quaySpot.x;wz=site.quaySpot.z;}else{             // the water line below the pad (found at the cell's load, with the scatter stamp; else now)
      let x=site.x+B.dx*site.pad,z=site.z+B.dz*site.pad,n=0;
      while(worldH(x,z)>QY+.2&&n<160){x+=B.dx*2;z+=B.dz*2;n++;}if(n>=160)return;
      wx=x;wz=z;n=0;while(worldH(wx,wz)>0&&n<40){wx+=B.dx*1;wz+=B.dz*1;n++;}
      if(Math.hypot(wx-x,wz-z)>30)return;}                                               // a bank too flat to quay
    const mx=wx-B.dx*(QW/2-1.2),mz=wz-B.dz*(QW/2-1.2);const ax=B.tx,az=B.tz;const ang=Math.atan2(ax,az);
    const QY=Math.max(1.1,Math.min(3.0,worldH(mx-B.dx*4,mz-B.dz*4)+.3));             // the deck at the bank's own height (1.1 to 3.0): a high bank gets a high quay, the kit's body reaches 3.2 below it
    site.quayY=QY;
    const rq=pRng(pHash(site.id+'|rquay'));{const lo=mergeParts([{geo:new THREE.BoxGeometry(QW,3.2,len),color:new THREE.Color(0x7a746a),y:-1.6,jitter:0},{geo:new THREE.BoxGeometry(QW+.4,.2,len+.4),color:new THREE.Color(0x8a857a),jitter:0}]);
      for(const [geo,lod] of [[quayGeoHi(len,QW,QY-SEA_Y,rq),'hi'],[lo,'lo']]){const q=new THREE.Mesh(geo,SETTLE_MAT);q.position.set(mx,QY,mz);q.rotation.y=ang;q.receiveShadow=true;q.castShadow=lod==='hi';q.userData.lod=lod;q.userData.quay=true;q.userData.river=true;group.add(q);}}
    for(let k=0;k<4;k++){const t=-len/2+len*(k+.5)/4;const cx=mx+ax*t,cz=mz+az*t;const ex=Math.abs(ax)*2.5+Math.abs(az)*QW/2,ez=Math.abs(az)*2.5+Math.abs(ax)*QW/2;
      ZONES.world.platforms.push({x0:cx-ex,x1:cx+ex,z0:cz-ez,z1:cz+ez,y:QY,site:site.id,river:true});}
    const iron=new THREE.MeshLambertMaterial({color:0x2e2c2a}),bollard=SK.lathe([[.001,0],[.2,0],[.2,.07],[.13,.14],[.11,.42],[.16,.55],[.17,.63],[.1,.7],[.001,.72]],10);
    for(let t=-len/2+2.5;t<len/2;t+=5){const bx=mx+ax*t+B.dx*(QW/2-.5),bz=mz+az*t+B.dz*(QW/2-.5);const b=new THREE.Mesh(bollard,iron);b.position.set(bx,QY+.08,bz);group.add(b);}
    const lampX=mx+ax*(len/2-1.2)-B.dx*(QW/2-.6),lampZ=mz+az*(len/2-1.2)-B.dz*(QW/2-.6);const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,3.4,6),new THREE.MeshLambertMaterial({color:0x2a2622}));post.position.set(lampX,QY+1.7,lampZ);group.add(post);
    const glass=new THREE.Group();const pane=new THREE.Mesh(new THREE.BoxGeometry(.24,.3,.24),new THREE.MeshBasicMaterial({color:0xffc860,transparent:true,opacity:.6}));glass.add(pane);glass.position.set(lampX,QY+3.2,lampZ);group.add(glass);
    const hl=regLight(0xffb050,0,20,site.id);hl.position.copy(glass.position);S.lamps.push({glass,light:hl});
    const nb=1+Math.floor(r()*2);S.boats=S.boats||[];
    for(let k=0;k<nb;k++){const t=-len/2+5+k*9;const bx=mx+ax*t+B.dx*(QW/2+2.8),bz=mz+az*t+B.dz*(QW/2+2.8);
      const bm=new THREE.Mesh(boatBake(Math.floor(r()*4)).geo,SHIP_MAT);bm.position.set(bx,SEA_Y+.05,bz);bm.rotation.y=ang+(r()-.5)*.2;bm.castShadow=true;group.add(bm);S.boats.push(bm);}
    for(let k=0;k<3;k++){const t=-len/2+3+r()*(len-8);const bx=mx+ax*t-B.dx*(QW/2-1.1),bz=mz+az*t-B.dz*(QW/2-1.1);
      if(r()<.6){const cr=new THREE.Mesh(SK.rbox(.9,.8,.9,.05,2),new THREE.MeshLambertMaterial({color:0x7a5a28}));cr.position.set(bx,QY+.5,bz);cr.rotation.y=r();group.add(cr);}
      else{const net=new THREE.Mesh(netHeapGeo(k),SETTLE_MAT);net.position.set(bx,QY+.1,bz);group.add(net);}}
    site.quayAt={x:mx,z:mz,ang,len};
  }

  // ── S2143 — your house's fittings where they stand (the systems builder's S2137: `house._fits[k]`, read by homeFitHere at 2 m). The
  // workbench is the kit's joiner's bench (PKIT.props.bench, the cabin's since S1524), stood against a wall of the room's ground floor:
  // the back wall first (from its middle outward), then the two sides, the door's wall last, at the first spot where its foot and 0.8 m
  // in front of it are clear of every low solid and step of the room, 1.9 m from the door, 1.2 m from where you come in, a bed, the chest,
  // the hatch and any inner door. Nothing is rolled, so the same room puts it in the same place. Its spot is the middle of its front
  // edge, where you stand to work. A room with no such spot keeps the rules' fallback (anywhere in the house). The racks are the yard's
  // (townRacks, 82): a rack fitted or taken out now is stood or struck in the yard at once. homeFitsDress(h) runs on coming in
  // (goToInterior) and after a fitting goes in or out (homeFit, homeUnfit). New look only.
  const HOMEFIT_LAY={bench:homeBenchLay};
  function homeFitsDress(h){if(window.OG_LOOK!=='new'||!h||typeof homeMine!=='function'||!homeMine(h))return;
    try{homeYardRacks(h);}catch(e){console.warn('home racks',e);}
    if(typeof isInterior!=='function'||!isInterior()||currentHouse!==h||!interiorScene)return;
    for(const o of interiorScene.children.filter(o=>o.userData&&o.userData.homeFit))interiorScene.remove(o);
    for(const A of [INT_SOL,FOOTHOLDS])if(A)for(let i=A.length-1;i>=0;i--)if(A[i].homeFit)A.splice(i,1);
    h._fits={};for(const k of Object.keys(HOMEFIT_LAY))if(homeFitted(h,k)){try{HOMEFIT_LAY[k](h);}catch(e){console.warn('home fit '+k,e);}}}
  // the ground floor's free spots by a wall for a thing w wide and d deep (its foot from the wall, plus `front` clear before it): the outer
  // walls back, west and east, then each face of a partition (a solid from the floor past 2 m, under 0.3 thick and 1.8 long), the front
  // wall last, each from its middle outward in steps of 0.1 m. What stands upstairs (a bed, the roof's hatch) does not count.
  // wallOk(x, z, nx, nz, ax, az, w), if given, is asked last (it may be dear): is the wall whole behind the thing there.
  // -> {x, z, ry, box, front} or null; box is the foot in the room's frame, front the spot 0.3 m before its front edge
  function homeWallSpot(h,w,d,front,wallOk){const W=h._roomW||h.intW,D=h._roomD||h.intD;if(!W||!D)return null;
    const keep=[];const dx=typeof intDoorX==='function'?intDoorX(h):W/2;keep.push([dx,D,1.9]);
    try{keep.push([intArriveX(h),intArrivalZ(h),1.2]);}catch(e){}
    for(const b of INT_BEDS||[])if(!(b.y>1))keep.push([b.x,b.cz!=null?b.cz:b.z,.9]);
    if(INT_BOX&&INT_BOX.x!=null)keep.push([INT_BOX.x,INT_BOX.z,.9]);if(HATCH&&HATCH.active&&!HATCH.roof&&!(HATCH.y>1))keep.push([HATCH.x,HATCH.z,.9]);
    if(intStashPos)keep.push([intStashPos.x,intStashPos.z,.9]);for(const q of INT_DOORS||[])if(q&&q.x!=null)keep.push([q.x,q.z,1.2]);
    const low=[...(INT_SOL||[]).filter(s=>s.y0<1.6&&s.y1>.05),...(FOOTHOLDS||[]).filter(f=>f.y>.05&&f.y<1.6)];
    const over=(a,b)=>a.x0<b.x1&&a.x1>b.x0&&a.z0<b.z1&&a.z1>b.z0;
    // a wall: where it starts (ox, oz), the way it runs (ax, az) for L, and its normal into the room (nx, nz)
    const walls=[{ox:0,oz:0,ax:1,az:0,L:W,nx:0,nz:1},{ox:0,oz:0,ax:0,az:1,L:D,nx:1,nz:0},{ox:W,oz:0,ax:0,az:1,L:D,nx:-1,nz:0}];
    for(const q of INT_SOL||[]){if(q.homeFit||q.y0>.1||q.y1<2)continue;const sx=q.x1-q.x0,sz=q.z1-q.z0;
      if(sx>=1.8&&sz<=.3)walls.push({ox:q.x0,oz:q.z0,ax:1,az:0,L:sx,nx:0,nz:-1},{ox:q.x0,oz:q.z1,ax:1,az:0,L:sx,nx:0,nz:1});
      else if(sz>=1.8&&sx<=.3)walls.push({ox:q.x0,oz:q.z0,ax:0,az:1,L:sz,nx:-1,nz:0},{ox:q.x1,oz:q.z0,ax:0,az:1,L:sz,nx:1,nz:0});}
    walls.push({ox:0,oz:D,ax:1,az:0,L:W,nx:0,nz:-1});
    for(const wl of walls){const ts=[];for(let k=0;k<=120;k++)for(const s of k?[-1,1]:[1]){const t=wl.L/2+s*k*.1;if(t>=w/2+.1&&t<=wl.L-w/2-.1)ts.push(t);}
      const ry=Math.atan2(wl.nx,wl.nz),ux=Math.abs(wl.ax),uz=Math.abs(wl.az);
      for(const t of ts){const wx=wl.ox+wl.ax*t,wz=wl.oz+wl.az*t,gap=.04;
        const boxAt=(d0,d1)=>{const ax=wx+wl.nx*d0,az=wz+wl.nz*d0,bx=wx+wl.nx*d1,bz=wz+wl.nz*d1;
          return {x0:Math.min(ax,bx)-ux*w/2,x1:Math.max(ax,bx)+ux*w/2,z0:Math.min(az,bz)-uz*w/2,z1:Math.max(az,bz)+uz*w/2};};
        // the foot is tested from 0.15 off the wall (a wall's own slab may stand just inside the room), and the floor before it to `front`
        const foot=boxAt(gap,gap+d),test=boxAt(.15,gap+d+front);
        if(test.x0<.05||test.z0<.05||test.x1>W-.05||test.z1>D-.05)continue;
        if(low.some(s=>over(test,s)))continue;
        if(keep.some(([x,z,r])=>Math.hypot(x-Math.max(foot.x0,Math.min(foot.x1,x)),z-Math.max(foot.z0,Math.min(foot.z1,z)))<r))continue;
        if(wallOk&&!wallOk(wx,wz,wl.nx,wl.nz,wl.ax,wl.az,w))continue;
        return {x:wx+wl.nx*gap,z:wz+wl.nz*gap,ry,box:foot,front:[wx+wl.nx*(gap+d+.3),wz+wl.nz*(gap+d+.3)]};}}
    return null;}
  // the bench is the kit's 1.5 m one where it fits, else its 1.1 m one (a full room: Dunmore's townhouse)
  function homeBenchLay(h){if(typeof PKIT==='undefined'||!PKIT.props||!PKIT.props.bench)return;let B=null,sp=null;
    for(const L of [1.5,1.1]){const f={x0:-L/2,x1:L/2,z0:0,z1:.86};sp=homeWallSpot(h,f.x1-f.x0,f.z1-f.z0,.8,homeWallWhole);if(sp){B=PKIT.props.bench({L});break;}}
    if(!sp)return;
    B.group.position.set(sp.x,0,sp.z);B.group.rotation.y=sp.ry;B.group.userData.homeFit='bench';B.group.userData.kit={tris:B.tris,draws:B.draws,L:B.foot.x1-B.foot.x0};
    B.group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});interiorScene.add(B.group);
    const b=sp.box;INT_SOL.push({x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,y0:-.5,y1:B.top,homeFit:'bench'});FOOTHOLDS.push({x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,y:B.top,homeFit:'bench'});
    h._fits.bench={x:+sp.front[0].toFixed(3),z:+sp.front[1].toFixed(3)};}
  // the wall behind a thing w wide is whole: from 0.3 m into the room, rays back to the wall at 0.5, 1.0 and 1.4 m up, at its middle and
  // 0.1 m in from each end, each meet the room within 0.45 m (a doorway, an open window or the stair's well lets one through: the
  // townhouse's back door, where the first try hung the bench's tools)
  const HF_RAY=new THREE.Raycaster(),HF_O=new THREE.Vector3(),HF_D=new THREE.Vector3();
  function homeWallWhole(x,z,nx,nz,ax,az,w){const ms=[];interiorScene.updateMatrixWorld(true);
    interiorScene.traverse(o=>{if(o.isMesh&&o.visible&&!o.userData.daylight){for(let p=o;p;p=p.parent)if(p.userData&&p.userData.homeFit)return;ms.push(o);}});
    HF_D.set(-nx,0,-nz);HF_RAY.far=.45;
    for(const u of [-w/2+.1,0,w/2-.1])for(const y of [.5,1.0,1.4]){HF_O.set(x+ax*u+nx*.3,y,z+az*u+nz*.3);HF_RAY.set(HF_O,HF_D);HF_RAY.far=.45;if(!HF_RAY.intersectObjects(ms,false).length)return false;}
    return true;}
  // the yard's racks for your own house: struck and stood again by what is fitted now (townRacks lays what curesOf gives, the fitted ones)
  function homeYardRacks(h){const S=typeof SETTLE!=='undefined'&&SETTLE.get(h.siteId);if(!S||!S.group||!Array.isArray(S.racks)||typeof townRacks!=='function')return;
    for(let i=S.racks.length-1;i>=0;i--){const R=S.racks[i];if(R.house!==h.id)continue;S.group.remove(R.g);R.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});S.racks.splice(i,1);
      if(S.sol){const j=S.sol.findIndex(s=>s.bt==='rack'&&Math.abs(s.cx-R.x)<1e-6&&Math.abs(s.cz-R.z)<1e-6);if(j>=0)S.sol.splice(j,1);}}
    S.racks.push(...townRacks(S.site,[h],S.sol||[],S.group));}

  // ═══ SHIPS & SWIMMING (Session C) ════════════════════════════════════
  // One ship for now, bought at a shipwright, kept in worldState.ship. The
  // deck is a moving platform (ZONES.world.platforms entry updated every
  // frame), so you board by walking on. E at the wheel takes the helm:
  // WASD drives the ship, you stand at the wheel, the camera is free. E
  // again lets go. The bow stops in shallows ("aground"); walk off the
  // bow onto the shore. Water is swimmable: the surface is the ground
  // when the bed is deeper than the waterline.
  const SHIP={mesh:null,x:0,z:0,yaw:0,speed:0,sailing:false,plat:null,wheel:{x:0,z:0},helm:{x:0,z:0},name:'Gull',L:13,W:4.4};
  const SHIP_NAMES=['Grey Gull','Salt Heron','Bad Penny','Marrow','Ember Wake','Lantern','Cormorant','Old Ram','Wandering Oar','Mercy'];
  const DECK_Y=SEA_Y+1.0,SHIP_PRICE=400;
  const HELD_KEYS={};
  window.addEventListener('keydown',e=>{HELD_KEYS[e.code]=true;});window.addEventListener('keyup',e=>{HELD_KEYS[e.code]=false;});
