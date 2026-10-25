
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
  const WAY_ASK={castle:['The keep?','keeps'],inn:['An inn?','inns'],guild_f:['The Fighters\u2019 Guild?',''],guild_m:['The Mages\u2019 Guild?',''],church:['The church?','churches'],weapon:['A smith?','smithies'],armor:['An armourer?','armouries'],potion:['An apothecary?','apothecaries'],misc:['Somewhere for supplies?','goods stores'],barber:['A barber?','barbers'],shipwright:['The shipwright?','']};
  const WAY_ORDER=['castle','inn','guild_f','guild_m','church','weapon','armor','potion','misc','barber','shipwright'];
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
      extra=Object.assign({},extra||{},{sCol:pick(r,P.skin),hairCol:pick(r,P.hair),bodyScale:[P.width/P.height,1,P.width/P.height]});} /* S880 (F2a) — the stature is SCALE.PEOPLE's now (personScale); the people's breadth stays, over it */
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
  // S1065 — the settlements whose lots take the kit's bays on the new look, and the shops that are merchants' houses
  const KIT_SITE={village:'village',outpost:'village',town:'town',port:'town',city:'town'},KIT_SHOPS=new Set(['weapon','armor','potion','misc','barber']);
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
    // S1138 (card F6, Michael's B on #433) — the town is laid out around its church and its keep, on both looks: before a lot is
    // laid, a town's, port's or city's church takes a plot on the square and a keep its bawn's plot at the head of the main street, and
    // the lots, the stalls, the widened houses and the streets keep out of them (a street that runs into one stops at it).
    //   - the church: the kit's church with its west tower, end-on, 8.4 m wide and 27.4 m long (22.6 with two bays where three will not
    //     fit), its tower's face 14 m from the town's heart, its flank 2.8 m off a street through the centre as a lot's front is, a yard
    //     of 4.5 m beside it (2 m until S1232, Michael's B on #464: the six gods' row of seven stands along it, facing the nave) and 3 m
    //     behind; tried along the cross street first (the main road runs along the main street), each way, each side;
    //   - the keep's bawn: 30 m wide and 25 m deep, astride the main street at its far end from the first road, its gate toward the heart;
    //     else at an end of the cross street, else the near end of the main street, drawn in from the ring by 6 m at a time while a road is in it.
    // A plot is { type, x, z, w, d, ry, tx, tz, k, lot }: its rect (with the yard), the way its front faces, and the building's own lot.
    let PLOTS=[];
    const kitPre=new Map(); /* S1143 — a kit piece built at the plan to be measured (the keep), kept for its builder (kitKeep) */
    const plotC=(P,m)=>{const c=Math.cos(P.ry),s_=Math.sin(P.ry),hw=P.w/2+m,hd=P.d/2+m;return [[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(([u,v])=>({x:P.x+u*c+v*s_,z:P.z-u*s_+v*c}));};
    const rectsApart=(a,b,m)=>{const A=plotC(a,m),B=plotC(b,0);for(const P of [A,B])for(let k=0;k<2;k++){const ex=P[k+1].x-P[k].x,ez=P[k+1].z-P[k].z;const pa=A.map(q=>q.x*ex+q.z*ez),pb=B.map(q=>q.x*ex+q.z*ez);if(Math.max(...pa)<Math.min(...pb)||Math.max(...pb)<Math.min(...pa))return true;}return false;};
    function inPlot(x,z,m){for(const P of PLOTS){const ex=x-P.x,ez=z-P.z,c=Math.cos(P.ry),s_=Math.sin(P.ry);if(Math.abs(ex*c-ez*s_)<P.w/2+m&&Math.abs(ex*s_+ez*c)<P.d/2+m)return true;}return false;}
    const offPlots=(l,m=.6)=>!!l.plot||PLOTS.every(P=>rectsApart(l,P,m)); /* a plot's own building is in it by right */
    function townPlots(){const out=[];if(!(site.kind==='town'||site.kind==='city'||site.kind==='port'))return out;
      const h0=heroShops(site),types=h0?h0.map(h=>h.type):plan.shops;
      // a rect in a frame: along u from t0 to t1, across it (v) from a0 to a1, its front toward -u; with ok() over its edges every 1.5 m
      const frame=(ux,uz,vx,vz,t0,t1,a0,a1)=>{const tm=(t0+t1)/2,am=(a0+a1)/2;return {x:cx+ux*tm+vx*am,z:cz+uz*tm+vz*am,w:a1-a0,d:t1-t0,ry:Math.atan2(-ux,-uz),tx:-ux,tz:-uz};};
      const fits=(P,own)=>{const C=plotC(P,0);for(let k=0;k<4;k++){const A=C[k],B=C[(k+1)%4],n=Math.ceil(Math.hypot(B.x-A.x,B.z-A.z)/1.5);for(let j=0;j<n;j++){const x=A.x+(B.x-A.x)*j/n,z=A.z+(B.z-A.z)*j/n;
          if(Math.hypot(x-cx,z-cz)>inner-3)return false;const ri=roadInfo(x,z,true);if(ri&&ri.d<ROAD_HALF+1.2)return false;
          for(const L of streetLines){if(L===own||Math.abs(L.dx*(-P.tz)+L.dz*P.tx)>.5)continue;/* a street across it is cut; one along it must stay 1.6 m off */ if(Math.abs((x-L.px)*(-L.dz)+(z-L.pz)*L.dx)<1.6)return false;}}}
        if(site.quayStart&&Math.hypot(P.x-site.quayStart.x,P.z-site.quayStart.z)<Math.max(P.w,P.d)/2+20)return false;
        return out.every(Q=>rectsApart(P,Q,1));};
      const along=(ux,uz)=>streetLines.find(L=>L.px===cx&&L.pz===cz&&Math.abs(L.dx*uz-L.dz*ux)<1e-6)||null; /* the street through the heart along u */
      const dirs=[[bx,bz],[-bx,-bz],[ax,az],[-ax,-az]];
      // S1305 (card F6, Michael's C on #294) — on the new look an Aurennais town's church is the Church of the Weaver (PKIT.au.church, a
      // town's: 14 m a side under the blue dome, its bell tower on the right): about 18.8 by 21 m with its porch, steps and tower, too broad
      // for the nave's plot. It stands at the head of a street through the heart, astride it, the foot of its steps 14 m out (or 18, or 10)
      // and its door on the street's line, so the street runs up to its steps; a yard of 1.5 m round its sides and back. Cross street first.
      // S1329 (OG-113, Michael's C on #439 and his B on #464, the row in the church's yard) — the yard on the church's left (its -x, the
      // tower on its right) is 4.5 m where the plot fits so, and the six gods' row of seven in Aurenne's dress stands along it facing the
      // nave, its middle by the cube's, a walk of 1.2 m inside its railing (lot.gods, kitGods); where 4.5 m will not fit, 1.5 m and no row.
      const AUC=window.OG_LOOK==='new'&&window.OG_KIT_TOWNS!==false&&typeof PKIT!=='undefined'&&nationOf(ni,nj).people==='aurennais';
      if(types.includes('church')&&AUC){const B=PKIT.au.churchBox({rank:'town',w:14,tower:1}),D=+(B.z1-B.z0).toFixed(2),M=1.5,YG=4.5;
        outer:for(const YL of [YG,M])for(const t0 of [14,18,10])for(const [ux,uz] of dirs){const vx=-uz,vz=ux,P=frame(ux,uz,vx,vz,t0,t0+D+M,B.x0-YL,B.x1+M);if(!fits(P,along(ux,uz)))continue; /* v is the church's own +x */
          const lot=Object.assign(frame(ux,uz,vx,vz,t0,t0+D,B.x0,B.x1),{w:+(B.x1-B.x0).toFixed(2),d:D,row:0,street:null,k:-1,plot:'church',au:true});
          if(YL===YG){const t=t0+B.z1,a=B.x0-1.35-2.17; /* the cube's middle (the church's z 0); the railing's outer face 1.35 m off the wall (1.2 off its solid) */ lot.gods={x:cx+ux*t+vx*a,z:cz+uz*t+vz*a,ry:Math.atan2(vx,vz),island:'aurenne'};}
          P.type='church';P.lot=lot;out.push(P);break outer;}}
      else if(types.includes('church'))outer:for(const n of [3,2]){const L=PKIT.gl.churchLen(n),W=8.4,YARD=4.5,t0=Math.sqrt(14*14-2.8*2.8);
        for(const [ux,uz] of dirs)for(const sd of [1,-1]){const vx=-uz*sd,vz=ux*sd,P=frame(ux,uz,vx,vz,t0,t0+L+3,2.8,2.8+W+YARD);if(!fits(P,null))continue;
          const t=t0+L/2+.4,a=2.8+W+YARD-.58; /* S1232 — the row of seven: its niches' faces .58 in from the yard's edge, its middle .4 east of the nave's, facing the church */
          const lot=Object.assign(frame(ux,uz,vx,vz,t0,t0+L,2.8,2.8+W),{w:W,d:L,row:0,street:null,k:-1,plot:'church',bays:n,gods:{x:cx+ux*t+vx*a,z:cz+uz*t+vz*a,ry:Math.atan2(-vx,-vz)}});P.type='church';P.lot=lot;out.push(P);break outer;}}
      if(types.includes('castle')){const T=Math.sqrt((inner-3)**2-15*15);
        outer:for(const [ux,uz] of [[-ax,-az],[bx,bz],[-bx,-bz],[ax,az]])for(let t1=T;t1-25>=20;t1-=6){const vx=-uz,vz=ux,P=frame(ux,uz,vx,vz,t1-25,t1,-15,15);if(!fits(P,along(ux,uz)))continue; /* the main street runs into its gate */
          const lot=Object.assign(frame(ux,uz,vx,vz,t1-1-11,t1-1,-7,7),{w:14,d:11,row:0,street:null,k:-2,plot:'castle'});P.type='castle';P.lot=lot;out.push(P);break outer;}}
      // S1339 (card F6, Michael's A on #411) — on the new look a Gatelands town's, port's or city's first inn is the kit's coaching inn, 17.6
      // by 23 m with its gateway and its yard: it takes a plot beside the main street (else the cross street), its front 2.8 m off the street's
      // line as a lot's is and a yard of 1 m round its sides and back, as far out toward the ring as fits, where the road comes in (the main
      // road's end first, then the far end), and no nearer the heart than 10 m.
      if(types.includes('inn')&&window.OG_LOOK==='new'&&window.OG_KIT_TOWNS!==false&&typeof PKIT!=='undefined'&&PKIT.gl&&PKIT.gl.coachInn&&nationOf(ni,nj).people==='gatelander'){const W=17.6,D=23,Y=1;
        outer:for(const [sx,sz] of [[ax,az],[-ax,-az],[bx,bz],[-bx,-bz]])for(let a1=inner-4;a1-W-Y>=10;a1-=2)for(const sd of [1,-1]){const ux=-sz*sd,uz=sx*sd,P=frame(ux,uz,sx,sz,2.8,2.8+D+Y,a1-W-Y,a1+Y);
          if(!fits(P,along(sx,sz))||!out.every(Q=>rectsApart(P,Q,1)))continue;
          const lot=Object.assign(frame(ux,uz,sx,sz,2.8,2.8+D,a1-W,a1),{w:W,d:D,row:0,street:null,k:-3,plot:'inn'});P.type='inn';P.lot=lot;out.push(P);break outer;}}
      return out;}
    if(useGrid){
      const G=site.kind==='city'?38:site.kind==='village'?17:site.kind==='port'?22:34; // block size; villages/ports one row per side
      const nmax=Math.floor((inner-6)/G);
      for(let k=-nmax;k<=nmax;k++){
        streetLines.push({px:cx+bx*k*G,pz:cz+bz*k*G,dx:ax,dz:az});   // streets along the axis
        streetLines.push({px:cx+ax*k*G,pz:cz+az*k*G,dx:bx,dz:bz});   // cross streets
      }
      PLOTS=townPlots();
      // draw them (skip the real road's own lines roughly — they overlap harmlessly)
      streetLines.forEach(l=>{
        const half=Math.sqrt(Math.max(0,inner*inner-((l.px-cx)*(l.px-cx)+(l.pz-cz)*(l.pz-cz))));
        if(half<8)return;
        // S193 — where a road already runs along or across the street, the road is the street: the ribbon breaks
        // there rather than doubling it or weaving beside it (the playtest's overlapping patterns)
        let run=[];const flush=()=>{if(run.length>1&&Math.hypot(run[run.length-1].x-run[0].x,run[run.length-1].z-run[0].z)>3)paths.push({w:2.4,pts:[run[0],run[run.length-1]]});run=[];};
        for(let t=-half;t<=half+1e-6;t+=1.5){const x=l.px+l.dx*t,z=l.pz+l.dz*t;const ri=roadInfo(x,z,true);if((ri&&ri.d<ROAD_HALF+1.2+3.5)||inPlot(x,z,1.2))flush();else run.push({x,z});}flush(); /* S1138 — and where a plot stands across it */
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
            if(!offPlots({x:lx,z:lz,w,d,ry},1))continue; /* S1138 — not in the church's or the keep's plot */
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
        if(!offPlots({x:lx,z:lz,w,d,ry:Math.atan2(tx/L,tz/L)},1))continue;
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
      // S1138 — a type with a plot takes it (below): the other lots are sized as if it were not in the list
      const plotAt=PLOTS.map(P=>({P,i:shopTypes.indexOf(P.type)})).filter(q=>q.i>=0).sort((a,b)=>a.i-b.i),sizeTypes=shopTypes.filter((t,i)=>!plotAt.some(q=>q.i===i));
      lots.forEach((lot,i)=>{const t=sizeTypes[i];if(t==='church'){lot.w=Math.max(lot.w,7);lot.d=Math.max(lot.d,9);}else if(t==='castle'){lot.w=14;lot.d=11;}else if(t==='guild_f'||t==='guild_m'){lot.dB=lot.d;lot.w=13;lot.d=11;}}); /* S1275 — dB, the lot's own depth, whose front is its street line at every prosperity */
      const kept=[];
      // S193 — a lot made bigger above (a keep, a guild hall, a church) is checked against the roads again: its corners
      // could reach one (3 of 1,062 buildings in thirty towns stood on a road)
      const lotOnRoad=lot=>{const c=Math.cos(lot.ry),s_=Math.sin(lot.ry);for(let u=-1;u<=1;u+=.5)for(let v=-1;v<=1;v+=.5){const lx=u*lot.w/2,lz=v*lot.d/2;const ri=roadInfo(lot.x+lx*c+lz*s_,lot.z-lx*s_+lz*c,true);if(ri&&ri.d<ROAD_HALF+.6)return true;}return false;};
      lots.forEach(lot=>{const rad=Math.max(lot.w,lot.d)/2+2.0;if(Math.hypot(lot.x-cx,lot.z-cz)>inner-Math.max(lot.w,lot.d)/2-1)return; // whole footprint inside the ring
        if(lot.w*lot.d>60&&lotOnRoad(lot))return;
        if(!offPlots(lot,1))return; /* S1138 — a lot made bigger above may reach a plot */
        if(kept.some(k=>Math.hypot(k.x-lot.x,k.z-lot.z)<Math.max(k.w,k.d)/2+2.0+rad))return;kept.push(lot);});
      const use=kept.slice(0,Math.max(want,0)); // homes fill whatever the shops don't
      // S1138 — a Gatelands town's guild hall becomes the kit's hall on the new look (S1083, below): where the hall would not stand on its
      // lot for a plot's yard, the guild changes places with the first home whose lot it would stand on. Asked on both looks, so the
      // two lay the town out alike; the question is the hall pass's own (14.4 by 9 m, its front kept, slid by up to 0.7 m).
      if(PLOTS.length&&nationOf(ni,nj).people==='gatelander'&&(site.kind==='town'||site.kind==='city')){
        const near=(l,own)=>{let m=1e9;for(const q of plotC(l,0)){m=Math.min(m,inner-1-Math.hypot(q.x-cx,q.z-cz));const ri=roadInfo(q.x,q.z,true);if(ri)m=Math.min(m,ri.d-ROAD_HALF-1.2);
            for(const L of streetLines){if(own&&L.px===own.px&&L.pz===own.pz&&L.dx===own.dx&&L.dz===own.dz)continue;m=Math.min(m,Math.abs((q.x-L.px)*(-L.dz)+(q.z-L.pz)*L.dx)-1.6);}}return m;};
        const hallFits=l=>{const sh=(l.d-9)/2,m0=Math.min(0,near(l,l.street));for(const sl of [0,.35,-.35,.7,-.7]){const h=Object.assign({},l,{w:14.4,d:9,x:l.x+l.tx*sh+l.tz*sl,z:l.z+l.tz*sh-l.tx*sl});
            if(near(h,l.street)>=m0-1e-6&&use.every(u=>u===l||rectsApart(h,Object.assign({},u,{w:u.w+1.2,d:u.d+1.2}),.6))&&offPlots(h))return true;}return false;};
        sizeTypes.forEach((t,i)=>{if((t!=='guild_f'&&t!=='guild_m')||i>=use.length||hallFits(use[i]))return;const j=use.findIndex((l,k)=>k>=sizeTypes.length&&hallFits(l));if(j>0){const q=use[i];use[i]=use[j];use[j]=q;}});}
      // ports: the shipwright gets its own lot at the quay head, door toward the quay
      if(site.kind==='port'&&site.quayStart){const si=shopTypes.indexOf('shipwright');const sd=shoreDir(site);
        if(si>=0&&sd){const q=site.quayStart;const lx=site.shipwrightLot?site.shipwrightLot.x:q.x-sd.dx*9-sd.dz*11,lz=site.shipwrightLot?site.shipwrightLot.z:q.z-sd.dz*9+sd.dx*11;const tx=-(-sd.dz),tz=-(sd.dx);
          const lot={x:lx,z:lz,w:7,d:6,ry:Math.atan2(tx,tz),tx,tz,row:0,street:null,two:true,k:'sw'};
          shopTypes.splice(si,1);shopTypes.unshift('shipwright');use.unshift(lot);}}
      // S1320 (card F9, Michael's 1 A and 2 B on #602) — on the new look an Aurennais port's first inn is Aurenne's tavern with its rooms,
      // on its own lot across the quay head from the shipwright (site.tavernLot, padded when the cell loaded): the lot's front is the
      // terrace's gate toward the town, 9.8 m across the tavern's width, 14.1 m from its back wall to the terrace's quay wall. A lot it
      // would stand on gives way (a shop's swaps with the last home that is clear of it, a home's is let go)
      if(site.tavernLot&&window.OG_LOOK==='new'&&window.OG_KIT_TOWNS!==false&&typeof PKIT!=='undefined'&&PKIT.au&&PKIT.au.tavern&&nationOf(ni,nj).people==='aurennais'&&site.kind in KIT_SITE){ /* the kit's own test, below */const ii=shopTypes.indexOf('inn'),T=site.tavernLot;
        if(ii>=0){const lot={x:T.x,z:T.z,w:14.1,d:9.8,ry:Math.atan2(T.N.x,T.N.z),tx:T.N.x,tz:T.N.z,row:0,street:null,two:true,k:'tv'},off=u=>rectsApart(lot,u,.6);
          const nS=shopTypes.length-PLOTS.filter(P=>shopTypes.includes(P.type)).length /* the shops' lots so far: a plot's goes in below */;
          shopTypes.splice(ii,1);shopTypes.unshift('inn');use.unshift(lot); /* as the shipwright's: the lots after it each pass one place on */
          for(let k=1;k<nS&&k<use.length;k++){if(off(use[k]))continue;let j=use.length-1;while(j>=nS&&!off(use[j]))j--;if(j<nS)break;const q=use[k];use[k]=use[j];use[j]=q;}
          for(let k=use.length-1;k>=nS;k--)if(!off(use[k]))use.splice(k,1);}}
      PLOTS.map(P=>({P,i:shopTypes.indexOf(P.type)})).filter(q=>q.i>=0).sort((a,b)=>a.i-b.i).forEach(({P,i})=>use.splice(Math.min(i,use.length),0,Object.assign({},P.lot))); /* S1138 — the church and the keep on their plots, at their places in the list (after the shipwright's, which moves it) */
      return {r,use,shopTypes,hero,lots};}
    const PL=planLots(TST?prosperity(site):0,true);const use=PL.use,shopTypes=PL.shopTypes,hero=PL.hero;r=PL.r;
    {const base=TST?planLots(baseProsperity(site),false).use:use;const at=new Map();base.forEach((l,i)=>at.set(l.k,i));
      const idOf=l=>{l.n=at.has(l.k)?at.get(l.k):1000+(typeof l.k==='number'?l.k:0);return `g_${site.id}_${l.n}`;};
      // every lot this build could use, in order; your own house is never dropped for want of lots nor given to a shop
      const all=PL.lots;all.forEach(l=>l.id=idOf(l));use.forEach(l=>l.id=idOf(l));
      const mine=l=>ownedHouse(l.id);
      all.forEach(l=>{if(mine(l)&&!use.some(u=>u.k===l.k)&&!use.some(u=>Math.hypot(u.x-l.x,u.z-l.z)<Math.max(u.w,u.d)/2+2+Math.max(l.w,l.d)/2+2))use.push(l);});
      const nS=shopTypes.length;for(let i=0;i<Math.min(nS,use.length);i++){if(!mine(use[i]))continue;const j=use.findIndex((u,k)=>k>=nS&&!mine(u));if(j<0)break;const o=use[i];use[i]=use[j];use.splice(j,1);use.push(o);}}
    // S1065 (card F6, Michael's C on #396) — on the new look a Gatelander settlement's lots are widened to whole bays of the
    // kit's plans (PKIT.gl.BAYS): a village's homes and shops are cottages, a town's, port's or city's homes townhouses and its
    // shops merchants' houses. A lot keeps its centre, its depth, its place in the town and so its id; it grows along the street
    // from 5–7 m toward 6–10 m, a bay at a time, and gives a bay back while it would come within 1.2 m of another lot, a road,
    // a cross street or the ring. Churches, keeps, inns, the shipwright and the foreign quarter keep their size (a guild hall takes the kit's, below).
    // (window.OG_KIT_TOWNS=false keeps the old towns on the new look: tests/lookpair sets it to compare the renderers alone)
    if(window.OG_LOOK==='new'&&window.OG_KIT_TOWNS!==false&&typeof PKIT!=='undefined'&&['gatelander','markman','aurennais'].includes(nationOf(ni,nj).people)&&site.kind in KIT_SITE){
      const MK=nationOf(ni,nj).people==='markman',AU=nationOf(ni,nj).people==='aurennais',town=KIT_SITE[site.kind]==='town',G=PKIT.gl,corners=(l,m)=>{const c=Math.cos(l.ry),s_=Math.sin(l.ry),hw=l.w/2+m,hd=l.d/2+m;return [[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(([u,v])=>({x:l.x+u*c+v*s_,z:l.z-u*s_+v*c}));};
      const apart=(a,b)=>{const A=corners(a,.6),B=corners(b,.6);for(const P of [A,B])for(let k=0;k<2;k++){const ax=P[k+1].x-P[k].x,az=P[k+1].z-P[k].z;const pr=Q=>Q.map(q=>q.x*ax+q.z*az);const pa=pr(A),pb=pr(B);if(Math.max(...pa)<Math.min(...pb)||Math.max(...pb)<Math.min(...pa))return true;}return false;};
      const clear=(l,own)=>{const C=corners(l,0);for(const q of C){if(Math.hypot(q.x-cx,q.z-cz)>inner-1)return false;const ri=roadInfo(q.x,q.z,true);if(ri&&ri.d<ROAD_HALF+1.2)return false;
          for(const L of streetLines){if(own&&L.px===own.px&&L.pz===own.pz&&L.dx===own.dx&&L.dz===own.dz)continue;if(Math.abs((q.x-L.px)*(-L.dz)+(q.z-L.pz)*L.dx)<1.6)return false;}}
        for(const u of use)if(u!==l&&!apart(l,u))return false;return offPlots(l);}; /* S1138 — nor into a plot's yard */
      // S1083 (card F6, Michael's C on #352) — a town's guild hall is the kit's guild hall, 14.4 by 9 m: the lot takes the plan's size
      // with its front kept on the street line (the centre moves back toward the street by what the depth gives up), so its door, id
      // and steward stay where they were. A lot with no room for the wider front keeps the old hall.
      // A guild lot often stood nearer a road or a street than a widened house may (the old builder's 13 by 11 m): it takes the hall
      // if it comes no nearer to one than it was and stays clear of every other lot, slid along its front by up to the 0.7 m it grows
      // at each end if that clears a street beside it (kit.slide, which its door moves by too).
      const near=(l,own)=>{let m=1e9;for(const q of corners(l,0)){m=Math.min(m,inner-1-Math.hypot(q.x-cx,q.z-cz));const ri=roadInfo(q.x,q.z,true);if(ri)m=Math.min(m,ri.d-ROAD_HALF-1.2);
          for(const L of streetLines){if(own&&L.px===own.px&&L.pz===own.pz&&L.dx===own.dx&&L.dz===own.dz)continue;m=Math.min(m,Math.abs((q.x-L.px)*(-L.dz)+(q.z-L.pz)*L.dx)-1.6);}}return m;};
      // S1286 (card F6, Michael's C on #277 and A on #285) — a Markish settlement's homes and shops are the kit's halls (PKIT.mk.hall), their
      // gables to the street, roofed by PKIT.mk.lot keyed by the town and the lot's id: two in three dark shingle, one in three dry turf on
      // the poorer, smaller hall. The lot becomes the hall's footing and its stone steps (1.8 m out from the door, 3.35 under a porch), its
      // front kept on the street line, so the door's place, the id and the resident stay where they were and you knock at the steps' foot.
      // The prototype's halls run 8.5 to 14.5 m deep; a town's rows stand 10.7 m apart, so a hall is as deep as fits, down to 6.5 m, and as
      // wide as fits, down to 5.6 m. Churches, keeps, guild halls, inns, the shipwright and the foreign quarter keep the old builder.
      // S1287 (Michael's B on #259) — an Aurennais settlement's the same way, with the kit's house (PKIT.au.house) by PKIT.au.lot: two in
      // three flat-roofed behind a parapet, one in three Roman under a hipped pantile roof, an arcade on the wider. The lot is its plinth, the
      // outside stair up the side wall where it has one, and before the front its pot (0.71 m out) or its arcade (2.46 m); 5.4 m wide or
      // more, 5 m deep or more. A stair or an arcade that will not fit is left off before the house gives way to the old one.
      // S1288 (card F9, Michael's A on #321 and #588) — a Markish inn is the alehall: outside the kit's hall under shingle with its porch
      // and carved gables, no chimney (the long hearth smokes through the louver), as large as fits up to the prototype's 10 by 18 m and no
      // smaller than 7 by 10; inside always PKIT.mk.alehall at 10 by 18 (buildKitAlehall), its six places on the wall benches let by the
      // keeper's bench lines (lot.kit.alehall, which innBench reads). An inn lot with no room for the hall keeps the old inn and its rooms.
      // S1305 — an Aurennais town's church on its plot is the Church of the Weaver (the plot was laid for it, so it fits by construction)
      if(AU&&town)use.forEach((lot,i)=>{if(shopTypes[i]==='church'&&lot.plot==='church'&&lot.au)lot.kit={kind:'aurchurch',w0:lot.w,d0:lot.d};});
      // S1320 — the tavern's lot (planLots, above) is the tavern's ground: the kit builds it whole (kitAurTavern)
      if(AU)use.forEach((lot,i)=>{if(lot.k==='tv'&&shopTypes[i]==='inn')lot.kit={kind:'aurtavern',w0:lot.w,d0:lot.d};});
      if(MK||AU)use.forEach((lot,i)=>{const t=shopTypes[i]||null,inn=MK&&t==='inn';if(t&&!KIT_SHOPS.has(t)&&!inn)return;if(lot.k==='sw'||(site.kind==='port'&&site.quayStart&&Math.hypot(lot.x-site.quayStart.x,lot.z-site.quayStart.z)<34))return;
        const o1=(MK?PKIT.mk:PKIT.au).lot(site.id,lot.n).o,o0=inn?Object.assign({},o1,{roof:'shingle',porch:true,chimney:false,carve:true,w:10,d:18}):o1,w0=lot.w,d0=lot.d,x0=lot.x,z0=lot.z,W0=inn?7:MK?5.6:5.4,D0=inn?10:MK?6.5:5;
        // what stands round the house, by side: [back, front, the -x side, the +x side]
        const ext=o=>MK?[.15,o.porch?3.35:1.8,.15,.15]:[.08,o.kind==='tile'&&o.arcade?2.46:.71,o.stair&&o.kind!=='tile'?.95:.08,.08];
        const vars=MK?(o0.porch?[o0,{...o0,porch:false}]:[o0]):[o0,...(o0.stair?[{...o0,stair:false}]:[]),...(o0.arcade?[{...o0,arcade:false}]:[])];
        // an apron of 1.8 m before the front is kept clear of every other lot, and this lot of every other kit house's apron, so no door looks onto a wall
        const ap=l=>({x:l.x+l.tx*.9,z:l.z+l.tz*.9,w:l.w,d:l.d+1.8,ry:l.ry,tx:l.tx,tz:l.tz}),apK=u=>u.kit&&(u.kit.kind==='markhall'||u.kit.kind==='aurhouse');
        const fit=(w,d,E)=>{const D=d+E[0]+E[1],sh=(d0-D)/2;lot.w=w+E[2]+E[3];lot.d=D;lot.x=x0+lot.tx*sh;lot.z=z0+lot.tz*sh;if(!clear(lot,lot.street))return false;const A=ap(lot);
          return use.every(u=>u===lot||(apart(A,u)&&!(apK(u)&&!apart(lot,ap(u)))));};
        // the widest that fits at the least depth, then the deepest at that width (each halved to within 5 cm: a house that fits fits smaller)
        const most=(lo,hi,ok)=>{if(ok(hi))return hi;while(hi-lo>.05){const m=(lo+hi)/2;if(ok(m))lo=m;else hi=m;}return Math.floor(lo*100)/100;};
        for(const v of vars){const E=ext(v);if(!fit(W0,D0,E))continue;const w=most(W0,v.w,q=>fit(q,D0,E)),d=most(D0,v.d,q=>fit(w,q,E));
          if(!fit(w,d,E))continue;const o=Object.assign({},v,{w,d});lot.kit={kind:MK?'markhall':'aurhouse',o,ext:E,w0,d0};if(MK)lot.kit.stoop=E[1];if(inn)lot.kit.alehall=true;return;}
        lot.w=w0;lot.d=d0;lot.x=x0;lot.z=z0;});
      else{
      // S1275 — its front goes first on the lot's own street line (dB: planLots grew a guild's lot to 13 by 11 m about its centre, which
      // brought that front 2.5–3 m nearer the street), so the hall stands where the house a poorer town puts on the lot stands, and the
      // lot's footprint no longer jumps with the town's fortunes (tests/placesave); where it will not fit there, on the grown lot's front.
      if(town)use.forEach((lot,i)=>{const t=shopTypes[i];if(t!=='guild_f'&&t!=='guild_m')return;const P=G.PLANS.guildhall(),w0=lot.w,d0=lot.d,x0=lot.x,z0=lot.z,m0=Math.min(0,near(lot,lot.street));
        lot.w=P.w;lot.d=P.d;for(const dF of [...new Set([lot.dB||d0,d0])]){const sh=(dF-P.d)/2;for(const sl of [0,.35,-.35,.7,-.7]){lot.x=x0+lot.tx*sh+lot.tz*sl;lot.z=z0+lot.tz*sh-lot.tx*sl;
          if(near(lot,lot.street)>=m0-1e-6&&use.every(u=>u===lot||apart(lot,u))&&offPlots(lot)){lot.kit={kind:'guildhall',guild:t==='guild_m'?'mages':'fighters',w0,d0,slide:sl};return;}}}
        lot.w=w0;lot.d=d0;lot.x=x0;lot.z=z0;});
      // (S1138: the bays after the guild halls, so a widened house never takes the room a hall needs)
      use.forEach((lot,i)=>{const t=shopTypes[i]||null;if(t&&!KIT_SHOPS.has(t))return;if(lot.k==='sw'||(site.kind==='port'&&site.quayStart&&Math.hypot(lot.x-site.quayStart.x,lot.z-site.quayStart.z)<34))return;
        let kind=!town?'cottage':t?'merchant':'townhouse';const w0=lot.w,start=k=>{const B=G.BAYS[k];return Math.max(k==='townhouse'?3:B.min,Math.min(B.max,Math.round((6+(w0-5)*2-2*B.end)/B.bay)));};let n=start(kind);const lo=kind==='townhouse'?3:G.BAYS[kind].min; /* the nearest whole bays to 6, 8 or 10 m */
        for(;;){for(;n>=lo;n--){lot.w=G.bayWidth(kind,n);if(clear(lot,lot.street))break;}if(n>=lo||kind!=='merchant')break;kind='townhouse';n=start(kind);} /* a shop with no room for three bays of shop front is a townhouse's front */
        if(n<lo){for(n=lo-1;n>=G.BAYS[kind].min;n--){lot.w=G.bayWidth(kind,n);if(clear(lot,lot.street))break;}}
        if(n<G.BAYS[kind].min){lot.w=w0;return;}
        lot.kit={kind,bays:n,w0};});
      // S1086 (card F6, Michael's 1 A on #320) — a village's or an outpost's inn is the kit's farmhouse, "a house that takes guests":
      // three bays (10.5 by 6.2 m), or two (7.4 m) where three will not fit, its front kept on the street line as a guild hall's is and
      // slid along it by up to 0.6 m. A town's inn waits for the coaching inn, a piece of its own; a lot with no room keeps the old inn.
      if(!town)use.forEach((lot,i)=>{if(shopTypes[i]!=='inn')return;const w0=lot.w,d0=lot.d,x0=lot.x,z0=lot.z,m0=Math.min(0,near(lot,lot.street));
        for(const n of [3,2]){const P=G.bayPlan('farmhouse',n),sh=(d0-P.d)/2;lot.w=P.w;lot.d=P.d;
          for(const sl of [0,.3,-.3,.6,-.6]){lot.x=x0+lot.tx*sh+lot.tz*sl;lot.z=z0+lot.tz*sh-lot.tx*sl;
            if(near(lot,lot.street)>=m0-1e-6&&use.every(u=>u===lot||apart(lot,u))&&offPlots(lot)){lot.kit={kind:'farmhouse',bays:n,inn:true,w0,d0,slide:sl};return;}}}
        lot.w=w0;lot.d=d0;lot.x=x0;lot.z=z0;});
      // S1127 (card F6, Michael's B on #410) — a town's church is the kit's church with a west tower, 8.4 m wide and 27.4 m from the
      // tower's face to the chancel's gable (22.6 with a nave of two bays). It is tried end-on, the tower's door to the street, then
      // side-on along the street with a south door, at three bays and then two; its front kept on the street line, slid along it by up
      // to 3 m, no nearer a road or a street than the lot was and clear of every other lot. A lot with no room for it keeps the old church.
      if(town)use.forEach((lot,i)=>{if(shopTypes[i]!=='church')return;if(lot.plot==='church'){lot.kit={kind:'church',bays:lot.bays,side:false,w0:lot.w,d0:lot.d,slide:0};return;} /* S1138 — on its plot it fits by construction */
        const w0=lot.w,d0=lot.d,x0=lot.x,z0=lot.z,m0=Math.min(0,near(lot,lot.street));
        for(const [bays,side] of [[3,false],[3,true],[2,false],[2,true]]){const L=G.churchLen(bays),W=side?L:8.4,D=side?8.4:L,sh=(d0-D)/2;lot.w=W;lot.d=D;
          for(const sl of [0,.5,-.5,1,-1,2,-2,3,-3]){lot.x=x0+lot.tx*sh+lot.tz*sl;lot.z=z0+lot.tz*sh-lot.tx*sl;
            if(near(lot,lot.street)>=m0-1e-6&&use.every(u=>u===lot||apart(lot,u))&&offPlots(lot)){lot.kit={kind:'church',bays,side,w0,d0,slide:sl};return;}}}
        lot.w=w0;lot.d=d0;lot.x=x0;lot.z=z0;});
      // S1339 (card F6, Michael's A on #411) — a town's or city's first inn on its plot (townPlots) is the kit's coaching inn (PKIT.gl.coachInn):
      // the plot's lot is the whole, 17.6 by 23 m, so the yard is held while the houses after it grow (below); only then is the lot the inn's
      // own front, 12.6 by 9 m (its solid, door and room), and kit.at the whole's middle, which kitCoachInn builds from.
      const CI={iu:-2.5,iv:7,iw:12.6,id:9}; /* the inn's middle from the whole's, along its front and toward it; its own width and depth */
      if(town)use.forEach((lot,i)=>{if(shopTypes[i]==='inn'&&lot.plot==='inn')lot.kit={kind:'coachinn',w0:lot.w,d0:lot.d};}); /* on its plot it fits by construction */
      // S1143 (card F6, Michael's B on #416) — a city's keep on its plot is the kit's tower house in its bawn (PKIT.gl.keep 'bawn'),
      // the bawn centred on the plot (with its flankers, 29.7 by 24.6 m in the plot's 30 by 25) and its gate toward the heart. The keep's
      // lot becomes the tower's own footprint (11 by 8.5 m in the bawn's back west corner), so its solid, its door (the tower's) and its
      // steward are the tower's; its id is the plot's, and its room the old keep's (house.w and d stay 14 by 11). The group is built here,
      // once, to measure it, and kept for kitKeep; the footpath runs from the tower's door out through the gate.
      if(town)use.forEach((lot,i)=>{if(shopTypes[i]!=='castle'||lot.plot!=='castle')return;const P=PLOTS.find(q=>q.type==='castle');if(!P)return;
        const K=G.keep({kind:'bawn',r:PKIT.stream(`${site.id}:windows:keep`)}),U=K.userData,B=U.size.bawn,T=U.size.tower;K.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(K);
        const ox=-(bb.min.x+bb.max.x)/2,oz=-(bb.min.z+bb.max.z)/2,c=Math.cos(P.ry),s_=Math.sin(P.ry),Ox=P.x+ox*c+oz*s_,Oz=P.z-ox*s_+oz*c,at=(u,v)=>({x:Ox+u*c+v*s_,z:Oz-u*s_+v*c});
        const tu=-B.w/2+T.w/2,tv=-B.d/2+T.d/2,tc=at(tu,tv),dx=U.towerDoor.x,gx=U.size.gate.x;
        const rr=Math.max(...[[bb.min.x,bb.min.z],[bb.max.x,bb.min.z],[bb.max.x,bb.max.z],[bb.min.x,bb.max.z]].map(([u,v])=>Math.hypot(u-tu,v-tv)));
        kitPre.set(lot,K);lot.kit={kind:'keep',w0:lot.w,d0:lot.d,slide:0,at:{x:Ox,z:Oz},tu,tv,r:rr,bb:[bb.min.x+ox,bb.max.x+ox,bb.min.z+oz,bb.max.z+oz].map(v=>+v.toFixed(2)),path:[at(tu+dx,tv+T.d/2+.3),at(gx,B.d/2-B.t-.8),at(gx,B.d/2+1.2)]};
        lot.x=tc.x;lot.z=tc.z;lot.w=T.w;lot.d=T.d;});
      // S1126 (card F6, Michael's B on #408) — a town's townhouse or merchant's house grows back into its yard to 8 m deep where the
      // row behind allows, else as deep as fits, in steps of 0.25 m; its front stays on the street line (the centre moves back by half
      // what it gains), so its door, id and resident stay where they were. Last, so no guild hall or inn loses a lot it took.
      if(town)use.forEach(lot=>{const k=lot.kit;if(!k||(k.kind!=='townhouse'&&k.kind!=='merchant'))return;const d0=lot.d,x0=lot.x,z0=lot.z;
        for(let d=8;d>d0+1e-6;d-=.25){const sh=(d0-d)/2;lot.d=d;lot.x=x0+lot.tx*sh;lot.z=z0+lot.tz*sh;if(clear(lot,lot.street)){k.d0=d0;return;}}
        lot.d=d0;lot.x=x0;lot.z=z0;});
      // S1339 — the coaching inn's lot becomes the inn's own footprint, its front where the whole's is (its solid, door and room are the
      // inn's; kit.at is the whole's middle, which kitCoachInn builds from)
      if(town)use.forEach(lot=>{const k=lot.kit;if(!k||k.kind!=='coachinn')return;k.at={x:lot.x,z:lot.z};
        lot.x+=lot.tz*CI.iu+lot.tx*CI.iv;lot.z+=-lot.tx*CI.iu+lot.tz*CI.iv;lot.w=CI.iw;lot.d=CI.id;});}}
    // S1072 (card F6) — a widened lot's house is the kit's plan on its bays, at the lot's depth (PKIT.gl.lot keyed by the town and
    // the lot's id, so its colours, paint and lit windows are the same at every visit). The houses stand in one group at the town's
    // centre, merged at the end into one mesh per material (PKIT.mergeByMaterial), so a town of them is some twenty draws.
    const KIT_TRADE={weapon:'ARMS · BLADES · BOWS',armor:'ARMOUR · MAIL · SHIELDS',potion:'APOTHECARY · HERBS',misc:'GENERAL GOODS',barber:'BARBER · SURGEON'};
    let kitG=null;const kitLo=[];
    // a gable roof as one prism: eaves at y0 along ±hw (x) and ±hd (z), the ridge at y1 along x, its gables closed (non-indexed, for mergeGeos)
    function kitRoof(hw,hd,y0,y1){const P=[[-hw,y0,hd],[hw,y0,hd],[hw,y1,0],[-hw,y0,hd],[hw,y1,0],[-hw,y1,0],[hw,y0,-hd],[-hw,y0,-hd],[-hw,y1,0],[hw,y0,-hd],[-hw,y1,0],[hw,y1,0],[-hw,y0,-hd],[-hw,y0,hd],[-hw,y1,0],[hw,y0,hd],[hw,y0,-hd],[hw,y1,0]];
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P.flat()),3));g.computeVertexNormals();return g;}
    // S1083 — the guild hall's plan, its lit windows keyed by the town and the lot as a house's are; its door is the great door
    function kitHall(lot){const plan=PKIT.gl.PLANS.guildhall({guild:lot.kit.guild});plan.r=PKIT.stream(`${site.id}:windows:${lot.n}`);plan.doorX=plan.open.front[0].x;return {plan,kind:'guildhall',colour:'stone'};}
    // S1127 — the church with its west tower (PKIT.gl.church, in its lot's frame): its far copy a box for the nave and chancel under one
    // roof prism and a box for the tower; its door the tower's or, side-on, the nave's south door
    function kitChurch(lot){const C=PKIT.gl.church({bays:lot.kit.bays,side:lot.kit.side,r:PKIT.stream(`${site.id}:windows:${lot.n}`)}),U=C.userData,y=worldH(lot.x,lot.z)-.06;
      C.position.set(lot.x-cx,y,lot.z-cz);C.rotation.y=lot.ry;C.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});kitG.add(C);
      const sz=U.size,T=sz.tower,mx=new THREE.Matrix4().makeRotationY(lot.ry).setPosition(lot.x,y,lot.z),stone=new THREE.Color(.78,.76,.71);
      {const b=new THREE.BoxGeometry(sz.w,sz.eave,sz.d).toNonIndexed();b.translate(0,sz.eave/2,0);kitLo.push([b,mx,stone]);}
      {const r=lot.kit.side?kitRoof(sz.w/2,sz.d/2+.3,sz.eave,sz.eave+4.6):kitRoof(sz.d/2,sz.w/2+.3,sz.eave,sz.eave+4.6);if(!lot.kit.side)r.rotateY(Math.PI/2);kitLo.push([r,mx,new THREE.Color(.24,.26,.30)]);}
      {const b=new THREE.BoxGeometry(T.s,T.h,T.s).toNonIndexed();b.translate(lot.kit.side?T.at:0,T.h/2,lot.kit.side?0:T.at);kitLo.push([b,mx,stone]);}
      lot._kitDoor=U.door;lot._wallH=sz.eave;lot._storeys=1;lot.two=false;lot.kit.tris=U.tris;lot.kit.calls=U.calls;lot.kit.colour='stone';lot.kit.door=U.door+(lot.kit.slide||0);
      if(lot.gods)kitGods(lot.gods);}
    // S1232 (card F6, Michael's B on #464) — the six gods' row of seven in the church's yard (PKIT.gl.row): its plinths one solid and
    // each basin one, each niche on its own ground (a row on a slope steps down it), no far copy (it is 2.3 m high); S.gods keeps where it stands, its niches and its basins for the tests
    // S1329 — Aurenne's (at.island): its railing either side of the gate, its two piers and the tithe box solids too
    function kitGods(at){const c=Math.cos(at.ry),s_=Math.sin(at.ry),w=(u,v)=>({x:at.x+u*c+v*s_,z:at.z-u*s_+v*c}),y=worldH(at.x,at.z)-.02,R=PKIT.gl.row({island:at.island,ground:[0,1,2,3,4,5,6].map(i=>{const q=w((i-3)*1.4,-.2);return worldH(q.x,q.z)-.02-y;})}),F=R.foot;
      R.group.position.set(at.x-cx,y,at.z-cz);R.group.rotation.y=at.ry;kitG.add(R.group);
      const box=(x0,x1,z0,z1)=>{const m=w((x0+x1)/2,(z0+z1)/2);sol.push({cx:m.x,cz:m.z,rx:(x1-x0)/2,rz:(z1-z0)/2,c,s:s_,bt:'wall'});};box(F.x0,F.x1,F.z0,F.z1);
      if(R.rail){const L=R.rail;box(L.x0,L.gap-.52,L.z-L.t,L.z+L.t);box(L.gap+.52,L.x1,L.z-L.t,L.z+L.t);R.piers.forEach(q=>box(q.x0,q.x1,q.z0,q.z1));box(R.tithe.x-.2,R.tithe.x+.2,R.tithe.z-.15,R.tithe.z+.15);}
      const niches=R.niches.map(n=>{const b=n.basin&&w(n.basin[0],n.basin[2]),p=w(n.pray[0],n.pray[1]);if(b)sol.push({cx:b.x,cz:b.z,rx:.2,rz:.2,c,s:s_,bt:'wall'});return {god:n.god,dy:n.dy,x:w(n.x,0).x,z:w(n.x,0).z,basin:b&&{x:b.x,y:y+n.basin[1],z:b.z},pray:p};});
      S.gods={x:at.x,z:at.z,ry:at.ry,y,len:R.len,tris:R.tris,draws:R.draws,niches,island:R.island,rail:R.rail};}
    // S1143 — the keep in its bawn (PKIT.gl.keep, measured and kept at the plan): the bawn on the plot, the tower its lot; the bawn's walls,
    // flankers, house and well are solids (the gateway open) that carry no house id, so the map draws them as walls; its far copy a box and
    // a roof prism for the tower and a box for each wall, flanker and the house
    function kitKeep(lot){const K=kitPre.get(lot),U=K.userData,B=U.size.bawn,T=U.size.tower,k=lot.kit,y=worldH(k.at.x,k.at.z)-.06,c=Math.cos(lot.ry),s_=Math.sin(lot.ry);kitPre.delete(lot);
      K.position.set(k.at.x-cx,y,k.at.z-cz);K.rotation.y=lot.ry;K.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});kitG.add(K);
      const mx=new THREE.Matrix4().makeRotationY(lot.ry).setPosition(k.at.x,y,k.at.z),stone=new THREE.Color(.70,.68,.63),hw=B.w/2,hd=B.d/2,t=B.t,g=U.size.gate,R=2.25;
      const rects=[[-hw,g.x-g.w/2,hd-t,hd,B.h],[g.x+g.w/2,hw,hd-t,hd,B.h],[-hw,-hw+t,-hd+T.d,hd-t,B.h],[hw-t,hw,-hd,hd-t,B.h],[-hw+T.w,hw,-hd,-hd+t,B.h], /* the walls: the front either side of the gateway, west, east and back */
        ...[-1,1].map(sx=>[sx*(hw-.4)-R,sx*(hw-.4)+R,hd-.4-R,hd-.4+R,6.5]),[hw-t-5.5,hw-t,1.5-6,1.5+6,3.0],[3.1,4.9,-2.9,-1.1,0]]; /* the flankers, the bawn house against the east wall (12 by 5.5 m), the well */
      for(const [u0,u1,v0,v1,h] of rects){const u=(u0+u1)/2,v=(v0+v1)/2;sol.push({cx:k.at.x+u*c+v*s_,cz:k.at.z-u*s_+v*c,rx:(u1-u0)/2,rz:(v1-v0)/2,c,s:s_,bt:'wall'});
        if(h){const b=new THREE.BoxGeometry(u1-u0,h,v1-v0).toNonIndexed();b.translate(u,h/2,v);kitLo.push([b,mx,stone]);}}
      {const b=new THREE.BoxGeometry(T.w,T.walk,T.d).toNonIndexed();b.translate(k.tu,T.walk/2,k.tv);kitLo.push([b,mx,stone]);const rf=kitRoof(T.w/2,T.d/2,T.walk,T.walk+T.d/2*Math.tan(50*Math.PI/180));rf.translate(k.tu,0,k.tv);kitLo.push([rf,mx,new THREE.Color(.24,.26,.30)]);}
      lot._kitDoor=U.towerDoor.x;lot._wallH=T.walk;lot._storeys=4;lot.two=true;k.tris=U.tris;k.calls=U.calls;k.colour='stone';k.door=lot._kitDoor;}
    // S1339 — the coaching inn (PKIT.gl.coachInn, as #411 A chose it), its render and paint the street's (PKIT.gl.lot keyed by the town and
    // the lot, so it takes its turn in the street's colours), its lit windows keyed as a house's are. Built at the inn's centre and turned
    // with the lot; solids for the gateway's wall either side of the arch, the yard's two walls, the trough and the stable range; its far
    // copy a box and a roof prism for the inn and for the stables and a box for each wall; smoke from both gable stacks.
    function kitCoachInn(lot){const k=lot.kit,L=PKIT.gl.lot(site.id,lot.n,{kind:'townhouse'}),C=PKIT.gl.coachInn({kind:'three',color:L.colour,paint:L.paint,r:PKIT.stream(`${site.id}:windows:${lot.n}`)}),U=C.userData,Z=U.size;
      const y=worldH(lot.x,lot.z)-.06,c=Math.cos(lot.ry),s_=Math.sin(lot.ry);
      C.position.set(lot.x-cx,y,lot.z-cz);C.rotation.y=lot.ry;C.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});kitG.add(C);
      const I=Z.inn,S_=Z.stables,hw=I.w/2,hd=I.d/2,gt=.6,x1=Z.yard.x1+gt,zB=hd-Z.d,g=Z.gate,mx=new THREE.Matrix4().makeRotationY(lot.ry).setPosition(lot.x,y,lot.z),stone=new THREE.Color(.62,.60,.56);
      const rects=[[hw,g.x-g.w/2,hd-gt,hd,4.8],[g.x+g.w/2,x1,hd-gt,hd,4.8],[x1-gt,x1,Z.yard.z1,hd-gt,2.6],[-hw,-hw+gt,Z.yard.z1,-hd,2.6],[x1-2.4,x1-gt,-hd-3.35,-hd-2.65,0],[-hw,x1,zB,zB+S_.d,0]]; /* the gateway's wall either side of the arch, the yard's east and west walls, the trough, the stables */
      for(const [u0,u1,v0,v1,h] of rects){const u=(u0+u1)/2,v=(v0+v1)/2;sol.push({cx:lot.x+u*c+v*s_,cz:lot.z-u*s_+v*c,rx:(u1-u0)/2,rz:(v1-v0)/2,c,s:s_,bt:'wall'});
        if(h){const b=new THREE.BoxGeometry(u1-u0,h,v1-v0).toNonIndexed();b.translate(u,h/2,v);kitLo.push([b,mx,stone]);}}
      const wc=PKIT.gl.mats()['w:'+L.colour],slate=new THREE.Color(.24,.26,.30);
      {const b=new THREE.BoxGeometry(I.w,I.eave,I.d).toNonIndexed();b.translate(0,I.eave/2,0);kitLo.push([b,mx,wc?wc.color.clone().multiplyScalar(.82):new THREE.Color(.8,.78,.72)],[kitRoof(hw+.2,hd+.25,I.eave,I.ridge),mx,slate]);}
      {const su=(x1-hw)/2,sv=zB+S_.d/2,b=new THREE.BoxGeometry(S_.w,S_.eave,S_.d).toNonIndexed(),rf=kitRoof(S_.w/2+.25,S_.d/2+.3,S_.eave,S_.ridge);b.translate(su,S_.eave/2,sv);rf.translate(su,0,sv);kitLo.push([b,mx,stone],[rf,mx,slate]);}
      for(const gx of [-1,1]){const x=gx*(hw-.36);S.chimneys.push({x:lot.x+x*c,y:y+I.ridge+.85,z:lot.z-x*s_,t:'inn',k:0});}
      lot._kitDoor=0;lot._wallH=I.eave;lot._storeys=3;lot.two=true;k.tris=U.tris;k.calls=U.calls;k.colour=L.colour;k.paint=L.paint;k.door=0;}
    // S1286 — a Markish hall (PKIT.mk.hall, its options PKIT.mk.lot's as fitted above; its lit windows keyed by the town and the lot as a
    // house's are): set back on its lot by its steps, the door at the steps' foot on the gable's middle; its far copy a box for the footing
    // and walls and a prism for the roof, its ridge along the hall; smoke from the chimney or the louver
    function kitMarkHall(lot,type){const k=lot.kit,o=k.o,H=PKIT.mk.hall(o,PKIT.stream(`${site.id}:windows:${lot.n}`)),y=worldH(lot.x,lot.z)-.06,hz=lot.d/2-o.d/2-k.stoop,c=Math.cos(lot.ry),s_=Math.sin(lot.ry);
      H.group.position.set(lot.x+hz*s_-cx,y,lot.z+hz*c-cz);H.group.rotation.y=lot.ry;H.group.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});kitG.add(H.group);
      const eave=H.sill+H.wh,ridge=H.ry0+(o.w/2+H.ov)*Math.tan(H.pitch),turf=o.roof==='turf',mx=new THREE.Matrix4().makeRotationY(lot.ry).setPosition(lot.x+hz*s_,y,lot.z+hz*c);
      {const b=new THREE.BoxGeometry(o.w+.3,eave,o.d+.3).toNonIndexed();b.translate(0,eave/2,0);kitLo.push([b,mx,PKIT.mk.mats().wall[o.wall].color.clone().multiplyScalar(.5)]);}
      {const r=kitRoof(o.d/2+(turf?.4:.6),o.w/2+H.ov,H.ry0,ridge);r.rotateY(Math.PI/2);kitLo.push([r,mx,new THREE.Color(...(turf?[.42,.36,.24]:[.16,.15,.15]))]);}
      lot._kitDoor=0;lot._wallH=eave;lot._storeys=1;lot.two=false;k.tris=H.tris;k.calls=H.draws;k.colour=o.roof;k.door=0;
      const sm=o.chimney?{u:-o.w/4,v:-o.d*.25,y:ridge+.95}:{u:0,v:-o.d*.15,y:ridge+.6};S.chimneys.push({x:lot.x+sm.u*c+(hz+sm.v)*s_,y:y+sm.y,z:lot.z-sm.u*s_+(hz+sm.v)*c,t:type||'home',k:0});}
    // S1287 — an Aurennais house (PKIT.au.house, its options PKIT.au.lot's as fitted above; its own stream keyed by the town and the lot):
    // set back on its lot by its pot or its arcade and aside by its stair, the door its own; its far copy a box for the walls (and the
    // parapet on a flat roof) and, on a Roman house, a prism for the roof; no smoke (a southern house cooks in the yard)
    function kitAurHouse(lot){const k=lot.kit,o=k.o,E=k.ext,H=PKIT.au.house(o,PKIT.stream(`${site.id}:windows:${lot.n}`)),y=worldH(lot.x,lot.z)-.06,c=Math.cos(lot.ry),s_=Math.sin(lot.ry),u=(E[2]-E[3])/2,v=lot.d/2-o.d/2-E[1];
      const X=lot.x+u*c+v*s_,Z=lot.z-u*s_+v*c;H.group.position.set(X-cx,y,Z-cz);H.group.rotation.y=lot.ry;H.group.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});kitG.add(H.group);
      const tile=o.kind==='tile',hgt=tile?H.top+.16:H.top+.57,mx=new THREE.Matrix4().makeRotationY(lot.ry).setPosition(X,y,Z);
      {const b=new THREE.BoxGeometry(o.w+.16,hgt,o.d+.16).toNonIndexed();b.translate(0,hgt/2,0);kitLo.push([b,mx,new THREE.Color(.86,.82,.72)]);}
      const cream=new THREE.Color(.86,.82,.72),part=(bw,bh,bd,u,y0,v,col)=>{const b=new THREE.BoxGeometry(bw,bh,bd).toNonIndexed();b.translate(u,y0+bh/2,v);kitLo.push([b,mx,col||cream]);};
      if(o.dome){const R=Math.min(o.w,o.d)*.27;part(2*R,1+R*.9,2*R,-o.w*.18,H.top,-o.d*.1,o.dome==='blue'?new THREE.Color(.25,.42,.62):cream);} /* the drum and the dome, as one block */
      if(tile&&o.arcade){const n=Math.max(3,Math.round(o.w/2.2));part(o.w+.3,2.05+o.w/n/2+.35+H.yW,1.9,0,0,o.d/2+.95);} /* the arcade */
      if(o.stair&&!tile)part(.9,H.top*.6,o.d-.6,-(o.w/2+.5),0,.3); /* the outside stair, its flight as a block of 0.6 of the wall */
      if(tile){const rw=o.w/2+.45,rd=o.d/2+.45,r=rw>=rd?kitRoof(rw,rd,hgt,hgt+Math.tan(22*Math.PI/180)*rd):kitRoof(rd,rw,hgt,hgt+Math.tan(22*Math.PI/180)*rw);if(rw<rd)r.rotateY(Math.PI/2);kitLo.push([r,mx,new THREE.Color(.58,.32,.22)]);}
      lot._kitDoor=+(u+H.doorX).toFixed(3);lot._wallH=+(H.top-H.yW).toFixed(3);lot._storeys=o.two?2:1; /* S1321 — the wall over its floor, the plinth's top (H.yW, 0.24): a storey is floor to eaves, as SCALE's table measures it */lot.two=!!o.two;k.tris=H.tris;k.calls=H.draws;k.colour=o.kind;k.door=lot._kitDoor;}
    // S1305 — the Church of the Weaver (PKIT.au.church, a town's, its own stream keyed by the town), the foot of its steps on the lot's front
    // and its door on the street's line; its far copy a box for the podium and the cube, one for the porch, a block for the drum and
    // the dome, one for the tower and one for its little dome; no smoke
    function kitAurChurch(lot){const o={rank:'town',w:14,tower:1},B=PKIT.au.churchBox(o),C=PKIT.au.church(o,PKIT.stream(`${site.id}:church`)),y=worldH(lot.x,lot.z)-.06,c=Math.cos(lot.ry),s_=Math.sin(lot.ry);
      const u=-(B.x0+B.x1)/2,v=-(B.z0+B.z1)/2,X=lot.x+u*c+v*s_,Z=lot.z-u*s_+v*c,I=C.inner;C.group.position.set(X-cx,y,Z-cz);C.group.rotation.y=lot.ry;C.group.traverse(m=>{if(m.isMesh){m.castShadow=m.name!=='dark';m.receiveShadow=true;}});kitG.add(C.group);
      const mx=new THREE.Matrix4().makeRotationY(lot.ry).setPosition(X,y,Z),lime=new THREE.Color(.9,.88,.82),blue=new THREE.Color(.25,.42,.62),part=(bw,bh,bd,bx,y0,bz,col)=>{const b=new THREE.BoxGeometry(bw,bh,bd).toNonIndexed();b.translate(bx,y0+bh/2,bz);kitLo.push([b,mx,col||lime]);};
      part(I.W+.6,I.top+1.2,I.D+.6,0,0,0);part(I.W+.6,I.pl+4.2+(I.W+.4)/(I.W>16?7:5)/2+.9+.85,4.4,0,0,I.D/2+2.2);part(2*I.R,I.y0+I.dh+I.R*1.12-I.top,2*I.R,0,I.top,0,blue); /* the cube, the porch, the drum and the dome */
      {const s=3.6,tx=I.W/2+s/2+.4,tz=I.D/2+4.4-s/2-.2,ty=B.towerTop-1.1-1.0-s*.44*1.15;part(s,ty,s,tx,0,tz);part(s*.88,B.towerTop-1.1-ty,s*.88,tx,ty,tz,blue);}
      lot._kitDoor=+u.toFixed(3);lot._wallH=I.top;lot._storeys=1;lot.two=false;lot.kit.tris=C.tris;lot.kit.calls=C.draws;lot.kit.colour='lime';lot.kit.door=lot._kitDoor;lot.kit.r=Math.hypot(lot.w,lot.d)/2;
      if(lot.gods)kitGods(lot.gods);}
    // S1320 (card F9, Michael's 1 A and 2 B on #602) — Aurenne's tavern with its rooms upstairs (PKIT.au.tavern, o.rooms) on the quay: the
    // lot's front is the terrace's gate toward the town (o.gate, the tavern's +x side), the terrace and its vine out over the water
    // (F, the lot's -u), the house's back to the quay. Under the loggia and the terrace a quay wall of the terrace's stone down past the
    // sea floor, so the paving never floats where the shore falls away. The solid is the whole lot; you knock at the gate's step. Its far
    // copy a box for the house, a prism for its pantile roof and a low block for the arcade and the terrace; no smoke
    function kitAurTavern(lot){const F={x:-lot.tz,z:lot.tx},T=PKIT.au.tavern(TAVERN_O,PKIT.stream(`${site.id}:tavern`)),ox=lot.x-F.x*2.95,oz=lot.z-F.z*2.95,y=worldH(ox,oz)-.06,ry=Math.atan2(F.x,F.z);
      T.group.position.set(ox-cx,y,oz-cz);T.group.rotation.y=ry;T.group.traverse(m=>{if(m.isMesh){m.castShadow=!['flame','ember','glow'].includes(m.name);m.receiveShadow=true;}});kitG.add(T.group);
      const tr=T.terrace,w=T.w,d=T.d,top=T.ceil[1]+.22;
      {const g=new THREE.BoxGeometry(w+.2,4.5+tr.y-.4,tr.z1+.25-d/2);g.translate(0,(tr.y-.4-4.5)/2,(d/2+tr.z1+.25)/2);const m=new THREE.Mesh(g,PKIT.au.roomMats().step);m.name='quaywall';m.castShadow=true;m.receiveShadow=true;T.group.add(m);}
      const mx=new THREE.Matrix4().makeRotationY(ry).setPosition(ox,y,oz),cream=new THREE.Color(.86,.82,.72),part=(bw,bh,bd,u,y0,v,col)=>{const b=new THREE.BoxGeometry(bw,bh,bd).toNonIndexed();b.translate(u,y0+bh/2,v);kitLo.push([b,mx,col||cream]);};
      part(w+.16,top+.16,d+.16,0,0,0);part(w+.2,tr.parapet,tr.z1-d/2,0,0,(d/2+tr.z1)/2,new THREE.Color(.84,.80,.72)); /* the house; the loggia and the terrace to the parapet's top */
      {const rw=w/2+.45,rd=d/2+.45,r=kitRoof(rw,rd,top+.16,top+.16+Math.tan(22*Math.PI/180)*rd);kitLo.push([r,mx,new THREE.Color(.58,.32,.22)]);}
      lot._kitDoor=-4.2;lot._wallH=top;lot._storeys=2;lot.two=true;lot.kit.tris=T.tris+T.shellTris;lot.kit.calls=T.draws+T.shellCalls;lot.kit.colour='tile';lot.kit.door=lot._kitDoor;lot.kit.F=F;}
    function kitHouse(lot,type){
      if(!kitG){kitG=new THREE.Group();kitG.name='kit houses';kitG.position.set(cx,0,cz);kitG.userData.noBake=true;group.add(kitG);}
      if(lot.kit.kind==='church'){kitChurch(lot);return;}
      if(lot.kit.kind==='keep'){kitKeep(lot);return;}
      if(lot.kit.kind==='markhall'){kitMarkHall(lot,type);return;}
      if(lot.kit.kind==='aurhouse'){kitAurHouse(lot);return;}
      if(lot.kit.kind==='aurchurch'){kitAurChurch(lot);return;}
      if(lot.kit.kind==='aurtavern'){kitAurTavern(lot);return;}
      if(lot.kit.kind==='coachinn'){kitCoachInn(lot);return;}
      const L=lot.kit.kind==='guildhall'?kitHall(lot):PKIT.gl.lot(site.id,lot.n,{kind:lot.kit.kind,bays:lot.kit.bays,d:lot.d,trade:KIT_TRADE[type]});const b=PKIT.gl.building(L.plan),U=b.userData;
      b.position.set(lot.x-cx,worldH(lot.x,lot.z)-.06,lot.z-cz);b.rotation.y=lot.ry;b.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});kitG.add(b);
      {const sz=U.size,th=L.plan.roof.kind==='thatch',wc=PKIT.gl.mats()['w:'+(L.colour==='stone'?'lime':L.colour)],box=new THREE.BoxGeometry(sz.w,sz.eave,sz.d).toNonIndexed(),mx=new THREE.Matrix4(); /* S1073 — its far copy: the walls a box and the roof a prism, in the wall's and the roof's colours */
        box.translate(0,sz.eave/2,0);mx.makeRotationY(lot.ry).setPosition(lot.x,worldH(lot.x,lot.z)-.06,lot.z);
        kitLo.push([box,mx,wc?wc.color.clone().multiplyScalar(.82):new THREE.Color(.8,.78,.72)],[kitRoof(sz.w/2+(th?.35:.2),sz.d/2+(th?.45:.25),sz.eave,sz.ridge),mx,new THREE.Color(...(th?[.42,.35,.22]:[.24,.26,.30]))]);}
      lot._kitDoor=L.plan.doorX||0;lot._wallH=U.size.eave;lot._storeys=L.plan.floors.length;lot.two=L.plan.floors.length>1;lot.kit.tris=U.tris;lot.kit.colour=L.colour;lot.kit.paint=L.paint;lot.kit.door=lot._kitDoor+(lot.kit.slide||0);
      const c=(L.plan.chim||[])[0];if(c){const x=c.gable?c.gable*(U.size.w/2-.36):c.x,y=U.size.ridge+(L.plan.roof.kind==='thatch'?1.0:.85),cs=Math.cos(lot.ry),sn=Math.sin(lot.ry),wy=b.position.y;
        S.chimneys.push({x:lot.x+x*cs,y:wy+y,z:lot.z-x*sn,t:type||'home',k:0});}}
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
      else{lot.two=r()<(st.twoStory||0)||type==='inn';geo=buildingGeo(lot.w,lot.d,st,r,{chimney:r()<.65,twoStory:lot.two,h:type==='inn'?SCALE.STOREY_MAX:st.h,rise:type==='inn'?1.9:st.rise});}
      solR=Math.max(lot.w,lot.d)/2*.85;
      if(lot.kit){kitHouse(lot,type);geo.dispose();if(geo.userData&&geo.userData.lo)geo.userData.lo.dispose();} /* S1072 — the old builder still runs (its draws keep the town's stream, and so its people, as on the old look), and its mesh is let go */
      else{const m=addMesh(geo,lot.x,lot.z,lot.ry,0);
      lot._wallH=geo.userData&&geo.userData.wallH||null;lot._storeys=geo.userData&&geo.userData.storeys||null; /* S881 (F2a) — kept on the house: its wall's height and storeys */
      {const ch=chimneyAt(geo,m,type||'home');if(ch)S.chimneys.push(ch);}} // S343 — its smoke
      // rotated footprint (settleSolid understands {c,s} rotated rects)
      sol.push({cx:lot.x,cz:lot.z,rx:lot.w/2+.15,rz:lot.d/2+.15,c:Math.cos(lot.ry),s:Math.sin(lot.ry),bt:type||'home',hid:lot.id,sh:lot._shuttered?1:0}); // v80 S138 — the map colours it by type
      // footpath: door → the street/road it faces
      {
        const kd=lot._kitDoor||0,fx=lot.x+lot.tx*(lot.d/2+.3)+lot.tz*kd,fz=lot.z+lot.tz*(lot.d/2+.3)-lot.tx*kd; /* S1072 — from a kit house's door */
        let ex=fx+lot.tx*(lot.row*(9.5+LAT_GAP)+(lot.street?2.5:ROAD_BLEND)),ez=fz+lot.tz*(lot.row*(9.5+LAT_GAP)+(lot.street?2.5:ROAD_BLEND));
        const ri=roadInfo(ex,ez);if(ri&&ri.d>ROAD_HALF+1&&!lot.street){const sg=ri.seg,vx=sg.bx-sg.ax,vz=sg.bz-sg.az,t=ri.t;ex=sg.ax+vx*t;ez=sg.az+vz*t;}
        if(lot.k==='sw'&&quayLane){const A=quayLane.a,B=quayLane.b,vx=B.x-A.x,vz=B.z-A.z,L2=vx*vx+vz*vz||1,u=Math.max(0,Math.min(1,((fx-A.x)*vx+(fz-A.z)*vz)/L2));ex=A.x+vx*u;ez=A.z+vz*u;} /* S618 — the yard's path ends on the quay lane */
        footReq.push({fx,fz,ex,ez,lot,hid:`g_${site.id}_${i}`}); // S193 — routed once every building stands (below)
      }
      const kdx=lot._kitDoor||0,doorX=lot.x+lot.tx*(lot.d/2+.15)+lot.tz*kdx,doorZ=lot.z+lot.tz*(lot.d/2+.15)-lot.tx*kdx; /* S1072 — a kit house's door stands in its bay, kdx along the front */
      if(!isShop){
        // Residence: enterable 'home' interior, a named resident who keeps
        // house inside and idles by the door outside in daylight.
        const resident=newName();
        const exX=doorX+lot.tx*2.4,exZ=doorZ+lot.tz*2.4;
        const rdef=makeDef(site,reg,r,'Villager',resident,{nameKey:lot.n,x:doorX+lot.tx*1.4+lot.tz*1.0,z:doorZ+lot.tz*1.4-lot.tx*1.0,bCol:pick(r,[0x5a4030,0x3a5a3a,0x604828,0x504058,0x6a5a3a]),sCol:pick(r,[0xd4a878,0xc09070,0xb08060]),role:pick(r,['resident','farmer','weaver','cooper','old woman','fisher'])});
        rdef.roleTag=rdef.role;rdef.role='Villager';
        const hName=homeName(rdef.name,rdef.roleTag,compassWord(lot.x-site.x,lot.z-site.z));
        const hh={id:lot.id,doorX,doorZ,doorFace:cardinalFace(lot.tx,lot.tz),exitX:exX,exitZ:exZ,exitYaw:Math.atan2(-lot.tx,-lot.tz),name:hName,keeper:rdef.name,_twin:rdef._twin,type:'home',tagline:'',bCol:rdef.bCol,sCol:rdef.sCol,dlg:rdef,w:lot.w,d:lot.d,two:lot.two,reg,style:st===STYLE.stone?'stone':st===STYLE.garrison?'garrison':reg,roleTag:rdef.roleTag,siteKind:site.kind,siteId:site.id,kit:lot.kit||null};
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
      const house={id:lot.id,doorX,doorZ,doorFace:cardinalFace(lot.tx,lot.tz),exitX:exX,exitZ:exZ,exitYaw:Math.atan2(-lot.tx,-lot.tz),name,keeper,type,tagline:heroH?heroH.tagline:pick(r,TAGLINES[type]||TAGLINES.misc),bCol:heroH?heroH.bCol:0x5a4030,sCol:heroH?heroH.sCol:0xd4a878,w:lot.w,d:lot.d,two:lot.two,reg,style:st===STYLE.stone?'stone':st===STYLE.garrison?'garrison':reg,siteKind:site.kind,siteId:site.id,kit:lot.kit||null};
      houses.push(house);if(lot._wallH){house.wallH=lot._wallH;house.storeys=lot._storeys;}
      if(lot.kit&&lot.kit.kind==='keep'){house.w=lot.kit.w0;house.d=lot.kit.d0;} /* S1143 — the steward's room is the old keep's (its lot is the tower's now) */
      { // wall lantern by the door (glow only)
        const lx=doorX+lot.tx*.25+lot.tz*1.05,lz=doorZ+lot.tz*.25-lot.tx*1.05,ly=worldH(doorX,doorZ)+SCALE.DOOR_H+.2;
        {const m=new THREE.Mesh(doorLanternGeo(),VC_MAT);m.position.set(doorX+lot.tz*1.05,ly,doorZ-lot.tx*1.05);m.rotation.y=lot.ry;group.add(m);} // S258 — bracket and cage on the kit
        const lg=new THREE.Group();const pane=new THREE.Mesh(new THREE.BoxGeometry(.12,.17,.12),new THREE.MeshBasicMaterial({color:0xffc860,transparent:true,opacity:.55}));lg.add(pane);
        const fl=new THREE.Mesh(new THREE.ConeGeometry(.03,.09,6),new THREE.MeshBasicMaterial({color:0xffe090}));fl.position.y=-.01;lg.add(fl);lg.position.set(lx,ly,lz);group.add(lg);S.lamps.push({glass:lg,light:null});
      }
      let signY=null; // S246 — the trade sign is painted once the keeper's name is final (below)
      if((type==='guild_f'||type==='guild_m')&&lot.kit){} /* S1083 — the kit's hall carries its own name panel and banner */
      else if(type==='guild_f'||type==='guild_m'){
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
      const def=(type==='guild_f'||type==='guild_m')?guildDef(type,site,keeper,{x:kx,z:kz,bCol:house.bCol,sCol:house.sCol}):makeDef(site,reg,r,role,keeper,{nameKey:lot.n,authored:!!heroH,people:heroH?'gatelander':undefined,x:kx,z:kz,bCol:house.bCol,sCol:house.sCol,topics:type==='shipwright'?[{label:'Browse ships',quest:true,panel:()=>openYardPanel(site)},{label:`What do you sell?`,response:'Hulls. Sound ones. And rope, if you ask nicely.'}]:house.tagline?[{label:`What do you sell?`,response:house.tagline}]:[]}); /* S592 — no topic while the tagline is blank; the barber's has one since Session 735 (the quest writer's Finding 26) */
      def._houseId=house.id; // v80 S138 — who keeps what, by identity (names collide)
      house.keeper=def.name;house._twin=def._twin;if(!heroH&&/'s /.test(house.name||''))house.name=house.name.replace(/^[^']+'s /,def.name+"'s ");
      if(signY!==null)buildTradeSign(group,type,house.name,doorX,doorZ,lot.tx,lot.tz,lot.ry,signY+.3); /* S881 (F2a) — the board's foot at 1.87, over a 1.78 m head (1.57 before) */
      if(type==='shipwright'){const base=def._extra.slice();Object.defineProperty(def,'_extra',{get(){const buy=base[0],rest=base.slice(1);return worldState.ship?[buy,...upgradeTopics(site),...rest]:[buy,...rest];}});}
      if(house.guild||type==='shipwright'||type==='inn'||type==='barber')house.dlg=def; // steward / shipwright / innkeeper talk inside (the innkeeper lets the rooms)
      if(type==='inn'&&innBench(house))def.greeting=INN_BENCH_GREET; /* S1285 — the alehall's keeper (#588 A) */
      if(type==='inn')def._extra.unshift(...innTopics(house,def.people)); // v80 — the innkeeper lets the rooms; S141 — one of them; S237 — shared with the coaching inn
      if(type==='castle'){def._extra.unshift(...lordTopics(site));def._extraFn=()=>[...tutTownTopics(site),...factionTopics(site),...(typeof crownBladeTopics==='function'?crownBladeTopics(site):[]),...(typeof compactBellTopics==='function'?compactBellTopics(site):[]),...(typeof churchShuttleTopics==='function'?churchShuttleTopics(site):[]),...(typeof greatGateLordTopics==='function'?greatGateLordTopics(site):[]),...fineTopics(site),...investTopics(site),...routeTopics(site),...coachTopics(site)];house.dlg=def;} // the keep's steward carries the lord's quests
      if(type==='church'){def._extraFn=()=>[...penanceTopics(site),...(typeof shuttlePriestTopics==='function'?shuttlePriestTopics(def):[]),...(typeof guestTopics==='function'?guestTopics(site,def):[])];if(!house.dlg)house.dlg=def;} // S158 — the priest hears a confession
      const kn=spawnNPC(def,lot.ry+Math.PI,true);kn.sched={type:type==='inn'?'innkeeper':(house.guild?'innkeeper':'keeper'),door:{x:exX,z:exZ},plaza:{x:cx,z:cz},shop:type};if(lot.kit&&lot.kit.kind==='keep')kn.sched.bawn=true; /* S1143 — he leaves the bawn by its gate */snpcs.push(kn);
    });
    {const innH=houses.find(h=>h.type==='inn');S.innDoor=innH?{x:innH.exitX,z:innH.exitZ}:null;snpcs.forEach(n=>{if(n.sched&&n.sched.type==='keeper')n.sched.inn=S.innDoor;});}
    const clearDead=()=>{snpcs.forEach(n=>{sc.remove(n.g);sc.remove(n.dot);});snpcs.length=0;}; // S269 — out of the scene too, not only out of the list
    if(burnedV||abandonedV){S.dead=true;clearDead();}
    if(TST)TST.builds.forEach((b,k)=>{if(b.done)return;const sx=cx+14+k*6,sz=cz-16;const y=worldH(sx,sz);const m=new THREE.Mesh(buildSiteGeo(pRng(pHash(site.id+'|build|'+k))),VC_MAT);m.position.set(sx,y,sz);m.castShadow=true;m.receiveShadow=true;group.add(m);sol.push({cx:sx,cz:sz,rx:1.8,rz:1.8});}); // S255 — a building site on the kit (four box posts, a slab and a block)
    // The town's lord: by the well through the day (cities' lords keep to the keep; the steward speaks for them)
    if(plan.rows>0&&(site.kind!=='city'||!houses.some(h=>h.type==='castle'))&&!site.lordless&&!burnedV&&!abandonedV){const lord=lordFor(site);const ldef=makeDef(site,reg,r,lord.title,lord.name,{keepName:true,nameKey:'lord',people:NAT.people,x:cx+3,z:cz-4,bCol:[0x6a2a2a,0x2a3a6a,0x4a3a1a][site.kind==='town'?1:2],sCol:0xd4a878,topics:lordTopics(site)});
      ldef._extraFn=()=>[...tutTownTopics(site),...factionTopics(site),...(typeof crownBladeTopics==='function'?crownBladeTopics(site):[]),...(typeof compactBellTopics==='function'?compactBellTopics(site):[]),...(typeof churchShuttleTopics==='function'?churchShuttleTopics(site):[]),...(typeof greatGateLordTopics==='function'?greatGateLordTopics(site):[]),...fineTopics(site),...investTopics(site),...routeTopics(site),...coachTopics(site)];
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
        const ri=roadInfo(sx,sz,true);if(ri&&ri.d<4)continue;if(inPlot(sx,sz,1.5))continue; /* S1138 — not in the church's yard */
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
      const def=makeDef(site,reg,r,'Hermit',site.id==='hermit_camp'?'The Hermit':newName(),{x:cx+3.5,z:cz+4.5,bCol:0x4a4038,sCol:0xb09878,role:'old hermit',people:'oldblood'});def.role='Hermit';def._extraFn=()=>(typeof hermitMakersTopics==='function'?hermitMakersTopics(site):[]); /* S792 — Old Blood (§3.3), and the makers' six */
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
      for(const q of footReq){if(q.lot.kit&&q.lot.kit.path){paths.push({w:1.3,pts:q.lot.kit.path});continue;} /* S1143 — the keep's, from the tower's door out through the gate */
        const F={x:q.fx,z:q.fz},E={x:q.ex,z:q.ez},own=q.hid;let P=[F,E];
        if(!clearPath(P,own)){P=null;const tx=q.lot.tx,tz=q.lot.tz,px_=-tz,pz_=tx;const A={x:F.x+tx*1.1,z:F.z+tz*1.1};
          outer:for(const o of [q.lot.w/2+1.4,q.lot.w/2+3,q.lot.w/2+5])for(const sd of [1,-1]){const B={x:A.x+px_*sd*o,z:A.z+pz_*sd*o},C={x:E.x+px_*sd*o,z:E.z+pz_*sd*o};
            const cand=[F,A,B,C,E];if(clearPath(cand,own)){P=cand;break outer;}}}
        if(P)paths.push({w:1.3,pts:P});}}
    S.paths=paths; // S193 — kept for the checks on overlaps
    S.plots=PLOTS.map(P=>({type:P.type,x:P.x,z:P.z,w:P.w,d:P.d,ry:P.ry,tx:P.tx,tz:P.tz,lot:{x:P.lot.x,z:P.lot.z,w:P.lot.w,d:P.lot.d}})); // S1138 — the church's and the keep's plots, for the checks and the bawn
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
      // S753 — twice as many (Michael's A on #245): the first nb draw on the town's stream as before, so every draw
      // after them (villagers, names, guards) is unchanged; the second nb on their own stream, keyed by the site.
      // settleSolid reads SETTLE, which does not hold this town yet, so the second half also keeps out of the town's own
      // solids (houses, the chapel, the barrels already placed); the first half is left as it was, draw for draw.
      const ownHit=(x,z,R)=>sol.some(s=>{const dx=x-s.cx,dz=z-s.cz;if(s.c!==undefined){const lx=dx*s.c-dz*s.s,lz=dx*s.s+dz*s.c;return Math.abs(lx)<s.rx+R&&Math.abs(lz)<s.rz+R;}return Math.abs(dx)<s.rx+R&&Math.abs(dz)<s.rz+R;});
      // S1343 (card F6, Michael's A on #642) — none in the coaching inn's plot (its gateway, yard and stables, PLOTS' 'inn' lot): a second-half
      // spot there is passed over; a first-half spot steps out past the plot's nearer side or its back, 0.5 m into the plot's own margin,
      // drawing nothing, so every draw after it is as before (S817's rule), and is dropped only if that spot is not clear either.
      const innP=PLOTS.find(P=>P.type==='inn'),inInnYard=(x,z)=>{if(!innP)return false;const L=innP.lot,ex=x-L.x,ez=z-L.z;return Math.abs(ex*innP.tx+ez*innP.tz)<L.d/2+.4&&Math.abs(ex*innP.tz-ez*innP.tx)<L.w/2+.4;};
      const outOfYard=(x,z)=>{const L=innP.lot,tx=innP.tx,tz=innP.tz,ex=x-L.x,ez=z-L.z,al=ex*tx+ez*tz,ac=ex*tz-ez*tx,hw=L.w/2+.5,hd=L.d/2+.5;
        const opts=[[al,hw],[al,-hw],[-hd,ac]].sort((a,b)=>Math.hypot(a[0]-al,a[1]-ac)-Math.hypot(b[0]-al,b[1]-ac));
        for(const [a,b] of opts){const X=L.x+tx*a+tz*b,Z=L.z+tz*a-tx*b;if(!ownHit(X,Z,.4)&&!solidAt(X,Z)&&!settleSolid(X,Z,.4))return [X,Z];}return null;};
      const placeBarrels=(r,want,own)=>{const goal=made+want;
      for(let k=0;k<want*4&&made<goal;k++){
        const lot=use[Math.floor(r()*use.length)];if(!lot)break;
        const side=r()<.5?-1:1;let sx=lot.x-lot.tz*side*(lot.w/2+.9)+lot.tx*(r()-.5)*lot.d*.6,sz=lot.z+lot.tx*side*(lot.w/2+.9)+lot.tz*(r()-.5)*lot.d*.6;
        if(solidAt(sx,sz)||settleSolid(sx,sz,.4)||(own&&ownHit(sx,sz,.4)))continue;
        // S817 (the critic's s597: Droichead's 2 and 3 in the church and the inn, Portclare's 0 in the chapel) — a first-half spot
        // inside the town's own solids steps out to the nearest clear spot on a fixed ring of offsets, drawing nothing, so every
        // draw after it is as before; its id is its index, so its loot and its saved state do not move with it.
        if(!own&&ownHit(sx,sz,.4)){let to=null;for(let ring=1;ring<=8&&!to;ring++)for(let k=0;k<12;k++){const a=k*Math.PI/6,x=sx+Math.cos(a)*ring*.3,z=sz+Math.sin(a)*ring*.3;if(!ownHit(x,z,.4)&&!solidAt(x,z)&&!settleSolid(x,z,.4)){to=[x,z];break;}}
          if(to){sx=to[0];sz=to[1];}}
        if(inInnYard(sx,sz)){if(own)continue;const to=outOfYard(sx,sz);if(!to)continue;sx=to[0];sz=to[1];}
        const y=worldH(sx,sz);const kind=r()<.55?'barrel':'crate';let g,top;
        if(kind==='barrel'){const B=kitBarrel(1.75,0x6a4418);g=B.body;g.position.set(sx,y,sz);top=B.top;top.position.set(sx,y+.96,sz);} // S200 — the kit's barrel
        else{g=new THREE.Mesh(SK.rbox(.9,.8,.9,.05,2),crateMat);g.position.set(sx,y+.4,sz);g.rotation.y=r()*.6;top=new THREE.Mesh(new THREE.BoxGeometry(.92,.06,.92),new THREE.MeshLambertMaterial({color:0x5a3e18}));top.position.set(sx,y+.83,sz);top.rotation.y=g.rotation.y;}
        g.castShadow=true;group.add(g);group.add(top);
        let items=(typeof rollContainerLoot==='function'?rollContainerLoot('barrel',1,null,.9,site.id+':barrel:'+made+':'+lootDay(),worldTierAt(site.x,site.z)):[])||[];
        items=items.filter(it=>it&&it.dmg==null&&it.def==null&&!it.slot&&it.type!=='weapon'&&it.type!=='armor');
        if(!items.length)items.push(pick(r,[{name:'Tallow Candle',ico:'🕯️',type:'misc',weight:.2,sellMult:.3,buyPrice:4},{name:'Coil of Rope',ico:'🪢',type:'misc',weight:1,sellMult:.3,buyPrice:9},{name:'Salt Sack',ico:'🧂',type:'misc',weight:.6,sellMult:.3,buyPrice:6},{name:'Hard Bread',ico:'🍞',type:'potion',heal:6,weight:.3,sellMult:.2,buyPrice:3},{name:'Wax-sealed Letter',ico:'✉️',type:'misc',weight:.05,sellMult:.5,buyPrice:12},{name:'Tin Cup',ico:'🥛',type:'misc',weight:.3,sellMult:.3,buyPrice:3}]));
        items.forEach(it=>{if(it.qty==null)it.qty=1;});
        const c={id:site.id+':barrel:'+made,x:sx,z:sz,y,name:kind==='barrel'?'Barrel':'Crate',displayName:kind==='barrel'?'Barrel':'Crate',items,zone:'world',kind,g,top,opened:false,_settle:site.id};
        if(typeof ZONE_CORPSES!=='undefined')ZONE_CORPSES.push(c);S.loot=S.loot||[];S.loot.push(c);
        sol.push({cx:sx,cz:sz,rx:.5,rz:.5});made++;
      }};
      placeBarrels(r,nb,false);placeBarrels(seededRng(site.id,'barrels2'),nb,true);
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
    // S740 — two gate guards in every walled town (Michael's A on #242). A town with one road in had one, as one street reaches
    // the ring. The second stands at the same gate by day, across the street from the first, and at night takes the beat from
    // the far side of the loop (the beat spreads its men evenly by their order). Spawned last, so every draw before him is as it was.
    {const G=snpcs.filter(n=>n.sched&&n.sched.type==='guard');
      if(plan.walls&&G.length===1){const a=G[0].sched.a,q={x:a.x-3,z:a.z};const L=Math.hypot(cx-q.x,cz-q.z)||1,ux=(cz-q.z)/L,uz=-(cx-q.x)/L,ix=(cx-q.x)/L,iz=(cz-q.z)/L;
        /* his post: across the street, else beside the street on either hand, else a step in; the first spot that is open ground */
        const C=[[-3,0],[ux*3,uz*3],[-ux*3,-uz*3],[ix*3-3,iz*3],[ix*4,iz*4],[ix*6,iz*6]].map(([dx,dz])=>({x:q.x+dx,z:q.z+dz})).filter(c=>Math.hypot(c.x-a.x,c.z-a.z)>1.5);
        const lend=!SETTLE.has(site.id);if(lend)SETTLE.set(site.id,S); /* the town's own walls and houses, which solidAt reads from SETTLE once it is built */
        const p2=C.find(c=>!solidAt(c.x,c.z))||C[0];if(lend)SETTLE.delete(site.id);
        const def=makeDef(site,reg,r,'Guard',newName(),{nameKey:'g1',x:p2.x,z:p2.z,bCol:NAT.banner,sCol:0x808090});
        const gn=spawnNPC(def,Math.atan2(cx-q.x,cz-q.z),true);gn.sched={type:'guard',a:p2,b:p2};snpcs.push(gn);}}
    if(S.dead)clearDead(); // S269 — the villagers and the watch are drawn after the ruin's clearing (so the draws stay put): a ruin keeps nobody in the street
    if(S._forge&&storyRuin(site)&&typeof buildBramBody==='function'){ // S270 — Bram's body at his forge, as in the legacy burned zone
      for(let k=ZONE_CORPSES.length-1;k>=0;k--)if(ZONE_CORPSES[k].bramBody&&ZONE_CORPSES[k].zone==='world')ZONE_CORPSES.splice(k,1);
      buildBramBody(group,S._forge.x,worldH(S._forge.x,S._forge.z),S._forge.z,'world');}
    S.reach=t_reach(sol,site);
    /* S1216 — a door that faces the next building across a lane of 2.5 m had its step-out point (2.4 out) in that building's
       footprint (14 of Dunmore's 58 on the new look): it is pulled back along the same line, a quarter metre short of the first
       solid, once every solid of the town stands. A clear exit is left as it was; the keeper's door and the inn's go with it. */
    {const R=.3,hit=(x,z)=>sol.some(s=>{const dx=x-s.cx,dz=z-s.cz;if(s.c!==undefined){const lx=dx*s.c-dz*s.s,lz=dx*s.s+dz*s.c;return Math.abs(lx)<s.rx+R&&Math.abs(lz)<s.rz+R;}return Math.abs(dx)<s.rx+R&&Math.abs(dz)<s.rz+R;});
      for(const h of houses){if(h.exitX==null||!hit(h.exitX,h.exitZ))continue;const L=Math.hypot(h.exitX-h.doorX,h.exitZ-h.doorZ);if(L<1)continue;
        const ux=(h.exitX-h.doorX)/L,uz=(h.exitZ-h.doorZ)/L;let t=.35;while(t<L&&!hit(h.doorX+ux*t,h.doorZ+uz*t))t+=.05;
        const u=Math.max(.6,t-.3),nx=h.doorX+ux*u,nz=h.doorZ+uz*u;if(hit(nx,nz))continue;
        for(const n of snpcs)if(n.sched&&n.sched.door&&Math.abs(n.sched.door.x-h.exitX)<.01&&Math.abs(n.sched.door.z-h.exitZ)<.01){n.sched.door.x=nx;n.sched.door.z=nz;}
        if(S.innDoor&&Math.abs(S.innDoor.x-h.exitX)<.01&&Math.abs(S.innDoor.z-h.exitZ)<.01){S.innDoor.x=nx;S.innDoor.z=nz;}
        h.exitX=nx;h.exitZ=nz;}}
    if(kitG){S.kitTris=PKIT.mergeByMaterial(kitG);S.kitCalls=kitG.children.length; // S1072 — the kit's houses, one mesh per material
      const lo=new THREE.Mesh(mergeGeos(kitLo),VC_MAT);lo.name='kit houses far';lo.userData.noBake=true;lo.castShadow=true;lo.receiveShadow=true;lo.visible=false;group.add(lo);kitLo.forEach(([g])=>g.dispose()); /* S1073 — and their far copy */
      let r=0;for(const l of use)if(l.kit)r=Math.max(r,Math.hypot(l.x-cx,l.z-cz)+(l.kit.r||Math.max(l.w,l.d)/2)); /* S1143 — the keep's reach is its bawn's */S.kitLod={hi:kitG,lo,x:cx,z:cz,r,tris:lo.geometry.attributes.position.count/3};}
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
  // S1073 — a kit town's houses (one group for the town, S.kitLod) by the same rule, measured from the town's centre less half its
  // houses' reach: near the town the kit's houses, from outside it their far copy
  function houseLod(){const cp=CAM.position;for(const S of SETTLE.values()){const K=S.kitLod;
    if(K){const d=Math.max(0,Math.hypot(K.x-cp.x,K.z-cp.z)-K.r*.5),near=d<HOUSE_LOD.near?true:d>HOUSE_LOD.far?false:K.hi.visible;K.hi.visible=near;K.lo.visible=!near;}
    const L=S.lodMeshes;if(!L)continue;
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
  // S760 — a cell beyond the grid has a negative index (c11_-1_i1, an islet lair off the north edge): the id reads the sign too
  function siteAnywhere(id){
    if(SITE[id])return SITE[id];
    const m=/^c(-?\d+)_(-?\d+)_[spi]\d+$/.exec(id);if(m){return getCell(+m[1],+m[2]).sites.find(t=>t.id===id)||null;}
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
    if(!pk&&!lk){const m=/^c(-?\d+)_(-?\d+)_/.exec(id);if(m){const c=getCell(+m[1],+m[2]);pk=c.peaks.find(p=>p.id===id);lk=c.lakes.find(l=>l.id===id);}else{const c=getCell(HOME_I,HOME_J);pk=c.peaks.find(p=>p.id===id);lk=c.lakes.find(l=>l.id===id);}}
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
  const MAP={cv:null,ctx:null,zoom:1,ox:0,oy:0,drag:null,hover:null,hoverCell:null,sel:null,W:0,H:0,dirty:true,mode:'map',tiles:new Map(),jobs:[],_entries:[],cssW:0,cssH:0,dpr:1,drawN:0};
  const TILE_C=48,TILE_F=320;
  // S704 — Michael's A on #220: the map at the screen's own pixels, and finer tiles as you zoom. The maths is in CSS pixels
  // (MAP.cssW/cssH, what the mouse reads); the canvas store is that times devicePixelRatio, drawn through setTransform.
  // A province's tiles are a quadtree: the province, its quarters, theirs, five levels (75 units a tile at the deepest),
  // the level chosen so a tile pixel is never more than 1.15 screen pixels. The concept artist's prototype, lifted.
  const MAP_TQ=256,MAP_LMAX=5;
  function mapCssW(){return MAP.cssW||MAP.cv.width;}
  function mapCssH(){return MAP.cssH||MAP.cv.height;}
  function mapFit(){const pane=document.getElementById('wm-map-pane'),root=MAP.cv;if(!pane||!root)return;const r=pane.getBoundingClientRect(),d=Math.max(1,Math.min(3,window.devicePixelRatio||1));
    MAP.cssW=Math.max(300,r.width|0);MAP.cssH=Math.max(300,r.height|0);MAP.dpr=d;root.width=Math.round(MAP.cssW*d);root.height=Math.round(MAP.cssH*d);MAP.W=Math.min(MAP.cssW,MAP.cssH);MAP.H=MAP.cssH;}
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
  // S588's names for the map's CSS size, kept as aliases of S704's (the merge of 11 Oct kept S704's quadtree, Michael's A on #220)
  function mapLW(){return mapCssW();}
  function mapLH(){return mapCssH();}
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
  // A quadtree tile (cell, L, qi, qj) at res pixels: heights first, then pixels, as tileStep does, to a time budget. The relief
  // is shaded by slope per world unit, so a deep tile is shaded as strongly as the old fine tile.
  function mapQKey(c,L,qi,qj,res){return 'q'+c.i+','+c.j+':'+L+':'+qi+','+qj+':'+res;}
  function mapStartQ(c,L,qi,qj,res){const key=mapQKey(c,L,qi,qj,res);let t=MAP.tiles.get(key);if(t)return t;
    const span=SIZE/(1<<L);const cv=document.createElement('canvas');cv.width=res;cv.height=res;const ctx=cv.getContext('2d');
    t={cv,ctx,img:ctx.createImageData(res,res),H:new Float32Array((res+1)*(res+1)),row:0,hrow:0,done:false,cell:c,res,L,qi,qj,span,step:span/res,X0:c.ox+qi*span,Z0:c.oz+qj*span,q:true,key,want:MAP.drawN};
    MAP.tiles.set(key,t);MAP.jobs.push(t);return t;}
  function mapStepQ(t,budgetMs,t0){const {res,step,X0,Z0}=t;const H=t.H;
    withCellData(t.cell,()=>{
      while(t.hrow<=res&&performance.now()-t0<budgetMs){const j=t.hrow;for(let i=0;i<=res;i++)H[j*(res+1)+i]=worldH(X0+i*step,Z0+j*step);t.hrow++;}
      if(t.hrow<=res)return;const d=t.img.data,px3=[0,0,0],k=.045*(SIZE/TILE_F)/step;
      while(t.row<res&&performance.now()-t0<budgetMs){const j=t.row;
        for(let i=0;i<res;i++){const h=H[j*(res+1)+i];
          const hx=H[j*(res+1)+Math.min(res,i+1)]-H[j*(res+1)+Math.max(0,i-1)],hz=H[Math.min(res,j+1)*(res+1)+i]-H[Math.max(0,j-1)*(res+1)+i];
          const shade=Math.max(.72,Math.min(1.22,1+(-hx-hz)*k));mapPixel(X0+i*step,Z0+j*step,h,shade,px3);const o=(j*res+i)*4;d[o]=px3[0];d[o+1]=px3[1];d[o+2]=px3[2];d[o+3]=255;}
        t.row++;}
      if(t.row>=res){t.ctx.putImageData(t.img,0,0);
        if(step<=10){const c=t.ctx,gap=Math.max(4,Math.round(45/step/1.5));c.strokeStyle='rgba(60,90,110,.22)';c.lineWidth=1;
          /* the hatched water, its lines about 45 units apart at any zoom */
          for(let j=gap>>1;j<res;j+=gap){c.beginPath();let on=false;for(let i=0;i<res;i++){const h=H[j*(res+1)+i];if(h<-.6){if(!on){c.moveTo(i,j);on=true;}else c.lineTo(i,j);}else on=false;}c.stroke();}}
        t.H=null;t.img=null;t.done=true;MAP.dirty=true;}
    });}
  // the jobs: 8 ms a frame, spent across tiles, nearest the middle of the view first; a tile scrolled out of view waits
  // (it is queued again when seen), and past 160 finished quad tiles the longest unseen are let go
  function mapJobs(){const t0=performance.now();
    MAP.jobs=MAP.jobs.filter(t=>!t.done&&(!t.q||t.want>=MAP.drawN-2));
    MAP.jobs.sort((a,b)=>(a.pri||0)-(b.pri||0));
    for(const t of MAP.jobs){if(performance.now()-t0>=8)break;if(t.q)mapStepQ(t,8,t0);else tileStep(t,1e9);}
    MAP.jobs=MAP.jobs.filter(t=>!t.done);
    const qs=[];for(const t of MAP.tiles.values())if(t.q)qs.push(t);
    if(qs.length>160){qs.sort((a,b)=>a.want-b.want);for(let n=0;n<qs.length-160;n++){const t=qs[n];if(t.want>=MAP.drawN-2)break;MAP.tiles.delete(t.key);}}}
  function mapLevelFor(dev){if(dev<=MAP_TQ*1.15)return 0;return Math.min(MAP_LMAX,Math.ceil(Math.log2(dev/(MAP_TQ*1.15))));}
  function mapResFor(dev,L){if(L>0)return MAP_TQ;return Math.max(32,Math.min(MAP_TQ,Math.ceil(dev/32)*32));}
  // one province: its coarse tile (always there), then each visible quad tile, or the best finished ancestor cropped
  function mapDrawCell(ctx,c,cellPx,cw,ch){
    const [sx,sy]=mapToScreen(c.ox,c.oz);const co=MAP.tiles.get(tileKey(c.i,c.j,TILE_C))||startTile(c,TILE_C);
    ctx.imageSmoothingQuality='high';ctx.drawImage(co.cv,sx,sy,cellPx+.6,cellPx+.6);
    const dev=cellPx*MAP.dpr,L=mapLevelFor(dev),res=mapResFor(dev,L),n=1<<L,tp=cellPx/n;
    const i0=Math.max(0,Math.floor(-sx/tp)),i1=Math.min(n-1,Math.floor((cw-sx)/tp)),j0=Math.max(0,Math.floor(-sy/tp)),j1=Math.min(n-1,Math.floor((ch-sy)/tp));
    for(let qj=j0;qj<=j1;qj++)for(let qi=i0;qi<=i1;qi++){
      const t=mapStartQ(c,L,qi,qj,res);t.want=MAP.drawN;if(!t.done&&!MAP.jobs.includes(t))MAP.jobs.push(t);const tx=sx+qi*tp,ty=sy+qj*tp;t.pri=L*1e-3+Math.hypot(tx+tp/2-cw/2,ty+tp/2-ch/2);
      if(t.done){ctx.drawImage(t.cv,tx,ty,tp+.5,tp+.5);continue;}
      for(let a=L-1;a>=0;a--){const sh=L-a,ai=qi>>sh,aj=qj>>sh;let best=null;
        for(const r of [MAP_TQ,224,192,160,128,96,64,32]){const u=MAP.tiles.get(mapQKey(c,a,ai,aj,r));if(u&&u.done){best=u;break;}}
        if(best){best.want=MAP.drawN;const f=best.res/(1<<sh);ctx.drawImage(best.cv,(qi-(ai<<sh))*f,(qj-(aj<<sh))*f,f,f,tx,ty,tp+.5,tp+.5);break;}}
    }}
  // world ↔ screen
  function baseScale(){return Math.min(mapCssW(),mapCssH())/(SIZE*GRID);}
  function mapToScreen(x,z){const s=baseScale()*MAP.zoom;return [x*s+MAP.ox,z*s+MAP.oy];}
  function screenToMap(sx,sy){const s=baseScale()*MAP.zoom;return [(sx-MAP.ox)/s,(sy-MAP.oy)/s];}
  function mapClamp(){const s=baseScale()*MAP.zoom,w=SIZE*GRID*s,cw=mapCssW(),ch=mapCssH();MAP.ox=Math.min(Math.max(MAP.ox,cw-w-60),60);MAP.oy=Math.min(Math.max(MAP.oy,ch-w-60),60);if(w<cw)MAP.ox=(cw-w)/2;if(w<ch)MAP.oy=(ch-w)/2;}
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
  /* S1065 — the door's grade on its subtitle (Very Easy to Very Hard), its place's and fixed, so cached on the door by where it stands */
  function mapDoorGrade(e,p){if(typeof doorGrade!=='function')return '';const k=p.x+','+p.z;if(e._mapGradeAt!==k){e._mapGradeAt=k;e._mapGrade=(DIFF_SCALE[doorGrade(e,p.x,p.z)]||{}).label||'';}return e._mapGrade?' · '+e._mapGrade:'';}
  function mapEntries(cell){
    const out=[];const c=cell;if(!c)return out;
    const SUB={glade:'Glade',shrine:'Shrine',lair:'Lair',tower:'Spire',bcamp:'Bandit camp',bridge:'Bridge'};
    c.sites.forEach(t=>{if(t.kind==='portal')return;out.push({id:t.id,name:t.name,kind:t.kind,x:t.x,z:t.z,sub:t.kind==='glade'&&typeof gladeDoubled==='function'&&gladeDoubled(t)?'Glade · grown thick since the beast died':SUB[t.kind]||(t.kind.charAt(0).toUpperCase()+t.kind.slice(1)),major:t.kind==='city'||t.kind==='town'||t.kind==='port'||t.kind==='garrison'||t.kind==='tower'||t.kind==='shrine'});});
    c.doors.forEach(e=>{if(e.wet)return;const p=dungeonWorldPos[e.seed]||(e.zone==='gen'?{x:e.x,z:e.z}:null);if(!p)return;out.push({id:'door_'+e.seed,name:e.canonicalName||(typeof dungeonName==='function'?dungeonName(e.seed,e.theme):'Old gate'),kind:e.kind==='fort_door'?'fort':'cave',x:p.x,z:p.z,sub:`${e.kind==='fort_door'?'Fort':'Old gate'} · ${e.theme}`+mapDoorGrade(e,p),major:e.kind==='fort_door'});});
    c.peaks.forEach(p=>out.push({id:p.id,name:p.name,kind:'peak',x:p.x,z:p.z,sub:'Mountain',major:true}));
    c.lakes.forEach(l=>out.push({id:l.id,name:l.name,kind:'lake',x:l.x,z:l.z,sub:'Lake',major:true}));
    const wk=worldState.ship&&worldState.ship.sunk;if(wk&&wk.x>=c.ox&&wk.x<c.ox+SIZE&&wk.z>=c.oz&&wk.z<c.oz+SIZE)out.push({id:'shipwreck',name:`The wreck of the ${worldState.ship.name||SHIP.name}`,kind:'ship',x:wk.x,z:wk.z,sub:'Where she went down',major:true});
    if(SHIP.mesh&&SHIP.x>=c.ox&&SHIP.x<c.ox+SIZE&&SHIP.z>=c.oz&&SHIP.z<c.oz+SIZE)out.push({id:'ship',name:`The ${SHIP.name}`,kind:'ship',x:SHIP.x,z:SHIP.z,sub:'Your ship',major:true});
    questMarkers(c).forEach(m=>out.push(m));
    return out;
  }
  function visibleCells(){const [x0,z0]=screenToMap(0,0),[x1,z1]=screenToMap(mapCssW(),mapCssH());const out=[];for(let j=Math.max(0,Math.floor(z0/SIZE));j<=Math.min(GRID-1,Math.floor(z1/SIZE));j++)for(let i=Math.max(0,Math.floor(x0/SIZE));i<=Math.min(GRID-1,Math.floor(x1/SIZE));i++)out.push(getCell(i,j));return out;}
  function mapDraw(){
    const ctx=MAP.ctx;if(!ctx)return;if(!MAP.cssW)mapFit();MAP.drawN++;const cw=mapCssW(),ch=mapCssH();
    ctx.setTransform(MAP.dpr||1,0,0,MAP.dpr||1,0,0);
    ctx.fillStyle='#2b241a';ctx.fillRect(0,0,cw,ch);
    if(MAP.mode==='local'){const size=Math.min(cw,ch);ctx.save();ctx.translate((cw-size)/2,(ch-size)/2);drawLocalMap(ctx,size,130,true);ctx.restore();MAP.dirty=true;return;}
    const s=baseScale()*MAP.zoom,cellPx=SIZE*s;
    const cells=visibleCells();
    const [pi,pj]=cellOf(px,pz);
    // tiles
    for(const c of cells){
      const [sx,sy]=mapToScreen(c.ox,c.oz);
      mapDrawCell(ctx,c,cellPx,cw,ch);
      // undiscovered provinces sit under a light sepia wash
      if(c.type!=='sea'&&!(c.i===pi&&c.j===pj)&&!c.sites.some(x=>discovered(x.id))){ctx.fillStyle='rgba(60,40,20,.22)';ctx.fillRect(sx,sy,cellPx+.6,cellPx+.6);}
    }
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
    if(cellPx>=60){for(const c of cells)for(const e of mapEntries(c)){if(e.kind==='quest')continue;if(!discovered(e.id))continue;if(cellPx<160&&!e.major)continue;if(!mapAllowed(e))continue;entries.push(e);}}
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
    mapDrawMarks(ctx,cw,ch,cellPx);
    // compass, frame
    ctx.save();ctx.translate(cw-46,52);ctx.strokeStyle='rgba(40,28,14,.7)';ctx.fillStyle='rgba(240,228,200,.75)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(5,0);ctx.lineTo(0,20);ctx.lineTo(-5,0);ctx.closePath();ctx.fillStyle='#8a2a22';ctx.fill();ctx.fillStyle='#2a1c10';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText('N',0,-27);ctx.restore();
    const [fx,fy]=mapToScreen(0,0);ctx.strokeStyle='rgba(40,28,14,.8)';ctx.lineWidth=3;ctx.strokeRect(fx,fy,SIZE*GRID*s,SIZE*GRID*s);
    MAP.dirty=MAP.jobs.length>0;
  }
  // ── S704 — the compass's marks on the map (Michael's A on #220) ──
  // One list for the compass and the map: each of your quests and guild tasks with its name and line, a job done marked at
  // whoever gave it, then everything else the compass points at (directions, the story, factions, the war, rubbings, Act I's
  // givers). Every mark is a numbered wax seal at every zoom: red, go there; gilt with a tick, report back; blue, directions.
  // A mark beyond the view sits on the map's edge with an arrow and its distance; the panel lists them under *Where your work is*.
  const MK_COL={go:'#9a2a20',back:'#b8862a',way:'#3f6488'};
  function mapMarks(){const out=[];const add=m=>{if(m&&m.x!=null&&m.z!=null&&isFinite(m.x)&&isFinite(m.z))out.push(m);};
    for(const q of qActive()){const d=q.data||{};let x=null,z=null,line=q.objective,st='go';
      if(q.done){const g=q.giverSite?siteAnywhere(q.giverSite):null;if(g){x=g.x;z=g.z;}line=`Report to ${q.giver}`;st='back';}
      else if(q.kind==='deliver'){const t=siteAnywhere(d.siteId);if(t){x=t.x;z=t.z;}}
      else if(q.kind==='find'&&q._npc&&q._npc.g){x=q._npc.g.position.x;z=q._npc.g.position.z;}
      else if(q.kind==='retrieve'&&d.got){const g=q.giverSite?siteAnywhere(q.giverSite):null;if(g){x=g.x;z=g.z;}line=`Bring ${d.item||'it'} to ${q.giver}`;st='back';}
      else if(q.kind==='duel'&&d.state==='lost')continue;
      else{x=d.x;z=d.z;}
      add({id:'mk_'+q.id,title:q.title,line,x,z,st});}
    const G=worldState.guild;if(G)for(const g in G){const t=G[g].active;if(!t)continue;const done=taskDone(t);const site=t.siteId?siteAnywhere(t.siteId):null;
      const x=t.sx!=null?t.sx:t.x!=null?t.x:site?site.x:null,z=t.sz!=null?t.sz:t.z!=null?t.z:site?site.z:null;
      add({id:'mk_g_'+g,title:t.title||t.short,line:done?'Report to the guild':t.short,x,z,st:done?'back':'go'});}
    let comp=[];try{comp=compassMarkers();}catch(e){}
    for(const m of comp){if(out.some(o=>Math.hypot(o.x-m.x,o.z-m.z)<2))continue;const way=!!(WAY&&m.x===WAY.x&&m.z===WAY.z);const lb=String(m.label||'');
      add({id:'mk_c_'+Math.round(m.x)+'_'+Math.round(m.z),title:way?'Directions':lb.replace(/^report to /,'Report to ').replace(/^./,ch=>ch.toUpperCase()),line:way?`${lb}, as you were told`:'',x:m.x,z:m.z,st:way?'way':/^report to /.test(lb)?'back':'go'});}
    out.forEach((m,i)=>m.n=i+1);return out;}
  function mapSeal(ctx,m,r,on){const col=MK_COL[m.st]||MK_COL.go;
    ctx.save();if(on){ctx.beginPath();ctx.arc(0,0,r+6,0,Math.PI*2);ctx.fillStyle='rgba(255,236,170,.45)';ctx.fill();}
    ctx.beginPath();for(let k=0;k<14;k++){const a=k/14*Math.PI*2,rr=r*(k%2?1:.9);ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();
    ctx.fillStyle=col;ctx.shadowColor='rgba(30,15,5,.45)';ctx.shadowBlur=3;ctx.shadowOffsetY=1;ctx.fill();ctx.shadowColor='transparent';
    ctx.lineWidth=1;ctx.strokeStyle='rgba(30,12,6,.7)';ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.66,0,Math.PI*2);ctx.strokeStyle='rgba(255,230,190,.45)';ctx.stroke();
    ctx.fillStyle='#fbefd6';ctx.font=`700 ${Math.round(r*1.05)}px Georgia, serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(m.st==='back'?'✓':String(m.n),0,1);ctx.restore();}
  function mapLabel(ctx,text,x,y,size,italic){ctx.save();ctx.font=`${italic?'italic ':''}600 ${size}px Georgia, serif`;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineJoin='round';ctx.lineWidth=3.5;ctx.strokeStyle='rgba(244,233,206,.92)';ctx.strokeText(text,x,y);ctx.fillStyle='#2a1c10';ctx.fillText(text,x,y);ctx.restore();}
  function mapDist(m){const d=Math.hypot(m.x-px,m.z-pz);if(d<40)return 'here';return d>=1000?(d/1000).toFixed(1).replace(/\.0$/,'')+'k u':Math.round(d/10)*10+' u';}
  function mapDrawMarks(ctx,cw,ch,cellPx){MAP._marks=[];MAP._labels=[];if(MAP.filt.quests===false)return;const marks=mapMarks();const r=cellPx<100?8:10;
    // seals on one spot (a cull and a report-back both at the town) stand side by side, not on top of each other
    const at=marks.map(m=>mapToScreen(m.x,m.z));for(let a=0;a<marks.length;a++){if(at[a].fanned)continue;const grp=[a];for(let b=a+1;b<marks.length;b++)if(!at[b].fanned&&Math.hypot(at[a][0]-at[b][0],at[a][1]-at[b][1])<2*r)grp.push(b);
      if(grp.length>1){const [ax,ay]=at[a];grp.forEach((g,k)=>{at[g]=[ax+(k-(grp.length-1)/2)*(2*r+3),ay];at[g].fanned=true;});}}
    const boxes=[],edges=[],labels=[];const free=(x,y,w,h)=>{if(boxes.some(b=>x<b[0]+b[2]&&x+w>b[0]&&y<b[1]+b[3]&&y+h>b[1]))return false;boxes.push([x,y,w,h]);return true;};
    for(let mi=0;mi<marks.length;mi++){const m=marks[mi];const [sx,sy]=at[mi];const on=MAP.hover===m.id||MAP.sel===m.id;const col=MK_COL[m.st]||MK_COL.go;
      if(sx>=-r&&sy>=-r&&sx<=cw+r&&sy<=ch+r){MAP._marks.push({m,sx,sy:sy-r-4});ctx.save();ctx.translate(sx,sy-r-4);
        ctx.beginPath();ctx.moveTo(0,r+4);ctx.lineTo(-3,r-1);ctx.lineTo(3,r-1);ctx.closePath();ctx.fillStyle='rgba(40,20,10,.85)';ctx.fill();
        mapSeal(ctx,m,r,on);ctx.restore();if(cellPx>=100||on)labels.push({m,sx,sy,on});continue;}
      // off the edge: a seal on the frame, an arrow towards the mark, and how far; marks off one side stack along it
      const cx=cw/2,cy=ch/2,dx=sx-cx,dy=sy-cy,pad=26,kx=(cw/2-pad)/Math.abs(dx||1e-6),ky=(ch/2-pad)/Math.abs(dy||1e-6),k=Math.min(kx,ky),a=Math.atan2(dy,dx);let ex=cx+dx*k,ey=cy+dy*k;
      const side=kx<ky;for(let g=0;g<12&&edges.some(e=>Math.hypot(e[0]-ex,e[1]-ey)<2*r+22);g++){if(side)ey+=(ey>cy?-1:1)*(2*r+22);else ex+=(ex>cx?-1:1)*(2*r+22);}edges.push([ex,ey]);
      MAP._marks.push({m,sx:ex,sy:ey,edge:true});ctx.save();ctx.translate(ex,ey);ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(r+9,0);ctx.lineTo(r+1,-5);ctx.lineTo(r+1,5);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.restore();
      mapSeal(ctx,m,r-1,on);mapLabel(ctx,mapDist(m),0,ey>ch/2?-r-6:r+15,11,false);ctx.restore();}
    // the names, the hovered one first: a label goes only where it is clear of the labels already placed
    labels.sort((a,b)=>b.on-a.on);ctx.font='italic 600 12px Georgia, serif';
    for(const L of labels){const w=ctx.measureText(L.m.title).width+6;if(free(L.sx-w/2,L.sy-2*r-24,w,15)||L.on){mapLabel(ctx,L.m.title,L.sx,L.sy-2*r-9,12,true);MAP._labels.push([L.sx-w/2,L.sy-2*r-24,w,15]);}ctx.font='italic 600 12px Georgia, serif';}}
  function mapPickMark(sx,sy){let best=null,bd=14;(MAP._marks||[]).forEach(o=>{const d=Math.hypot(sx-o.sx,sy-o.sy);if(d<bd){bd=d;best=o;}});return best;}
  // the list under the panel, numbered as on the map; a click centres the map on the mark
  function mapMarksHtml(){const marks=MAP.filt.quests===false?[]:mapMarks();if(!marks.length)return '';const far=m=>Math.hypot(m.x-px,m.z-pz)<40?'':' '+compassWord(m.x-px,m.z-pz);
    return `<div class="mk-sec">Where your work is</div>`+marks.map(m=>`<div class="mk-row" data-id="${m.id}"><span class="mk-n mk-${m.st}">${m.st==='back'?'✓':m.n}</span><span><b>${m.title}</b>${m.line?`<br><i>${m.line}</i>`:''}<br><small>${mapDist(m)}${far(m)}</small></span></div>`).join('');}
  function mapWireMarks(body){body.querySelectorAll('.mk-row').forEach(el=>el.onclick=()=>{const m=mapMarks().find(o=>o.id===el.dataset.id);if(!m)return;const s=baseScale()*MAP.zoom;MAP.ox=mapCssW()/2-m.x*s;MAP.oy=mapCssH()/2-m.z*s;mapClamp();MAP.sel=m.id;MAP.dirty=true;mapMarkPanel(m);});}
  function mapMarkPanel(m){const body=document.getElementById('wm-panel-body');if(!body||!m)return;const near=Math.hypot(m.x-px,m.z-pz)<40;
    body.innerHTML=`<div class="mk-head"><span class="mk-n mk-${m.st}">${m.st==='back'?'✓':m.n}</span>${m.title}</div>${m.line?`<div class="mk-line">${m.line}</div>`:''}<div class="mk-line">${mapDist(m)}${near?'':' '+compassWord(m.x-px,m.z-pz)+' of you'}</div>`;}
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
  function mapPick(sx,sy){const isc=Math.max(.9,Math.min(2.2,SIZE*baseScale()*MAP.zoom/420))*(Math.min(mapCssW(),mapCssH())/700);let best=null,bd=16*isc;(MAP._entries||[]).forEach(e=>{const [x,y]=mapToScreen(e.x,e.z);const d=Math.hypot(sx-x,sy-y);if(d<bd){bd=d;best=e;}});return best;}
  // S496 — notes pinned to the map (Michael's C on DECISION #132, part C): *✎ Note* arms the next click on the map, which
  // opens a box in the panel for up to 500 characters; *Pin it* keeps it in worldState.mapNotes, a character key ({x,z,
  // text,t,tod}, the world spot and the minute). A pin shows its words on hover; a click opens it, with *Take it down*.
  function pinMapNote(x,z,text){const t=String(text||'').replace(/\s+/g,' ').trim().slice(0,500);if(!t||!isFinite(x)||!isFinite(z))return -1;const L=worldState.mapNotes||(worldState.mapNotes=[]);L.push({x:Math.round(x*10)/10,z:Math.round(z*10)/10,text:t,t:Math.floor(worldState.gameTimeAbsMinutes||0),tod:Math.floor(worldState.gameTimeMinutes||0)%1440});MAP.dirty=true;return L.length-1;}
  function unpinMapNote(i){const L=worldState.mapNotes;if(!L||!L[i])return false;L.splice(i,1);if(!L.length)delete worldState.mapNotes;MAP.sel=null;MAP.hover=null;MAP.dirty=true;return true;}
  function mapPickNote(sx,sy){const isc=Math.max(.9,Math.min(2.2,SIZE*baseScale()*MAP.zoom/420))*(Math.min(mapCssW(),mapCssH())/700);let best=null,bd=12*isc;(MAP._notes||[]).forEach(n=>{const d=Math.hypot(sx-n.sx-4*isc,sy-n.sy+8*isc);if(d<bd){bd=d;best=n.i;}});return best;}
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
    body.innerHTML=`<div style="font:600 16px Georgia,serif;color:#e8d8a0">${c.name||'Open sea'}</div><div style="color:#b8a880;font-size:12px;margin:4px 0 10px">${c.type==='sea'?`Open water · ${nationOf(c.i,c.j).name}`:`${nationSubtitle(c)} · `+`${towns.length} settlements${towns.some(t=>t.kind==='city')?', a city':''}${towns.some(t=>t.kind==='port')?', ports':''} · ${c.doors.length} doors · ${known} known`}</div><div style="color:#8a7a60;font-size:11px;margin-bottom:12px">Scroll to zoom in.</div>`+mapMarksHtml();mapWireMarks(body);}
  function syncMapButtons(){const tg=document.getElementById('w80-maptoggle');if(!tg)return;tg.querySelectorAll('button').forEach(x=>{x.style.background=x.dataset.m===MAP.mode?'#3a2a16':'#2a2020';x.style.color=x.dataset.m===MAP.mode?'#f0e2c0':'#c8b8a0';});}
  // ── search and filters ──
  MAP.filt={towns:true,gates:true,pois:true,quests:true};
  function mapKindClass(e){if(!e||!e.kind)return 'pois';if(e.kind in BASE_P)return 'towns';if(/door|gate/.test(e.kind))return 'gates';if(e.kind==='quest')return 'quests';return 'pois';}
  function mapAllowed(e){return MAP.filt[mapKindClass(e)]!==false;}
  function mapSearch(q){const box=document.getElementById('wm-results');if(!box)return;q=(q||'').trim().toLowerCase();if(!q){box.style.display='none';return;}
    const out=[];for(const c of CELLS.values()){c.sites.forEach(t=>{if(t.name&&t.name.toLowerCase().includes(q)&&discovered(t.id))out.push({name:t.name,sub:t.kind,x:t.x,z:t.z,id:t.id,kind:t.kind});});(c.doors||[]).forEach(d=>{const n=d.canonicalName||'';if(n.toLowerCase().includes(q)){const p=dungeonWorldPos[d.seed]||d;if(discovered('door_'+d.seed))out.push({name:n,sub:'gate',x:p.x,z:p.z,id:'door_'+d.seed,kind:'door'});}});}
    out.sort((a,b)=>a.name.localeCompare(b.name));box.innerHTML=out.slice(0,12).map((o,i)=>`<div class="wm-res" data-i="${i}" style="padding:5px 10px;cursor:pointer;border-bottom:1px solid rgba(60,80,40,.4);font:12px Georgia,serif;color:#e8dcc0">${o.name} <span style="color:#8a9a70">· ${o.sub}</span></div>`).join('')||'<div style="padding:6px 10px;color:#8a9a70;font:12px Georgia,serif">Nothing you know of by that name.</div>';box.style.display='block';
    box.querySelectorAll('.wm-res').forEach(el=>el.onclick=()=>{const o=out[+el.dataset.i];const s=baseScale()*MAP.zoom;MAP.ox=mapCssW()/2-o.x*s;MAP.oy=mapCssH()/2-o.z*s;mapClamp();MAP.sel=o.id;MAP.dirty=true;mapDraw();mapPanel({id:o.id,name:o.name,kind:o.kind,x:o.x,z:o.z,sub:o.sub});box.style.display='none';});}
  function wireMapSearch(){const inp=document.getElementById('wm-search');if(!inp||inp._wired)return;inp._wired=true;const pb=document.getElementById('wm-pin');if(pb)pb.onclick=()=>mapNoteArm();inp.addEventListener('input',()=>mapSearch(inp.value));['keydown','keyup','keypress'].forEach(ev=>inp.addEventListener(ev,e=>e.stopPropagation()));document.querySelectorAll('.wm-filt').forEach(cb=>cb.addEventListener('change',()=>{MAP.filt[cb.value]=cb.checked;MAP.dirty=true;mapDraw();}));}
  function mapPanel(e){
    const body=document.getElementById('wm-panel-body');if(!body)return;
    let tg=document.getElementById('w80-maptoggle');if(!tg){tg=document.createElement('div');tg.id='w80-maptoggle';tg.style.cssText='margin:0 0 10px;display:flex;gap:6px';tg.innerHTML='<button type="button" data-m="map" style="flex:1;padding:6px;background:#3a2a16;color:#f0e2c0;border:1px solid #8a6a3a;border-radius:4px;cursor:pointer;font:13px Georgia,serif">Map</button><button type="button" data-m="local" style="flex:1;padding:6px;background:#2a2020;color:#c8b8a0;border:1px solid #5a4a3a;border-radius:4px;cursor:pointer;font:13px Georgia,serif">Local</button>';const hdr=document.getElementById('wm-panel-header');if(hdr)hdr.insertAdjacentElement('afterend',tg);tg.querySelectorAll('button').forEach(b=>b.onclick=()=>{MAP.mode=b.dataset.m;syncMapButtons();MAP.dirty=true;});}
    if(!e){const mk=mapMarksHtml();body.innerHTML=mk||'<div class="wm-placeholder">Scroll to zoom, drag to pan.<br><br>Hover a place to learn more; click a discovered place to travel there.<br><br>Places appear as you find them.</div>';if(mk)mapWireMarks(body);return;}
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
        if(!MAP.cv||MAP.mode!=='map')return;const r=root.getBoundingClientRect();const mk=mapPickMark(ev.clientX-r.left,ev.clientY-r.top);if(mk){showTownCard(null,0,0);if(MAP.hover!==mk.m.id){MAP.hover=mk.m.id;MAP.hoverCell=null;MAP.dirty=true;if(!MAP.sel)mapMarkPanel(mk.m);}return;}const nh=mapPickNote(ev.clientX-r.left,ev.clientY-r.top);if(nh!=null){if(MAP.hover!=='note:'+nh){MAP.hover='note:'+nh;MAP.dirty=true;}showNoteCard(nh,ev.clientX-r.left,ev.clientY-r.top);return;}const e=mapPick(ev.clientX-r.left,ev.clientY-r.top);const id=e?e.id:null;
        if(id!==MAP.hover){MAP.hover=id;MAP.dirty=true;if(!MAP.sel)mapPanel(e);}
        showTownCard(e,ev.clientX-r.left,ev.clientY-r.top);
        if(!e&&!MAP.sel){const [wx,wz]=screenToMap(ev.clientX-r.left,ev.clientY-r.top);const [i,j]=cellOf(wx,wz);const hc=(i>=0&&j>=0&&i<GRID&&j<GRID)?[i,j]:null;if(JSON.stringify(hc)!==JSON.stringify(MAP.hoverCell)){MAP.hoverCell=hc;if(hc)mapPanelCell(getCell(i,j));else mapPanel(null);}}
      });
      root.addEventListener('mouseleave',()=>showTownCard(null,0,0));
      window.addEventListener('mouseup',ev=>{if(!MAP.drag)return;const moved=MAP.drag.moved;MAP.drag=null;if(moved||MAP.mode!=='map')return;const r=root.getBoundingClientRect();const mk=!MAP.pinArmed&&mapPickMark(ev.clientX-r.left,ev.clientY-r.top);if(mk){const m=mk.m;if(mk.edge){const s=baseScale()*MAP.zoom;MAP.ox=mapCssW()/2-m.x*s;MAP.oy=mapCssH()/2-m.z*s;mapClamp();}MAP.sel=m.id;mapMarkPanel(m);MAP.dirty=true;return;}if(mapNoteClick(ev.clientX-r.left,ev.clientY-r.top))return;const e=mapPick(ev.clientX-r.left,ev.clientY-r.top);MAP.sel=e?e.id:null;mapPanel(e);MAP.dirty=true;});
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
      window.addEventListener('resize',()=>{if(MAP.cv&&MAP.cv.style.display!=='none'){mapFit();mapClamp();MAP.dirty=true;}});
      if(!document.getElementById('mk-style')){const st=document.createElement('style');st.id='mk-style';st.textContent=`.mk-sec{font:600 11px Georgia,serif;letter-spacing:.14em;text-transform:uppercase;color:#c8b880;margin:0 0 8px}
.mk-row{display:flex;gap:8px;align-items:flex-start;padding:6px 4px;border-bottom:1px solid rgba(120,100,60,.25);cursor:pointer;font:12px/1.35 Georgia,serif;color:#e8dcc0}
.mk-row:hover{background:rgba(200,168,74,.08)} .mk-row i{color:#b8a880} .mk-row small{color:#8a7a60}
.mk-n{flex:0 0 20px;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:700 11px Georgia,serif;color:#fbefd6;background:${MK_COL.go};margin-right:6px;vertical-align:2px}
.mk-n.mk-back{background:${MK_COL.back}} .mk-n.mk-way{background:${MK_COL.way}}
.mk-head{font:600 16px Georgia,serif;color:#e8d8a0} .mk-line{color:#b8a880;font-size:12px;margin-top:4px}`;document.head.appendChild(st);}
      root.addEventListener('wheel',ev=>{ev.preventDefault();if(MAP.mode!=='map')return;const r=root.getBoundingClientRect();const mx=ev.clientX-r.left,my=ev.clientY-r.top;const [wx,wz]=screenToMap(mx,my);MAP.zoom=Math.max(1,Math.min(64,MAP.zoom*(ev.deltaY<0?1.18:1/1.18)));const s=baseScale()*MAP.zoom;MAP.ox=mx-wx*s;MAP.oy=my-wz*s;mapClamp();MAP.dirty=true;},{passive:false});
    }
    root.style.display='block';
    MAP.cv=root;MAP.ctx=root.getContext('2d');mapFit();MAP.mode='map';
    // open at province scale, centred on the player
    MAP.zoom=Math.max(1,Math.min(64,(Math.min(MAP.cssW,MAP.cssH)*.55)/(SIZE*baseScale())));wireMapSearch();
    const s=baseScale()*MAP.zoom;MAP.ox=MAP.cssW/2-px*s;MAP.oy=MAP.cssH/2-pz*s;mapClamp();
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
  // S676 — the house a Mages' hearth task sends you to keeps its hearth cold (ash, no flames, no light) until the task is done;
  // the interior's tick lights it (tickInterior, 84-world-interiors.js) the moment the guild marks the task done
  function coldHearthHouse(house){if(!house||house.type!=='home')return false;const G=worldState.guild,t=G&&G.guild_m&&G.guild_m.active;
    if(!t||t.kind!=='hearth'||t.done)return false;if(t.house&&t.house!==house.id)return false;const S=SETTLE.get(t.siteId);return !!(S&&S.houses.includes(house));}
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
    const Dr=K.bake(Q);Dr.position.set(W/2,0,D);Dr.rotation.y=Math.PI;Dr.userData.entrance=true;Dr.userData.leaf=[w,h];if(type==='tower')Dr.scale.setScalar(SCALE.ROOM_K); /* S896 — the tower is not scaled (scaleRoom by 1), but its door is, to the 2.17 leaf of every other room */sc_.add(Dr);return {G,Dr,posts};}
  // S896 (F2a) — a room built in the old unit (a man 1.233 tall), made true size: every object in it moves out from the room's
  // corner by k and grows by k, except the people, who are built at their true height already and only move; the lights reach k
  // further; and every record the game keeps of the room (its solids, footholds, beds, doors, the people's boxes, the bed and the
  // stash, the chair, the hatch, the strongbox, the tower's chest, the room's size) is scaled with it, each record once.
  function scaleRoom(sc_,house,k){
    for(const o of sc_.children){o.position.multiplyScalar(k);if(o.isLight){if(o.distance)o.distance*=k;continue;}if(o.userData&&o.userData.rig)continue;o.scale.multiplyScalar(k);}
    if(sc_.fog){sc_.fog.near*=k;sc_.fog.far*=k;}
    const done=new Set(),S=(r,keys)=>{if(!r||done.has(r))return;done.add(r);for(const q of keys)if(typeof r[q]==='number')r[q]*=k;};
    const BOX=['x0','x1','z0','z1','y0','y1'];
    (INT_SOL||[]).forEach(r=>S(r,BOX));
    (FOOTHOLDS||[]).forEach(r=>S(r,[...BOX,'y','cx','cz','r0','r1']));
    (INT_BEDS||[]).forEach(r=>S(r,['x','z','y','cz']));
    (INT_DOORS||[]).forEach(r=>{S(r,['x','z','y']);S(r.sol,BOX);S(r.box,BOX);});
    (INT_NPCS||[]).forEach(r=>S(r.box,BOX));
    for(const r of [intBedPos,intStashPos,INT_CHAIR,INT_LOOT,INT_BOX,INT_SHELF,house._hatch])S(r,['x','z','y']);
    if(HATCH.active||HATCH.x!=null)S(HATCH,['x','z','y']);
    house.intW*=k;house.intD*=k;
  }
  // S1161 (card F9, Michael's 2 A on #320) — on the new look, a Gatelands village inn on three bays (the kit's farmhouse outside, S1086)
  // is the kit's taproom inside (PKIT.gl.inn, rooms.js's Session 893): the farmhouse's own walls, the hearth in the west gable, the bar
  // across the back, the stair up the east gable to the passage and three rooms to let. It is drawn in metres, so nothing is scaled
  // (scaleRoom's k is 1, as the tower's); the kit's frame (centre on the ground, front +z, floor at F0) moves to the room's (0 to W,
  // the door at W/2 on z = D, the floor at 0). A coaching inn keeps the old room (its board and its travellers are laid out there).
  // S1276 — a village inn on two bays (7.4 m, its door in the west bay) is the same taproom in the narrower house: one table, two rooms.
  function kitTaproom(house){return !!(house&&house.type==='inn'&&house.kit&&house.kit.inn&&(house.kit.bays===3||house.kit.bays===2)&&!house.coachInn&&window.OG_LOOK==='new'&&typeof PKIT!=='undefined'&&PKIT.gl&&PKIT.gl.inn);}
  function buildKitTaproom(house){
    const T=PKIT.gl.inn({paint:house.kit.paint||'green',bays:house.kit.bays},PKIT.stream(house.id+':taproom')),I=T.inner,X=I.x1,Z=I.z1,F0=T.floors[0],F1=T.floors[1]-F0,W=2*X,D=2*Z;
    const rx=x=>x+X,rz=z=>z+Z,ry=y=>y-F0;
    house._counterFront=null;house.intW=W;house.intD=D;house._roomH=+(T.ceil[1]-F0).toFixed(3);house._exitD=.8;house._exitW=1.0;house._exitX=+rx(T.door.x).toFixed(3);house._taproom=T;
    const sc_=new THREE.Scene();interiorScene=sc_;landRoomPost(sc_);sc_.background=new THREE.Color(0x120a06);sc_.fog=new THREE.Fog(0x120a06,Math.max(W,D)*.8*SCALE.ROOM_K,Math.max(W,D)*2.4*SCALE.ROOM_K);
    intNPCMesh=null;intBedPos=null;intStashPos=null;
    const SOL=[];INT_SOL=SOL;FOOTHOLDS=[];INT_BEDS=[];INT_DOORS=[];INT_DOORS.house=house.id;INT_CHAIR=null;INT_NPCS=[];HATCH.active=false;HATCH.roof=false;INT_LOOT=null;INT_BOX=null;INT_SHELF=null;
    T.group.position.set(X,-F0,Z);T.group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});sc_.add(T.group);
    // the solids are the boxes the prototype keeps for its checks (every piece of furniture, the stair's treads, the partitions, the
    // rail round the well); a box's top is a foothold, except a wall's, the rail's and the door leaf's
    // (the rail down the well's west side stops 0.25 short of the landing as a solid: the landing is 0.75 deep, and a body of 0.3 would
    // otherwise round its end in a band of 0.2)
    for(const q of T.boxes){if(q.tag==='hearthstone')continue;const b={x0:rx(q.x0),x1:rx(q.x1),z0:rz(q.z0),z1:rz(q.z1),y0:ry(q.y0),y1:ry(q.y1)};if(q.tag==='wellrail'&&q.x1-q.x0<.2)b.z0+=.25;SOL.push(b);
      if(!['partition','wellrail','leaf'].includes(q.tag))FOOTHOLDS.push({x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,y:b.y1});}
    // the upper floor over the whole house, open over the stair's well
    FOOTHOLDS.push({x0:0,x1:W,z0:0,z1:D,y:F1,hole:{x0:rx(T.well.x0),x1:rx(T.well.x1),z0:rz(T.well.z0),z1:rz(T.well.z1)}});
    // the three rooms off the passage: a door in each doorway (the prototype leaves them open), the bed in each the inn's to let, room k
    T.rooms.forEach((R,k)=>{intDoorAt(sc_,SOL,rx(R.door.x),rz(R.door.z),F1,Math.PI/2,0x4a3420,{w:R.door.w-.04,h:R.door.h-.04});});
    T.beds.forEach((b,k)=>{INT_BEDS.push({x:rx((b.x0+b.x1)/2),z:rz((b.z0+b.z1)/2),y:+F1.toFixed(3),owner:'inn',room:k,cz:rz((b.z0+b.z1)/2)});});
    intBedPos={x:INT_BEDS[INT_BEDS.length-1].x,z:INT_BEDS[INT_BEDS.length-1].z};
    // the cellar's hatch in the flags of the front west corner, off the hearth, the stools and the walks
    if(hasCellar(house)){const hx=rx(-X+.85),hz=rz(Z-(house.kit.bays===2?1.2:.5)); /* S1276 — on two bays the front door's leaf hangs open over that corner: the hatch 0.7 m further in */ const lid=new THREE.Mesh(new THREE.BoxGeometry(.8,.04,.8),new THREE.MeshLambertMaterial({color:0x3a2612}));lid.position.set(hx,.02,hz);sc_.add(lid);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.07,.015,5,10),new THREE.MeshLambertMaterial({color:0x2a2622}));ring.position.set(hx+.25,.05,hz);ring.rotation.x=Math.PI/2;sc_.add(ring);house._hatch={x:hx,z:hz};HATCH.x=hx;HATCH.z=hz;HATCH.y=0;HATCH.active=true;}
    // the day beyond the windows and the open front door: a plane outside each, lit by the hour (the room's own background is the dark)
    {const hr=typeof gameHour==='function'?gameHour():12,day=hr>=7&&hr<18?0xc4d0dc:hr>=5&&hr<20?0x8a7a7a:0x0e1420,M=new THREE.MeshBasicMaterial({color:day});
      const out=(x,y,z,w,h,f)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w+.1,h+.1),M);m.position.set(rx(x),ry(y+h/2),rz(z)+f*.08);m.rotation.y=f>0?Math.PI:0;m.userData.daylight=true;sc_.add(m);};
      for(const w of T.windows)if(w.face==='front'||w.face==='back')out(w.x,w.y,w.z,w.w,w.h,w.face==='front'?1:-1);
      out(T.door.x,F0,T.door.z,T.door.w,T.door.h,1);}
    // the light: the fire in the hearth, the lantern over the bar, one on the passage upstairs, and the room's warmth
    sc_.add(new THREE.AmbientLight(0xffb070,.45));
    const L=(x,y,z,c,i,d)=>{const l=new THREE.PointLight(c,i,d);l.position.set(x,y,z);sc_.add(l);return l;};
    L(rx(T.fire[0]+.6),ry(T.fire[1]+.3),rz(T.fire[2]),0xff6a20,1.5,7);L(rx(T.lamp[0]),ry(T.lamp[1]),rz(T.lamp[2]),0xffaa44,1.6,9);L(W/2,F1+2.1,rz(T.passage-.3),0xffaa44,.5,7);
    for(const R of T.rooms)L(rx((R.x0+R.x1)/2),F1+1.6,rz(Z-1.2),0xffb070,.5,4);
    // the innkeeper behind the bar, between it and the rack of kegs, facing the room
    const npc={x:rx((T.bar.x0+T.bar.x1)/2),z:rz(T.bar.z0-.2)};
    if(npcInsideNow(house)){const g=buildNPCMesh({role:'Innkeeper',name:house.keeper,_twin:house._twin,bCol:house.bCol||0x5a4030,sCol:house.sCol||0xd4a878},{nation:nationAt(house.doorX,house.doorZ),key:house.siteId||''});
      g.rotation.y=Math.PI;g.position.set(npc.x,0,npc.z);sc_.add(g);intNPCMesh=g;intNPCPos={x:npc.x,z:npc.z};
      intNPCMesh.userData.amble={wa:0,wt:1,minZ:npc.z,maxZ:npc.z,minX:rx(T.bar.x0+.3),maxX:rx(T.bar.x1-.3),speed:.25,paused:true};}
    else{intNPCMesh=null;intNPCPos={x:-99,z:-99};}
    return sc_;
  }
  // S1392 (card F9, Michael's A on #303; OG-115) — on the new look a Gatelands village home standing as the kit's cottage (2, 3 or 4
  // bays, lot.kit) is the kit's cottage inside (PKIT.gl.cottage, rooms.js's Session 852 laid out by bays in Session 1380): its own walls
  // and thatch, the hearth-lobby kitchen, the room below and (on four bays) the room above; on two bays one room, the hearth in the east
  // gable. Drawn in metres and moved into the room's frame as the taproom is (nothing scaled). The box bed is the resident's, head to the
  // wall (-z) as every home's bed; the home's chest at its foot (beside its head on three bays, by the back wall in one room).
  function kitCottage(house){return !!(house&&house.type==='home'&&house.kit&&house.kit.kind==='cottage'&&[2,3,4].includes(house.kit.bays)&&window.OG_LOOK==='new'&&typeof PKIT!=='undefined'&&PKIT.gl&&PKIT.gl.cottage);}
  function buildKitCottage(house){
    const T=PKIT.gl.cottage({paint:house.kit.paint||'red',bays:house.kit.bays},PKIT.stream(house.id+':cottage')),I=T.inner,X=I.x1,Z=I.z1,W=2*X,D=2*Z,n=T.bays;
    const rx=x=>x+X,rz=z=>z+Z;
    house._counterFront=null;house.intW=W;house.intD=D;house._roomH=+(PKIT.gl.PS.storey.cottage+1.35).toFixed(3);house._exitD=T.one?.8:.4;house._exitW=1.0;house._exitX=+rx(T.door.x).toFixed(3);house._cottage=T; /* the head stops under the collars */
    /* the lobby is 0.9 m deep: you arrive in it 0.3 m east of the door, clear of the breast and the jamb, and the door's reach is its last 0.4 m */
    house._arriveX=T.one?null:+rx(T.door.x+.3).toFixed(3);house._arriveZ=T.one?null:+(D-.5).toFixed(3);
    const sc_=new THREE.Scene();interiorScene=sc_;landRoomPost(sc_);sc_.background=new THREE.Color(0x120a06);sc_.fog=new THREE.Fog(0x120a06,Math.max(W,D)*.8*SCALE.ROOM_K,Math.max(W,D)*2.4*SCALE.ROOM_K);
    intNPCMesh=null;intBedPos=null;intStashPos=null;
    const SOL=[];INT_SOL=SOL;FOOTHOLDS=[];INT_BEDS=[];INT_DOORS=[];INT_DOORS.house=house.id;INT_CHAIR=null;INT_NPCS=[];HATCH.active=false;HATCH.roof=false;INT_LOOT=null;INT_BOX=null;INT_SHELF=null;
    T.group.position.set(X,0,Z);T.group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});sc_.add(T.group);
    const box=(x0,x1,y0,y1,z0,z1,foot)=>{const b={x0:rx(x0),x1:rx(x1),z0:rz(z0),z1:rz(z1),y0,y1};SOL.push(b);if(foot)FOOTHOLDS.push({x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,y:y1});return b;};
    // the solids are the boxes the prototype keeps for its checks (every piece of furniture, the hearth's cheeks, the jamb wall; a bed's
    // to the top of its blanket); a box's top is a foothold, except the cheeks' and the jamb's
    for(const q of T.boxes){if(q.tag==='hearthstone')continue;box(q.x0,q.x1,q.y0,/^bed/.test(q.tag)?.55:q.y1,q.z0,q.z1,!['breast','jamb'].includes(q.tag));} /* a bed stands to its tick and blanket (0.55), as the step's rule wants a bed to stop you */
    // the hearth wall and the room above's partition, each open at its door; the chimney breast over the hearth and the hearth's own
    // recess (no walking into the fire); the dresser's rack; the box bed's ends and back
    for(const d of T.doors){const t=d.wall==='hearth'?.3:.05;box(d.x-t,d.x+t,0,9,-Z,d.z-d.w/2);box(d.x-t,d.x+t,0,9,d.z+d.w/2,Z);box(d.x-t,d.x+t,d.h,9,d.z-d.w/2,d.z+d.w/2);}
    {const s=T.one?-1:1,f=T.hearth[0],w=f-s*.55,hz=T.hearth[2];box(Math.min(w,f),Math.max(w,f),1.25,9,hz-1.15,hz+1.15);box(Math.min(w,f),Math.max(w,f),0,1.25,hz-.8,hz+.8);}
    {const q=T.boxes.find(q=>q.tag==='dresser'),f=T.one?-1:1,zw=f>0?q.z0:q.z1;box(q.x0,q.x1,.85,2.16,Math.min(zw,zw+f*.34),Math.max(zw,zw+f*.34));}
    {const b=T.bed;box(b.x0,b.x1,.32,2.0,b.z0,b.z0+.05);box(b.x0,b.x1,.32,2.0,b.z1-.05,b.z1);box(b.x1-.04,b.x1,.32,2.0,b.z0,b.z1);}
    // the doors in the hearth wall and the partition: a leaf hung in each doorway (the prototype leaves them open)
    for(const d of T.doors)intDoorAt(sc_,SOL,rx(d.x),rz(d.z),0,0,0x4a3420,{w:d.w-.04,h:d.h-.04});
    // the box bed is the resident's (the sleeper lies in it, head to -z)
    {const b=T.bed,x=rx((b.x0+b.x1)/2),cz=rz((b.z0+b.z1)/2);INT_BEDS.push({x,z:cz+.2,y:0,owner:'home',room:null,cz});intBedPos={x,z:cz+.2};}
    // the home's chest: at the box bed's foot (four bays), in the room below between its bed and the hearth wall (three: the box bed
    // stands in the gable's middle), by the back wall between the bed and the fire (one)
    {const b=T.bed,[cx,cz]=n===4?[(b.x0+b.x1)/2+.07,b.z1+.31]:n===3?[T.doors[0].x-.8,-.5]:[b.x1+.33,-Z+.35],bx=rx(cx),bz=rz(cz);
      const bg=new THREE.Group(),shell=buildChestShell(bg,.45,0x6a4a2c);bg.position.set(bx,0,bz);sc_.add(bg);SOL.push({x0:bx-.32,x1:bx+.32,z0:bz-.28,z1:bz+.28,y0:0,y1:.5});
      INT_BOX={x:bx,z:bz,lid:shell.lid,g:bg,id:house.id,kind:'home',type:'home',house,open:false};}
    // a bought house's cellar: the hatch in the kitchen's flags, off the chair, the dresser and the walks (in one room, in the passage)
    if(hasCellar(house)){const [hx0,hz0]=n===4?[.4,-1.1]:n===3?[1.5,-1.1]:[T.door.x,-.4],hx=rx(hx0),hz=rz(hz0);const lid=new THREE.Mesh(new THREE.BoxGeometry(.8,.04,.8),new THREE.MeshLambertMaterial({color:0x3a2612}));lid.position.set(hx,.07,hz);sc_.add(lid);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.07,.015,5,10),new THREE.MeshLambertMaterial({color:0x2a2622}));ring.position.set(hx+.25,.1,hz);ring.rotation.x=Math.PI/2;sc_.add(ring);house._hatch={x:hx,z:hz};HATCH.x=hx;HATCH.z=hz;HATCH.y=0;HATCH.active=true;}
    // the day beyond the windows and the open front door: a plane outside each, lit by the hour (the room's own background is the dark)
    {const hr=typeof gameHour==='function'?gameHour():12,day=hr>=7&&hr<18?0xc4d0dc:hr>=5&&hr<20?0x8a7a7a:0x0e1420,M=new THREE.MeshBasicMaterial({color:day});
      const out=(x,y,z,w,h,f)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w+.1,h+.1),M);m.position.set(rx(x),y+h/2,rz(z)+f*.08);m.rotation.y=f>0?Math.PI:0;m.userData.daylight=true;sc_.add(m);};
      for(const w of T.windows)if(w.face==='front'||w.face==='back')out(w.x,w.y,w.z,w.w,w.h,w.face==='front'?1:-1);
      out(T.door.x,0,T.door.z,T.door.w,T.door.h,1);}
    // the light: the fire on the hearth, the lantern from the kitchen's collar, the room's warmth. The hearth's flames and embers ride in
    // their own group (the candle's flame stays out of it), so the cold hearth of a Mages' task (S676) shows ash and no light until
    // tickInterior lights it
    sc_.add(new THREE.AmbientLight(0xffb070,.45));
    const L=(x,y,z,c,i,d)=>{const l=new THREE.PointLight(c,i,d);l.position.set(x,y,z);sc_.add(l);return l;};
    const cold=coldHearthHouse(house),hl=L(rx(T.fire[0]+(T.one?-.6:.6)),T.fire[1]+.3,rz(T.fire[2]),0xff6a20,cold?0:1.5,7);L(rx(T.lantern[0]),T.lantern[1],rz(T.lantern[2]),0xffaa44,1.2,7);
    {const hf=new THREE.Group();hf.name='hearthFire';T.room.add(hf);
      for(const m of T.room.children.filter(m=>m.isMesh&&(m.name==='ember'||m.name==='flame'))){if(m.name==='ember'){hf.add(m);continue;}
        const P=m.geometry.attributes.position,lo=[],hi=[];for(let i=0;i<P.count;i+=3){const y=(P.getY(i)+P.getY(i+1)+P.getY(i+2))/3,dst=y<.6?lo:hi;for(let k=0;k<3;k++)dst.push(P.getX(i+k),P.getY(i+k),P.getZ(i+k));}
        const mk=a=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.computeVertexNormals();const q=new THREE.Mesh(g,m.material);q.name='flame';return q;};
        m.geometry.dispose();T.room.remove(m);hf.add(mk(lo));if(hi.length)T.room.add(mk(hi));}
      hf.visible=!cold;const holder=new THREE.Group();holder.userData.hearthFire=hf;holder.userData.hearthLight=hl;if(cold)holder.userData.coldHouse=house;sc_.add(holder);furnSwap(holder);}
    // the resident, in the kitchen where the way from the door turns to the fire, facing into the room
    const np=T.path[T.one?1:2],npc={x:rx(np[0]),z:rz(np[1])};
    if(npcInsideNow(house)){const g=buildNPCMesh({role:'Resident',name:house.keeper,_twin:house._twin,bCol:house.bCol||0x5a4030,sCol:house.sCol||0xd4a878},{nation:nationAt(house.doorX,house.doorZ),key:house.siteId||''});
      g.rotation.y=Math.PI;g.position.set(npc.x,0,npc.z);sc_.add(g);intNPCMesh=g;intNPCPos={x:npc.x,z:npc.z};
      intNPCMesh.userData.amble={wa:0,wt:1,minZ:npc.z,maxZ:npc.z,minX:npc.x,maxX:npc.x,speed:.25,paused:true};
      if(homeAsleepNow(house))laySleeper(intNPCMesh);}
    else{intNPCMesh=null;intNPCPos={x:-99,z:-99};}
    return sc_;
  }
  // S1288 (card F9, Michael's A on #321 and #588) — on the new look a Markish inn standing as the kit's hall (lot.kit.alehall, S1288's
  // planning) is the Mark's alehall inside (PKIT.mk.alehall, rooms.js's Session 894, as drawn: 10 by 18 m): the long hearth under the
  // louver, the long tables, the counter across the back with the kegs behind it, and the furred wall benches the guests sleep on. It is
  // drawn in metres and moved into the room's frame as the taproom is (nothing scaled). The six places to let are three on each bench,
  // room 0 to 5: the left bench as you come in, then the right, each from the door to the counter (innBenchName, 86-world-crime.js).
  function kitAlehall(house){return !!(house&&house.type==='inn'&&house.kit&&house.kit.alehall&&!house.coachInn&&window.OG_LOOK==='new'&&typeof PKIT!=='undefined'&&PKIT.mk&&PKIT.mk.alehall);}
  function buildKitAlehall(house){
    const T=PKIT.mk.alehall({},PKIT.stream(house.id+':alehall')),I=T.inner,X=I.x1,Z=I.z1,FY=T.floor,W=2*X,D=2*Z;
    const rx=x=>x+X,rz=z=>z+Z,ry=y=>y-FY;
    house._counterFront=null;house.intW=W;house.intD=D;house._roomH=+(T.tieBeam-FY).toFixed(3);house._exitD=.8;house._exitW=1.0;house._exitX=+rx(T.door.x).toFixed(3);house._alehall=T;
    const sc_=new THREE.Scene();interiorScene=sc_;landRoomPost(sc_);sc_.background=new THREE.Color(0x120a06);sc_.fog=new THREE.Fog(0x120a06,Math.max(W,D)*.8*SCALE.ROOM_K,Math.max(W,D)*2.4*SCALE.ROOM_K);
    intNPCMesh=null;intBedPos=null;intStashPos=null;
    const SOL=[];INT_SOL=SOL;FOOTHOLDS=[];INT_BEDS=[];INT_DOORS=[];INT_DOORS.house=house.id;INT_CHAIR=null;INT_NPCS=[];HATCH.active=false;HATCH.roof=false;INT_LOOT=null;INT_BOX=null;INT_SHELF=null;
    T.group.position.set(X,-FY,Z);T.group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});sc_.add(T.group);
    // the solids are the prototype's boxes (the posts, the hearth's kerb, the benches, the tables, the counter, the kegs, the rack, the
    // barrel, the door's leaf); a box's top is a foothold, except a post's and the leaf's. The benches (0.45 high, the plank's top) are
    // held to STEP_UP (0.40), so you step up onto one: the wall bench lies behind the posts and the long table, and the only way to your
    // place is along it, in the 0.54 m between the posts and the wall (furs underfoot, 5 cm sunk)
    for(const q of T.boxes){const b={x0:rx(q.x0),x1:rx(q.x1),z0:rz(q.z0),z1:rz(q.z1),y0:ry(q.y0),y1:ry(q.y1)};if(q.tag==='wallbench'||q.tag==='bench'){b.y0=0;b.y1=STEP_UP;}SOL.push(b);
      if(!['post','door'].includes(q.tag))FOOTHOLDS.push({x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,y:b.y1});}
    // the places to let: three on each wall bench, at the middles of its thirds, the left (-x) bench first, each from the door (+z) inward
    const wall=T.benches.filter(b=>b.kind==='wall').sort((a,b)=>a.x0-b.x0);
    wall.forEach((b,s)=>{const L=b.z1-b.z0;for(let k=0;k<3;k++){const z=b.z1-L*(k+.5)/3;INT_BEDS.push({x:rx((b.x0+b.x1)/2),z:rz(z),y:STEP_UP,owner:'inn',room:s*3+k,cz:rz(z),bench:true});}});
    intBedPos={x:INT_BEDS[0].x,z:INT_BEDS[0].z};
    // the cellar's hatch in the boards of the front right corner, between the right bench's end and the water barrel, off the walk
    if(hasCellar(house)){const hx=rx(X-1.7),hz=rz(Z-1.25);const lid=new THREE.Mesh(new THREE.BoxGeometry(.8,.04,.8),new THREE.MeshLambertMaterial({color:0x3a2612}));lid.position.set(hx,.02,hz);sc_.add(lid);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.07,.015,5,10),new THREE.MeshLambertMaterial({color:0x2a2622}));ring.position.set(hx-.25,.05,hz);ring.rotation.x=Math.PI/2;sc_.add(ring);house._hatch={x:hx,z:hz};HATCH.x=hx;HATCH.z=hz;HATCH.y=0;HATCH.active=true;}
    // the day beyond the side walls' shuttered windows (the hall's, one every 4 m) and the open front door, by the hour
    {const hr=typeof gameHour==='function'?gameHour():12,day=hr>=7&&hr<18?0xc4d0dc:hr>=5&&hr<20?0x8a7a7a:0x0e1420,M=new THREE.MeshBasicMaterial({color:day});
      const n=Math.max(1,Math.floor(T.d/4));for(let i=0;i<n;i++){const z=-T.d/2+(i+.5)*T.d/n;for(const sx of [-1,1]){const m=new THREE.Mesh(new THREE.PlaneGeometry(.7,.6),M);m.position.set(rx(sx*(T.w/2+.08)),ry(FY+1.55),rz(z));m.rotation.y=-sx*Math.PI/2;m.userData.daylight=true;sc_.add(m);}}
      const m=new THREE.Mesh(new THREE.PlaneGeometry(T.door.w+.1,T.door.h+.1),M);m.position.set(rx(T.door.x),T.door.h/2,rz(T.door.z)+.08);m.rotation.y=Math.PI;m.userData.daylight=true;sc_.add(m);}
    // the light: the long fire, the three iron lamps over the tables and the aisle, and the hall's warmth
    sc_.add(new THREE.AmbientLight(0xffb070,.4));
    const L=(x,y,z,c,i,d)=>{const l=new THREE.PointLight(c,i,d);l.position.set(x,y,z);sc_.add(l);return l;};
    L(rx(T.fire[0]),ry(T.fire[1]+.5),rz(T.fire[2]),0xff6a20,1.8,10);for(const P of T.lamps)L(rx(P[0]),ry(P[1]),rz(P[2]),0xffaa44,1.1,8);
    // the keeper behind the counter, between it and the kegs, facing the hall
    const C=T.counter,npc={x:rx((C.x0+C.x1)/2),z:rz(C.z0-.35)};
    if(npcInsideNow(house)){const g=buildNPCMesh({role:'Innkeeper',name:house.keeper,_twin:house._twin,bCol:house.bCol||0x5a4030,sCol:house.sCol||0xd4a878},{nation:nationAt(house.doorX,house.doorZ),key:house.siteId||''});
      g.rotation.y=Math.PI;g.position.set(npc.x,0,npc.z);sc_.add(g);intNPCMesh=g;intNPCPos={x:npc.x,z:npc.z};
      intNPCMesh.userData.amble={wa:0,wt:1,minZ:npc.z,maxZ:npc.z,minX:rx(C.x0+.3),maxX:rx(C.x1-.3),speed:.25,paused:true};}
    else{intNPCMesh=null;intNPCPos={x:-99,z:-99};}
    return sc_;
  }
  // S1320 (card F9, Michael's 1 A and 2 B on #602) — on the new look an Aurennais port's inn on the quay (lot.kit.kind 'aurtavern', S1320's
  // planning) is Aurenne's tavern inside (PKIT.au.tavern with its rooms, rooms.js's Sessions 895, 1296 and 1307): the tiled room, the
  // counter across the back under its amphorae, the cooking bench, the stair of 16 risers up the west wall to a passage along the back
  // and three rooms off it, a bed, a chest and a basin in each. The same pieces as the street sees (one stream, by the town), drawn in
  // metres and moved into the room's frame as the taproom is (nothing scaled). Its doorways upstairs hang doors that open and shut (the
  // keeper lets "a bolt on the door"); room 0 is the west room, over the stair's foot, the nearest door on your right at the stair's head.
  const TAVERN_O={rooms:true,gate:1,leaves:false};
  function kitTavern(house){return !!(house&&house.type==='inn'&&house.kit&&house.kit.kind==='aurtavern'&&window.OG_LOOK==='new'&&typeof PKIT!=='undefined'&&PKIT.au&&PKIT.au.tavern);}
  function buildKitTavern(house){
    const T=PKIT.au.tavern(TAVERN_O,PKIT.stream(`${house.siteId}:tavern`)),I=T.inner,X=I.x1,Z=I.z1,F0=T.floors[0],F1=T.floors[1]-F0,W=2*X,D=2*Z;
    const rx=x=>x+X,rz=z=>z+Z,ry=y=>y-F0;
    house._counterFront=null;house.intW=W;house.intD=D;house._roomH=+(T.ceil[1]-F0).toFixed(3);house._exitD=.8;house._exitW=1.0;house._exitX=+rx(T.door.x).toFixed(3);house._tavern=T;
    const sc_=new THREE.Scene();interiorScene=sc_;landRoomPost(sc_);sc_.background=new THREE.Color(0x120a06);sc_.fog=new THREE.Fog(0x120a06,Math.max(W,D)*.8*SCALE.ROOM_K,Math.max(W,D)*2.4*SCALE.ROOM_K);
    intNPCMesh=null;intBedPos=null;intStashPos=null;
    const SOL=[];INT_SOL=SOL;FOOTHOLDS=[];INT_BEDS=[];INT_DOORS=[];INT_DOORS.house=house.id;INT_CHAIR=null;INT_NPCS=[];HATCH.active=false;HATCH.roof=false;INT_LOOT=null;INT_BOX=null;INT_SHELF=null;
    T.group.position.set(X,-F0,Z);T.group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});sc_.add(T.group);
    // the solids are the prototype's boxes inside the walls (the loggia's and the terrace's lie outside the front door, out of reach):
    // the furniture, the stair's treads and its landing, the oil jars, the partitions upstairs; a box's top is a foothold, except a
    // partition's and the front door's open leaf
    for(const q of T.boxes){if(q.z0>=Z-.01)continue;const b={x0:rx(q.x0),x1:rx(q.x1),z0:rz(q.z0),z1:rz(q.z1),y0:ry(q.y0),y1:ry(q.y1)};SOL.push(b);
      if(!['partition','leaf'].includes(q.tag))FOOTHOLDS.push({x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,y:b.y1});}
    // the upper floor over the whole house, open over the stair's well
    FOOTHOLDS.push({x0:0,x1:W,z0:0,z1:D,y:+F1.toFixed(3),hole:{x0:rx(T.well.x0),x1:rx(T.well.x1),z0:rz(T.well.z0),z1:rz(T.well.z1)}});
    // the three rooms off the passage: a door in each doorway, the bed in each the inn's to let, room k from the west
    T.rooms.forEach(R=>{intDoorAt(sc_,SOL,rx(R.door.x),rz(R.door.z),F1,Math.PI/2,0x6a4428,{w:R.door.w-.04,h:R.door.h-.04});});
    T.beds.forEach((b,k)=>{INT_BEDS.push({x:rx((b.x0+b.x1)/2),z:rz((b.z0+b.z1)/2),y:+F1.toFixed(3),owner:'inn',room:k,cz:rz((b.z0+b.z1)/2)});});
    intBedPos={x:INT_BEDS[INT_BEDS.length-1].x,z:INT_BEDS[INT_BEDS.length-1].z};
    // the cellar's hatch in the tiles of the front east corner, between the right table's stool and the door's walk
    if(hasCellar(house)){const hx=rx(X-.75),hz=rz(Z-.7);const lid=new THREE.Mesh(new THREE.BoxGeometry(.8,.04,.8),new THREE.MeshLambertMaterial({color:0x3a2612}));lid.position.set(hx,.02,hz);sc_.add(lid);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.07,.015,5,10),new THREE.MeshLambertMaterial({color:0x2a2622}));ring.position.set(hx-.25,.05,hz);ring.rotation.x=Math.PI/2;sc_.add(ring);house._hatch={x:hx,z:hz};HATCH.x=hx;HATCH.z=hz;HATCH.y=0;HATCH.active=true;}
    // the day beyond the open front door and every window of both floors (the house's openings, drawn open), by the hour: a plane
    // outside each, the arch's head included (the loggia and the terrace beyond the front are the street's)
    {const hr=typeof gameHour==='function'?gameHour():12,day=hr>=7&&hr<18?0xc4d0dc:hr>=5&&hr<20?0x8a7a7a:0x0e1420,M=new THREE.MeshBasicMaterial({color:day}),hw=T.w/2+.08,hd=T.d/2+.08;
      const P=[],out=(x,y,z,w,h,a)=>{const g=new THREE.PlaneGeometry(w+.1,h+.1).toNonIndexed();g.rotateY(a);g.translate(rx(x),ry(y+h/2),rz(z));P.push(g.attributes.position.array);g.dispose();};
      const O=T.open;for(const q of O.front)out(q.x,T.yW+q.y,hd,q.w,q.h+(q.arch?q.w/2:0),Math.PI);for(const q of O.back)out(-q.x,T.yW+q.y,-hd,q.w,q.h+(q.arch?q.w/2:0),0);
      for(const q of O.side)out(hw,T.yW+q.y,q.x,q.w,q.h+(q.arch?q.w/2:0),-Math.PI/2);for(const q of O.west)out(-hw,T.yW+q.y,-q.x,q.w,q.h+(q.arch?q.w/2:0),Math.PI/2);
      const A=new Float32Array(P.reduce((n,a)=>n+a.length,0));let o=0;for(const a of P){A.set(a,o);o+=a.length;} /* one mesh for them all */
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(A,3));const m=new THREE.Mesh(g,M);m.userData.daylight=true;sc_.add(m);}
    // the light: the brass lamps (over the left table, by the counter, in the well and over the passage), the braziers' glow, and the
    // room's warmth; one more in each guest room
    sc_.add(new THREE.AmbientLight(0xffb070,.42));
    const L=(x,y,z,c,i,d)=>{const l=new THREE.PointLight(c,i,d);l.position.set(x,y,z);sc_.add(l);return l;};
    for(const P of T.lamps)L(rx(P[0]),ry(P[1]),rz(P[2]),0xffaa44,P[1]>T.floors[1]?.7:1.3,P[1]>T.floors[1]?6:8);
    {const B=T.braziers[0];L(rx(B[0]-.3),ry(B[1]+.4),rz(B[2]+.4),0xff6a20,1.0,5);}
    for(const R of T.rooms)L(rx((R.x0+R.x1)/2),F1+1.6,rz(Z-1.2),0xffb070,.45,4);
    // the keeper behind the counter, between it and the shelves, facing the room
    const C=T.counter,npc={x:rx((C.x0+C.x1)/2),z:rz(C.z0-.3)};
    if(npcInsideNow(house)){const g=buildNPCMesh({role:'Innkeeper',name:house.keeper,_twin:house._twin,bCol:house.bCol||0x5a4030,sCol:house.sCol||0xd4a878},{nation:nationAt(house.doorX,house.doorZ),key:house.siteId||''});
      g.rotation.y=Math.PI;g.position.set(npc.x,0,npc.z);sc_.add(g);intNPCMesh=g;intNPCPos={x:npc.x,z:npc.z};
      intNPCMesh.userData.amble={wa:0,wt:1,minZ:npc.z,maxZ:npc.z,minX:rx(C.x0+.3),maxX:rx(C.x1-.3),speed:.25,paused:true};}
    else{intNPCMesh=null;intNPCPos={x:-99,z:-99};}
    return sc_;
  }
  // S1368 (card F9, Michael's A on #660) — on the new look a Gatelands town's coaching inn (lot.kit.kind 'coachinn', S1339) is its own
  // room inside (PKIT.gl.coachRoom, rooms.js's Session 1351, with three rooms to let across the first floor's front): the taproom 11.7
  // by 8.1 m inside the street's own 12.6 by 9 m front (the open hearth under the west stack, the bar across the back, three tables and
  // the coach passengers' corner at the east grate), the dog-leg stair in the fourth bay, and up it a corridor on each floor with the
  // rooms off it, eight in all. It is drawn in metres and moved into the room's frame as the taproom is (nothing scaled). Room k is the
  // prototype's order: the first floor's three front rooms from the west, the second floor's three, then the first floor's two behind.
  const COACH_ROOM_NAMES=['first floor’s west front room','first floor’s middle front room','first floor’s east front room','second floor’s west front room','second floor’s middle front room','second floor’s east front room','first floor’s west back room','first floor’s east back room'];
  function kitCoachRoom(house){return !!(house&&house.type==='inn'&&house.kit&&house.kit.kind==='coachinn'&&!house.coachInn&&window.OG_LOOK==='new'&&typeof PKIT!=='undefined'&&PKIT.gl&&PKIT.gl.coachRoom);}
  function buildKitCoachRoom(house){
    const T=PKIT.gl.coachRoom({first:'rooms',color:house.kit.colour,paint:house.kit.paint},PKIT.stream(house.id+':coachroom')),I=T.inner,X=I.x1,Z=I.z1,F0=T.floors[0],W=2*X,D=2*Z;
    const rx=x=>x+X,rz=z=>z+Z,ry=y=>y-F0,FL=T.floors.map(y=>+(y-F0).toFixed(3));
    house._counterFront=null;house.intW=W;house.intD=D;house._roomH=+(T.ceils[2]-F0).toFixed(3);house._exitD=.8;house._exitW=1.0;house._exitX=+rx(T.door.x).toFixed(3);house._coachRoom=T;
    const sc_=new THREE.Scene();interiorScene=sc_;landRoomPost(sc_);sc_.background=new THREE.Color(0x120a06);sc_.fog=new THREE.Fog(0x120a06,Math.max(W,D)*.8*SCALE.ROOM_K,Math.max(W,D)*2.4*SCALE.ROOM_K);
    intNPCMesh=null;intBedPos=null;intStashPos=null;
    const SOL=[];INT_SOL=SOL;FOOTHOLDS=[];INT_BEDS=[];INT_DOORS=[];INT_DOORS.house=house.id;INT_CHAIR=null;INT_NPCS=[];HATCH.active=false;HATCH.roof=false;INT_LOOT=null;INT_BOX=null;INT_SHELF=null;
    T.group.position.set(X,-F0,Z);T.group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});sc_.add(T.group);
    // the solids are the prototype's boxes (the furniture, the partitions of each floor, the breasts, the cupboard under the flights,
    // the rail round the well on the top floor, the doors' leaves); a seat or a table stands from its floor (its legs are not boxes),
    // so you step up onto a bench or a chair (0.44, held to STEP_UP); a box's top is a foothold, except a wall's, the rail's and a leaf's
    for(const q of T.boxes){if(q.tag==='hearthstone')continue;const b={x0:rx(q.x0),x1:rx(q.x1),z0:rz(q.z0),z1:rz(q.z1),y0:ry(q.y0),y1:ry(q.y1)};
      if(['bench','chair','stool'].includes(q.tag)){b.y0=FL[q.fl];b.y1=FL[q.fl]+STEP_UP;}else if(q.tag==='table')b.y0=FL[q.fl];SOL.push(b);
      if(!['partition','wellrail','leaf','breast'].includes(q.tag))FOOTHOLDS.push({x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,y:b.y1});}
    // the stair's treads and half-landings (the prototype keeps them as lists, not boxes): each a solid of its own thickness and a foothold
    for(const q of T.steps){const b={x0:rx(q.x0),x1:rx(q.x1),z0:rz(q.z0),z1:rz(q.z1),y0:ry(q.y)-.22,y1:ry(q.y)};SOL.push(b);FOOTHOLDS.push({x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,y:b.y1});}
    for(const q of T.landings){const b={x0:rx(q.x0),x1:rx(q.x1),z0:rz(q.z0),z1:rz(q.z1),y0:ry(q.y)-.2,y1:ry(q.y)};SOL.push(b);FOOTHOLDS.push({x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,y:b.y1});}
    // the two upper floors over the whole house, each open over the stair's well
    const hole={x0:rx(T.well.x0),x1:rx(T.well.x1),z0:rz(T.well.z0),z1:rz(T.well.z1)};
    for(const y of [FL[1],FL[2]])FOOTHOLDS.push({x0:0,x1:W,z0:0,z1:D,y,hole});
    // the eight rooms off the corridors: a door in each doorway (the prototype leaves them open), the bed in each the inn's to let, room k
    T.rooms.forEach(R=>{intDoorAt(sc_,SOL,rx(R.door.x),rz(R.door.z),FL[R.fl],Math.PI/2,0x4a3420,{w:R.door.w-.04,h:R.door.h-.04});});
    T.rooms.forEach((R,k)=>{const b=R.bed;INT_BEDS.push({x:rx((b.x0+b.x1)/2),z:rz((b.z0+b.z1)/2),y:FL[R.fl],owner:'inn',room:k,cz:rz((b.z0+b.z1)/2)});});
    intBedPos={x:INT_BEDS[INT_BEDS.length-1].x,z:INT_BEDS[INT_BEDS.length-1].z};
    // the cellar's hatch in the flags of the front west corner, between the window table's bench and the gable
    if(hasCellar(house)){const hx=rx(-X+.6),hz=rz(Z-.55);const lid=new THREE.Mesh(new THREE.BoxGeometry(.8,.04,.8),new THREE.MeshLambertMaterial({color:0x3a2612}));lid.position.set(hx,.02,hz);sc_.add(lid);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.07,.015,5,10),new THREE.MeshLambertMaterial({color:0x2a2622}));ring.position.set(hx+.25,.05,hz);ring.rotation.x=Math.PI/2;sc_.add(ring);house._hatch={x:hx,z:hz};HATCH.x=hx;HATCH.z=hz;HATCH.y=0;HATCH.active=true;}
    // the day beyond every window of the three floors and the open front and back doors, by the hour: one mesh of planes outside them
    {const hr=typeof gameHour==='function'?gameHour():12,day=hr>=7&&hr<18?0xc4d0dc:hr>=5&&hr<20?0x8a7a7a:0x0e1420,M=new THREE.MeshBasicMaterial({color:day}),hw=T.w/2+.08,hd=T.d/2+.08;
      const P=[],out=(x,y,z,w,h,a)=>{const g=new THREE.PlaneGeometry(w+.1,h+.1).toNonIndexed();g.rotateY(a);g.translate(rx(x),ry(y+h/2),rz(z));P.push(g.attributes.position.array);g.dispose();};
      for(const q of T.windows){if(q.face==='front')out(q.x,q.y,hd,q.w,q.h,Math.PI);else if(q.face==='back')out(q.x,q.y,-hd,q.w,q.h,0);else if(q.face==='right')out(hw,q.y,q.z,q.w,q.h,-Math.PI/2);else out(-hw,q.y,q.z,q.w,q.h,Math.PI/2);}
      out(T.door.x,F0,hd,T.door.w,T.door.h,Math.PI);out(T.back.x,F0,-hd,T.back.w,T.back.h,0);
      const A=new Float32Array(P.reduce((n,a)=>n+a.length,0));let o=0;for(const a of P){A.set(a,o);o+=a.length;}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(A,3));const m=new THREE.Mesh(g,M);m.userData.daylight=true;sc_.add(m);}
    // the light: the open hearth and the passengers' grate, the lantern over the bar and the one over their long table, one on each
    // corridor, one over each floor's front rooms and one over the first floor's back rooms, and the room's warmth (nine in all)
    sc_.add(new THREE.AmbientLight(0xffb070,.45));
    const L=(x,y,z,c,i,d)=>{const l=new THREE.PointLight(c,i,d);l.position.set(x,y,z);sc_.add(l);return l;};
    for(const F of T.fires.filter(f=>f[3]===0))L(rx(F[0]+(F[0]<0?.6:-.4)),ry(F[1]+.3),rz(F[2]),0xff6a20,F[4]==='open'?1.5:1.0,F[4]==='open'?7:5);
    const tap=T.lamps.filter(p=>p[3]===0),barL=tap[0],coachL=tap.find(p=>p[0]>4)||tap[tap.length-1];
    for(const p of [barL,coachL])L(rx(p[0]),ry(p[1]),rz(p[2]),0xffaa44,1.4,8);
    const cz=(T.corridor.z0+T.corridor.z1)/2;
    for(const fl of [1,2]){L(W/2,FL[fl]+2.0,rz(cz),0xffaa44,.6,8);L(W/2,FL[fl]+1.7,rz((T.corridor.z1+Z)/2),0xffb070,.55,7);}
    L(W/2,FL[1]+1.7,rz((-Z+T.corridor.z0)/2),0xffb070,.5,7);
    // the innkeeper behind the bar, between it and the rack of kegs, facing the room
    const npc={x:rx((T.bar.x0+T.bar.x1)/2),z:rz(T.bar.z0-.2)};
    if(npcInsideNow(house)){const g=buildNPCMesh({role:'Innkeeper',name:house.keeper,_twin:house._twin,bCol:house.bCol||0x5a4030,sCol:house.sCol||0xd4a878},{nation:nationAt(house.doorX,house.doorZ),key:house.siteId||''});
      g.rotation.y=Math.PI;g.position.set(npc.x,0,npc.z);sc_.add(g);intNPCMesh=g;intNPCPos={x:npc.x,z:npc.z};
      intNPCMesh.userData.amble={wa:0,wt:1,minZ:npc.z,maxZ:npc.z,minX:rx(T.bar.x0+.3),maxX:rx(T.bar.x1-.3),speed:.25,paused:true};}
    else{intNPCMesh=null;intNPCPos={x:-99,z:-99};}
    return sc_;
  }
  // S1326 (card F9; OG-043, OG-061) — on the new look an Aurennais town's church standing as the Church of the Weaver (lot.kit.kind
  // 'aurchurch', S1305) is its own room inside (PKIT.au.churchHall, rooms.js's Session 947): the nave 12.4 m square and 10.1 m to the
  // ceiling, open in an oculus into the drum and the painted dome; the bier of the dead under it, the benches by the door, the altar on
  // the sanctuary under the gilt shuttle. The shell is the street's church (one stream, by the town), drawn in metres and moved into the
  // room's frame as the tavern is (nothing scaled). The priest keeps his vigil between the sanctuary's step and the bier's head.
  function kitChurchHall(house){return !!(house&&house.type==='church'&&house.kit&&house.kit.kind==='aurchurch'&&window.OG_LOOK==='new'&&typeof PKIT!=='undefined'&&PKIT.au&&PKIT.au.churchHall);}
  function buildKitChurchHall(house){
    const T=PKIT.au.churchHall({shell:`${house.siteId}:church`},PKIT.stream(house.id+':churchhall')),I=T.inner,X=I.x1,Z=I.z1,F0=T.floor,W=2*X,D=2*Z,Ci=PKIT.au.churchBox({rank:'town',w:14,tower:1}).inner;
    const rx=x=>x+X,rz=z=>z+Z,ry=y=>y-F0;
    house._counterFront=null;house.intW=W;house.intD=D;house._roomH=+(T.ceil-F0).toFixed(3);house._exitD=.8;house._exitW=1.3;house._exitX=+rx(T.door.x).toFixed(3);house._churchHall=T;
    const sc_=new THREE.Scene();interiorScene=sc_;landRoomPost(sc_);sc_.background=new THREE.Color(0x0e0c0a);sc_.fog=new THREE.Fog(0x0e0c0a,Math.max(W,D)*1.2*SCALE.ROOM_K,Math.max(W,D)*3*SCALE.ROOM_K);
    intNPCMesh=null;intBedPos=null;intStashPos=null;
    const SOL=[];INT_SOL=SOL;FOOTHOLDS=[];INT_BEDS=[];INT_DOORS=[];INT_DOORS.house=house.id;INT_CHAIR=null;INT_NPCS=[];HATCH.active=false;HATCH.roof=false;INT_LOOT=null;INT_BOX=null;INT_SHELF=null;
    T.group.position.set(X,-F0,Z);T.group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});sc_.add(T.group);
    // the solids are the prototype's boxes: the sanctuary and its step, the altar, the lectern, the bier, its candlesticks, the benches,
    // the door's leaves; a bench stands from the floor (its legs are not boxes) and the lectern to its desk; a box's top is a foothold,
    // except a candlestick's, the lectern's and a leaf's
    for(const q of T.boxes){const b={x0:rx(q.x0),x1:rx(q.x1),z0:rz(q.z0),z1:rz(q.z1),y0:ry(q.y0),y1:ry(q.y1)};if(q.tag==='bench')b.y0=0;if(q.tag==='lectern')b.y1=ry(T.lectern.y);SOL.push(b);
      if(!['candlestick','lectern','leaf'].includes(q.tag))FOOTHOLDS.push({x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,y:b.y1});}
    // the day beyond the great door and the tall windows (three on each wall, two beside the door), by the hour: one mesh of planes
    // outside them, each as large as its opening with its arch (the wall hides the rest); the drum's twelve lights are the shell's own
    const hr=typeof gameHour==='function'?gameHour():12,dayK=hr>=7&&hr<18?1:hr>=5&&hr<20?.45:.08;
    {const day=hr>=7&&hr<18?0xc4d0dc:hr>=5&&hr<20?0x8a7a7a:0x0e1420,M=new THREE.MeshBasicMaterial({color:day}),hw=Ci.W/2+.08,ww=Math.min(1.5,Ci.W*.08),wh=Ci.H*.42+.2,wy=Ci.pl+3.2;
      const P=[],out=(x,y,z,w,h,a)=>{const g=new THREE.PlaneGeometry(w+.2,h).toNonIndexed();g.rotateY(a);g.translate(rx(x),ry(y+h/2),rz(z));P.push(g.attributes.position.array);g.dispose();};
      const tall=[0,1,2].map(i=>-Ci.W/2+(i+.5)*Ci.W/3);
      out(T.door.x,Ci.pl,hw,T.door.w,T.door.h+.2,Math.PI);for(const sx of [-1,1])out(sx*Ci.W*.3,wy,hw,ww,wh,Math.PI);
      for(const x of tall){out(x,wy,-hw,ww,wh,0);out(hw,wy,x,ww,wh,-Math.PI/2);out(-hw,wy,x,ww,wh,Math.PI/2);}
      const A=new Float32Array(P.reduce((n,a)=>n+a.length,0));let o=0;for(const a of P){A.set(a,o);o+=a.length;}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(A,3));const m=new THREE.Mesh(g,M);m.userData.daylight=true;sc_.add(m);}
    // the light: the day down through the oculus from the drum's lights, the ring of twelve lamps, the altar's candles, the bier's four,
    // the stone's cool dimness, and the day off the pale floor onto the ceiling round the oculus (a hemisphere's ground colour)
    sc_.add(new THREE.AmbientLight(0xffc890,.3));sc_.add(new THREE.HemisphereLight(0xe8ecf0,0xd8c4a4,.15+.35*dayK));
    const L=(x,y,z,c,i,d)=>{const l=new THREE.PointLight(c,i,d);l.position.set(x,y,z);sc_.add(l);return l;};
    L(X,ry(T.oculus.y),Z,0xe8eef8,.25+1.35*dayK,22);L(X,ry(T.ring.y-.2),Z,0xffaa44,1.2,10);
    {const A=T.altar;L(rx((A.x0+A.x1)/2),ry(A.y+.9),rz(A.z1+.4),0xffb060,.9,6);}L(X,ry(F0+1.9),Z,0xffb060,.8,5);
    // the priest between the sanctuary's step and the bier's candlesticks, facing the door
    const npc={x:rx(0),z:rz(T.sanctuary.z1+.34+.65)};
    if(npcInsideNow(house)){const g=buildNPCMesh({role:'Priest',name:house.keeper,_twin:house._twin,bCol:house.bCol||0x5a4030,sCol:house.sCol||0xd4a878},{nation:nationAt(house.doorX,house.doorZ),key:house.siteId||''});
      g.rotation.y=0;g.position.set(npc.x,0,npc.z);sc_.add(g);intNPCMesh=g;intNPCPos={x:npc.x,z:npc.z};
      intNPCMesh.userData.amble={wa:0,wt:1,minZ:npc.z,maxZ:npc.z,minX:npc.x,maxX:npc.x,speed:.25,paused:true};}
    else{intNPCMesh=null;intNPCPos={x:-99,z:-99};}
    return sc_;
  }
  function buildInteriorFor(house){
    const reg=house.reg||'irish',type=house.type||'misc',st=house.style||'irish';
    INT_BED_NATION=nationAt(house.doorX,house.doorZ); // S288 — the beds' wood
    furnFree();
    house._exitX=null;house._arriveX=null;house._arriveZ=null; /* S1276 (S1392: and where you arrive) — the door in the middle unless the room built now says otherwise */
    if(kitTaproom(house))return buildKitTaproom(house); /* S1161 — the kit's taproom, at its true size */
    if(kitAlehall(house))return buildKitAlehall(house); /* S1288 — the Mark's alehall, at its true size */
    if(kitTavern(house))return buildKitTavern(house); /* S1320 — Aurenne's tavern on the quay, at its true size */
    if(kitCoachRoom(house))return buildKitCoachRoom(house); /* S1368 — a town's coaching inn inside, at its true size */
    if(kitCottage(house))return buildKitCottage(house); /* S1392 — a Gatelands village's cottage inside, at its true size */
    if(kitChurchHall(house))return buildKitChurchHall(house); /* S1326 — the Church of the Weaver inside, at its true size */
    const two=!!house.two;
    // S896 (F2a) — the room's true size in metres (07-scale.js; visual-foundation.md §1: a cottage room 4 to 6 across, an inn's hall
    // 10 to 14, a church's nave 8 to 12 wide), then laid out in the old unit (÷ SCALE.ROOM_K) and scaled back up at the end
    // (scaleRoom). Before, every room was its footprint × 1.8 (at least 8 across) in units where a man stood 1.23, so a cottage
    // read 15 m across to a 1.78 m eye. A room may still be larger inside than its house outside, as games do: an inn's hall and a
    // church's nave keep their sizes in a small house (F6 grows those buildings). The ceilings are the old ones in the old unit
    // (2.9 to 3.2 m true), the furniture the kit's (F=.62 is the kit's squash of heights, true once scaled).
    house._counterFront=null; /* S896 — set again by counter() below if this room has one */
    const KR=SCALE.ROOM_K,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),hw=house.w||6,hd=house.d||5;
    const SHOP=['weapon','armor','potion','misc','shipwright','barber'].includes(type);
    let Wt=SHOP?cl(hw*1.2,type==='barber'?8:7,9):cl(hw,4.6,6),Dt=SHOP?cl(hd*1.3,7,8.5)+(type!=='barber'&&hd>=4.5?4.7:0):cl(hd+.5,4.5,6); /* a shop is its front room and, in a house 4.5 m deep or more (as before), behind the partition, the keeper's (4.7 m, 3.2 in the kit's unit) */
    let ceil=st==='stone'?2.2:st==='french'?2.1:2.0;
    if(type==='church'){Wt=cl(hw*1.3,8,10);Dt=cl(hd*2,14,18);ceil=5.0;}
    if(type==='castle')ceil=5.6;
    const F=.62;
    if(type==='inn'){Wt=cl(hw*1.6,10,12);Dt=cl(hd*2,11.7,13);} /* the hall, and the gallery's rooms and stair over its north end */
    if(type==='cellar'){Wt=cl(hw*1.3,6,8);Dt=cl(hd*1.3,5,7);ceil=1.8;}
    let W=Wt/KR,D=Dt/KR;
    if(type==='castle'){W=Math.max(18,Math.round(hw*1.5));D=Math.max(22,Math.round(hd*2.2));}   /* the keep's hall and the guild halls keep their old rooms (true 26 by 32 and 32 by 29 m) */
    if(type==="guild_f"||type==="guild_m"){W=Math.max(22,Math.round(hw*1.8));D=Math.max(20,Math.round(hd*2.0));}
    if(type==='cabin'){W=7/KR;D=8/KR;ceil=2.0;}   /* a ship's cabin 7 by 8 m, the Guest's chapel 9 by 12 */
    if(type==='chapel'){W=9/KR;D=12/KR;ceil=3.4;}
    if(type==='tower'){W=9;D=9;ceil=31;}   /* the tower keeps its old size: its stair climbs 30 to the top its outside shows, and is not scaled (scaleRoom by 1) */
    const gallery=two&&(type==='inn'||type==='guild_f'||type==='guild_m'); /* S896 — a cottage or a shop of true size has no room for a gallery and its stair; the upper floor is the inn's and the guilds' */
    const H=gallery?ceil*1.85:ceil;
    house.intW=W;house.intD=D;
    const sc_=new THREE.Scene();interiorScene=sc_;landRoomPost(sc_); /* S1257 — the rooms' post on the new look: the neutral curve (89-world-land.js) */
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
    INT_SOL=SOL;FOOTHOLDS=[];INT_BEDS=[];INT_DOORS=[];INT_DOORS.house=house.id;INT_CHAIR=null;intBedPos=null;INT_NPCS=[];HATCH.active=false;HATCH.roof=false;INT_LOOT=null;INT_BOX=null;INT_SHELF=null;
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
    const winY=H<1.95?H-.75:Math.min(H-.6,1.35); /* S896 — a cellar's 1.8 ceiling (2.6 m true) held the frame's head .04 above it */const WK=furnKit(),WP=WK.Parts(),wKind=WK.winKind(type,false);let wi=0;
    for(let z=D*.3;z<Math.min(D*.9,D-1.05);z+=Math.max(3,D*.3)){[.03,W-.03].forEach(x=>{const west=x<1; /* S896 — not so near the end wall that the frame's shutters pass through it (a cabin of true size, 8 m) */const p=new THREE.Mesh(new THREE.PlaneGeometry(.9,.95),windowMat(type,house));p.position.set(west?.006:W-.006,winY,z);p.rotation.y=west?Math.PI/2:-Math.PI/2;sc_.add(p);
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
      const guild=type==='guild_f'||type==='guild_m';const gy=ceil-.1,gd=Math.min(Math.max(D*.4,4.15),6),run=gy/.62,zs=gd+.6; /* S896 — deep enough for the rooms behind the corridor (4.15), the stair's foot inside an inn's hall of true size */
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
      const nRooms=Math.max(1,Math.floor(W/3.4)); /* S896 — 3.4 (4.9 m true; it was 4.5 in rooms 1.8 times too wide) */const corr=1.9,roomBack=gd-corr;
      if(roomBack>2.2){
        for(let k=0;k<nRooms;k++){const xa=k*W/nRooms,xb=(k+1)*W/nRooms;partition(xa,roomBack,xb,roomBack,gy,ceil-.3,.5);if(k>0)partition(xa,0,xa,roomBack,gy,ceil-.3,null);}
      }

      // furniture up top: beds, a chest
      const up=o=>{o.position.y+=gy;};
      const lift=n=>sc_.children.slice(-n).forEach(up);
      {const nR=Math.max(1,Math.floor(W/3.4));const many=type==='inn'||type==='guild_f'||type==='guild_m';for(let k=0;k<(many?nR:1);k++){const bx=(k+.5)*W/nR+(k%2?.6:-.6);const k0=sc_.children.length;_intBed(sc_,bx,1.1,'N');sc_.children.slice(k0).forEach(up);bedAt(bx,1.1,gy,type==='inn'?k:null);if(many&&W/nR>4.2){const k1=sc_.children.length;_intBed(sc_,bx+(k%2?-1.6:1.6),1.1,'N');sc_.children.slice(k1).forEach(up);bedAt(bx+(k%2?-1.6:1.6),1.1,gy,type==='inn'?k:null);}}}
      {const K=furnKit(),c=K.bake(K.chest(FN,FSEED+3));c.position.set(W/2,gy,.6);c.userData.furn=true;sc_.add(c);furnSwap(c);} // S293 — the gallery's chest on the kit
      const gl=new THREE.PointLight(0xffaa44,.9,gd*1.5);gl.position.set(W/2,gy+1.2,gd/2);sc_.add(gl);
    }
    // ── trade furnishing ────────────────────────────────────────────────
    // S1258 — a shop with the keeper's room has it at the back, behind the counter: the shop is laid out as a room BZ shorter and
    // moved BZ south (below, after the trade's branch), so the street door opens on the shop and not on the keeper's bed and
    // strongbox (the critic's s782: you came in 2.2 m from the box, the keeper 7.8 m off beyond a shut door)
    const SHOPS=['weapon','armor','potion','misc','shipwright','goods','forge','apothecary','armoury'],BZ=SHOPS.includes(type)&&!gallery&&D>=7?3.2:0,DS=D-BZ,n0=sc_.children.length,s0=SOL.length,f0=FOOTHOLDS.length;
    let npc={x:W/2,z:2.2,minZ:.6,maxZ:Math.min(D*.55,4.5),paused:false}; /* S387 — behind the counter (z 2.6–3.4), not on its edge */
    // S289 — every shop's counter is the kit's panelled counter, bare (the bar without its tankards), its own small bake
    const counter=()=>{const K=furnKit(),c=K.bake(K.counter(W*.5,FN,FSEED+5,true));c.position.set(W/2,0,3.0);c.userData.furn=true;sc_.add(c);furnSwap(c);solid(W/2,3.0,W*.25+.1,.4,1.05);house._counterFront=3.4*KR;}; /* S896 — its front edge in true metres, for the arrival spot (intArrivalZ) */
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
      {const K=furnKit(),room=K.bake(K.smithy(W,DS,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(1.2,1.4,.9,.8,1.2);light(1.2,1.0,2.0,0xff6a20,1.6,6);solid(W-2.0,1.6,.3,.3,1.0);solid(W-.75,3.9,.3,.3,.7);
      counter();
    } else if(type==='armor'){
      // S290 — the armourer on the kit (#46 A): three stands (plate, leather, mail) with helms, the kit's shields on the
      // east wall in front of the back room, a bench with leather, rivets and a mallet; one bake
      {const K=furnKit(),room=K.bake(K.armoury(W,DS,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      {const A=furnKit().armouryAt(W,DS);A.stands.forEach(x=>solid(x,1.6,.25,.25,1.8));solid(A.bench,1.6,.7,.3,.76);} /* S896 — the kit's places */
      counter();
    } else if(type==='potion'){
      // S290 — the apothecary on the kit: three shelves of bright potions, herbs hung drying, the still (an iron cauldron
      // glowing green over a small fire, a copper alembic), a mortar and pestle on the counter; one bake
      {const K=furnKit(),room=K.bake(K.apothecary(W,DS,H,FN,FSEED,BZ>0));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      light(W-1.6,1.3,1.8,0x60ff80,1.0,5);solid(W-1.6,1.8,.4,.4,1.0);
      counter();
    } else if(type==='misc'||type==='shipwright'){
      // S290 — the general goods on the kit: crates, sacks tied at the neck, shelves of pots, bowls and plates, a balance on
      // the counter; the barrels are the interiors' kit barrel. The sacks stood in the back room; now in front of it
      {const K=furnKit(),room=K.bake(K.goods(W,DS,H,FN,FSEED,BZ>0));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      if(BZ){_intBarrel(sc_,.6,DS-.7);_intBarrel(sc_,.6,DS-1.45);_intBarrel(sc_,1.3,DS-.75);} /* S1258 — by the street door, west: the east end of the back wall is the keeper's room's door */
      else{_intBarrel(sc_,W-1.0,1.2);_intBarrel(sc_,W-1.9,1.1);_intBarrel(sc_,W-1.4,2.0);}
      counter();
    } else if(type==='inn'){
      // S287 — the taproom on the kit (#46 A): a panelled bar with a brass rail and stools, the dresser of bottles and plates
      // behind it, two casks on cradles, the big stone hearth, four tables with benches, by the nation's wood, one mesh and
      // the flames. The beds are still _intBed's (the rooms' beds are shared with shops and halls); the solids are the old ones.
      {const K=furnKit(),seed=String(house.id||'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,11)%100000;
        const room=K.bake(K.inn(W,D,H,nationAt(house.doorX,house.doorZ),seed,true,galleryEast(house)));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      const IA=furnKit().innAt(W,D,galleryEast(house)); /* S896 (F2a) — the taproom's places, shared with the kit's layout */
      solid(W/2,IA.cz,IA.L/2+.1,.45,1.15);
      {const hz=IA.hearth.z,hw=IA.hearth.w/2+.05,hx=IA.hearth.x;light(hx?hx-1.2:1.2,.8,hz,0xff6a20,1.5,7);solid(hx?hx-.35:.35,hz,.35,hw,1.3);}
      IA.tables.forEach(([x,z])=>{solid(x,z,.9,.5,.76);[-1,1].forEach(sd=>solid(x,z+sd*.9,.8,.2,.44));});
      if(!gallery){_intBed(sc_,1.2,D-2.0,'N');_intBed(sc_,W-1.2,D-2.0,'N');bedAt(1.2,D-2.0,0);bedAt(W-1.2,D-2.0,0);intBedPos={x:1.2,z:D-2.0};}else intBedPos={x:W-1.2,z:1.2};
      npc={x:W/2,z:1.4,maxZ:1.8,paused:false};
    } else if(type==='church'){
      // S291 — the church on the kit (#46 A): a flagged stone dais, a moulded altar with its cloth, runner, candlesticks and
      // book, pews with shaped ends and kneelers, an eight-sided pulpit with steps, columns with bases and capitals; one bake
      {const K=furnKit(),room=K.bake(K.church(W,D,H,FN,FSEED));room.userData.furn=true;sc_.add(room);furnSwap(room);}
      solid(W/2,1.6,1.2,.55,1.3);light(W/2,2.2,1.8,0xffc070,1.4,8);
      {const zs=[];for(let z=2.5;z<D-1.8;z+=Math.max(2.2,D/4))zs.push(z);tallWins(zs,3.4,.9,2.6,0xc89050);} /* S896 — three a side in a nave of true size (14 to 18 m), as in the old, longer one; from 3 by 3 it held two */
      for(const x of furnKit().churchAt(W,D).colX)for(let z=5.5;z<D-3;z+=3.5)solid(x,z,.4,.4,H/F); /* S896 — between the pews and the walls in a nave of true size */ // S303 — the columns outside the pews (at W/2 ± 3 they stood in them)
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
        for(let x=W/2-4;x<=W/2+4;x+=8)for(let z=6;z<D-3;z+=5)solid(x,z,.4,.4,H/F);
        /* S1121 — the first of the two bookcases on the east wall (furnKit's guildM puts it there): a book can be taken from it (shelfPrompt, 86) */
        {const off=Math.min(0,D*.52-.25-(D*.35+3.85));INT_SHELF={x:W-.2,z:D*.35+off-1.95,y:0,id:house.id,house};}}
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
      const BA=furnKit().barberAt(W,D),cx=BA.cx;solid(cx,1.35,.24,.26,1.2);INT_CHAIR={x:cx,z:1.35,house}; /* S561 — sit in it: openBarberChair */solid(BA.wash[0],BA.wash[1],.17,.17,.75);solid(BA.bench1[0],BA.bench1[1],.22,.47,.76);
      solid(BA.dyer,1.0,.33,.33,.75);solid(BA.dyer+1.95,.8,.57,.25,.76);solid(BA.bench2[0],BA.bench2[1],.14,.82,.44); /* S896 — the kit's places (barberAt) */
      light(cx,1.9,1.6,0xffc880,1.1,6);light(BA.dyer+.8,1.6,1.4,0xffb070,.7,5);
      npc={x:cx+.75,z:1.3,maxZ:1.6,paused:true};
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
      for(let k=0;k<Math.min(3,Math.floor((D-1.6)/.9));k++){_intBarrel(sc_,.7,.8+k*.9);}for(let k=0;k<2;k++){_intCrate(sc_,W-.8-k*.85,.25,.9,.5);}_intCrate(sc_,W-1.22,.5+.225,.9,.45); /* S896 — down the west wall and in the north-east corner of a cellar of true size */
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
      const HA=furnKit().homeAt(W,D); /* S896 (F2a) — the cottage's places, shared with the kit's layout */
      bedAt(HA.bed[0],HA.bed[1]+.2,0);INT_BEDS[INT_BEDS.length-1].cz=HA.bed[1];/* S752 — the kit's bed (K.home); the sleeper lies in it */if(!gallery)intBedPos={x:HA.bed[0],z:HA.bed[1]+.2};else intBedPos={x:W-1.2,z:1.2};
      // S286 — the home's furniture on the kit (#46 A): a box bed, the stone hearth, a table and two chairs with a candle, the
      // chest, two dressed shelves and a rag rug, by the nation's wood, baked to one mesh (and the flames); the old boxes' places
      {const K=furnKit(),seed=String(house.id||'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7)%100000;
        const cold=coldHearthHouse(house),room=K.bake(K.home(W,D,H,nationAt(house.doorX,house.doorZ),seed,cold));room.userData.furn=true;sc_.add(room);furnSwap(room);
        const hl=light(W-1.2,.7,HA.hearth.z,0xff6a20,cold?0:1.2,6);if(cold){room.userData.coldHouse=house;room.userData.hearthLight=hl;}}
      solid(W-.35,HA.hearth.z,.35,HA.hearth.w/2+.05,1.3);
      solid(HA.table[0],HA.table[1],HA.table[2]/2,HA.table[3]/2,.76);solid(HA.bed[0],HA.bed[1],.45,.78,.5);
      const role=(house.dlg&&house.dlg.role)||'';
      if(/weaver/i.test(house.roleTag||'')){box(.25,.9,D-1.0,.4,1.7,1.0,0x5a3a1c);solid(.25,D-1.0,.2,.5,1.7);}
      if(/fisher/i.test(house.roleTag||'')){const net=new THREE.Mesh(new THREE.ConeGeometry(.7,1.4,6,1,true),new THREE.MeshLambertMaterial({color:0x8a8060,side:THREE.DoubleSide,wireframe:true}));net.position.set(W*.6,H-.9,D*.45);sc_.add(net);}
      if(/farmer/i.test(house.roleTag||''))for(let k=0;k<2;k++)cyl(.4+k*.5,.35,D-.4,.24,.28,.7,0xb8a070,7);
      if(/cooper/i.test(house.roleTag||'')){_intBarrel(sc_,.5,D-.5);_intBarrel(sc_,.5,D-1.15);}
      npc={x:W*.3,z:D*.62,maxZ:Math.min(D*.75,5),paused:false};
    }
    if(BZ){for(const o of sc_.children.slice(n0))o.position.z+=BZ;for(const q of SOL.slice(s0)){q.z0+=BZ;q.z1+=BZ;}for(const q of FOOTHOLDS.slice(f0)){q.z0+=BZ;q.z1+=BZ;} /* S1258 — the shop south of the keeper's room */
      npc.z+=BZ;npc.minZ+=BZ;npc.maxZ+=BZ;if(house._counterFront!=null)house._counterFront+=BZ*KR;}
    house._shopZ=BZ; /* S1258 — where the shop's own layout starts, in the kit's unit (the suites read the forge, the counter and the rest by it) */
    // v80 S131 — interior variety: the shopkeeper's room behind a partition; private rooms at the inn; the coaching inn's board and tack
    try{
      const partition=(z0,x0,x1,doorX,y0,y1)=>{const hh=y1-y0;for(const [a,b] of [[x0,doorX-.6],[doorX+.6,x1]]){if(b-a<.2)continue;boxRaw((a+b)/2,y0+hh/2,z0,b-a,hh,.18,0x5a4630);SOL.push({x0:a,x1:b,z0:z0-.09,z1:z0+.09,y0,y1});}
        boxRaw(doorX,y1-.12,z0,1.3,.24,.22,0x3a2a18);
        intDoorAt(sc_,SOL,doorX,z0,y0,Math.PI/2,0x3a2a18);}; // v80 S143 — the back room gets a door
      const sideWall=(x0,z0,z1,y0,y1)=>{boxRaw(x0,(y0+y1)/2,(z0+z1)/2,.18,y1-y0,z1-z0,0x5a4630);SOL.push({x0:x0-.09,x1:x0+.09,z0,z1,y0,y1});};
      if(BZ){ /* S896 — 7 in the rooms' old unit (a shop of true size is 7.5 to 8.5 deep with the keeper's room); it was 9 */
        // S1258 — the keeper's room is the north end, z 0 to BZ, behind the counter; its door at the end of the back wall the trade
        // leaves clear (the forge and the apothecary's and goods' shelves stand against it), the bed and the strongbox at the other
        const east=type==='weapon'||type==='misc'||type==='shipwright'||type==='goods'||type==='forge',mx=x=>east?W-x:x,doorX=mx(.8);partition(BZ,0,W,doorX,0,ceil);
        _intBed(sc_,mx(W-.55),1.0,'N');bedAt(mx(W-.55),1.0,0);solid(mx(W-.55),1.0,.5,1.0,.5); /* S896 — the keeper's room of true size: the bed down the side wall, the table at its foot, the way from the door clear */
        _intCrate(sc_,mx(1.0),.25,.9,.5);_intCrate(sc_,mx(1.55),.25,.9,.42);box(mx(W-1.6),.68,1.6,.8,.06,.6,0x7a4818);box(mx(W-1.6),.34,1.6,.08,.62,.08,0x5a3010);solid(mx(W-1.6),1.6,.4,.3,.7);
        if(!hasCellar(house))box(mx(W*.62),.02,1.6,1.6,.03,1.4,[0x6a2a2a,0x2a3a5a,0x5a4a2a][(W|0)%3]);light(mx(W*.6),1.4,1.6,0xffb070,.7,5);
        house._backRoom=true;house._backEast=east;
      }else house._backRoom=false;
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
          if(house.coachInn)coachInnFolk(house,sc_,W,D,type==='tower'?1:KR); // S238 — the driver and the travellers waiting in the common room
          house._coaching=true;}
      }
    }catch(e){console.warn('interior variety',e);}
    if(hasCellar(house)){const hx=type==='inn'?(galleryEast(house)?.9:W-.9):type==='home'?W*.5:BZ?(house._backEast?W-2.15:2.15):Math.min(W-1.6,3.2),hz=type==='inn'?D-.8:type==='home'?D*.72:BZ?1.8:D-2.6; /* S896 — by the door, off the stair and the tables, in the rooms of true size; S1258 — a shop's in the keeper's room, between the crates, the table and the door's swing, where the rug was */boxRaw(hx,.06,hz,1.1,.08,1.1,0x3a2612);const ring=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,5,10),new THREE.MeshLambertMaterial({color:0x2a2622}));ring.position.set(hx+.3,.12,hz);ring.rotation.x=Math.PI/2;sc_.add(ring);house._hatch={x:hx,z:hz};HATCH.x=hx;HATCH.z=hz;HATCH.y=0;HATCH.active=true;}
    // v80 S155 — a shop's strongbox in the back room (or behind the counter), a home's small chest: locked, and worth something
    if(BOX_KINDS.includes(type)||type==='home'){const home=type==='home';let bx=home?W-.45:(house._backRoom?(house._backEast?.45:W-.45):W-.6),bz=home?D-.6:(house._backRoom?BZ-.85:D*.55),bry=home||house._backRoom&&!house._backEast?-Math.PI*.5:house._backRoom?Math.PI*.5:Math.PI; /* S896 — a home's in the south-east corner, the room's width from the bed (a sleeper hears 2 m); S1258 — a shop's in the keeper's room against the side wall away from its door (out of the doorway's line from the shop), past the bed's foot and a step in from the partition */
      // S590 — the barber stands still at his chair facing into the room (+z), so his box goes where the 6-unit indoor witness and his
      // 120° cone cover every spot it opens from (1.6 round it): the wall-most free spot in front of him whose worst spot on that ring is
      // within 5.6 of him and 50° of his face (the critic, 6 Oct: at W−1, D×.55 it stood 6.8–8.5 from him and was picked unseen at noon).
      // Against the west wall when the room allows, nearer his chair in a wide one. No such spot: the old one.
      if(type==='barber'&&npc){const fr=(x,z)=>!SOL.some(q=>x+.32>q.x0-.1&&x-.32<q.x1+.1&&z+.32>q.z0-.1&&z-.32<q.z1+.1);
        /* S896 (F2a) — the room is laid out in the kit's unit (÷ KR) and built KR larger: the witness's 6 m and the ring's 1.6 are true metres */
        const wm=.28/KR,ok=(x,z)=>{for(let k=0;k<24;k++){const ux=Math.max(wm,Math.min(W-wm,x+Math.sin(k*Math.PI/12)*1.6/KR)),uz=Math.max(wm,Math.min(D-wm,z+Math.cos(k*Math.PI/12)*1.6/KR)); /* S905 — a point of the ring past a wall is tested where you would stand against it (it was skipped, and the spots nearer the box that way with it: a box 6.3 m from him passed in a room 7.8 deep), the wall's margin in true metres */
          const dx=ux-npc.x,dz=uz-npc.z,d=Math.hypot(dx,dz);if(d>5.6/KR||dz/d<Math.cos(50*Math.PI/180))return false;}return true;};
        found:for(let x=.62;x<=npc.x+.01;x+=.1)for(let z=npc.z+1.4/KR;z<D-1.6/KR;z+=.05)if(fr(x,z)&&ok(x,z)){bx=x;bz=z;bry=Math.PI*.5;break found;}}
      const bg=new THREE.Group();const shell=buildChestShell(bg,home?.45:.6,home?0x6a4a2c:0x4a3018);bg.position.set(bx,0,bz);bg.rotation.y=bry;sc_.add(bg);if(Math.abs(bry)===Math.PI*.5)solid(bx,bz,.28,.32,.5);else solid(bx,bz,.32,.28,.5);
      INT_BOX={x:bx,z:bz,lid:shell.lid,g:bg,id:house.id,kind:home?'home':'shop',type,house,open:false};}
    // S342 (#62 A) — the frame, built last so a post gives way to whatever stands against the wall. Plastered rooms: posts at the
    // corners and under each beam's ends (a short bracket where a window is within 1.2), knee braces, a sole plate and a wall
    // plate; Aurenne's close studding a post every 1.6. Stone and rubble rooms: a plinth course and three stepped corbels under
    // each beam's end. Everywhere: rounded beams .22 deep, joists every .5, and the entrance a plank door in a timber or stone frame.
    if(kitShell){const beams=[];for(let i=1;i<=(tower?0:nb);i++)beams.push(D*i/(nb+1));const wins=[];for(let z=D*.3;z<Math.min(D*.9,D-1.05);z+=Math.max(3,D*.3))wins.push(z);
      shellFrame(sc_,{W,D,H,type,st,wallKind,FN,FSEED,beams,wins,TALLZ,SOL,FOOTHOLDS});}
    // S896 (F2a) — the room was laid out in the old unit; it stands at true size from here on (scaleRoom)
    const KS=type==='tower'?1:KR;scaleRoom(sc_,house,KS);npc.x*=KS;npc.z*=KS;npc.maxZ*=KS;W*=KS;D*=KS;house._roomH=H*KS; /* S1009 — the room's true height, floor to ceiling: the head stops there (headCeil) */
    // keeper / resident — only if the schedule says they're indoors right now
    // (the same person you see in the street is the one behind the counter).
    if(npcInsideNow(house)){
    const roleName=type==='church'?'Priest':type==='home'?'Resident':type==='inn'?'Innkeeper':type==='castle'?'Steward':type==='guild_f'?'guard':type==='guild_m'?'scholar':'Merchant';
    const g=buildNPCMesh({role:roleName,name:house.keeper,_twin:house._twin,bCol:house.bCol||0x5a4030,sCol:house.sCol||0xd4a878},{nation:nationAt(house.doorX,house.doorZ),key:house.siteId||''});
    g.rotation.y=type==='church'?0:Math.PI;g.position.set(npc.x,0,npc.z);sc_.add(g);intNPCMesh=g;intNPCPos={x:npc.x,z:npc.z};
    intNPCMesh.userData.amble={wa:Math.random()*Math.PI*2,wt:1+Math.random()*3,minZ:(npc.minZ!=null?npc.minZ:.6)*KS,maxZ:npc.maxZ,minX:.8*KS,maxX:W-.8*KS,speed:.25,paused:npc.paused};
    if(homeAsleepNow(house))laySleeper(intNPCMesh); /* S739 — asleep in bed, 23h to 5h (#240 A) */
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
    switch(t.kind){case 'clear':case 'hunt':case 'gather':return t.have>=t.need;case 'raid':return t.spawned&&t.have>=t.count;case 'beast':case 'wizard':case 'creature':return !!t.done;case 'cloak':return typeof cloakMasterDead==='function'&&cloakMasterDead();case 'relic':return !!t.got;case 'deliver':return !!t.done;case 'hearth':return !!t.done;}return false;
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
        const fid=t.id+':foe:0'; /* S504 — a job's foe is the job and its index (co-op rules) */ const e=keyFoe(unlockFoe(buildZoneEnemy(sc,STATIC_SOL,t.sx,t.sz,name,typeof pickVariant==='function'?pickVariant(name,tierLevel(worldTierAt(t.sx,t.sz)),tierDiffKey(worldTierAt(t.sx,t.sz),1)/* S1060 — a grade above the place's (the enemies-by-place sheet); it was 'hard' everywhere */,seededRng('variant',fid)):null)),fid);e._guildTag=t.id;e.hp=Math.round(e.hp*1.6);e.maxHp=e.hp;ZONES.world.enemies.push(e);t.spawned=true;showMsg(`${name} sighted.`,'#ffb060');
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
  const OWE_LINES={gatelander:(s,p)=>`You'll not plough two fields with the one ox. Yours is still on the board: ${s}. ${p}.`,markman:(s,p)=>`You still owe us: ${s}. ${p}.`,aurennais:(s,p)=>`Forgive me, Master; one contract is closed before the next is entered. Yours is still open: ${s}. ${p}.`,oldblood:(s,p)=>`Yours is not done: ${s}. ${p}.`};
  function offer(g,site,gp){gLapse();const st=gstate()[g];if(st.active)return (OWE_LINES[gp]||OWE_LINES.markman)(st.active.short,progressLine(st.active));const cm=commissionFor(g,site);const t=cm||gDated(genTask(g,site),g,site);st.active=t;if(typeof addLog==='function')addLog('📜',`${GUILD_DEF[g].name}: ${t.short}.`);qJournal(t,'accept',t.desc);showMsg(`New task: ${t.short}`,'#e8d8a0');return (t.title?`${t.title}. `:'')+t.desc+(t.due?` Pay is ${t.gold} gold; ${Math.round(t.gold*1.25)} if it is done by ${calDateLine(t.due-1)}. After that, the guild gives it to someone else.`:` Pay is ${t.gold} gold.`);}
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
    return Object.assign({name:keeper,_twin:tw||undefined,_siteId:site.id,people:gp,sCol:pick(gr,PEOPLES[gp].skin),hairCol:pick(gr,PEOPLES[gp].hair),bodyScale:[PEOPLES[gp].width/PEOPLES[gp].height,1,PEOPLES[gp].width/PEOPLES[gp].height],role:gd.role,ico:g==='guild_f'?'⚔':'✨',greeting:(GUILD_GREET[g][gp]||GUILD_GREET[g].markman),
      get topics(){const base=[{label:'Any work?',quest:true,fn:()=>offer(g,site,gp)},{label:"It's done.",quest:true,avail:()=>{gLapse();const t=gstate()[g].active;return !!t&&taskDone(t);},fn:()=>turnIn(g)},{label:'I can\u2019t do it.',quest:true,avail:()=>{gLapse();const t=gstate()[g].active;return !!t&&!taskDone(t);},fn:()=>handBack(g,gp)},{label:'My standing?',quest:true,fn:()=>`${rankOf(g)} of the ${gd.name}. ${gstate()[g].done} task${gstate()[g].done===1?'':'s'} done.`}];{const w=directionTopics(site,this);if(w.length)base.push({label:'Where can I find \u2026',folder:true,response:'Outside these walls? Ask, then.',follow:w});} /* v80 S138 */if(g==='guild_f'&&typeof cloakGuildTopics==='function')base.push(...cloakGuildTopics(site,gp)); /* S789 — the cloak's claimant */if(g==='guild_m')base.push({label:'Browse your wares.',trade:true}); /* S566 — robes at the Mages' Guild (#163) */if(g==='guild_m'&&typeof spellShopTopics==='function')base.push(...spellShopTopics(Math.min(4,Math.floor(gstate()[g].done/3))),...rubbingTopics(site));if(typeof sigilLoreTopic==='function')base.push(...sigilLoreTopic(g,gp)); /* S1092 — What the Stones Say */return base.filter(t=>!t.avail||t.avail()).concat(this._tail);},_tail:[{label:'What is this place?',response:g==='guild_f'?"The Fighters' Guild. We take contracts the watch won't: beasts, raiders, old doors that need emptying. Beds upstairs for members.":"The Mages' Guild. Ingredients, relics, errands that need a spell at the end of them. There are beds if you've nowhere else."},{label:'Farewell.',bye:true}]},extra||{});
  }
