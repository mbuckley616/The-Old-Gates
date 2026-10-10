
  // ── Dialog pools ─────────────────────────────────────────────────────
  const META_ID={ashenmoor:'overworld'};
  function siteBlurb(site){
    const meta=(typeof MAP_NODE_META!=='undefined')&&MAP_NODE_META[META_ID[site.id]||site.id];
    if(meta&&meta.desc)return meta.desc.replace(/<[^>]+>/g,'').split(/(?<=\.)\s/).slice(0,2).join(' ');
    return `${site.name}. Not much to it, but it's ours.`;
  }
  // v80 S138 — directions. Ask anyone in a town where something is; they answer from where you're both
  // standing, and the place goes on your compass until you reach it or leave town.
  let WAY=null;
  const WAY_ASK={castle:['The keep?','keeps'],inn:['An inn?','inns'],guild_f:['The Fighters\u2019 Guild?',''],guild_m:['The Mages\u2019 Guild?',''],church:['The church?','churches'],weapon:['A smith?','smithies'],armor:['An armourer?','armouries'],potion:['An apothecary?','apothecaries'],misc:['Somewhere for supplies?','goods stores'],shipwright:['The shipwright?','']};
  const WAY_ORDER=['castle','inn','guild_f','guild_m','church','weapon','armor','potion','misc','shipwright'];
  function wayFar(d,dir,open){return d<14?(open?`right here, just ${dir} of you`:`just ${dir} of here, you're nearly at the door`):d<55?`${dir} of here, a short walk`:d<130?`${dir} of here, on across the town`:`${dir} of here, the far side of town`;}
  function waySet(x,z,label,glyph,siteId){WAY={x,z,label,glyph:glyph||'\u25c9',siteId};showMsg(`On your compass: ${label}`,'#f0dca0');}
  // indoors px/pz are the room's own coordinates: measure from the building's front door instead
  function wayFrom(){try{if(typeof isInterior==='function'&&isInterior()&&typeof currentHouse!=='undefined'&&currentHouse&&currentHouse.exitX!=null)return {x:currentHouse.exitX,z:currentHouse.exitZ};}catch(e){}return {x:px,z:pz};}
  function wayTick(){if(!WAY)return;if(activeZoneId!=='world')return;try{if(typeof isInterior==='function'&&isInterior())return;}catch(e){}const d=Math.hypot(px-WAY.x,pz-WAY.z);const site=WAY.siteId?siteAnywhere(WAY.siteId):null;
    if(d<5){WAY=null;return;}if(site&&Math.hypot(px-site.x,pz-site.z)>(site.pad||60)+220)WAY=null;}
  function directionTopics(site,def){
    const S=SETTLE.get(site.id);if(!S||!S.houses||!S.houses.length)return [];const out=[];
    if(S.lordNpc&&S.lordNpc.def){const L=lordFor(site);const who=`${L.title} ${L.name}`;
      out.push({label:`Where's ${who}?`,fn:()=>{const o=wayFrom();if(def&&def._lord)return `You're looking at ${L.female?'her':'him'}.`;const LN=S.lordNpc;
        if(!LN.g.visible){const sq=(LN.sched&&LN.sched.plaza)||{x:site.x,z:site.z};const d=Math.hypot(sq.x-o.x,sq.z-o.z),dir=compassWord(sq.x-o.x,sq.z-o.z);waySet(sq.x,sq.z,`the square (${who})`,'\ud83d\udc51',site.id);return `At this hour? Home, and not to be woken. ${L.female?'She\u2019s':'He\u2019s'} on the square in the morning: ${wayFar(d,dir,true)}.`;} // after dark the lord is indoors: point at the square
        const g=LN.g.position;const d=Math.hypot(g.x-o.x,g.z-o.z),dir=compassWord(g.x-o.x,g.z-o.z);waySet(g.x,g.z,who,'\ud83d\udc51',site.id);WAY.follow=LN;return `${L.female?'She':'He'} keeps to the square most days \u2014 ${wayFar(d,dir,true)}.`;}});}
    for(const t of WAY_ORDER){const hs=S.houses.filter(h=>h.type===t);if(!hs.length)continue;const ask=WAY_ASK[t];
      out.push({label:ask[0],fn:()=>{const o=wayFrom();let h=hs[0],bd=1e9;for(const x of hs){const d=Math.hypot(x.exitX-o.x,x.exitZ-o.z);if(d<bd){bd=d;h=x;}}
        const dir=compassWord(h.exitX-o.x,h.exitZ-o.z);const far=wayFar(bd,dir);
        if(def&&def._houseId===h.id)return bd<14?'You\u2019ve found it. It\u2019s mine.':`That\u2019s mine \u2014 ${far}. Go on, I\u2019ll be along.`;
        waySet(h.exitX,h.exitZ,h.name,bldOf(t).glyph,site.id);
        const nm=(t==='guild_f'||t==='guild_m')&&!/^The /.test(h.name)?'The '+h.name:h.name;
        const lead=hs.length>1&&ask[1]?`There are ${hs.length} ${ask[1]} here. The nearest is ${nm}, `:`${nm}? It's `;
        const tail=t==='castle'?' The steward speaks for the lord.':(t==='guild_f'||t==='guild_m')?' Ask for the steward.':'';
        return lead+far+'.'+tail;}});}
    const mine=S.houses.find(h=>h.ownedByPlayer||ownedHouse(h.id));
    if(mine)out.push({label:'My house?',fn:()=>{const o=wayFrom();const d=Math.hypot(mine.exitX-o.x,mine.exitZ-o.z),dir=compassWord(mine.exitX-o.x,mine.exitZ-o.z);waySet(mine.exitX,mine.exitZ,mine.name,'\u2302',site.id);return `Yours? You've forgotten already? ${wayFar(d,dir).replace(/^./,c=>c.toUpperCase())}.`;}});
    return out;
  }
  function compassWord(dx,dz){
    const a=Math.atan2(dx,-dz);const dirs=['north','north-east','east','south-east','south','south-west','west','north-west'];
    return dirs[((Math.round(a/(Math.PI/4))%8)+8)%8];
  }
  function nearbyDoors(site,n){
    const arr=CELL_DOORS.map(e=>{const w=dungeonWorldPos[e.seed];return {e,w,d:Math.hypot(w.x-site.x,w.z-site.z)};}).sort((a,b)=>a.d-b.d).slice(0,n);
    return arr.map(o=>({name:o.e.canonicalName||(typeof dungeonName==='function'?dungeonName(o.e.seed,o.e.theme):'an old gate'),dir:compassWord(o.w.x-site.x,o.w.z-site.z),far:o.d<140?'close by':o.d<300?'an hour\'s walk':'a fair way off',fort:o.e.kind==='fort_door',theme:o.e.theme}));
  }
  const RUMORS={
    irish:["They say the Wastes were green once. My grandmother said her grandmother said so, anyway.","A man came through last month with a rubbing off a stone. Wouldn't say where from. Wouldn't sleep, either.","The old gates were here before the roads. Before us. They'll be here after.","Wolves are bolder this year. Something's pushing them out of the deep wood.","Somebody's been marking the doors — a scratch, like a letter that isn't. Same mark, every time."],
    french:["The King's men patrol the Route Royale and nowhere else. Draw your own conclusions.","There's a name they don't say in Coeur de Vie. Varek. I said it. Look — nothing happened.","Mur Pierre holds the pass. What it holds the pass against, they don't tell villagers.","A cloister in the mountains stopped ringing its bell. Someone should go and ask why. Not me.","Pellam's Hold was a lord's house once. Now it's a place you hear things from at night."],
    anglo:["The Hollowed don't rot. That's the part nobody tells you.","Caer Uaigneach shut its gates on the plague and never opened them. It's still shut. From the inside.","The hermit says the ground hums at night out there. He's not wrong. He's not right, either.","If a door's warm to the touch, don't. Just don't.","Something walks the wastes with a lantern. It isn't looking for anything. It's counting."],
  };
  function makeDef(site,reg,r,role,name,extra){
    const doors=nearbyDoors(site,3);
    const outs=ROAD_DEFS.filter(d=>d.a===site.id||d.b===site.id).map(d=>({s:SITE[d.a===site.id?d.b:d.a],via:d.via}));
    const roadLine=outs.length?outs.map(o=>`${o.via} runs ${compassWord(o.s.x-site.x,o.s.z-site.z)} to ${o.s.name}`).join('. ')+'.':'No roads worth the name. You walk.';
    const doorLine=doors.map(d=>`${d.fort?'The fort they call':'There\'s an old gate,'} ${d.name}, ${d.dir} of here, ${d.far}${d.fort?'':' — '+({undead:'the dead walk it',goblin:'goblins nest there',ruins:'old stone and older things',elemental:'the air hums wrong',deep:'it goes down a long way'}[d.theme]||'no one goes in')}`).join('. ')+'.';
    const greetPool={
      Smith:["Mind the sparks.","You'll want that edge looked at before you go back out.","Steel's honest. People less so."],
      Armourer:["Turn around. Let me see the back.","Padding first. Always padding first.","Nothing fancy here. Everything tested."],
      Apothecary:["Don't touch that. Or that.","You look like you've been drinking from streams. Sit.","Bitter is good. Bitter means it's working."],
      Merchant:["Buying or selling? Both is fine.","Everything's for sale except the counter.","Carts come through less than they did."],
      Innkeeper:["Fire's lit. Take a seat.","Bed's upstairs. Bowl's on the way.","We don't ask where you've been. Boots off, though."],
      Priest:["Come in out of the wind.","The door's open. It always is.","Sit a while. Nothing's chasing you in here."],
      Steward:["His lordship is not receiving. State your business to me.","You're tracking mud through the hall.","Petitions on the left. Complaints, also on the left."],
      Villager:["Fine day for it.","You're not from here. That's all right.","Keep to the road after dark.","Haven't seen a traveller in a week."],
      Guard:["Move along.","Trouble stays outside the walls. See that it does.","You armed? Good. Keep it sheathed in here."],
      Hermit:["Hm. Another one.","The ground hums. Put your hand on it. No? Suit yourself.","I don't sell anything. I don't have anything. Sit if you like."],
    };
    const topics=[
      {label:`What is this place?`,response:siteBlurb(site)},
      {label:'Where do the roads go?',response:roadLine},
      {label:'Anything dangerous nearby?',response:doorLine},
      {label:'Any news?',response:pick(r,RUMORS[reg])},
    ];
    let extraTopics=[];
    if(extra&&extra.topics){extraTopics=extra.topics.slice();extra=Object.assign({},extra);delete extra.topics;}
    const ICO={Smith:'⚒',Armourer:'🛡',Apothecary:'🌿',Merchant:'📦',Innkeeper:'🍺',Priest:'🕯',Steward:'🏰',Villager:'👤',Guard:'⚔',Hermit:'🪶',Harbourmaster:'⚓',Shipwright:'⛵',Lord:'👑',Lady:'👑',Mayor:'📜',Elder:'🌾','Harbour Reeve':'⚓',Captain:'⚔'};
    topics.push({label:'Farewell.',bye:true});
    const NK=(extra&&extra.nameKey!=null&&!extra.authored&&_curNM)?String(extra.nameKey):null,kept=NK&&_curNM[NK]?String(_curNM[NK]).split('|'):null; // S244
    let people=(extra&&extra.people)||peopleOfNpc(site,r);if(kept&&PEOPLES[kept[1]])people=kept[1];const P=PEOPLES[people];
    if(!(extra&&extra.authored)){ // rename into the people's bank (keep gender) unless told to keep it; take the people's body
      const bank=NAMES[P.names]||NAMES.irish;const female=Object.values(NAMES).some(b=>b.f&&b.f.includes(name));if(!(extra&&extra.keepName))name=pickFor(r,female?bank.f:bank.m,role!=='Villager');
      extra=Object.assign({},extra||{},{sCol:pick(r,P.skin),hairCol:pick(r,P.hair),bodyScale:[P.width,P.height,P.width]});}
    if(NK){ // S245 — the look and the trade too: skin, hair, clothes and a resident's trade, each field kept once drawn (an S244 record fills in)
      const F=[['sCol',36],['hairCol',36],['bCol',36],['role',0]],rec=[kept?kept[0]:name,people];if(kept)name=kept[0];const o={};
      F.forEach(([k,b],i)=>{const v=kept&&kept[i+2];if(v){if(k==='sCol'||k==='hairCol'||(extra&&extra[k]!=null))o[k]=b?parseInt(v,b):v;rec.push(v);}else{const c=extra&&extra[k];rec.push(c==null?'':b?Number(c).toString(b):String(c));}});
      extra=Object.assign({},extra||{},o);_curNM[NK]=rec.join('|');}
    const def=Object.assign({name,role,ico:ICO[role]||'👤',greeting:greetPool[role]||greetPool.Villager,topics,x:0,z:0},extra||{});
    def.people=people;def._siteId=site&&site.id;{const tw=noteName(def.name,role!=='Villager',kept?kept[6]:null);if(tw)def._twin=tw; // S248 — the second of a name in the town is another face
      if(NK){const p=String(_curNM[NK]).split('|');while(p.length<6)p.push('');p[6]=String(tw);_curNM[NK]=p.join('|');}} // S250 — and keeps its number through a rebuild
    def.temper=temperOf(name);def.bio=bioFor(site,reg,r,role,name);def._roadLine=roadLine;def._doorLine=doorLine;def._extra=extraTopics;
    return dialogFor(site,reg,r,role,name,extraTopics,def);
  }

  // ── Generator ────────────────────────────────────────────────────────
  // S255 — a town's work under way (a build it has funded and not finished): a half-raised wall of coursed stone with a
  // ragged top inside a scaffold of round poles lashed at the joints and braced, a plank deck with a ladder up to it, a
  // stack of cut stone, a pile of timber and a hoist pole with its rope; all within the old 3.4-square footprint.
  function buildSiteGeo(r){const P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+r()*a*2).getHex(),pole=0x8a6a3a,rope=0xb09a70;
    for(const [x,z] of [[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]]){add(SK.cyl(.065,.08,4.2,6),vary(pole,.08),x,2.1,z,(r()-.5)*.03,0,(r()-.5)*.03,.06);for(const y of [2.1,3.9])add(SK.torus(.085,.025,3,8),rope,x,y,z,Math.PI/2,0,0,.03);}
    for(const s of [-1.5,1.5]){add(SK.cyl(.05,.05,3.1,5),vary(pole,.08),0,2.1,s,0,0,Math.PI/2,.05);add(SK.cyl(.05,.05,3.1,5),vary(pole,.08),s,2.1,0,Math.PI/2,0,0,.05);
      add(SK.cyl(.04,.04,3.4,5),vary(pole,.1),0,1.1,s,0,0,Math.atan2(3,1.8)*(s>0?1:-1),.05);add(SK.cyl(.04,.04,3.4,5),vary(pole,.1),s,1.1,0,Math.atan2(3,1.8)*(s>0?-1:1),0,0,.05);}
    for(let i=0;i<5;i++)add(new THREE.BoxGeometry(.6,.05,3.2),vary(0x9a7a4a,.1),-1.24+i*.62,2.2,0,0,(r()-.5)*.03,0,.06);
    for(const s of [-.22,.22])add(SK.cyl(.03,.03,2.6,5),0x7a5a30,1.72,1.15,.7+s,0,0,.35,.05);for(let i=0;i<7;i++){const u=-1.05+i*.35;add(SK.cyl(.02,.02,.44,4),0x7a5a30,1.72-u*Math.sin(.35),1.15+u*Math.cos(.35),.7,Math.PI/2,0,0,.03);}
    // the wall going up: courses of blocks laid broken-joint, the upper courses shorter so the top steps down to one end
    const wc=0x8a8478;for(let c=0;c<5;c++){const y=.15+c*.34,run=2.4-c*.42*(.6+r()*.5);let x=-1.2;while(x<-1.2+run-.05){const bl=Math.min(-1.2+run-x,.45+r()*.35);add(SK.rbox(bl-.04,.3,.42,.04,1),vary(wc,.12),x+bl/2,y,-.6,0,0,0,.05);x+=bl;}}
    for(let i=0;i<6;i++)add(SK.rbox(.4,.26,.3,.04,1),vary(wc,.1),.55+(i%3)*.42,.13+Math.floor(i/3)*.27,.55,0,(r()-.5)*.2,0,.05);
    for(let i=0;i<4;i++)add(SK.cyl(.08,.08,2.2,6),vary(0x6a4a28,.12),-.6+(i%2)*.18+(i>1?.09:0),.09+(i>1?.15:0),1.05,0,0,Math.PI/2,.06);
    add(SK.cyl(.06,.07,4.6,6),vary(pole,.06),-1.3,2.3,1.25,0,0,.12,.05);add(SK.cyl(.05,.05,.9,5),pole,-1.1,4.45,1.25,0,0,Math.PI/2+.12,.04);add(SK.torus(.09,.025,4,10),0x3a3430,-.7,4.35,1.25,0,0,0,.02);add(SK.cyl(.012,.012,3.2,4),rope,-.61,2.75,1.25,0,0,0,.02);
    add(SK.rbox(.34,.24,.3,.04,1),vary(wc,.08),-.61,1.05,1.25,0,.3,0,.05);
    return mergeParts(P);}
  function genSettlement(site){
    if(SETTLE.has(site.id)||site.pad<=0)return;
    let r=rngFor(site.c*31+7,site.r*17+3);_townNames=new Set();_twinUsed=new Map();_roleNames=new Set();const _innNames=new Set();if(!site.lordless)try{const ln_=lordFor(site).name;_townNames.add(ln_);_roleNames.add(ln_);}catch(e){} // S248 — the lord's name is his own; the guild heads drawn before him leave it // S172 — names unique within the town where the bank allows
    const reg=site.reg||REGISTER[dominantRegion(site.x,site.z).r.id]||'irish'; // the cell's culture
    const biome=dominantRegion(site.x,site.z).r.biome;
    const [ni,nj]=cellOf(site.x,site.z);const _ts=worldState.towns&&worldState.towns[site.id];const NAT=(_ts&&_ts.flags.occupied!=null&&NATIONS[_ts.occupier])?NATIONS[_ts.occupier]:nationOf(ni,nj); // v80 S129 — an occupied town flies the occupier's colours
    // the nation's house style first; the home island keeps its cultural mix; biome quirks only in villages
    const st=site.kind==='garrison'?STYLE.garrison:site.kind==='city'?(STYLE[NAT.cityStyle]||STYLE.stone):NAT.people==='gatelander'?(biome==='autumn'?STYLE.bavarian:(STYLE[reg]||STYLE.irish)):(STYLE[NAT.style]||STYLE.irish);
    const plan=KIND_PLAN[site.kind]||KIND_PLAN.village;
    const group=new THREE.Group(),sol=[],houses=[],snpcs=[];
    const S={site,group,sol,houses,npcs:snpcs,reg,residents:[],lamps:[],_gates:[],chimneys:[],tundra:biome==='tundra'};_curSettle=S;
    const pad=site.pad;
    const cx=site.x,cz=site.z;
    if(POI_KINDS.includes(site.kind)){buildPoi(S,site,r);S.reach=t_reach(sol,site);bakeSettlement(S);sc.add(group);houses.forEach(h=>ZONES.world.houses.push(h));if(IMPOSTORS[site.id])IMPOSTORS[site.id].visible=false;SETTLE.set(site.id,S);return S;}
    function addMesh(geo,x,z,ry,solR){
      const m=new THREE.Mesh(geo,SETTLE_MAT);m.position.set(x,worldH(x,z)-.06,z);m.rotation.y=ry||0;m.castShadow=true;m.receiveShadow=true;group.add(m);
      if(geo.userData&&geo.userData.lo){m.userData.lod='hi';const l=new THREE.Mesh(geo.userData.lo,SETTLE_MAT);l.position.copy(m.position);l.rotation.y=m.rotation.y;l.castShadow=true;l.receiveShadow=true;l.userData.lod='lo';group.add(l);} // S194 — its distant copy
      if(solR)sol.push({cx:x,cz:z,rx:solR,rz:solR});
      return m;
    }
    // Layout. Villages: lots along the roads that cross the pad, wide
    // spacing. Towns/cities: a Daggerfall-style street grid aligned to the
    // main road — blocks of lots facing the streets, plaza at the centre,
    // everything inside the wall ring. Every door gets a footpath to the
    // nearest street. `paths` collects ribbon polylines drawn at the end.
    const paths=[];
    const streets=ROADS.filter(rd=>(rd.def.a===site.id||rd.def.b===site.id)&&rd.def.via!=='spur');
    const LOT_STEP=site.kind==='city'?11:plan.rows>1?12:site.kind==='village'?11:14, LAT_GAP=1.2;
    const gridKinds={town:1,city:1,garrison:1,village:1,port:1};
    const useGrid=!!gridKinds[site.kind];
    const inner=plan.walls?pad-12:site.kind==='village'?pad-5:pad-8;   // inside the wall ring
    // main axis from the first road out of the site
    let ax=1,az=0;
    if(streets.length){const rd=streets[0];const far=rd.def.a===site.id?rd.pts[rd.pts.length-1]:rd.pts[0];const dx=far.x-cx,dz=far.z-cz,L=Math.hypot(dx,dz)||1;ax=dx/L;az=dz/L;}
    const bx=-az,bz=ax; // perpendicular
    const streetLines=[]; // {px,pz,dx,dz} infinite lines, clipped to the pad
    if(useGrid){
      const G=site.kind==='city'?38:site.kind==='village'?17:site.kind==='port'?22:34; // block size; villages/ports one row per side
      const nmax=Math.floor((inner-6)/G);
      for(let k=-nmax;k<=nmax;k++){
        streetLines.push({px:cx+bx*k*G,pz:cz+bz*k*G,dx:ax,dz:az});   // streets along the axis
        streetLines.push({px:cx+ax*k*G,pz:cz+az*k*G,dx:bx,dz:bz});   // cross streets
      }
      // draw them (skip the real road's own lines roughly — they overlap harmlessly)
      streetLines.forEach(l=>{
        const half=Math.sqrt(Math.max(0,inner*inner-((l.px-cx)*(l.px-cx)+(l.pz-cz)*(l.pz-cz))));
        if(half<8)return;
        // S193 — where a road already runs along or across the street, the road is the street: the ribbon breaks
        // there rather than doubling it or weaving beside it (the playtest's overlapping patterns)
        let run=[];const flush=()=>{if(run.length>1&&Math.hypot(run[run.length-1].x-run[0].x,run[run.length-1].z-run[0].z)>3)paths.push({w:2.4,pts:[run[0],run[run.length-1]]});run=[];};
        for(let t=-half;t<=half+1e-6;t+=1.5){const x=l.px+l.dx*t,z=l.pz+l.dz*t;const ri=roadInfo(x,z,true);if(ri&&ri.d<ROAD_HALF+1.2+3.5)flush();else run.push({x,z});}flush();
      });
      // a perimeter lane every street runs into (no dead ends in a field)
      // (S193: broken where a road crosses it, the road being the way through there)
      {let ring=[];const n=Math.max(48,Math.round(inner/1.5));for(let k=0;k<=n;k++){const a=k/n*Math.PI*2,x=cx+Math.cos(a)*inner,z=cz+Math.sin(a)*inner;const ri=roadInfo(x,z,true);
        if(ri&&ri.d<ROAD_HALF+1.2+1.5){if(ring.length>1)paths.push({w:2.2,pts:ring});ring=[];}else ring.push({x,z});}if(ring.length>1)paths.push({w:2.2,pts:ring});}
    }
    const quayLane=site.kind==='port'?site.quayLane:null; // S618 — the lane to the quay is a road of its own (addQuayLane); the plan below is drawn as if it were not there, so lots and ids stay
    // v80 S243 — the lots as a function of prosperity, so that a house's id follows its lot. A rebuild at another
    // prosperity (fewer lots; the guild halls gone below 60) used to hand every id in the town to another building, and
    // your own house (worldState.owned is keyed by id) with it. Ids are now the lot's place in the town's layout at its
    // starting prosperity with no builds paid for, which is the layout every existing id was given in.
    const TST=(site.kind in BASE_P)?TS(site):null;const burnedV=!!(TST&&TST.flags.burned!=null),sackedV=!!(TST&&TST.flags.sacked!=null),abandonedV=!!(TST&&TST.flags.abandoned!=null);
    function planLots(P,withBuilds){const r=rngFor(site.c*31+7,site.r*17+3);const placed=[],lots=[];
      // Candidate lots along a line direction (dx,dz) through (px,pz): both sides.
      function lotsAlong(px_,pz_,dx,dz,extent,latBase,rowsN){
        const nx=-dz,nz=dx;
        for(let t=-extent;t<=extent;t+=LOT_STEP){
          const mx=px_+dx*t,mz=pz_+dz*t;
          if(Math.hypot(mx-cx,mz-cz)>inner)continue;
          for(let row=0;row<rowsN;row++)for(const side of [-1,1]){
            const w=5+Math.floor(r()*3),d=4+Math.floor(r()*3);
            const lat=latBase+LAT_GAP+row*(9.5+LAT_GAP);
            const lx=mx+nx*side*(lat+d/2),lz=mz+nz*side*(lat+d/2);
            const dc=Math.hypot(lx-cx,lz-cz);
            if(dc>inner-4||dc<13)continue;
            const ri=roadInfo(lx,lz,true);if(ri&&ri.d<ROAD_BLEND+d/2)continue;
            // keep clear of every street line (grid) — not in an intersection
            let nearStreet=false;
            for(const l of streetLines){const ex=lx-l.px,ez=lz-l.pz;const dist=Math.abs(ex*(-l.dz)+ez*l.dx);if(dist<Math.max(w,d)/2+2.2&&!(Math.abs(l.dx-dx)<1e-6&&Math.abs(l.dz-dz)<1e-6&&Math.abs(ex*(-l.dz)+ez*l.dx-0)<1e-3)){/* different line too close */ if(!(l.px===px_&&l.pz===pz_&&l.dx===dx&&l.dz===dz))nearStreet=true;}}
            if(nearStreet)continue;
            const rad=Math.max(w,d)/2+2.0;
            if(placed.some(p=>Math.hypot(p.x-lx,p.z-lz)<p.rad+rad))continue;
            const ry=Math.atan2(-nx*side,-nz*side);
            placed.push({x:lx,z:lz,rad});
            lots.push({x:lx,z:lz,w,d,ry,tx:-nx*side,tz:-nz*side,row,street:{px:px_,pz:pz_,dx,dz},k:lots.length});
          }
        }
      }
      if(useGrid){
        streetLines.forEach(l=>{const half=Math.sqrt(Math.max(0,inner*inner-((l.px-cx)*(l.px-cx)+(l.pz-cz)*(l.pz-cz))));if(half>8)lotsAlong(l.px,l.pz,l.dx,l.dz,half,1.6,plan.rows);});
      } else {
        // villages: lots along the road samples, both sides, wide spacing
        streets.forEach(rd=>{
          const pts=rd.pts;let acc=LOT_STEP;
          for(let i=1;i<pts.length;i++){
            const a=pts[i-1],b=pts[i];const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
            const dc=Math.hypot(mx-cx,mz-cz);if(dc>inner||dc<12){acc=LOT_STEP;continue;}
            acc+=Math.hypot(b.x-a.x,b.z-a.z);if(acc<LOT_STEP)continue;acc=0;
            const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1;
            lotsAlong(mx,mz,dx/L,dz/L,0,ROAD_BLEND-1,plan.rows);
          }
        });
      }
      // Ring lots around the plaza if still short.
      const hero0=heroShops(site);
      const want=Math.max(Math.round((plan.n[0]+Math.floor(r()*(plan.n[1]-plan.n[0]+1)))*(TST?lotFactor(site,P):1)),(hero0?hero0.length:plan.shops.length)+2);
      for(let k=0;k<40&&lots.length<want;k++){
        const ang=r()*Math.PI*2,rad0=18+r()*Math.max(8,inner-30);
        const lx=cx+Math.cos(ang)*rad0,lz=cz+Math.sin(ang)*rad0;
        const w=5+Math.floor(r()*3),d=4+Math.floor(r()*3);
        const ri=roadInfo(lx,lz,true);if(ri&&ri.d<ROAD_BLEND+d/2)continue;
        let nearStreet=false;for(const l of streetLines){const ex=lx-l.px,ez=lz-l.pz;if(Math.abs(ex*(-l.dz)+ez*l.dx)<Math.max(w,d)/2+2.2)nearStreet=true;}
        if(nearStreet)continue;
        const rad=Math.max(w,d)/2+2.0;
        if(placed.some(p=>Math.hypot(p.x-lx,p.z-lz)<p.rad+rad))continue;
        const tx=(cx-lx),tz=(cz-lz),L=Math.hypot(tx,tz)||1;
        placed.push({x:lx,z:lz,rad});
        lots.push({x:lx,z:lz,w,d,ry:Math.atan2(tx/L,tz/L),tx:tx/L,tz:tz/L,row:0,street:null,k:lots.length});
      }
      lots.sort((a,b)=>Math.hypot(a.x-cx,a.z-cz)-Math.hypot(b.x-cx,b.z-cz));
      // Shops: nearest lots to the centre get the shops; hero rosters override.
      const hero=heroShops(site);
      let shopTypes=hero?[...hero.map(h=>h.type),...((site.kind==='town'||site.kind==='city')?['guild_f','guild_m']:[])]:[...plan.shops,...plan.optional.filter(()=>r()<.5),...(plan.late||[])]; // hero towns get guild halls too
      if(TST&&!hero)shopTypes=shopsFor(site,shopTypes,P);
      if(TST&&withBuilds){TST.builds.forEach(b=>{if(!b.done)return;if(b.key==='inn'&&!shopTypes.includes('inn'))shopTypes.push('inn');if(b.key==='chapel'&&!shopTypes.includes('church'))shopTypes.push('church');if(b.key==='guild'&&!shopTypes.includes('guild_f'))shopTypes.push('guild_f');});}
      // Size shop lots by type first, then drop any later lot that overlaps an
      // earlier one (shops come first, so churches/keeps keep their room).
      lots.forEach((lot,i)=>{const t=shopTypes[i];if(t==='church'){lot.w=Math.max(lot.w,7);lot.d=Math.max(lot.d,9);}else if(t==='castle'){lot.w=14;lot.d=11;}else if(t==='guild_f'||t==='guild_m'){lot.w=13;lot.d=11;}});
      const kept=[];
      // S193 — a lot made bigger above (a keep, a guild hall, a church) is checked against the roads again: its corners
      // could reach one (3 of 1,062 buildings in thirty towns stood on a road)
      const lotOnRoad=lot=>{const c=Math.cos(lot.ry),s_=Math.sin(lot.ry);for(let u=-1;u<=1;u+=.5)for(let v=-1;v<=1;v+=.5){const lx=u*lot.w/2,lz=v*lot.d/2;const ri=roadInfo(lot.x+lx*c+lz*s_,lot.z-lx*s_+lz*c,true);if(ri&&ri.d<ROAD_HALF+.6)return true;}return false;};
      lots.forEach(lot=>{const rad=Math.max(lot.w,lot.d)/2+2.0;if(Math.hypot(lot.x-cx,lot.z-cz)>inner-Math.max(lot.w,lot.d)/2-1)return; // whole footprint inside the ring
        if(lot.w*lot.d>60&&lotOnRoad(lot))return;
        if(kept.some(k=>Math.hypot(k.x-lot.x,k.z-lot.z)<Math.max(k.w,k.d)/2+2.0+rad))return;kept.push(lot);});
      const use=kept.slice(0,Math.max(want,0)); // homes fill whatever the shops don't
      // ports: the shipwright gets its own lot at the quay head, door toward the quay
      if(site.kind==='port'&&site.quayStart){const si=shopTypes.indexOf('shipwright');const sd=shoreDir(site);
        if(si>=0&&sd){const q=site.quayStart;const lx=site.shipwrightLot?site.shipwrightLot.x:q.x-sd.dx*9-sd.dz*11,lz=site.shipwrightLot?site.shipwrightLot.z:q.z-sd.dz*9+sd.dx*11;const tx=-(-sd.dz),tz=-(sd.dx);
          const lot={x:lx,z:lz,w:7,d:6,ry:Math.atan2(tx,tz),tx,tz,row:0,street:null,two:true,k:'sw'};
          shopTypes.splice(si,1);shopTypes.unshift('shipwright');use.unshift(lot);}}
      return {r,use,shopTypes,hero,lots};}
    const PL=planLots(TST?prosperity(site):0,true);const use=PL.use,shopTypes=PL.shopTypes,hero=PL.hero;r=PL.r;
    {const base=TST?planLots(baseProsperity(site),false).use:use;const at=new Map();base.forEach((l,i)=>at.set(l.k,i));
      const idOf=l=>{l.n=at.has(l.k)?at.get(l.k):1000+(typeof l.k==='number'?l.k:0);return `g_${site.id}_${l.n}`;};
      // every lot this build could use, in order; your own house is never dropped for want of lots nor given to a shop
      const all=PL.lots;all.forEach(l=>l.id=idOf(l));use.forEach(l=>l.id=idOf(l));
      const mine=l=>ownedHouse(l.id);
      all.forEach(l=>{if(mine(l)&&!use.some(u=>u.k===l.k)&&!use.some(u=>Math.hypot(u.x-l.x,u.z-l.z)<Math.max(u.w,u.d)/2+2+Math.max(l.w,l.d)/2+2))use.push(l);});
      const nS=shopTypes.length;for(let i=0;i<Math.min(nS,use.length);i++){if(!mine(use[i]))continue;const j=use.findIndex((u,k)=>k>=nS&&!mine(u));if(j<0)break;const o=use[i];use[i]=use[j];use.splice(j,1);use.push(o);}}
    const names=NAMES[reg];
    const usedNames=new Set();
    function newName(){let n;for(let k=0;k<20;k++){n=pick(r,r()<.5?names.m:names.f);if(!usedNames.has(n))break;}usedNames.add(n);return n;}
    // S579 — a home's name points at one door (Michael's A on #171): the first of a name keeps *Séamus's House*; a second takes
    // the resident's trade (*Séamus the Cooper's House*, *Old Úna's House*); a plain resident, or a trade that repeats too, its
    // end of the town (*Séamus's House at the north end*). Lots are named in their own order, so the same house keeps its name.
    const homeNames=new Set();
    const _churchNames=new Set();
    function homeName(nm,tag,end){const tr={farmer:'Farmer',weaver:'Weaver',cooper:'Cooper',fisher:'Fisher'}[tag];
      const c=[`${nm}'s House`,tr?`${nm} the ${tr}'s House`:tag==='old woman'?`Old ${nm}'s House`:null,`${nm}'s House at the ${end} end`,tr?`${nm} the ${tr}'s House at the ${end} end`:tag==='old woman'?`Old ${nm}'s House at the ${end} end`:null].filter(Boolean);
      let n=c.find(x=>!homeNames.has(x));for(let k=2;!n;k++){const x=`${c[c.length-1]} (${k})`;if(!homeNames.has(x))n=x;}homeNames.add(n);return n;}
    // v80 S244 — a person, once drawn for a lot (or a gate's post), is the town's for good: a rebuild at another prosperity
    // draws the stream in another order and used to rename most of the town. makeDef keeps the name and people under
    // extra.nameKey in the town's state (TST.nm) and still makes every draw, so the stream and all else drawn from it is
    // exactly what it was.
    const NM=TST?(TST.nm||(TST.nm={})):null;_curNM=NM;if(NM)_twinUsed=twinsFromRecord(NM);
    function keptName(key,drawn){if(!NM)return drawn;if(NM[key]==null)NM[key]=drawn;return NM[key];}
    const footReq=[];
    use.forEach((lot,i)=>{
      const type=shopTypes[i]||null;
      const isShop=!!type;
      let geo,solR;
      const standing=burnedV&&storyRuin(site)&&hero&&hero[i]&&ASH_SURVIVORS.includes(hero[i].keeper); // S269 — Edna's cottage and the oratory come through the burning
      if(TST&&!standing&&(burnedV||abandonedV||(sackedV&&!isShop&&r()<.5))){ // a shell: black walls, no roof, nobody home
        if(burnedV&&hero&&hero[i]&&hero[i].keeper==='Bram')S._forge={x:lot.x+lot.tx*(lot.d/2+1.6),z:lot.z+lot.tz*(lot.d/2+1.6)}; // S270 — where Bram fell, before his door
        const sh=buildingGeoLo(lot.w,lot.d,Object.assign({},st,{wall:burnedV?0x1a1614:0x6a665e,wall2:burnedV?0x120f0d:0x5a564e,roof:burnedV?0x0a0806:0x3a3632,roof2:0x0a0806,thatch:false,framed:false}),r,{chimney:false,twoStory:false,h:st.h*.8,rise:.2});const m=addMesh(sh,lot.x,lot.z,lot.ry,0);return;} // forEach: skip the rest of this lot
      if(!isShop&&TST&&r()<shutteredShare(site))lot._shuttered=true;
      if(type==='church')geo=churchGeo(lot.w,lot.d,st,r);
      else if(type==='castle')geo=keepGeo(lot.w,lot.d,st,r);
      else if(type==='guild_f'||type==='guild_m'){lot.two=true;geo=buildingGeo(lot.w,lot.d,STYLE.stone,r,{chimney:true,twoStory:true,h:3.4,rise:1.8});}
      else if(site.kind==='port'&&site.quayStart&&Math.hypot(lot.x-site.quayStart.x,lot.z-site.quayStart.z)<34){const fk=NAT.people==='gatelander'?'aurenne':NAT.people==='aurennais'?'mark':'irish';lot.two=r()<.4;geo=buildingGeo(lot.w,lot.d,STYLE[fk]||STYLE.irish,r,{chimney:true,twoStory:lot.two,h:(STYLE[fk]||STYLE.irish).h,rise:(STYLE[fk]||STYLE.irish).rise});lot.foreign=fk;} // the foreign quarter by the water
      else if(biome==='swamp'&&site.kind==='village'){lot.two=false;geo=mushroomGeo(lot.w,lot.d,st,r);}
      else if(biome==='tundra'&&site.kind==='village'&&site.islet){lot.two=false;geo=iceGeo(lot.w,lot.d,st,r);}
      else{lot.two=r()<(st.twoStory||0)||type==='inn';geo=buildingGeo(lot.w,lot.d,st,r,{chimney:r()<.65,twoStory:lot.two,h:type==='inn'?3.2:st.h,rise:type==='inn'?1.9:st.rise});}
      solR=Math.max(lot.w,lot.d)/2*.85;
      const m=addMesh(geo,lot.x,lot.z,lot.ry,0);
      {const ch=chimneyAt(geo,m,type||'home');if(ch)S.chimneys.push(ch);} // S343 — its smoke
      // rotated footprint (settleSolid understands {c,s} rotated rects)
      sol.push({cx:lot.x,cz:lot.z,rx:lot.w/2+.15,rz:lot.d/2+.15,c:Math.cos(lot.ry),s:Math.sin(lot.ry),bt:type||'home',hid:lot.id,sh:lot._shuttered?1:0}); // v80 S138 — the map colours it by type
      // footpath: door → the street/road it faces
      {
        const fx=lot.x+lot.tx*(lot.d/2+.3),fz=lot.z+lot.tz*(lot.d/2+.3);
        let ex=fx+lot.tx*(lot.row*(9.5+LAT_GAP)+(lot.street?2.5:ROAD_BLEND)),ez=fz+lot.tz*(lot.row*(9.5+LAT_GAP)+(lot.street?2.5:ROAD_BLEND));
        const ri=roadInfo(ex,ez);if(ri&&ri.d>ROAD_HALF+1&&!lot.street){const sg=ri.seg,vx=sg.bx-sg.ax,vz=sg.bz-sg.az,t=ri.t;ex=sg.ax+vx*t;ez=sg.az+vz*t;}
        if(lot.k==='sw'&&quayLane){const A=quayLane.a,B=quayLane.b,vx=B.x-A.x,vz=B.z-A.z,L2=vx*vx+vz*vz||1,u=Math.max(0,Math.min(1,((fx-A.x)*vx+(fz-A.z)*vz)/L2));ex=A.x+vx*u;ez=A.z+vz*u;} /* S618 — the yard's path ends on the quay lane */
        footReq.push({fx,fz,ex,ez,lot,hid:`g_${site.id}_${i}`}); // S193 — routed once every building stands (below)
      }
      const doorX=lot.x+lot.tx*(lot.d/2+.15),doorZ=lot.z+lot.tz*(lot.d/2+.15);
      if(!isShop){
        // Residence: enterable 'home' interior, a named resident who keeps
        // house inside and idles by the door outside in daylight.
        const resident=newName();
        const exX=doorX+lot.tx*2.4,exZ=doorZ+lot.tz*2.4;
        const rdef=makeDef(site,reg,r,'Villager',resident,{nameKey:lot.n,x:doorX+lot.tx*1.4+lot.tz*1.0,z:doorZ+lot.tz*1.4-lot.tx*1.0,bCol:pick(r,[0x5a4030,0x3a5a3a,0x604828,0x504058,0x6a5a3a]),sCol:pick(r,[0xd4a878,0xc09070,0xb08060]),role:pick(r,['resident','farmer','weaver','cooper','old woman','fisher'])});
        rdef.roleTag=rdef.role;rdef.role='Villager';
        const hName=homeName(rdef.name,rdef.roleTag,compassWord(lot.x-site.x,lot.z-site.z));
        const hh={id:lot.id,doorX,doorZ,doorFace:cardinalFace(lot.tx,lot.tz),exitX:exX,exitZ:exZ,exitYaw:Math.atan2(-lot.tx,-lot.tz),name:hName,keeper:rdef.name,_twin:rdef._twin,type:'home',tagline:'',bCol:rdef.bCol,sCol:rdef.sCol,dlg:rdef,w:lot.w,d:lot.d,two:lot.two,reg,style:st===STYLE.stone?'stone':st===STYLE.garrison?'garrison':reg,roleTag:rdef.roleTag,siteKind:site.kind,siteId:site.id};
        if(lot._shuttered){hh.shuttered=true;hh.name=`${hName} (shuttered)`;hh.tagline='Gone to the city. Door nailed.';}
        if(ownedHouse(hh.id)){hh.name='Your House';hh.ownedByPlayer=true;}else rdef._extra.unshift(...houseTopics(hh));
        houses.push(hh);
        // residents stream in by distance (a city has 150+ of them)
        if(!hh.ownedByPlayer)S.residents.push({def:rdef,ry:lot.ry+Math.PI,n:null,door:{x:exX,z:exZ}}); // S530 — the seller moved out
        return;
      }
      const heroH=hero&&hero[i];
      const keeper=heroH?heroH.keeper:newName();
      const noun=SHOP_NOUN[type]?(SHOP_NOUN[type][reg]||SHOP_NOUN[type].irish||''):'';
      let name=heroH?heroH.name:type==='inn'?keptName('i'+lot.n,pickFree(r,INN_NAMES[reg],_innNames)):type==='church'?(reg==='french'?`Chapelle de ${site.name}`:`${/^(la|le|les|l'|l’|the) /i.test(site.name)?'':'The '}${site.name} ${noun}`):type==='castle'?`${site.name} Keep`:(type==='guild_f'||type==='guild_m')?GUILD_DEF[type].name:`${keeper}'s ${noun}`;
      if(type==='inn')_innNames.add(name);
      // S594 — a city's second church takes its end of the town, as a second house of a name does (Michael's A on #171; the critic,
      // 6 Oct: Coeur de Vie's two *Chapelle de Coeur de Vie* side by side on the square)
      if(type==='church'&&!heroH){if(_churchNames.has(name)){const b=`${name} at the ${compassWord(lot.x-site.x,lot.z-site.z)} end`;name=b;for(let k=2;_churchNames.has(name);k++)name=`${b} (${k})`;}_churchNames.add(name);}
      // explicit exit point in front of the door (rotated buildings defeat the engine's cardinal step-out)
      let exX=doorX+lot.tx*2.4,exZ=doorZ+lot.tz*2.4;
      const house={id:lot.id,doorX,doorZ,doorFace:cardinalFace(lot.tx,lot.tz),exitX:exX,exitZ:exZ,exitYaw:Math.atan2(-lot.tx,-lot.tz),name,keeper,type,tagline:heroH?heroH.tagline:pick(r,TAGLINES[type]||TAGLINES.misc),bCol:heroH?heroH.bCol:0x5a4030,sCol:heroH?heroH.sCol:0xd4a878,w:lot.w,d:lot.d,two:lot.two,reg,style:st===STYLE.stone?'stone':st===STYLE.garrison?'garrison':reg,siteKind:site.kind,siteId:site.id};
      houses.push(house);
      { // wall lantern by the door (glow only)
        const lx=doorX+lot.tx*.25+lot.tz*1.05,lz=doorZ+lot.tz*.25-lot.tx*1.05,ly=worldH(doorX,doorZ)+2.05;
        {const m=new THREE.Mesh(doorLanternGeo(),VC_MAT);m.position.set(doorX+lot.tz*1.05,ly,doorZ-lot.tx*1.05);m.rotation.y=lot.ry;group.add(m);} // S258 — bracket and cage on the kit
        const lg=new THREE.Group();const pane=new THREE.Mesh(new THREE.BoxGeometry(.12,.17,.12),new THREE.MeshBasicMaterial({color:0xffc860,transparent:true,opacity:.55}));lg.add(pane);
        const fl=new THREE.Mesh(new THREE.ConeGeometry(.03,.09,6),new THREE.MeshBasicMaterial({color:0xffe090}));fl.position.y=-.01;lg.add(fl);lg.position.set(lx,ly,lz);group.add(lg);S.lamps.push({glass:lg,light:null});
      }
      let signY=null; // S246 — the trade sign is painted once the keeper's name is final (below)
      if(type==='guild_f'||type==='guild_m'){
        const y=worldH(doorX,doorZ);const col=GUILD_DEF[type].col;
        [-1,1].forEach(sd=>{const bx=doorX+lot.tx*.3-lot.tz*sd*2.4,bz=doorZ+lot.tz*.3+lot.tx*sd*2.4;
          const pole=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,1.1),new THREE.MeshLambertMaterial({color:0x2a2622}));pole.position.set(bx+lot.tx*.45,y+5.3,bz+lot.tz*.45);pole.rotation.y=lot.ry;group.add(pole);
          const cloth=new THREE.Mesh(new THREE.PlaneGeometry(1.1,3.4),new THREE.MeshLambertMaterial({color:col,side:THREE.DoubleSide}));cloth.position.set(bx+lot.tx*.95,y+3.55,bz+lot.tz*.95);cloth.rotation.y=lot.ry;group.add(cloth);
          const dev=new THREE.Mesh(new THREE.PlaneGeometry(.7,.7),new THREE.MeshLambertMaterial({map:signTexture(type,''),side:THREE.DoubleSide}));dev.position.set(bx+lot.tx*.97,y+4.2,bz+lot.tz*.97);dev.rotation.y=lot.ry;group.add(dev);});
        signY=y;
      } else if(type==='castle'){
        // seat of power: heraldic banners flanking the gate and a carved plaque above it
        const y=worldH(doorX,doorZ);const col=pick(r,[0x7a2020,0x203a6a,0x6a5a20,0x2a4a2a]);
        [-1,1].forEach(sd=>{const bx=doorX+lot.tx*.35-lot.tz*sd*2.6,bz=doorZ+lot.tz*.35+lot.tx*sd*2.6;
          const pole=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,1.2),new THREE.MeshLambertMaterial({color:0x2a2622}));pole.position.set(bx+lot.tx*.5,y+5.6,bz+lot.tz*.5);pole.rotation.y=lot.ry;group.add(pole);
          const cloth=new THREE.Mesh(new THREE.PlaneGeometry(1.0,3.2),new THREE.MeshLambertMaterial({color:col,side:THREE.DoubleSide}));cloth.position.set(bx+lot.tx*1.0,y+4.0,bz+lot.tz*1.0);cloth.rotation.y=lot.ry;group.add(cloth);
          const dev=new THREE.Mesh(new THREE.PlaneGeometry(.55,.55),new THREE.MeshLambertMaterial({map:signTexture('castle',''),side:THREE.DoubleSide}));dev.position.set(bx+lot.tx*1.02,y+4.6,bz+lot.tz*1.02);dev.rotation.y=lot.ry;group.add(dev);});
        const plq=textPlane(name,3.2,.6,'#d8ccb0','#4a4640');plq.position.set(doorX+lot.tx*.08,y+3.9,doorZ+lot.tz*.08);plq.rotation.y=lot.ry;group.add(plq);
      } else {
        // hanging trade sign above the door, symbol by business
        signY=worldH(doorX,doorZ);
      }
      // keeper at the door
      const kx=doorX+lot.tx*1.6+lot.tz*.9,kz=doorZ+lot.tz*1.6-lot.tx*.9;
      const role=SHOP_ROLE[type]||'Merchant';
      if(type==='guild_f'||type==='guild_m'){house.guild=type;house.dlg=null;}
      const def=(type==='guild_f'||type==='guild_m')?guildDef(type,site,keeper,{x:kx,z:kz,bCol:house.bCol,sCol:house.sCol}):makeDef(site,reg,r,role,keeper,{nameKey:lot.n,authored:!!heroH,people:heroH?'gatelander':undefined,x:kx,z:kz,bCol:house.bCol,sCol:house.sCol,topics:type==='shipwright'?[{label:'Browse ships',quest:true,panel:()=>openYardPanel(site)},{label:`What do you sell?`,response:'Hulls. Sound ones. And rope, if you ask nicely.'}]:house.tagline?[{label:`What do you sell?`,response:house.tagline}]:[]}); /* S592 — no topic while the tagline is blank (the barber's waits on the quest writer) */
      def._houseId=house.id; // v80 S138 — who keeps what, by identity (names collide)
      house.keeper=def.name;house._twin=def._twin;if(!heroH&&/'s /.test(house.name||''))house.name=house.name.replace(/^[^']+'s /,def.name+"'s ");
      if(signY!==null)buildTradeSign(group,type,house.name,doorX,doorZ,lot.tx,lot.tz,lot.ry,signY);
      if(type==='shipwright'){const base=def._extra.slice();Object.defineProperty(def,'_extra',{get(){const buy=base[0],rest=base.slice(1);return worldState.ship?[buy,...upgradeTopics(site),...rest]:[buy,...rest];}});}
      if(house.guild||type==='shipwright'||type==='inn'||type==='barber')house.dlg=def; // steward / shipwright / innkeeper talk inside (the innkeeper lets the rooms)
      if(type==='inn')def._extra.unshift(...innTopics(house,def.people)); // v80 — the innkeeper lets the rooms; S141 — one of them; S237 — shared with the coaching inn
      if(type==='castle'){def._extra.unshift(...lordTopics(site));def._extraFn=()=>[...tutTownTopics(site),...factionTopics(site),...fineTopics(site),...investTopics(site),...routeTopics(site),...coachTopics(site)];house.dlg=def;} // the keep's steward carries the lord's quests
      if(type==='church'){def._extraFn=()=>[...penanceTopics(site)];if(!house.dlg)house.dlg=def;} // S158 — the priest hears a confession
      const kn=spawnNPC(def,lot.ry+Math.PI,true);kn.sched={type:type==='inn'?'innkeeper':(house.guild?'innkeeper':'keeper'),door:{x:exX,z:exZ},plaza:{x:cx,z:cz},shop:type};snpcs.push(kn);
    });
    {const innH=houses.find(h=>h.type==='inn');S.innDoor=innH?{x:innH.exitX,z:innH.exitZ}:null;snpcs.forEach(n=>{if(n.sched&&n.sched.type==='keeper')n.sched.inn=S.innDoor;});}
    const clearDead=()=>{snpcs.forEach(n=>{sc.remove(n.g);sc.remove(n.dot);});snpcs.length=0;}; // S269 — out of the scene too, not only out of the list
    if(burnedV||abandonedV){S.dead=true;clearDead();}
    if(TST)TST.builds.forEach((b,k)=>{if(b.done)return;const sx=cx+14+k*6,sz=cz-16;const y=worldH(sx,sz);const m=new THREE.Mesh(buildSiteGeo(pRng(pHash(site.id+'|build|'+k))),VC_MAT);m.position.set(sx,y,sz);m.castShadow=true;m.receiveShadow=true;group.add(m);sol.push({cx:sx,cz:sz,rx:1.8,rz:1.8});}); // S255 — a building site on the kit (four box posts, a slab and a block)
    // The town's lord: by the well through the day (cities' lords keep to the keep; the steward speaks for them)
    if(plan.rows>0&&(site.kind!=='city'||!houses.some(h=>h.type==='castle'))&&!site.lordless&&!burnedV&&!abandonedV){const lord=lordFor(site);const ldef=makeDef(site,reg,r,lord.title,lord.name,{keepName:true,nameKey:'lord',people:NAT.people,x:cx+3,z:cz-4,bCol:[0x6a2a2a,0x2a3a6a,0x4a3a1a][site.kind==='town'?1:2],sCol:0xd4a878,topics:lordTopics(site)});
      ldef._extraFn=()=>[...tutTownTopics(site),...factionTopics(site),...fineTopics(site),...investTopics(site),...routeTopics(site),...coachTopics(site)];
      ldef._lord=true;const ln=spawnNPC(ldef,0,false);ln.sched={type:'villager',plaza:{x:cx,z:cz},padR:6};snpcs.push(ln);S.lordNpc=ln;}
    // Lamps: iron posts around the plaza and at the gates carry real lights
    // after dark; every shop door gets a wall lantern that glows (no light —
    // a city has a hundred of them). Lit state toggled in tickSettlements.
    const lampPost=(x,z,lit,fx,fz)=>{const y=worldH(x,z);
      // the arm and lantern hang toward (fx,fz) — the street or the plaza
      let dx=fx==null?0:fx-x,dz=fz==null?1:fz-z;const Ld=Math.hypot(dx,dz)||1;dx/=Ld;dz/=Ld;const ang=Math.atan2(dx,dz);
      // S258 — the post, its footing, the scrolled arm and the lantern's cage on the kit, one mesh; flame + glass inside
      {const m=new THREE.Mesh(lampPostGeo(),VC_MAT);m.position.set(x,y,z);m.rotation.y=ang;m.castShadow=true;group.add(m);}
      const hx=x+dx*.42,hy=y+2.85,hz=z+dz*.42;
      const glass=new THREE.Group();
      const pane=new THREE.Mesh(new THREE.BoxGeometry(.2,.26,.2),new THREE.MeshBasicMaterial({color:0xffc860,transparent:true,opacity:.55}));glass.add(pane);
      const flame=new THREE.Mesh(new THREE.ConeGeometry(.05,.14,6),new THREE.MeshBasicMaterial({color:0xffe090}));flame.position.y=-.02;glass.add(flame);
      glass.position.set(hx,hy,hz);group.add(glass);
      let light=null;if(lit){light=regLight(0xffb050,0,16,site.id);light.position.set(hx,hy+.05,hz);}
      sol.push({cx:x,cz:z,rx:.12,rz:.12});S.lamps.push({glass,light});};
    if(plan.rows>0&&(!TST||lampsLit(site))&&!burnedV&&!abandonedV){[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>lampPost(cx+sx*9,cz+sz*9,true,cx,cz));}
    if(site.kind==='port'){buildHarbour(S,site,r);spawnGulls(S,site);}else if(site.bank){try{buildRiverQuay(S,site,r);}catch(e){console.warn('river quay',e);}} // S433 — a quay on a bank town
    if(plan.rows>0)streets.slice(0,3).forEach(rd=>{const q=rd.pts.find(p=>Math.abs(Math.hypot(p.x-cx,p.z-cz)-(pad-14))<5);if(q){const nx=-(cz-q.z),nz=(cx-q.x);const L2=Math.hypot(nx,nz)||1;lampPost(q.x+nx/L2*3.2,q.z+nz/L2*3.2,true,q.x,q.z);}});
    // Plaza: well + stalls; cairn already stands at the centre.
    if(plan.rows>0){
      addMesh(wellGeo(),cx+6,cz+4,r()*Math.PI,1.3);
      for(let i=0;i<plan.stalls;i++){
        const ang=r()*Math.PI*2,rad0=9+r()*5,sx=cx+Math.cos(ang)*rad0,sz=cz+Math.sin(ang)*rad0;
        const ri=roadInfo(sx,sz,true);if(ri&&ri.d<4)continue;
        addMesh(stallGeo(r),sx,sz,ang+Math.PI/2,1.4);
      }
    }
    // Walls with gates where roads cross; towers at the gates.
    if(plan.walls&&!burnedV&&!abandonedV){
      const WT=TST?wallTierFor(site):(plan.walls==='palisade'?'logs':'stone');const WS=WALL_SPEC[WT]; // v80 S129 — fence → logs → stone → dressed stone
      const R=pad-5,segs=Math.max(20,Math.round(R/3.2)),wallH=WS.h;
      const c=x=>new THREE.Color(x);
      const wallC=WS.wall!=null?c(WS.wall):c(STYLE.stone.wall),capC=WS.cap!=null?c(WS.cap):c(STYLE.stone.wall2);
      for(let i=0;i<segs;i++){
        const a0=i/segs*Math.PI*2,a1=(i+1)/segs*Math.PI*2,am=(a0+a1)/2;
        const mx=cx+Math.cos(am)*R,mz=cz+Math.sin(am)*R;
        // S193 — the road is looked for along the whole segment (about 20 long), not at its middle alone: a road crossing
        // near a segment's end ran into the wall
        let ri=null,qx=mx,qz=mz;for(let k=0;k<=8;k++){const a=a0+(a1-a0)*k/8,x=cx+Math.cos(a)*R,z=cz+Math.sin(a)*R;const r2=roadInfo(x,z);if(r2&&(!ri||r2.d<ri.d)){ri=r2;qx=x;qz=z;}}
        if(ri&&ri.d<9){ // gate: towers flank the road where it actually crosses the ring
          const sg=ri.seg;const vx=sg.bx-sg.ax,vz=sg.bz-sg.az,L2=vx*vx+vz*vz||1;const t=Math.max(0,Math.min(1,((qx-sg.ax)*vx+(qz-sg.az)*vz)/L2));const gx=sg.ax+vx*t,gz=sg.az+vz*t;
          if(S._gates.some(g=>Math.hypot(g.x-gx,g.z-gz)<12))continue; // one pair per crossing
          S._gates.push({x:gx,z:gz,tier:WT});
          // S275 — the gate and its towers stand square to the road where it crosses (they were set by the segment's middle,
          // up to 33 degrees askew, and roads cross the ring up to 49 degrees off the radial): local +z along the road into the town
          let ux=vx,uz=vz;if(ux*(cx-gx)+uz*(cz-gz)<0){ux=-ux;uz=-uz;}const gry=Math.atan2(ux,uz),ax_=Math.cos(gry),az_=-Math.sin(gry);
          {const inner=WS.towers?ROAD_HALF+3.6-(WT==='logs'?1.0:WT==='dressed'?2.2:1.9):ROAD_HALF+1.4; // S275 — the gate itself, in the road's frame (+z into the town)
            const gg=townGateGeo(WT,inner,wallH,WS.d,wallC,capC,pRng(pHash(site.id+'|gate|'+i)));
            const cs=Math.cos(gry),sn=Math.sin(gry),w2=(lx,lz)=>[gx+lx*cs+lz*sn,gz-lx*sn+lz*cs];
            // where a second road meets the first at the gate, a jamb or a leaf would stand on it: that crossing stays an open gap
            const onRoad=(lx,lz)=>{const [x,z]=w2(lx,lz),q=roadInfo(x,z);return q&&q.d<ROAD_HALF-.4;};let clash=false;
            for(const s of [-1,1])if(onRoad(s*(inner-.1),0))clash=true;
            for(const lf of gg.userData.leaves){const c2=Math.cos(lf.ry),s2=Math.sin(lf.ry);for(let u=-1;u<=1;u+=.5)if(onRoad(lf.x+u*lf.rx*c2,lf.z-u*lf.rx*s2))clash=true;}
            if(clash){gg.dispose();gg.userData.lo.dispose();S._gates[S._gates.length-1].open=true;}
            else{const gm=addMesh(gg,gx,gz,gry,0);gm.userData.gate=WT;
            for(const s of [-1,1]){const [jx,jz]=w2(s*(inner-.1),0);sol.push({cx:jx,cz:jz,rx:.4,rz:WS.d/2+.1,c:cs,s:sn,bt:'gate'});}
            for(const lf of gg.userData.leaves){const [lx,lz]=w2(lf.x,lf.z),a=gry+lf.ry;sol.push({cx:lx,cz:lz,rx:lf.rx,rz:lf.rz,c:Math.cos(a),s:Math.sin(a),bt:'gate'});}}}
          if(!WS.towers)continue;
          [-1,1].forEach(sd=>{const tx=gx+ax_*sd*(ROAD_HALF+3.6),tz=gz+az_*sd*(ROAD_HALF+3.6);
            const t=gateTowerHi(WT,wallH,capC,c(STYLE.stone.roof2),pRng(pHash(site.id+'|gt|'+i+'|'+sd))); // S249 — in detail near, the old tower its distant copy
            t.userData.lo=mergeParts([{geo:WS.towers==='box'?new THREE.BoxGeometry(1.6,wallH+1.2,1.6):new THREE.CylinderGeometry(WT==='dressed'?2.1:1.8,WT==='dressed'?2.3:2.0,wallH+2.4,8),color:capC,y:(wallH+2.4)/2,jitter:.06},{geo:new THREE.ConeGeometry(WT==='dressed'?2.4:2.1,1.6,8),color:c(STYLE.stone.roof2),y:wallH+2.4+.8,jitter:.06}]);
            addMesh(t,tx,tz,0,1.8);});
          continue;
        }
        const len=2*R*Math.sin(Math.PI/segs)+.3;
        const y=worldH(mx,mz);
        const wry=-am-Math.PI/2; // box length runs along the ring tangent
        // S249 — each segment its own mesh, in detail near with the old boxes (in its own frame) as the distant copy; the bake
        // clusters them with the houses by place
        const lp=[];if(WT==='fence'){lp.push({geo:new THREE.BoxGeometry(len,.12,.12),color:wallC,y:.55,jitter:.03});lp.push({geo:new THREE.BoxGeometry(len,.12,.12),color:wallC,y:1.05,jitter:.03});lp.push({geo:new THREE.BoxGeometry(.16,1.2,.16),color:capC,y:.6,jitter:.02});}
        else lp.push({geo:new THREE.BoxGeometry(len,wallH,WS.d),color:wallC,y:wallH/2,jitter:.07});
        if(WS.crenels){const K=WS.crenels;for(let k=-K;k<=K;k++)lp.push({geo:new THREE.BoxGeometry(.9,.6,WS.d+.1),color:capC,x:k*len*(K===1?.3:.18),y:wallH+.3,jitter:.06});}
        {const tx_=-Math.sin(am)*len/2,tz_=Math.cos(am)*len/2;const hiG=wallSegHi(WT,len,wallH,WS.d,wallC,capC,worldH(mx-tx_,mz-tz_)-y,worldH(mx+tx_,mz+tz_)-y,pRng(pHash(site.id+'|wall|'+i)));
          for(const [geo,lod] of [[hiG,'hi'],[mergeParts(lp),'lo']]){const m=new THREE.Mesh(geo,SETTLE_MAT);m.position.set(mx,y,mz);m.rotation.y=wry;m.castShadow=true;m.receiveShadow=true;m.userData.lod=lod;m.userData.wall=WT;group.add(m);}}
        sol.push({cx:mx,cz:mz,rx:len/2,rz:WS.capRz,c:Math.cos(wry),s:Math.sin(wry),bt:'wall'});
      }
      // a couple of guards at the gates
      streets.slice(0,2).forEach((rd,gi)=>{
        const q=rd.pts.find(p=>Math.abs(Math.hypot(p.x-cx,p.z-cz)-(R-6))<4);
        if(!q)return;
        const def=makeDef(site,reg,r,'Guard',newName(),{nameKey:'g'+gi,x:q.x+3,z:q.z,bCol:NAT.banner,sCol:0x808090});
        const gn=spawnNPC(def,Math.atan2(cx-q.x,cz-q.z),true);gn.sched={type:'guard',a:{x:q.x+3,z:q.z},b:{x:cx+6,z:cz+6}};snpcs.push(gn);
      });
    }
    // Night watchman: unwalled villages get one, who sleeps by day and walks
    // the road-in ↔ plaza with a torch after dark.
    if(!plan.walls&&plan.rows>0&&streets.length){
      const rd=streets[0];const q=rd.pts.find(p=>Math.abs(Math.hypot(p.x-cx,p.z-cz)-(pad-6))<5)||rd.pts[0];
      const def=makeDef(site,reg,r,'Guard',newName(),{nameKey:'w',x:cx+4,z:cz+4,bCol:0x3a3a48,sCol:0xb89878,role:'night watch'});def.role='Guard';
      const wn=spawnNPC(def,0,true);wn.sched={type:'watch',a:{x:q.x+2,z:q.z},b:{x:cx+4,z:cz+4}};snpcs.push(wn);
    }
    // Camps, ruins, standing stones.
    if(plan.tents){for(let i=0;i<plan.tents;i++){const ang=i/plan.tents*Math.PI*2+r();const x=cx+Math.cos(ang)*6,z=cz+Math.sin(ang)*6;addMesh(tentGeo(r),x,z,r()*Math.PI,1.8);}
      const fx=cx+1.5,fz=cz+2.5;const fl=regLight(0xff8a30,1.2,10,site.id);fl.position.set(fx,worldH(fx,fz)+.9,fz);
      const ember=new THREE.Mesh(new THREE.SphereGeometry(.25,6,6),new THREE.MeshBasicMaterial({color:0xff7a22}));ember.position.set(fx,worldH(fx,fz)+.2,fz);group.add(ember);
      const def=makeDef(site,reg,r,'Hermit',site.id==='hermit_camp'?'The Hermit':newName(),{x:cx+3.5,z:cz+4.5,bCol:0x4a4038,sCol:0xb09878,role:'old hermit'});def.role='Hermit';
      snpcs.push(spawnNPC(def,Math.PI,true));}
    if(plan.ruins){for(let i=0;i<plan.ruins;i++){const ang=r()*Math.PI*2,rad0=8+r()*(pad-16);addMesh(ruinGeo(r),cx+Math.cos(ang)*rad0,cz+Math.sin(ang)*rad0,r()*Math.PI,2.2);}}
    if(plan.stones){for(let i=0;i<plan.stones;i++){const ang=i/plan.stones*Math.PI*2;addMesh(standingStoneGeo(r),cx+Math.cos(ang)*11,cz+Math.sin(ang)*11,ang,.6);}}
    // Footpaths and streets as flat ribbons on the pad.
    // S193 — footpaths: straight from the door to its street when nothing stands between; otherwise a dog-leg out
    // of the door, along the gap beside the house in the way and on to the street; with no way through, none (a
    // back-row door's path used to run straight through the house in front: 7–18% of footpath in a town)
    {const blds=sol.filter(b=>b.bt);const inB=(x,z,own)=>blds.some(b=>{if(b.hid===own)return false;const ex=x-b.cx,ez=z-b.cz,c=b.c==null?1:b.c,s_=b.s||0;return Math.abs(ex*c-ez*s_)<b.rx+.5&&Math.abs(ex*s_+ez*c)<b.rz+.5;});
      const clear=(a,b,own)=>{const L=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(L/.4));for(let k=0;k<=n;k++){if(inB(a.x+(b.x-a.x)*k/n,a.z+(b.z-a.z)*k/n,own))return false;}return true;};
      const clearPath=(P,own)=>{for(let k=0;k<P.length-1;k++)if(!clear(P[k],P[k+1],own))return false;return true;};
      for(const q of footReq){const F={x:q.fx,z:q.fz},E={x:q.ex,z:q.ez},own=q.hid;let P=[F,E];
        if(!clearPath(P,own)){P=null;const tx=q.lot.tx,tz=q.lot.tz,px_=-tz,pz_=tx;const A={x:F.x+tx*1.1,z:F.z+tz*1.1};
          outer:for(const o of [q.lot.w/2+1.4,q.lot.w/2+3,q.lot.w/2+5])for(const sd of [1,-1]){const B={x:A.x+px_*sd*o,z:A.z+pz_*sd*o},C={x:E.x+px_*sd*o,z:E.z+pz_*sd*o};
            const cand=[F,A,B,C,E];if(clearPath(cand,own)){P=cand;break outer;}}}
        if(P)paths.push({w:1.3,pts:P});}}
    S.paths=paths; // S193 — kept for the checks on overlaps
    if(paths.length){
      const pos=[],col=[];const tone=roadTone(cx,cz).clone().multiplyScalar(.92);
      paths.forEach(pth=>{const W=pth.w/2;
        // subdivide to ≤3u so every vertex sits on the terrain, never bridging a dip
        const fine=[];for(let i=0;i<pth.pts.length-1;i++){const a=pth.pts[i],b=pth.pts[i+1];const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/3));for(let k=0;k<n;k++)fine.push({x:a.x+(b.x-a.x)*k/n,z:a.z+(b.z-a.z)*k/n});}fine.push(pth.pts[pth.pts.length-1]);
        for(let i=0;i<fine.length-1;i++){const a=fine[i],b=fine[i+1];const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1,nx=-dz/L*W,nz=dx/L*W;
        const v=[[a.x+nx,a.z+nz],[a.x-nx,a.z-nz],[b.x-nx,b.z-nz],[b.x+nx,b.z+nz]];
        const cross=(v[1][0]-v[0][0])*(v[2][1]-v[0][1])-(v[1][1]-v[0][1])*(v[2][0]-v[0][0]);
        const tri=cross<0?[0,1,2,0,2,3]:[0,2,1,0,3,2];
        for(const k of tri){const [x,z]=v[k];pos.push(x,worldH(x,z)+.05,z);const g=1+(Math.random()-.5)*.12;col.push(tone.r*g,tone.g*g,tone.b*g);}}});
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
      const nor=new Float32Array(pos.length);for(let i=1;i<nor.length;i+=3)nor[i]=1;g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.computeBoundingSphere();
      const pm=new THREE.Mesh(g,ROAD_MAT);pm.receiveShadow=true;snowWatch(g);group.add(pm); // v80 S147
    }
    // Loot barrels and crates tucked beside buildings — everyday goods only.
    if(plan.rows>0){
      const nb=site.kind==='city'?10:site.kind==='town'?7:site.kind==='village'?4:2;
      const barrelMat=new THREE.MeshLambertMaterial({color:0x6a4418}),crateMat=new THREE.MeshLambertMaterial({color:0x7a5a28});
      let made=0;
      for(let k=0;k<nb*4&&made<nb;k++){
        const lot=use[Math.floor(r()*use.length)];if(!lot)break;
        const side=r()<.5?-1:1;const sx=lot.x-lot.tz*side*(lot.w/2+.9)+lot.tx*(r()-.5)*lot.d*.6,sz=lot.z+lot.tx*side*(lot.w/2+.9)+lot.tz*(r()-.5)*lot.d*.6;
        if(solidAt(sx,sz)||settleSolid(sx,sz,.4))continue;
        const y=worldH(sx,sz);const kind=r()<.55?'barrel':'crate';let g,top;
        if(kind==='barrel'){const B=kitBarrel(1.75,0x6a4418);g=B.body;g.position.set(sx,y,sz);top=B.top;top.position.set(sx,y+.96,sz);} // S200 — the kit's barrel
        else{g=new THREE.Mesh(SK.rbox(.9,.8,.9,.05,2),crateMat);g.position.set(sx,y+.4,sz);g.rotation.y=r()*.6;top=new THREE.Mesh(new THREE.BoxGeometry(.92,.06,.92),new THREE.MeshLambertMaterial({color:0x5a3e18}));top.position.set(sx,y+.83,sz);top.rotation.y=g.rotation.y;}
        g.castShadow=true;group.add(g);group.add(top);
        let items=(typeof rollContainerLoot==='function'?rollContainerLoot('barrel',1,null,.9,site.id+':barrel:'+made+':'+lootDay()):[])||[];
        items=items.filter(it=>it&&it.dmg==null&&it.def==null&&!it.slot&&it.type!=='weapon'&&it.type!=='armor');
        if(!items.length)items.push(pick(r,[{name:'Tallow Candle',ico:'🕯️',type:'misc',weight:.2,sellMult:.3,buyPrice:4},{name:'Coil of Rope',ico:'🪢',type:'misc',weight:1,sellMult:.3,buyPrice:9},{name:'Salt Sack',ico:'🧂',type:'misc',weight:.6,sellMult:.3,buyPrice:6},{name:'Hard Bread',ico:'🍞',type:'potion',heal:6,weight:.3,sellMult:.2,buyPrice:3},{name:'Wax-sealed Letter',ico:'✉️',type:'misc',weight:.05,sellMult:.5,buyPrice:12},{name:'Tin Cup',ico:'🥛',type:'misc',weight:.3,sellMult:.3,buyPrice:3}]));
        items.forEach(it=>{if(it.qty==null)it.qty=1;});
        const c={id:site.id+':barrel:'+made,x:sx,z:sz,y,name:kind==='barrel'?'Barrel':'Crate',displayName:kind==='barrel'?'Barrel':'Crate',items,zone:'world',kind,g,top,opened:false,_settle:site.id};
        if(typeof ZONE_CORPSES!=='undefined')ZONE_CORPSES.push(c);S.loot=S.loot||[];S.loot.push(c);
        sol.push({cx:sx,cz:sz,rx:.5,rz:.5});made++;
      }
    }
    // Villagers on the plaza by day.
    if(plan.rows>0){
      const nv=site.kind==='city'?6:site.kind==='town'?4:site.kind==='village'?3:1;
      for(let i=0;i<nv;i++){
        const ang=r()*Math.PI*2,rad0=4+r()*8;
        const def=makeDef(site,reg,r,'Villager',newName(),{x:cx+Math.cos(ang)*rad0,z:cz+Math.sin(ang)*rad0,bCol:pick(r,[0x5a4030,0x3a5a3a,0x604828,0x504058,0x6a5a3a]),sCol:pick(r,[0xd4a878,0xc09070,0xb08060]),role:pick(r,['villager','farmer','old woman','fisher','kid'])});
        def.role='Villager';
        const vn=spawnNPC(def,r()*Math.PI*2,false);vn.sched={type:'villager',plaza:{x:cx,z:cz},padR:Math.max(10,pad-22)};snpcs.push(vn);
      }
    }
    // v80 S166 — a rich town (prosperity 60 or more) puts a third man on the night watch; he sleeps by day.
    // Spawned last so the draws before it (names, barrels, villagers) are the same as before Session 166.
    if(snpcs.some(n=>n.sched&&n.sched.type==='guard')&&prosperity(site)>=60){
      const def=makeDef(site,reg,r,'Guard',newName(),{nameKey:'w2',x:cx-4,z:cz+4,bCol:NAT.banner,sCol:0x808090});
      const wn=spawnNPC(def,0,true);wn.sched={type:'watch',a:{x:cx-4,z:cz+4},b:{x:cx+4,z:cz-4}};snpcs.push(wn);
    }
    // S268 — a day constable (Michael, issue #41: B): a town without walls has only its night watchman, who sleeps by day,
    // so nobody kept the law there from 6:30 to 19h. A second man walks the plaza by day and sleeps by night; he halts,
    // follows and is sent indoors as any guard on duty. Spawned last, so every draw before him is as it was.
    if(snpcs.some(n=>n.sched&&n.sched.type==='watch')&&!snpcs.some(n=>n.sched&&n.sched.type==='guard')){
      const def=makeDef(site,reg,r,'Guard',newName(),{nameKey:'c',x:cx-5,z:cz-3,bCol:0x3a3a48,sCol:0xb89878,role:'constable'});def.role='Guard';
      const cn=spawnNPC(def,0,true);cn.sched={type:'constable',a:{x:cx-6,z:cz-3},b:{x:cx+6,z:cz+3}};snpcs.push(cn);
    }
    if(S.dead)clearDead(); // S269 — the villagers and the watch are drawn after the ruin's clearing (so the draws stay put): a ruin keeps nobody in the street
    if(S._forge&&storyRuin(site)&&typeof buildBramBody==='function'){ // S270 — Bram's body at his forge, as in the legacy burned zone
      for(let k=ZONE_CORPSES.length-1;k>=0;k--)if(ZONE_CORPSES[k].bramBody&&ZONE_CORPSES[k].zone==='world')ZONE_CORPSES.splice(k,1);
      buildBramBody(group,S._forge.x,worldH(S._forge.x,S._forge.z),S._forge.z,'world');}
    S.reach=t_reach(sol,site);
    bakeSettlement(S);
    if(S.chimneys.length)try{smokeFor(S);}catch(e){console.warn('smoke',e);}
    sc.add(group);
    houses.forEach(h=>ZONES.world.houses.push(h));
    if(IMPOSTORS[site.id])IMPOSTORS[site.id].visible=false;
    SETTLE.set(site.id,S);_townNames=null;_twinUsed=null;_roleNames=null;
    if(guardsOf(S).length)try{townRoute(S);}catch(e){} // S166 — the watch's street grid, built with the town rather than at nightfall
    return S;
  }
  // Bake a settlement: every static mesh with a plain (untextured, lit) material is
  // merged into cluster meshes (60u cells) with vertex colours, one draw call each.
  // Skipped: textured signs, glass/glows (MeshBasic), banners (planes), boats, gulls.
  function mergeGeos(list){
    let total=0;list.forEach(([g])=>total+=g.attributes.position.count);
    const pos=new Float32Array(total*3),nor=new Float32Array(total*3),col=new Float32Array(total*3);let o=0;const _n=new THREE.Matrix3();
    for(const [g,m,c] of list){const p=g.attributes.position,n=g.attributes.normal,cc=g.attributes.color;const cnt=p.count;_n.getNormalMatrix(m);const v=new THREE.Vector3();
      for(let i=0;i<cnt;i++){v.set(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(m);pos[(o+i)*3]=v.x;pos[(o+i)*3+1]=v.y;pos[(o+i)*3+2]=v.z;
        if(n){v.set(n.getX(i),n.getY(i),n.getZ(i)).applyMatrix3(_n).normalize();}else v.set(0,1,0);nor[(o+i)*3]=v.x;nor[(o+i)*3+1]=v.y;nor[(o+i)*3+2]=v.z;
        if(cc){col[(o+i)*3]=cc.getX(i)*c.r;col[(o+i)*3+1]=cc.getY(i)*c.g;col[(o+i)*3+2]=cc.getZ(i)*c.b;}else{col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}
      o+=cnt;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeBoundingSphere();return geo;
  }
  // S194 — the houses' distant copies: each baked cluster of detailed houses is drawn near the eye (under HOUSE_LOD.near),
  // its plain twin past HOUSE_LOD.far, whichever it had in between
  const HOUSE_LOD={near:70,far:80};
  function houseLod(){const cp=CAM.position;for(const S of SETTLE.values()){const L=S.lodMeshes;if(!L)continue;
    for(const m of L){if(m.userData.lod!=='hi')continue;const b=m.geometry.boundingSphere;const d=Math.max(0,Math.hypot(b.center.x-cp.x,b.center.z-cp.z)-b.radius*.5);
      const twin=m.userData.twin||(m.userData.twin=L.find(o=>o.userData.lod==='lo'&&o.userData.ckey===m.userData.ckey));
      const near=d<HOUSE_LOD.near?true:d>HOUSE_LOD.far?false:m.visible;m.visible=near;if(twin)twin.visible=!near;}}}
  function bakeSettlement(S){return bakeMeshes(S.group.children.slice(),S.group,new Set(S.boats||[]),S);}
  // bake any list of meshes: merged clusters go into addTo; originals are removed from their parents
  function bakeMeshes(meshes,addTo,keep,S){
    const clusters=new Map();const dead=[];keep=keep||new Set();
    (addTo===sc?sc:addTo).updateMatrixWorld(true);
    for(const o of meshes){
      if(!o.isMesh||keep.has(o)||o.userData.noBake)continue;const mat=o.material;const g=o.geometry;
      if(!mat||mat.map||mat.isMeshBasicMaterial||mat.transparent||!g||!g.attributes||!g.attributes.position)continue;
      if(g.type==='PlaneGeometry'||g.type==='CircleGeometry')continue;
      const src=g.index?g.toNonIndexed():g;const m=o.matrixWorld.clone();const c=(mat.vertexColors?new THREE.Color(1,1,1):mat.color)||new THREE.Color(1,1,1);
      const k=Math.floor(o.position.x/60)+','+Math.floor(o.position.z/60)+(o.userData.lod?','+o.userData.lod:'');(clusters.get(k)||clusters.set(k,[]).get(k)).push([src,m,c]);dead.push(o);
    }
    dead.forEach(o=>{if(o.parent)o.parent.remove(o);});
    const out=[];for(const [k,list] of clusters){const geo=mergeGeos(list);const m=new THREE.Mesh(geo,VC_MAT);m.castShadow=true;m.receiveShadow=true;m.userData.baked=true;
      const lod=/,(hi|lo)$/.exec(k);if(lod&&S){m.userData.lod=lod[1];m.userData.ckey=k.slice(0,-3);m.visible=lod[1]==='lo';(S.lodMeshes||(S.lodMeshes=[])).push(m);}addTo.add(m);out.push(m);}
    if(S)S.baked=clusters.size;return out;
  }
  function t_reach(sol,site){let m=site.pad+6;for(const s of sol){m=Math.max(m,Math.abs(s.cx-site.x)+Math.max(s.rx,s.rz)+2,Math.abs(s.cz-site.z)+Math.max(s.rx,s.rz)+2);}return m;}
  function nationAt(x,z){try{const c=cellOf(x,z);return nationKeyOf(c[0],c[1]);}catch(e){return 'gatelands';}}
  function spawnNPC(def,ry,isStatic){ // S248 — the face is keyed by his own town (def._siteId), not the last one built: residents spawn as you come near
    const g=buildNPCMesh(def,{nation:nationAt(def.x,def.z),key:def._siteId||(_curSettle&&_curSettle.site?_curSettle.site.id:'')});g.position.set(def.x,worldH(def.x,def.z),def.z);g.rotation.y=ry;sc.add(g);
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),new THREE.MeshBasicMaterial({color:0xffdd00}));dot.position.set(def.x,worldH(def.x,def.z)+1.5,def.z);dot.visible=false;sc.add(dot);
    g.children.forEach((c,i)=>{c.castShadow=i<2;c.traverse&&c.traverse(o=>{if(o!==c&&o.isMesh)o.castShadow=false;});});
    const n={g,dot,def,wa:Math.random()*Math.PI*2,wt:0,ph:Math.random()*Math.PI*2,_static:isStatic,home:{x:def.x,z:def.z}};
    n._settle=_curSettle;npcs.push(n);return n;
  }
  function disposeSettlement(id){
    const S=SETTLE.get(id);if(!S)return;
    (S.creatures||[]).forEach(e=>{if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const k=ZONES.world.enemies.indexOf(e);if(k>=0)ZONES.world.enemies.splice(k,1);});
    (S.herbs||[]).forEach(h=>{const k=ZONES.world.herbs.indexOf(h);if(k>=0)ZONES.world.herbs.splice(k,1);});
    if(S.chest&&typeof ZONE_CORPSES!=='undefined'){const k=ZONE_CORPSES.indexOf(S.chest);if(k>=0)ZONE_CORPSES.splice(k,1);}
    sc.remove(S.group);
    S.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();}});if(S.smoke)S.smoke.geometry.dispose();
    S.npcs.forEach(n=>{sc.remove(n.g);sc.remove(n.dot);const i=npcs.indexOf(n);if(i>=0)npcs.splice(i,1);});
    S.houses.forEach(h=>{const i=ZONES.world.houses.indexOf(h);if(i>=0)ZONES.world.houses.splice(i,1);});
    if(S.loot&&typeof ZONE_CORPSES!=='undefined')S.loot.forEach(c=>{const i=ZONE_CORPSES.indexOf(c);if(i>=0)ZONE_CORPSES.splice(i,1);});
    for(let i=ZONES.world.platforms.length-1;i>=0;i--)if(ZONES.world.platforms[i].site===id)ZONES.world.platforms.splice(i,1);
    unregLights(id);S.npcs.forEach(n=>{if(n._torch&&n._torch.userData.light)unregLight(n._torch.userData.light);});
    if(IMPOSTORS[id])IMPOSTORS[id].visible=true;
    SETTLE.delete(id);
  }
  let _settleT=0;
  function tickSettlements(dt,force){
    _settleT+=dt;if(!force&&_settleT<.5)return;_settleT=0;
    for(const t of SITES){
      if(t.pad<=0)continue;
      const d=Math.hypot(px-t.x,pz-t.z);
      const IN_=POI_KINDS.includes(t.kind)?900:SETTLE_IN,OUT_=POI_KINDS.includes(t.kind)?1000:SETTLE_OUT;
      if(d<IN_&&!SETTLE.has(t.id)&&!t._queued){t._queued=true;addJob(()=>{t._queued=false;if(!SETTLE.has(t.id)&&Math.hypot(px-t.x,pz-t.z)<OUT_)genSettlement(t);return false;},2);}
      else if(d>SETTLE_OUT&&SETTLE.has(t.id))disposeSettlement(t.id);
    }
    const _dark=isNight()||hourNow()<6.5||hourNow()>=19;
    let _spawned=0;
    for(const S of SETTLE.values()){
      if(S.lamps&&S._lit!==_dark){S._lit=_dark;S.lamps.forEach(l=>{l.glass.visible=_dark;if(l.light)l.light.intensity=_dark?2.4:0;});}
      for(const res of S.residents){
        const d=Math.hypot(px-res.def.x,pz-res.def.z);
        if(d<70&&!res.n&&_spawned<2){_spawned++;res.n=spawnNPC(res.def,res.ry,false);res.n.home={x:res.def.x,z:res.def.z};res.n.sched={type:'resident',door:res.door,plaza:{x:S.site.x,z:S.site.z},padR:Math.max(10,S.site.pad-22),inn:S.innDoor||null};S.npcs.push(res.n);}
        else if(d>95&&res.n){const n=res.n;if(n._torch&&n._torch.userData.light)unregLight(n._torch.userData.light);sc.remove(n.g);sc.remove(n.dot);let i=npcs.indexOf(n);if(i>=0)npcs.splice(i,1);i=S.npcs.indexOf(n);if(i>=0)S.npcs.splice(i,1);res.n=null;}
      }
    }
  }
  function settleSolid(x,z,R,MIN){
    for(const S of SETTLE.values()){
      const t=S.site;const reach=S.reach||t.pad+6;if(Math.abs(x-t.x)>reach||Math.abs(z-t.z)>reach)continue;
      const sol=S.sol;
      for(let i=0;i<sol.length;i++){
        const s=sol[i];if(MIN&&Math.max(s.rx,s.rz)<MIN)continue;const dx=x-s.cx,dz=z-s.cz;
        if(s.c!==undefined){ // rotated rect: rotate the point into the rect's frame (mesh rotation.y = atan2(s,c))
          const lx=dx*s.c-dz*s.s,lz=dx*s.s+dz*s.c;
          if(Math.abs(lx)<s.rx+R&&Math.abs(lz)<s.rz+R)return true;
        } else if(Math.abs(dx)<s.rx+R&&Math.abs(dz)<s.rz+R)return true;
      }
    }
    return false;
  }

  // ═══ LANDMARK IMPOSTORS ══════════════════════════════════════════════
  // Low-poly stand-ins for every settlement and fort, always in the scene,
  // so a city reads from a ridge long before it streams in. Hidden while
  // the real settlement is built.
  const IMPOSTORS={};const impostorList=[];
  function buildImpostors(){}
  function buildImpostorsFor(cell){
    const c=x=>new THREE.Color(x);
    cell.sites.forEach(t=>{
      if(t.pad<=0)return;
      const r=rngFor(t.c*11+5,t.r*13+9);
      const parts=[];
      const n=t.kind==='city'?22:t.kind==='town'?14:t.kind==='port'?11:t.kind==='garrison'?7:t.kind==='village'?7:t.kind==='outpost'?3:t.kind==='camp'?0:4;
      const base=worldH(t.x,t.z);
      for(let i=0;i<n;i++){
        const ang=r()*Math.PI*2,rad=6+r()*Math.max(8,t.pad*.55);
        const x=Math.cos(ang)*rad,z=Math.sin(ang)*rad;
        const w=4+r()*3,d=3.5+r()*2.5,h=2.6+r()*.8;
        const y=worldH(t.x+x,t.z+z)-base;
        parts.push({geo:new THREE.BoxGeometry(w,h,d),color:c(t.kind==='ruin'?0x6a6258:0xa89a80),x,y:y+h/2,z,ry:r()*Math.PI,jitter:.06});
        if(t.kind!=='ruin')parts.push({geo:new THREE.ConeGeometry(Math.max(w,d)*.72,1.6,4),color:c(0x5a4a34),x,y:y+h+.8,z,ry:r()*Math.PI+Math.PI/4,jitter:.06});
      }
      if(t.kind==='city'||t.kind==='town'||t.kind==='garrison'){
        parts.push({geo:new THREE.CylinderGeometry(t.pad-5,t.pad-5,4.6,28,1,true),color:c(0x7c7870),y:2.3,jitter:.04});
        if(t.kind!=='garrison'){parts.push({geo:new THREE.BoxGeometry(11,7,9),color:c(0x7c7870),y:3.5,jitter:.05});
          [[-5.5,-4.5],[5.5,-4.5],[-5.5,4.5],[5.5,4.5]].forEach(([x,z])=>parts.push({geo:new THREE.CylinderGeometry(1.3,1.5,9,7),color:c(0x6a665e),x,z,y:4.5,jitter:.05}));}
      }
      if(t.kind==='village'&&r()<.5)parts.push({geo:new THREE.BoxGeometry(2.2,8,2.2),color:c(0x7c7870),x:8,z:-6,y:4,jitter:.05});
      if(!parts.length)return;
      const g=mergeParts(parts);
      const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));
      m.position.set(t.x,base,t.z);m.castShadow=false;m.receiveShadow=false;m.userData.noBake=true;sc.add(m);IMPOSTORS[t.id]=m;impostorList.push({id:t.id,cell:t.cell});
    });
    cell.doors.filter(e=>e.kind==='fort_door'&&dungeonWorldPos[e.seed]).forEach(e=>{
      const p=dungeonWorldPos[e.seed];const base=worldH(p.x,p.z);
      const g=mergeParts([{geo:new THREE.BoxGeometry(6,9,6),color:c(0x7c7870),y:4.5,jitter:.06},{geo:new THREE.ConeGeometry(4.6,3,4),color:c(0x4a4c56),y:10.4,ry:Math.PI/4,jitter:.05},{geo:new THREE.CylinderGeometry(24,24,4,20,1,true),color:c(0x7c7870),y:2,jitter:.05}]);
      const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));m.position.set(p.x,base,p.z);m.userData.noBake=true;sc.add(m);IMPOSTORS['door_'+e.seed]=m;impostorList.push({id:'door_'+e.seed,cell:cell.i+','+cell.j});
    });
  }

  // ═══ DISCOVERY ═══════════════════════════════════════════════════════
  // worldState.wdisc = {id:true}. Sites discover within pad+30, doors within
  // 34, peaks within 140 of the summit. Saved with worldState.
  function discovered(id){if(id==='ship')return !!SHIP.mesh;if(String(id).startsWith('q_')||String(id).startsWith('gq_'))return true;return !!(worldState.wdisc&&worldState.wdisc[id]);}
  function discover(id,name){
    if(!worldState.wdisc)worldState.wdisc={};
    if(worldState.wdisc[id])return false;
    worldState.wdisc[id]=true;
    try{const t=siteAnywhere(id);const big=t&&(t.kind==='city'||t.kind==='town'||t.kind==='port');const gain=big?50:String(id).startsWith('door_')?30:25;xp+=gain;if(typeof chkLvl==='function')chkLvl();if(typeof updateHUD==='function')updateHUD();if(typeof showMsgLong==='function')showMsgLong(`${name} discovered  ·  +${gain} XP`,'#e8d8a0');else showMsg(`${name} discovered · +${gain} XP`,'#e8d8a0');(worldState.stats||(worldState.stats={})).found=((worldState.stats||{}).found||0)+1;}catch(e){if(typeof showMsg==='function')showMsg(`Discovered: ${name}`,'#e8d8a0');}
    if(typeof addLog==='function')addLog('🗺️',`Discovered ${name}.`);
    if(typeof sndDiscover==='function')sndDiscover();
    return true;
  }
  let _discT=0,_padTown=null;
  // S353 — #66 A: arriving on a town's pad autosaves, unless a foe is on you (never mid-fight) or you ride the coach in (stepping down saves)
  function tickTownArrival(){let on=null;for(const t of SITES){if(!(t.kind in BASE_P)||t.pad<0)continue;if(Math.hypot(px-t.x,pz-t.z)<t.pad){on=t;break;}}
    const id=on?on.id:null;if(id===_padTown)return;_padTown=id;if(!on||(typeof isInterior==='function'&&isInterior()))return;
    if([...COACHES.values()].some(C=>C.riding))return;
    if(ZONES.world.enemies.some(e=>!e.dead&&e.alert&&Math.hypot(px-e.mesh.position.x,pz-e.mesh.position.z)<30))return;
    if(typeof saveGame==='function')saveGame();}
  function tickDiscovery(dt){
    _discT+=dt;if(_discT<.5)return;_discT=0;try{tickTownArrival();}catch(e){console.warn('arrival save',e);}
    for(const t of SITES){if(t.pad<0)continue;if(Math.hypot(px-t.x,pz-t.z)<t.pad+30)discover(t.id,t.name);}
    for(const e of CELL_DOORS){const p=dungeonWorldPos[e.seed];if(Math.hypot(px-p.x,pz-p.z)<34)discover('door_'+e.seed,e.canonicalName||(typeof dungeonName==='function'?dungeonName(e.seed,e.theme):'an old gate'));}
    for(const p of PEAKS){if(Math.hypot(px-p.x,pz-p.z)<140)discover(p.id,p.name);}
    for(const l of LAKES){if(Math.hypot(px-l.x,pz-l.z)<l.r+60)discover(l.id,l.name);}
  }
  // Where fast travel drops you: a site's signpost spot, a door's step, a peak's shoulder.
  function siteAnywhere(id){
    if(SITE[id])return SITE[id];
    const m=/^c(\d+)_(\d+)_[spi]\d+$/.exec(id);if(m){return getCell(+m[1],+m[2]).sites.find(t=>t.id===id)||null;}
    return getCell(HOME_I,HOME_J).sites.find(t=>t.id===id)||null;
  }
  function doorAnywhere(seed){
    for(const c of CELLS.values()){const e=c.doors.find(e=>e.seed===seed);if(e)return e;}
    for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){const c=getCell(i,j);const e=c.doors.find(e=>e.seed===seed);if(e)return e;}
    return null;
  }
  function arrivalFor(id){
    if(id==='ship'&&SHIP.mesh)return {x:SHIP.x,z:SHIP.z,yaw:SHIP.yaw,name:`the ${SHIP.name}`};
    const t=siteAnywhere(id);
    if(t&&t.kind==='port'){const sd=shoreDir(t);if(sd){const q=t.quayStart||{x:t.x+sd.dx*t.pad,z:t.z+sd.dz*t.pad};return {x:q.x-sd.dx*8,z:q.z-sd.dz*8,yaw:Math.atan2(sd.dx,sd.dz)+Math.PI,name:t.name};}}
    if(t){
      const cell=getCell(...cellOf(t.x,t.z));const byId={};cell.sites.forEach(x=>byId[x.id]=x);
      const outs=cell.roadDefs.filter(d=>d.a===t.id||d.b===t.id).map(d=>byId[d.a===t.id?d.b:d.a]).filter(Boolean);
      if(t.kind in BASE_P){const o=outs[0];const dx=o?o.x-t.x:0,dz=o?o.z-t.z:1,L=Math.hypot(dx,dz)||1;return {x:t.x+dx/L*4,z:t.z+dz/L*4+2,yaw:Math.atan2(dx,dz),name:t.name};} // v80 — the plaza, facing the road out
      if(outs.length){const o=outs[0];const dx=o.x-t.x,dz=o.z-t.z,L=Math.hypot(dx,dz);return {x:t.x+dx/L*(t.pad+8),z:t.z+dz/L*(t.pad+8),yaw:Math.atan2(dx,dz)+Math.PI,name:t.name};}
      return {x:t.x,z:t.z+t.pad+8,yaw:0,name:t.name};
    }
    if(id.startsWith('door_')){const seed=+id.slice(5);const e=CELL_DOORS.find(e=>e.seed===seed)||doorAnywhere(seed);if(!e)return null;const p=dungeonWorldPos[seed]||(e.zone==='gen'?{x:e.x,z:e.z}:null);if(!p)return null;return {x:p.x,z:p.z+(e.kind==='fort_door'?30:4),yaw:0,name:e.canonicalName||id};}
    let pk=PEAKS.find(p=>p.id===id),lk=LAKES.find(l=>l.id===id);
    if(!pk&&!lk){const m=/^c(\d+)_(\d+)_/.exec(id);if(m){const c=getCell(+m[1],+m[2]);pk=c.peaks.find(p=>p.id===id);lk=c.lakes.find(l=>l.id===id);}else{const c=getCell(HOME_I,HOME_J);pk=c.peaks.find(p=>p.id===id);lk=c.lakes.find(l=>l.id===id);}}
    if(pk)return {x:pk.x+40,z:pk.z+40,yaw:-Math.PI*.75,name:pk.name};
    if(lk)return {x:lk.x+lk.r+30,z:lk.z,yaw:Math.PI/2,name:lk.name};
    return null;
  }
  function fastTravel(id){
    const a=arrivalFor(id);if(!a||!discovered(id))return false;
    noteFastTravel(id);
    if(typeof hubOpen!=='undefined'&&hubOpen&&typeof closeHub==='function')closeHub();
    const dist=Math.hypot(a.x-px,a.z-pz);
    const mins=Math.round(dist/3.83/60*60); // one game hour per ~230u at a walk
    if(typeof advanceClock==='function')advanceClock(mins);else worldState.gameTimeMinutes+=mins;
    enter(a.x,a.z,a.yaw,'🌍 '+a.name);
    if(typeof addLog==='function')addLog('🗺️',`Travelled to ${a.name}.`);
    return true;
  }

  // ═══ WORLD MAP — one continuous parchment (Session E) ════════════════
  // The whole continent is one map. Each cell is a tile: a coarse tile
  // (48px) for the wide view, generated quickly; a fine tile (320px) when
  // you zoom into a cell, generated over frames so the map never hitches.
  // Zoom 1 fits the continent; ~40 puts one province across the pane.
  const MAP={cv:null,ctx:null,zoom:1,ox:0,oy:0,drag:null,hover:null,hoverCell:null,sel:null,W:0,H:0,dirty:true,mode:'map',tiles:new Map(),jobs:[],_entries:[]};
  const TILE_C=48,TILE_F=320,TILE_M=128; /* S588 — a middle tier, so a cell 100–220 device px across is not a 48 px tile stretched */
  const PARCH=new THREE.Color(0xd8c8a2),LOWC=new THREE.Color(0xcdb98c),HILL=new THREE.Color(0xb59d76),MTN=new THREE.Color(0x8d7c68),SNOWC=new THREE.Color(0xe9e4da),WATER=new THREE.Color(0x7d9cb0),DEEP=new THREE.Color(0x5b7d94),FORESTC=new THREE.Color(0x7c8a58),WASTEC=new THREE.Color(0xa08e74);
  // v80 S144 — the map read as brown or green because it was coloured by height: only forest (and a
  // 'wastes' test that never matched the generated 'wasteland') tinted it. Every biome the generator
  // uses now has a tint, laid over the parchment and fading out as the ground climbs into rock and snow.
  const MAPBIO={
    forest:{col:0x6d8a4c,amt:.52,label:'Forest'},
    autumn:{col:0xb0762c,amt:.42,label:'Autumn wood'},
    plains:{col:0xbdae6a,amt:.26,label:'Plains'},
    coast:{col:0xd9cb9c,amt:.30,label:'Coast'},
    dunes:{col:0xe3d193,amt:.46,label:'Dunes'},
    moor:{col:0x93758c,amt:.34,label:'Moor'},
    fen:{col:0x7f8f6b,amt:.40,label:'Fen'},
    swamp:{col:0x64764f,amt:.46,label:'Swamp'},
    tundra:{col:0xdde8ee,amt:.55,label:'Tundra'},
    wasteland:{col:0x9c8a72,amt:.46,label:'Wasteland'},
    wastes:{col:0xa08e74,amt:.46,label:'Wastes'},
  };
  const _mb=new THREE.Color();
  function tileKey(i,j,res){return i+','+j+':'+res;}
  // S588 — the map drew at the canvas's CSS size, so a HiDPI screen stretched every pixel; its backing store is now dpr times
  // that and the drawing is scaled, while everything else (the mouse, the pan, the zoom) stays in CSS pixels, read through these
  function mapLW(){return MAP.lw||MAP.cv.width;}
  function mapLH(){return MAP.lh||MAP.cv.height;}
  function withCellData(cell,fn){
    // lend this cell's AND its neighbours' regions/landmarks to worldH (unloaded ones only)
    const lent=[];
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=cell.i+di,j=cell.j+dj;if(i<0||j<0||i>=GRID||j>=GRID)continue;const k=cellKey(i,j);if(LOADED.has(k))continue;const c=getCell(i,j);lent.push(c);
      c.regions.forEach(r_=>REGIONS.push(r_));c.peaks.forEach(p=>PEAKS.push(p));c.lakes.forEach(l=>LAKES.push(l));c.rivers.forEach(rv=>RIVERS.push(rv));(c.inlets||[]).forEach(inl=>INLETS.push(inl));}
    try{return fn();}finally{
      for(const c of lent){c.regions.forEach(r_=>{const i=REGIONS.indexOf(r_);if(i>=0)REGIONS.splice(i,1);});c.peaks.forEach(p=>{const i=PEAKS.indexOf(p);if(i>=0)PEAKS.splice(i,1);});c.lakes.forEach(l=>{const i=LAKES.indexOf(l);if(i>=0)LAKES.splice(i,1);});c.rivers.forEach(rv=>{const i=RIVERS.indexOf(rv);if(i>=0)RIVERS.splice(i,1);});(c.inlets||[]).forEach(inl=>{const i=INLETS.indexOf(inl);if(i>=0)INLETS.splice(i,1);});}}
  }
  // colour one map pixel from height / region / slope
  const _mc=new THREE.Color();
  function mapPixel(x,z,h,shade,out){
    if(h<0){_mc.copy(WATER).lerp(DEEP,sstep(0,-7,h));if(h>-1.2)_mc.lerp(PARCH,.35);}
    else{
      _mc.copy(PARCH).lerp(LOWC,sstep(1,8,h)).lerp(HILL,sstep(8,30,h)).lerp(MTN,sstep(30,70,h)).lerp(SNOWC,sstep(70,130,h));
      const dom=dominantRegion(x,z).r;const B=MAPBIO[dom.biome];
      if(B&&h<72){
        let amt=B.amt*(1-sstep(36,72,h));
        if(dom.biome==='forest'){const dens=regionScalar(x,z,'density');amt=Math.min(.62,dens*.8)*(1-sstep(25,44,h));} // a thin wood reads thinner
        if(amt>0){_mb.setHex(B.col);_mc.lerp(_mb,amt);}
      }
      _mc.multiplyScalar(shade);_mc.multiplyScalar(1+(_smoothNoise(x,z,SEED+55,9)-.5)*.10);
    }
    out[0]=Math.min(255,_mc.r*255)|0;out[1]=Math.min(255,_mc.g*255)|0;out[2]=Math.min(255,_mc.b*255)|0;
  }
  // A tile job renders rows across frames; coarse tiles finish in one go.
  function startTile(cell,res,sub){
    const key=tileKey(cell.i,cell.j,res)+(sub?'/'+sub.n+'/'+sub.a+'/'+sub.b:'');if(MAP.tiles.has(key))return MAP.tiles.get(key);
    const cv=document.createElement('canvas');cv.width=res;cv.height=res;const ctx=cv.getContext('2d');
    const n=sub?sub.n:1;const img=ctx.createImageData(res,res);const step=SIZE/res/n;const H=new Float32Array((res+1)*(res+1));
    const t={cv,ctx,img,H,row:0,hrow:0,done:false,cell,res,step,sub:sub||null,key,n,X0:cell.ox+(sub?sub.a*SIZE/n:0),Z0:cell.oz+(sub?sub.b*SIZE/n:0)};MAP.tiles.set(key,t);MAP.jobs.push(t); /* S588 — sub: one of n×n squares of the cell at full resolution, for a deep zoom */
    if(res<=TILE_C){while(!t.done)tileStep(t,1e9);}
    return t;
  }
  function tileStep(t,rowsBudget){
    const {cell,res,step,H}=t;const X0=t.X0!=null?t.X0:cell.ox,Z0=t.Z0!=null?t.Z0:cell.oz,nS=t.n||1;
    withCellData(cell,()=>{
      // heights first (res+1 rows), then pixels
      while(t.hrow<=res&&rowsBudget>0){const j=t.hrow;for(let i=0;i<=res;i++)H[j*(res+1)+i]=worldH(X0+i*step,Z0+j*step);t.hrow++;rowsBudget--;}
      if(t.hrow<=res)return;
      const d=t.img.data,px3=[0,0,0];
      while(t.row<res&&rowsBudget>0){const j=t.row;
        for(let i=0;i<res;i++){const h=H[j*(res+1)+i];const x=X0+i*step,z=Z0+j*step;
          const hx=H[j*(res+1)+Math.min(res,i+1)]-H[j*(res+1)+Math.max(0,i-1)],hz=H[Math.min(res,j+1)*(res+1)+i]-H[Math.max(0,j-1)*(res+1)+i];
          const shade=Math.max(.72,Math.min(1.22,1+(-hx-hz)*(res>=TILE_F?.045*nS:.02)));
          mapPixel(x,z,h,shade,px3);const k=(j*res+i)*4;d[k]=px3[0];d[k+1]=px3[1];d[k+2]=px3[2];d[k+3]=255;}
        t.row++;rowsBudget--;}
      if(t.row>=res){t.ctx.putImageData(t.img,0,0);
        if(res>=TILE_F){ // hatched water on fine tiles
          const c=t.ctx;c.strokeStyle='rgba(60,90,110,.22)';c.lineWidth=1;
          for(let j=4;j<res;j+=6){c.beginPath();let on=false;for(let i=0;i<res;i++){const h=H[j*(res+1)+i];if(h<-.6){if(!on){c.moveTo(i,j+((i/9|0)%2));on=true;}else c.lineTo(i,j+((i/9|0)%2));}else on=false;}c.stroke();}}
        t.done=true;const k=MAP.jobs.indexOf(t);if(k>=0)MAP.jobs.splice(k,1);MAP.dirty=true;}
    });
  }
  function mapJobs(){const t0=performance.now();while(MAP.jobs.length&&performance.now()-t0<24){const t=MAP.jobs[0];if(t.done){MAP.jobs.shift();continue;}tileStep(t,12);if(!t.done)break;}}
  // world ↔ screen
  function baseScale(){return Math.min(mapLW(),mapLH())/(SIZE*GRID);}
  function mapToScreen(x,z){const s=baseScale()*MAP.zoom;return [x*s+MAP.ox,z*s+MAP.oy];}
  function screenToMap(sx,sy){const s=baseScale()*MAP.zoom;return [(sx-MAP.ox)/s,(sy-MAP.oy)/s];}
  function mapClamp(){const s=baseScale()*MAP.zoom,w=SIZE*GRID*s,cw=mapLW(),ch=mapLH();MAP.ox=Math.min(Math.max(MAP.ox,cw-w-60),60);MAP.oy=Math.min(Math.max(MAP.oy,ch-w-60),60);if(w<cw)MAP.ox=(cw-w)/2;if(w<ch)MAP.oy=(ch-w)/2;}
  // icons
  function drawIcon(ctx,kind,s,known){
    ctx.save();ctx.scale(s,s);
    ctx.lineWidth=1.2;ctx.strokeStyle='#2a1c10';ctx.fillStyle=known?'#f2e6c4':'#c9b68f';
    const house=(x,y,w)=>{ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(x-w,y-w);ctx.lineTo(x,y-w*1.8);ctx.lineTo(x+w,y-w);ctx.lineTo(x+w,y);ctx.closePath();ctx.fill();ctx.stroke();};
    if(kind==='city'){ctx.beginPath();ctx.rect(-7,-4,14,8);ctx.fill();ctx.stroke();for(let i=-6;i<=6;i+=4){ctx.beginPath();ctx.rect(i-1.2,-8,2.4,4);ctx.fill();ctx.stroke();}ctx.beginPath();ctx.rect(-2.5,-13,5,9);ctx.fill();ctx.stroke();}
    else if(kind==='town'||kind==='garrison'||kind==='port'){ctx.beginPath();ctx.rect(-6,-3,12,6);ctx.fill();ctx.stroke();for(let i=-5;i<=5;i+=5){ctx.beginPath();ctx.rect(i-1.2,-6,2.4,3);ctx.fill();ctx.stroke();}house(0,-3,3);if(kind==='port'){ctx.fillStyle='#2a3a6a';ctx.fillRect(-1,4,2,6);ctx.beginPath();ctx.arc(0,8,4,.2*Math.PI,.8*Math.PI);ctx.stroke();}}
    else if(kind==='village'){house(-3,3,3);house(3,2,2.6);}
    else if(kind==='outpost'){ctx.beginPath();ctx.rect(-2.5,-6,5,10);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-3.5,-6);ctx.lineTo(0,-9.5);ctx.lineTo(3.5,-6);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(kind==='fort'){ctx.beginPath();ctx.rect(-4,-4,8,9);ctx.fill();ctx.stroke();for(let i=-3;i<=3;i+=3){ctx.beginPath();ctx.rect(i-.9,-7,1.8,3);ctx.fill();ctx.stroke();}}
    else if(kind==='cave'){ctx.beginPath();ctx.moveTo(-5,4);ctx.lineTo(-5,-1);ctx.arc(0,-1,5,Math.PI,0);ctx.lineTo(5,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#2a1c10';ctx.beginPath();ctx.moveTo(-2.5,4);ctx.lineTo(-2.5,0);ctx.arc(0,0,2.5,Math.PI,0);ctx.lineTo(2.5,4);ctx.closePath();ctx.fill();}
    else if(kind==='camp'){ctx.beginPath();ctx.moveTo(-6,4);ctx.lineTo(0,-6);ctx.lineTo(6,4);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(kind==='ruin'){ctx.beginPath();ctx.rect(-6,-1,4,5);ctx.rect(-1,-4,3,8);ctx.rect(3,0,3,4);ctx.fill();ctx.stroke();}
    else if(kind==='poi'){ctx.beginPath();ctx.rect(-2,-6,4,10);ctx.fill();ctx.stroke();ctx.beginPath();ctx.rect(-5,-2,3,6);ctx.rect(2,-3,3,7);ctx.fill();ctx.stroke();}
    else if(kind==='peak'){ctx.beginPath();ctx.moveTo(-8,5);ctx.lineTo(-2,-7);ctx.lineTo(2,-2);ctx.lineTo(5,-5);ctx.lineTo(9,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-3.5,-4);ctx.lineTo(-2,-7);ctx.lineTo(-.5,-4);ctx.closePath();ctx.fill();}
    else if(kind==='lake'){ctx.beginPath();ctx.ellipse(0,0,7,4,0,0,Math.PI*2);ctx.fillStyle='#7d9cb0';ctx.fill();ctx.stroke();}
    else if(kind==='glade'){ctx.beginPath();ctx.ellipse(0,1,7,4,0,0,Math.PI*2);ctx.fillStyle='#7d9cb0';ctx.fill();ctx.stroke();ctx.fillStyle='#6a8a3a';[[-7,-3],[7,-4],[0,-7]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();ctx.stroke();});}
    else if(kind==='shrine'){ctx.beginPath();ctx.arc(0,-2,6,Math.PI,0);ctx.lineTo(6,4);ctx.lineTo(-6,4);ctx.closePath();ctx.fill();ctx.stroke();for(let x=-4;x<=4;x+=4){ctx.beginPath();ctx.moveTo(x,-2);ctx.lineTo(x,4);ctx.stroke();}}
    else if(kind==='lair'){ctx.beginPath();ctx.moveTo(-7,5);ctx.lineTo(-5,-2);ctx.lineTo(0,-7);ctx.lineTo(5,-2);ctx.lineTo(7,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#2a1c10';ctx.beginPath();ctx.moveTo(-3,5);ctx.lineTo(0,-1);ctx.lineTo(3,5);ctx.closePath();ctx.fill();}
    else if(kind==='tower'){ctx.beginPath();ctx.rect(-2.5,-9,5,14);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-3.5,-9);ctx.lineTo(0,-13);ctx.lineTo(3.5,-9);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(kind==='bcamp'){ctx.beginPath();ctx.moveTo(-8,4);ctx.lineTo(-3,-5);ctx.lineTo(2,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(1,4);ctx.lineTo(5,-3);ctx.lineTo(9,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#c83a2a';ctx.beginPath();ctx.arc(-1,7,1.8,0,Math.PI*2);ctx.fill();}
    else if(kind==='quest'){ctx.fillStyle='#e8c040';ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(3,-3);ctx.lineTo(11,-2);ctx.lineTo(5,3);ctx.lineTo(7,11);ctx.lineTo(0,7);ctx.lineTo(-7,11);ctx.lineTo(-5,3);ctx.lineTo(-11,-2);ctx.lineTo(-3,-3);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(kind==='ship'){ctx.beginPath();ctx.moveTo(-8,2);ctx.lineTo(8,2);ctx.lineTo(6,6);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillRect(-.6,-9,1.2,11);ctx.beginPath();ctx.moveTo(.6,-8);ctx.lineTo(7,-2);ctx.lineTo(.6,-1);ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.restore();
  }
  function mapEntries(cell){
    const out=[];const c=cell;if(!c)return out;
    const SUB={glade:'Glade',shrine:'Shrine',lair:'Lair',tower:'Spire',bcamp:'Bandit camp',bridge:'Bridge'};
    c.sites.forEach(t=>{if(t.kind==='portal')return;out.push({id:t.id,name:t.name,kind:t.kind,x:t.x,z:t.z,sub:SUB[t.kind]||(t.kind.charAt(0).toUpperCase()+t.kind.slice(1)),major:t.kind==='city'||t.kind==='town'||t.kind==='port'||t.kind==='garrison'||t.kind==='tower'||t.kind==='shrine'});});
    c.doors.forEach(e=>{if(e.wet)return;const p=dungeonWorldPos[e.seed]||(e.zone==='gen'?{x:e.x,z:e.z}:null);if(!p)return;out.push({id:'door_'+e.seed,name:e.canonicalName||(typeof dungeonName==='function'?dungeonName(e.seed,e.theme):'Old gate'),kind:e.kind==='fort_door'?'fort':'cave',x:p.x,z:p.z,sub:`${e.kind==='fort_door'?'Fort':'Old gate'} · ${e.theme}`,major:e.kind==='fort_door'});});
    c.peaks.forEach(p=>out.push({id:p.id,name:p.name,kind:'peak',x:p.x,z:p.z,sub:'Mountain',major:true}));
    c.lakes.forEach(l=>out.push({id:l.id,name:l.name,kind:'lake',x:l.x,z:l.z,sub:'Lake',major:true}));
    const wk=worldState.ship&&worldState.ship.sunk;if(wk&&wk.x>=c.ox&&wk.x<c.ox+SIZE&&wk.z>=c.oz&&wk.z<c.oz+SIZE)out.push({id:'shipwreck',name:`The wreck of the ${worldState.ship.name||SHIP.name}`,kind:'ship',x:wk.x,z:wk.z,sub:'Where she went down',major:true});
    if(SHIP.mesh&&SHIP.x>=c.ox&&SHIP.x<c.ox+SIZE&&SHIP.z>=c.oz&&SHIP.z<c.oz+SIZE)out.push({id:'ship',name:`The ${SHIP.name}`,kind:'ship',x:SHIP.x,z:SHIP.z,sub:'Your ship',major:true});
    questMarkers(c).forEach(m=>out.push(m));
    return out;
  }
  function visibleCells(){const [x0,z0]=screenToMap(0,0),[x1,z1]=screenToMap(mapLW(),mapLH());const out=[];for(let j=Math.max(0,Math.floor(z0/SIZE));j<=Math.min(GRID-1,Math.floor(z1/SIZE));j++)for(let i=Math.max(0,Math.floor(x0/SIZE));i<=Math.min(GRID-1,Math.floor(x1/SIZE));i++)out.push(getCell(i,j));return out;}
  function mapDraw(){
    const ctx=MAP.ctx;if(!ctx)return;const cw=mapLW(),ch=mapLH();ctx.setTransform(MAP.dpr||1,0,0,MAP.dpr||1,0,0); /* S588 */
    ctx.fillStyle='#2b241a';ctx.fillRect(0,0,cw,ch);
    if(MAP.mode==='local'){const size=Math.min(cw,ch);ctx.save();ctx.translate((cw-size)/2,(ch-size)/2);drawLocalMap(ctx,size,130,true);ctx.restore();MAP.dirty=true;return;}
    const s=baseScale()*MAP.zoom,cellPx=SIZE*s;
    const dpr=MAP.dpr||1;
    const cells=visibleCells();const fine=cellPx*dpr>=220,mid=cellPx*dpr>=100;MAP.drawN=(MAP.drawN||0)+1;const seen=new Set();
    let deep=1;while(deep<16&&TILE_F*deep*1.25<cellPx*dpr)deep*=2; /* S588 — past a 320 px tile, the cell in deep×deep squares */
    const [pi,pj]=cellOf(px,pz);
    // tiles
    for(const c of cells){
      const [sx,sy]=mapToScreen(c.ox,c.oz);
      let t=MAP.tiles.get(tileKey(c.i,c.j,TILE_C))||startTile(c,TILE_C);
      if(mid&&(!fine||deep>1)){const m=MAP.tiles.get(tileKey(c.i,c.j,TILE_M))||startTile(c,TILE_M);seen.add(m.key);if(m.done)t=m;} /* under the squares, the cheap middle tier */
      if(fine&&deep===1){const f=MAP.tiles.get(tileKey(c.i,c.j,TILE_F))||startTile(c,TILE_F);seen.add(f.key);if(f.done)t=f;else{const m=MAP.tiles.get(tileKey(c.i,c.j,TILE_M));if(m&&m.done)t=m;}}
      if(t&&(t.done||t.res<=TILE_C)){ctx.drawImage(t.cv,sx,sy,cellPx+.6,cellPx+.6);}
      if(deep>1&&c.type!=='sea'){const q=cellPx/deep,W=mapLW(),Hh=mapLH();
        for(let b=0;b<deep;b++)for(let a=0;a<deep;a++){const qx=sx+a*q,qy=sy+b*q;if(qx>W||qy>Hh||qx+q<0||qy+q<0)continue;
          const k=tileKey(c.i,c.j,TILE_F)+'/'+deep+'/'+a+'/'+b;const st=MAP.tiles.get(k)||startTile(c,TILE_F,{n:deep,a,b});st.seen=MAP.drawN;seen.add(k);if(st.done)ctx.drawImage(st.cv,qx,qy,q+.6,q+.6);}}
      // undiscovered provinces sit under a light sepia wash
      if(c.type!=='sea'&&!(c.i===pi&&c.j===pj)&&!c.sites.some(x=>discovered(x.id))){ctx.fillStyle='rgba(60,40,20,.22)';ctx.fillRect(sx,sy,cellPx+.6,cellPx+.6);}
    }
    // S588 — tiles panned or zoomed away are not worked on (they start again if wanted), and no more than 160 squares are kept
    if(MAP.jobs.some(j=>!seen.has(j.key))){MAP.jobs=MAP.jobs.filter(j=>{if(seen.has(j.key))return true;MAP.tiles.delete(j.key);return false;});}
    {let nSub=0;for(const t of MAP.tiles.values())if(t.sub)nSub++;if(nSub>160){for(const [k,t] of MAP.tiles){if(nSub<=120)break;if(t.sub&&t.done&&t.seen!==MAP.drawN){MAP.tiles.delete(k);nSub--;}}}}
    // province borders (faint) once you're in close
    if(cellPx>=140){ctx.strokeStyle='rgba(40,28,14,.25)';ctx.lineWidth=1;ctx.setLineDash([6,4]);for(const c of cells){if(c.type==='sea')continue;const [sx,sy]=mapToScreen(c.ox,c.oz);ctx.strokeRect(sx,sy,cellPx,cellPx);}ctx.setLineDash([]);}
    // roads
    if(cellPx>=160){ctx.strokeStyle='rgba(88,58,30,.85)';ctx.lineWidth=Math.max(1,Math.min(2.2,cellPx/300));ctx.setLineDash([5,3]);
      for(const c of cells){const k=cellKey(c.i,c.j);
        if(LOADED.has(k)){for(const rd of ROADS){if(rd.cell!==k)continue;ctx.beginPath();rd.pts.forEach((p,i)=>{const [x,y]=mapToScreen(p.x,p.z);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}}
        else{const byId={};c.sites.forEach(t=>byId[t.id]=t);for(const d of c.roadDefs){const A=byId[d.a],B=byId[d.b];if(!A||!B)continue;const [ax,ay]=mapToScreen(A.x,A.z),[bx,by]=mapToScreen(B.x,B.z);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}}}
      ctx.setLineDash([]);}
    // coaching roads: a paved double line
    if(cellPx>=100){const Cs=worldState.coaches||{};for(const key in Cs){const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);if(!rd)continue;ctx.setLineDash([]);ctx.strokeStyle='rgba(60,40,20,.95)';ctx.lineWidth=Math.max(4,cellPx/120);ctx.beginPath();rd.pts.forEach((p,i)=>{const [x,y]=mapToScreen(p.x,p.z);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.strokeStyle='rgba(220,200,160,.9)';ctx.lineWidth=Math.max(1.5,cellPx/300);ctx.stroke();}}
    // trade routes: a firm brown line along the road
    if(cellPx>=100){const R=worldState.routes||{};ctx.strokeStyle='rgba(120,70,20,.9)';ctx.lineWidth=Math.max(2,cellPx/200);ctx.setLineDash([]);for(const key in R){const rt=R[key];const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);if(rd){if(rt.broken){ctx.strokeStyle='rgba(160,40,20,.8)';ctx.setLineDash([4,4]);}ctx.beginPath();rd.pts.forEach((p,i)=>{const [x,y]=mapToScreen(p.x,p.z);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba(120,70,20,.9)';}else{const a=siteAnywhere(rt.a),b=siteAnywhere(rt.b);if(a&&b){const [ax,ay]=mapToScreen(a.x,a.z),[bx,by]=mapToScreen(b.x,b.z);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}}}}
    // labels
    ctx.textAlign='center';
    if(cellPx<140){ctx.font=`italic 700 ${Math.max(16,Math.min(30,cellPx*.28))}px Georgia, serif`;ctx.fillStyle='rgba(60,40,20,.55)';landmassOf(0,0);for(let m=0;m<_landmass.count;m++){const c=_landmass['c'+m];if(c.n<3)continue;const key=_landmass.nation[m];const nat=NATIONS[key];const [x,y]=mapToScreen((c.i+.5)*SIZE,(c.j+.5)*SIZE);ctx.fillText(nat.formal,x,y-8);ctx.font=`italic 500 ${Math.max(10,Math.min(16,cellPx*.16))}px Georgia, serif`;ctx.fillText(nat.name,x,y+10);ctx.font=`italic 700 ${Math.max(16,Math.min(30,cellPx*.28))}px Georgia, serif`;}}
    if(cellPx>=60&&cellPx<520){ctx.font=`italic 600 ${Math.max(10,Math.min(18,cellPx*.09))}px Georgia, serif`;ctx.fillStyle='rgba(70,50,30,.7)';for(const c of cells){if(c.type==='sea')continue;const [x,y]=mapToScreen(c.ox+SIZE/2,c.oz+SIZE*.12);ctx.fillText(c.name||'',x,y,cellPx-8);}}
    if(cellPx>=520){ctx.font='italic 600 14px Georgia, serif';for(const c of cells){ctx.fillStyle='rgba(70,50,30,.55)';c.regions.forEach(r=>{const [x,y]=mapToScreen(r.x,r.z);ctx.fillText(r.name||r.id,x,y-14);});ctx.fillStyle='rgba(60,70,90,.6)';c.lakes.forEach(l=>{const [x,y]=mapToScreen(l.x,l.z);ctx.fillText(l.name,x,y+4);});ctx.fillStyle='rgba(60,50,40,.7)';c.peaks.forEach(p=>{const [x,y]=mapToScreen(p.x,p.z);ctx.fillText(p.name,x,y-10);});ctx.font='italic 600 20px Georgia, serif';ctx.fillStyle='rgba(70,50,30,.45)';const [nx,ny]=mapToScreen(c.ox+SIZE/2,c.oz+120);ctx.fillText(c.name||'',nx,ny);ctx.font='italic 600 14px Georgia, serif';}}
    // icons
    const entries=[];const isc=Math.max(.9,Math.min(2.2,cellPx/420))*(Math.min(cw,ch)/700);
    if(cellPx>=60){for(const c of cells)for(const e of mapEntries(c)){if(!discovered(e.id))continue;if(cellPx<160&&!e.major)continue;if(!mapAllowed(e))continue;entries.push(e);}}
    else{for(const c of cells)for(const e of questMarkers(c)){if(mapAllowed(e))entries.push(e);}} /* S587 — zoomed out to the whole world, the quests still show */
    MAP._entries=entries;
    for(const e of entries){const [sx,sy]=mapToScreen(e.x,e.z);ctx.save();ctx.translate(sx,sy);
      if(MAP.hover===e.id||MAP.sel===e.id){ctx.beginPath();ctx.arc(0,0,13*isc,0,Math.PI*2);ctx.fillStyle='rgba(255,230,160,.35)';ctx.fill();}
      drawIcon(ctx,e.kind,isc,true);
      if(cellPx>=260||e.kind==='city'||MAP.hover===e.id){ctx.font=`${Math.round(11*isc)}px Georgia, serif`;ctx.fillStyle='#2a1c10';ctx.strokeStyle='rgba(240,228,200,.8)';ctx.lineWidth=3;ctx.strokeText(e.name,0,14*isc+4);ctx.fillText(e.name,0,14*isc+4);}
      ctx.restore();}
    // S496 — your notes pinned to the map (DECISION #132, part C)
    MAP._notes=[];(worldState.mapNotes||[]).forEach((n,i)=>{if(!n)return;const [sx,sy]=mapToScreen(n.x,n.z);if(sx<-20||sy<-20||sx>cw+20||sy>ch+20)return;MAP._notes.push({i,sx,sy});const on=MAP.hover==='note:'+i||MAP.sel==='note:'+i;
      ctx.save();ctx.translate(sx,sy);if(on){ctx.beginPath();ctx.arc(0,-7*isc,11*isc,0,Math.PI*2);ctx.fillStyle='rgba(255,230,160,.35)';ctx.fill();}
      ctx.strokeStyle='#2a1c10';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-12*isc);ctx.stroke();ctx.fillStyle='#f0e4c4';ctx.fillRect(0,-12*isc,8*isc,6*isc);ctx.strokeRect(0,-12*isc,8*isc,6*isc);ctx.restore();});
    if(MAP.noteAt){const [sx,sy]=mapToScreen(MAP.noteAt.x,MAP.noteAt.z);ctx.strokeStyle='#8a2a22';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,6*isc,0,Math.PI*2);ctx.stroke();}
    // other ships, player
    for(const o of OTHER){const [sx,sy]=mapToScreen(o.x,o.z);ctx.fillStyle=o.kind==='pirate'?'#b02020':'#8a8a8a';ctx.beginPath();ctx.arc(sx,sy,Math.max(2,3*isc),0,Math.PI*2);ctx.fill();}
    const _mp=(activeZoneId==='world')?{x:px,z:pz}:(typeof currentHouse!=='undefined'&&currentHouse&&currentHouse.exitX!=null)?{x:currentHouse.exitX,z:currentHouse.exitZ}:(typeof currentPortal!=='undefined'&&currentPortal&&dungeonWorldPos[currentPortal.seed])?dungeonWorldPos[currentPortal.seed]:{x:px,z:pz};
    const [pxs,pys]=mapToScreen(_mp.x,_mp.z);ctx.save();ctx.translate(pxs,pys);ctx.rotate(-yaw);ctx.beginPath();ctx.moveTo(0,-9*isc);ctx.lineTo(6*isc,7*isc);ctx.lineTo(0,3*isc);ctx.lineTo(-6*isc,7*isc);ctx.closePath();ctx.fillStyle='#c8322a';ctx.fill();ctx.strokeStyle='#2a0c08';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
    // compass, frame
    ctx.save();ctx.translate(cw-46,52);ctx.strokeStyle='rgba(40,28,14,.7)';ctx.fillStyle='rgba(240,228,200,.75)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(5,0);ctx.lineTo(0,20);ctx.lineTo(-5,0);ctx.closePath();ctx.fillStyle='#8a2a22';ctx.fill();ctx.fillStyle='#2a1c10';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText('N',0,-27);ctx.restore();
    const [fx,fy]=mapToScreen(0,0);ctx.strokeStyle='rgba(40,28,14,.8)';ctx.lineWidth=3;ctx.strokeRect(fx,fy,SIZE*GRID*s,SIZE*GRID*s);
    MAP.dirty=MAP.jobs.length>0;
  }
  // ── hover card for settlements: prosperity, services, guilds, issues, culture, people ──
  const SHOP_WORD={forge:'smith',goods:'goods',inn:'inn',apothecary:'apothecary',church:'church',armoury:'armoury',shipwright:'shipwright',guild_f:"Fighters' Guild",guild_m:"Mages' Guild",barber:'barber',keep:'keep',castle:'keep',weapon:'smith',armor:'armoury',potion:'apothecary',misc:'goods'};
  function townCard(t){
    const [i,j]=cellOf(t.x,t.z);const nat=nationOf(i,j);const st=TS(t);const S=SETTLE.get(t.id);
    let services,guilds;
    if(S){const types=S.houses.map(h=>h.type);services=[...new Set(types.filter(x=>x!=='home'&&x!=='guild_f'&&x!=='guild_m').map(x=>SHOP_WORD[x]||x))];guilds=[...new Set(types.filter(x=>x==='guild_f'||x==='guild_m').map(x=>SHOP_WORD[x]))];}
    else{const plan=KIND_PLAN[t.kind]||KIND_PLAN.village;const list=[...plan.shops,...(plan.late||[]),...((t.kind==='town'||t.kind==='city')?['guild_f','guild_m']:[])];const open=shopsFor(t,list);services=[...new Set(open.filter(x=>x!=='guild_f'&&x!=='guild_m').map(x=>SHOP_WORD[x]||x))];guilds=open.filter(x=>x==='guild_f'||x==='guild_m').map(x=>SHOP_WORD[x]);}
    st.builds.forEach(b=>{if(b.done){if(b.key==='guild'&&!guilds.includes("Fighters' Guild"))guilds.push("Fighters' Guild");if(b.key==='inn'&&!services.includes('inn'))services.push('inn');if(b.key==='chapel'&&!services.includes('church'))services.push('church');if(b.key==='harbour')services.push('harbour');}});
    // issues
    const issues=[];for(const f in st.flags)issues.push(f==='scaffold'?'building':f);
    let near=null,nd=1e9;for(const o of (SITES.length?SITES:[])){if((o.kind==='lair'||o.kind==='bcamp')&&Math.hypot(o.x-t.x,o.z-t.z)<nd){nd=Math.hypot(o.x-t.x,o.z-t.z);near=o;}}
    if(near&&nd<700&&!(worldState.lairs&&worldState.lairs[near.id]))issues.push(near.kind==='bcamp'?`bandits at ${near.name}`:`a beast at ${near.name}`);
    const cleared=worldState.roadsCleared||{};const rds=ROAD_DEFS.filter(x=>x.a===t.id||x.b===t.id);const unclear=rds.filter(x=>!(cleared[x.a+'|'+x.b]||cleared[x.b+'|'+x.a])).length;if(rds.length&&unclear===rds.length)issues.push('roads unpatrolled');
    if(st.p<35)issues.push('homes shuttered');
    const R=worldState.routes||{};let open=0,broken=0;for(const key in R){if(R[key].a===t.id||R[key].b===t.id){if(R[key].broken)broken++;else open++;}}if(open)services.push(`${open} trade route${open>1?'s':''}`);if(broken)issues.push(`${broken} route${broken>1?'s':''} broken`);
    // people
    let demo;if(S&&S.npcs.length){const c={};S.npcs.forEach(n=>{const p=n.def.people||'gatelander';c[p]=(c[p]||0)+1;});const tot=S.npcs.length;demo=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([p,n])=>`${PEOPLES[p]?PEOPLES[p].name:p} ${Math.round(n/tot*100)}%`).join(', ');}
    else{const base=peopleOfSite(t);const blend=t.kind==='port'||t.islet;const others=Object.keys(PEOPLES).filter(p=>p!==nat.people&&p!=='oldblood');demo=blend?`${PEOPLES[nat.people].name} ~55%, ${PEOPLES[others[0]].name} ~25%, ${PEOPLES[others[1]].name} ~15%, Old Blood ~5%`:`${PEOPLES[nat.people].name} ~94%, Old Blood ~6%`;}
    const culture=(CULTURES[t.reg]||{}).name||t.reg||'';const lord=lordFor(t);
    const HOW={'roads unpatrolled':'clear the road (a quest from the lord) or open a trade route','homes shuttered':'raise prosperity — clear roads, kill the nearby beast, pay for a well','sacked':'give it time; clear the camp that did it','burned':'it will not recover on its own','plague':'clear the province\'s gate','abandoned':'re-found it: clear its roads and invest','scaffold':'building — three days'};
    const withHow=issues.map(i=>{let how=HOW[i];if(!how&&/^bandits at/.test(i))how='clear the camp';if(!how&&/^a beast at/.test(i))how='kill it';if(!how&&/route.*broken/.test(i))how='clear the camp on the road, then reopen it with the lord';return how?`${i} <span style="color:#8a7a60">— ${how}</span>`:i;});
    return `<div style="font:600 15px Georgia,serif;color:#f0e2c0">${t.name}</div>
      <div style="color:#b8a880;font-size:11px;margin:2px 0 6px">${(t.kind.charAt(0).toUpperCase()+t.kind.slice(1))} · ${nat.name} · ${culture} · ${lord.title} ${lord.name}</div>
      <div style="font-size:12px"><span style="color:#8a7a60">Prosperity</span> <b style="color:${st.p>=60?'#9ae090':st.p>=35?'#e8c040':'#e07060'}">${st.p}</b> — ${stateLine(t).split(' (')[0]}</div>
      <div style="font-size:12px"><span style="color:#8a7a60">Services</span> ${services.length?services.join(', '):'none'}</div>
      <div style="font-size:12px"><span style="color:#8a7a60">Guilds</span> ${guilds.length?guilds.join(', '):'none'}</div>
      <div style="font-size:12px"><span style="color:#8a7a60">People</span> ${demo}</div>
      <div style="font-size:12px;color:${issues.length?'#e0a070':'#8a7a60'}"><span style="color:#8a7a60">Issues</span> ${issues.length?withHow.join('<br>'):'none'}</div>`;
  }
  function showTownCard(e,sx,sy){let el=document.getElementById('wm-hover');if(!el){el=document.createElement('div');el.id='wm-hover';el.style.cssText='position:absolute;pointer-events:none;max-width:320px;padding:8px 10px;background:rgba(28,22,14,.97);border:1px solid #8a6a3a;border-radius:5px;box-shadow:0 4px 14px rgba(0,0,0,.5);z-index:20;display:none;color:#e8dcc0;font-family:Georgia,serif;line-height:1.4';MAP.cv.parentElement.appendChild(el);}
    if(!e||!(e.kind in BASE_P)){el.style.display='none';return;}const t=siteAnywhere(e.id);if(!t){el.style.display='none';return;}
    el.innerHTML=townCard(t);el.style.display='block';const r=MAP.cv.getBoundingClientRect();const px_=sx+16,py_=sy+16;el.style.left=Math.min(px_,r.width-310)+'px';el.style.top=Math.min(py_,r.height-el.offsetHeight-10)+'px';}
  function mapPick(sx,sy){const isc=Math.max(.9,Math.min(2.2,SIZE*baseScale()*MAP.zoom/420))*(Math.min(mapLW(),mapLH())/700);let best=null,bd=16*isc;(MAP._entries||[]).forEach(e=>{const [x,y]=mapToScreen(e.x,e.z);const d=Math.hypot(sx-x,sy-y);if(d<bd){bd=d;best=e;}});return best;}
  // S496 — notes pinned to the map (Michael's C on DECISION #132, part C): *✎ Note* arms the next click on the map, which
  // opens a box in the panel for up to 500 characters; *Pin it* keeps it in worldState.mapNotes, a character key ({x,z,
  // text,t,tod}, the world spot and the minute). A pin shows its words on hover; a click opens it, with *Take it down*.
  function pinMapNote(x,z,text){const t=String(text||'').replace(/\s+/g,' ').trim().slice(0,500);if(!t||!isFinite(x)||!isFinite(z))return -1;const L=worldState.mapNotes||(worldState.mapNotes=[]);L.push({x:Math.round(x*10)/10,z:Math.round(z*10)/10,text:t,t:Math.floor(worldState.gameTimeAbsMinutes||0),tod:Math.floor(worldState.gameTimeMinutes||0)%1440});MAP.dirty=true;return L.length-1;}
  function unpinMapNote(i){const L=worldState.mapNotes;if(!L||!L[i])return false;L.splice(i,1);if(!L.length)delete worldState.mapNotes;MAP.sel=null;MAP.hover=null;MAP.dirty=true;return true;}
  function mapPickNote(sx,sy){const isc=Math.max(.9,Math.min(2.2,SIZE*baseScale()*MAP.zoom/420))*(Math.min(mapLW(),mapLH())/700);let best=null,bd=12*isc;(MAP._notes||[]).forEach(n=>{const d=Math.hypot(sx-n.sx-4*isc,sy-n.sy+8*isc);if(d<bd){bd=d;best=n.i;}});return best;}
  function _mnEsc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function showNoteCard(i,sx,sy){showTownCard(null,0,0);const n=(worldState.mapNotes||[])[i];const el=document.getElementById('wm-hover');if(!n||!el)return;el.innerHTML=`<div style="font:italic 13px Georgia,serif;color:#f0e6cc">${_mnEsc(n.text)}</div><div style="color:#8a7a60;font-size:11px;margin-top:4px">${_mnEsc(typeof gameDateLine==='function'?gameDateLine(n.t,n.tod,'day'):'')}</div>`;el.style.display='block';const r=MAP.cv.getBoundingClientRect();el.style.left=Math.min(sx+16,r.width-310)+'px';el.style.top=Math.min(sy+16,r.height-el.offsetHeight-10)+'px';}
  function mapNoteArm(on){MAP.pinArmed=on===undefined?!MAP.pinArmed:!!on;const b=document.getElementById('wm-pin');if(b){b.style.background=MAP.pinArmed?'#3a2a16':'#0c1008';b.style.color=MAP.pinArmed?'#f0e2c0':'#c8b880';}if(MAP.cv)MAP.cv.style.cursor=MAP.pinArmed?'crosshair':'grab';
    if(MAP.pinArmed){const body=document.getElementById('wm-panel-body');if(body&&!MAP.noteAt)body.innerHTML='<div class="wm-placeholder">Click the map where the note should go.</div>';}}
  function mapNoteClick(sx,sy){
    const ni=mapPickNote(sx,sy);if(ni!=null&&!MAP.pinArmed){MAP.sel='note:'+ni;MAP.noteAt=null;mapNotePanel(ni);MAP.dirty=true;return true;}
    if(!MAP.pinArmed)return false;const [x,z]=screenToMap(sx,sy);if(x<0||z<0||x>SIZE*GRID||z>SIZE*GRID)return true;
    MAP.noteAt={x,z};MAP.sel=null;mapNoteArm(false);MAP.dirty=true;
    const body=document.getElementById('wm-panel-body');if(!body)return true;
    body.innerHTML='<div style="font:600 15px Georgia,serif;color:#e8d8a0;margin-bottom:6px">A note on the map</div><textarea id="wm-note" maxlength="500" rows="4" placeholder="What should you remember here? (Enter pins it)" style="width:100%;box-sizing:border-box;resize:vertical;padding:6px 8px;font:13px Georgia,serif;color:#e8dcc0;background:rgba(0,0,0,.35);border:1px solid rgba(200,168,74,.3);border-radius:3px"></textarea><div style="display:flex;gap:6px;margin-top:6px"><button type="button" id="wm-note-pin" style="flex:1;padding:6px;background:#3a2a16;color:#f0e2c0;border:1px solid #8a6a3a;border-radius:4px;cursor:pointer;font:13px Georgia,serif">Pin it</button><button type="button" id="wm-note-cancel" style="flex:1;padding:6px;background:#2a2020;color:#c8b8a0;border:1px solid #5a4a3a;border-radius:4px;cursor:pointer;font:13px Georgia,serif">Cancel</button></div>';
    const ta=document.getElementById('wm-note');const done=pin=>{const at=MAP.noteAt;MAP.noteAt=null;if(pin&&at){const i=pinMapNote(at.x,at.z,ta.value);if(i>=0){MAP.sel='note:'+i;mapNotePanel(i);MAP.dirty=true;return;}}mapPanel(null);MAP.dirty=true;};
    ['keydown','keyup','keypress'].forEach(t=>ta.addEventListener(t,e=>{e.stopPropagation();if(t==='keydown'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();done(true);}else if(t==='keydown'&&e.key==='Escape'){e.preventDefault();done(false);}}));
    document.getElementById('wm-note-pin').onclick=()=>done(true);document.getElementById('wm-note-cancel').onclick=()=>done(false);ta.focus({preventScroll:true});return true;}
  function mapNotePanel(i){const n=(worldState.mapNotes||[])[i];const body=document.getElementById('wm-panel-body');if(!body)return;if(!n){mapPanel(null);return;}
    body.innerHTML=`<div style="font:600 15px Georgia,serif;color:#e8d8a0">Your note</div><div style="color:#b8a880;font-size:12px;margin:4px 0 8px">${_mnEsc(typeof gameDateLine==='function'?gameDateLine(n.t,n.tod,'day'):'')} · ${Math.round(Math.hypot(n.x-px,n.z-pz))}u away</div><div style="font:italic 13px Georgia,serif;color:#f0e6cc;line-height:1.5;overflow-wrap:anywhere;margin-bottom:10px">${_mnEsc(n.text)}</div><button type="button" id="wm-note-del" style="padding:6px 12px;background:#2a2020;color:#c8b8a0;border:1px solid #5a4a3a;border-radius:4px;cursor:pointer;font:13px Georgia,serif">Take it down</button>`;
    document.getElementById('wm-note-del').onclick=()=>{unpinMapNote(i);mapPanel(null);};}
  function mapPanelCell(c){const body=document.getElementById('wm-panel-body');if(!body)return;const towns=c.sites.filter(t=>t.pad>0&&t.kind!=='portal');const known=towns.filter(t=>discovered(t.id)).length;
    body.innerHTML=`<div style="font:600 16px Georgia,serif;color:#e8d8a0">${c.name||'Open sea'}</div><div style="color:#b8a880;font-size:12px;margin:4px 0 10px">${c.type==='sea'?`Open water · ${nationOf(c.i,c.j).name}`:`${nationSubtitle(c)} · `+`${towns.length} settlements${towns.some(t=>t.kind==='city')?', a city':''}${towns.some(t=>t.kind==='port')?', ports':''} · ${c.doors.length} doors · ${known} known`}</div><div style="color:#8a7a60;font-size:11px">Scroll to zoom in.</div>`;}
  function syncMapButtons(){const tg=document.getElementById('w80-maptoggle');if(!tg)return;tg.querySelectorAll('button').forEach(x=>{x.style.background=x.dataset.m===MAP.mode?'#3a2a16':'#2a2020';x.style.color=x.dataset.m===MAP.mode?'#f0e2c0':'#c8b8a0';});}
  // ── search and filters ──
  MAP.filt={towns:true,gates:true,pois:true,quests:true};
  function mapKindClass(e){if(!e||!e.kind)return 'pois';if(e.kind in BASE_P)return 'towns';if(/door|gate/.test(e.kind))return 'gates';if(e.kind==='quest')return 'quests';return 'pois';}
  function mapAllowed(e){return MAP.filt[mapKindClass(e)]!==false;}
  function mapSearch(q){const box=document.getElementById('wm-results');if(!box)return;q=(q||'').trim().toLowerCase();if(!q){box.style.display='none';return;}
    const out=[];for(const c of CELLS.values()){c.sites.forEach(t=>{if(t.name&&t.name.toLowerCase().includes(q)&&discovered(t.id))out.push({name:t.name,sub:t.kind,x:t.x,z:t.z,id:t.id,kind:t.kind});});(c.doors||[]).forEach(d=>{const n=d.canonicalName||'';if(n.toLowerCase().includes(q)){const p=dungeonWorldPos[d.seed]||d;if(discovered('door_'+d.seed))out.push({name:n,sub:'gate',x:p.x,z:p.z,id:'door_'+d.seed,kind:'door'});}});}
    out.sort((a,b)=>a.name.localeCompare(b.name));box.innerHTML=out.slice(0,12).map((o,i)=>`<div class="wm-res" data-i="${i}" style="padding:5px 10px;cursor:pointer;border-bottom:1px solid rgba(60,80,40,.4);font:12px Georgia,serif;color:#e8dcc0">${o.name} <span style="color:#8a9a70">· ${o.sub}</span></div>`).join('')||'<div style="padding:6px 10px;color:#8a9a70;font:12px Georgia,serif">Nothing you know of by that name.</div>';box.style.display='block';
    box.querySelectorAll('.wm-res').forEach(el=>el.onclick=()=>{const o=out[+el.dataset.i];const s=baseScale()*MAP.zoom;MAP.ox=mapLW()/2-o.x*s;MAP.oy=mapLH()/2-o.z*s;mapClamp();MAP.sel=o.id;MAP.dirty=true;mapDraw();mapPanel({id:o.id,name:o.name,kind:o.kind,x:o.x,z:o.z,sub:o.sub});box.style.display='none';});}
  function wireMapSearch(){const inp=document.getElementById('wm-search');if(!inp||inp._wired)return;inp._wired=true;const pb=document.getElementById('wm-pin');if(pb)pb.onclick=()=>mapNoteArm();inp.addEventListener('input',()=>mapSearch(inp.value));['keydown','keyup','keypress'].forEach(ev=>inp.addEventListener(ev,e=>e.stopPropagation()));document.querySelectorAll('.wm-filt').forEach(cb=>cb.addEventListener('change',()=>{MAP.filt[cb.value]=cb.checked;MAP.dirty=true;mapDraw();}));}
  function mapPanel(e){
    const body=document.getElementById('wm-panel-body');if(!body)return;
    let tg=document.getElementById('w80-maptoggle');if(!tg){tg=document.createElement('div');tg.id='w80-maptoggle';tg.style.cssText='margin:0 0 10px;display:flex;gap:6px';tg.innerHTML='<button type="button" data-m="map" style="flex:1;padding:6px;background:#3a2a16;color:#f0e2c0;border:1px solid #8a6a3a;border-radius:4px;cursor:pointer;font:13px Georgia,serif">Map</button><button type="button" data-m="local" style="flex:1;padding:6px;background:#2a2020;color:#c8b8a0;border:1px solid #5a4a3a;border-radius:4px;cursor:pointer;font:13px Georgia,serif">Local</button>';const hdr=document.getElementById('wm-panel-header');if(hdr)hdr.insertAdjacentElement('afterend',tg);tg.querySelectorAll('button').forEach(b=>b.onclick=()=>{MAP.mode=b.dataset.m;syncMapButtons();MAP.dirty=true;});}
    if(!e){body.innerHTML='<div class="wm-placeholder">Scroll to zoom, drag to pan.<br><br>Hover a place to learn more; click a discovered place to travel there.<br><br>Places appear as you find them.</div>';return;}
    const k=discovered(e.id);
    const tsite=(e.kind in BASE_P)?siteAnywhere(e.id):null;
    body.innerHTML=`<div style="font:600 16px Georgia,serif;color:#e8d8a0">${e.name}</div><div style="color:#b8a880;font-size:12px;margin:4px 0 10px">${e.sub}${tsite?' · '+stateLine(tsite):''}</div>`+(k?`<button type="button" id="w80-travel" style="padding:8px 12px;background:#3a2a16;color:#f0e2c0;border:1px solid #8a6a3a;border-radius:4px;cursor:pointer;font:14px Georgia,serif">Travel to ${e.name}</button><div style="color:#8a7a60;font-size:11px;margin-top:6px">${Math.round(Math.hypot(e.x-px,e.z-pz))}u away</div>`:'<div style="color:#8a7a60;font-size:12px">Not yet discovered.</div>');
    const b=document.getElementById('w80-travel');if(b)b.onclick=()=>fastTravel(e.id);
  }
  function openMap(){
    const pane=document.getElementById('wm-map-pane');if(!pane)return;
    const wrap=document.getElementById('wm-svg-wrap');if(wrap)wrap.style.display='none';
    const zc=document.getElementById('wm-zoom-controls');if(zc)zc.style.display='none';
    let root=document.getElementById('w80-map');
    if(!root){
      root=document.createElement('canvas');root.id='w80-map';root.style.cssText='position:absolute;inset:0;width:100%;height:100%;cursor:grab;display:block;';pane.appendChild(root);
      root.addEventListener('mousedown',ev=>{MAP.drag={x:ev.clientX,y:ev.clientY,ox:MAP.ox,oy:MAP.oy,moved:false};});
      window.addEventListener('mousemove',ev=>{
        if(MAP.drag){MAP.ox=MAP.drag.ox+(ev.clientX-MAP.drag.x);MAP.oy=MAP.drag.oy+(ev.clientY-MAP.drag.y);if(Math.hypot(ev.clientX-MAP.drag.x,ev.clientY-MAP.drag.y)>3)MAP.drag.moved=true;mapClamp();MAP.dirty=true;return;}
        if(!MAP.cv||MAP.mode!=='map')return;const r=root.getBoundingClientRect();const nh=mapPickNote(ev.clientX-r.left,ev.clientY-r.top);if(nh!=null){if(MAP.hover!=='note:'+nh){MAP.hover='note:'+nh;MAP.dirty=true;}showNoteCard(nh,ev.clientX-r.left,ev.clientY-r.top);return;}const e=mapPick(ev.clientX-r.left,ev.clientY-r.top);const id=e?e.id:null;
        if(id!==MAP.hover){MAP.hover=id;MAP.dirty=true;if(!MAP.sel)mapPanel(e);}
        showTownCard(e,ev.clientX-r.left,ev.clientY-r.top);
        if(!e&&!MAP.sel){const [wx,wz]=screenToMap(ev.clientX-r.left,ev.clientY-r.top);const [i,j]=cellOf(wx,wz);const hc=(i>=0&&j>=0&&i<GRID&&j<GRID)?[i,j]:null;if(JSON.stringify(hc)!==JSON.stringify(MAP.hoverCell)){MAP.hoverCell=hc;if(hc)mapPanelCell(getCell(i,j));else mapPanel(null);}}
      });
      root.addEventListener('mouseleave',()=>showTownCard(null,0,0));
      window.addEventListener('mouseup',ev=>{if(!MAP.drag)return;const moved=MAP.drag.moved;MAP.drag=null;if(moved||MAP.mode!=='map')return;const r=root.getBoundingClientRect();if(mapNoteClick(ev.clientX-r.left,ev.clientY-r.top))return;const e=mapPick(ev.clientX-r.left,ev.clientY-r.top);MAP.sel=e?e.id:null;mapPanel(e);MAP.dirty=true;});
      (function(){const kb=document.getElementById('wm-key'),bx=document.getElementById('wm-keybox');if(kb&&bx){kb.onclick=()=>{bx.style.display=bx.style.display==='none'?'block':'none';};
        if(!document.getElementById('wm-key-bld')){const seen=new Set(),rows=[];for(const k of ['home','castle','guild_f','guild_m','church','inn','weapon','potion','misc','shipwright','barber','barracks','other']){const B=BLD[k];if(seen.has(B.label))continue;seen.add(B.label);rows.push(`<span style="white-space:nowrap;margin-right:8px"><span style="display:inline-block;width:10px;height:10px;background:${B.col};border:1px solid ${B.line};vertical-align:-1px;margin-right:3px"></span>${B.label}</span>`);}
          const d=document.createElement('div');d.id='wm-key-bld';d.style.cssText='margin-top:6px';d.innerHTML=`<div style="color:#e8d8a0;margin-bottom:2px">In town <span style="color:#8a9a70;font-size:11px">(Local view \u00b7 minimap)</span></div><div>${rows.join(' ')}</div><div style="margin-top:2px"><span style="color:${BLD.castle.col}">\u25cf</span> the lord &nbsp; <span style="color:#f6d860">\u25ce</span> where you were directed &nbsp; <span style="color:#f6e27a">\u25a1</span> your house</div>`;
          const tip=bx.lastElementChild;bx.insertBefore(d,tip);}
        if(!document.getElementById('wm-key-bio')){const seen=new Set(),rows=[];
          for(const k of ['plains','forest','autumn','moor','fen','swamp','dunes','tundra','wasteland','coast']){const B=MAPBIO[k];if(!B||seen.has(B.label))continue;seen.add(B.label);
            rows.push(`<span style="white-space:nowrap;margin-right:8px"><span style="display:inline-block;width:10px;height:10px;background:#${B.col.toString(16).padStart(6,'0')};border:1px solid rgba(0,0,0,.4);vertical-align:-1px;margin-right:3px"></span>${B.label}</span>`);}
          const d2=document.createElement('div');d2.id='wm-key-bio';d2.style.cssText='margin-top:6px';
          d2.innerHTML=`<div style="color:#e8d8a0;margin-bottom:2px">The land</div><div>${rows.join(' ')}</div><div style="margin-top:2px;color:#8a9a70;font-size:11px">Colour is the country; shading is the height. Peaks go to rock and snow whatever grows there.</div>`;
          const tip2=bx.lastElementChild;bx.insertBefore(d2,tip2);}}})(); // v80 S131 — the key; S138 — the town colours; S144 — the land
      root.addEventListener('wheel',ev=>{ev.preventDefault();if(MAP.mode!=='map')return;const r=root.getBoundingClientRect();const mx=ev.clientX-r.left,my=ev.clientY-r.top;const [wx,wz]=screenToMap(mx,my);MAP.zoom=Math.max(1,Math.min(64,MAP.zoom*(ev.deltaY<0?1.18:1/1.18)));const s=baseScale()*MAP.zoom;MAP.ox=mx-wx*s;MAP.oy=my-wz*s;mapClamp();MAP.dirty=true;},{passive:false});
    }
    root.style.display='block';
    const r=pane.getBoundingClientRect();const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));MAP.lw=Math.max(300,r.width|0);MAP.lh=Math.max(300,r.height|0);MAP.dpr=dpr;root.width=Math.round(MAP.lw*dpr);root.height=Math.round(MAP.lh*dpr);
    MAP.cv=root;MAP.ctx=root.getContext('2d');MAP.W=Math.min(MAP.lw,MAP.lh);MAP.H=MAP.lh;MAP.mode='map';
    // open at province scale, centred on the player
    MAP.zoom=Math.max(1,Math.min(64,(Math.min(MAP.lw,MAP.lh)*.55)/(SIZE*baseScale())));wireMapSearch();
    const s=baseScale()*MAP.zoom;MAP.ox=MAP.lw/2-px*s;MAP.oy=MAP.lh/2-pz*s;mapClamp();
    MAP.sel=null;MAP.noteAt=null;mapNoteArm(false);mapPanel(null);syncMapButtons();MAP.dirty=true;mapDraw();
    if(!MAP._raf){const loop=()=>{if(MAP.cv&&MAP.cv.style.display!=='none'){mapJobs();if(MAP.dirty)mapDraw();MAP._raf=requestAnimationFrame(loop);}else MAP._raf=null;};MAP._raf=requestAnimationFrame(loop);}
  }
  function closeMap(){
    const root=document.getElementById('w80-map');if(root)root.style.display='none';
    const wrap=document.getElementById('wm-svg-wrap');if(wrap)wrap.style.display='';
    const zc=document.getElementById('wm-zoom-controls');if(zc)zc.style.display='';
  }

  // ═══ INTERIORS (Session 6) ═══════════════════════════════════════════
  // Rooms for generated buildings. Sized from the building's footprint,
  // walls and floors by region, furnished by trade, a gallery floor when
  // the exterior is two-storey. Follows the engine's interior contract:
  // sets interiorScene, fog, intNPCMesh/intNPCPos (+amble), intBedPos.
  // Door is the south wall centre (walk south to exit), player spawns at
  // (W/2, D-2.2) — same as the engine.
  const INT_TEX={};
  function intTex(kind,reg){
    const key=kind+'|'+reg;if(INT_TEX[key])return INT_TEX[key];
    const t=mkTex((ctx,w,h)=>{
      const P=(a,b)=>a+Math.random()*(b-a)|0;
      if(kind==='plaster'){ // lime / cream plaster, faint trowel marks
        const base=reg==='irish'?[232,226,212]:reg==='french'?[222,210,178]:[208,200,186];
        ctx.fillStyle=`rgb(${base})`;ctx.fillRect(0,0,w,h);
        for(let i=0;i<900;i++){const l=P(-12,12);ctx.fillStyle=`rgba(${base[0]+l},${base[1]+l},${base[2]+l},.5)`;ctx.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*6,1+Math.random()*2);}
      } else if(kind==='rubble'){ // grey rubble stone
        ctx.fillStyle='#4a4640';ctx.fillRect(0,0,w,h);
        for(let i=0;i<260;i++){const l=P(96,128);ctx.fillStyle=`rgb(${l},${l-4},${l-10})`;const rw=10+Math.random()*22,rh=7+Math.random()*12;ctx.fillRect(Math.random()*w,Math.random()*h,rw,rh);ctx.strokeStyle='rgba(30,26,22,.6)';ctx.lineWidth=1;ctx.strokeRect(Math.random()*w,Math.random()*h,rw,rh);}
      } else if(kind==='ashlar'){ // dressed stone courses
        ctx.fillStyle='#6a665e';ctx.fillRect(0,0,w,h);
        const ch=20;for(let y=0;y<h;y+=ch){const off=((y/ch)|0)%2?22:0;for(let x=-22;x<w;x+=44){const l=P(150,178);ctx.fillStyle=`rgb(${l},${l-3},${l-10})`;ctx.fillRect(x+off+1,y+1,42,ch-2);}}
      } else if(kind==='plank'){
        ctx.fillStyle='#5a3a1c';ctx.fillRect(0,0,w,h);
        for(let y=0;y<h;y+=16){const l=P(86,120);ctx.fillStyle=`rgb(${l},${(l*.62)|0},${(l*.32)|0})`;ctx.fillRect(0,y+1,w,14);for(let k=0;k<12;k++){ctx.fillStyle=`rgba(40,22,8,.35)`;ctx.fillRect(Math.random()*w,y+2+Math.random()*12,20+Math.random()*40,1);}}
      } else if(kind==='flag'){ // flagstones
        ctx.fillStyle='#3e3a34';ctx.fillRect(0,0,w,h);
        for(let y=0;y<h;y+=32)for(let x=0;x<w;x+=32){const l=P(108,136);ctx.fillStyle=`rgb(${l},${l-4},${l-10})`;ctx.fillRect(x+2+(y/32%2?8:0),y+2,28,28);}
      }
    },256,256);
    INT_TEX[key]=t;return t;
  }
  function tiled(kind,reg,rx,ry){const t=intTex(kind,reg).clone();t.needsUpdate=true;t.repeat.set(rx,ry);return new THREE.MeshLambertMaterial({map:t});}
  // S286 — the room's baked furniture (S289: every bake in it, the counter too): freed when the next room is built, the
  // flames flickered by tickInterior
  let FURN_LIVE=[];
  function furnSwap(room){FURN_LIVE.push(room);}
  function furnFree(){for(const r of FURN_LIVE)r.traverse(o=>{if(o.isMesh)o.geometry.dispose();});FURN_LIVE=[];}
  // S356 — the kit shell's ceiling and four shaded walls, for the generated rooms (S342) and the legacy builder's (S356)
  function shellWalls(sc_,W,D,H,wallKind,reg){
  const ce=new THREE.Mesh(new THREE.PlaneGeometry(W,D),tiled('plank',reg,W/2.2,D/2.2));ce.material.color.setHex(0x8a7a68);ce.rotation.x=Math.PI/2;ce.position.set(W/2,H,D/2);sc_.add(ce);
  [[W/2,0,0,W],[W/2,D,Math.PI,W],[0,D/2,Math.PI/2,D],[W,D/2,-Math.PI/2,D]].forEach(([x,z,ry,len])=>{
    const geo=new THREE.PlaneGeometry(len,H,Math.max(4,Math.round(len/.5)),Math.min(60,Math.max(10,Math.round(H/.2))));
    /* S355 — a wall over 12 high (the tower's 31) takes 60 rows packed towards the foot and the head, where the shading changes */
    if(H>12){const P_=geo.attributes.position,U_=geo.attributes.uv;for(let i=0;i<P_.count;i++){const t=P_.getY(i)/H+.5,t2=.5-.5*Math.cos(Math.PI*t);P_.setY(i,(t2-.5)*H);U_.setY(i,t2);}}
    {const P_=geo.attributes.position,col=new Float32Array(P_.count*3);for(let i=0;i<P_.count;i++){const u=P_.getX(i)+len/2,y=P_.getY(i)+H/2,e=Math.min(u,len-u);
      col[i*3]=col[i*3+1]=col[i*3+2]=Math.max(.45,1-.38*Math.exp(-y/.3)-.3*Math.exp(-(H-y)/.35)-.32*Math.exp(-e/.4));}geo.setAttribute('color',new THREE.BufferAttribute(col,3));}
    const wm=new THREE.Mesh(geo,tiled(wallKind,reg,len/2.6,H/2.6));wm.material.vertexColors=true;wm.userData.shaded=true;wm.position.set(x,H/2,z);wm.rotation.y=ry;sc_.add(wm);
  });
  }
  // the frame, built last so a post gives way to whatever stands against the wall (o.block: a legacy room's furniture test)
function shellFrame(sc_,o){const {W,D,H,type,st,wallKind,FN,FSEED,beams,wins,TALLZ,SOL,FOOTHOLDS}=o;const K=furnKit(),P=K.Parts(),Wd=K.WOOD[FN]||K.WOOD.gatelands,T=Wd.dark,S=0x6e675e,stone=wallKind!=='plaster',close=st==='french';
    let sd=FSEED*7+3;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};const jit=(c,a)=>new THREE.Color(c).offsetHSL(0,0,(r()-.5)*(a||.06));
    const rb=(w,h,d,q)=>SK.rbox(w,h,d,q==null?Math.min(.02,w/3,h/3,d/3):q,1);
    const bh=.22,bw=.2,jh=.09,yB=H-jh-bh/2;
    for(const z of beams)P(rb(W,bh,bw,.03),jit(T,.05),W/2,yB,z);
    for(let x=.3;x<W-.1;x+=.5)P(rb(.09,jh,D,.015),jit(T,.07),x,H-jh/2,D/2);
    // plates and plinth along each wall, the south one broken for the entrance
    [[W/2,0,W,0],[0,D/2,D,1],[W,D/2,D,1],[W/2,D,W,0]].forEach(([cx,cz,L,side])=>{const inset=side?(cx<1?.05:-.05):(cz<1?.05:-.05);
      const gap=type==='church'||type==='castle'?1.1:.9,segs=cz===D?[[0,W/2-gap],[W/2+gap,W]]:[[0,L]];
      for(const [a,b] of segs){const mid=(a+b)/2;
        if(stone){for(let s2=a;s2<b-.05;s2+=.55){const l=Math.min(.55,b-s2)-.02,c=s2+l/2;side?P(rb(.16,.26,l,.03),jit(S,.08),cx+inset*1.6,.13,c):P(rb(l,.26,.16,.03),jit(S,.08),c,.13,cz+inset*1.6);}}
        else side?P(rb(.1,.16,b-a,.015),jit(T),cx+inset,.08,mid):P(rb(b-a,.16,.1,.015),jit(T),mid,.08,cz+inset);}
      side?P(rb(.14,.16,L,.02),jit(T),cx+inset*1.2,H-jh-.08,cz):P(rb(L,.16,.14,.02),jit(T),cx,H-jh-.08,cz+inset*1.2);});
    const nearWin=(z,d)=>wins.some(wz=>Math.abs(wz-z)<d)||TALLZ.some(wz=>Math.abs(wz-z)<d);
    const hits=(x0,x1,z0,z1)=>SOL.some(q=>q.x0<x1&&q.x1>x0&&q.z0<z1&&q.z1>z0)||FOOTHOLDS.some(q=>q.x0!=null&&(q.x1-q.x0)*(q.z1-q.z0)<12&&q.x0<x1&&q.x1>x0&&q.z0<z1&&q.z1>z0)||!!(o.block&&o.block(x0,x1,z0,z1));
    const posts=[];const post=(x,z)=>{if(hits(x-.1,x+.1,z-.1,z+.1))return false;posts.push([x,z]);P(rb(.18,H-jh-.16,.18,.03),jit(T,.05),x,(H-jh-.16)/2,z);return true;};
    if(!stone){for(const [x,z] of [[.09,.09],[W-.09,.09],[.09,D-.09],[W-.09,D-.09]])post(x,z);
      for(const z of beams)for(const sx of [0,1]){const x=sx?W-.09:.09,dir=sx?-1:1;
        if(!nearWin(z,1.2)&&post(x,z)){const L=.75;for(const dz of [-1,1])P(rb(.1,L,.1,.02),jit(T),x+dir*.02,yB-bh/2-L*.35,z+dz*L*.35,dz*.78,0,0);P(rb(.1,.5,.1,.02),jit(T),x+dir*.24,yB-bh/2-.18,z,0,0,-dir*.8);}
        else P(rb(.22,.3,.24,.03),jit(T),x+dir*.03,yB-bh/2-.15,z);}
      const step=close?1.6:2.4;for(let x=step;x<W-.8;x+=step){if(Math.abs(x-W/2)>1.1)post(x,D-.09);post(x,.09);}
      if(close)for(let z=1.6;z<D-.8;z+=1.6)if(!nearWin(z,1.2)&&!beams.some(b=>Math.abs(b-z)<.5)){post(.09,z);post(W-.09,z);}}
    else for(const z of beams)if(!nearWin(z,.8))for(const sx of [0,1]){const x=sx?W:0,dir=sx?-1:1;
      for(let k=0;k<3;k++)P(rb(.16+k*.12,.12,.3,.025),jit(S,.06),x+dir*(.08+k*.06),yB-bh/2-.3+k*.12,z);}
    for(const [x,z] of posts)SOL.push({x0:x-.09,x1:x+.09,z0:z-.09,z1:z+.09,y0:-.5,y1:H,post:true});
    const G=K.bake(P);G.userData.shell={posts:posts.length,stone,at:posts};sc_.add(G);
    // the entrance: plank door with ledges, a brace, strap hinges with nail heads and a ring (local: the wall at z=0, the room +z)
    const big=type==='church'||type==='castle',Q=K.Parts(),w=big?1.5:1.0,h=big?2.3:1.5,I=0x2a2624,SS_=0x9a9284,nbd=big?7:5;
    for(let k=0;k<nbd;k++)Q(rb(w/nbd-.008,h,.05,.01),jit(Wd.wood,.08),-w/2+w/nbd*(k+.5),h/2,.03);
    for(const y of [.25,h-.25])Q(rb(w-.1,.09,.035,.01),jit(Wd.dark),0,y,.07);
    Q(rb(.08,Math.hypot(w-.16,h-.6),.03,.01),jit(Wd.dark),0,h/2,.07,0,0,Math.atan2(w-.16,h-.6));
    for(const y of [.25,h-.25]){Q(rb(w*.7,.045,.012,.005),I,-w*.15,y,.095);for(let k=0;k<4;k++)Q(SK.ball(.012,5,4),I,-w/2+.06+k*w*.19,y,.1);}
    Q(SK.torus(.05,.008,4,12),I,w*.32,h*.52,.1);Q(SK.ball(.02,6,5),I,w*.32,h*.52+.05,.09);
    if(stone){for(const sx of [-1,1])for(let k=0,y=0;k<4;k++){const bh2=h/4,bw2=k%2?.16:.24;Q(rb(bw2,bh2-.012,.2),jit(SS_,.07),sx*(w/2+bw2/2),y+bh2/2,.08);y+=bh2;}Q(rb(w+.6,.22,.22),jit(SS_,.05),0,h+.11,.09);}
    else{for(const sx of [-1,1])Q(rb(.12,h+.1,.14),jit(Wd.dark),sx*(w/2+.06),(h+.1)/2,.06);Q(rb(w+.5,.16,.16),jit(Wd.dark),0,h+.13,.07);}
    const Dr=K.bake(Q);Dr.position.set(W/2,0,D);Dr.rotation.y=Math.PI;Dr.userData.entrance=true;sc_.add(Dr);return {G,Dr,posts};}
  function buildInteriorFor(house){
    const reg=house.reg||'irish',type=house.type||'misc',st=house.style||'irish';
    INT_BED_NATION=nationAt(house.doorX,house.doorZ); // S288 — the beds' wood
    furnFree();
    const two=!!house.two;
    // room from footprint (interiors run larger than exteriors, as games do)
    let W=Math.max(8,Math.round((house.w||6)*1.8)),D=Math.max(8,Math.round((house.d||5)*2.0));
    // Eye height is 0.92u, so rooms and furniture are scaled to that: cottage
    // ceilings ~2.1u, counters ~0.6u. F scales every furniture height below.
    let ceil=st==='stone'?2.6:st==='french'?2.4:st==='anglo'?2.0:2.1;
    if(type==='church'){W=Math.max(10,Math.round((house.w||8)*1.5));D=Math.max(16,Math.round((house.d||9)*2.4));ceil=5.0;}
    if(type==='castle'){W=Math.max(18,Math.round((house.w||14)*1.5));D=Math.max(22,Math.round((house.d||11)*2.2));ceil=5.6;}
    const F=.62;
    if(type==='inn'){W=Math.max(W,12);D=Math.max(D,11);}
    if(type==='guild_f'||type==='guild_m'){W=Math.max(22,W);D=Math.max(20,D);}
    if(type==='cabin'){W=8;D=9;ceil=2.0;}
    if(type==='cellar'){W=Math.max(8,Math.round((house.w||6)*1.4));D=Math.max(8,Math.round((house.d||5)*1.6));ceil=2.0;}
    if(type==='chapel'){W=9;D=12;ceil=3.4;}
    if(type==='tower'){W=9;D=9;ceil=31;}
    const gallery=two&&type!=='church'&&type!=='castle';
    const H=gallery?ceil*1.85:ceil;
    house.intW=W;house.intD=D;
    const sc_=new THREE.Scene();interiorScene=sc_;
    sc_.background=new THREE.Color(0x120a06);
    sc_.fog=new THREE.Fog(0x120a06,Math.max(W,D)*.8,Math.max(W,D)*2.4);
    intNPCMesh=null;intBedPos=null;intStashPos=null;
    // Furniture helpers scale y and height by F. Shell pieces (walls, beams,
    // deck, pillars) use raw units via boxRaw.
    const boxRaw=(x,y,z,w,h,d,col,ry)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:col}));m.position.set(x,y,z);if(ry)m.rotation.y=ry;sc_.add(m);return m;};
    const box=(x,y,z,w,h,d,col,ry)=>boxRaw(x,y*F,z,w,h*F,d,col,ry);
    const cyl=(x,y,z,r0,r1,h,col,seg)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h*F,seg||8),new THREE.MeshLambertMaterial({color:col}));m.position.set(x,y*F,z);sc_.add(m);return m;};
    const glow=(x,y,z,col)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.06,5,5),new THREE.MeshBasicMaterial({color:col}));m.position.set(x,y*F,z);sc_.add(m);return m;};
    const light=(x,y,z,col,i,dist)=>{const l=new THREE.PointLight(col,i,dist);l.position.set(x,y*F,z);sc_.add(l);return l;};
    // interior solids the player can't walk through (AABBs, room coords)
    const SOL=[];
    // solid(x,z,hw,hd,top): a block you can step or jump onto (foothold at `top`).
    const solid=(x,z,hw,hd,top)=>{const t=(top==null?.62:top)*F;SOL.push({x0:x-hw,x1:x+hw,z0:z-hd,z1:z+hd,y0:-.5,y1:t});FOOTHOLDS.push({x0:x-hw,x1:x+hw,z0:z-hd,z1:z+hd,y:t});};
    INT_SOL=SOL;FOOTHOLDS=[];INT_BEDS=[];INT_DOORS=[];INT_DOORS.house=house.id;INT_CHAIR=null;intBedPos=null;INT_NPCS=[];HATCH.active=false;HATCH.roof=false;INT_LOOT=null;INT_BOX=null;
    const bedOwner=type==='inn'?'inn':type==='home'?'home':(type==='guild_f'||type==='guild_m')?'guild':'free';
    // S289 — the room's nation (the furniture's wood) and a seed from the house id; S293: declared before the gallery uses it
    const FN=nationAt(house.doorX,house.doorZ),FSEED=String(house.id||'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,13)%100000;
    // Partition wall from (x0,z0) to (x1,z1) on a floor at base `by`, height `hh`,
    // with an optional doorway (gap 1.4) at parameter t (0..1). Full-height solid.
    const wallMat=()=>tiled(st==='anglo'?'rubble':(st==='stone'||st==='garrison')?'ashlar':'plaster',reg,2,1);
    const partition=(x0,z0,x1,z1,by,hh,doorT)=>{
      const dx=x1-x0,dz=z1-z0,L=Math.hypot(dx,dz),ang=Math.atan2(dx,dz);
      const seg=(a,b)=>{if(b-a<.05)return;const len=(b-a)*L;const mx=x0+dx*(a+b)/2,mz=z0+dz*(a+b)/2;const m=new THREE.Mesh(new THREE.BoxGeometry(.22,hh,len),wallMat());m.position.set(mx,by+hh/2,mz);m.rotation.y=ang;sc_.add(m);
        const hw=Math.abs(Math.sin(ang))*len/2+.11,hd=Math.abs(Math.cos(ang))*len/2+.11;SOL.push({x0:mx-hw,x1:mx+hw,z0:mz-hd,z1:mz+hd,y0:by-.3,y1:by+hh});};
      if(doorT==null){seg(0,1);}else{const g=.75/L;seg(0,Math.max(0,doorT-g));seg(Math.min(1,doorT+g),1);
        const lx=x0+dx*doorT,lz=z0+dz*doorT;const lint=new THREE.Mesh(new THREE.BoxGeometry(.24,.14,1.6),new THREE.MeshLambertMaterial({color:beamC0}));lint.position.set(lx,by+1.55,lz);lint.rotation.y=ang;sc_.add(lint);
        intDoorAt(sc_,SOL,lx,lz,by,ang,beamC0);} // v80 S143 — a door hangs in the gap
    };
    const beamC0=st==='french'||st==='anglo'?0x2c1e12:0x4a3420;const bedAt=(x,z,y,room)=>INT_BEDS.push({x,z,y:y||0,owner:bedOwner,room:room==null?null:room}); // v80 S141 — a bed belongs to a room
    // shell
    const wallKind=st==='anglo'?'rubble':(st==='stone'||st==='garrison'||type==='church'||type==='castle')?'ashlar':'plaster';
    const floorKind=(st==='stone'||st==='garrison'||type==='church'||type==='castle')?'flag':'plank';
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(W,D),tiled(floorKind,reg,W/2.2,D/2.2));fl.rotation.x=-Math.PI/2;fl.position.set(W/2,0,D/2);sc_.add(fl);
    // S342 (Michael's A on #62) — the generated rooms' shell on the kit: a boarded ceiling over joists, the walls shaded at the foot,
    // the head and the corners, and (built after the furniture, below) the frame; the tower keeps today's (S344: churches and keep
    // halls now take it too, as stone rooms, with a larger door and the corbels clear of their tall windows)
    // S355 — the tower too, as a stone room without beams: its top floor stands at 30 under a ceiling at 31, and a beam there
    // would hang at a person's neck; the joists, the plates, the plinth, the shaded walls and the plank door as elsewhere
    const kitShell=true,tower=type==='tower',TALLZ=[];
    shellWalls(sc_,W,D,H,wallKind,reg);
    const beamC=st==='french'||st==='anglo'?0x2c1e12:0x4a3420;
    // timber studs (french) and beams
    if(st==='french'&&!kitShell){for(let x=1.4;x<W-1;x+=1.6){boxRaw(x,H/2,.06,.14,H,.12,beamC);boxRaw(x,H/2,D-.06,.14,H,.12,beamC);}for(let z=1.4;z<D-1;z+=1.6){boxRaw(.06,H/2,z,.12,H,.14,beamC);boxRaw(W-.06,H/2,z,.12,H,.14,beamC);}}
    const nb=Math.max(2,Math.round(D/3));if(!kitShell)for(let i=1;i<=nb;i++)boxRaw(W/2,H-.1,D*i/(nb+1),W,.16,.22,beamC);
    // windows: lit panes on both long walls
    // S331 (Michael's 2 on #53) — each pane set back on the wall behind a kit frame chosen by the room (winKind); one bake a room
    const winY=Math.min(H-.6,1.35);const WK=furnKit(),WP=WK.Parts(),wKind=WK.winKind(type,false);let wi=0;
    for(let z=D*.3;z<D*.9;z+=Math.max(3,D*.3)){[.03,W-.03].forEach(x=>{const west=x<1;const p=new THREE.Mesh(new THREE.PlaneGeometry(.9,.95),windowMat(type,house));p.position.set(west?.006:W-.006,winY,z);p.rotation.y=west?Math.PI/2:-Math.PI/2;sc_.add(p);
      WP.put(WK.windowFrame(wKind,.9,.95,FN,FSEED+wi++),west?0:W,z,west?Math.PI/2:-Math.PI/2,winY);light(west?.6:W-.6,winY,z,0xc8d0e0,.35,5);});}
    {const G=WK.bake(WP);G.userData.windows=wKind;sc_.add(G);}
    // the tall windows of a church or a keep's hall: a round-headed pane of lit glass in a stone frame (C), one bake for the lot
    const tallWins=(zs,y,w,h,col)=>{const T=WK.Parts();TALLZ.push(...zs);zs.forEach((z,k)=>[0,W].forEach(x=>{const west=x<1,R=w/2,sh=new THREE.Shape();sh.moveTo(-R,-h/2);sh.lineTo(R,-h/2);sh.lineTo(R,h/2-R);sh.absarc(0,h/2-R,R,0,Math.PI,false);sh.lineTo(-R,-h/2);
      const g=new THREE.Mesh(new THREE.ShapeGeometry(sh,12),new THREE.MeshBasicMaterial({color:col}));g.position.set(west?.006:W-.006,y,z);g.rotation.y=west?Math.PI/2:-Math.PI/2;sc_.add(g);
      T.put(WK.windowFrame('C',w,h,FN,FSEED+50+k*2+(west?0:1)),x,z,west?Math.PI/2:-Math.PI/2,y);}));const G=WK.bake(T);G.userData.windows='C';sc_.add(G);};
    sc_.add(new THREE.AmbientLight(0xffb070,type==='church'?.32:type==='castle'?.3:.45));
    const lan=new THREE.PointLight(0xffaa44,2.2,Math.max(W,D)*1.3);lan.position.set(W/2,H-.4,D/2);sc_.add(lan);const lc=new THREE.Mesh(new THREE.SphereGeometry(.06,5,5),new THREE.MeshBasicMaterial({color:0xffdd88}));lc.position.copy(lan.position);sc_.add(lc);
    // door on the south wall + the engine's exit disc
    if(!kitShell)boxRaw(W/2,.7,D-.05,.9,1.4,.08,0x4a2e14);
    const eDisc=new THREE.Mesh(new THREE.CircleGeometry(.5,10),new THREE.MeshBasicMaterial({color:0xc8a84a,transparent:true,opacity:.18,side:THREE.DoubleSide}));eDisc.rotation.x=-Math.PI/2;eDisc.position.set(W/2,.02,D-1.0);sc_.add(eDisc);
    // gallery: mezzanine along the north half, railing, stair on the west wall
    if(gallery){
      // Mezzanine over the north half at gy, reached by a straight stair
      // against the west wall (run = gy/0.62 for a ~32° climb). Both are
      // FOOTHOLDS, so the player actually walks up; the railing is solid
      // except at the stair head.
      const guild=type==='guild_f'||type==='guild_m';const gy=ceil-.1,gd=Math.min(D*.45,guild?6:6),run=gy/.62,zs=gd+.6;
      // stair side varies by house: west or east wall
      const east=guild?false:galleryEast(house); /* S424 — one rule with the innkeeper's directions */const sx0=east?W-1.6:.1,sx1=east?W-.1:1.6,sxc=east?W-.85:.85;
      const deck=new THREE.Mesh(new THREE.BoxGeometry(W,.16,gd),tiled('plank',reg,W/2.2,gd/2.2));deck.position.set(W/2,gy-.08,gd/2);sc_.add(deck);
      FOOTHOLDS.push({x0:0,x1:W,z0:0,z1:gd,y:gy});
      // landing between the deck edge and the top tread — no seam to fall through
      boxRaw(sxc,gy-.08,(gd+zs)/2,1.5,.16,zs-gd+.1,0x5a3a1c);FOOTHOLDS.push({x0:sx0,x1:sx1,z0:gd-.2,z1:zs+.1,y:gy});
      // stair: treads
      const steps=Math.max(6,Math.round(run/.32));
      for(let i=0;i<steps;i++){const t=(i+.5)/steps;const z=zs+run*t;boxRaw(sxc,gy*(1-t)-.05,z,1.3,.1,run/steps+.02,0x5a3a1c);boxRaw(sxc,gy*(1-t)-.18,z+run/steps/2,1.3,.26,.06,0x4a2e14);}
      FOOTHOLDS.push({x0:sx0,x1:sx1,z0:zs,z1:zs+run+.25,axis:'z',y0:gy,y1:-.1});
      // railing along the deck edge, open above the stair
      for(let x=.4;x<W;x+=.8){if(x>=sx0-.2&&x<=sx1+.2)continue;boxRaw(x,gy+.3,gd+.04,.06,.6,.06,beamC);}
      const rx0=east?0:1.7,rx1=east?W-1.7:W;boxRaw((rx0+rx1)/2,gy+.6,gd+.04,rx1-rx0,.06,.06,beamC);
      SOL.push({x0:rx0,x1:rx1,z0:gd-.08,z1:gd+.16,y0:gy-.3,y1:gy+.8}); // railing: on the deck only, and a jump clears it
      boxRaw(east?W-1.6:1.6,gy*.5+.5,zs+run/2,.06,.06,run,beamC).rotation.x=Math.atan2(gy,run);
      // upstairs rooms: a corridor along the deck edge (1.8 deep), rooms behind
      // it, each with a doorway from the corridor.
      const nRooms=Math.max(1,Math.floor(W/4.5));const corr=1.9,roomBack=gd-corr;
      if(roomBack>2.2){
        for(let k=0;k<nRooms;k++){const xa=k*W/nRooms,xb=(k+1)*W/nRooms;partition(xa,roomBack,xb,roomBack,gy,ceil-.3,.5);if(k>0)partition(xa,0,xa,roomBack,gy,ceil-.3,null);}
      }

      // furniture up top: beds, a chest
      const up=o=>{o.position.y+=gy;};
      const lift=n=>sc_.children.slice(-n).forEach(up);
      {const nR=Math.max(1,Math.floor(W/4.5));const many=type==='inn'||type==='guild_f'||type==='guild_m';for(let k=0;k<(many?nR:1);k++){const bx=(k+.5)*W/nR+(k%2?.6:-.6);const k0=sc_.children.length;_intBed(sc_,bx,1.1,'N');sc_.children.slice(k0).forEach(up);bedAt(bx,1.1,gy,type==='inn'?k:null);if(many&&W/nR>4.2){const k1=sc_.children.length;_intBed(sc_,bx+(k%2?-1.6:1.6),1.1,'N');sc_.children.slice(k1).forEach(up);bedAt(bx+(k%2?-1.6:1.6),1.1,gy,type==='inn'?k:null);}}}
      {const K=furnKit(),c=K.bake(K.chest(FN,FSEED+3));c.position.set(W/2,gy,.6);c.userData.furn=true;sc_.add(c);furnSwap(c);} // S293 — the gallery's chest on the kit
      const gl=new THREE.PointLight(0xffaa44,.9,gd*1.5);gl.position.set(W/2,gy+1.2,gd/2);sc_.add(gl);
    }
    // ── trade furnishing ────────────────────────────────────────────────
    let npc={x:W/2,z:2.2,maxZ:Math.min(D*.55,4.5),paused:false}; /* S387 — behind the counter (z 2.6–3.4), not on its edge */
    // S289 — every shop's counter is the kit's panelled counter, bare (the bar without its tankards), its own small bake
    const counter=()=>{const K=furnKit(),c=K.bake(K.counter(W*.5,FN,FSEED+5,true));c.position.set(W/2,0,3.0);c.userData.furn=true;sc_.add(c);furnSwap(c);solid(W/2,3.0,W*.25+.1,.4,1.05);};
    // A finished table: thick plank top with a lip, aprons, turned legs, and benches if asked.
    const table=(x,z,w,d,benches)=>{
      box(x,.74,z,w,.09,d,0x6a4a2a);box(x,.79,z,w+.06,.03,d+.06,0x4a3018);
      for(let k=1;k<Math.round(w/.45);k++)box(x-w/2+k*.45,.795,z,.02,.02,d,0x4a3018);
      box(x,.66,z,w-.3,.07,d-.3,0x5a3a1c);
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{box(x+sx*(w/2-.18),.37,z+sz*(d/2-.18),.09,.74,.09,0x4a3018);box(x+sx*(w/2-.18),.2,z+sz*(d/2-.18),.12,.06,.12,0x4a3018);});
      solid(x,z,w/2,d/2,.76);
      if(benches)[-1,1].forEach(sd=>{const bz=z+sd*(d/2+.4);box(x,.42,bz,w-.2,.08,.36,0x5a3a1c);box(x,.36,bz,w-.3,.04,.28,0x4a3018);[-1,1].forEach(sx=>box(x+sx*(w/2-.3),.2,bz,.08,.42,.3,0x4a3018));solid(x,bz,w/2-.1,.2,.44);});
    };
    if(type==='weapon'){
      // S289 — the smithy on the kit (#46 A): a coursed forge with a hood, chimney and bellows, an anvil on a stump, a quench
      // tub, racks of the weapon kit's blades and hafts on the east wall, a grindstone, a dagger on the counter; one bake
      {const K=furnKit(),room=K.bake(K.smithy(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(1.2,1.4,.9,.8,1.2);light(1.2,1.0,2.0,0xff6a20,1.6,6);solid(W-2.0,1.6,.3,.3,1.0);solid(W-1.0,3.2,.3,.3,.7);
      counter();
    } else if(type==='armor'){
      // S290 — the armourer on the kit (#46 A): three stands (plate, leather, mail) with helms, the kit's shields on the
      // east wall in front of the back room, a bench with leather, rivets and a mallet; one bake
      {const K=furnKit(),room=K.bake(K.armoury(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      for(let k=0;k<3;k++)solid(1.6+k*1.6,1.6,.25,.25,1.8);solid(W-1.6,1.6,.7,.3,.76);
      counter();
    } else if(type==='potion'){
      // S290 — the apothecary on the kit: three shelves of bright potions, herbs hung drying, the still (an iron cauldron
      // glowing green over a small fire, a copper alembic), a mortar and pestle on the counter; one bake
      {const K=furnKit(),room=K.bake(K.apothecary(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      light(W-1.6,1.3,1.8,0x60ff80,1.0,5);solid(W-1.6,1.8,.4,.4,1.0);
      counter();
    } else if(type==='misc'||type==='shipwright'){
      // S290 — the general goods on the kit: crates, sacks tied at the neck, shelves of pots, bowls and plates, a balance on
      // the counter; the barrels are the interiors' kit barrel. The sacks stood in the back room; now in front of it
      {const K=furnKit(),room=K.bake(K.goods(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      _intBarrel(sc_,W-1.0,1.2);_intBarrel(sc_,W-1.9,1.1);_intBarrel(sc_,W-1.4,2.0);
      counter();
    } else if(type==='inn'){
      // S287 — the taproom on the kit (#46 A): a panelled bar with a brass rail and stools, the dresser of bottles and plates
      // behind it, two casks on cradles, the big stone hearth, four tables with benches, by the nation's wood, one mesh and
      // the flames. The beds are still _intBed's (the rooms' beds are shared with shops and halls); the solids are the old ones.
      {const K=furnKit(),seed=String(house.id||'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,11)%100000;
        const room=K.bake(K.inn(W,D,H,nationAt(house.doorX,house.doorZ),seed,true));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(W/2,2.2,W*.275+.1,.45,1.15);
      const hx=W-.4;light(hx-.8,.8,D*.5,0xff6a20,1.5,7);solid(W-.35,D*.5,.35,1.15,1.3);
      const tables=[[3.4,D*.42],[3.4,D*.66],[W-3.4,D*.7],[W/2,D*.6]]; // clear of the stair foot
      tables.forEach(([x,z])=>{solid(x,z,.9,.5,.76);[-1,1].forEach(sd=>solid(x,z+sd*.9,.8,.2,.44));});
      if(!gallery){_intBed(sc_,1.2,D-2.0,'N');_intBed(sc_,W-1.2,D-2.0,'N');bedAt(1.2,D-2.0,0);bedAt(W-1.2,D-2.0,0);intBedPos={x:1.2,z:D-2.0};}else intBedPos={x:W-1.2,z:1.2};
      npc={x:W/2,z:1.4,maxZ:1.8,paused:false};
    } else if(type==='church'){
      // S291 — the church on the kit (#46 A): a flagged stone dais, a moulded altar with its cloth, runner, candlesticks and
      // book, pews with shaped ends and kneelers, an eight-sided pulpit with steps, columns with bases and capitals; one bake
      {const K=furnKit(),room=K.bake(K.church(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(W/2,1.6,1.2,.55,1.3);light(W/2,2.2,1.8,0xffc070,1.4,8);
      {const zs=[];for(let z=3;z<D-2;z+=Math.max(3,D/4))zs.push(z);tallWins(zs,3.4,.9,2.6,0xc89050);}
      for(const x of [W/2-4.1,W/2+4.1])for(let z=5.5;z<D-3;z+=4)solid(x,z,.4,.4,H/F); // S303 — the columns outside the pews (at W/2 ± 3 they stood in them)
      npc={x:W/2,z:3.2,maxZ:3.6,paused:true};
    } else if(type==='castle'){
      // S291 — the keep's hall on the kit (#46 A): a stone dais with a runner and a carved throne, a long runner down the hall,
      // columns with banners, two braziers, the long table with benches, plates, tankards and candles; one bake
      {const K=furnKit(),room=K.bake(K.hall(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(W/2,1.6,.5,.4,1.0);
      for(let z=6;z<D-3;z+=4)[W/2-5,W/2+5].forEach(x=>solid(x,z,.5,.5,H/F));
      [W/2-3,W/2+3].forEach(x=>{light(x,1.4,5.2,0xff6a20,1.3,8);solid(x,5.2,.3,.3,1.1);});
      {const z=D*.3;solid(W/2,z,4,.8,.76);[-1,1].forEach(sd=>solid(W/2,z+sd*1.2,3.9,.2,.44));}
      {const zs=[];for(let z=4;z<D-3;z+=Math.max(4,D/5))zs.push(z);tallWins(zs,4.2,1.0,2.4,0xa8b8c8);}
      npc={x:W/2,z:4.6,maxZ:6.5,paused:false};
    } else if(type==='guild_f'||type==='guild_m'){
      const F_=type==='guild_f';
      // S292 — the guild halls on the kit (#46 A): the steward's desk (the counter's front with a ledger, inkwell and quill),
      // the notice board of pinned notes; the Fighters' racks of the weapon kit, armour stands, the long table with benches and
      // a grindstone (it stood in a dormitory; now in the hall); the Mages' bookcases, potion shelves either side of the board,
      // the still, a reading table of open books, columns. One bake; the old solids where they were
      {const K=furnKit(),room=K.bake((F_?K.guildF:K.guildM)(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);
        const nb=K.bake(K.noticeBoard(2.6,1.4,FN,FSEED+7));nb.position.set(W/2,1.6,.02);nb.userData.furn=true;sc_.add(nb);furnSwap(nb);}
      solid(W/2,3.4,2.6,.45,1.05);
      if(F_){for(let k=0;k<3;k++)solid(2+k*1.6,5.2,.25,.25,1.8);{const z=D*.3;solid(W/2,z,3,.65,.76);[-1,1].forEach(sd=>solid(W/2,z+sd*1.05,2.9,.2,.44));}}
      else{light(W-2.4,1.3,2.4,0x60ff80,1.0,5);solid(W-2.4,2.4,.4,.4,1.0);solid(W/2,D*.3,2.5,.6,.76);
        for(let x=W/2-4;x<=W/2+4;x+=8)for(let z=6;z<D-3;z+=5)solid(x,z,.4,.4,H/F);}
      // ground floor rooms: the hall (north) holds desk/board/training; a
      // cross wall with a central doorway; south of it a corridor with two
      // dormitory rooms each side (2 beds each) and the front door at the end.
      const hallZ=D*.52;
      partition(0,hallZ,W,hallZ,0,ceil,.5);
      const corrW=3.2;const lx=W/2-corrW/2,rx=W/2+corrW/2;
      partition(lx,hallZ,lx,D-2.6,0,ceil,null);partition(rx,hallZ,rx,D-2.6,0,ceil,null);
      const midZ=(hallZ+D-2.6)/2;
      partition(0,midZ,lx,midZ,0,ceil,null);partition(rx,midZ,W,midZ,0,ceil,null);
      // doorways from the corridor into each of the four rooms
      [[hallZ,midZ],[midZ,D-2.6]].forEach(([za,zb],ri)=>{const zc=(za+zb)/2;
        // cut door: re-make the side walls as two segments with a gap at zc
        [lx,rx].forEach((wx,side)=>{for(let i=SOL.length-1;i>=0;i--){const q=SOL[i];if(Math.abs(q.x0-(wx-.11))<.02&&Math.abs(q.x1-(wx+.11))<.02){SOL.splice(i,1);}}});
      });
      // (walls were solid segments; rebuild side walls with doorways)
      sc_.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry'&&Math.abs(o.position.x-lx)<.05&&o.geometry.parameters.width===.22||o.isMesh&&o.geometry.type==='BoxGeometry'&&Math.abs(o.position.x-rx)<.05&&o.geometry.parameters.width===.22).forEach(o=>sc_.remove(o));
      [lx,rx].forEach(wx=>{partition(wx,hallZ,wx,midZ,0,ceil,.5);partition(wx,midZ,wx,D-2.6,0,ceil,.5);});
      // beds: two per room
      [[1.4,hallZ+1.2],[1.4,midZ+1.2],[W-1.4,hallZ+1.2],[W-1.4,midZ+1.2]].forEach(([bx,bz],k)=>{_intBed(sc_,bx,bz,'N');bedAt(bx,bz,0);const bz2=bz+2.2;_intBed(sc_,bx,bz2,'N');bedAt(bx,bz2,0);
        const cx_=bx<W/2?bx+2.2:bx-2.2;{const K=furnKit(),c=K.bake(K.chest(FN,FSEED+k));c.position.set(cx_,0,bz+1.0);c.userData.furn=true;sc_.add(c);furnSwap(c);}}); // S292 — a kit chest by each pair of beds
      intBedPos={x:1.4,z:hallZ+1.2};
      // move the desk/board into the hall's south side facing the cross-wall door
      
      // members
      const memberRoles=F_?['Blade','Warden','Recruit']:['Adept','Novice','Evoker'];
      const names=NAMES[reg]||NAMES.irish;
      for(let k=0;k<3;k++){const nm=pick(Math.random,Math.random()<.5?names.m:names.f);const def={name:nm,role:memberRoles[k]+' of the '+(F_?'Fighters':'Mages'),ico:F_?'⚔':'✨',greeting:F_?["Steward's at the desk.","New? Don't touch the racks.","Come to spar sometime."]:["Mind the cauldron.","Have you read the board?","The Archmage sees everyone eventually."],topics:[{label:'What is it like here?',response:F_?'Beds, bread, and the odd broken nose. Better than the road.':'Quiet, mostly. Until something on a shelf goes off.'},{label:'Any advice?',response:F_?'Take the small jobs first. Beasts don\'t care about your rank.':'Never carry a relic in your bare hands longer than you must.'},{label:'Farewell.',bye:true}]};
        const g=buildNPCMesh({role:F_?'guard':'scholar',name:nm,bCol:F_?0x5a2020:0x203a6a,sCol:0xd4a878},{nation:nationAt(house.doorX,house.doorZ),key:house.siteId||''});const x=4+k*(W-8)/2,z=D*.4+(k%2)*2;g.position.set(x,0,z);g.rotation.y=Math.random()*Math.PI*2;sc_.add(g);
        INT_NPCS.push({g,def,wa:0,wt:1,walk:false,box:{x0:2,x1:W-2,z0:5,z1:D-4}});}
      npc={x:W/2,z:2.2,maxZ:2.6,paused:false};
    } else if(type==='barber'){
      // S512 — the barber and dyer (Michael's B on #144): the chair facing the mirror on the back wall, the washstand, a stool,
      // the bench of razors and towels on the west wall, the dyer's vat and hanks of wool along the back wall; no counter,
      // the barber stands at the chair. One bake, the Session 505 prototype's pieces
      {const K=furnKit(),room=K.bake(K.barber(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      const cx=W*.36;solid(cx,1.35,.24,.26,1.2);INT_CHAIR={x:cx,z:1.35,house}; /* S561 — sit in it: openBarberChair */solid(cx+.75,.7,.17,.17,.75);solid(.3,2.6,.22,.47,.76);
      solid(W-3.0,1.0,.33,.33,.75);solid(W-1.05,.8,.57,.25,.76);solid(.35,D*.6,.14,.82,.44);
      light(cx,1.9,1.6,0xffc880,1.1,6);light(W-2.2,1.6,1.4,0xffb070,.7,5);
      npc={x:cx-.8,z:1.3,maxZ:1.6,paused:true};
    } else if(type==='tower'){
      // a stone post, a helix of treads to a landing 30u up, a chest in the treasure room
      const TOP=30,turns=5,r0=1.1,r1=3.9;const cx_=W/2,cz_=D/2;
      // S294 — the helix, the post, the far rail and the treasure chest are one bake on the kit: 130 treads of dressed stone
      // (they were 130 boxes, 130 draw calls), the post in drums of coursed stone the whole height (the old cylinder was
      // F-scaled and stopped at 18.6 of the 30), the rail of posts and a top rail, the prototype's chest
      {const K=furnKit(),P=K.Parts(),rr=i=>((Math.sin(i*12.9898+7.1)*43758.5453)%1+1)%1,stoneC=i=>new THREE.Color(0x7a746a).offsetHSL(0,0,(rr(i)-.5)*.08);
        const steps=turns*26;for(let i=0;i<steps;i++){const t=i/steps;const a=t*Math.PI*2*turns;const y=t*TOP;const x=cx_+Math.cos(a)*(r0+r1)/2,z=cz_+Math.sin(a)*(r0+r1)/2;P(SK.rbox(r1-r0+.2,.14,.9,.03,1),stoneC(i),x,y+.05,z,0,-a,0);}
        for(let i=0;i<TOP/.5;i++)P(SK.cyl(.95,.95,.5,14),new THREE.Color(0x6a665e).offsetHSL(0,0,(rr(i+500)-.5)*.1),cx_,.25+i*.5,cz_,0,rr(i+900)*6,0);
        for(let k=0;k<6;k++)P(SK.rbox(.06,1.8,.06,.015,1),0x3a2e22,cx_-1.5+k*.6,TOP+.9,cz_-3.2);P(SK.rbox(3.4,.06,.06,.015,1),0x3a2e22,cx_,TOP+1.8,cz_-3.2);
        P.put(K.chest(FN,FSEED),cx_+2.2,cz_-2.2,0,TOP);
        const room=K.bake(P);room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(cx_,cz_,1.0,1.0,TOP/F);
      FOOTHOLDS.push({kind:'spiral',cx:cx_,cz:cz_,r0,r1,y0:0,y1:TOP,turns});
      // landing and treasure room floor
      // the top floor, with the well left open where the helix arrives (so you can go back down), and a hatch to the roof
      const ex=cx_+(r0+r1)/2,ez=cz_; // the helix ends at angle 0: due +x
      boxRaw(cx_-(W-(ex-1.4))/2- (ex-1.4)/2+ (ex-1.4)/2, TOP-.08, cz_, ex-1.4, .16, D, 0x6a665e); // left of the well
      boxRaw((ex-1.4+W)/2, TOP-.08, (ez-1.6)/2, W-(ex-1.4), .16, ez-1.6, 0x6a665e); // right, before the well
      boxRaw((ex-1.4+W)/2, TOP-.08, (ez+1.6+D)/2, W-(ex-1.4), .16, D-(ez+1.6), 0x6a665e); // right, after the well
      FOOTHOLDS.push({x0:0,x1:W,z0:0,z1:D,y:TOP,hole:{x0:ex-1.4,x1:W,z0:ez-1.6,z1:ez+1.6}});
      HATCH.x=cx_;HATCH.z=cz_-2.2;HATCH.y=TOP;HATCH.active=true;HATCH.roof=true; // the roof hatch
      glow(cx_+2.2,(TOP+.9)/F,cz_-2.2,0xffd080); // S294 — glow() scales y by F: the old chest and its glow sat at 18.8, in the shaft
      INT_LOOT={x:cx_+2.2,z:cz_-2.2,y:TOP,id:house.id};
      for(let k=0;k<4;k++){const a=k/4*Math.PI*2;const wx=cx_+Math.cos(a)*(W/2-.4),wz=cz_+Math.sin(a)*(D/2-.4);glow(wx,(TOP+1.6)/F,wz,0xa0c0ff);}
      npc={x:-99,z:-99,maxZ:1,paused:true};
    } else if(type==='chapel'){
      partition(0,D*.55,W*.38,D*.55,0,ceil-.3,null);partition(W*.62,D*.55,W,D*.55,0,ceil-.3,null);
      // S293 — the chapel on the kit: the fallen stones in the gap as they lay, a stone dais with a moulded pillar and its cap,
      // six candles round it, pews either side, a ladder to the hatch; one bake
      {const K=furnKit(),room=K.bake(K.chapel(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      HATCH.x=W/2;HATCH.z=D-1.3;HATCH.y=0;HATCH.active=true;
      npc={x:-99,z:-99,maxZ:1,paused:true};
    } else if(type==='cellar'){
      // S293 — the cellar on the kit: the barrels and crates (the stacked crate now on the others), a wine rack, a chest, a ladder
      for(let k=0;k<4;k++){_intBarrel(sc_,1.2+k*1.1,1.2);}for(let k=0;k<3;k++){_intCrate(sc_,W-1.2-k*.9,.25,1.3,.5);}_intCrate(sc_,W-1.65,.5+.225,1.3,.45);
      {const K=furnKit(),room=K.bake(K.cellar(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      HATCH.x=W/2;HATCH.z=1.2;HATCH.y=0;HATCH.active=true;
      npc={x:-99,z:-99,maxZ:1,paused:true};
    } else if(type==='cabin'){
      // the captain's cabin: bunk, chart table, lantern, the hold (stash chest)
      _intBed(sc_,1.3,1.6,'N');bedAt(1.3,1.6,0);intBedPos={x:1.3,z:1.6};
      // S293 — the cabin on the kit: the chart table (a chart, a log, dividers and a candle), sacks, the shelves of bottles
      {const K=furnKit(),room=K.bake(K.cabin(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}solid(W/2+.6,D*.45,.9,.55,.76);
      if(typeof _intStashChest==='function'){_intStashChest(sc_,W-1.2,1.2);intStashPos={x:W-1.2,z:1.2};}
      const port=new THREE.Mesh(new THREE.CircleGeometry(.32,12),new THREE.MeshBasicMaterial({color:0x7ac8ff}));port.position.set(W-.04,1.3,D*.6);port.rotation.y=-Math.PI/2;sc_.add(port);
      npc={x:-99,z:-99,maxZ:1,paused:true};
    } else { // home
      bedAt(1.2,1.4,0);if(!gallery)intBedPos={x:1.2,z:1.4};else intBedPos={x:W-1.2,z:1.2};
      // S286 — the home's furniture on the kit (#46 A): a box bed, the stone hearth, a table and two chairs with a candle, the
      // chest, two dressed shelves and a rag rug, by the nation's wood, baked to one mesh (and the flames); the old boxes' places
      {const K=furnKit(),seed=String(house.id||'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7)%100000;
        const room=K.bake(K.home(W,D,H,nationAt(house.doorX,house.doorZ),seed));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      const hx=W-.4;light(hx-.8,.7,D*.4,0xff6a20,1.2,6);solid(W-.35,D*.4,.35,.95,1.3);
      solid(W/2,D*.5,.75,.45,.76);
      const role=(house.dlg&&house.dlg.role)||'';
      if(/weaver/i.test(house.roleTag||''))box(W-2.2,.9,D-2.2,1.6,1.7,.4,0x5a3a1c);
      if(/fisher/i.test(house.roleTag||'')){const net=new THREE.Mesh(new THREE.ConeGeometry(.7,1.4,6,1,true),new THREE.MeshLambertMaterial({color:0x8a8060,side:THREE.DoubleSide,wireframe:true}));net.position.set(W-2,H-.9,D-2.2);sc_.add(net);}
      if(/farmer/i.test(house.roleTag||''))for(let k=0;k<3;k++)cyl(W-1.6-k*.7,.35,D-1.4,.32,.38,.7,0xb8a070,7);
      if(/cooper/i.test(house.roleTag||'')){_intBarrel(sc_,W-1.4,D-1.6);_intBarrel(sc_,W-2.3,D-1.4);}
      npc={x:W/2+1.6,z:D*.5+.9,maxZ:Math.min(D*.6,5),paused:false};
    }
    // v80 S131 — interior variety: the shopkeeper's room behind a partition; private rooms at the inn; the coaching inn's board and tack
    try{
      const SHOPS=['weapon','armor','potion','misc','shipwright','goods','forge','apothecary','armoury'];
      const partition=(z0,x0,x1,doorX,y0,y1)=>{const hh=y1-y0;for(const [a,b] of [[x0,doorX-.6],[doorX+.6,x1]]){if(b-a<.2)continue;boxRaw((a+b)/2,y0+hh/2,z0,b-a,hh,.18,0x5a4630);SOL.push({x0:a,x1:b,z0:z0-.09,z1:z0+.09,y0,y1});}
        boxRaw(doorX,y1-.12,z0,1.3,.24,.22,0x3a2a18);
        intDoorAt(sc_,SOL,doorX,z0,y0,Math.PI/2,0x3a2a18);}; // v80 S143 — the back room gets a door
      const sideWall=(x0,z0,z1,y0,y1)=>{boxRaw(x0,(y0+y1)/2,(z0+z1)/2,.18,y1-y0,z1-z0,0x5a4630);SOL.push({x0:x0-.09,x1:x0+.09,z0,z1,y0,y1});};
      if(SHOPS.includes(type)&&!gallery&&D>=9){
        const z0=D-3.2,doorX=W*.3;partition(z0,0,W,doorX,0,ceil);
        _intBed(sc_,W-1.3,D-1.4,'S');bedAt(W-1.3,D-1.4,0);solid(W-1.3,D-1.4,.55,1.05,.5);
        _intCrate(sc_,1.0,.25,D-.9,.5);_intCrate(sc_,1.6,.25,D-.9,.42);box(W*.6,.68,D-1.4,1.2,.06,.7,0x7a4818);box(W*.6,.34,D-1.4,.08,.62,.08,0x5a3010);solid(W*.6,D-1.4,.6,.35,.7);
        box(W*.6,.02,D-1.8,2.4,.03,2.0,[0x6a2a2a,0x2a3a5a,0x5a4a2a][(W|0)%3]);light(W*.6,1.4,D-1.6,0xffb070,.7,5);
        house._backRoom=true;
      }
      if(type==='inn'){
        if(!gallery){const z0=D-3.0,mid=W/2;sideWall(mid,z0,D,0,ceil);
        [[0,W*.25-.6],[W*.25+.6,W*.75-.6],[W*.75+.6,W]].forEach(([a,b])=>{boxRaw((a+b)/2,ceil/2,z0,b-a,ceil,.18,0x5a4630);SOL.push({x0:a,x1:b,z0:z0-.09,z1:z0+.09,y0:0,y1:ceil});});[W*.25,W*.75].forEach(dx=>boxRaw(dx,ceil-.12,z0,1.3,.24,.22,0x3a2a18));
        _intBed(sc_,1.3,D-1.4,'S');bedAt(1.3,D-1.4,0);solid(1.3,D-1.4,.55,1.05,.5);_intBed(sc_,W-1.3,D-1.4,'S');bedAt(W-1.3,D-1.4,0);solid(W-1.3,D-1.4,.55,1.05,.5);
        _intCrate(sc_,mid-1.0,.25,D-.8,.42);_intCrate(sc_,mid+1.0,.25,D-.8,.42);light(mid-2.5,1.3,D-1.6,0xffb070,.6,4);light(mid+2.5,1.3,D-1.6,0xffb070,.6,4);
        house._rooms=2;}
        // a coaching inn: a board by the door and a stable corner if a coach line ends here
        let coachHere=!!house.coachInn;try{const sid=String(house.id||'').replace(/^g_/,'').replace(/_\d+$/,'');const Cs=coaches();for(const k in Cs){if(Cs[k].a===sid||Cs[k].b===sid)coachHere=true;}}catch(e){}
        if(coachHere){ // S296 — the coaching board, the tack and the bales on the kit: one bake
          const K=furnKit(),P=K.Parts();P.put(K.noticeBoard(1.4,.9,FN,FSEED+11),1.2,.14,0,1.35);
          for(let i=0;i<3;i++){const z=2.0+i*.6;P(SK.cyl(.02,.02,.4,6),0x3a2a18,W-.2,1.7,z,0,0,Math.PI/2);P(SK.torus(.12,.025,6,16),[0x5a3a20,0x3a2a1a,0x6a4a2a][i],W-.36,1.56,z,0,Math.PI/2,0);P(SK.rbox(.05,.3,.18,.01,1),0x4a3018,W-.38,1.48,z+.1);}
          for(const [x,y,z,w,h,d] of [[W-1.0,0,D*.5+1.9,1.2,.31,1.0],[W-1.3,.31,D*.5+2.0,.6,.19,.5]]){P(SK.bumpy(SK.rbox(w,h,d,.06,2),.02,31,2),0xc8a850,x,y+h/2,z);for(const t of [-.25,.25])P(SK.rbox(w+.01,.012,.012,.004,1),0x7a5a2a,x,y+h*.5,z+t*d,0,0,0,1,1,1);}
          const room=K.bake(P);room.userData.furn=true;sc_.add(room);furnSwap(room);
          if(house.coachInn)coachInnFolk(house,sc_,W,D); // S238 — the driver and the travellers waiting in the common room
          house._coaching=true;}
      }
    }catch(e){console.warn('interior variety',e);}
    if(hasCellar(house)){const hx=Math.min(W-1.6,3.2),hz=D-2.6;boxRaw(hx,.06,hz,1.1,.08,1.1,0x3a2612);const ring=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,5,10),new THREE.MeshLambertMaterial({color:0x2a2622}));ring.position.set(hx+.3,.12,hz);ring.rotation.x=Math.PI/2;sc_.add(ring);house._hatch={x:hx,z:hz};HATCH.x=hx;HATCH.z=hz;HATCH.y=0;HATCH.active=true;}
    // v80 S155 — a shop's strongbox in the back room (or behind the counter), a home's small chest: locked, and worth something
    if(BOX_KINDS.includes(type)||type==='home'){const home=type==='home';let bx=home?1.0:(house._backRoom?W-.9:W-1.0),bz=home?D-1.0:(house._backRoom?D-2.6:D*.55),bry=home?Math.PI*.5:Math.PI;
      // S590 — the barber stands still at his chair facing into the room (+z), so his box goes where the 6-unit indoor witness and his
      // 120° cone cover every spot it opens from (1.6 round it): the wall-most free spot in front of him whose worst spot on that ring is
      // within 5.6 of him and 50° of his face (the critic, 6 Oct: at W−1, D×.55 it stood 6.8–8.5 from him and was picked unseen at noon).
      // Against the west wall when the room allows, nearer his chair in a wide one. No such spot: the old one.
      if(type==='barber'&&npc){const fr=(x,z)=>!SOL.some(q=>x+.32>q.x0-.1&&x-.32<q.x1+.1&&z+.32>q.z0-.1&&z-.32<q.z1+.1);
        const ok=(x,z)=>{for(let k=0;k<24;k++){const ux=x+Math.sin(k*Math.PI/12)*1.6,uz=z+Math.cos(k*Math.PI/12)*1.6;if(ux<.25||uz<.25||ux>W-.25||uz>D-.25)continue;
          const dx=ux-npc.x,dz=uz-npc.z,d=Math.hypot(dx,dz);if(d>5.6||dz/d<Math.cos(50*Math.PI/180))return false;}return true;};
        found:for(let x=.62;x<=npc.x+.01;x+=.2)for(let z=npc.z+1.4;z<D-1.6;z+=.1)if(fr(x,z)&&ok(x,z)){bx=x;bz=z;bry=Math.PI*.5;break found;}}
      const bg=new THREE.Group();const shell=buildChestShell(bg,home?.45:.6,home?0x6a4a2c:0x4a3018);bg.position.set(bx,0,bz);bg.rotation.y=bry;sc_.add(bg);if(bry===Math.PI*.5&&!home)solid(bx,bz,.28,.32,.5);else solid(bx,bz,.32,.28,.5);
      INT_BOX={x:bx,z:bz,lid:shell.lid,g:bg,id:house.id,kind:home?'home':'shop',type,house,open:false};}
    // S342 (#62 A) — the frame, built last so a post gives way to whatever stands against the wall. Plastered rooms: posts at the
    // corners and under each beam's ends (a short bracket where a window is within 1.2), knee braces, a sole plate and a wall
    // plate; Aurenne's close studding a post every 1.6. Stone and rubble rooms: a plinth course and three stepped corbels under
    // each beam's end. Everywhere: rounded beams .22 deep, joists every .5, and the entrance a plank door in a timber or stone frame.
    if(kitShell){const beams=[];for(let i=1;i<=(tower?0:nb);i++)beams.push(D*i/(nb+1));const wins=[];for(let z=D*.3;z<D*.9;z+=Math.max(3,D*.3))wins.push(z);
      shellFrame(sc_,{W,D,H,type,st,wallKind,FN,FSEED,beams,wins,TALLZ,SOL,FOOTHOLDS});}
    // keeper / resident — only if the schedule says they're indoors right now
    // (the same person you see in the street is the one behind the counter).
    if(npcInsideNow(house)){
    const roleName=type==='church'?'Priest':type==='home'?'Resident':type==='inn'?'Innkeeper':type==='castle'?'Steward':type==='guild_f'?'guard':type==='guild_m'?'scholar':'Merchant';
    const g=buildNPCMesh({role:roleName,name:house.keeper,_twin:house._twin,bCol:house.bCol||0x5a4030,sCol:house.sCol||0xd4a878},{nation:nationAt(house.doorX,house.doorZ),key:house.siteId||''});
    g.rotation.y=type==='church'?0:Math.PI;g.position.set(npc.x,0,npc.z);sc_.add(g);intNPCMesh=g;intNPCPos={x:npc.x,z:npc.z};
    intNPCMesh.userData.amble={wa:Math.random()*Math.PI*2,wt:1+Math.random()*3,minZ:.6,maxZ:npc.maxZ,minX:.8,maxX:W-.8,speed:.25,paused:npc.paused};
    } else {intNPCMesh=null;intNPCPos={x:-99,z:-99};}
    return sc_;
  }

  // ═══ LOCAL MAP (Session 12) ══════════════════════════════════════════
  // North-up map of what's around the player: terrain shade, water, roads,
  // paths, the buildings/walls of any streamed settlement, doors, camps,
  // NPCs and enemies. Drawn at 4 Hz into an offscreen canvas for the HUD
  // minimap and drawn directly, larger, for the hub's Local view.
  const LM={cv:null,t:0};const _snowMapC=new THREE.Color(0xe6ecf0);
  // v80 S138 — buildings by what they are, on the Local view, the minimap and the Key. Michael's scheme:
  // grey-white homes, red Fighters, blue Mages, gold keep and lord, purple church; the rest assigned here.
  const BLD={
    home:{col:'#cdc9c0',line:'#55514a',label:'Home'},
    castle:{col:'#e8b820',line:'#6a5008',label:'Keep \u00b7 the lord',glyph:'\ud83c\udff0'},
    guild_f:{col:'#c8402e',line:'#5a1a12',label:'Fighters\u2019 Guild',glyph:'\u2694'},
    guild_m:{col:'#3f73d6',line:'#16305e',label:'Mages\u2019 Guild',glyph:'\u2727'},
    church:{col:'#9656c8',line:'#3e1e5a',label:'Church',glyph:'\ud83d\udd6f'},
    inn:{col:'#e07a2a',line:'#6a3208',label:'Inn',glyph:'\ud83c\udf7a'},
    weapon:{col:'#5a5a64',line:'#1c1c22',label:'Smith \u00b7 armourer',glyph:'\u2692'},
    potion:{col:'#56b04c',line:'#1e4a18',label:'Apothecary',glyph:'\ud83c\udf3f'},
    misc:{col:'#b88a50',line:'#4a3418',label:'Goods',glyph:'\ud83d\udce6'},
    shipwright:{col:'#2fa39a',line:'#0e4440',label:'Shipwright',glyph:'\u26f5'},
    barber:{col:'#c0605a',line:'#4a1a16',label:'Barber \u00b7 dyer',glyph:'\u2702'}, // S512
    barracks:{col:'#8a4a40',line:'#3a1a14',label:'Barracks'},
    other:{col:'#d8c8a0',line:'#6a5a3a',label:'Other'},
    wall:{col:'#8a857a',line:'#5a5650',label:'Wall'},
  };
  BLD.armor=BLD.weapon;BLD.safehouse=BLD.home;
  function bldOf(t){return BLD[t]||BLD.other;}
  function drawLocalMap(ctx,size,radius,detail){
    const s=size/(radius*2),cx=size/2,cz=size/2;
    const toS=(x,z)=>[cx+(x-px)*s,cz+(z-pz)*s];
    ctx.save();ctx.fillStyle='#1c1a14';ctx.fillRect(0,0,size,size);
    // terrain: coarse cells
    const cell=Math.max(4,radius/14);
    for(let z=pz-radius;z<pz+radius;z+=cell)for(let x=px-radius;x<px+radius;x+=cell){
      const h=worldH(x+cell/2,z+cell/2);const dom=dominantRegion(x,z).r;
      let col;if(h<0)col='#3a5a78';else{const b=BIOME_PROFILES[dom.biome]||BIOME_PROFILES.plains;const c=new THREE.Color(b.groundBase);const k=.75+Math.min(.6,Math.max(0,h)/40)*.5;
        if(WX.cover>.02)c.lerp(_snowMapC,Math.min(.9,WX.cover*.85)); // v80 S146 — snow lying, on the local map too
        col=`rgb(${(c.r*255*k)|0},${(c.g*255*k)|0},${(c.b*255*k)|0})`;}
      const [sx,sz]=toS(x,z);ctx.fillStyle=col;ctx.fillRect(sx,sz,cell*s+1,cell*s+1);
    }
    // roads
    ctx.strokeStyle='#b8a070';ctx.lineWidth=Math.max(1.5,3*s);ctx.lineCap='round';
    for(const rd of ROADS){const pts=rd.pts;let on=false;ctx.beginPath();for(let i=0;i<pts.length;i++){const p=pts[i];if(Math.abs(p.x-px)>radius+10||Math.abs(p.z-pz)>radius+10){on=false;continue;}const [sx,sz]=toS(p.x,p.z);if(!on){ctx.moveTo(sx,sz);on=true;}else ctx.lineTo(sx,sz);}ctx.stroke();}
    // settlements: buildings, walls, doors
    for(const S of SETTLE.values()){
      if(Math.abs(S.site.x-px)>radius+S.site.pad||Math.abs(S.site.z-pz)>radius+S.site.pad)continue;
      for(const r of S.sol){
        if(r.c===undefined)continue;
        const [sx,sz]=toS(r.cx,r.cz);
        ctx.save();ctx.translate(sx,sz);ctx.rotate(-Math.atan2(r.s,r.c));
        const wall=r.bt==='wall'||(!r.bt&&r.rx>5&&r.rz<1.2);const B=wall?BLD.wall:bldOf(r.bt);
        const own=r.hid&&ownedHouse(r.hid); // v80 S138 — coloured by type; your own house outlined in light gold
        ctx.fillStyle=r.sh?'#85827b':B.col;ctx.strokeStyle=own?'#f6e27a':B.line;ctx.lineWidth=own?2:1;
        ctx.fillRect(-r.rx*s,-r.rz*s,r.rx*2*s,r.rz*2*s);ctx.strokeRect(-r.rx*s,-r.rz*s,r.rx*2*s,r.rz*2*s);ctx.restore();
      }
      if(detail){for(const h of S.houses){const [sx,sz]=toS(h.doorX,h.doorZ);ctx.fillStyle='#1a1610';ctx.strokeStyle=h.type==='home'?'#8a857a':'#f0e4c0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx,sz,Math.max(1.5,1.2*s),0,Math.PI*2);ctx.fill();ctx.stroke();}} // v80 S138 — the door: a dark notch on the coloured footprint
    }
    // doors, camps
    for(const r of STATIC_SOL){if(Math.abs(r.cx-px)>radius||Math.abs(r.cz-pz)>radius)continue;if(r.c!==undefined||Math.max(r.rx,r.rz)<3)continue;const [sx,sz]=toS(r.cx,r.cz);ctx.fillStyle='#a89a80';ctx.strokeStyle='#5a5650';ctx.lineWidth=1;ctx.fillRect(sx-r.rx*s,sz-r.rz*s,r.rx*2*s,r.rz*2*s);ctx.strokeRect(sx-r.rx*s,sz-r.rz*s,r.rx*2*s,r.rz*2*s);} // v80 S132 — keeps and other large statics
    for(const e of CELL_DOORS){const p=dungeonWorldPos[e.seed];if(Math.abs(p.x-px)>radius||Math.abs(p.z-pz)>radius)continue;const [sx,sz]=toS(p.x,p.z);ctx.fillStyle=e.kind==='fort_door'?'#c8a060':'#302820';ctx.strokeStyle='#e8d8a0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx,sz,Math.max(2.5,2.5*s),0,Math.PI*2);ctx.fill();ctx.stroke();}
    for(const b of beds){if(Math.abs(b.x-px)>radius||Math.abs(b.z-pz)>radius)continue;const [sx,sz]=toS(b.x,b.z);ctx.fillStyle='#ffb060';ctx.fillRect(sx-2,sz-2,4,4);}
    if(SHIP.mesh&&Math.abs(SHIP.x-px)<radius&&Math.abs(SHIP.z-pz)<radius){const [sx,sz]=toS(SHIP.x,SHIP.z);ctx.save();ctx.translate(sx,sz);ctx.rotate(-SHIP.yaw);ctx.fillStyle='#e8d8a0';ctx.strokeStyle='#2a1c10';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(3,4);ctx.lineTo(-3,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
    for(const o of OTHER){if(Math.abs(o.x-px)<radius&&Math.abs(o.z-pz)<radius){const [sx,sz]=toS(o.x,o.z);ctx.fillStyle=o.kind==='pirate'?'#ff4040':'#c8c8c8';ctx.beginPath();ctx.arc(sx,sz,3,0,Math.PI*2);ctx.fill();}}
    // people
    for(const n of npcs){if(!n.g.visible)continue;const [sx,sz]=toS(n.g.position.x,n.g.position.z);if(sx<0||sz<0||sx>size||sz>size)continue;if(n.def&&n.def._lord){ctx.fillStyle=BLD.castle.col;ctx.strokeStyle='#2a1c10';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(sx,sz,Math.max(3,2.2*s),0,Math.PI*2);ctx.fill();ctx.stroke();continue;} ctx.fillStyle=n.sched&&(n.sched.type==='guard'||n.sched.type==='watch'||n.sched.type==='constable')?'#80b0ff':'#ffffff';ctx.beginPath();ctx.arc(sx,sz,Math.max(1.5,1.2*s),0,Math.PI*2);ctx.fill();} // v80 S138 — the lord in gold
    // v80 S138 — the place someone gave you directions to
    if(WAY){const [sx,sz]=toS(WAY.x,WAY.z);const ins=sx>=0&&sz>=0&&sx<=size&&sz<=size;ctx.save();ctx.strokeStyle='#f6d860';ctx.lineWidth=2;
      if(ins){const pr=5+1.5*Math.sin(performance.now()/260);ctx.beginPath();ctx.arc(sx,sz,pr+3,0,Math.PI*2);ctx.stroke();}
      else{const a=Math.atan2(sz-cz,sx-cx),ex=cx+Math.cos(a)*(size/2-9),ez=cz+Math.sin(a)*(size/2-9);ctx.fillStyle='#f6d860';ctx.translate(ex,ez);ctx.rotate(a);ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-4,4);ctx.lineTo(-4,-4);ctx.closePath();ctx.fill();}
      ctx.restore();}
    for(const e of ZONES.world.enemies){if(e.dead||!e.mesh||!e.mesh.visible)continue;const [sx,sz]=toS(e.x,e.z);if(sx<0||sz<0||sx>size||sz>size)continue;ctx.fillStyle='#ff4040';ctx.beginPath();ctx.arc(sx,sz,Math.max(1.8,1.4*s),0,Math.PI*2);ctx.fill();}
    // player arrow
    ctx.save();ctx.translate(cx,cz);ctx.rotate(-yaw);ctx.fillStyle='#ffe060';ctx.strokeStyle='#2a1c10';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,6);ctx.lineTo(0,3);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    ctx.fillStyle='rgba(240,228,200,.8)';ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.fillText('N',cx,10);
    ctx.restore();
  }
  function drawMinimap(mm,size){
    if(!LM.cv){LM.cv=document.createElement('canvas');LM.cv.width=size;LM.cv.height=size;}
    const now=performance.now();
    if(now-LM.t>250){LM.t=now;drawLocalMap(LM.cv.getContext('2d'),size,58,false);}
    mm.drawImage(LM.cv,0,0);
  }

  // ═══ GUILDS (Session 12) ═════════════════════════════════════════════
  // Fighters' and Mages' guild halls in every town and city: a big two-
  // storey hall with a steward at the desk, members who wander, a dormitory
  // of beds, and paid tasks generated from the live world (doors, herbs,
  // residents, towns). Progress hooks: onKill, onHarvest, onPickup, onTalk,
  // onEnterInterior. State lives in worldState.guild so it saves.
  const GUILD_DEF={
    guild_f:{name:"Fighters' Guild",role:'Guildmaster',ranks:['Recruit','Blade','Warden','Champion','Master'],sign:'guild_f',col:0x7a2020},
    guild_m:{name:"Mages' Guild",role:'Archmage',ranks:['Novice','Adept','Evoker','Warlock','Archmage'],sign:'guild_m',col:0x203a6a},
  };
  function gstate(){if(!worldState.guild)worldState.guild={guild_f:{done:0,active:null},guild_m:{done:0,active:null}};return worldState.guild;}
  // S597 — the article for a word said after it: *an armourer*, *an Adept*, *a farmer* (a vowel letter takes *an*).
  function aOrAn(w){return /^[aeiou]/i.test(String(w||''))?'an':'a';}
  function rankOf(g){const st=gstate()[g];return GUILD_DEF[g].ranks[Math.min(4,Math.floor(st.done/3))];}
  function dirWord(fx,fz,tx,tz){return compassWord(tx-fx,tz-fz);}
  function nearSites(site,maxD){return SITES.filter(t=>t.id!==site.id&&t.pad>0&&Math.hypot(t.x-site.x,t.z-site.z)<maxD).sort((a,b)=>Math.hypot(a.x-site.x,a.z-site.z)-Math.hypot(b.x-site.x,b.z-site.z));}
  function nearDoors(site,maxD,fortsOnly){return CELL_DOORS.filter(e=>(!fortsOnly||e.kind==='fort_door')&&Math.hypot(dungeonWorldPos[e.seed].x-site.x,dungeonWorldPos[e.seed].z-site.z)<maxD).sort((a,b)=>Math.hypot(dungeonWorldPos[a.seed].x-site.x,dungeonWorldPos[a.seed].z-site.z)-Math.hypot(dungeonWorldPos[b.seed].x-site.x,dungeonWorldPos[b.seed].z-site.z));}
  const HUNT=['Wolf','Goblin','Spider','Bandit','Skeleton'];
  // v80 S133 — the nearest region whose encounter table carries the creature: a name and a point for the compass
  function huntGround(site,creature){let best=null,bd=1e9;for(const c of CELLS.values()){if(c.type==='sea'||!c.regions)continue;for(const rg of c.regions){const tbl=ENC[rg.id]||ENC_BIOME[rg.biome];if(!tbl||!tbl.some(g=>g.name===creature))continue;const d=Math.hypot(rg.x-site.x,rg.z-site.z);if(d<bd){bd=d;best={x:rg.x,z:rg.z,name:rg.name||rg.id};}}}return best;}
  function genTask(g,site){
    const st=gstate()[g];const tid=g+':'+site.id+':'+(st.n=(st.n||0)+1); /* S503 — an id of place and index (the co-op rules), not a Date.now() */const r=seededRng('task',tid); /* S678 — the task's kind, place and pay roll on its own id (the co-op rules), not Math.random */const tier=Math.floor(st.done/3);
    const gold=60+tier*50+Math.floor(r()*40);
    const doors=nearDoors(site,900,false),sites=nearSites(site,700);
    const housed=sites.filter(t=>{const P=KIND_PLAN[t.kind];return !!P&&P.n[0]>0;}),homed=sites.filter(t=>{const P=KIND_PLAN[t.kind];return !!P&&P.n[0]>P.shops.length;}); /* S675 — a draught wants a keeper and a hearth a home: never a camp, a ruin or a shrine (the critic's s480 Hermit's Camp) */
    const pickDoor=()=>doors[Math.floor(r()*Math.min(doors.length,6))];
    if(g==='guild_f'){
      const kind=['clear','hunt','beast','raid'][Math.floor(r()*4)];
      if(kind==='clear'&&doors.length){const e=pickDoor();const p=dungeonWorldPos[e.seed];const name=e.canonicalName||(typeof dungeonName==='function'?dungeonName(e.seed,e.theme):'an old gate');return {id:tid,g,kind,portal:'dyn_'+e.seed,need:5+tier*2,have:0,gold,desc:`${name} — ${dirWord(site.x,site.z,p.x,p.z)} of here. Clear it: put down ${5+tier*2} of whatever's inside.`,short:`Clear ${name}`};}
      if(kind==='hunt'){const t=HUNT[Math.floor(r()*HUNT.length)];const n=4+tier*2;const where=huntGround(site,t);return {id:tid,g,kind,target:t,need:n,have:0,gold,x:where?where.x:null,z:where?where.z:null,ground:where?where.name:null,desc:`${t}s have been at the roads. Kill ${n} of them in the open country${where?` — ${where.name}, ${compassWord(where.x-site.x,where.z-site.z)} of here, is their ground`:''} — and come back.`,short:`Hunt ${n} ${t}s${where?` (${where.name})`:''}`};}
      if(kind==='beast'&&sites.length){const t=sites[Math.floor(r()*Math.min(3,sites.length))];const beast=['Cave Bear','Ogre','Forest Troll'][Math.min(2,tier)];const ang=r()*Math.PI*2;const sx=t.x+Math.cos(ang)*(t.pad+70),sz=t.z+Math.sin(ang)*(t.pad+70);return {id:tid,g,kind,siteId:t.id,beast,sx,sz,spawned:false,done:false,gold:gold+40,desc:`A ${beast.toLowerCase()} is taking sheep at ${t.name}, ${dirWord(site.x,site.z,t.x,t.z)} of here. It was last seen ${compassWord(sx-t.x,sz-t.z)} of the village. Kill it.`,short:`The beast at ${t.name}`};}
      if(sites.length){const t=sites.filter(s=>s.kind==='village')[0]||sites[0];return {id:tid,g,kind:'raid',siteId:t.id,count:6+tier*2,spawned:false,have:0,gold:gold+80,desc:`${t.name} sent a rider: bandits are coming, ${dirWord(site.x,site.z,t.x,t.z)} of here. Get there and hold the town until they're all down.`,short:`Defend ${t.name}`};}
    } else {
      const kind=['relic','gather','deliver','hearth','wizard','creature'][Math.floor(r()*6)];
      if(kind==='relic'&&doors.length){const e=nearDoors(site,900,true)[0]||pickDoor();const p=dungeonWorldPos[e.seed];const name=e.canonicalName||'an old gate';return {id:tid,g,kind,x:p.x+8,z:p.z+6,got:false,gold:gold+30,desc:`An old binding-stone lies outside ${name}, ${dirWord(site.x,site.z,p.x,p.z)} of here, by the door. Bring it back unbroken.`,short:`Relic at ${name}`};}
      if(kind==='gather'){const pool=herbPool();const keys=Object.keys(HERB_DEF||{});const t=keys.length?keys[Math.floor(r()*keys.length)]:null;if(t){return {id:tid,g,kind,herb:t,need:3+tier,have:0,gold,desc:`We're short of ${HERB_DEF[t].name}. Harvest ${3+tier} in the wild and bring them.`,short:`Gather ${HERB_DEF[t].name}`};}}
      if(kind==='deliver'&&housed.length){const t=housed[Math.floor(r()*Math.min(3,housed.length))];return {id:tid,g,kind,siteId:t.id,who:null,gold,desc:`Someone in ${t.name}, ${dirWord(site.x,site.z,t.x,t.z)} of here, is sick. Take this draught to whoever answers to the name we'll give you at the gate — ask the first resident you meet.`,short:`Draught to ${t.name}`};}
      if(kind==='hearth'&&homed.length){const t=homed[Math.floor(r()*Math.min(3,homed.length))];return {id:tid,g,kind,siteId:t.id,house:null,gold:gold-20,desc:`A house in ${t.name}, ${dirWord(site.x,site.z,t.x,t.z)} of here, has a hearth that won't take. Go in and light it — any flame you can cast will do.`,short:`Light a hearth in ${t.name}`};}
      if(kind==='wizard'&&doors.length){const e=pickDoor();const p=dungeonWorldPos[e.seed];const ang=r()*Math.PI*2;return {id:tid,g,kind,sx:p.x+Math.cos(ang)*30,sz:p.z+Math.sin(ang)*30,spawned:false,done:false,gold:gold+60,desc:`A rogue of ours has set up by ${e.canonicalName||'an old gate'}, ${dirWord(site.x,site.z,p.x,p.z)} of here. End him.`,short:`The rogue mage`};}
      const lk=LAKES[0];return {id:tid,g,kind:'creature',sx:lk.x+lk.r+30,sz:lk.z+20,spawned:false,done:false,gold:gold+50,desc:`Something is walking the shore of ${lk.name}, ${dirWord(site.x,site.z,lk.x,lk.z)} of here, that shouldn't be. Unmake it.`,short:`The thing at ${lk.name}`};
    }
    return {id:tid,g,kind:'hunt',target:'Wolf',need:4,have:0,gold,desc:'Wolves. Four of them.',short:'Hunt 4 Wolves'};
  }
  // S501 — dated guild work (DECISION #132, part B, as the lords' jobs in S500): one generated task in three (not the
  // rank commissions) carries a date 7 to 14 days out, from a stream keyed by the guild, the hall's town and the day; done
  // by then (t.doneAt, stamped by the hooks below when it is first done) it pays a quarter more; past it, undone, the guild
  // takes it back (gLapse, from tickDatedWork).
  function gDated(t,g,site){const day=Math.floor((worldState.gameTimeAbsMinutes||0)/1440);const r=seededRng('dated:'+g+':'+site.id,day);if(r()<1/3)t.due=(day+7+Math.floor(r()*8)+1)*1440;return t;}
  function gStamp(t){if(t&&t.doneAt==null&&taskDone(t)){t.doneAt=Math.floor(worldState.gameTimeAbsMinutes||0);qJournal(t,'ready',`Done — report to the ${(GUILD_DEF[t.g]||{name:'guild'}).name}.`);}} /* S511 — the journal's line under the task's id, as the world's quests (S510) */
  function gDatedPay(t){return t.due&&t.doneAt!=null&&t.doneAt<t.due?Math.round((t.gold||0)*1.25):(t.gold||0);}
  function gLapse(){const G=worldState.guild;if(!G)return;const now=worldState.gameTimeAbsMinutes||0;for(const g in G){const st=G[g],t=st&&st.active;if(!t||!t.due||now<t.due)continue;gStamp(t);if(t.doneAt!=null)continue;
    st.active=null;if(t.kind==='raid'){const S=SETTLE.get(t.siteId);if(S)S.raid=false;}if(t._obj){try{sc.remove(t._obj.m);unregLight(t._obj.l);}catch(e){}const i=pickups.findIndex(p=>p.task===t);if(i>=0)pickups.splice(i,1);}
    if(typeof addLog==='function')addLog('📜',`${GUILD_DEF[g].name}: ${t.short}. The date passed, and the guild has given it to someone else.`);qJournal(t,'lapsed','The date passed, and the guild has given it to someone else.');showMsg(`${GUILD_DEF[g].name}: the date has passed. The task is taken back.`,'#c8b880');}}
  function taskDone(t){
    switch(t.kind){case 'clear':case 'hunt':case 'gather':return t.have>=t.need;case 'raid':return t.spawned&&t.have>=t.count;case 'beast':case 'wizard':case 'creature':return !!t.done;case 'relic':return !!t.got;case 'deliver':return !!t.done;case 'hearth':return !!t.done;}return false;
  }
  function progressLine(t){
    switch(t.kind){case 'clear':case 'hunt':case 'gather':return `${t.have}/${t.need}`;case 'raid':return t.spawned?`${t.have}/${t.count} down`:'not yet there';default:return taskDone(t)?'done':'not yet';}
  }
  // ── hooks ──
  function onKill(e,ctx){
    (worldState.stats||(worldState.stats={})).kills=((worldState.stats||{}).kills||0)+1;
    qOnKill(e,ctx);
    const G=gstate();
    for(const g in G){const t=G[g].active;if(!t)continue;
      if(t.kind==='clear'&&ctx==='dungeon'&&typeof currentPortal!=='undefined'&&currentPortal&&currentPortal.id===t.portal)t.have++;
      if(t.kind==='hunt'&&ctx==='zone'&&(e.name===t.target||e.baseName===t.target))t.have++; /* S667 — a Greater Wolf or a Shadow Skeleton is the creature hunted (its variant's name has a prefix); a Dire Wolf is a kind of its own */
      if((t.kind==='beast'||t.kind==='wizard'||t.kind==='creature')&&e._guildTag===t.id)t.done=true;
      if(t.kind==='raid'&&e._guildTag===t.id){t.have++;if(t.have>=t.count){const S=SETTLE.get(t.siteId);if(S)S.raid=false;showMsg('The raiders are down. The town is safe.','#e8d8a0');}}
      gStamp(t);if(taskDone(t)&&!t._told){t._told=true;showMsg(`${GUILD_DEF[g].name}: task complete — report back.`,'#e8d8a0');}
    }
  }
  function onHarvest(h){const G=gstate();for(const g in G){const t=G[g].active;if(t&&t.kind==='gather'&&h.type===t.herb){t.have++;gStamp(t);if(taskDone(t)&&!t._told){t._told=true;showMsg("Mages' Guild: that's enough — report back.",'#e8d8a0');}}}}
  function onTalk(def){if(def&&def.name==='Varek'){varekTalked();return false;}if(qOnTalk(def))return true;const G=gstate();const t=G.guild_m.active;if(!t||t.kind!=='deliver'||t.done)return false;
    const S=SETTLE.get(t.siteId);if(!S||!S.houses.some(h=>h.keeper===def.name))return false;
    if(!t.who){t.who=def.name;showMsg(`${def.name} takes the draught. "Bless you." Report back.`,'#e8d8a0');t.done=true;gStamp(t);return true;}return false;}
  function onEnterInterior(house){const G=gstate();const t=G.guild_m.active;if(!t||t.kind!=='hearth'||t.done)return false;if(house.type!=='home')return false;const S=SETTLE.get(t.siteId);if(!S||!S.houses.includes(house))return false;t.house=house.id;showMsg('This is the cold hearth. Stand by it and cast a flame (F).','#c8b880');return true;}
  function onCast(sp){const G=gstate();const t=G.guild_m.active;if(!t||t.kind!=='hearth'||t.done||!t.house)return;if(!sp||sp.school!=='tine')return; /* S672 — only a flame lights it */
    if(typeof currentHouse==='undefined'||!currentHouse||currentHouse.id!==t.house)return;
    const W=currentHouse._roomW||10,D=currentHouse._roomD||10;if(Math.hypot(px-(W-.4),pz-D*.4)<2.6){t.done=true;gStamp(t);showMsg('The hearth catches. Report back.','#e8d8a0');}}
  // world pickups (relics)
  const pickups=[];
  function ensureTaskWorldObjects(){
    const G=gstate();
    for(const g in G){const t=G[g].active;if(!t)continue;
      if(t.kind==='relic'&&!t.got&&!t._obj){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.28,0),new THREE.MeshBasicMaterial({color:0x9ad0ff}));m.position.set(t.x,worldH(t.x,t.z)+.5,t.z);sc.add(m);const l=regLight(0x80c0ff,1.2,6,'task');l.position.copy(m.position);t._obj={m,l};pickups.push({id:t.id+':pickup',x:t.x,z:t.z,task:t});} /* S518 — a task's relic is <task id>:pickup */
      if((t.kind==='beast'||t.kind==='wizard'||t.kind==='creature')&&!t.spawned&&!t.done&&Math.hypot(px-t.sx,pz-t.sz)<220){
        const name=t.kind==='beast'?t.beast:t.kind==='wizard'?'Rogue Mage':'Shore Wisp';
        const fid=t.id+':foe:0'; /* S504 — a job's foe is the job and its index (co-op rules) */ const e=keyFoe(unlockFoe(buildZoneEnemy(sc,STATIC_SOL,t.sx,t.sz,name,typeof pickVariant==='function'?pickVariant(name,level,'hard',seededRng('variant',fid)):null)),fid);e._guildTag=t.id;e.hp=Math.round(e.hp*1.6);e.maxHp=e.hp;ZONES.world.enemies.push(e);t.spawned=true;showMsg(`${name} sighted.`,'#ffb060');
      }
      if(t.kind==='raid'&&!t.spawned){const S=SETTLE.get(t.siteId);if(S&&Math.hypot(px-S.site.x,pz-S.site.z)<150){t.spawned=true;S.raid=true;const site=S.site;const pr=seededRng('place',t.id);for(let i=0;i<t.count;i++){const ang=pr()*Math.PI*2;const ex=site.x+Math.cos(ang)*(site.pad+8),ez=site.z+Math.sin(ang)*(site.pad+8);const e=keyFoe(unlockFoe(buildZoneEnemy(sc,STATIC_SOL,ex,ez,'Bandit',null)),t.id+':foe:'+i);e._guildTag=t.id;e.alert=true;ZONES.world.enemies.push(e);}showMsg(`Raiders! ${t.count} of them. Hold ${site.name}.`,'#ff8060');}}
    }
  }
  function tickPickups(){qPickupTick();for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];if(p.quest)continue;if(Math.hypot(px-p.x,pz-p.z)<1.4){p.task.got=true;gStamp(p.task);sc.remove(p.task._obj.m);unregLight(p.task._obj.l);pickups.splice(i,1);showMsg('You take the binding-stone. Report back.','#e8d8a0');if(typeof addLog==='function')addLog('🔷','Took a binding-stone.');}}}
  function turnIn(g){gLapse();const st=gstate()[g];const t=st.active;if(!t)return "You've no task from us.";if(!taskDone(t))return `Not yet. ${progressLine(t)}.`;
    st.active=null;st.done++;const paid=questGold(gDatedPay(t));gold+=paid;xp+=Math.round(t.gold*.8);chkLvl();updateHUD();if(typeof addLog==='function')addLog('🏅',`${GUILD_DEF[g].name}: ${t.short} — ${paid} gold.`);qJournal(t,'complete',`Turned in to the ${GUILD_DEF[g].name}: ${paid} gold.`);
    const rk=rankOf(g);return `Good work. ${paid} gold. ${st.done%3===0?`You're ${aOrAn(rk)} ${rk} of the ${GUILD_DEF[g].name} now.`:`Rank: ${rk}.`}`;}
  // S682 — Michael's A on DECISION #217: a task you cannot finish is handed back, with no pay and no mark against your standing,
  // and *Any work?* gives another. Cleared as a lapse clears it (the raid's flag, a relic left lying); a rank commission
  // handed back comes round again, since the rank waits on it. The guild head's line in each people's voice is the quest writer's.
  function handBack(g,gp){gLapse();const st=gstate()[g];const t=st.active;if(!t)return "You've no task from us.";if(taskDone(t))return 'It\u2019s done already. Tell me so.';
    st.active=null;if(t.kind==='raid'){const S=SETTLE.get(t.siteId);if(S)S.raid=false;}if(t._obj){try{sc.remove(t._obj.m);unregLight(t._obj.l);}catch(e){}const i=pickups.findIndex(p=>p.task===t);if(i>=0)pickups.splice(i,1);}
    if(/:c\d+$/.test(String(t.id))&&st.commissions){const at=+String(t.id).split(':c').pop();st.commissions=st.commissions.filter(x=>x!==at);}
    if(typeof addLog==='function')addLog('📜',`${GUILD_DEF[g].name}: ${t.short}. Handed back.`);qJournal(t,'lapsed',`Handed back to the ${GUILD_DEF[g].name}.`);
    return ({gatelander:"Better a thing set down than a thing dropped. It goes back on the board, and there'll be another when you want one.",markman:"Aye. Back on the board. Come back when you want another.",aurennais:"Then the contract is void, Master, and nothing is owed on either side. It returns to the board; another can be drawn up when you wish.",oldblood:"Then it goes back. Someone else will carry it. Come when you want another."})[gp]||"Then it goes back on the board. Come back when you want another.";}
  function offer(g,site){gLapse();const st=gstate()[g];if(st.active)return `You still owe us: ${st.active.short}. ${progressLine(st.active)}.`;const cm=commissionFor(g,site);const t=cm||gDated(genTask(g,site),g,site);st.active=t;if(typeof addLog==='function')addLog('📜',`${GUILD_DEF[g].name}: ${t.short}.`);qJournal(t,'accept',t.desc);showMsg(`New task: ${t.short}`,'#e8d8a0');return (t.title?`${t.title}. `:'')+t.desc+(t.due?` Pay is ${t.gold} gold; ${Math.round(t.gold*1.25)} if it is done by ${calDateLine(t.due-1)}. After that, the guild gives it to someone else.`:` Pay is ${t.gold} gold.`);}
  // S254 — the guild head greets in the voice of their own people (quest review, run 1, finding 1)
  const GUILD_GREET={
    guild_f:{
      gatelander:["A blade on the wall cuts no bread. The board's behind me.","You've the look of someone who can swing a thing. The board will tell us the rest."],
      markman:   ["The board's behind me. Work if you want it.","You look like you can swing something."],
      aurennais: ["The contracts are posted behind me, Master. Each has its terms and its fee.","You have the look of someone who could take a contract, Master. Read the terms before you sign for one."],
      oldblood:  ["The board is behind me. The work is older than the board.","You carry a blade. Good. Most of the work wants one."]},
    guild_m:{
      gatelander:["Mind the shelves. What sits quiet on a shelf isn't always sleeping.","The Guild's never short of errands, whatever else it's short of. Is it work you're after, or answers?"],
      markman:   ["Mind the shelves. Some of that bites.","Guild needs feet more than minds. You've got feet."],
      aurennais: ["Mind the shelves, Master. Not all of the stock is inert, and breakage is charged.","The Guild has need of runners, Master, more than of scholars. The terms are fair and the pay is prompt."],
      oldblood:  ["Mind the shelves. Some of what is on them was not made to be read.","The Guild wants feet. Minds it has, of a kind."]}};
  function guildDef(g,site,keeper,extra){
    const gd=GUILD_DEF[g];
    const gr=rngFor(site.c*31+(g==='guild_f'?101:211),site.r*17+5); // S172 — the same head every visit (was Math.random: a new name and face each time)
    const gp=peopleOfSite(site);const gb=NAMES[PEOPLES[gp].names]||NAMES.irish;keeper=pickFor(gr,gr()<.4?gb.f:gb.m,true);const tk='tw:'+g,tr=_curNM&&_curNM[tk]?String(_curNM[tk]).split('|'):null;const tw=noteName(keeper,true,tr&&tr[0]===keeper?tr[1]:null);if(_curNM)_curNM[tk]=keeper+'|'+tw;
    return Object.assign({name:keeper,_twin:tw||undefined,_siteId:site.id,people:gp,sCol:pick(gr,PEOPLES[gp].skin),hairCol:pick(gr,PEOPLES[gp].hair),bodyScale:[PEOPLES[gp].width,PEOPLES[gp].height,PEOPLES[gp].width],role:gd.role,ico:g==='guild_f'?'⚔':'✨',greeting:(GUILD_GREET[g][gp]||GUILD_GREET[g].markman),
      get topics(){const base=[{label:'Any work?',quest:true,fn:()=>offer(g,site)},{label:"It's done.",quest:true,avail:()=>{gLapse();const t=gstate()[g].active;return !!t&&taskDone(t);},fn:()=>turnIn(g)},{label:'I can\u2019t do it.',quest:true,avail:()=>{gLapse();const t=gstate()[g].active;return !!t&&!taskDone(t);},fn:()=>handBack(g,gp)},{label:'My standing?',quest:true,fn:()=>`${rankOf(g)} of the ${gd.name}. ${gstate()[g].done} task${gstate()[g].done===1?'':'s'} done.`}];{const w=directionTopics(site,this);if(w.length)base.push({label:'Where can I find \u2026',folder:true,response:'Outside these walls? Ask, then.',follow:w});} /* v80 S138 */if(g==='guild_m')base.push({label:'Browse your wares.',trade:true}); /* S566 — robes at the Mages' Guild (#163) */if(g==='guild_m'&&typeof spellShopTopics==='function')base.push(...spellShopTopics(Math.min(4,Math.floor(gstate()[g].done/3))),...rubbingTopics(site));return base.filter(t=>!t.avail||t.avail()).concat(this._tail);},_tail:[{label:'What is this place?',response:g==='guild_f'?"The Fighters' Guild. We take contracts the watch won't: beasts, raiders, old doors that need emptying. Beds upstairs for members.":"The Mages' Guild. Ingredients, relics, errands that need a spell at the end of them. There are beds if you've nowhere else."},{label:'Farewell.',bye:true}]},extra||{});
  }
