  // ── pirates board you; hulls push apart ──
  const BOARDERS=[];
  function tickBoarding(dt){
    if(!SHIP.mesh)return;
    for(const o of OTHER){
      if(o.kind!=='pirate'||o.boarded||o.dead)continue;
      const d=Math.hypot(o.x-SHIP.x,o.z-SHIP.z);
      const mine=onDeck()||SHIP.sailing;
      if(mine&&d<40){o.closeT=(o.closeT||0)+dt;}else o.closeT=0;
      if(mine&&d<16&&o.closeT>12&&!o.sentBoarders){o.sentBoarders=true;let n=0;
        for(const e of o.crew){if(e.dead||n>=2)continue;n++;const fwd=[-Math.sin(SHIP.yaw),-Math.cos(SHIP.yaw)];e.x=SHIP.x+fwd[0]*(-2+n*2);e.z=SHIP.z+fwd[1]*(-2+n*2);e.alert=true;e._ship={plat:SHIP.plat};e._from=o;BOARDERS.push(e);const k=o.crew.indexOf(e);if(k>=0)o.crew.splice(k,1);}
        if(n){showMsg('Pirates on your deck!','#ff6060');splash(true);}}
    }
    pirateBoardersHold();
    // keep boarders aboard
    const p=SHIP.plat;for(let i=BOARDERS.length-1;i>=0;i--){const e=BOARDERS[i];if(e.dead){BOARDERS.splice(i,1);continue;}if(!e._lx){e._lx=SHIP.x;e._lz=SHIP.z;}e.x+=SHIP.x-e._lx;e.z+=SHIP.z-e._lz;e._lx=SHIP.x;e._lz=SHIP.z;e.x=Math.max(p.x0+.6,Math.min(p.x1-.6,e.x));e.z=Math.max(p.z0+.6,Math.min(p.z1-.6,e.z));e.homeX=SHIP.x;e.homeZ=SHIP.z;}
  }
  // S399 — leave your own deck while boarders stand on it and they take half the hold, then go back over the rail to their ship
  function pirateBoardersHold(){if(PHP<=0||!worldState.ship||!SHIP.plat||deckOff(SHIP.plat)<1.5)return;const live=BOARDERS.filter(e=>!e.dead);if(!live.length)return;
    const took=pirateTake();if(!took.length)return;const o=live[0]._from,home=!!(o&&OTHER.includes(o));
    for(const e of live){BOARDERS.splice(BOARDERS.indexOf(e),1);
      if(home){e.x=o.x+(Math.random()-.5)*2;e.z=o.z+(Math.random()-.5)*2;e.homeX=o.x;e.homeZ=o.z;e._ship=o;o.crew.push(e);}
      else{if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const j=ZONES.world.enemies.indexOf(e);if(j>=0)ZONES.world.enemies.splice(j,1);}}
    const what=home?pirateStow(o,took):took.map(k=>`a ${CARGO_GOODS[k].n.toLowerCase()}`).join(', ');
    showMsg(`They hold your deck, take ${what} from the hold and go back over the rail.`,'#ff8060');}
  function tickHullCollisions(dt){
    const hulls=[];if(SHIP.mesh)hulls.push({o:SHIP,L:SHIP.L,W:SHIP.W,mine:true});for(const o of OTHER)hulls.push({o,L:o.L||13,W:o.W||4.4});
    for(let i=0;i<hulls.length;i++)for(let j=i+1;j<hulls.length;j++){const a=hulls[i],b=hulls[j];const dx=b.o.x-a.o.x,dz=b.o.z-a.o.z;const d=Math.hypot(dx,dz)||.01;const minD=(a.L+b.L)/2*.62;
      // S411 — a ram: on first touch your hull takes the closing speed × 3, half if your bow is on her; they part before it counts again
      if(a.mine){if(d<minD&&!b.o._touch){b.o._touch=true;const ux=dx/d,uz=dz/d,fa=[-Math.sin(a.o.yaw),-Math.cos(a.o.yaw)],fb=[-Math.sin(b.o.yaw||0),-Math.cos(b.o.yaw||0)];
          const close=(fa[0]*(a.o.speed||0)-fb[0]*(b.o.speed||0))*ux+(fa[1]*(a.o.speed||0)-fb[1]*(b.o.speed||0))*uz;const bow=(a.o.speed||0)>.5&&fa[0]*ux+fa[1]*uz>.7;
          const rammed=!!b.o.ramming;if(rammed){b.o.ramming=0;b.o.ramWait=PIRATE_RAM.wait;}
          if(close>.5){const w=shipWear(close*3*(bow?.5:1),0);if(w&&w.hull){showMsg(`${bow?'You ram her':rammed?'The black sail rams you':'The hulls strike'}. Hull −${w.hull}.`,'#ff8060');a._bump=performance.now();}}}
        else if(d>minD+1)b.o._touch=false;}
      if(d<minD){const push=(minD-d)*.5;const ux=dx/d,uz=dz/d;a.o.x-=ux*push;a.o.z-=uz*push;b.o.x+=ux*push;b.o.z+=uz*push;a.o.speed*=.6;b.o.speed*=.6;if(!a._bump||performance.now()-a._bump>1500){a._bump=performance.now();if(typeof sfxNoise==='function')sfxNoise(.5,0,0,.16,240);if(a.mine||b.mine)showMsg('Hulls grind together.','#c8b880');}}}
  }

  // ═══ DIALOG II (Session J) ═══════════════════════════════════════════
  // Every generated NPC gets a temperament that colours their lines, a
  // small biography (origin, family, years here, a worry), and topics that
  // draw on the live world: the town's lord, the weather, what's actually
  // nearby, pirates seen from the quay, the guild's business. Topics are
  // built on open (getter), so they change with the hour and with what
  // you've done. NPCs remember you.
  const TEMPERS={
    warm:  {greet:["Well now — you look half frozen. Come closer.","Good to see a new face. Truly.","Sit, sit. You've walked a way."],yes:"Of course.",no:"I'd rather not, if it's all the same.",bye:["Safe roads, friend.","Come back and tell me how it went."]},
    gruff: {greet:["What.","Say it, then.","I've work to do. Be quick."],yes:"Fine.",no:"No.",bye:["Go on, then.","Mind the door."]},
    nervous:{greet:["Oh — you startled me.","Is something wrong? You look like something's wrong.","Keep your voice down, would you?"],yes:"I suppose.",no:"I don't think that's wise.",bye:["Careful out there. Please.","Don't tell anyone I said anything."]},
    pious: {greet:["Blessings on the road that brought you.","The Light keeps this door.","You carry weight, traveller. Set it down a moment."],yes:"As it should be.",no:"That isn't for me to give.",bye:["Walk in light.","May the ground hold under you."]},
    sly:   {greet:["Now here's someone with coin in their step.","Ask me anything. Some answers cost.","You've the look of trouble. I like trouble."],yes:"Naturally.",no:"Ah. No.",bye:["Don't get caught.","We never spoke."]},
    weary: {greet:["Another one.","Mm. What is it.","I was young once, you know. Ask your question."],yes:"If you must.",no:"No. Not today.",bye:["Go well. Or go. Either.","Shut the door behind you."]},
  };
  const TEMPER_IDS=Object.keys(TEMPERS);
  const WORRIES=["the wolves came right up to the fence last winter","the tithe went up again and nobody says why","my brother took the king's coin and never wrote","the well's gone brackish and the elder does nothing","there's a light in the old ruin some nights","the road hasn't seen a merchant cart in a month","the priest talks less than he used to","the fish have moved off the shallows"];
  const WISHES=["to see the capital before I die","a roof that doesn't leak","one good harvest, just one","to hear from my daughter","a quiet year","to go to sea again","to be left alone, mostly"];
  const TRADES_BY_ROLE={Villager:['farmer','weaver','cooper','fisher','shepherd','thatcher','midwife','carter','beekeeper','net-mender'],Guard:['soldier'],Smith:['smith'],Armourer:['armourer'],Apothecary:['apothecary'],Merchant:['trader'],Innkeeper:['innkeeper'],Priest:['priest'],Harbourmaster:['harbourmaster'],Shipwright:['shipwright']};
  function temperOf(name){const h=String(name).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,5);return TEMPER_IDS[h%TEMPER_IDS.length];}
  function metCount(name){return (worldState.met&&worldState.met[name])||0;}
  function noteMet(name){(worldState.met||(worldState.met={}))[name]=metCount(name)+1;}
  function bioFor(site,reg,r,role,name){
    const cells=[...CELLS.values()].filter(c=>c.type!=='sea');const other=cells.length?pick(r,pick(r,cells).sites.filter(t=>t.pad>0&&t.id!==site.id)):null;
    const born=r()<.55?site.name:(other?other.name:site.name);const years=3+Math.floor(r()*40);
    const names=NAMES[reg]||NAMES.irish;const spouse=r()<.5?pick(r,r()<.5?names.m:names.f):null;const kids=r()<.5?1+Math.floor(r()*3):0;
    const trade=pick(r,TRADES_BY_ROLE[role]||TRADES_BY_ROLE.Villager);
    return {born,years,spouse,kids,trade,worry:pick(r,WORRIES),wish:pick(r,WISHES)};
  }
  function lordFor(site){
    if(site.lord)return site.lord;const h=String(site.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,9);const rr=cellRng(h%9973,h%7919,1);
    const [ci_,cj_]=cellOf(site.x,site.z);const lp=PEOPLES[nationOf(ci_,cj_).people];const names=NAMES[lp.names]||NAMES.irish;const female=rr()<.4;const nm=pick(rr,female?names.f:names.m);
    const NT=nationOf(ci_,cj_).titles;const tt=NT[site.kind]||'Elder';const title=Array.isArray(tt)?tt[female?1:0]:tt;
    const style=pick(rr,['fair but tired','hard as the walls','well liked, badly advised','new to it and knows it','old, and forgets nothing']);
    site.lord={name:nm,title,style,female};return site.lord;
  }
  function weatherLine(){const t=WX.type;return t==='storm'?"This storm'll take a roof or two.":t==='rain'?"Rain again. The road'll be mud to the knee.":t==='snow'?"Snow's early this year. Or late. I lose track.":t==='fog'?"Can't see the end of the street. Don't wander.":t==='overcast'?"Grey. It's been grey a week.":"Clear as a bell. Make use of it.";}
  function liveRumours(site){
    const out=[];const [ci,cj]=cellOf(site.x,site.z);const c=getCell(ci,cj);
    if(OTHER.some(o=>o.kind==='pirate'&&Math.hypot(o.x-site.x,o.z-site.z)<600))out.push("Black sails off the coast this morning. The fishermen came straight back in.");
    const G=worldState.guild;if(G){for(const g in G){const t=G[g].active;if(t&&t.siteId===site.id)out.push(t.kind==='raid'?"They say bandits are coming for us. The guild sent someone. Maybe you.":t.kind==='beast'?`Something's been at the sheep. ${t.beast||'A beast'}, they say.`:"The guild's got business here. Everyone's on edge.");}}
    if(isNight())out.push("Don't go past the last lamp. Not tonight.");
    {const L=fstate().league;if(L.rowe==='dead'&&L.closed&&nationKeyOf(ci,cj)==='mark')out.push("Somebody put Hesket Rowe down on the yard at Caer Slige after she'd yielded. Nobody says the name. Everybody knows it.");} // S374 — the yard's murder, in the Mark
    {const d=nearestSigilDoorFrom(site);if(d&&Math.random()<.5)out.push(`There's a warm stone in ${d.name}, ${compassWord(d.x-site.x,d.z-site.z)} of here. My cousin put his hand on it and talked in his sleep for a week.`);}
    if(c.polity==='wilds')out.push("No lord out here. We settle things ourselves. Mostly with shovels.");
    if(c.polity==='marches')out.push("The forts are full again. Someone's expecting a war.");
    const lk=c.lakes[0];if(lk&&r01()<.4)out.push(`There's a fish in ${lk.name} as long as a boat. My uncle saw it. He drinks, but still.`);
    const pk=c.peaks[0];if(pk&&r01()<.4)out.push(`Nobody's been to the top of ${pk.name} and come back to say so.`);
    return out;
  }
  function r01(){return Math.random();}
  function localLore(site){
    const [ci,cj]=cellOf(site.x,site.z);const c=getCell(ci,cj);const bits=[];
    c.peaks.forEach(p=>bits.push(`${p.name} stands ${compassWord(p.x-site.x,p.z-site.z)}`));c.lakes.forEach(l=>bits.push(`${l.name} lies ${compassWord(l.x-site.x,l.z-site.z)}`));
    if(c.rivers.length)bits.push('a river runs through the province — follow it down to the sea');
    const ports=c.sites.filter(t=>t.kind==='port');if(ports.length)bits.push(`ships put in at ${ports[0].name}`);
    return bits.length?bits.join('; ')+'.':"Nothing here but what you see.";
  }
  // topic set for a generated NPC; built on open so it reflects the moment
  function richTopics(site,reg,r,role,name,def){
    const T=TEMPERS[def.temper];const bio=def.bio;const lord=lordFor(site);
    const base=[];
    const t=[];
    t.push({label:'What is this place?',response:siteBlurb(site)+` ${lord.title} ${lord.name} has the say here — ${lord.style}.`});
    t.push({label:'Who are you?',response:(bio.born===site.name?`Born here. ${bio.years} years, man and boy.`:`I came from ${bio.born}, ${bio.years} years back.`)+` I'm a ${bio.trade}.`+(bio.spouse?` Married to ${bio.spouse}${bio.kids?`, ${bio.kids} ${bio.kids>1?'children':'child'}`:''}.`:'')+` If I want anything it's ${bio.wish}.`,then:[{label:'Anything troubling you?',response:`Since you ask — ${bio.worry}. ${T.no==='No.'?"Not that it's your business.":"Nobody listens, so."}`}]});
    t.push({label:'Where do the roads go?',response:def._roadLine});
    t.push({label:'Anything dangerous nearby?',response:def._doorLine,then:[{label:'What would you do about it?',response:pick(Math.random,["Leave it be. That's what I'd do.","Hire the Fighters' Guild. That's what they're for.","Go in daylight, with a friend, and don't touch the walls.","Nothing. It's been there longer than us."])}]});
    t.push({label:'Any news?',get response(){const live=liveRumours(site);return live.length&&Math.random()<.7?pick(Math.random,live):pick(Math.random,RUMORS[reg]||RUMORS.irish);}});
    t.push({label:'How\u2019s the weather been?',get response(){return weatherLine();}});
    t.push({label:'Tell me about the land here.',response:localLore(site)});
    t.push({label:`What do you make of ${lord.title} ${lord.name}?`,response:pick(Math.random,[`${lord.style.charAt(0).toUpperCase()+lord.style.slice(1)}. Could be worse.`,"Keeps the roads open. Ask for more and you'll wait.","You'll find them "+(site.kind==='city'?'in the keep':site.kind==='village'?'by the well of a morning':'at the inn, most evenings')+". Take a gift.","We don't talk about that with strangers."])});
    {const mine=def.people||'gatelander';const P=PEOPLES[mine];Object.keys(P.of).forEach(o=>{if(o===mine)return;const O=PEOPLES[o];t.push({label:`What do you make of the ${o==='oldblood'?'Old Blood':o==='markman'?'Markmen':o==='aurennais'?'Aurennais':'Gatelanders'}?`,get response(){return pick(Math.random,P.of[o]);}});});}
    // ── depth: every role gets a full set in each folder ──
    const [ni,nj]=cellOf(site.x,site.z);const NAT=nationOf(ni,nj);const P=PEOPLES[def.people||NAT.people]||PEOPLES.gatelander;
    const shopsHere=(SETTLE.get(site.id)||{houses:[]}).houses.filter(h=>h.type!=='home').map(h=>h.type);const have=k=>shopsHere.includes(k);
    t.push({cat:'you',label:'What do you do here?',response:`I'm a ${bio.trade}. ${bio.trade==='farmer'?'Barley, when it comes up. Mud, when it doesn\'t.':bio.trade==='fisher'?'Nets in the dark, fish in the morning, if the Sea\'s in the mood.':bio.trade==='smith'?'Nails, mostly. Everyone wants swords; everyone needs nails.':bio.trade==='soldier'?'I stand where I\'m put and I don\'t sleep much.':bio.trade==='priest'?'I bury people and tell the rest not to worry. One of those I\'m good at.':bio.trade==='innkeeper'?'Beds, ale, and other people\'s trouble.':'The same as my mother did, and hers.'}`});
    t.push({cat:'you',label:'Family?',response:bio.spouse?`${bio.spouse}. ${bio.kids?`${bio.kids} ${bio.kids>1?'children':'child'}, and they eat like it.`:'No children. We tried.'}`:pick(Math.random,["Not anymore.","Never got round to it. The work doesn't leave much.","A brother somewhere. We don't write."])});
    t.push({cat:'you',label:'How long have you lived here?',response:bio.born===site.name?`All my life. ${bio.years} years, if you're counting. I stopped.`:`${bio.years} years, since ${bio.born}. It's home now. Mostly.`});
    t.push({cat:'you',label:'What do you want out of life?',response:`${bio.wish.charAt(0).toUpperCase()+bio.wish.slice(1)}. ${pick(Math.random,["Ask me again when I'm old.","Is that so much?","Don't laugh.","You asked."])}`});
    t.push({cat:'you',label:'Your people?',response:`${P.self}. ${P.name==='Old Blood'?"We were here before the rest. We don't say it loudly.":P.name==='Markman'?"Iron and blood. It's on the banners and it's in the bread.":P.name==='Aurennais'?"On account, and on paper. It's kept us fed a long time.":"We keep the roads and the promises. Somebody has to."}`});
    t.push({cat:'place',label:'Who runs things here?',response:`${lord.title} ${lord.name}. ${lord.style.charAt(0).toUpperCase()+lord.style.slice(1)}. Above ${lord.title==='Elder'?'them':'that'}, ${NAT.crown} — for what it's worth out here.`});
    t.push({cat:'place',label:'Where can I sleep?',response:have('inn')?`The inn. A room's a few coins a night; ${lord.title} ${lord.name} doesn't let them gouge.`:`No inn. There's a camp on the road, or a friend's floor if you've a friend. Try ${nearSites(site,900).find(x=>x.kind==='town'||x.kind==='city')?.name||'the next town'}.`});
    t.push({cat:'place',label:'What can I buy here?',response:shopsHere.length?`${[...new Set(shopsHere.map(k=>({forge:'the smith',weapon:'the smith',armoury:'the armourer',armor:'the armourer',apothecary:'the apothecary',potion:'the apothecary',goods:'the general goods',misc:'the general goods',inn:'the inn',church:'the church',shipwright:'the shipwright',guild_f:"the Fighters' Guild",guild_m:"the Mages' Guild",castle:'the keep',keep:'the keep'})[k]||k))].join(', ')}. ${prosperity(site)<40?'Not much on the shelves lately.':'Fair prices, mostly.'}`:'Nothing. We trade with each other and with the carts, when carts come.'});
    t.push({cat:'place',label:'What\u2019s the law here?',response:NAT.people==='markman'?"The Captain's word, and a duel if you don't like it. Fair, in its way.":NAT.people==='aurennais'?"The Compact's. Everything's written, everything's tithed, and the Prior reads it back to you slowly.":"The Crown's. Patrols on the roads, a magistrate twice a year, and the old gates are royal property — so they say."});
    t.push({cat:'place',label:'The nearest old gate?',get response(){const d=nearestSigilDoorFrom(site);const doors=(getCell(ni,nj).doors||[]).map(e=>({e,p:dungeonWorldPos[e.seed]||e})).sort((a,b)=>Math.hypot(a.p.x-site.x,a.p.z-site.z)-Math.hypot(b.p.x-site.x,b.p.z-site.z));const n=doors[0];return n?`${n.e.canonicalName||(typeof dungeonName==='function'?dungeonName(n.e.seed,n.e.theme):'An old gate')}, ${compassWord(n.p.x-site.x,n.p.z-site.z)} of here. ${d&&d.seed===n.e.seed?'There\'s a warm stone in it, they say.':'Leave it be, unless you\'re the sort who doesn\'t.'}`:'None near. Count yourself lucky.';}});
    t.push({cat:'place',label:'How are things here, honestly?',get response(){return `${stateLine(site)}. ${prosperity(site)>=60?'Better than my father saw.':prosperity(site)>=35?'We get by.':'You can see for yourself.'}`;}});
    t.push({cat:'news',label:`What of ${NAT.crown}?`,response:NAT.people==='markman'?"The League? Captains arguing in a hall. They agree on one thing — the Crown's ships shouldn't be in our strait.":NAT.people==='aurennais'?"The Compact tithes and the Church blesses the tithe. Between them they own the sea. Don't say I said it.":"The Crown wants the gates. Says they're royal. My grandmother said they were the Weaver's. Neither of them's ever been down one."});
    t.push({cat:'news',label:'Any word from the sea?',get response(){const pirates=OTHER.some(o=>o.kind==='pirate');return pirates?"Black sails, this week. The fishermen came in early and won't say why.":pick(Math.random,["The ferries are running. That's news enough.","A whale off the point, they say. Big as a church.","Quiet. Too quiet for the harbourmaster, who likes a tithe."]);}});
    t.push({cat:'news',label:'How\u2019s trade?',get response(){const R=worldState.routes||{};const open=Object.keys(R).filter(k=>!R[k].broken&&(R[k].a===site.id||R[k].b===site.id)).length;return open?`A cart in the morning, a cart at night. ${open>1?'Two routes now.':'One route.'} Prices are kinder for it.`:prosperity(site)>=50?"Steady. We could do with a route to somewhere, if anyone with coin were listening.":"What trade. The road's a road; nothing comes down it.";}});
    t.push({cat:'news',label:'Heard anything strange?',get response(){return pick(Math.random,["A man at the old field who doesn't age. Everyone's uncle has seen him.","The stones in the gates are warmer than they were. Or colder. Depends who you ask.","Someone's been carving over the old marks. Down in the gates. Nobody knows what for.","The church has a room it bricked up. You didn't hear that from me."]);}});
    if(role==='Villager')t.push({cat:'you',label:'Any work going?',response:`Not from me. The ${site.kind==='city'||site.kind==='town'?'guilds take contracts, and':''} ${lord.title} pays for real trouble. Ask at the ${site.kind==='city'?'keep':'well'}.`});
    if(role==='Innkeeper')t.push({label:'Who\u2019s passing through?',get response(){return pick(Math.random,["A carter from the north who won't say what he carried.","Two guild swords, drinking like they'd earned it.","Nobody. It's you and the fire."+(isNight()?" And whatever's outside.":""),"A priest who paid in silver and ate nothing."]);}});
    if(role==='Priest')t.push({label:'A blessing?',fn:()=>{PHP=Math.min(effMaxHP(),PHP+8);updateHUD();return "Kneel. There. Go easier on the road.";}});
    if(role==='Guard')t.push({label:'Any trouble on the watch?',get response(){return pick(Math.random,["Quiet. Too quiet, my sergeant would say, but he says that about bread.","Wolves at the north fence three nights running.","Someone's been at the graves. Don't ask me who.",isNight()?"Night watch. Everything's trouble at night.":"A drunk, a cart, and you. Fine day."]);}});
    return t;
  }
  function dialogFor(site,reg,r,role,name,extraTopics,def){
    // the def already has _roadLine/_doorLine; topics are rebuilt on each open
    const T=TEMPERS[def.temper];
    Object.defineProperty(def,'topics',{configurable:true,get(){
      // top level: the NPC's own business (shop, ferries, quests, purchases) + three folders
      const extra=[...(def._extra||extraTopics||[]),...(def._extraFn?def._extraFn():[])];
      const ferries=extra.filter(t=>/^Passage to/.test(t.label)),rest=extra.filter(t=>!/^Passage to/.test(t.label));
      const rich=richTopics(site,reg,r,role,name,def);
      const folder=(label,items,say)=>({label,folder:true,response:say||pick(Math.random,['Ask, then.','Go on.','What would you know?','Well?']),follow:items});
      const you=rich.filter(t=>t.cat==='you'||(!t.cat&&/Who are you|troubling|work going|blessing|passing through|on the watch/i.test(t.label)));
      const place=rich.filter(t=>t.cat==='place'||(!t.cat&&/this place|roads go|dangerous|land here|make of|would you do/i.test(t.label)&&!/make of the/.test(t.label)));
      const folk=rich.filter(t=>/make of the/.test(t.label));
      const news=rich.filter(t=>t.cat==='news'||(!t.cat&&/news|weather/i.test(t.label)));
      const list=[...rest];
      if(ferries.length)list.push(folder(`Passage \u2026 (${ferries.length} routes)`,ferries,'Where to? The fares are what they are.'));
      {const where=directionTopics(site,def);if(where.length)list.push(folder('Where can I find \u2026',where,pick(Math.random,['What are you after?','Lost? It happens.','Depends what you want.'])));} // v80 S138
      list.push(folder('About you \u2026',you,'Me? Not much to tell. Ask.'),folder('About this place \u2026',place,'This place. Go on.'),folder('Other folk \u2026',folk,'Other folk. Careful what you ask.'),folder('News \u2026',news,'News travels slow here. What I have:'));
      // follow-ups: a topic with `then` reveals its sub-topics after it's chosen
      const expanded=[];for(const tp of list){expanded.push(tp);}
      // follow-ups live inside the folders: expand them there
      [you,place].forEach(arr=>{for(let i=arr.length-1;i>=0;i--){const tp=arr[i];if(tp.then&&def._asked&&def._asked.has(tp.label))tp.then.forEach((x,k)=>arr.splice(i+1+k,0,Object.assign({},x,{label:'  \u21b3 '+x.label})));}});
      expanded.push({label:Math.random()<.5?pick(Math.random,(PEOPLES[def.people||'gatelander']).bye):pick(Math.random,T.bye),bye:true});
      // remember what was asked (wrap fn/response so choosing marks it)
      return expanded.map(tp=>{const w=Object.assign({},tp);const orig=w.fn;w.fn=(c)=>{(def._asked||(def._asked=new Set())).add(tp.label);const rr=orig?orig(c):undefined;return rr;};if(!orig&&!w.response&&Object.getOwnPropertyDescriptor(tp,'response')){}return w;});
    }});
    Object.defineProperty(def,'greeting',{configurable:true,get(){const n=metCount(def.name);const P=PEOPLES[def.people||'gatelander'];const pg=peopleGreeting(def);const pp=playerPeople();const asideOK=n===0&&pg&&(pp==='oldblood'||Math.random()<.5);const aside=asideOK?(pp==='oldblood'?' '+pg:(pp===def.people?' '+pg:` You're ${pp==='aurennais'?'Aurennais':pp==='markman'?'a Markman':'a Gatelander'}, by the look of you. ${pg}`)):'';const g=(n>0?pick(Math.random,["Back again?","You. Good.","I remember you.","Thought I'd seen the last of you."]):(Math.random()<.5?pick(Math.random,P.greet):pick(Math.random,T.greet)))+aside;const rank=worldState.guild&&(worldState.guild.guild_f.done>=3||worldState.guild.guild_m.done>=3)?" Guildsman.":"";const owner=worldState.owned&&Object.values(worldState.owned).some(o=>o.site===site.id)?" Neighbour.":"";noteMet(name);return [g+owner+rank];}});
    return def;
  }

  // ═══ QUESTS (Session K) ══════════════════════════════════════════════
  // One journal for everything: guild tasks (Session 12) and town quests
  // from lords. A quest is {id, giver, title, desc, objective, kind, data,
  // done, turnedIn, reward}. Town quests are generated from the world like
  // guild tasks; guild ranks add authored commissions at the milestones.
  // Active objectives get a marker on the map. Hooks: onKill, pickups,
  // onTalk, arriving somewhere.
  function plural(n,t){const p=t==='Wolf'?'Wolves':t==='Snow Wolf'?'Snow Wolves':t.endsWith('s')?t:t+'s';return n===1?t:p;}
  function QJ(){return worldState.quests||(worldState.quests=[]);}
  // S510 — the world's quests write their own lines into the journal under their id, as the story's do (S487, journalQuest):
  // the ask when taken, *done* when the work is, the pay when turned in, and a lapse; the short log lines stay
  function qJournal(q,kind,text){if(q&&q.id&&text&&typeof journalQuest==='function')try{journalQuest(kind,q,text);}catch(e){}}
  function qFind(id){return QJ().find(q=>q.id===id);}
  function qActive(){return QJ().filter(q=>!q.turnedIn);}
  function qAdd(q){QJ().push(q);if(typeof addLog==='function')addLog('📜',`${q.title} — ${q.giver}`);if(q.desc)qJournal(q,'accept',q.desc);showMsg(`New quest: ${q.title}`,'#e8d8a0');return q;}
  // S500 — dated work (Michael's C on DECISION #132, part B): a lord's job may carry a date, q.due (the first minute after
  // its last day). Done by then it pays a quarter more; past it, undone, the lord takes it back. One job in three is dated,
  // 7 to 14 days out, rolled from a stream keyed by the town and the day it was given (the co-op rule on seeded rolls).
  function datedWork(q,site){const day=Math.floor((worldState.gameTimeAbsMinutes||0)/1440);const r=seededRng('dated:'+site.id,day);if(r()>=1/3)return q;q.due=(day+7+Math.floor(r()*8)+1)*1440;return q;}
  function datedPay(q){return q.due&&q.doneAt!=null&&q.doneAt<q.due?Math.round((q.reward||0)*1.25):(q.reward||0);}
  function datedLapse(q){if(!q||!q.due||q.done||q.turnedIn||(worldState.gameTimeAbsMinutes||0)<q.due)return false;q.turnedIn=true;q.lapsed=true;if(typeof addLog==='function')addLog('📜',`${q.title}: the date passed, and ${q.giver} has given the work to someone else.`);qJournal(q,'lapsed',`The date passed, and ${q.giver} has given the work to someone else.`);showMsg(`${q.title}: the date has passed. The work is taken back.`,'#c8b880');return true;}
  let _datedAt=0;
  function tickDatedWork(){const now=worldState.gameTimeAbsMinutes||0;if(now<_datedAt&&now>=_datedAt-60)return;_datedAt=Math.floor(now/60)*60+60;QJ().forEach(datedLapse);gLapse();}
  function qComplete(q){if(q.done||q.lapsed)return;if(datedLapse(q))return;q.done=true;q.doneAt=Math.floor(worldState.gameTimeAbsMinutes||0);showMsg(`${q.title}: done — report to ${q.giver}.`,'#e8d8a0');if(typeof addLog==='function')addLog('✅',`${q.title}: objective complete.`);qJournal(q,'ready',`Done — report to ${q.giver}.`);}
  function qTurnIn(q){q.turnedIn=true;if(q.rival&&q.kind==='find'){const j=qFind(q.id),n=q._npc||(j&&j._npc);if(n)duelRemoveNpc(n);q._npc=null;if(j)j._npc=null;} /* S463 — Rowe, found, rides back: she is not left sitting on the land */const paid=questGold(datedPay(q));q.paid=paid;gold+=paid;(worldState.stats||(worldState.stats={})).goldIn=((worldState.stats||{}).goldIn||0)+paid;xp+=Math.round((q.reward||0)*.9);chkLvl();updateHUD();if(typeof addLog==='function')addLog('🏅',`${q.title}: ${paid} gold.`);qJournal(q,'complete',paid>0?`Turned in to ${q.giver}: ${paid} gold.`:`Turned in to ${q.giver}.`);return paid;}
  // ── town quests ──
  const TOWN_KINDS=['cull','retrieve','deliver','find','road'];
  // S457 — the lord's own job and a faction's service at the same seat are kept apart: the job in hand is the open quest
  // from this site that is not a service, and a service asks for a fresh one (`fresh`) to dress in its own words
  function townQuestFor(site,force,fresh){
    const active=fresh?null:qActive().find(q=>q.giverSite===site.id&&!q.faction);if(active)return active;
    const lord=lordFor(site);const r=Math.random;const [ci,cj]=cellOf(site.x,site.z);const c=getCell(ci,cj);
    const kind=force||TOWN_KINDS[Math.floor(r()*TOWN_KINDS.length)];const tier=Math.floor(level/3);const reward=40+tier*30+Math.floor(r()*30);
    const id='tq:'+site.id+':'+QJ().filter(q=>q.giverSite===site.id).length; /* S503 — the town and the count of jobs it has given, not a Date.now() */const giver=`${lord.title} ${lord.name}`;
    const biome=dominantRegion(site.x,site.z).r.biome;
    if(kind==='cull'){const t=({tundra:'Snow Wolf',fen:'Bog Crawler',swamp:'Bog Crawler',dunes:'Sand Scorpion',wasteland:'Ash Hound',moor:'Kobold',forest:'Wolf',autumn:'Boar'}[biome])||'Wolf';const n=4+tier;return {id,giver,giverSite:site.id,title:`${plural(2,t)} at ${site.name}`,desc:`${lord.name}: "${plural(2,t)} have been at the flocks. Kill ${n} of them within sight of the walls and the ${site.kind} will pay."`,objective:`Kill ${n} ${plural(n,t)} near ${site.name}`,kind,data:{target:t,need:n,have:0,x:site.x,z:site.z,radius:520},reward};}
    if(kind==='retrieve'){const doors=nearDoors(site,700,false);const e=doors[Math.floor(r()*Math.min(3,doors.length))];if(e){const p=dungeonWorldPos[e.seed]||{x:e.x,z:e.z};const item=pick(r,["my mother's ring","the parish silver","the reeve's seal","a bolt of dyed cloth","the old survey"]);return {id,giver,giverSite:site.id,title:`${item.charAt(0).toUpperCase()+item.slice(1)}`,desc:`${lord.name}: "Thieves took ${item} and ran for ${e.canonicalName||'an old gate'}, ${compassWord(p.x-site.x,p.z-site.z)} of here. It'll be dropped by the door — they never carry far. Bring it back."`,objective:`Recover ${item} near ${e.canonicalName||'the old gate'}`,kind,data:{x:p.x+7,z:p.z+5,got:false,item},reward:reward+20};}}
    if(kind==='deliver'){const others=nearSites(site,900).filter(t=>t.pad>=45&&t.kind!=='portal');const t=others[Math.floor(r()*Math.min(4,others.length))];if(t){const tl=lordFor(t);return {id,giver,giverSite:site.id,title:`A letter for ${tl.title} ${tl.name}`,desc:`${lord.name}: "Carry this to ${tl.title} ${tl.name} at ${t.name}, ${compassWord(t.x-site.x,t.z-site.z)} of here. Put it in their hand, no one else's."`,objective:`Deliver the letter to ${tl.title} ${tl.name} at ${t.name}`,kind,data:{siteId:t.id,who:tl.name,x:t.x,z:t.z,done:false},reward};}}
    if(kind==='find'){const bedsAll=beds.filter(b=>Math.hypot(b.x-site.x,b.z-site.z)<700);const names=NAMES[site.reg||'irish']||NAMES.irish;const who=pick(r,r()<.5?names.m:names.f);const spot=bedsAll[0]?{x:bedsAll[0].x,z:bedsAll[0].z}:{x:site.x+Math.cos(r()*6.28)*380,z:site.z+Math.sin(r()*6.28)*380};return {id,giver,giverSite:site.id,title:`Where is ${who}?`,desc:`${lord.name}: "${who} went out ${compassWord(spot.x-site.x,spot.z-site.z)} three days ago and hasn't come back. Find them — there's a camp out that way — and send them home."`,objective:`Find ${who} ${compassWord(spot.x-site.x,spot.z-site.z)} of ${site.name}`,kind,data:{who,x:spot.x,z:spot.z,found:false,spawned:false},reward};}
    // road: a bandit camp on the nearest road out
    const rd=ROADS.find(rr=>rr.def.a===site.id||rr.def.b===site.id);const q=rd?rd.pts[Math.min(rd.pts.length-1,Math.floor(rd.pts.length*.5))]:{x:site.x+300,z:site.z};return {id,giver,giverSite:site.id,title:`The road out of ${site.name}`,desc:`${lord.name}: "Bandits have made a camp on the road, ${compassWord(q.x-site.x,q.z-site.z)} of here. Carts won't come. Clear it."`,objective:`Clear the bandit camp on the road ${compassWord(q.x-site.x,q.z-site.z)} of ${site.name}`,kind:'road',data:{x:q.x,z:q.z,count:3+tier,have:0,spawned:false},reward:reward+30};
  }
  function lordTopics(site){
    const _st=TS(site);if(_st.flags.occupied!=null){const by=nationName(_st.occupier);return [{label:'Who holds the town?',response:`${by}. Their captain sits in my chair and their soldiers hold the plaza. Kill the garrison and it's ours again; until then I've nothing to give you but my thanks for asking.`}];}
    if(_st.flags.besieged!=null){const by=nationName(_st.siegeBy);return [{label:'The siege?',response:`${by}'s camp sits on the road. Twelve days of that and the gates open from hunger. Break the camp and you'll have the town's thanks and mine.`}];}
    return [{label:'I\u2019m looking for work.',quest:true,fn:()=>{tickDatedWork();const q=townQuestFor(site);if(!q.turnedIn&&!qFind(q.id)){datedWork(q,site);qAdd(q);}if(q.done)return `You've done it? Then ${datedPay(q)} gold, with the ${site.kind}'s thanks.`;return q.desc+(q.due?` (${q.reward} gold; ${Math.round(q.reward*1.25)} if it is done by ${calDateLine(q.due-1)}. After that, the work goes to someone else.)`:` (${q.reward} gold.)`);}},
            {label:'It\u2019s done.',quest:true,fn:()=>{tickDatedWork();const q=qActive().find(q=>q.giverSite===site.id&&!q.faction);if(!q)return "You've nothing from me to finish.";if(!q.done)return `Not yet — ${q.objective}.`;const paid=qTurnIn(q);addFavor(site,1);const more=tutOnTurnIn(q,site);return `${paid} gold. ${more?'Good.'+more:pick(Math.random,["Good.","The town won't forget it.","There'll be more."])}`;}},
            {label:'How fares the town?',get response(){return `${site.name} is ${stateLine(site)}. ${favor(site)>=3?'And it counts you a friend.':favor(site)<=-2?'And it has not forgotten you.':''}`;}},
            ];
  }
  // ── hooks ──
  function qOnKill(e,ctx){
    for(const q of qActive()){if(q.done)continue;
      if(q.kind==='cull'&&ctx==='zone'&&e.name===q.data.target&&Math.hypot(e.x-q.data.x,e.z-q.data.z)<q.data.radius){q.data.have++;if(q.data.have>=q.data.need)qComplete(q);}
      if(q.kind==='road'&&e._questTag===q.id){q.data.have++;if(q.data.have>=q.data.count){qComplete(q);const rd=ROADS.find(rr=>rr.def.a===q.giverSite||rr.def.b===q.giverSite);if(rd)markRoadCleared(rd.def.a,rd.def.b);}}
    }
  }
  function qOnTalk(def){
    for(const q of qActive()){if(q.done)continue;
      if(q.kind==='deliver'&&def.name===q.data.who){q.data.done=true;qComplete(q);showMsg(`${def.name} takes the letter.`,'#e8d8a0');return true;}
      if(q.kind==='find'&&def.name===q.data.who&&def._lost){q.data.found=true;qComplete(q);if(q.rival)return false; /* S457 — Rowe is found in her own words (her topic), so her dialogue opens */ showMsg(`${def.name}: "Home? Yes. Yes, all right."`,'#e8d8a0');return true;}
    }
    return false;
  }
  function qTick(){
    for(const q of qActive()){if(q.done)continue;
      if(q.kind==='retrieve'&&!q.data.got&&!q._obj){const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.4,.5),new THREE.MeshLambertMaterial({color:0xc8a040}));m.position.set(q.data.x,worldH(q.data.x,q.data.z)+.2,q.data.z);sc.add(m);const l=regLight(0xffd080,.8,5,'quest');l.position.copy(m.position);q._obj={m,l};pickups.push({x:q.data.x,z:q.data.z,quest:q});}
      if(q.kind==='find'&&!q.data.spawned&&Math.hypot(px-q.data.x,pz-q.data.z)<200){q.data.spawned=true;const site=siteAnywhere(q.giverSite);const def=makeDef(site,site.reg||'irish',Math.random,'Villager',q.data.who,{x:q.data.x+1.5,z:q.data.z,bCol:0x4a3a2a,sCol:0xd4a878,keepName:true,topics:q.data.topics||[{label:'People are looking for you.',response:"Are they. I only meant to sit a while."}]});def._lost=true;if(q.rival){def.people='markman';def.sCol=0xf0dcc8;def.hairCol=0xd8c8a0;def.bCol=0x2a2a30;def.role=({crown:'Warden',league:'Reeve',compact:'Factor'})[q.faction]||def.role;Object.defineProperty(def,'greeting',{configurable:true,value:["Aye. Thought it'd be you. Sit, if you're stopping — I'm not getting up yet."]});Object.defineProperty(def,'topics',{configurable:true,get(){return [...(q.data.topics||[]),{label:'Farewell.',bye:true}];}});} /* S461 — Finding 10: her rank, her own greeting, her own topic */const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(q.data.x+1.5,worldH(q.data.x+1.5,q.data.z),q.data.z);q._npc=n;}
      if(q.kind==='road'&&!q.data.spawned&&Math.hypot(px-q.data.x,pz-q.data.z)<180){q.data.spawned=true;const pr=seededRng('place',q.id);for(let k=0;k<q.data.count;k++){const a=pr()*Math.PI*2;const ex=q.data.x+Math.cos(a)*8,ez=q.data.z+Math.sin(a)*8;const e=keyFoe(unlockFoe(buildZoneEnemy(sc,STATIC_SOL,ex,ez,q.enemy||(k===0&&level>=5?'Bandit Captain':'Bandit'),null)),q.id+':foe:'+k); /* S504 — keyed by the job (co-op rules) */e._questTag=q.id;if(q.enemyName){e.name=q.enemyName;e.displayName=q.enemyName;}e.alert=false;e.homeX=q.data.x;e.homeZ=q.data.z;ZONES.world.enemies.push(e);}
        // a camp to go with them
        if(q.data.noCamp){showMsg(`${q.enemyName||'Someone'} is waiting.`,'#e8d8a0');continue;}
        const tentMat=new THREE.MeshLambertMaterial({color:0x6a5a44,side:THREE.DoubleSide});[[-3,-1],[3,-2]].forEach(([ox,oz])=>{const t=new THREE.Mesh(new THREE.ConeGeometry(1.8,2.2,5,1,true),tentMat);t.position.set(q.data.x+ox,worldH(q.data.x+ox,q.data.z+oz)+1.1,q.data.z+oz);sc.add(t);});const em=new THREE.Mesh(new THREE.SphereGeometry(.22,6,6),new THREE.MeshBasicMaterial({color:0xff7a22}));em.position.set(q.data.x,worldH(q.data.x,q.data.z)+.2,q.data.z);sc.add(em);showMsg('A bandit camp.','#ffb060');}
    }
  }
  // pickups shared with guild relics
  function qPickupTick(){for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];if(!p.quest)continue;if(Math.hypot(px-p.x,pz-p.z)<1.4){p.quest.data.got=true;sc.remove(p.quest._obj.m);unregLight(p.quest._obj.l);pickups.splice(i,1);qComplete(p.quest);showMsg(`You take ${p.quest.data.item}.`,'#e8d8a0');}}}
  // compass + world markers for everything live: red for doors/portals, green for people, items, creatures, places
  const RED='#ff5544',GREEN='#66dd66';
  const POI_GLYPH={bridge:'⌒',city:'🏰',town:'🏘',village:'⌂',port:'⚓',garrison:'⚔',outpost:'⚑',glade:'❀',shrine:'✦',lair:'☠',tower:'▲',bcamp:'⛺',camp:'▲',ruin:'☗',hermit_camp:'⌂',poi:'✧'};
  function compassPlaces(){const out=[];if(activeZoneId!=='world')return out;const R=200;
    for(const t of SITES){if(!t.name||t.kind==='portal')continue;const d=Math.hypot(t.x-px,t.z-pz);if(d>R||d<6)continue;out.push({x:t.x,z:t.z,glyph:POI_GLYPH[t.kind]||'✧',label:t.name,found:!!discovered(t.id),d,place:true});}
    for(const e of CELL_DOORS){const p=dungeonWorldPos[e.seed]||e;const d=Math.hypot(p.x-px,p.z-pz);if(d>R||d<6)continue;out.push({x:p.x,z:p.z,glyph:e.kind==='fort_door'?'⛫':'◠',label:e.canonicalName||'an old gate',found:!!discovered('door_'+e.seed),d,place:true});}
    return out;}
  function compassMarkers(){
    const out=[];if(activeZoneId!=='world')return out;
    const push=(x,z,col,label,glyph)=>{if(x!=null&&z!=null)out.push({x,z,col,label,glyph});};
    // v80 S138 — the place someone gave you directions to
    wayTick();if(WAY){if(WAY.follow&&WAY.follow.g&&WAY.follow.g.visible){WAY.x=WAY.follow.g.position.x;WAY.z=WAY.follow.g.position.z;}push(WAY.x,WAY.z,'#f6d860',WAY.label,WAY.glyph);}
    // town quests
    for(const q of qActive()){if(q.done){const g=q.giverSite?siteAnywhere(q.giverSite):null;if(g)push(g.x,g.z,GREEN,`report to ${q.giver}`);continue;}const d=q.data||{};
      if(q.kind==='retrieve'&&!d.got)push(d.x,d.z,GREEN,d.item||'the heirloom','\u25c6');
      else if(q.kind==='find'){if(q._npc&&q._npc.g)push(q._npc.g.position.x,q._npc.g.position.z,GREEN,d.who,'\ud83d\udc64');else push(d.x,d.z,GREEN,d.who,'\ud83d\udc64');}
      else if(q.kind==='deliver'){const t=siteAnywhere(d.siteId);if(t)push(t.x,t.z,GREEN,d.who);}
      else if(q.kind==='road'||q.kind==='cull')push(d.x,d.z,GREEN,q.kind==='road'?'the camp':plural(2,q.data.target),q.kind==='road'?'\u26fa':'\u2620');
      else if(q.kind==='duel'&&d.state!=='lost')push(d.x,d.z,GREEN,'the yard','\u2694');}
    // guild tasks
    const G=worldState.guild;if(G)for(const g in G){const t=G[g].active;if(!t||taskDone(t))continue;const x=t.sx!=null?t.sx:t.x!=null?t.x:(t.siteId?(siteAnywhere(t.siteId)||{}).x:null),z=t.sz!=null?t.sz:t.z!=null?t.z:(t.siteId?(siteAnywhere(t.siteId)||{}).z:null);if(x!=null)push(x,z,t.kind==='clear'?RED:GREEN,t.short,t.kind==='relic'?'\u25c6':(t.kind==='beast'||t.kind==='wizard'||t.kind==='creature'||t.kind==='hunt')?'\u2620':undefined);}
    // the story
    const S=worldState.story;if(S&&S.act>=2){
      if(S.step==='corwin'||S.step==='courier'||S.step==='ashfeld'){if(CORWIN.npc)push(CORWIN.npc.g.position.x,CORWIN.npc.g.position.z,GREEN,'Corwin');else{let best=null,bd=1e9;for(const t of SITES){if(t.kind!=='port')continue;const d=Math.hypot(px-t.x,pz-t.z);if(d<bd){bd=d;best=t;}}if(best)push(best.x,best.z,GREEN,'Corwin — '+best.name);}}
      if(S.step==='proof'){for(const nk in S.gates){const g=S.gates[nk];if(!S.proof[nk])push(g.x,g.z,RED,g.name);}}
      if(S.step==='courier'){if(OSWY.ship&&OTHER.includes(OSWY.ship))push(OSWY.ship.x,OSWY.ship.z,GREEN,'the Kestrel');else{const pb=_anch&&_anch.blackhand;if(pb)push(pb.x,pb.z,GREEN,'Port Blackhand');}}
      if(S.step==='ashfeld'){const f=siteAnywhere('ashfeld');if(f)push(ASH.npc?ASH.npc.g.position.x:f.x,ASH.npc?ASH.npc.g.position.z:f.z,GREEN,'Varek');}
      if(S.step==='root'){const r=_anch&&_anch.root;if(r){if(S.rootCleared&&ROOTS.npc)push(ROOTS.npc.g.position.x,ROOTS.npc.g.position.z,GREEN,'Varek');else{const p=dungeonWorldPos[9001];push(p?p.x:r.x,p?p.z:r.z,RED,'The Root');}}}}
    tutMarkers(push);try{factionMarkers(push);warMarkers(push);guildMarkers(push);}catch(e){}
    // rubbings and the reader
    const rub=worldState.rubbings||{};for(const seed in rub){const p=dungeonWorldPos[seed];const read=worldState.sigilsRead||{};if(p&&!read[seed])push(p.x,p.z,RED,rub[seed]);}
    if(VX.npc)push(VX.npc.g.position.x,VX.npc.g.position.z,GREEN,'someone at the field');
    // the main story's next giver, when a quest is waiting on an authored NPC in this world
    try{if(typeof QUEST_DEFS!=='undefined'){for(const q of QUEST_DEFS){const st=qState(q.id);if(!q.giver)continue;if(st==='available'||st==='reward'){const h=ZONES.world.houses.find(x=>x.keeper===q.giver);const n=npcs.find(x=>x.def&&x.def.name===q.giver);if(n)push(n.g.position.x,n.g.position.z,GREEN,q.giver);else if(h)push(h.doorX,h.doorZ,GREEN,q.giver);else if(typeof NPC_DEF!=='undefined'&&NPC_DEF.some(d=>d.name===q.giver)&&SITE.ashenmoor)push(SITE.ashenmoor.x,SITE.ashenmoor.z,GREEN,q.giver+' — Ashenmoor'); /* v80 S133 — an outdoor giver far away still points at the village */}}}}catch(e){}
    // v80 S138 — a marker at a place takes the place's glyph (the same set the compass shows for places)
    for(const m of out){if(m.glyph)continue;let best=null,bd=25;
      for(const t of SITES){if(!t.name||t.kind==='portal')continue;const d=Math.hypot(t.x-m.x,t.z-m.z);if(d<bd){bd=d;best=POI_GLYPH[t.kind]||'\u2727';}}
      for(const e of CELL_DOORS){const p=dungeonWorldPos[e.seed]||e;const d=Math.hypot(p.x-m.x,p.z-m.z);if(d<bd){bd=d;best=e.kind==='fort_door'?'\u26eb':'\u25e0';}}
      if(best)m.glyph=best;}
    return out;
  }
  // map markers for active objectives
  function questMarkers(cell){const out=[];{const tpush=(x,z,col,label)=>{if(x!=null&&x>=cell.ox&&x<cell.ox+SIZE&&z>=cell.oz&&z<cell.oz+SIZE)out.push({id:'q_tut_'+label,name:label,kind:'quest',x,z,sub:'A lesson',major:true});};try{tutMarkers(tpush);}catch(e){}}const S=worldState.story;if(S&&S.act>=2){const push=(x,z,name,sub)=>{if(x>=cell.ox&&x<cell.ox+SIZE&&z>=cell.oz&&z<cell.oz+SIZE)out.push({id:'q_story_'+name,name,kind:'quest',x,z,sub,major:true});};if(S.step==='proof'){for(const nk in S.gates){const g=S.gates[nk];if(!S.proof[nk])push(g.x,g.z,g.name,'An etched gate');}}if(S.step==='courier'){const pb=_anch&&_anch.blackhand;if(pb)push(pb.x,pb.z,pb.name,'Oswy Blackhand');}if(S.step==='ashfeld'){const f=siteAnywhere('ashfeld');if(f)push(f.x,f.z,'The Ashfeld','Varek');}if(S.step==='root'){const r=_anch&&_anch.root;if(r)push(r.x,r.z,'The Root','What was bound');}}const rub=worldState.rubbings||{};for(const seed in rub){const p=dungeonWorldPos[seed];if(!p)continue;if(p.x>=cell.ox&&p.x<cell.ox+SIZE&&p.z>=cell.oz&&p.z<cell.oz+SIZE)out.push({id:'q_rub_'+seed,name:rub[seed],kind:'quest',x:p.x,z:p.z,sub:'A warm stone — from a rubbing',major:true});}for(const q of qActive()){if(q.done)continue;const d=q.data;if(d&&d.x!=null&&d.x>=cell.ox&&d.x<cell.ox+SIZE&&d.z>=cell.oz&&d.z<cell.oz+SIZE)out.push({id:'q_'+q.id,name:q.title,kind:'quest',x:d.x,z:d.z,sub:q.objective,major:true});}
    const G=worldState.guild;if(G)for(const g in G){const t=G[g].active;if(!t||taskDone(t))continue;const x=t.sx!=null?t.sx:t.x!=null?t.x:(t.siteId?(siteAnywhere(t.siteId)||{}).x:null),z=t.sz!=null?t.sz:t.z!=null?t.z:(t.siteId?(siteAnywhere(t.siteId)||{}).z:null);if(x==null)continue;if(x>=cell.ox&&x<cell.ox+SIZE&&z>=cell.oz&&z<cell.oz+SIZE)out.push({id:'gq_'+t.id,name:t.short,kind:'quest',x,z,sub:GUILD_DEF[g].name+': '+t.desc.slice(0,60)+'…',major:true});}
    return out;}
  // ── guild commissions at the rank milestones ──
  const COMMISSIONS={
    guild_f:[{at:2,title:'Blooded',short:'The captain of the road',kind:'commission',mk:(site)=>({sx:site.x+300,sz:site.z+200,beast:'Bandit Captain',desc:"A bandit captain has been bleeding the roads for a year. The Guild wants his head before it gives you a name. He's camped with his best a way out of town."})},{at:5,title:'Warden\u2019s Trial',short:'The troll of the hills',kind:'commission',mk:(site)=>({sx:site.x-350,sz:site.z-250,beast:'Ogre',desc:"An ogre. Alone. That's the trial. The old Wardens all did it; half of them lived."})},{at:8,title:'Champion',short:'Two at once',kind:'commission',mk:(site)=>({sx:site.x+420,sz:site.z-120,beast:'Frost Troll',desc:"There's a frost troll in the passes, and where there's one there's another. Kill it and you're Champion. Nobody's asked what happens if you don't."})}],
    guild_m:[{at:2,title:'Adept\u2019s Reading',short:'The rogue\u2019s notes',kind:'commission',mk:(site)=>({sx:site.x-280,sz:site.z+260,beast:'Rogue Mage',desc:"One of ours went rogue and took his notebook. The notebook we want. Him we're indifferent to."})},{at:5,title:'Evoker\u2019s Proof',short:'The wisp at the water',kind:'commission',mk:(site)=>({sx:site.x+380,sz:site.z+340,beast:'Shore Wisp',desc:"Wisps don't die; they unmake. Unmake one and you'll understand what an Evoker is."})},{at:8,title:'Warlock',short:'The hag\u2019s pact',kind:'commission',mk:(site)=>({sx:site.x-400,sz:site.z-300,beast:'Marsh Hag',desc:"A hag in the fen holds a pact older than the Guild. Break it. You'll know how when you're standing there."})}],
  };
  function commissionFor(g,site){const st=gstate()[g];const c=(COMMISSIONS[g]||[]).find(c=>c.at===st.done&&!(st.commissions||[]).includes(c.at));if(!c)return null;const d=c.mk(site);(st.commissions||(st.commissions=[])).push(c.at);return Object.assign({id:g+':c'+c.at,g,kind:'beast',spawned:false,done:false,gold:200+c.at*60,short:c.short,title:c.title,siteId:site.id},d);}

  // ═══ POINTS OF INTEREST II (Session M) ══════════════════════════════
  // Five new site kinds, generated like camps/ruins and built by genSettlement:
  //  glade  — a pond in a clearing, herb hotspots, boar and wolves at the water
  //  shrine — a round columned temple; pray at the altar: full restore + a boon for the day
  //  lair   — a cave mouth in a rock pile with a great beast and its hoard outside it
  function roofFor(site){const y=worldH(site.x,site.z)+38.6;return {x:site.x,z:site.z,y};}
  //  tower  — a tall spire; an interior spiral climbs to a treasure room at the top
  //  bcamp  — a bandit camp: tents, fire, loot, debris, 5–15 bandits under a captain
  const POI_KINDS=['glade','shrine','lair','tower','bcamp'];
  const POI_PAD={glade:52,shrine:28,lair:38,tower:26,bcamp:40};
  // a cavern behind every lair's mouth: a portal record the engine builds as a dungeon; the beast outside still guards it
  function lairDoorFor(site,c){const seed=100000+(String(site.id).split('').reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,7)%800000);const biome=dominantRegion(site.x,site.z).r.biome;
    const boss=biome==='tundra'?'Frost Troll':biome==='wasteland'||biome==='wastes'?'Ash Wight':biome==='swamp'||biome==='fen'?'Marsh Hag':cellHash(seed%9973,seed%7919,4)<.5?'Cave Bear':'Ogre';
    const dragon=!!site.dragon||cellHash(seed%9973,seed%7919,5)<.08;site.dragon=dragon;
    return {zone:'gen',x:site.x,z:site.z-6,seed,size:dragon?'large':'medium',theme:biome==='tundra'?'deep':biome==='swamp'||biome==='fen'?'haunted':'deep',diff:dragon?'veryhard':'hard',kind:'cave_door',cell:c.i+','+c.j,sigil:false,lairDoor:true,canonicalName:`${site.name} — the cavern`,lair:{place:site.name.replace(/'s Lair$/,''),boss,dragon,siteId:site.id}};}
  function poiName(kind,r,reg){const n=genName(r,reg);return kind==='glade'?`${n} Glade`:kind==='shrine'?`Shrine of ${n}`:kind==='lair'?`${n}'s Lair`:kind==='tower'?`${n} Spire`:`${n} Camp`;}
  // ── finding sigils: rubbings, rumours, the Weaver's Eye ──
  function sigilDoors(){const out=[];for(const c of CELLS.values()){if(!c.doors)continue;c.doors.forEach(e=>{if(!e.wet&&(e.sigil||e.kind==='fort_door'))out.push(e);});}return out;}
  function nearestSigilDoor(){let best=null,bd=1e9;const read=worldState.sigilsRead||{};for(const e of sigilDoors()){if(read[e.seed])continue;const p=dungeonWorldPos[e.seed]||{x:e.x,z:e.z};const d=Math.hypot(p.x-px,p.z-pz);if(d<bd){bd=d;best={x:p.x,z:p.z,name:e.canonicalName||'an old gate',seed:e.seed};}}return best;}
  function onMasteryTouch(spellId){const seed=(typeof activePortal!=='undefined'&&activePortal&&activePortal.seed)||(typeof curPortal!=='undefined'&&curPortal&&curPortal.seed)||(typeof currentPortal!=='undefined'&&currentPortal&&currentPortal.seed)||null;if(seed!=null)(worldState.sigilsRead||(worldState.sigilsRead={}))[seed]=spellId;worldState.masteries=(worldState.masteries||0)+1;}
  function rubbingTopics(site){const d=nearestSigilDoorFrom(site);if(!d)return [];const price=60;return [{label:`Buy a rubbing of a warm stone (${price} gold)`,quest:true,fn:()=>{if(gold<price)return `A rubbing is ${price} gold. We have to send someone to take it.`;gold-=price;updateHUD();if(typeof bagAdd==='function')bagAdd({name:`Rubbing: ${d.name}`,ico:'📜',type:'rubbing',seed:d.seed,gate:d.name,weight:.2,sellMult:.3,buyPrice:price,qty:1});return `Taken from ${d.name}, ${compassWord(d.x-site.x,d.z-site.z)} of here. Read it and your map will remember where.`;}}];}
  function nearestSigilDoorFrom(site){let best=null,bd=1e9;const read=worldState.sigilsRead||{},rub=worldState.rubbings||{};for(const e of sigilDoors()){if(read[e.seed]||rub[e.seed])continue;const p=dungeonWorldPos[e.seed]||{x:e.x,z:e.z};const d=Math.hypot(p.x-site.x,p.z-site.z);if(d<bd&&d<2600){bd=d;best={x:p.x,z:p.z,name:e.canonicalName||(typeof dungeonName==='function'?dungeonName(e.seed,e.theme):'an old gate'),seed:e.seed};}}return best;}
  // canonical names for generated gates, in the cell's own tongue
  const GATE_WORDS={ruins:['Barrow','Hollow','Tomb','Crypt','Vault'],goblin:['Warren','Den','Burrow','Hole','Nest'],haunted:['Crypt','Sepulchre','Mound','Silence','Deep'],cave:['Cave','Hollow','Mouth','Cleft','Undercroft'],fort:['Hold','Keep','Bastion','Watch','Gate'],elemental:['Furnace','Well','Cistern','Forge','Kiln'],undead:['Ossuary','Charnel','Grave','Barrow','Catacomb'],forest:['Root','Hollow','Bower','Warren','Nest'],deep:['Wound','Scar','Pit','Silence','Seam']};
  function canonicalGateName(e,cell){const words=GATE_WORDS[e.theme]||GATE_WORDS.cave;const rr=cellRng(e.seed%9973,e.seed%7919,3);const w=words[Math.floor(rr()*words.length)];const n=genName(rr,cell.reg||'irish');const q=rr();return q<.35?`${n} ${w}`:q<.6?`The ${w} of ${n}`:q<.8?`${n}'s ${w}`:`The ${['Old','Cold','Black','Broken','Sunken','Grey'][Math.floor(rr()*6)]} ${w}`;}
  function siteCreatures(S,list){ // zone enemies that belong to a site; removed with it
    S.creatures=S.creatures||[];for(const [name,x,z,alert] of list){const fid=S.site.id+':foe:'+S.creatures.length; /* S479 — a site's foe is its site and index (co-op rules) */ const e=keyFoe(buildZoneEnemy(sc,STATIC_SOL,x,z,name,typeof pickVariant==='function'?pickVariant(name,level,'normal',seededRng('variant',fid)):null),fid);if(e.locked){e.locked=false;if(e.mesh)e.mesh.visible=true;} /* v80 — a lair's beast is there whatever your level */ e.alert=!!alert;e.homeX=x;e.homeZ=z;e._site=S.site.id;ZONES.world.enemies.push(e);S.creatures.push(e);}
  }
  function siteChest(S,x,z,mult,name){const y=worldH(x,z);const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=Math.atan2(S.site.x-x,S.site.z-z);const {lid}=buildChestShell(g,1.8,0x4a3018);S.group.add(g); // S259 — the kit's chest (S198), the old box's size, its lid on the hinge; a group, so the bake leaves it whole
    let items=(typeof rollContainerLoot==='function'?rollContainerLoot('treasure',mult,null,1,S.site.id+':chest:'+lootDay()):[])||[];if(!items.length)items.push({name:'Old Gold',ico:'🪙',type:'misc',weight:.5,sellMult:1,buyPrice:80,qty:1});items.forEach(it=>{if(it.qty==null)it.qty=1;});
    const ch={x,z,y:y+.3,name,displayName:name,items,zone:'world',kind:'chest',g,lid,opened:false,_site:S.site.id};if(typeof ZONE_CORPSES!=='undefined')ZONE_CORPSES.push(ch);S.chest=ch;return ch;}
  function buildGlade(S,site,r){
    const {group,sol}=S;const cx=site.x,cz=site.z;const pad=site.pad;const y=worldH(cx,cz);
    // the pond: a bowl stamp under a water disc
    const pr=11+r()*4;addStamp({id:'pond_'+site.id,kind:'pond',x:cx,z:cz,r:pr,blend:7,y:y-2.0});
    const water=new THREE.Mesh(new THREE.CircleGeometry(pr+2,28),new THREE.MeshLambertMaterial({color:0x4a8ab0,transparent:true,opacity:.75}));water.rotation.x=-Math.PI/2;water.position.set(cx,y-.75,cz);water.userData.noBake=true;group.add(water);
    ZONES.world.platforms.push({x0:cx-pr,x1:cx+pr,z0:cz-pr,z1:cz+pr,y:y-.85,site:site.id,shallow:true});
    // reeds, a fallen log, big trees at the edge. S215 — in detail (H.5, Michael's A): clumps of reed blades and cattails,
    // a barked log with cut ends, stubs, moss and mushrooms, lily pads on the water; the old cones and cylinder the distant copy
    {const hi=[],lo=[],C=x=>new THREE.Color(x),add=(A,geo,col,x,yy,z,rx,ry,rz,sx,sy,sz)=>A.push({geo,color:C(col),x,y:yy,z,rx,ry,rz,sx,sy,sz});
      for(let i=0;i<14;i++){const a=r()*Math.PI*2,rr=pr+1+r()*3;const x=Math.cos(a)*rr,z=Math.sin(a)*rr,hy=worldH(cx+x,cz+z)-y,h=1.6+r()*.8;
        add(lo,new THREE.ConeGeometry(.12,h,4),0x6a8a3a,x,hy+.7,z);
        const nb=13+Math.floor(r()*7);for(let k=0;k<nb;k++){const ba=r()*Math.PI*2,bl=h*(.55+r()*.5),lean=.08+r()*.22,g0=C(0x5a7a30).lerp(C(0x9aa04a),r());
          add(hi,SK.cone(.045,bl,3),g0.getHex(),x+Math.cos(ba)*.2,hy+bl/2-.05,z+Math.sin(ba)*.12,Math.sin(ba)*lean,ba,-Math.cos(ba)*lean,1,1,.35);}
        const nc=1+Math.floor(r()*3);for(let k=0;k<nc;k++){const ox=(r()-.5)*.25,oz=(r()-.5)*.25,sh=h*(.8+r()*.35);add(hi,SK.cyl(.012,.014,sh,5),0x7a8a40,x+ox,hy+sh/2-.05,z+oz);
          add(hi,SK.cyl(.05,.05,.24,8),0x5a381c,x+ox,hy+sh-.12,z+oz);add(hi,SK.cyl(.004,.008,.12,4),0x8a7a50,x+ox,hy+sh+.06,z+oz);}}
      // the fallen log, built along x and turned where it lies
      const ly=r()*3,lx=pr+5,lh=worldH(cx+lx,cz)-y;
      const lg=(geo,col,x,yy,z,rx,ry,rz,sx,sy,sz)=>{geo.scale(sx||1,sy||1,sz||1);geo.rotateZ(rz||0);geo.rotateY(ry||0);geo.rotateX(rx||0);geo.translate(x,yy,z);geo.rotateY(ly);geo.translate(lx,lh+.4,0);hi.push({geo,color:C(col)});};
      lg(SK.bumpy(SK.cyl(.4,.5,5,14,6),.035,17,9),0x4a3018,0,0,0,0,0,Math.PI/2);
      for(const sd of [1,-1]){lg(SK.cyl(sd>0?.37:.47,sd>0?.37:.47,.02,14),0xa8844e,sd*2.505,0,0,0,0,Math.PI/2);for(let k=1;k<4;k++)lg(SK.torus((sd>0?.37:.47)*k/4,.012,3,14),0x7a5a30,sd*2.52,0,0,0,Math.PI/2,0);}
      lg(SK.cyl(.08,.12,.6,7),0x4a3018,.6,.45,.1,.3,0,-.4);lg(SK.cyl(.06,.09,.45,7),0x4a3018,-1.3,.2,-.4,-1.1,0,.2);
      for(let k=0;k<5;k++)lg(SK.ball(.22+r()*.12,8,5),C(0x3e5a24).lerp(C(0x6a8a34),r()).getHex(),-1.8+k*.9,.38,(r()-.5)*.3,0,0,0,1.3,.35,1);
      for(let k=0;k<4;k++){const mx=-.5+k*.22+r()*.1,mz=.44+r()*.06,ms=.7+r()*.6;lg(SK.cyl(.02*ms,.026*ms,.12*ms,6),0xe8dcc0,mx,-.05+.06*ms,mz);lg(SK.ball(.06*ms,8,5,0,Math.PI*2,0,Math.PI/2),0xb08858,mx,-.05+.12*ms,mz);}
      {const g2=new THREE.CylinderGeometry(.4,.5,5,7);g2.rotateZ(Math.PI/2);g2.rotateY(ly);lo.push({geo:g2,color:C(0x4a3018),x:lx,y:lh+.4,z:0});}
      // lily pads and a few flowers near the bank
      for(let i=0;i<9;i++){const a=r()*Math.PI*2,rr=pr*(.45+r()*.45);const ps=.35+r()*.3;add(hi,new THREE.CylinderGeometry(ps,ps,.02,12,1,false,.3,Math.PI*2-.6),C(0x3a6a2a).lerp(C(0x5a8a3a),r()).getHex(),Math.cos(a)*rr,-.73,Math.sin(a)*rr,0,r()*6.28,0);
        if(r()<.35)add(hi,SK.cone(.09,.1,6),0xf0e0e8,Math.cos(a)*rr+.1,-.66,Math.sin(a)*rr);}
      poiLod(group,mergeParts(hi),mergeParts(lo),cx,y,cz);}
    sol.push({cx:cx+pr+5,cz,rx:2.5,rz:.5});
    const trees=new THREE.InstancedMesh(PROTO.broadleaf,SCATTER_MAT,10);const mm=new THREE.Matrix4();for(let i=0;i<10;i++){const a=i/10*Math.PI*2+r()*.4,rr=pad-9+r()*5;const x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;mm.compose(new THREE.Vector3(x,worldH(x,z),z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),r()*6.28),new THREE.Vector3(1.4,1.5,1.4));trees.setMatrixAt(i,mm);trees.setColorAt(i,new THREE.Color(.9,1,.9));sol.push({cx:x,cz:z,rx:.5,rz:.5});}trees.instanceMatrix.needsUpdate=true;trees.userData.noBake=true;group.add(trees);
    // herbs: a hotspot ring of 18 around the water
    if(typeof HERB_DEF!=='undefined'){const biome=dominantRegion(cx,cz).r.biome;const cands=herbCandidates(biome,'water').concat(herbCandidates(biome,'tree'));if(cands.length){for(let i=0;i<18;i++){const a=r()*Math.PI*2,rr=pr+2.5+r()*8;const x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;const type=cands[Math.floor(r()*cands.length)][0];const def=HERB_DEF[type];const g=new THREE.Group();g.position.set(x,worldH(x,z),z);const h={id:S.site.id+':herb:'+i,x,z,type,def,g,gl:{intensity:0,parent:null},harvested:false,respawnT:0,ph:r()*6.28};ZONES.world.herbs.push(h);(S.herbs=S.herbs||[]).push(h); /* S514 — its id */}
      // instance them onto a chunk-less mesh owned by the settlement
      const byType={};S.herbs.forEach(h=>(byType[h.type]||(byType[h.type]=[])).push(h));for(const type in byType){const geo=herbGeoFor(type,HERB_DEF[type]);if(!geo)continue;const list=byType[type];herbIM(type,geo,list,group,h=>worldH(h.x,h.z));}}}
    // creatures at the water
    if(worldState.lairs&&worldState.lairs[site.id]){S.creatures=[];S._deadMarked=true;} // v80 — a lair's beast dies once
    const cl=[];const biome=dominantRegion(cx,cz).r.biome;const beast=biome==='tundra'?'Snow Wolf':biome==='fen'||biome==='swamp'?'Bog Crawler':'Boar';for(let i=0;i<3+Math.floor(r()*3);i++){const a=r()*Math.PI*2,rr=pr+4+r()*10;cl.push([i%3===2?'Wolf':beast,cx+Math.cos(a)*rr,cz+Math.sin(a)*rr,false]);}siteCreatures(S,cl);
  }
  function buildShrine(S,site,r){
    const {group,sol}=S;const cx=site.x,cz=site.z;const y=worldH(cx,cz);const c=x=>new THREE.Color(x);const parts=[];
    parts.push({geo:new THREE.CylinderGeometry(6.5,6.8,.5,24),color:c(0xd8d0c0),y:.25},{geo:new THREE.CylinderGeometry(5.8,6.0,.4,24),color:c(0xe0d8c8),y:.7});
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const x=Math.cos(a)*5.0,z=Math.sin(a)*5.0;parts.push({geo:new THREE.CylinderGeometry(.32,.36,4.2,10),color:c(0xe8e0d0),x,z,y:2.9},{geo:new THREE.BoxGeometry(.9,.3,.9),color:c(0xe8e0d0),x,z,y:5.15},{geo:new THREE.CylinderGeometry(.45,.5,.25,10),color:c(0xd8d0c0),x,z,y:1.0});sol.push({cx:cx+x,cz:cz+z,rx:.4,rz:.4});}
    const god=godOf(site);parts.push({geo:new THREE.TorusGeometry(5.2,.3,6,24),color:c(0xe0d8c8),y:5.35,rx:Math.PI/2},{geo:new THREE.CylinderGeometry(.9,1.1,1.1,10),color:c(0xd0c8b8),y:1.45},{geo:new THREE.BoxGeometry(1.6,.12,1.0),color:c(0xe8e0d0),y:2.05});
    const m=poiLod(group,shrineGeoHi(),mergeParts(parts),cx,y,cz); // S204 — fluted columns, bases and capitals, a moulded altar
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.22,.6,6),new THREE.MeshBasicMaterial({color:0xfff0b0}));flame.position.set(cx,y+2.45,cz);flame.userData.noBake=true;group.add(flame);const l=regLight(0xfff0c0,1.4,12,site.id);l.position.set(cx,y+2.8,cz);
    sol.push({cx,cz,rx:.6,rz:.6});S.altar={x:cx,z:cz};S.god=god;site.name=`Shrine of ${god.name}`;
    { // the steps and the floor are footholds: two rings, then the dais
      ZONES.world.platforms.push({x0:cx-7.4,x1:cx+7.4,z0:cz-7.4,z1:cz+7.4,y:y+.5,shrine:site.id},{x0:cx-6.4,x1:cx+6.4,z0:cz-6.4,z1:cz+6.4,y:y+.9,shrine:site.id});
      const dome=new THREE.Mesh(new THREE.SphereGeometry(5.6,20,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:god.tint,side:THREE.DoubleSide}));dome.position.set(cx,y+5.4,cz);dome.castShadow=true;dome.userData.noBake=true;group.add(dome);S._domeSep=true;}
    // a low ring of steps for the pad edge
    for(let i=0;i<3;i++){const s=new THREE.Mesh(new THREE.CylinderGeometry(7.2+i*.9,7.4+i*.9,.22,28),new THREE.MeshLambertMaterial({color:0xcfc7b8}));s.position.set(cx,y-i*.2,cz);group.add(s);}
  }
  // S338 (Michael's A on #60) — the Boon of Renewal: health, stamina and mana each come back half a point a second while
  // it lasts (a Mild tonic's rate, over the boon's whole span); the main loop reads it beside the regen tonics
  const GODS=[{key:'muir',name:'An Mhuir',en:'the Sea',boon:{type:'swiftness',mult:1.25,label:'the Boon of the Road'},tint:0x7a9ab0},{key:'speir',name:'An Spéir',en:'the Sky',boon:{type:'regen',mult:1,rate:RENEWAL_RATE,label:'the Boon of Renewal'},tint:0xa8b8d0},{key:'beithigh',name:'Na Beithígh',en:'the Beasts',boon:{type:'meleeDmg',mult:1.2,label:'the Boon of the Arm'},tint:0x8a7a5a},{key:'cloch',name:'An Chloch',en:'the Stone',boon:{type:'warding',mult:.75,label:'the Boon of Stone'},tint:0x8a8478},{key:'teallach',name:'An Teallach',en:'the Hearth',boon:{type:'spellCost',mult:.7,label:'the Boon of the Mind'},tint:0xb8946a},{key:'fiodoir',name:'An Fíodóir',en:'the Weaver',boon:null,tint:0xc8b8d8}];
  function godOf(site){const h=String(site.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,13);return GODS[h%GODS.length];}
  const SHRINE_BOONS=[{type:'swiftness',mult:1.25,label:'the Boon of the Road'},{type:'warding',mult:.75,label:'the Boon of Stone'},{type:'regen',mult:1,rate:RENEWAL_RATE,label:'the Boon of Renewal'},{type:'meleeDmg',mult:1.2,label:'the Boon of the Arm'},{type:'spellCost',mult:.7,label:'the Boon of the Mind'}];
  function shrinePrompt(){for(const S of SETTLE.values()){if(S.site.kind!=='shrine'||!S.altar)continue;if(Math.hypot(px-S.altar.x,pz-S.altar.z)<2.6)return `Press 'E' to pray to ${S.god?S.god.name+', '+S.god.en:'the altar'}`;}return null;}
  // S497 — on its god's own day (calDay, the calendar's week) a shrine's boon lasts twice as long, two days; the once a day stays
  function shrineInteract(){for(const S of SETTLE.values()){if(S.site.kind!=='shrine'||!S.altar)continue;if(Math.hypot(px-S.altar.x,pz-S.altar.z)>=2.6)continue;
    const st=worldState.shrines||(worldState.shrines={});const abs=worldState.gameTimeAbsMinutes||0;if(st[S.site.id]&&abs-st[S.site.id]<1440){showMsg('The altar is quiet. Come back tomorrow.','#c8b880');return true;}
    st[S.site.id]=abs;PHP=effMaxHP();mana=effMaxMana();if(typeof stamina!=='undefined')stamina=effMaxStamina();updateHUD();
    const b=(S.god&&S.god.boon)||SHRINE_BOONS[Math.floor(Math.random()*SHRINE_BOONS.length)];if(S.god&&!S.god.boon){const d=nearestSigilDoorFrom(S.site);if(d&&typeof bagAdd==='function'){bagAdd({name:`Rubbing: ${d.name}`,ico:'📜',type:'rubbing',seed:d.seed,gate:d.name,weight:.2,sellMult:.3,buyPrice:60,qty:1});showMsg(`You are restored. The Weaver leaves a rubbing on the altar: ${d.name}.`,'#e8d8a0');}else showMsg('You are restored.','#e8d8a0');}
    else{const own=!!(S.god&&typeof isGodsDay==='function'&&isGodsDay(S.god.key,abs));if(typeof _applyBuff==='function')_applyBuff({type:b.type,mult:b.mult,rate:b.rate,duration:own?3600:1800,label:b.label,col:'#e8d8a0'});showMsg(own?`It is ${calDay(abs).day.name}. You are restored, and carry ${b.label} two days.`:`You are restored, and carry ${b.label} until tomorrow.`,'#e8d8a0');}if(typeof addLog==='function')addLog('⛩',`Prayed at ${S.site.name}: ${b.label}.`);if(typeof sfxTone==='function')sfxTone(660,660,.6,.15);return true;}
    return false;}
  function buildLair(S,site,r){
    const {group,sol}=S;const cx=site.x,cz=site.z;const y=worldH(cx,cz);const c=x=>new THREE.Color(x);const parts=[];
    // S204 — lumpy boulders (they were dodecahedra), on the same rolls in the same order
    const stone=c(0x5a5650);for(let i=0;i<14;i++){const a=Math.PI*.15+r()*Math.PI*1.7,rr=3+r()*4;const bs=1.4+r()*1.6;parts.push({geo:cragGeo(bs,i),color:stone,x:Math.cos(a)*rr,z:Math.sin(a)*rr-2,y:.6+r()*1.2,rx:r()*3,ry:r()*3,sy:.8,jitter:.08});}
    parts.push({geo:cragGeo(4.2,99),color:stone,z:-4.5,y:3.2,jitter:.08},{geo:new THREE.BoxGeometry(3.2,2.8,1.2),color:c(0x0a0806),z:-1.2,y:1.4});
    const m=new THREE.Mesh(mergeParts(parts),VC_MAT);m.position.set(cx,y,cz);m.castShadow=true;group.add(m);
    sol.push({cx,cz:cz-4.5,rx:5,rz:3.5},{cx:cx-5,cz:cz-2,rx:2.2,rz:2.2},{cx:cx+5,cz:cz-2,rx:2.2,rz:2.2});
    // bones and a kill
    for(let i=0;i<8;i++){const a=r()*Math.PI*2,rr=3+r()*7;const b=new THREE.Mesh(new THREE.BoxGeometry(.12,.1,.7+r()*.6),new THREE.MeshLambertMaterial({color:0xe8e0d0}));const x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr+3;b.position.set(x,worldH(x,z)+.05,z);b.rotation.y=r()*3;group.add(b);}
    const biome=dominantRegion(cx,cz).r.biome;const boss=biome==='tundra'?'Frost Troll':biome==='wasteland'||biome==='wastes'?'Ash Wight':biome==='swamp'||biome==='fen'?'Marsh Hag':r()<.5?'Cave Bear':'Ogre';
    siteCreatures(S,[[boss,cx,cz+3,false],[biome==='tundra'?'Snow Wolf':'Dire Wolf',cx-4,cz+5,false],[biome==='tundra'?'Snow Wolf':'Dire Wolf',cx+4,cz+6,false]]);
    if(S.creatures[0]){const e=S.creatures[0];const dragon=!!site.dragon;e.hp=e.maxHp=Math.round(e.maxHp*(dragon?6:4)*(1+level*.08));e.dmg=Math.round(e.dmg*(dragon?2.2:2)*(1+level*.04));e.spd=(e.spd||1.4)*1.5;e.lair=site.id;if(e.mesh)e.mesh.scale.multiplyScalar(dragon?2.4:1.5);if(dragon)dragonBody(e,3.2);e.name=dragon?`${site.name.replace("'s Lair",'')} Wyrm`:`${site.name.replace("'s Lair",'')} the ${boss}`;e.boss=true;e.dragon=dragon;}
    siteChest(S,cx+2.2,cz-.2,2.2,'The Hoard');
  }
  function buildTower(S,site,r){
    const {group,sol,houses}=S;const cx=site.x,cz=site.z;const y=worldH(cx,cz);const c=x=>new THREE.Color(x);const H=38,R=4.6;const parts=[];
    parts.push({geo:new THREE.CylinderGeometry(R*.82,R,H,14),color:c(0x8a8478),y:H/2,jitter:.04},{geo:new THREE.CylinderGeometry(R*1.05,R*.85,1.2,14),color:c(0x7a746a),y:H+.4},{geo:new THREE.ConeGeometry(R*1.1,6,14),color:c(0x3a3a46),y:H+4});
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.4;parts.push({geo:new THREE.BoxGeometry(.9,1.4,.4),color:c(0x1a1a22),x:Math.cos(a)*R*.86,z:Math.sin(a)*R*.86,y:8+i*6,ry:-a});}
    parts.push({geo:new THREE.BoxGeometry(1.4,2.2,.6),color:c(0x3a2412),z:R*.95,y:1.1});
    const m=poiLod(group,towerGeoHi(H,R),mergeParts(parts),cx,y,cz); // S204 — in detail near, the old tower far
    for(let a=0;a<Math.PI*2;a+=Math.PI/8){const px_=cx+Math.cos(a)*R*.8,pz_=cz+Math.sin(a)*R*.8;if(Math.abs(a-Math.PI/2)<.5)continue;sol.push({cx:px_,cz:pz_,rx:1.2,rz:1.2});}
    { // v80 — the roof: a walkable platform inside the parapet at the top of the spire
      const ry=y+H+1.0;ZONES.world.platforms.push({x0:cx-R*.78,x1:cx+R*.78,z0:cz-R*.78,z1:cz+R*.78,y:ry,roof:site.id});
      for(let k=0;k<14;k++){const a=k/14*Math.PI*2;parts.push({geo:new THREE.BoxGeometry(1.0,.9,.5),color:c(0x6a665e),x:Math.cos(a)*R*.92,y:H+1.45,z:Math.sin(a)*R*.92,ry:-a});}
      parts.push({geo:new THREE.BoxGeometry(1.4,.12,1.4),color:c(0x3a2e22),x:0,y:H+1.06,z:-2.2});S.roof={x:cx,z:cz,y:ry,hatch:{x:cx,z:cz-2.2}};}
    const house={id:'g_'+site.id+'_tower',doorX:cx,doorZ:cz+R*.95+.4,doorFace:'S',exitX:cx,exitZ:cz+R*.95+2.2,exitYaw:0,name:site.name,keeper:'',type:'tower',tagline:'',w:8,d:8,two:false,reg:site.reg||'irish',style:'stone',dlg:null,siteKind:site.kind,siteId:site.id};houses.push(house);
    const lantern=new THREE.Mesh(new THREE.ConeGeometry(.14,.4,6),new THREE.MeshBasicMaterial({color:0xffd080}));lantern.position.set(cx,y+3.1,cz+R*.98);lantern.userData.noBake=true;group.add(lantern);const l=regLight(0xffb050,1.0,9,site.id);l.position.copy(lantern.position);
  }
  function buildBanditCamp(S,site,r){
    const {group,sol}=S;const cx=site.x,cz=site.z;const y=worldH(cx,cz);
    const tentMat=new THREE.MeshLambertMaterial({color:0x6a5a44,side:THREE.DoubleSide});const n=5+Math.floor(r()*4);
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r()*.5,rr=7+r()*8;const x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;const t=new THREE.Mesh(campTentGeo(i),VC_MAT);t.position.set(x,worldH(x,z),z);t.rotation.y=r()*6;t.castShadow=true;t.userData.noBake=true;group.add(t);sol.push({cx:x,cz:z,rx:1.6,rz:1.6});} // S205 — a ridge tent of canvas on poles (it was an open cone)
    // fire, cooking frame, crates, barrels, bones, a stockade of stakes
    const fire=new THREE.Mesh(new THREE.SphereGeometry(.32,7,7),new THREE.MeshBasicMaterial({color:0xff7a22}));fire.position.set(cx,y+.28,cz);fire.userData.noBake=true;group.add(fire);const fl=regLight(0xff8a30,1.5,13,site.id);fl.position.set(cx,y+1.0,cz);
    // S205 — on the kit, on the same dice in the same order: a ring of fire stones with logs and a cooking tripod, crates
    // and bellied barrels, bones that are bones, pointed stakes
    const c=x=>new THREE.Color(x);const parts=[];for(let i=0;i<9;i++){const a=i/9*Math.PI*2;parts.push({geo:cragGeo(.26,i+3),color:c(0x5a5650).multiplyScalar(.85+(i%3)*.12),x:Math.cos(a)*.95,z:Math.sin(a)*.95,y:.12,ry:-a,jitter:.06});}
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;parts.push({geo:SK.cyl(.08,.1,1.1,6),color:c(0x3a2818),x:Math.cos(a)*.25,z:Math.sin(a)*.25,y:.2,rx:Math.PI/2-.35,ry:-a+Math.PI/2,jitter:.08});}
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2;parts.push({geo:SK.cyl(.04,.05,2.1,5),color:c(0x4a3018),x:Math.cos(a)*.75,z:Math.sin(a)*.75,y:.95,rx:Math.sin(a)*-.35,rz:Math.cos(a)*.35});}
    parts.push({geo:SK.cyl(.01,.01,.7,4),color:c(0x2a2622),y:1.55},{geo:SK.lathe([[.001,0],[.2,0],[.26,.12],[.24,.28],[.18,.3],[.001,.3]],10),color:c(0x2a2622),y:1.0});
    for(let i=0;i<5;i++){const a=r()*6.28,rr=4+r()*5;const X=Math.cos(a)*rr,Z=Math.sin(a)*rr;
      if(i%2){parts.push({geo:SK.lathe([0,.125,.25,.375,.5,.625,.75,.875,1].map(u=>[.4*(.86+.14*Math.sin(Math.PI*u)),.9*u]),12),color:c(0x8a6a3a),x:X,z:Z,y:0});for(const u of [.15,.85])parts.push({geo:new THREE.TorusGeometry(.4*(.86+.14*Math.sin(Math.PI*u))+.01,.02,4,14),color:c(0x2a241e),x:X,z:Z,y:.9*u,rx:Math.PI/2});}
      else parts.push({geo:SK.rbox(.9,.8,.9,.05,2),color:c(0x7a5a30),x:X,z:Z,y:.4});}
    for(let i=0;i<12;i++){const a=r()*6.28,rr=2+r()*14;const L=.4+r()*.5;parts.push({geo:SK.limb(L,.05,.04),color:c(0xe8e0d0),x:Math.cos(a)*rr,z:Math.sin(a)*rr,y:.05,rx:Math.PI/2,ry:r()*3});}
    for(let i=0;i<26;i++){const a=i/26*Math.PI*2;const rr=site.pad-6;const rx=(r()-.5)*.3,rz=(r()-.5)*.3;parts.push({geo:SK.cyl(.1,.14,2.0,6),color:c(0x4a3018),x:Math.cos(a)*rr,z:Math.sin(a)*rr,y:1.0,rx,rz,jitter:.08},{geo:SK.cone(.1,.45,6),color:c(0x6a4a28),x:Math.cos(a)*rr+Math.sin(rz)*-1.1,z:Math.sin(a)*rr+Math.sin(rx)*1.1,y:2.2,rx,rz});}
    const m=new THREE.Mesh(mergeParts(parts),VC_MAT);m.position.set(cx,y,cz);m.castShadow=true;group.add(m);
    // a banner and the loot
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,4,6),new THREE.MeshLambertMaterial({color:0x2a2622}));pole.position.set(cx+3,y+2,cz-3);group.add(pole);const cloth=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.9),new THREE.MeshLambertMaterial({color:0x2a2020,side:THREE.DoubleSide}));cloth.position.set(cx+3.6,y+3.5,cz-3);group.add(cloth);
    siteChest(S,cx-3,cz+2,1.6,"Bandits' Takings");
    const cl=[];const nb=5+Math.floor(r()*11);for(let i=0;i<nb;i++){const a=r()*6.28,rr=2+r()*(site.pad-12);cl.push([i===0&&level>=4?'Bandit Captain':i<3?'Bandit Archer':r()<.3?'Highwayman':'Bandit',cx+Math.cos(a)*rr,cz+Math.sin(a)*rr,false]);}siteCreatures(S,cl);
  }
  let _sdT=0;function tickSiteDeaths(){_sdT-=1/60;if(_sdT>0)return;_sdT=2;for(const S of SETTLE.values()){if(!S.creatures||!S.creatures.length||S._deadMarked)continue;if(S.creatures.every(e=>e.dead)){S._deadMarked=true;markLairDead(S.site.id);const rd=ROADS.find(rr=>Math.hypot(rr.pts[Math.floor(rr.pts.length/2)].x-S.site.x,rr.pts[Math.floor(rr.pts.length/2)].z-S.site.z)<300);if(rd&&S.site.kind==='bcamp')markRoadCleared(rd.def.a,rd.def.b);showMsg(`${S.site.name} is quiet now.`,'#e8d8a0');}}}
  // S204 — a POI's detailed piece near, its old one as the distant copy (baked in the POI's clusters, as a town's houses)
  function poiLod(group,hiGeo,loGeo,x,y,z,shadow){const hi=new THREE.Mesh(hiGeo,VC_MAT),lo=new THREE.Mesh(loGeo,VC_MAT);for(const m of [hi,lo]){m.position.set(x,y,z);m.castShadow=shadow!==false;m.receiveShadow=true;group.add(m);}hi.userData.lod='hi';lo.userData.lod='lo';return hi;}
  // the wizard's tower in detail: coursed stone in bands, pilaster ribs, arched lancets with sills, a string course at each
  // floor, a corbelled and crenellated parapet, a slated spire in courses with a finial, an arched door up three steps
  function towerGeoHi(H,R){const P=[],s=0x8a8478,dk=0x6e695f,r0=pRng(9173);const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});
    add(new THREE.CylinderGeometry(R*1.12,R*1.25,1.6,18),dk,0,.5,0);add(new THREE.CylinderGeometry(R*.82,R,H,18,8),s,0,H/2,0,0,0,0,.06);
    for(let k=1;k<7;k++){const y=k*H/7,rr=R-(R*.18)*(y/H);add(new THREE.TorusGeometry(rr+.02,.16,5,24),dk,0,y,0,Math.PI/2,0,0);}
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.4,y=8+i*6,rr=(R-(R*.18)*(y/H))+.04;const x=Math.cos(a)*rr,z=Math.sin(a)*rr;
      add(new THREE.BoxGeometry(.8,1.3,.3),0x1a1a22,x,y,z,0,-a+Math.PI/2,0,0);add(SK.cone(.4,.45,4),0x1a1a22,x,y+.85,z,0,-a+Math.PI/2+Math.PI/4,0,0);
      add(SK.rbox(1.1,.14,.5,.04,1),dk,x,y-.72,z,0,-a+Math.PI/2,0);add(SK.torus(.45,.08,4,10,Math.PI),dk,Math.cos(a)*(rr+.05),y+.66,Math.sin(a)*(rr+.05),0,-a+Math.PI/2,0);}
    const top=H,Rt=R*.82;for(let k=0;k<18;k++){const a=k/18*Math.PI*2;add(SK.rbox(.35,.55,.35,.06,1),dk,Math.cos(a)*(Rt+.18),top-.1,Math.sin(a)*(Rt+.18),0,-a,0);}
    add(new THREE.CylinderGeometry(Rt+.45,Rt+.3,.6,18),s,0,top+.4,0);for(let k=0;k<12;k++){if(k%2)continue;const a=k/12*Math.PI*2;add(SK.rbox(1.1,.8,.4,.08,1),s,Math.cos(a)*(Rt+.3),top+1.1,Math.sin(a)*(Rt+.3),0,-a+Math.PI/2,0);}
    for(let k=0;k<6;k++){const r1=Rt*1.12*(1-k/6),r2=Rt*1.12*(1-(k+1)/6);add(new THREE.CylinderGeometry(Math.max(.05,r2),r1,1.25,18,1,true),new THREE.Color(0x3a3a46).multiplyScalar(.85+r0()*.3).getHex(),0,top+1.3+k*1.08+.6,0,0,0,0,.05);}
    add(SK.cyl(.08,.08,1.6,5),0x8a7a4a,0,top+8.4,0);add(SK.ball(.22,8,6),0xc8a850,0,top+9.2,0);
    add(SK.rbox(1.8,2.6,.5,.08,1),dk,0,1.3,R*.97);add(new THREE.BoxGeometry(1.3,2.1,.3),0x3a2412,0,1.05,R*1.02);add(SK.torus(.72,.12,5,12,Math.PI),dk,0,2.1,R*1.05);
    for(let k=0;k<3;k++)add(SK.rbox(2.2,.2,.6,.05,1),dk,0,.1+k*.2,R*1.05+.9-k*.35);
    return mergeParts(P);}
  function shrineGeoHi(){const P=[],w=0xe8e0d0,w2=0xd8d0c0;const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.04:j});
    add(new THREE.CylinderGeometry(6.5,6.8,.5,32),w2,0,.25,0);add(new THREE.CylinderGeometry(5.8,6.0,.4,32),0xe0d8c8,0,.7,0);add(new THREE.CylinderGeometry(6.15,6.25,.1,32),w,0,.52,0);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const x=Math.cos(a)*5.0,z=Math.sin(a)*5.0;
      add(SK.lathe([[.001,0],[.5,0],[.5,.12],[.42,.18],[.4,.3],[.001,.3]],14),w2,x,.9,z);
      const col=SK.cyl(.32,.36,4.0,16,6);const pp=col.attributes.position;for(let q=0;q<pp.count;q++){const ang=Math.atan2(pp.getZ(q),pp.getX(q));const f=1-.06*Math.max(0,Math.cos(ang*16));pp.setX(q,pp.getX(q)*f);pp.setZ(q,pp.getZ(q)*f);}col.computeVertexNormals();add(col,w,x,3.2,z);
      add(SK.lathe([[.001,0],[.34,0],[.44,.12],[.52,.22],[.001,.22]],14),w2,x,5.2,z);add(SK.rbox(1.05,.22,1.05,.04,1),w,x,5.5,z);}
    add(new THREE.TorusGeometry(5.2,.32,8,40),0xe0d8c8,0,5.75,0,Math.PI/2,0,0);add(new THREE.TorusGeometry(5.2,.16,6,40),w2,0,6.12,0,Math.PI/2,0,0);
    add(SK.lathe([[.001,0],[1.2,0],[1.2,.2],[.95,.35],[.9,1.0],[1.15,1.15],[1.15,1.3],[.001,1.3]],16),w2,0,.9,0);add(SK.rbox(1.8,.14,1.1,.04,1),w,0,2.26,0);
    return mergeParts(P);}
  // a craggy boulder: an icosahedron whose corners are pushed in and out by the position (so shared corners move
  // together) and shaded flat, facet by facet
  function cragGeo(s,seed){const g=new THREE.IcosahedronGeometry(s,1),p=g.attributes.position;const h=(x,y,z)=>{const v=Math.sin(x*12.9898+y*78.233+z*37.719+seed*.917)*43758.5453;return v-Math.floor(v);};
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1+(h(Math.round(x*100),Math.round(y*100),Math.round(z*100))-.5)*.45;p.setXYZ(i,x*k,y*k*.85,z*k);}g.computeVertexNormals();return g;}
  // a bandit's ridge tent: two canvas slopes over a ridge pole on two uprights, the gables closed, the door flap tied
  // back, guy lines to pegs; the canvas a patched brown by the tent's number
  function campTentGeo(k){const P=[];const cv=new THREE.Color([0x6a5a44,0x5e5240,0x74624a][k%3]),dk=0x3a2a1a,L=3.2,W=2.4,H=1.9;const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:col.isColor?col:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.08:j});
    const sl=Math.atan2(H,W/2),sLen=Math.hypot(W/2,H);for(const s of [1,-1])add(new THREE.BoxGeometry(.04,sLen,L),cv,s*W/4,H/2,0,0,0,s*(Math.PI/2-sl),.1);
    for(const s of [1,-1]){const tri=new THREE.Shape();tri.moveTo(-W/2,0);tri.lineTo(W/2,0);tri.lineTo(0,H);tri.closePath();const g=new THREE.ShapeGeometry(tri);add(g,s>0?cv.clone().multiplyScalar(.9):cv.clone().multiplyScalar(.8),0,0,s*L/2,0,s>0?0:Math.PI,0,.06);}
    add(SK.cyl(.05,.05,L+.3,5),dk,0,H+.02,0,Math.PI/2,0,0);for(const s of [1,-1])add(SK.cyl(.05,.05,H,5),dk,0,H/2,s*(L/2+.05));
    add(new THREE.BoxGeometry(.6,1.3,.04),cv.clone().multiplyScalar(.7),.45,.65,L/2+.08,0,-.6,0,.05);
    for(const s of [1,-1])for(const z of [-L/2+.3,L/2-.3]){const x0=s*W/2,x1=s*(W/2+.9);const gl=SK.cyl(.012,.012,Math.hypot(.9,H*.6),4);const ang=Math.atan2(.9,H*.6);add(gl,0xb09a70,(x0+x1)/2,H*.3,z,0,0,s*ang,0);add(SK.cyl(.025,.02,.25,4),0x5a4028,x1,.08,z);}
    return mergeParts(P);}
  function buildPoi(S,site,r){const k=site.kind;if(k==='glade')buildGlade(S,site,r);else if(k==='shrine')buildShrine(S,site,r);else if(k==='lair')buildLair(S,site,r);else if(k==='tower')buildTower(S,site,r);else if(k==='bcamp')buildBanditCamp(S,site,r);}

  // ═══ PEOPLES AND NATIONS (Session N) ═════════════════════════════════
  // Three islands, three nations, four peoples. A province belongs to the
  // nation of its landmass; inland provinces are one people, ports blend.
  // NPCs take body, name bank, dialect and opinions from their people.
  const NATIONS={
    gatelands:{name:'the Gatelands',formal:'Tír na nGeataí',people:'gatelander',climate:'temperate',style:'irish',cityStyle:'stone',banner:0x8a1a1a,trim:0xd8b040,titles:{city:['Lord','Lady'],town:'Mayor',port:'Harbour Reeve',garrison:'Captain',village:'Elder'},crown:'the Crown'},
    mark:     {name:'the Mark',      formal:'Na Críocha',    people:'markman',   climate:'cold',     style:'mark', cityStyle:'garrison',banner:0x1a1a1e,trim:0x8a8a90,titles:{city:['Captain','Captain'],town:'Reeve',port:'Harbour Reeve',garrison:'Captain',village:'Elder'},crown:'the League'},
    aurenne:  {name:'Aurenne',       formal:'the Compact',   people:'aurennais', climate:'warm',     style:'aurenne',cityStyle:'aurenne',banner:0x1e3a7a,trim:0xe8e8f0,titles:{city:['Prior','Prior'],town:'Factor',port:'Factor',garrison:'Marshal',village:'Elder'},crown:'the Compact'},
  };
  const PEOPLES={
    gatelander:{name:'Gatelander',self:'Tírfolk',names:'irish',skin:[0xe8c8a8,0xf0d0b0,0xe0b898,0xd8b090],hair:[0x2a1a10,0x4a2c14,0x8a3a1a,0xa04a20,0x3a2a1a],height:1.0,width:1.0,
      greet:["Weaver keep you.","You'll have walked a way.","Good day to you, and to yours."],bye:["Mind the road.","Weaver between you and harm."],yes:"I would, aye.",no:"I would not.",oath:"Weaver keep us",honor:"friend",
      of:{markman:["Hill-dogs. Loud, drunk, they'd duel a fencepost.","I'd walk any road with a Markish crew. Those people kill bears at ten."],aurennais:["Ledgers. Won't shake a hand without a witness.","Their ships come back. Ours don't."],oldblood:["Cold-eyes. My grandmother wouldn't let one in the house after dark. Never said why.","They can read the stones. I don't know that I'd want to."]}},
    markman:   {name:'Markman',self:'Markman',names:'anglo',skin:[0xf0dcc8,0xecd4c0,0xf4e0d0,0xe8d0b8],hair:[0xd8c8a0,0xb8a070,0x8a8a80,0xe8dcc0,0x5a4a3a],height:1.08,width:1.1,
      greet:["Aye.","Well? Speak.","You're not from the Mark. Fine."],bye:["Iron and blood.","Go on."],yes:"Aye.",no:"No.",oath:"iron and blood",honor:"",
      of:{gatelander:["Turf-cutters. Slow, sly, a proverb for every debt unpaid.","A Gatelander won't leave a wounded man. I wouldn't say that of a Markman."],aurennais:["Tithe-men. They'd sell you the rope for your hanging and charge for the knot.","Their steel's better than ours and they know it."],oldblood:["Cold-eyes. We don't sit with them. Nobody remembers why and nobody breaks it.","They don't die easy. I've seen it."]}},
    aurennais: {name:'Aurennais',self:'Aurennais',names:'french',skin:[0xc8a078,0xb88860,0xa87850,0xd0a880],hair:[0x1a1210,0x2a1a10,0x3a2818,0x1a1a1a],height:.98,width:.94,
      greet:["Master. Good day.","You have business? Then let us do it properly.","Welcome, on account."],bye:["As agreed.","Good day. Mind the tithe."],yes:"Agreed, and noted.",no:"That was not in the terms.",oath:"",honor:"Master",
      of:{gatelander:["Gate-grubbers. They dig up what should stay buried and call it a living.","Nobody keeps a field or a promise like a Gatelander."],markman:["The unlettered. A nation that settles arithmetic with axes.","Want a thing done by nightfall? Hire a Markman. Pay him after."],oldblood:["The Church says to honour them. The Church says a great deal.","They read what the rest of us only copy."]}},
    oldblood:  {name:'Old Blood',self:'Seanfhuil',names:'oldblood',skin:[0xd8d0cc,0xcfc8c4,0xe0d8d4,0xc8c0bc],hair:[0x0e0c0c,0x141212,0x1a1616],height:.92,width:.92,tattoo:true,
      greet:["You are here.","The stones are warm today.","Sit. You have been walking since before you woke."],bye:["Go gently.","The loom holds."],yes:"It is so.",no:"It is not.",oath:"by the loom",honor:"",
      of:{gatelander:["They dig. They have always dug. We taught them where.","Good people. They give what they are asked and don't ask what for."],markman:["They will not sit with us. That is fair. We would not sit with us.","Honest. Loud, but honest."],aurennais:["They built a church on our name. It is a fine church.","They write everything down. Someone must."]}},
  };
  NAMES.oldblood={m:['Fíachra','Cúán','Éimhín','Lonán','Odhrán','Senán','Dáire','Fáelán','Bécán','Cellach'],f:['Sadb','Étaín','Muirenn','Lasair','Fionnuala','Damhnait','Gormlaith','Bébinn','Caílte','Ercnat']};
  // ── which island is which nation ──
  let _landmass=null;
  function landmassOf(i,j){
    if(!_landmass){_landmass={};let id=0;const land=(i,j)=>i>=0&&j>=0&&i<GRID&&j<GRID&&isLandCell(i,j);
      for(let jj=0;jj<GRID;jj++)for(let ii=0;ii<GRID;ii++){const k=ii+','+jj;if(_landmass[k]!=null||!land(ii,jj))continue;const st=[[ii,jj]];_landmass[k]=id;let sx=0,sz=0,n=0;while(st.length){const [a,b]=st.pop();sx+=a;sz+=b;n++;[[1,0],[-1,0],[0,1],[0,-1]].forEach(([di,dj])=>{const x=a+di,y=b+dj;const kk=x+','+y;if(land(x,y)&&_landmass[kk]==null){_landmass[kk]=id;st.push([x,y]);}});}
        _landmass['c'+id]={i:sx/n,j:sz/n,n};id++;}
      _landmass.count=id;
      // nations by centroid: the home island's mass is the Gatelands; of the rest, west is the Mark, east Aurenne
      const home=_landmass[HOME_I+','+HOME_J];const others=[];for(let k=0;k<id;k++)if(k!==home&&_landmass['c'+k].n>=3)others.push(k);others.sort((a,b)=>_landmass['c'+a].i-_landmass['c'+b].i);
      _landmass.nation={};_landmass.nation[home]='gatelands';others.forEach((k,idx)=>{_landmass.nation[k]=idx===0?'mark':'aurenne';});
      for(let k=0;k<id;k++)if(_landmass.nation[k]==null){const c=_landmass['c'+k];let best='gatelands',bd=1e9;for(const m of [home,...others]){const cm=_landmass['c'+m];const d=Math.hypot(cm.i-c.i,cm.j-c.j);if(d<bd){bd=d;best=_landmass.nation[m];}}_landmass.nation[k]=best;}
      // sea cells (islets) go with the nearest mass
      for(let jj=0;jj<GRID;jj++)for(let ii=0;ii<GRID;ii++){const k=ii+','+jj;if(_landmass[k]!=null)continue;let best=null,bd=1e9;for(let m=0;m<id;m++){const c=_landmass['c'+m];const d=Math.hypot(c.i-ii,c.j-jj);if(d<bd&&c.n>=3){bd=d;best=m;}}_landmass[k]=best;}
    }
    return _landmass[i+','+j];
  }
  function nationOf(i,j){const m=landmassOf(i,j);return NATIONS[_landmass.nation[m]||'gatelands'];}
  function nationKeyOf(i,j){const m=landmassOf(i,j);return _landmass.nation[m]||'gatelands';}
  // the people of a province: inland = the nation's; ports and edge cities blend
  function peopleOfSite(site){
    const [i,j]=cellOf(site.x,site.z);const nat=nationOf(i,j);const r=cellRng((site.id||'').length*131+i*7,j*13,5);
    const blend=site.kind==='port'||site.islet||(site.kind==='city'&&(cellHash(i,j,41)<.4));
    if(!blend)return nat.people;
    const others=Object.keys(PEOPLES).filter(p=>p!==nat.people&&p!=='oldblood');const q=r();
    return q<.55?nat.people:q<.8?others[0]:q<.95?others[1]:'oldblood';
  }
  function peopleOfNpc(site,r){ // per NPC: the site's people, with an Old Blood minority everywhere and a stranger at ports
    const base=peopleOfSite(site);const q=r();
    if(q<.06)return 'oldblood';
    if((site.kind==='port'||site.islet)&&q<.3){const [i,j]=cellOf(site.x,site.z);const nat=nationOf(i,j);const others=Object.keys(PEOPLES).filter(p=>p!==nat.people&&p!=='oldblood');return others[Math.floor(r()*others.length)];}
    return base;
  }
  // the player's people
  function playerPeople(){return worldState.people||'gatelander';}
  // what an NPC says of the player's people, and how they describe the player (the Old Blood can't be pinned)
  function peopleGreeting(def){
    const P=PEOPLES[def.people||'gatelander'];const pp=playerPeople();
    if(pp==='oldblood'){const d=pick(Math.random,["I'd have said dark hair. I'd have said it. Now I'm not sure.","Your eyes were grey a moment ago.","I keep losing your face when I look away. Forgive me.","I never could look straight at you, could I."]);return d;}
    if(pp===def.people)return pick(Math.random,[P.honor?`One of our own, ${P.honor}.`:'One of our own.',"You've the look of home about you."]);
    const line=P.of[pp];return line?pick(Math.random,line):null;
  }
  function nationSubtitle(cell){const nat=nationOf(cell.i,cell.j);return `${nat.name} · ${(CULTURES[cell.reg]||{}).name||cell.reg} · ${cell.climate||nat.climate}`;}

  // ═══ SETTLEMENT STATES (Session O) — the prosperity model ═══════════
  // A town is generated from a seed and a plan; its state is an input.
  // worldState.towns[siteId] = {p, flags:{burned,sacked,abandoned,scaffold,owned,...}, builds:[], t}
  const BASE_P={village:45,town:60,city:75,port:65,garrison:55,outpost:35};
  function TS(site){const T=worldState.towns||(worldState.towns={});const id=typeof site==='string'?site:site.id;if(!T[id]){const kind=typeof site==='string'?'village':site.kind;const h=String(id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,3);T[id]={p:Math.max(10,Math.min(95,(BASE_P[kind]||45)+(h%21)-10)),flags:{},builds:[],t:worldState.gameTimeAbsMinutes||0};}return T[id];}
  function prosperity(site){return TS(site).p;}
  function baseProsperity(site){const h=String(site.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,3);return Math.max(10,Math.min(95,(BASE_P[site.kind]||45)+(h%21)-10));} // S243 — what TS() starts a town at
  function favor(site){const F=worldState.favor||(worldState.favor={});return F[typeof site==='string'?site:site.id]||0;}
  function addFavor(site,n){const F=worldState.favor||(worldState.favor={});const id=typeof site==='string'?site:site.id;F[id]=(F[id]||0)+n;return F[id];}
  function setProsperity(site,p,why){const st=TS(site);const old=st.p;st.p=Math.max(0,Math.min(100,Math.round(p)));if(Math.abs(st.p-old)>=12&&SETTLE.has(site.id||site)){disposeSettlement(site.id||site);} }
  // S272 — the town's own conditions keep their fraction (Michael, #44 B): st.pf carries what a day's flag effects (occupied −.5,
  // owned +.4, burned or sacked −.2) leave under a whole point, so half a point a day is a point in two days. Roads, the lair and
  // the drift home (`round`) are rounded together as before: carried too, they sank every town a third of the way in 120 days.
  function driveProsperity(site,dd,round){const st=TS(site);st.pf=Math.round(((st.pf||0)+dd)*1e6)/1e6;const w=Math.trunc(st.pf);st.pf-=w;
    const n=st.p+w+Math.round(round||0);if(n!==st.p)setProsperity(site,n);if((st.p>=100&&st.pf>0)||(st.p<=0&&st.pf<0))st.pf=0;}
  function flag(site,name,on){const st=TS(site);if(on)st.flags[name]=worldState.gameTimeAbsMinutes||0;else delete st.flags[name];if(SETTLE.has(site.id||site))disposeSettlement(site.id||site);}
  // what the generator reads
  function lotFactor(site,P){const p=P!=null?P:prosperity(site);return .35+.65*(p/100);}                     // 35%–100% of the plan
  function shopsFor(site,list,P){const p=P!=null?P:prosperity(site);const order={forge:0,goods:10,inn:20,apothecary:30,church:35,armoury:45,shipwright:40,guild_f:60,guild_m:60,keep:80,castle:80};return list.filter(t=>p>=(order[t]==null?0:order[t]));}
  function shutteredShare(site){const p=prosperity(site);return p<35?.5:p<50?.25:0;}
  function wallsAllowed(site){return prosperity(site)>=55||TS(site).flags.threatened!=null;}
  function lampsLit(site){return prosperity(site)>=40;}
  function bannersUp(site){return prosperity(site)>=70;}
  function priceMul(site){const p=prosperity(site);return 1.18-p*.0035;} // buy prices: 1.15 at 10 → .83 at 100
  // ═══ S269 — Q7 in the open world: Ashenmoor burns (Michael, issue #32: A) ═══
  // Handing in Q6 ("Smoke. From Ashenmoor.") sets worldState.ashenmoorPending. From then the world's Ashenmoor is the
  // war code's ruin, for good: burnt shells, nobody in the street, no lord; only Edna's cottage and Brother Oswin's
  // oratory stand, with the two of them inside. Coming onto its pad is Q7's first step, as entering the legacy zone was.
  const ASH_SURVIVORS=['Edna','Brother Oswin'];
  function storyRuin(site){return !!site&&(site.id||site)==='ashenmoor'&&!!(worldState.ashenmoorPending||worldState.ashenmoorBurned);}
  function tickAshenmoorStory(){if(!(worldState.ashenmoorPending||worldState.ashenmoorBurned))return;const t=siteAnywhere('ashenmoor');if(!t)return;
    if(TS(t).flags.burned==null)flag(t,'burned',true);
    if(worldState.ashenmoorPending&&!worldState.ashenmoorBurned&&!(typeof isInterior==='function'&&isInterior())&&Math.hypot(px-t.x,pz-t.z)<(t.pad||58)){
      worldState.ashenmoorBurned=true;worldState.ashenmoorPending=false;
      if(typeof addLog==='function')addLog('🔥','Ashenmoor has burned.');
      if(typeof checkQuestProgress==='function')checkQuestProgress('enter_zone',{zone:'overworld'});}
    // S270 — the Faolchú waits on the plaza until killed (killZoneEnemy sets faolchuDefeated, drops the Mark and ticks Q7)
    if(worldState.ashenmoorBurned&&!worldState.faolchuDefeated&&SETTLE.has('ashenmoor')&&typeof faolchuAt==='function'&&!ZONES.world.enemies.some(e=>e.isBoss&&e.bossId==='faolchu')){
      const fx=t.x+4,fz=t.z+2;const e=faolchuAt(sc,fx,fz,worldH(fx,fz));e._site='ashenmoor';ZONES.world.enemies.push(e);
      if(typeof addLog==='function')addLog('🐺','Something is moving in the ruins.');}}
  // ── drivers, ticked once per game-day for loaded towns ──
  let _pDay=-1;
  function tickProsperity(){
    const day=Math.floor((worldState.gameTimeAbsMinutes||0)/1440);if(day===_pDay)return;_pDay=day;
    const cleared=worldState.roadsCleared||{};const camps=worldState.camps||(worldState.camps={});
    const threat={}; // S437 — the camps that are some town's nearest within 700, and those towns: each camp counts once a day, below
    let tithe=0; // S266 — the Compact's tithe (Michael, #37 A): a town Aurenne occupies pays half a point a day more, and its capital gains it
    for(const t of SITES){if(!(t.kind in BASE_P))continue;const st=TS(t);let d=0;
      // roads: cleared roads lift; ambush-ridden ones drain
      const rds=ROAD_DEFS.filter(x=>x.a===t.id||x.b===t.id);rds.forEach(x=>{d+=cleared[x.a+'|'+x.b]||cleared[x.b+'|'+x.a]?1:-.15;});
      // the nearest lair or bandit camp
      let near=null,nd=1e9;for(const o of SITES){if((o.kind==='lair'||o.kind==='bcamp')&&Math.hypot(o.x-t.x,o.z-t.z)<nd){nd=Math.hypot(o.x-t.x,o.z-t.z);near=o;}}
      if(near&&nd<700){const dead=worldState.lairs&&worldState.lairs[near.id];d+=dead?.6:-.6;if(near.kind==='bcamp'&&!dead)(threat[near.id]||(threat[near.id]={camp:near,towns:[]})).towns.push(t);}
      // flags
      let c=0;if(st.flags.burned!=null||st.flags.sacked!=null)c-=.2;if(st.flags.plague!=null)c-=1;if(st.flags.owned!=null)c+=.4;if(st.flags.besieged!=null)c-=2;if(st.flags.occupied!=null)c-=.5;
      // drift home
      const base=BASE_P[t.kind]||45;const drift=(base-st.p)*.01;
      // scaffolds finish
      st.builds.forEach(b=>{if(!b.done&&day>=b.doneDay){b.done=true;st.p+=b.p;showMsg(`${t.name}: the ${b.name} ${b.key==='walls'?'are':'is'} finished.`,'#e8d8a0');if(SETTLE.has(t.id))disposeSettlement(t.id);}});
      if(st.p<=0&&st.flags.abandoned==null){flag(t,'abandoned',true);}
      if(st.flags.abandoned!=null&&st.p>=20)flag(t,'abandoned',false);
      driveProsperity(t,c,d+drift);
      // prosperity is kept in whole points, so the tithe keeps its own account and is paid a point at a time, every second day
      if(st.flags.occupied!=null&&st.occupier==='aurenne'){st.tithe=(st.tithe||0)+.5;tithe+=.5;const w=Math.floor(st.tithe);if(w){st.tithe-=w;setProsperity(t,st.p-w);}}
    }
    // S437 — a camp left alive counts days, one a day however many towns it threatens; at 20 it sacks the nearest of them not
    // already sacked or burned, and starts again (Session 95). It counted once for each town it threatened, so Dunowen Camp,
    // nearest to three home towns, sacked on day 7 and again a week later, and took whichever town the day's loop met first.
    for(const id in threat){const T=threat[id],c=T.camp;camps[id]=Math.min(20,(camps[id]||0)+1);if(camps[id]<20)continue;
      let tg=null,td=1e9;for(const t of T.towns){const f=TS(t).flags;if(f.sacked!=null||f.burned!=null)continue;const d=Math.hypot(t.x-c.x,t.z-c.z);if(d<td){td=d;tg=t;}}
      if(tg){sack(tg,c);camps[id]=0;}}
    if(tithe>0){anchoredPlaces();const cap=FACTIONS.compact.seat?siteAnywhere(FACTIONS.compact.seat):null;
      if(cap&&TS(cap).flags.occupied==null){const cs=TS(cap);cs.tithe=(cs.tithe||0)+tithe;const w=Math.floor(cs.tithe);if(w){cs.tithe-=w;setProsperity(cap,cs.p+w);}}}
    tickRoutesDay();try{tickWorldSystemsDay();}catch(e){console.warn('systems',e);}
  }
  function sack(t,camp){const st=TS(t);flag(t,'sacked',true);st.p=15;const lord=lordFor(t);if(typeof addLog==='function')addLog('🔥',`${t.name} was sacked by the bandits of ${camp.name}.`);showMsg(`Word comes that ${t.name} has been sacked.`,'#ff8060');}
  function markRoadCleared(a,b){(worldState.roadsCleared||(worldState.roadsCleared={}))[a+'|'+b]=worldState.gameTimeAbsMinutes||0;}
  function markLairDead(siteId){(worldState.lairs||(worldState.lairs={}))[siteId]=worldState.gameTimeAbsMinutes||0;}
  // ═══ SETTLEMENT AND WORLD SYSTEMS (Session 129) ══════════════════════
  // Wall tiers by prosperity; the cold peace breaking into a war of
  // sieges and occupations; pirates sacking ports; plague from a
  // backlogged gate; re-founding a ruin; the coach halting at a broken road.
  const dayNow=()=>Math.floor((worldState.gameTimeAbsMinutes||0)/1440);
  function allSites(){anchoredPlaces();const out=[];for(const c of CELLS.values())if(c.type!=='sea')out.push(...c.sites);return out;}
  // ── walls: fence → logs → stone → dressed stone ──
  function wallTierFor(site){const st=TS(site);const p=st.p;const built=st.builds.some(b=>b.key==='walls'&&b.done);
    if(st.flags.threatened!=null||st.flags.besieged!=null||st.flags.occupied!=null)return p>=70?'stone':'logs';
    if(p>=85)return 'dressed';if(p>=65)return 'stone';if(p>=45||built)return 'logs';return 'fence';}
  const WALL_SPEC={fence:{h:1.15,d:.3,wall:0x5a4a30,cap:0x4a3a22,towers:false,crenels:0,capRz:.3},
                   logs:{h:3.2,d:.5,wall:0x5a4222,cap:0x4a3418,towers:'box',crenels:0,capRz:.85},
                   stone:{h:4.6,d:1.3,wall:null,cap:null,towers:'round',crenels:1,capRz:.85},
                   dressed:{h:5.6,d:1.5,wall:0xbfb6a6,cap:0xd6cfc0,towers:'round',crenels:2,capRz:.95}};
  // ── the war ──
  const OPPONENT={crown:'mark',league:'aurenne',compact:'mark'}; // the Crown remembers the last war; the League and the Compact face each other across the strait
  function war(){return worldState.war||null;}
  function nationName(nk){return NATIONS[nk]?NATIONS[nk].name:nk;}
  function borderTowns(nk,vs){const out=[];const cells=[...CELLS.values()].filter(c=>c.type!=='sea'&&nationKeyOf(c.i,c.j)===vs);if(!cells.length)return out;const R=SIZE*2.5;
    for(const t of allSites()){if(!(t.kind in BASE_P)||t.kind==='outpost')continue;const [ci,cj]=cellOf(t.x,t.z);if(nationKeyOf(ci,cj)!==nk)continue;let bd=1e9;for(const c of cells){const d=Math.hypot(t.x-(c.i+.5)*SIZE,t.z-(c.j+.5)*SIZE);if(d<bd)bd=d;}if(bd<R)out.push(t);}
    if(!out.length){const mine=allSites().filter(t=>(t.kind in BASE_P)&&t.kind!=='outpost'&&nationKeyOf(...cellOf(t.x,t.z))===nk);mine.sort((p,q)=>{const dp=Math.min(...cells.map(c=>Math.hypot(p.x-(c.i+.5)*SIZE,p.z-(c.j+.5)*SIZE)));const dq=Math.min(...cells.map(c=>Math.hypot(q.x-(c.i+.5)*SIZE,q.z-(c.j+.5)*SIZE)));return dp-dq;});out.push(...mine.slice(0,4));}
    return out;}
  function startWar(a,b,firstId){if(war())return;worldState.war={a,b,day:dayNow(),resolved:0,broken:0,lost:0,first:firstId||null};
    if(typeof addLog==='function')addLog('⚔',`The cold peace is broken: ${nationName(a)} and ${nationName(b)} are at war.`);showMsg(`Word comes that ${nationName(a)} and ${nationName(b)} are at war.`,'#ff8060');
    if(firstId){const t=siteAnywhere(firstId);if(t)laySiege(t,b);}}
  function laySiege(t,by){const st=TS(t);if(st.flags.besieged!=null||st.flags.occupied!=null)return;flag(t,'besieged',true);st.siegeBy=by;st.siegeDay=dayNow();if(typeof addLog==='function')addLog('⚔',`${nationName(by)} has laid siege to ${t.name}.`);showMsg(`${t.name} is under siege.`,'#ff8060');}
  function breakSiege(t){const st=TS(t);const by=st.siegeBy;flag(t,'besieged',false);delete st.siegeBy;st.p=Math.min(100,st.p+5);addFavor(t,3);const W=war();if(W){W.broken++;W.resolved++;}
    if(typeof addLog==='function')addLog('⚔',`The siege of ${t.name} is broken.`);showMsg(`The siege of ${t.name} is broken.`,'#e8d8a0');if(W&&W.first===t.id)W.first=null;endWarIf();}
  function occupy(t){const st=TS(t);const by=st.siegeBy;flag(t,'besieged',false);flag(t,'occupied',true);st.occupier=by;delete st.siegeBy;st.p=Math.max(10,st.p-10);const W=war();if(W){W.lost++;W.resolved++;}
    if(typeof addLog==='function')addLog('⚔',`${t.name} has fallen to ${nationName(by)}.`);showMsg(`${t.name} has fallen.`,'#ff8060');endWarIf();}
  function liberate(t){const st=TS(t);flag(t,'occupied',false);delete st.occupier;st.p=Math.min(100,st.p+5);addFavor(t,4);if(typeof addLog==='function')addLog('⚔',`${t.name} is free again.`);showMsg(`${t.name} is free.`,'#e8d8a0');}
  function endWarIf(){const W=war();if(!W)return;if(W.resolved>=5){worldState.war=null;(worldState.wars||(worldState.wars=[])).push({a:W.a,b:W.b,day:W.day,ended:dayNow(),broken:W.broken,lost:W.lost});if(typeof addLog==='function')addLog('⚔',`Peace between ${nationName(W.a)} and ${nationName(W.b)}. ${W.broken} sieges broken, ${W.lost} towns lost.`);showMsg('Word comes of a peace.','#e8d8a0');}}
  function warFromFaction(fk){const a=FACTIONS[fk].nation,b=OPPONENT[fk];const seat=FACTIONS[fk].seat?siteAnywhere(FACTIONS[fk].seat):null;let first=null;const bt=borderTowns(a,b);if(seat&&bt.some(t=>t.id===seat.id))first=seat.id;else if(seat&&bt.length)first=bt.slice().sort((p,q)=>Math.hypot(p.x-seat.x,p.z-seat.z)-Math.hypot(q.x-seat.x,q.z-seat.z))[0].id;startWar(a,b,first);}
  function tickWarDay(){const W=war();if(!W)return;const day=dayNow();
    for(const t of allSites()){if(!(t.kind in BASE_P))continue;const st=worldState.towns&&worldState.towns[t.id];if(st&&st.flags.besieged!=null&&day-(st.siegeDay||day)>=12)occupy(t);}
    if(Math.random()<.15){const side=Math.random()<.5?[W.a,W.b]:[W.b,W.a];const cand=borderTowns(side[0],side[1]).filter(t=>{const st=TS(t);return st.flags.besieged==null&&st.flags.occupied==null&&st.flags.abandoned==null;});if(cand.length)laySiege(cand[Math.floor(Math.random()*cand.length)],side[1]);}}
  // soldiers outside the walls, or a garrison on the plaza; kill them all and the town is yours again
  const SIEGES=new Map();
  function soldierName(nk){return nk==='mark'?'Markish Soldier':nk==='aurenne'?'Compact Man-at-arms':"Crown Soldier";}
  function tickSieges(){if(activeZoneId!=='world')return;
    for(const t of SITES){if(!(t.kind in BASE_P))continue;const st=worldState.towns&&worldState.towns[t.id];if(!st)continue;const kind=st.flags.besieged!=null?'siege':st.flags.occupied!=null?'occupied':null;
      const S=SIEGES.get(t.id);const d=Math.hypot(px-t.x,pz-t.z);
      if(!kind||d>420){if(S&&(d>600||!kind)){S.enemies.forEach(e=>{if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const k=ZONES.world.enemies.indexOf(e);if(k>=0)ZONES.world.enemies.splice(k,1);});S.props.forEach(m=>sc.remove(m));SIEGES.delete(t.id);}continue;}
      if(S){if(S.kind!==kind){S.enemies.forEach(e=>{if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const k=ZONES.world.enemies.indexOf(e);if(k>=0)ZONES.world.enemies.splice(k,1);});S.props.forEach(m=>sc.remove(m));SIEGES.delete(t.id);continue;} /* S440 — out of the world's foes too: a camp whose town fell left its soldiers unseen and striking */
        if(S.enemies.length&&S.enemies.every(e=>e.dead)){SIEGES.delete(t.id);S.props.forEach(m=>sc.remove(m));if(kind==='siege')breakSiege(t);else liberate(t);}continue;}
      if(d>300)continue;
      const by=kind==='siege'?st.siegeBy:st.occupier;const n=kind==='siege'?6+Math.floor(level/3):5+Math.floor(level/4);const enemies=[],props=[];
      let cx,cz;if(kind==='siege'){const rd=ROADS.find(r=>r.def.a===t.id||r.def.b===t.id);const q=rd?rd.pts[rd.def.a===t.id?Math.min(rd.pts.length-1,8):Math.max(0,rd.pts.length-9)]:{x:t.x+(t.pad||30)+30,z:t.z};cx=q.x;cz=q.z;}else{cx=t.x+8;cz=t.z+8;}
      for(let k=0;k<n;k++){const a=k/n*Math.PI*2;const ex=cx+Math.cos(a)*(kind==='siege'?7:5),ez=cz+Math.sin(a)*(kind==='siege'?7:5);const e=keyFoe(unlockFoe(buildZoneEnemy(sc,STATIC_SOL,ex,ez,k===0?'Bandit Captain':'Bandit',null)),t.id+':'+kind+':'+k);e.name=k===0?`${soldierName(by).replace(/Soldier|Man-at-arms/,'Captain')}`:soldierName(by);e.displayName=e.name;e.alert=false;e.homeX=cx;e.homeZ=cz;e._siege=t.id;ZONES.world.enemies.push(e);enemies.push(e);}
      if(kind==='siege'){const tentMat=new THREE.MeshLambertMaterial({color:by==='mark'?0x2a2a30:by==='aurenne'?0x2a3a6a:0x6a2a2a,side:THREE.DoubleSide});[[-4,-2],[4,-3],[0,5]].forEach(([ox,oz])=>{const m=new THREE.Mesh(new THREE.ConeGeometry(2,2.4,5,1,true),tentMat);m.position.set(cx+ox,worldH(cx+ox,cz+oz)+1.2,cz+oz);sc.add(m);props.push(m);});
        const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,4,5),new THREE.MeshLambertMaterial({color:0x3a2a1a}));pole.position.set(cx,worldH(cx,cz)+2,cz);sc.add(pole);props.push(pole);const ban=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.8),new THREE.MeshLambertMaterial({color:NATIONS[by]?NATIONS[by].banner:0x444444,side:THREE.DoubleSide}));ban.position.set(cx+.6,worldH(cx,cz)+3.6,cz);sc.add(ban);props.push(ban);
        showMsg(`${nationName(by)}'s camp outside ${t.name}.`,'#ff8060');}
      else showMsg(`${nationName(by)}'s garrison holds ${t.name}.`,'#ff8060');
      SIEGES.set(t.id,{kind,enemies,props});}}
  function warLine(){const W=war();if(!W)return '';return ` ${nationName(W.a)} and ${nationName(W.b)} are at war.`;}
  function warMarkers(push){const W=war();if(!W)return;for(const t of allSites()){if(!(t.kind in BASE_P))continue;const st=worldState.towns&&worldState.towns[t.id];if(!st)continue;if(st.flags.besieged!=null)push(t.x,t.z,RED,`siege — ${t.name}`);else if(st.flags.occupied!=null&&Math.hypot(px-t.x,pz-t.z)<1500)push(t.x,t.z,RED,`occupied — ${t.name}`);}}
  // ── ports: black sails come for the unprotected ──
  function portProtected(t){const st=TS(t);return st.builds.some(b=>(b.key==='harbour'||b.key==='walls')&&b.done)||wallTierFor(t)==='stone'||wallTierFor(t)==='dressed';}
  function tickPortsDay(){const S=story();const W=war();const risk=(W&&(W.a==='mark'||W.b==='mark'))?.05:S.act>=2?.025:0;if(!risk)return;
    for(const t of allSites()){if(t.kind!=='port')continue;const st=TS(t);if(st.flags.sacked!=null||st.flags.burned!=null||st.flags.abandoned!=null||portProtected(t))continue;if(Math.random()<risk){flag(t,'sacked',true);st.p=Math.max(10,st.p-25);if(typeof addLog==='function')addLog('🏴',`${t.name} was sacked from the sea by black sails.`);showMsg(`Word comes that black sails have sacked ${t.name}.`,'#ff8060');}}}
  // ── plague: a gate left uncleared too long ──
  function tickPlagueDay(){const L=worldState.lairDays||(worldState.lairDays={});const day=dayNow();
    for(const t of SITES){if(!(t.kind in BASE_P))continue;const st=TS(t);
      let near=null,nd=1e9;for(const o of SITES){if(o.kind==='lair'&&Math.hypot(o.x-t.x,o.z-t.z)<nd){nd=Math.hypot(o.x-t.x,o.z-t.z);near=o;}}
      const dead=near&&worldState.lairs&&worldState.lairs[near.id];
      if(st.flags.plague!=null){if(dead||day-st.flags.plague/1440>=20||st.plagueGone){flag(t,'plague',false);delete st.plagueGone;if(typeof addLog==='function')addLog('🕯',`The sickness at ${t.name} has passed.`);}continue;}
      if(near&&nd<700&&!dead){L[t.id]=(L[t.id]||0)+1;if(L[t.id]>=30&&Math.random()<.08){flag(t,'plague',true);L[t.id]=0;st.plagueFrom=near.name;if(typeof addLog==='function')addLog('🕯',`A sickness at ${t.name}. They say it came up out of ${near.name}.`);showMsg(`Word comes of a sickness at ${t.name}.`,'#ff8060');}}else L[t.id]=0;}}
  // ── a ruin re-founded ──
  function refoundTopics(site){const out=[];if(favor(site)<3)return out;for(const t of SITES){if(!(t.kind in BASE_P)||t.id===site.id)continue;const st=worldState.towns&&worldState.towns[t.id];if(!st||st.flags.abandoned==null)continue;if(Math.hypot(t.x-site.x,t.z-site.z)>1500)continue;const cost=900;
    out.push({label:`Send settlers to re-found ${t.name} (${cost} gold)`,quest:true,fn:()=>{if(gold<cost)return `Settlers, seed grain, a year's bread: ${cost} gold to re-found ${t.name}.`;gold-=cost;updateHUD();flag(t,'abandoned',false);const ts=TS(t);ts.p=25;ts.flags={};flag(t,'owned',true);addFavor(t,3);if(typeof addLog==='function')addLog('🏘',`${t.name} re-founded under your name.`);return `Then ${t.name} lives again, and it's yours. Twenty families go out in the morning. Keep the roads clean and they'll stay.`;}});}
    return out;}
  // ── what changes with the day ──
  function tickWorldSystemsDay(){try{tickWarDay();}catch(e){console.warn('war',e);}try{tickPortsDay();}catch(e){}try{tickPlagueDay();}catch(e){}try{tickCrimeDay();}catch(e){}
    // sacked and burned towns rebuild in a month
    const day=dayNow();for(const t of SITES){if(!(t.kind in BASE_P))continue;const st=worldState.towns&&worldState.towns[t.id];if(!st)continue;for(const f of ['sacked','burned']){if(f==='burned'&&storyRuin(t))continue;if(st.flags[f]!=null&&day-st.flags[f]/1440>=30&&st.p>=30)flag(t,f,false);}}}
  function roadBroken(a,b){const R=routes();const rt=R[routeKey(a.id,b.id)];if(rt&&rt.broken)return true;const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;return !!SITES.find(t=>t.kind==='bcamp'&&Math.hypot(t.x-mx,t.z-mz)<500&&!(worldState.lairs&&worldState.lairs[t.id]));}
  // ── investment and the deed ──
  const BUILDS=[{key:'well',name:'well',cost:120,p:6,min:0},{key:'inn',name:'inn',cost:400,p:10,min:30},{key:'chapel',name:'chapel',cost:500,p:8,min:35},{key:'walls',name:'walls',cost:900,p:8,min:45},{key:'guild',name:'guild hall',cost:1200,p:10,min:55},{key:'harbour',name:'harbour',cost:1500,p:12,min:50,port:true}];
  const aBuild=b=>b.key==='walls'?b.name:(/^[aeiou]/.test(b.name)?'an ':'a ')+b.name; // S349 — *an inn*, *walls*, not *a inn*, *a walls*
  // S352 — Michael’s A on #65: a lord offers only what the town lacks. What stands is read off the live town's houses
  // (the plan's list at today's prosperity when it isn't loaded): no inn where an inn stands, no chapel where a church
  // does, no guild hall where either guild's hall does, no walls where the ring is logs or better. The well and the harbour as before.
  function buildStands(site){const out=new Set();const S=SETTLE.get(site.id);let types;
    if(S&&S.houses)types=S.houses.map(h=>h.type);
    else{const plan=KIND_PLAN[site.kind]||KIND_PLAN.village;types=shopsFor(site,[...plan.shops,...((site.kind==='town'||site.kind==='city')?['guild_f','guild_m']:[])]);}
    if(types.includes('inn'))out.add('inn');if(types.includes('church'))out.add('chapel');if(types.includes('guild_f')||types.includes('guild_m'))out.add('guild');
    const plan=KIND_PLAN[site.kind]||KIND_PLAN.village;if(plan.walls&&wallTierFor(site)!=='fence')out.add('walls');
    return out;}
  function investTopics(site){
    const st=TS(site);const _tw=tutWaivesInvest(site);if((prosperity(site)<40||favor(site)<3)&&!_tw)return [];
    const out=[];const have=new Set(st.builds.map(b=>b.key));const stands=buildStands(site);
    for(const b of BUILDS){if(have.has(b.key)||stands.has(b.key)||(prosperity(site)<b.min&&!(_tw&&b.key==='well'))||(b.port&&site.kind!=='port'))continue;const cost=Math.round(b.cost*(1+prosperity(site)/200));
      out.push({label:`Pay for ${aBuild(b)} (${cost} gold)`,quest:true,fn:()=>{if(gold<cost)return `${aBuild(b).replace(/^./,c=>c.toUpperCase())} would cost the town ${cost} gold.`;gold-=cost;updateHUD();st.builds.push({key:b.key,name:b.name,p:b.p,doneDay:Math.floor((worldState.gameTimeAbsMinutes||0)/1440)+3,done:false});addFavor(site,1);if(SETTLE.has(site.id))disposeSettlement(site.id);if(typeof addLog==='function')addLog('🏗',`Paid for ${aBuild(b)} at ${site.name}.`);return `The masons start tomorrow. Three days, and it's yours as much as ours.`;}});}
    out.push(...refoundTopics(site));
    if(st.builds.filter(b=>b.done).length>=3&&favor(site)>=5&&st.flags.owned==null)out.push({label:`Take the deed to ${site.name}`,quest:true,fn:()=>{flag(site,'owned',true);addFavor(site,2);if(typeof addLog==='function')addLog('📜',`${site.name} is yours.`);return `Then it's yours. The rents come to you on the first of the week. Don't let it burn.`;}});
    return out;
  }
  // ═══ TRADE ROUTES (Session R) ════════════════════════════════════════
  // worldState.routes[a|b] = {a,b,opened,broken}. A caravan walks the road
  // between the two towns; both ends gain prosperity per day while it runs.
  // An ambush on the road, or a camp left alive within reach, breaks it.
  const CARAVANS=new Map(); // routeKey → {npc,mule,cart,road,t,dir}
  function routeKey(a,b){return a<b?a+'|'+b:b+'|'+a;}
  function routes(){return worldState.routes||(worldState.routes={});}
  function routeTopics(site){
    if((prosperity(site)<30||favor(site)<1)&&!tutWaivesRoute(site))return [];
    const out=[];const R=routes();
    ROAD_DEFS.filter(d=>d.a===site.id||d.b===site.id).forEach(d=>{const other=siteAnywhere(d.a===site.id?d.b:d.a);if(!other||!(other.kind in BASE_P))return;const key=routeKey(site.id,other.id);const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);const len=rd?rd.pts.reduce((acc,p,i)=>i?acc+Math.hypot(p.x-rd.pts[i-1].x,p.z-rd.pts[i-1].z):0,0):Math.hypot(other.x-site.x,other.z-site.z);
      if(R[key]&&!R[key].broken)return;const cost=Math.round(120+len/6);
      out.push({label:R[key]&&R[key].broken?`Reopen the route to ${other.name} (${cost} gold)`:`Open a trade route to ${other.name} (${cost} gold)`,quest:true,fn:()=>{if(gold<cost)return `A caravan to ${other.name} is ${cost} gold to fit out.`;gold-=cost;updateHUD();R[key]={a:site.id,b:other.id,opened:worldState.gameTimeAbsMinutes||0,broken:false};addFavor(site,1);addFavor(other,1);if(typeof addLog==='function')addLog('🐴',`Opened a trade route: ${site.name} — ${other.name}.`);return `Then it's done. A cart leaves in the morning, and one comes back. ${other.name}'s ${lordFor(other).title} will hear of it.`;}});});
    return out;
  }
  function tickRoutesDay(){const R=routes();for(const key in R){const rt=R[key];if(rt.broken)continue;const a=siteAnywhere(rt.a),b=siteAnywhere(rt.b);if(!a||!b)continue;
      // a camp alive within 500u of the road midpoint breaks it
      const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;const camp=SITES.find(t=>t.kind==='bcamp'&&Math.hypot(t.x-mx,t.z-mz)<500&&!(worldState.lairs&&worldState.lairs[t.id]));
      // a threat from yesterday that was never met (asleep, indoors, away when its hour came) breaks the route now
      if(rt.threat&&!rt.threat.won){breakRoute(key,rt,rt.threat.camp);continue;}
      delete rt.threat;
      // the camp picks an hour on the outbound leg, u .35–.65 of the road; tickCaravans springs it (Session 179)
      if(camp)rt.threat={day:Math.floor((worldState.gameTimeAbsMinutes||0)/1440),camp:camp.name,f:.175+Math.random()*.15,won:false,started:false};
      setProsperity(a,prosperity(a)+.8);setProsperity(b,prosperity(b)+.8);}
    const Cs=coaches();for(const key in Cs){const a=siteAnywhere(Cs[key].a),b=siteAnywhere(Cs[key].b);if(a&&b){setProsperity(a,prosperity(a)+1);setProsperity(b,prosperity(b)+1);}}}
  function caravanDef(a,b){const [i,j]=cellOf(a.x,a.z);const nat=nationOf(i,j);return makeDef(a,a.reg||'irish',Math.random,'Merchant',pick(Math.random,(NAMES[PEOPLES[nat.people].names]||NAMES.irish).m),{people:nat.people,x:a.x,z:a.z,bCol:0x6a4a2a,sCol:0xd4a878,topics:[{label:'What are you carrying?',response:`${a.name} wool and ${b.name} iron, this week. Next week the other way round. The road's kinder than it was.`},{label:'Anything for sale?',trade:true,goods:[{name:'Travel Ration',ico:'🍞',type:'potion',heal:12,buyPrice:6,sellMult:.4},{name:'Lamp Oil',ico:'🪔',type:'misc',buyPrice:9,sellMult:.5},{name:'Bolt of Cloth',ico:'🧵',type:'misc',buyPrice:22,sellMult:.6}]}]});}
  // The ambush (Session 179, Michael's answer B on issue #18). A camp near the road sets a threat for the day
  // (tickRoutesDay). At its hour, if you are within CARAVAN_WATCH of the caravan, three or four of the camp's
  // bandits fall on it: the cart goes over, the merchant runs. Kill them all and the route holds that day; go
  // CARAVAN_LEAVE away with them alive, or be elsewhere at the hour, and it breaks as before. The overturned cart
  // stays on the road (rt.wreck) until the route is reopened.
  const CARAVAN_WATCH=150,CARAVAN_LEAVE=250;const WRECKS=new Map();
  function roadAt(pts,u){u=Math.max(0,Math.min(1,u));const fi=u*(pts.length-1);const i0=Math.min(pts.length-2,Math.floor(fi)),f=fi-i0;const p0=pts[i0],p1=pts[i0+1];return {x:p0.x+(p1.x-p0.x)*f,z:p0.z+(p1.z-p0.z)*f,ang:Math.atan2(p1.x-p0.x,p1.z-p0.z)};}
  function cartMesh(){const c=x=>new THREE.Color(x);return new THREE.Mesh(mergeParts([{geo:new THREE.BoxGeometry(1.6,.5,1.0),color:c(0x6a4a2a),y:.6},{geo:new THREE.CylinderGeometry(.42,.42,.12,10),color:c(0x3a2a1a),x:0,y:.42,z:.6,rx:Math.PI/2},{geo:new THREE.CylinderGeometry(.42,.42,.12,10),color:c(0x3a2a1a),x:0,y:.42,z:-.6,rx:Math.PI/2},{geo:new THREE.BoxGeometry(.9,.5,.7),color:c(0x9a8a6a),y:1.1},{geo:new THREE.BoxGeometry(.08,.08,1.8),color:c(0x4a3018),y:.5,z:1.3}]),VC_MAT);}
  function overturn(m,x,z,ang){m.position.set(x,worldH(x,z)+.5,z);m.rotation.set(0,ang,0);m.rotateZ(Math.PI*.5);}
  function breakRoute(key,rt,campName){const a=siteAnywhere(rt.a),b=siteAnywhere(rt.b);rt.broken=true;rt.by=campName;
    if(!rt.wreck){const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);if(rd){const u=rt.threat?Math.min(1,rt.threat.f*2):.5;const p=roadAt(rd.pts,u);rt.wreck={x:p.x,z:p.z,ang:p.ang};}}
    delete rt.threat;const C=CARAVANS.get(key);if(C&&C.attack)C.attack.enemies.forEach(e=>{e._caravan=null;});removeCaravan(key);
    if(a&&b){showMsg(`The ${a.name}–${b.name} caravan was taken by the bandits of ${campName}.`,'#ff8060');if(typeof addLog==='function')addLog('🐴',`Trade route ${a.name}–${b.name} broken by ${campName}.`);}}
  function springAmbush(key,rt,C,a,b){const cx=C.npc.g.position.x,cz=C.npc.g.position.z,ang=C.npc.g.rotation.y;const day=lootDay(),n=3+(seededRng('ambush',key+':'+day)()<.5?1:0);const enemies=[]; /* S479 — the band's size and its foes keyed by the route and the day */
    for(let k=0;k<n;k++){const t=(k/n)*Math.PI*2+ang;const ex=cx+Math.sin(t)*6,ez=cz+Math.cos(t)*6;const e=keyFoe(unlockFoe(buildZoneEnemy(sc,STATIC_SOL,ex,ez,k===0&&level>=5?'Bandit Captain':'Bandit',null)),'caravan:'+key+':'+day+':'+k);e.alert=true;e.homeX=cx;e.homeZ=cz;e._caravan=key;ZONES.world.enemies.push(e);enemies.push(e);}
    rt.threat.started=true;C.attack={enemies,x:cx,z:cz,ang,fled:0};overturn(C.cart,C.cart.position.x,C.cart.position.z,ang);
    showMsg(`Bandits of ${rt.threat.camp} fall on the ${a.name}–${b.name} caravan!`,'#ff8060');}
  function tickCaravans(dt){
    const R=routes();const dayNowF=((worldState.gameTimeAbsMinutes||0)%1440)/1440,today=Math.floor((worldState.gameTimeAbsMinutes||0)/1440);
    for(const key in R){const rt=R[key];const a=siteAnywhere(rt.a),b=siteAnywhere(rt.b);if(!a||!b)continue;
      const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);const near=Math.hypot(px-(a.x+b.x)/2,pz-(a.z+b.z)/2)<Math.hypot(a.x-b.x,a.z-b.z)/2+400;
      // the overturned cart of a broken route
      let W=WRECKS.get(key);if(rt.broken&&rt.wreck&&near){if(!W){W=cartMesh();sc.add(W);WRECKS.set(key,W);}overturn(W,rt.wreck.x,rt.wreck.z,rt.wreck.ang);}else if(W){sc.remove(W);WRECKS.delete(key);}
      let C=CARAVANS.get(key);
      // the threat's hour: spring it if you are by the caravan, else the route breaks unseen
      const T=rt.threat;if(!rt.broken&&T&&!T.won&&!T.started&&T.day===today&&dayNowF>=T.f){
        if(C&&Math.hypot(px-C.npc.g.position.x,pz-C.npc.g.position.z)<CARAVAN_WATCH)springAmbush(key,rt,C,a,b);else{breakRoute(key,rt,T.camp);continue;}}
      if(!rt.broken&&T&&T.started&&!T.won){const A=C&&C.attack;
        if(!A){breakRoute(key,rt,T.camp);continue;}
        if(A.enemies.every(e=>e.dead)){T.won=true;A.enemies.forEach(e=>{e._caravan=null;});C.lagF=Math.max(0,dayNowF<.5?dayNowF-T.f:0);delete C.attack;C.cart.rotation.set(0,0,0);
          showMsg(`The bandits are dead. The ${a.name}–${b.name} caravan rights its cart and goes on.`,'#e8d8a0');if(typeof addLog==='function')addLog('🐴',`Drove the bandits of ${T.camp} off the ${a.name}–${b.name} caravan.`);addFavor(a,1);addFavor(b,1);}
        else if(Math.hypot(px-A.x,pz-A.z)>CARAVAN_LEAVE||activeZoneId!=='world'){breakRoute(key,rt,T.camp);continue;}}
      if(rt.broken||!rd||!near){if(C){removeCaravan(key);}continue;}
      if(!C){const def=caravanDef(a,b);const n=spawnNPC(def,0,true);n.sched={type:'lost'};
        const c=x=>new THREE.Color(x);const cart=new THREE.Mesh(mergeParts([{geo:new THREE.BoxGeometry(1.6,.5,1.0),color:c(0x6a4a2a),y:.6},{geo:new THREE.CylinderGeometry(.42,.42,.12,10),color:c(0x3a2a1a),x:0,y:.42,z:.6,rx:Math.PI/2},{geo:new THREE.CylinderGeometry(.42,.42,.12,10),color:c(0x3a2a1a),x:0,y:.42,z:-.6,rx:Math.PI/2},{geo:new THREE.BoxGeometry(.9,.5,.7),color:c(0x9a8a6a),y:1.1},{geo:new THREE.BoxGeometry(.08,.08,1.8),color:c(0x4a3018),y:.5,z:1.3}]),VC_MAT);sc.add(cart);
        const mule=new THREE.Mesh(mergeParts([{geo:new THREE.BoxGeometry(.5,.55,1.1),color:c(0x5a4a3a),y:.75},{geo:new THREE.BoxGeometry(.3,.35,.5),color:c(0x5a4a3a),y:1.05,z:.7},{geo:new THREE.BoxGeometry(.12,.7,.12),color:c(0x4a3a2a),x:.18,y:.35,z:.4},{geo:new THREE.BoxGeometry(.12,.7,.12),color:c(0x4a3a2a),x:-.18,y:.35,z:.4},{geo:new THREE.BoxGeometry(.12,.7,.12),color:c(0x4a3a2a),x:.18,y:.35,z:-.4},{geo:new THREE.BoxGeometry(.12,.7,.12),color:c(0x4a3a2a),x:-.18,y:.35,z:-.4},{geo:new THREE.BoxGeometry(.6,.3,.5),color:c(0x8a6a3a),y:1.1}]),VC_MAT);sc.add(mule);
        C={npc:n,cart,mule,road:rd,t:((worldState.gameTimeAbsMinutes||0)%1440)/1440,dir:1,lagF:0};CARAVANS.set(key,C);}
      // under attack: the cart lies where it went over, the mule stands, the merchant runs back along the road
      if(C.attack){const A=C.attack;if(A.fled<30){const s=Math.min(30-A.fled,4.5*dt);A.fled+=s;const x=C.npc.g.position.x-Math.sin(A.ang)*s,z=C.npc.g.position.z-Math.cos(A.ang)*s;C.npc.g.position.set(x,worldH(x,z),z);C.npc.g.rotation.y=A.ang+Math.PI;C.npc.def.x=x;C.npc.def.z=z;C.npc.home={x,z};}continue;}
      // after a fight the caravan runs late, and makes the time up a quarter faster until it is back on its hour
      if(C.lagF>0)C.lagF=Math.max(0,C.lagF-dt/1440*.25);
      // one leg per game-day: the fraction of the day is the position along the road, out and back
      const dayF=Math.max(0,((worldState.gameTimeAbsMinutes||0)%1440)/1440-(C.lagF||0));const u=dayF<.5?dayF*2:2-dayF*2;const pts=C.road.pts;const fi=u*(pts.length-1);const i0=Math.min(pts.length-2,Math.floor(fi)),f=fi-i0;const p0=pts[i0],p1=pts[i0+1];const x=p0.x+(p1.x-p0.x)*f,z=p0.z+(p1.z-p0.z)*f;const fwd=dayF<.5?1:-1;const ang=Math.atan2((p1.x-p0.x)*fwd,(p1.z-p0.z)*fwd);
      C.npc.g.position.set(x,worldH(x,z),z);C.npc.g.rotation.y=ang;C.npc.def.x=x;C.npc.def.z=z;C.npc.home={x,z};
      C.mule.position.set(x-Math.sin(ang)*1.4,worldH(x,z),z-Math.cos(ang)*1.4);C.mule.rotation.y=ang;
      C.cart.position.set(x-Math.sin(ang)*3.0,worldH(x,z),z-Math.cos(ang)*3.0);C.cart.rotation.y=ang;
    }
  }
  function removeCaravan(key){const C=CARAVANS.get(key);if(!C)return;sc.remove(C.cart);sc.remove(C.mule);sc.remove(C.npc.g);sc.remove(C.npc.dot);const k=npcs.indexOf(C.npc);if(k>=0)npcs.splice(k,1);CARAVANS.delete(key);}
  // ═══ FACTIONS AND ANCHORED PLACES (Session S) ════════════════════════
  // Three nations you can rise in; past the second rank the other two close.
  // The story's named places are picked from the generated world once, by constraint.
  const FACTIONS={crown:{name:'the Crown',seat:'coeur_de_vie',nation:'gatelands',ranks:['Commissioner','Warden of Roads','Knight of the Gates'],house:'a keep'},
                  league:{name:"the Captains' League",seat:null,nation:'mark',ranks:['Sworn','Reeve','Captain'],house:'a garrison'},
                  compact:{name:'the Compact',seat:null,nation:'aurenne',ranks:['Clerk','Factor','Prior'],house:'a house and a ship'}};
  function fstate(){const F=worldState.factions||(worldState.factions={});for(const k in FACTIONS)if(!F[k])F[k]={done:0,rank:0,active:null,closed:false};return F;}
  function factionRank(k){return fstate()[k].rank;}
  function factionOf(nationKey){return nationKey==='gatelands'?'crown':nationKey==='mark'?'league':'compact';}
  let _anch=null;
  function anchoredPlaces(){
    if(_anch)return _anch;landmassOf(0,0);for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++)getCell(i,j);_anch={};
    const cellsOf=(nk)=>[...CELLS.values()].filter(c=>c.type!=='sea'&&nationKeyOf(c.i,c.j)===nk);
    const sitesOf=(nk,kinds)=>cellsOf(nk).flatMap(c=>c.sites.filter(t=>kinds.includes(t.kind)));
    // the strait: the sea column between the Mark and Aurenne — approximate by the Mark's easternmost coast
    const mark=cellsOf('mark');const markE=Math.max(...mark.map(c=>c.i));
    const pickNear=(list,fx,fz)=>list.slice().sort((a,b)=>Math.hypot(a.x-fx,a.z-fz)-Math.hypot(b.x-fx,b.z-fz))[0]||null;
    const straitX=(markE+1)*SIZE,straitZ=(mark.reduce((a,c)=>a+c.j,0)/Math.max(1,mark.length)+.5)*SIZE;
    // Caer Slige: a Mark garrison nearest the strait (or the nearest town, promoted)
    let cs=pickNear(sitesOf('mark',['garrison']),straitX,straitZ)||pickNear(sitesOf('mark',['town']),straitX,straitZ);if(cs){cs.name='Caer Slige';cs.anchor='caer_slige';FACTIONS.league.seat=cs.id;}
    // its spire
    const sp=cs?pickNear(sitesOf('mark',['tower']),cs.x,cs.z):null;if(sp){sp.name='The Spire of Caer Slige';sp.anchor='spire';}
    // Port Blackhand: a Mark port nearest the strait
    const pb=pickNear(sitesOf('mark',['port']),straitX,straitZ);if(pb){pb.name='Port Blackhand';pb.anchor='blackhand';}
    // the Compact's seat: Aurenne's capital; the Salt Mouth: an Aurennais lair nearest the coast facing the strait
    const cap=sitesOf('aurenne',['city'])[0];if(cap){FACTIONS.compact.seat=cap.id;}
    const sm=pickNear(sitesOf('aurenne',['lair']),straitX,straitZ);if(sm){sm.name='The Salt Mouth';sm.anchor='salt_mouth';sm.dragon=true;const cl=CELLS.get(key(...cellOf(sm.x,sm.z)));if(cl){const d=cl.doors.find(x=>x.lairDoor&&x.lairSite===sm.id);if(d){d.lair.dragon=true;d.lair.place='The Salt Mouth';d.size='large';d.diff='veryhard';d.canonicalName='The Salt Mouth — the cavern';}}}
    // the Root: an islet lair in a sea cell farthest east
    let root=null,rx=-1;for(const c of CELLS.values()){if(c.type!=='sea')continue;c.sites.forEach(t=>{if(t.kind==='lair'&&t.x>rx){rx=t.x;root=t;}});}
    if(root){root.name='The Root';root.anchor='root';const cell=CELLS.get(key(...cellOf(root.x,root.z)));if(cell){cell.doors=cell.doors.filter(d=>!(d.lairDoor&&d.lairSite===root.id));if(!cell.doors.some(d=>d.root))cell.doors.push({zone:'gen',x:root.x,z:root.z-6,seed:9001,size:'large',theme:'deep',diff:'veryhard',kind:'cave_door',cell:cell.i+','+cell.j,sigil:true,root:true,canonicalName:'The Root',lair:{place:'The Root',boss:'Ogre',dragon:false}});}}
    _anch={caer_slige:cs,spire:sp,blackhand:pb,salt_mouth:sm,root,compact_seat:cap};return _anch;
  }
  // faction quests ride the town-quest generator, flavoured and counted
  function factionTopics(site){
    const nk=nationKeyOf(...cellOf(site.x,site.z));const fk=factionOf(nk);const F=FACTIONS[fk];if(F.seat!==site.id)return [];
    const rec=nationRecord(nk);if(rec)return [{label:`Serve ${F.name}?`,response:`Not while ${rec.name} has a fine on you. ${F.name.replace(/^the /,'The ')} does not take on a debtor's quarrels. Settle it.`}]; // S158
    const st=fstate()[fk];const _duel=st.active&&st.active.kind==='duel'?st.active:null;
    if(st.closed&&!(_duel&&_duel.data.state==='murder'))return [{label:`Serve ${F.name}?`,response:"Not you. We've a long memory for the yard, and a short one for excuses."}]; // S373 — Rowe killed after she yielded
    const others=Object.keys(FACTIONS).filter(k=>k!==fk).filter(k=>fstate()[k].rank>=2);
    if(others.length)return [{label:`Serve ${F.name}?`,response:`${FACTIONS[others[0]].name} has your oath. We don't share.`}];
    const out=[];
    out.push({label:`Serve ${F.name}.`,quest:true,fn:()=>{const A=st.active;if(A&&A.kind==='duel'){const D=A.data; // S373 — the yard's two other endings
        if(D.state==='murder'){A.turnedIn=true;A.paid=0;st.active=null;st.closed=true;if(typeof addLog==='function')addLog('🏛',"The Captains' League has closed its gates to you.");return FLINES[fk][A.service].afterMurder;}
        if(D.state==='lost'&&!D.told){D.told=true;return "Rowe's Captain. The chair's hers till someone takes it off her on the yard, and that's your right now, same as it was hers. Give your arm a week. The ring goes up again in seven days.";}
        if(D.state==='lost'&&dayNow()<(D.retryDay||0))return "Not yet. A week, I said. Rowe's not going anywhere, and neither's the chair.";}
      if(st.active&&!st.active.done)return `You still owe us: ${st.active.objective}.`;if(st.active&&st.active.done){const _fi=st.active.service;qTurnIn(st.active);st.done++;const before=st.rank;st.rank=Math.min(3,Math.floor(st.done/3));st.active=null;const _aft=_fi!=null?factionAfter(fk,_fi):'';if(st.rank>before){if(typeof addLog==='function')addLog('🏛',`${F.name}: named ${F.ranks[st.rank-1]}.`);if(st.rank===3)try{warFromFaction(fk);}catch(e){console.warn('war',e);}return `${F.name.replace(/^the /,'The ')} names you ${F.ranks[st.rank-1]}.${_aft}${st.rank!==3?'':fk==='compact'?(_aft?'':' A house and a ship are entered in your name, Prior; claim them when you please.'):fk==='crown'?" There's a keep goes with it. A roof's only a roof till someone sleeps under it, so come and claim it when you will.":` There's ${F.house} in it, when you want it.`}`;}return `Good. ${F.name} keeps count.${_aft}`;}
      const q=factionQuestFor(site,fk,st);if(!qFind(q.id))qAdd(q);st.active=q;return q.desc+` (${q.reward} gold, and ${F.name}'s regard.)`;}});
    out.push({label:`My standing with ${F.name}?`,get response(){return st.rank?`${F.ranks[st.rank-1]}. ${st.done} services.`:`None yet. ${st.done} services.`;}});
    if(st.rank>=3&&!st.house){out.push({label:`Claim ${F.house}.`,quest:true,fn:()=>{st.house=true;const h=(fk==='crown'?ZONES.world.houses.find(x=>x.type==='castle'):ZONES.world.houses.find(x=>x.type==='home'&&x.siteId===site.id));if(h){(worldState.owned||(worldState.owned={}))[h.id]={name:h.name,site:site.id};h.ownedByPlayer=true;h.name=fk==='crown'?'Your Keep':'Your House';}const g=fk==='compact'?grantShip(site):null;if(typeof addLog==='function')addLog('🏛',`${F.name} granted you ${F.house}.`);return fk==='compact'?compactClaimLine(g,site):"It's yours.";}});}
    return out;
  }
  // perks: shops of your faction's nation discount by rank; ferries free at rank 2
  // ═══ FACTION LINES (Session 128) ════════════════════════════════════
  // Nine authored services per faction (three per rank), the ninth a set
  // piece, and one rival across all three: Hesket Rowe, a Markish
  // mercenary who is always one service ahead of you until she isn't.
  // Services ride the town-quest generator for their mechanics (the
  // generator picks the target and the direction) and take authored words.
  const RIVAL={name:'Hesket Rowe',npc:null,key:''};
  const FLINES={
    crown:[
      {kind:'cull',title:"The King's Wolves",brief:"The Crown licenses the gates and taxes the salvage; it also feeds the countryside that feeds the city."},
      {kind:'road',title:'The South Road',brief:"Hesket Rowe took the north road last week and had it clean in a day. You have the south.",rival:'mention'},
      {kind:'deliver',title:'Under Seal',brief:"This goes under the Crown's seal. If it's opened before it's read, I'll know by the wax."},
      {kind:'retrieve',title:'The Old Survey',brief:"The survey teams map the gates for the Crown. One of their books was taken.",rival:'present',item:'the old survey'},
      {kind:'cull',title:"The Warden's Tally",brief:"A Warden keeps the roads. A road with wolves on it isn't kept."},
      {kind:'find',title:'Where Is Warden Rowe?',brief:"Rowe rode out {dir} three days ago on Crown business and hasn't sent word, and a Warden who sends no word is a letter you'd rather not open. There's a camp out that way. Bring her back to us.",rival:'trouble'},
      {kind:'deliver',title:'Word to the Lords',brief:"Every lord on this island is to know the Crown's survey teams are not to be hindered. Say it plainly."},
      {kind:'road',title:'The Last Camp',brief:"There's one camp left on the royal roads. A Knight of the Gates clears it in person."},
      {kind:'retrieve',title:'The Silent Survey',brief:"A survey team went into a gate under the Crown's writ and has stopped answering. Bring back their marker so we know what they found.",set:true,item:"the survey team's marker",after:"They were etching, Knight. Not clearing — etching. The orders came under Aldwyn's seal, and Aldwyn swears he never sent them. Keep that under your helm."}
    ],
    league:[
      {kind:'cull',title:'Meat for the Garrison',brief:"Caer Slige eats what the hills give it. The hills are giving it wolves."},
      {kind:'road',title:'The Hill Road',brief:"Rowe cleared the coast road for us. Sworn a week and already a name. The hill road's yours.",rival:'mention'},
      {kind:'deliver',title:"A Reeve's Letter",brief:"The free towns don't take orders. They take letters, if the hand that brings them looks like it could hold a sword."},
      {kind:'retrieve',title:"The Reeve's Seal",brief:"A seal was taken off a dead reeve. Whoever has it can sign the Mark's name.",rival:'present',item:"the reeve's seal"},
      {kind:'cull',title:'The Watch on the Spire',brief:"Something's been coming down off the spire at night. Kill what you find below it."},
      {kind:'find',title:'Where Is Rowe?',brief:"Rowe took the hill road {dir}, alone. Reeves don't go alone. There's a camp out that way. Bring her back.",rival:'trouble'},
      {kind:'deliver',title:'The Captains\u2019 Word',brief:"The League has one word for the Crown's surveyors: no. Carry it."},
      {kind:'road',title:'The Free Captains',brief:"The free captains have made a camp on our road. They're ours, and they're still a camp. Clear it, and don't ask whose coin they carry."},
      {kind:'duel',title:'The Duel at Caer Slige',brief:"A Captain of the League is made by acclamation, and acclamation is won on the yard. Rowe has claimed the challenge. It's her right. The ring's laid east of the walls from first light. Walk in when you're ready. Down or yield, and it's done by noon.",set:true,after:"Acclaimed. Rowe says you fought well, and she doesn't say that of many. You're Captain now, and the spire's yours to hold. Something up there pays my sergeants in light. I've stopped asking what.",afterMurder:"The yard saw it. So did I. There's no acclamation for that, and there's no League for you either. Leave your oath at the gate."}
    ],
    compact:[
      {kind:'deliver',title:'The Tithe Roll',brief:"Every hull that passes is tithed. This roll goes to the Factor; it says which ones haven't paid."},
      {kind:'cull',title:'The Church\u2019s Flocks',brief:"The Church of the Weaver keeps flocks as well as souls. Both are being eaten."},
      {kind:'road',title:'The Pilgrim Road',brief:"Rowe cleared the pilgrim road east of here before the Church asked. Clerk to Factor in a fortnight. Yours is the west.",rival:'mention'},
      {kind:'retrieve',title:'What the Sea Gave Back',brief:"A relic was taken from a sealed gate — sealed by us, at cost. It must not be sold.",rival:'present',item:'the reliquary'},
      {kind:'deliver',title:'A Prior\u2019s Letter',brief:"To the Factor at the port. The tithe is going up; the port won't like it; you will stand there while it's read."},
      {kind:'find',title:'Where Is Factor Rowe?',brief:"Factor Rowe went {dir} to look at a gate the Church had sealed, without the Compact's leave, and has not reported since. The seal is whole, I am told, and she is not at it. There is a camp in that country. Kindly bring her back to her ledgers.",rival:'trouble'},
      {kind:'cull',title:'The Uncleared',brief:"The dead are the uncleared. The Church blesses them; you bury them."},
      {kind:'road',title:'The Tithe Road',brief:"Bandits on the tithe road means bandits in the Church's purse."},
      {kind:'sail',title:'The Black Sail',brief:"A black-sailed hull has been taking tithe-ships in the strait. The Church has a ship; a Prior has a ship's captain. Board her and clear her deck.",set:true,after:"The strait is quieter, and the Compact is in your debt, Prior, which it does not admit to many. A house and a ship are entered in your name; claim them when you please. Factor Rowe has gone north to the League, I am told. Their ledgers are shorter."}
    ]
  };
  function factionService(fk,i){const L=FLINES[fk];return L[Math.min(i,L.length-1)];}
  function fqId(fk,i){const pre='fq:'+fk+':'+i+':';return pre+QJ().filter(q=>String(q.id).startsWith(pre)).length;}
  function factionQuestFor(site,fk,st){
    const F=FACTIONS[fk];const i=st.done;const S=factionService(fk,i);const authored=i<FLINES[fk].length;
    const lord=lordFor(site);const voice=`${lord.title} ${lord.name}`;
    let q;
    if(S.kind==='sail'){q={id:fqId(fk,i),giver:F.name,giverSite:site.id,title:S.title,desc:'',objective:'Board a black-sailed ship in the strait and clear her deck',kind:'sail',data:{},reward:220+level*20};}
    else if(S.kind==='duel'){const x=site.x+(site.pad||30)+14,z=site.z;q={id:fqId(fk,i),giver:F.name,giverSite:site.id,title:S.title,desc:'',objective:`Meet ${RIVAL.name} in the ring east of ${site.name}`,kind:'duel',data:{x,z,state:'wait',retryDay:null},enemy:'Bandit Captain',enemyName:RIVAL.name,reward:220+level*20};}
    else{q=townQuestFor(site,S.kind,true);
      if(S.kind==='find'&&S.rival){const old=q.data.who;q.data.who=RIVAL.name;q.title=S.title;q.objective=q.objective.split(old).join(RIVAL.name);q.desc=q.desc.split(old).join(RIVAL.name).replace('Find them — there\'s a camp out that way — and send them home.','Find her — there\'s a camp out that way — and bring her back.');q.rival='trouble';q.data.topics=[{label:'The seat sent me for you.',response:"Did they. Then they've noticed I'm not there. I sat down and my legs stopped agreeing with me. Tell them Rowe's coming — and tell them who found her."}];}
      if(S.item&&q.kind==='retrieve'){const old=q.data.item;q.data.item=S.item;q.objective=q.objective.split(old).join(S.item);q.desc=q.desc.split(old).join(S.item);}}
    if(authored){const mech=q.desc.replace(/^[^:]+: "/,'').replace(/"$/,'');q.title=`${F.name}: ${S.title}`;q.desc=S.kind==='find'&&S.rival?`${voice}: "${S.brief.replace('{dir}',compassWord(q.data.x-site.x,q.data.z-site.z))}"`:`${voice}: "${S.brief}${mech?' '+mech:''}"`;if(S.set)q.reward=Math.max(q.reward,200+level*20);}
    else q.title=`${F.name}: ${q.title}`;
    q.giver=F.name;q.faction=fk;q.service=i;return q;
  }
  // S507 — the claim answers from what grantShip did (quest review run 8, Finding 15): a new ship at the seat or at another
  // of the Compact's quays, a refit where she lies, a raise from the bottom, or no berth found.
  function compactClaimLine(g,seat){
    if(!g)return "Entered in your name, Prior: the house. The ship is entered also; the Compact will name her berth when it has one.";
    if(g.due!=null)return `Entered in your name, Prior: the house. Your ship lies on the bottom; the shipwright at ${(siteAnywhere(g.site)||{}).name||'the nearest quay'} has the Compact's order to raise her, a class better, and three days to do it.`;
    if(g.cls)return g.up?`Entered in your name, Prior: the house. You keep a ship already, so the Compact has seen to her where she lies: mended, and refitted as a ${g.cls}, at its own charge.`:"Entered in your name, Prior: the house. You keep a ship already, so the Compact has seen to her where she lies: mended, at its own charge. There is no larger hull to enter.";
    if(g.id===seat.id)return "Entered in your name, Prior: the house, and the ship at the quay.";
    return `Entered in your name, Prior: the house here, and the ship at the quay at ${g.name}.`;
  }
  function factionAfter(fk,i){const S=FLINES[fk][i];return S&&S.after?' '+S.after:'';}
  // the rival's beats: what she has to say when she stands at the seat
  function rivalBeat(fk,st){if(fk==='league'&&st.rowe==='dead')return null; // S374 — after the yard: she lives (rank 3), or holds the chair until the rematch
    if(st.rank>=3&&(fk!=='league'||st.rowe==='alive'))return 'present';if(fk==='league'&&duelLostBeat(st))return 'present';const i=st.done;const S=FLINES[fk][i];if(!S)return null;
    if(S.rival==='present')return 'present';
    if(S.rival==='mention'&&st.active)return 'mention';return null;}
  function duelLostBeat(st){const A=st.active;return st.rowe==='captain'&&A&&A.kind==='duel'&&A.data&&A.data.state==='lost';}
  function rivalLines(fk,st,F){
    if(fk==='league'&&st.rank>=3)return {greet:"Captain. Took me a week to stop favouring the left. I'm staying on at Caer Slige a while. Somebody ought to watch that spire.",topics:[{label:'What now, Rowe?',response:"The spire. You hold it, and I'll watch what comes down off it at night. If it's the light I think it is, you'll want a witness who can't be paid in it."},{label:'How are you ahead of me?',response:"I'm not, now. Don't get used to it."}]};
    if(fk==='league'&&duelLostBeat(st))return {greet:"Captain Rowe, for a week at least. The ring's there when you want it. I'd want it back.",topics:[{label:'How are you ahead of me?',response:"I was a step slow on the left, and you didn't see it. Next time you might."},{label:'Where are you from?',response:"The Mark. Half the swords on these islands are. The other half are asking where we're from."}]};
    const r=F.ranks;const yours=st.rank?r[st.rank-1]:'nobody';const hers=r[Math.min(2,st.rank)];
    if(st.rank>=3)return {greet:fk==='crown'?"Knight. I heard about the survey team. I was in one, once — I got out. We'll talk about it when you've a keep to talk in.":"Prior. They tell me you took the black sail. I'd have taken her a day sooner. I'm for the Mark; the League pays in silver and doesn't tithe it.",topics:[{label:'What now, Rowe?',response:fk==='crown'?"The same as you. Someone's etching in the gates on orders nobody gave. I'd like to know whose hand."+"":"North. There's a captain at the strait who pays in light. I want to see it."}]};
    return {greet:`${yours}, is it? I'm ${hers}. ${fk==='crown'?"Try to keep up; the roads don't clear themselves.":fk==='league'?"They gave me the coast road. They gave you the hills. That's the order of things.":"The Church counts in fortnights. Try to be worth one."}`,
      topics:[{label:'How are you ahead of me?',response:"I start earlier and I don't stop to talk. That's the whole of it."},{label:'Where are you from?',response:"The Mark. Half the swords on these islands are. The other half are asking where we're from."}]};
  }
  function tickRival(){
    let fk=null,st=null;for(const k in FACTIONS){const s=fstate()[k];if(s.active||s.done>0){if(!fk||s.done>st.done){fk=k;st=s;}}}
    if(!fk){if(RIVAL.npc)removeRival();return;}
    const F=FACTIONS[fk];const seat=F.seat?siteAnywhere(F.seat):null;const beat=seat?rivalBeat(fk,st):null;
    if(!beat||beat==='mention'||Math.hypot(px-seat.x,pz-seat.z)>160){if(RIVAL.npc&&(!beat||Math.hypot(px-RIVAL.npc.g.position.x,pz-RIVAL.npc.g.position.z)>240))removeRival();return;}
    const key=fk+'|'+st.done+'|'+st.rank+'|'+(fk==='league'&&duelLostBeat(st)?'lost':'');if(RIVAL.npc){if(RIVAL.key!==key)removeRival();else return;}
    const L=rivalLines(fk,st,F);const x=seat.x+6,z=seat.z+9;
    const def={name:RIVAL.name,role:'',ico:'⚔',authored:true,people:'markman',sCol:0xf0dcc8,hairCol:0xd8c8a0,bodyScale:[1.04,1.06,1.04],bCol:0x2a2a30,x,z,greeting:[L.greet],topics:[...L.topics,{label:'Farewell.',bye:true}]};def.temper='dry';
    const n=spawnNPC(def,Math.PI,true);n.sched={type:'lost'};n.g.position.set(x,worldH(x,z),z);RIVAL.npc=n;RIVAL.key=key;
  }
  function removeRival(){const n=RIVAL.npc;if(!n)return;sc.remove(n.g);sc.remove(n.dot);const k=npcs.indexOf(n);if(k>=0)npcs.splice(k,1);RIVAL.npc=null;}
  // the set-piece kinds the generator doesn't know
  function tickFactionKinds(){for(const q of qActive()){if(q.done)continue;if(q.kind==='sail'&&OTHER.some(o=>o.kind==='pirate'&&o.boarded&&o.crew.length&&o.crew.every(e=>e.dead))){qComplete(q);showMsg('Her deck is yours.','#e8d8a0');}}}
  function factionWantsPirate(){return qActive().some(q=>q.kind==='sail'&&!q.done);}
  // S373 — the Yard at Caer Slige (Michael's A on #69; the quest writer's draft in docs/quest_drafts.md). The League's
  // ninth service is a duel in a roped ring east of the seat, laid from first light to noon. Rowe waits in it as a
  // person; the yard-sergeant's *Call it.* puts a Bandit Captain wearing her name in her place. At a quarter of her
  // health she kneels and yields (no blow takes her below it before then); three seconds unstruck and she is spared, a
  // blow after the yield is murder and the League closes. The ring holds you at 1 health: down, yielded or over the
  // rope, the yard acclaims Rowe, and the ring is laid again in seven days.
  const DUEL={q:null,open:false,parts:[],sgt:null,watchers:[],rowe:null,npc:null,bark:0,last:'',spare:0,hp0:0,yieldS:0,inside:false,offered:false,rb:null,rbT:0,stag:false,pstag:false};
  const DUEL_R=5,DUEL_OPEN=6,DUEL_CLOSE=12,DUEL_CHECK=.4;
  const DUEL_BARKS=["Feet, Rowe! Feet!","Get your guard up, {nick}!","That's blood. Keep at it.","Iron and blood!","Watch her left, {nick}.","Don't dance. Fight.","Hesket! Hesket!","Up, {nick}! Up!","Finish it by noon, the pair of you!"];
  function duelQuest(){return qActive().find(q=>q.kind==='duel')||null;}
  function duelRingHours(){const h=hourNow();return h>=DUEL_OPEN&&h<DUEL_CLOSE;}
  function duelNick(){const it=EQ.weapon;if(!it)return 'Fists';const sh=it.weaponShape||(/bow/i.test(it.name)?'bow':/staff/i.test(it.name)?'staff':/axe/i.test(it.name)?'axe':/mace|hammer|club/i.test(it.name)?'mace':/dagger|knife/i.test(it.name)?'dagger':'sword');
    return /bow/.test(sh)?'Bowstring':/staff/.test(sh)?'Stick':/axe/.test(sh)?'Hatchet':/mace|club|hammer|flail/.test(sh)?'Hammer':/dagger|knife/.test(sh)?'Pin':'Blade';}
  function duelLeague(){return fstate().league;}
  function duelRemoveNpc(n){if(!n)return;sc.remove(n.g);if(n.dot)sc.remove(n.dot);const k=npcs.indexOf(n);if(k>=0)npcs.splice(k,1);}
  function duelRemoveRowe(){const e=DUEL.rowe;if(!e)return;if(!e.dead){if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const i=ZONES.world.enemies.indexOf(e);if(i>=0)ZONES.world.enemies.splice(i,1);}DUEL.rowe=null;DUEL.rb=null;}
  function duelRingDown(){DUEL.parts.forEach(m=>{sc.remove(m);if(m.geometry)m.geometry.dispose();});DUEL.parts=[];}
  function duelTeardown(){duelRingDown();duelRemoveNpc(DUEL.sgt);DUEL.watchers.forEach(duelRemoveNpc);duelRemoveNpc(DUEL.npc);duelRemoveRowe();
    Object.assign(DUEL,{q:null,sgt:null,watchers:[],npc:null,inside:false,offered:false,stag:false,pstag:false});}
  function duelPerson(def,x,z,face){def.x=x;def.z=z;const n=spawnNPC(def,face,true);n.sched={type:'lost'};n.g.position.set(x,worldH(x,z),z);return n;}
  function duelSeed(q){let h=0;for(const c of q.id)h=(h*31+c.charCodeAt(0))>>>0;return ()=>{h=(h*1664525+1013904223)>>>0;return h/4294967296;};}
  function roweSay(text){const e=DUEL.rowe;if(!e||!e.mesh)return;if(DUEL.rb)e.mesh.remove(DUEL.rb);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:bubbleFor(text),transparent:true,depthTest:false}));sp.scale.set(1.6,.4,1);sp.position.set(0,2.1,0);e.mesh.add(sp);DUEL.rb=sp;DUEL.rbT=3.2;}
  function roweDef(x,z){const pp=playerPeople();
    const hello={markman:"One of ours. Good. Nobody'll say it wasn't fair.",gatelander:"A turf-cutter on the yard. They say your lot won't leave a wounded man. We'll see if you'll let one up.",aurennais:"Your Church says the yard's for the unlettered. You came anyway. That's the first thing I've liked about you.",oldblood:"Cold-eyes. The sergeant asked me if it's allowed. It's allowed. I'll try to look straight at you. People tell me that's hard."}[pp]||"One of ours. Good. Nobody'll say it wasn't fair.";
    const def={name:RIVAL.name,role:'',ico:'⚔',authored:true,people:'markman',sCol:0xf0dcc8,hairCol:0xd8c8a0,bodyScale:[1.04,1.06,1.04],bCol:0x2a2a30,x,z,temper:'dry',
      get greeting(){const s=DUEL.q&&DUEL.q.data.state;return [s==='won'?"Good fight. I was a step slow on the left, and you saw it. Buy me a drink when you've a garrison to buy it in.":hello];},
      get topics(){const s=DUEL.q&&DUEL.q.data.state;return s==='wait'?[{label:'Why do you want it?',response:"Captain's a garrison and forty mouths. I've fed worse. And somebody ought to ask what the spire pays the sergeants in, because it isn't silver."},{label:"We don't have to do this.",response:"Aye, we do. You're Reeve, I'm Reeve, and there's one Captain's chair at the strait. We settle it by noon and drink after."},{label:'Farewell.',bye:true}]:[{label:'Farewell.',bye:true}];}};
    return def;}
  function duelBuild(q){const d=q.data,cx=d.x,cz=d.z;DUEL.q=q;DUEL.open=duelRingHours();const r=duelSeed(q);const bank=NAMES.anglo;const used=new Set();
    // S393 — the yard's people never take a name the seat already uses: the service's giver, the town's lord and its people (the critic's s342: a watcher Wulfstan beside Reeve Wulfstan)
    {const take=n=>{if(n)String(n).split(/\s+/).forEach(w=>used.add(w));};take(q.giver);take(RIVAL.name);const seat=siteAnywhere(q.giverSite);if(seat){try{if(!seat.lordless)take(lordFor(seat).name);}catch(err){}const S_=SETTLE.get(seat.id);if(S_&&S_.npcs)S_.npcs.forEach(n=>take(n.def&&n.def.name));}}
    const nm=()=>{let n;for(let k=0;k<20;k++){const L=r()<.5?bank.m:bank.f;n=L[Math.floor(r()*L.length)];if(!used.has(n))break;}used.add(n);return n;};
    const sn=nm();const sa=-Math.PI/2+.5,sx=cx+Math.cos(sa)*(DUEL_R+.8),sz=cz+Math.sin(sa)*(DUEL_R+.8);
    const sdef={name:sn,role:'Yard-sergeant',ico:'⚔',authored:true,people:'markman',bCol:0x3a3a40,sCol:0xe8d4bc,x:sx,z:sz,
      get greeting(){const s=DUEL.q&&DUEL.q.data.state;if(s==='murder')return ["She yielded. Every one of us saw it."];return [DUEL.open?"You're the other one. Rowe's been in there since first light.":"Ring's down. It goes up at first light, and it comes down at noon, fought or not."];},
      get topics(){const s=DUEL.q&&DUEL.q.data.state;if(s!=='wait'||!DUEL.open)return [{label:'Farewell.',bye:true}];return [
        {label:'The rules?',response:"Three. Nobody steps in. You go over the rope, you've yielded. Somebody yields, it's over, and you don't touch them after. That last one's the only one anybody remembers."},
        {label:'What do I fight with?',response:"What you walked in with. Steel, a bow, the old words if you've got them. The yard doesn't care how. It cares that it's you."},
        {label:'And if she dies?',response:"She won't, before she yields. Rowe's not proud that way. After she yields, it's murder, and the whole Mark will know your name by the week's end."},
        {label:'Call it.',quest:true,fn:()=>{duelStart(q);return "Rope's up. Iron and blood, the pair of you. Go on.";}},
        {label:'Farewell.',bye:true}];}};
    DUEL.sgt=duelPerson(sdef,sx,sz,Math.atan2(cx-sx,cz-sz));
    if(!DUEL.open)return;
    const stakeM=new THREE.MeshLambertMaterial({color:0x5a4630}),ropeM=new THREE.MeshLambertMaterial({color:0xb8a27a});const N=12,pts=[];
    for(let i=0;i<N;i++){const a=i/N*Math.PI*2;const x=cx+Math.cos(a)*DUEL_R,z=cz+Math.sin(a)*DUEL_R;const y=worldH(x,z);pts.push(new THREE.Vector3(x,y+.85,z));const s=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,1.1,5),stakeM);s.position.set(x,y+.55,z);s.castShadow=true;sc.add(s);DUEL.parts.push(s);}
    for(let i=0;i<N;i++){const a=pts[i],b=pts[(i+1)%N];const m=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,a.distanceTo(b),4),ropeM);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());sc.add(m);DUEL.parts.push(m);}
    for(let i=0;i<8;i++){const a=(i+.5)/8*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a-sa),Math.cos(a-sa)))<.35)continue;const x=cx+Math.cos(a)*(DUEL_R+1.6),z=cz+Math.sin(a)*(DUEL_R+1.6);
      const w=duelPerson({name:nm(),role:'',ico:'⚔',authored:true,people:'markman',bCol:[0x3a3a40,0x4a4038,0x2e3238][i%3],sCol:0xe8d4bc,greeting:['Iron and blood!'],topics:[{label:'Farewell.',bye:true}]},x,z,Math.atan2(cx-x,cz-z));w._duelWatch=true;DUEL.watchers.push(w);}
    DUEL.npc=duelPerson(roweDef(cx,cz+1.5),cx,cz+1.5,Math.PI);}
  function duelStart(q){if(q.data.state!=='wait'||!DUEL.npc)return;const d=q.data;const p=DUEL.npc.g.position;const x=p.x,z=p.z;duelRemoveNpc(DUEL.npc);DUEL.npc=null;
    const e=keyFoe(unlockFoe(buildZoneEnemy(sc,STATIC_SOL,x,z,q.enemy||'Bandit Captain',null)),q.id+':rival:'+dayNow());e._questTag=q.id;e._duel=true;e.name=e.displayName=RIVAL.name;e.homeX=d.x;e.homeZ=d.z;e.alert=true;e._duelHold=false;if(e.mesh&&!e.mesh.parent)sc.add(e.mesh);ZONES.world.enemies.push(e);DUEL.rowe=e;
    d.state='fight';DUEL.inside=Math.hypot(px-d.x,pz-d.z)<=DUEL_R;DUEL.offered=false;DUEL.bark=3;
    // S482: the timer closes the sergeant's dialogue, never Rowe's yield offer, which a fast fall opens inside the 1.4 s
    setTimeout(()=>{try{if(dlgOpen&&!(dlgNPC&&dlgNPC.name===RIVAL.name))closeDialog();}catch(err){}},1400);
    showMsg('The rope is up. Hesket Rowe lifts her blade.','#e8d8a0');if(typeof addLog==='function')addLog('⚔','The duel at Caer Slige: Hesket Rowe.');}
  function duelBark(line){const W=DUEL.watchers.filter(w=>w.g.visible);if(!W.length)return;sayBubble(W[Math.floor(Math.random()*W.length)],line.split('{nick}').join(duelNick()));}
  function duelYield(q){const e=DUEL.rowe;q.data.state='yielded';e._duelHold=true;e.alert=false;e.telegraphT=0;DUEL.hp0=e.hp;DUEL.spare=3;DUEL.yieldS=playClockS;if(e.mesh)e.mesh.position.y-=.45;
    try{if(dlgOpen&&dlgNPC&&dlgNPC.name===RIVAL.name)closeDialog();}catch(err){}
    showMsg('Hesket Rowe goes down on one knee and lays her blade on the ground.','#e8d8a0');roweSay("Enough. I yield. It's yours.");}
  function duelWon(q){const e=DUEL.rowe;q.data.state='won';duelLeague().rowe='alive';const x=e.x,z=e.z;duelRemoveRowe();duelRingDown();
    DUEL.npc=duelPerson(roweDef(x,z),x,z,Math.atan2(px-x,pz-z));
    const W=DUEL.watchers.slice().sort(()=>Math.random()-.5).slice(0,3);['Captain!','Captain! Captain!','Iron and blood!'].forEach((t,i)=>{if(W[i])sayBubble(W[i],t);});
    qComplete(q);showMsg('The yard acclaims you Captain.','#e8d8a0');}
  function duelMurder(q){q.data.state='murder';q.done=true;const L=duelLeague();L.rowe='dead';L.closed=true;duelRingDown();
    if(DUEL.sgt){sayBubble(DUEL.sgt,'She yielded. Every one of us saw it.');}
    DUEL.watchers.forEach(w=>{w.g.rotation.y+=Math.PI;w.def.greeting=['…'];if(w._bubble){w.g.remove(w._bubble);w._bubble=null;}});
    showMsg('Hesket Rowe is dead. The yard is silent.','#c8b880');}
  function duelLost(q,how){const d=q.data;d.state='lost';d.retryDay=dayNow()+7;d.told=false;duelLeague().rowe='captain';PHP=Math.max(PHP,1);if(typeof updateHUD==='function')updateHUD();
    duelRemoveRowe();duelRingDown();try{if(dlgOpen)closeDialog();}catch(err){}
    showMsg(how==='rope'?'You step over the rope. That is a yield. The yard acclaims Hesket Rowe Captain.':how==='yield'?'You yield. The yard acclaims Hesket Rowe Captain.':'You go down, and stay down. The yard acclaims Hesket Rowe Captain.','#c8b880');}
  function duelOffer(q){const e=DUEL.rowe;if(e){e._duelHold=true;e.telegraphT=0;}
    openDialog({name:RIVAL.name,role:'',ico:'⚔',greeting:["You're done. Say it, and it's done."],topics:[
      {label:'I yield.',quest:true,fn:()=>{setTimeout(()=>{if(q.data.state==='fight')duelLost(q,'yield');},1200);return "Heard. Up you get. You'll want that arm again.";}},
      {label:'Not yet.',quest:true,fn:()=>{setTimeout(()=>{try{if(dlgOpen)closeDialog();}catch(err){}},1200);return "Your blood, then.";}}]});}
  function tickDuel(dt){
    const q=duelQuest();if(DUEL.q&&DUEL.q!==q)duelTeardown();if(!q)return;const d=q.data;const far=Math.hypot(px-d.x,pz-d.z);
    if(DUEL.rb){DUEL.rbT-=dt;if(DUEL.rbT<=0){if(DUEL.rowe&&DUEL.rowe.mesh)DUEL.rowe.mesh.remove(DUEL.rb);DUEL.rb=null;}}
    const _seat=siteAnywhere(q.giverSite);const _occ=!!(_seat&&TS(_seat).flags.occupied!=null); // S374 — an occupied League town loses its duels (canon §12a): no ring
    if(_occ&&DUEL.q&&d.state==='wait'){duelTeardown();return;}
    if(!DUEL.q){if(far>180||_occ)return;if(d.state==='fight'||d.state==='yielded')d.state='wait'; // a fight left by a load is laid again
      if(d.state==='lost'&&dayNow()>=(d.retryDay||0))d.state='wait';if(d.state!=='wait')return;duelBuild(q);return;}
    const ended=d.state==='won'||d.state==='murder'||d.state==='lost';
    if(ended){if(far>60||(d.state==='lost'&&dayNow()>=(d.retryDay||0)))duelTeardown();return;}
    if(d.state==='wait'){if(far>240){duelTeardown();return;}if(DUEL.open!==duelRingHours()){duelTeardown();return;}return;}
    const e=DUEL.rowe;if(!e){duelTeardown();return;}
    if(d.state==='yielded'){if(!e.dead&&e.hp<DUEL.hp0&&duelCheck(e))return;if(!e.dead&&e.hp<DUEL.hp0){e.hp=0;if(typeof killZoneEnemy==='function')killZoneEnemy(e,sc,'');else duelMurder(q);return;}
      DUEL.spare-=dt;if(DUEL.spare<=0)duelWon(q);return;}
    // the fight
    const talking=(typeof dlgOpen!=='undefined')&&dlgOpen;e._duelHold=talking;if(!talking)e.alert=true;
    if(far<=DUEL_R)DUEL.inside=true;else if(DUEL.inside&&far>DUEL_R+1){duelLost(q,'rope');return;}
    if(e.hp<=e.maxHp*.25){duelYield(q);return;}
    if(!DUEL.offered&&!talking&&PHP<maxHP*.3){DUEL.offered=true;duelOffer(q);return;}
    const st=typeof isStaggered==='function'&&isStaggered(e);if(st&&!DUEL.stag){duelBark("She's open!");DUEL.bark=Math.max(DUEL.bark,3);}DUEL.stag=st;
    const ps=PPOST.stagUntil>performance.now()/1000;if(ps&&!DUEL.pstag){duelBark("Rowe's got you, {nick}.");DUEL.bark=Math.max(DUEL.bark,3);}DUEL.pstag=ps;
    DUEL.bark-=dt;if(DUEL.bark<=0){DUEL.bark=6+Math.random()*3;let line;do{line=DUEL_BARKS[Math.floor(Math.random()*DUEL_BARKS.length)];}while(line===DUEL.last);DUEL.last=line;duelBark(line);}
  }
  // the kill path asks first: before the yield no blow takes her below a quarter (she yields instead); after it, a kill is murder
  function duelKill(e){const q=DUEL.q;if(!q||DUEL.rowe!==e)return false;const s=q.data.state;
    if(s==='fight'||s==='wait'){if(s==='wait')q.data.state='fight';e.hp=Math.max(1,Math.floor(e.maxHp*.25));duelYield(q);return true;}
    if(s==='yielded'){if(duelCheck(e))return true;duelMurder(q);}return false;}
  // S408 (Michael's B on #96) — a blow begun within DUEL_CHECK s of her kneeling is held: it lands on nothing. A blow begun later is murder
  function duelCheck(e){if(!(_offenceS<(DUEL.yieldS||0)+DUEL_CHECK))return false;e.hp=DUEL.hp0;e.dead=false;
    if(e.hpFg){e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}showMsg('You check the blow.','#e8d8a0');return true;}
  // the ring holds you at 1 health: going down in it is a yield, not a death
  function duelDown(){const q=DUEL.q;if(!q||q.data.state!=='fight'||Math.hypot(px-q.data.x,pz-q.data.z)>DUEL_R+2)return false;duelLost(q,'down');return true;}
  // v80 S133 — a guild hunt's ground on the compass until the tally is met
  function guildMarkers(push){try{const G=gstate();for(const k in G){const t=G[k]&&G[k].active;if(t&&t.kind==='hunt'&&!t.done&&t.x!=null&&t.have<t.need)push(t.x,t.z,GREEN,`${t.target}s — ${t.ground||'their ground'}`);}}catch(e){}}
  function factionMarkers(push){const F=FACTIONS;for(const k in F){const st=fstate()[k];if(!st.active||st.active.done){if(st.active&&st.active.done&&F[k].seat){const s=siteAnywhere(F[k].seat);if(s)push(s.x,s.z,GREEN,F[k].name);}continue;}}}
  function factionPriceMul(site){const nk=nationKeyOf(...cellOf(site.x,site.z));const fk=factionOf(nk);const r=fstate()[fk].rank;if(nationRecord(nk))return 1;return r>=1?1-.05*r:1;} // S158 — no discount with a record
  // ═══ COACH LINES (Session T) ═════════════════════════════════════════
  // worldState.coaches[a|b] = {a,b}. A coaching road: milestones, an inn at
  // the midpoint, and a coach that leaves each end at 06:00 and 18:00, runs
  // the road at a trot, and carries you if you board it.
  const COACHES=new Map(); // key → {road,cart,horses,driver,plat,u,dir,state,wait,len,inn,posts}
  function coaches(){return worldState.coaches||(worldState.coaches={});}
  function coachTopics(site){
    if(prosperity(site)<50||favor(site)<3)return [];const C=coaches();const out=[];
    ROAD_DEFS.filter(d=>d.a===site.id||d.b===site.id).forEach(d=>{const other=siteAnywhere(d.a===site.id?d.b:d.a);if(!other||!(other.kind==='town'||other.kind==='city'||other.kind==='port'))return;if(!(site.kind==='town'||site.kind==='city'||site.kind==='port'))return;const key=routeKey(site.id,other.id);if(C[key])return;const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);if(!rd)return;const len=roadLen(rd);const cost=Math.round(600+len/2);
      out.push({label:`Raise a coaching road to ${other.name} (${cost} gold)`,quest:true,fn:()=>{if(gold<cost)return `A coaching road to ${other.name} — milestones, an inn, a coach and team — is ${cost} gold.`;gold-=cost;updateHUD();C[key]={a:site.id,b:other.id,opened:worldState.gameTimeAbsMinutes||0};addFavor(site,2);addFavor(other,2);setProsperity(site,prosperity(site)+3);setProsperity(other,prosperity(other)+3);if(typeof addLog==='function')addLog('🐎',`Raised a coaching road: ${site.name} — ${other.name}.`);return `The masons go out with the milestones tomorrow, and the first coach leaves at six. It'll change the look of that road.`;}});});
    return out;
  }
  function roadLen(rd){let L=0;for(let i=1;i<rd.pts.length;i++)L+=Math.hypot(rd.pts[i].x-rd.pts[i-1].x,rd.pts[i].z-rd.pts[i-1].z);return L;}
  function roadPoint(rd,u){const pts=rd.pts;const fi=Math.max(0,Math.min(1,u))*(pts.length-1);const i0=Math.min(pts.length-2,Math.floor(fi)),f=fi-i0;const p0=pts[i0],p1=pts[i0+1];return {x:p0.x+(p1.x-p0.x)*f,z:p0.z+(p1.z-p0.z)*f,ang:Math.atan2(p1.x-p0.x,p1.z-p0.z)};}
  // S237 — the coaching inn halfway along a coach road (Michael, issue #24: A). A roadside inn: a keeper of the country
  // it stands in, a meal and a drink, one room to let, the coach's board and a tack corner. Built with the line and kept
  // stable by the road's key, so the same inn has the same name and keeper whenever you come back.
  // S315 — the quest review's Finding 4 (run 2): the coaching inn's keeper, driver and travellers speak in the voice of
  // the keeper's people (`def.people`); Markish is the fallback, today's text unchanged.
  const COACH_INN_LINES={
    gatelander:{
      greet:["The fire's lit, and there's a chair by it with nobody's name on it.","A full bowl makes a short road. Sit, and it'll come to you.","We don't ask where you've been; a road's its own business. Boots off, though."],
      place:(n,a,b)=>`${n}, halfway between ${a} and ${b}. A house on a road is only ever half a house; the other half is whoever comes in. The coach stops, we feed them, and the horses drink.`,
      seatHas:(t,d)=>`The ${t} for ${d}. Your name's on it, and a name given is a name kept. If you're not at the door when it calls, it waits an hour, and not a breath more.`,
      seatGive:(t,d)=>`The ${t} for ${d}. It's yours, and it'll cost you nothing but being there; the driver knows to wait. An hour, mind. Patience has a bottom to it.`,
      driver:["The horses first, then me, and then whoever's left.","A quarter hour and we're off, and the road won't shorten for the waiting.","Mind the step when she's in. It's older than it looks, like the rest of us."],
      road:{trouble:"There's trouble on the road, and trouble doesn't move for a coach. We stand here till it's cleared.",clear:"Clear today, and I'd not promise you tomorrow."},
      trav:["Waiting on the coach, same as yourself. A watched road never brings it.","Sit, if you like. It'll come no faster for standing.","Would it be six yet, do you think?"]},
    markman:{
      greet:["Fire's lit. Take a seat.","Bed's upstairs. Bowl's on the way.","We don't ask where you've been. Boots off, though."],
      place:(n,a,b)=>`${n}, halfway between ${a} and ${b}. The coach stops, we feed whoever gets off, and the horses drink.`,
      seatHas:(t,d)=>`The ${t} for ${d}. Your name's on it. If you're not at the door when it calls, it waits — an hour, no more.`,
      seatGive:(t,d)=>`The ${t} for ${d}. It's yours, and it costs nothing; the driver knows to wait. An hour, no more.`,
      driver:["Horses first, then me.","Quarter of an hour and we're off.","Mind the step when she's in."],
      road:{trouble:"There's trouble on the road. We stand here till it's cleared.",clear:"Clear, today."},
      trav:["Waiting on the coach, same as you.","Sit, if you like. It won't come faster standing.","Is it six yet?"]},
    aurennais:{
      greet:["Be welcome, Master. The fire is lit, and the seats by it are free.","A bed upstairs, Master, and the kitchen is open. The terms are at the counter.","We keep no register of travellers, Master; only of accounts."],
      place:(n,a,b)=>`${n}, Master, halfway between ${a} and ${b}. The coach stops here under the road's contract. We feed its passengers and water its horses, at the posted rates.`,
      seatHas:(t,d)=>`The ${t} for ${d}, Master. Your name is entered. Should you not be at the door when it calls, it will wait one hour and no longer. That is the term.`,
      seatGive:(t,d)=>`The ${t} for ${d}, Master. The seat is entered at no charge, and the driver is instructed to wait. One hour, and no longer.`,
      driver:["The horses are seen to first, Master, and then the passengers.","We depart in a quarter of an hour, Master, on the timetable.","Mind the step when she is in, Master. The company accepts no claims for ankles."],
      road:{trouble:"The road is obstructed, Master. We are held here until it is cleared.",clear:"Clear today, Master."},
      trav:["Waiting on the coach, as are you. It is posted for six.","Do sit. Standing will not advance the timetable.","Is it six yet? The notice says six."]},
    oldblood:{
      greet:["The fire is lit. Sit.","Bed above. Bread soon.","Boots off. The rest is yours."],
      place:(n,a,b)=>`${n}. Halfway between ${a} and ${b}. The coach stops. We feed who gets off. The horses drink.`,
      seatHas:(t,d)=>`The ${t} for ${d}. Your name is on it. It waits an hour.`,
      seatGive:(t,d)=>`The ${t} for ${d}. Yours, and no charge. It waits an hour, no more.`,
      driver:["Horses first.","A quarter hour.","Mind the step."],
      road:{trouble:"Trouble on the road. We wait.",clear:"Clear."},
      trav:["Waiting.","Sit. It comes when it comes.","Six yet?"]}};
  const COACH_INNS=new Map();
  function coachInnHouse(key,rt,rd,ix,iz,L){
    if(COACH_INNS.has(key))return COACH_INNS.get(key);
    const mid=roadPoint(rd,.5),nx=Math.cos(mid.ang),nz=-Math.sin(mid.ang);
    const hk=String(key).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,11);const r=rngFor(hk%100003,hk%7919);
    const reg=REGISTER[dominantRegion(ix,iz).r.id]||'irish';const [ci,cj]=cellOf(ix,iz);const P=PEOPLES[nationOf(ci,cj).people]||PEOPLES.gatelander;
    const bank=NAMES[P.names]||NAMES[reg]||NAMES.irish;const female=r()<.5;const keeper=pick(r,female?bank.f:bank.m);
    const name=pick(r,INN_NAMES[reg]||INN_NAMES.irish);
    const A=siteAnywhere(rt.a),B=siteAnywhere(rt.b);
    const house={id:'g_coach_'+key,coachInn:key,type:'inn',doorX:ix-nx*3.4,doorZ:iz-nz*3.4,doorFace:cardinalFace(-nx,-nz),exitX:ix-nx*4.6,exitZ:iz-nz*4.6,exitYaw:Math.atan2(nx,nz),
      name,keeper,tagline:'',bCol:0x5a4030,sCol:pick(r,P.skin),w:9,d:6,two:true,reg,style:'stone',siteKind:'village',siteId:null,innX:ix,innZ:iz};
    const hm=m=>{const t=((m%1440)+1440)%1440;return `${Math.floor(t/60)}:${String(Math.round(t%60)).padStart(2,'0')}`;};
    const half=Math.round(L/2/COACH_SPEED); // game minutes from either end to the inn
    const board=`The coach for ${B?B.name:'the far end'} leaves ${A?A.name:'the near end'} at six and calls here about ${hm(6*60+half)}. The coach for ${A?A.name:'the near end'} leaves ${B?B.name:'the far end'} at six in the evening and calls here about ${hm(18*60+half)}. A quarter of an hour, then it goes on.`;
    const CL=COACH_INN_LINES[nationOf(ci,cj).people]||COACH_INN_LINES.markman;
    const def={name:keeper,role:'Innkeeper',ico:'\u{1F37A}',people:nationOf(ci,cj).people,x:0,z:0,bCol:house.bCol,sCol:house.sCol,
      greeting:CL.greet,_extra:innTopics(house,nationOf(ci,cj).people)};
    Object.defineProperty(def,'topics',{configurable:true,get(){return [...def._extra,
      {label:'When does the coach come through?',response:board},seatTopic(key,A,B,half,def.people),
      {label:'What is this place?',response:CL.place(name,A?A.name:'one town',B?B.name:'the next')},
      {label:'Any news?',get response(){return pick(Math.random,RUMORS[reg]||RUMORS.irish);}},
      {label:'How’s the weather been?',get response(){return weatherLine();}},
      {label:'Farewell.',bye:true}];}});
    house.dlg=def;house._board=board;COACH_INNS.set(key,house);return house;
  }
  // S267 — a seat held (Michael, issue #31: A). The keeper takes your name for the next coach to call, either way; it costs
  // nothing and the ride stays free. That coach waits at the inn for you, up to an hour past its call, so you can eat or
  // sleep without missing it. The coach stands still while you are indoors (WORLD.tick runs only outside), so a seat is
  // also settled against the timetable when you come out: if its call has come and the hour is not up, it is at the door.
  const SEAT_HOLD=60; // game minutes past the call
  function seatNow(){const s=worldState.coachSeat;return s&&coaches()[s.key]?s:null;}
  function nextCall(key,half){const C=COACHES.get(key);const now=worldState.gameTimeAbsMinutes||0;
    if(C&&C.state==='stop')return {at:now,tod:worldState.gameTimeMinutes||0,dir:C.resumeDir||C.dir||1};
    const tod=worldState.gameTimeMinutes||0;let best=null; // counted from the clock of the day, which the timetable reads
    for(const [m,dir] of [[6*60+half,1],[18*60+half,-1]]){let dm=((m-tod)%1440+1440)%1440;if(dm===0)dm=1440;if(!best||dm<best.dm)best={dm,dir,m};}
    return best&&{at:now+best.dm,tod:best.m,dir:best.dir};}
  function seatTopic(key,A,B,half,people){const L=COACH_INN_LINES[people]||COACH_INN_LINES.markman;const hm=m=>{const t=((m%1440)+1440)%1440;return `${Math.floor(t/60)}:${String(Math.round(t%60)).padStart(2,'0')}`;};
    const dest=dir=>{const t=dir>0?B:A;return t?t.name:'the far end';};const S=seatNow();
    if(S&&S.key===key)return {label:'My seat on the coach?',response:L.seatHas(hm(S.tod),dest(S.dir))};
    return {label:'A seat on the next coach?',quest:true,fn:()=>{const c=nextCall(key,half);if(!c)return 'No coach calls here now.';
      worldState.coachSeat={key,at:c.at,tod:c.tod,dir:c.dir};if(typeof addLog==='function')addLog('🐎',`A seat held on the ${hm(c.tod)} coach for ${dest(c.dir)}.`);
      return L.seatGive(hm(c.tod),dest(c.dir));}};}
  function seatHeldFor(C,key,dir){const S=seatNow();return !!S&&S.key===key&&S.dir===dir&&!C.riding;}
  function seatCatchUp(C,key){const S=seatNow();if(!S||S.key!==key||C.riding)return;const now=worldState.gameTimeAbsMinutes||0;
    if(now>=S.at+SEAT_HOLD){if(!(C.state==='stop'&&C.holdTo)){worldState.coachSeat=null;showMsg('The coach could not wait any longer. Your seat has gone with it.','#c8b880');}return;}
    if(now<S.at)return;
    const before=(C.state==='wait'&&(S.dir>0?C.u<=.001:C.u>=.999))||(C.state==='run'&&C.dir===S.dir&&!C.stopped);
    if(before){C.u=.5;C.state='stop';C.stopT=0;C.resumeDir=S.dir;C.dir=S.dir;C.holdTo=S.at+SEAT_HOLD;}}
  // S238 — the coach's other half (Michael, issue #24: B): the driver and a traveller or two wait in the common room while
  // the inn is open. Who they are is steady for a day (the road's key and the day); they wander the floor like guild members.
  function coachInnFolk(house,sc_,W,D){
    if(!npcInsideNow(house))return;const key=house.coachInn;const rt=coaches()[key];if(!rt)return;
    const A=siteAnywhere(rt.a),B=siteAnywhere(rt.b);const C=COACHES.get(key);
    const hk=String(key).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,17);const r=rngFor((hk+innDay())%100003,innDay()%7919);
    const [ci,cj]=cellOf(house.doorX,house.doorZ);const P=PEOPLES[nationOf(ci,cj).people]||PEOPLES.gatelander;const bank=NAMES[P.names]||NAMES[house.reg]||NAMES.irish;
    const nm=()=>pick(r,r()<.5?bank.f:bank.m);const used=new Set([house.keeper]);const fresh=()=>{let n=nm();for(let k=0;k<6&&used.has(n);k++)n=nm();used.add(n);return n;};
    const L=COACH_INN_LINES[nationOf(ci,cj).people]||COACH_INN_LINES.markman;
    const road=()=>(C&&C.halted)||(A&&B&&roadBroken(A,B))?L.road.trouble:L.road.clear;
    const folk=[{name:fresh(),role:'Coach Driver',ico:'\u{1F40E}',greeting:L.driver,
      topics:[{label:'When does the coach leave?',response:house._board||'At six, either end.'},{label:'How’s the road?',get response(){return road();}},{label:'Farewell.',bye:true}]}];
    const n=1+(r()<.5?1:0);
    for(let k=0;k<n;k++){const toB=r()<.5,dest=toB?B:A;const why=pick(r,['Family.','Work, if it’s still there.','A wedding. Not mine.','I’ve a debt to collect.','The same as everyone. Something better.']);
      folk.push({name:fresh(),role:'Traveller',ico:'\u{1F9F3}',greeting:L.trav,
        topics:[{label:'Where are you headed?',response:`${dest?dest.name:'The next town'}. ${why}`},{label:'Farewell.',bye:true}]});}
    folk.forEach((def,k)=>{const g=buildNPCMesh({role:'villager',name:def.name,bCol:k?0x4a4038:0x3a2a20,sCol:pick(r,P.skin)},{nation:nationAt(house.doorX,house.doorZ),key:'coach_'+key});
      let x=W/2,z=D*.7;for(let t=0;t<40;t++){const cx=2.5+r()*(W-5),cz=Math.max(5.5,D*.5)+r()*(D*.5-2.5);if(!intSolidAt(cx,cz,.45,0)&&!INT_NPCS.some(o=>Math.hypot(o.g.position.x-cx,o.g.position.z-cz)<1.2)){x=cx;z=cz;break;}}g.position.set(x,0,z);g.rotation.y=r()*Math.PI*2;sc_.add(g);
      INT_NPCS.push({g,def,wa:0,wt:1,walk:false,box:{x0:2,x1:W-2,z0:Math.max(5,D*.5),z1:D-2}});});
  }
  // S261 — the road coach on the kit (Michael's A on Session 230, as shown): a rounded panelled body on a lower frame,
  // framed windows and a door each side with a brass handle and a crest panel, a roof with an iron rail and luggage, the
  // driver's bench, backrest and footboard, two lamps, leaf springs over the axles, four wheels of twelve spokes with iron
  // tyres (larger behind), the pole out to the horses. One vertex-coloured mesh at .9 of the prototype, so its roof is at
  // 1.92 where the rider already stands (the platform at 1.9); facing +z, the horses ahead.
  function coachGeo(){const P=[],K=.9;const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x:x*K,y:y*K,z:z*K,rx,ry,rz,sx:K,sy:K,sz:K,jitter:j==null?.04:j});
    const rod=(a,b,r0,r1,col)=>{const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=d.length();const g=SK.cyl(r1,r0,L,6);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())));add(g,col,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,0,0,0,.03);};
    const B=0x5a2a1a,D=0x2a1410,W=0x8aa0b0,I=0x2a2a2e,BR=0xc8a050,WD=0x4a3018,Y=0xb08a30;
    add(SK.rbox(1.6,1.15,2.3,.12,3),B,0,1.45,0);add(SK.rbox(1.72,.12,2.46,.04,2),D,0,2.07,0);add(SK.rbox(1.5,.26,1.9,.08,2),B,0,.86,0);
    for(const s of [1,-1]){for(const z of [-.62,.62]){add(SK.rbox(.03,.46,.5,.02,1),W,s*.8,1.62,z,0,0,0,.02);add(SK.rbox(.05,.52,.56,.02,1),D,s*.79,1.62,z);}
      add(SK.rbox(.04,.9,.62,.02,1),D,s*.81,1.38,0);add(SK.ball(.025,8,6),BR,s*.84,1.38,.22);add(SK.rbox(.02,.24,.3,.01,1),Y,s*.83,1.22,0);}
    for(const [x,z] of [[.8,1.2],[-.8,1.2],[.8,-1.2],[-.8,-1.2]])rod([x,2.13,z],[x,2.3,z],.015,.015,I);
    for(const s of [1,-1])rod([s*.8,2.3,-1.2],[s*.8,2.3,1.2],.015,.015,I);rod([.8,2.3,1.2],[-.8,2.3,1.2],.015,.015,I);rod([.8,2.3,-1.2],[-.8,2.3,-1.2],.015,.015,I);
    add(SK.rbox(.9,.35,.7,.06,2),0x6a5030,.15,2.3,-.4);add(SK.rbox(.5,.3,.5,.05,2),0x3a3a2a,-.35,2.28,.35);
    add(SK.rbox(1.4,.1,.5,.03,2),WD,0,2.0,1.45);add(SK.rbox(1.4,.4,.08,.03,2),WD,0,2.2,1.24);add(SK.rbox(1.3,.06,.5,.02,1),WD,0,1.55,1.75,.5,0,0);
    for(const s of [1,-1]){add(SK.cyl(.06,.05,.16,8),I,s*.82,1.95,1.2);add(SK.ball(.045,8,6),0xffd070,s*.82,1.96,1.2,0,0,0,0);}
    const wheel=(r,x,z)=>{const yc=r+.02;add(SK.torus(r,.035,6,28),I,x,yc,z,0,Math.PI/2,0);add(SK.torus(r-.05,.03,5,24),Y,x,yc,z,0,Math.PI/2,0);
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2;rod([x,yc,z],[x,yc+Math.cos(a)*(r-.06),z+Math.sin(a)*(r-.06)],.018,.014,Y);}
      add(SK.cyl(.08,.08,.16,10),Y,x,yc,z,0,0,Math.PI/2);add(SK.cyl(.05,.05,.2,8),I,x,yc,z,0,0,Math.PI/2);};
    wheel(.55,.95,-.95);wheel(.55,-.95,-.95);wheel(.42,.95,.95);wheel(.42,-.95,.95);
    for(const z of [.95,-.95]){rod([.95,z>0?.44:.57,z],[-.95,z>0?.44:.57,z],.03,.03,I);for(const s of [1,-1])P.push({geo:SK.ball(.1,8,6),color:new THREE.Color(I),x:s*.55*K,y:(z>0?.62:.72)*K,z:z*K,sx:1.6*K,sy:.3*K,sz:.5*K,jitter:.03});}
    rod([0,.5,1.1],[0,.75,3.1],.04,.035,WD);
    return mergeParts(P);}
  function buildCoachLine(key,rt,rd){
    const c=x=>new THREE.Color(x);const g=new THREE.Group();
    // milestones every ~100u, an inn with a lamp at the midpoint
    const L=roadLen(rd);const posts=[];for(let d=100;d<L-60;d+=100){const p=roadPoint(rd,d/L);const nx=Math.cos(p.ang),nz=-Math.sin(p.ang);const x=p.x+nx*(ROAD_HALF+1.2),z=p.z+nz*(ROAD_HALF+1.2);posts.push({geo:new THREE.BoxGeometry(.4,1.1,.3),color:c(0xd8d0c0),x,y:worldH(x,z)+.55,z,ry:p.ang});}
    const m=new THREE.Mesh(mergeParts(posts),VC_MAT);g.add(m);
    const mid=roadPoint(rd,.5);const ix=mid.x+Math.cos(mid.ang)*(ROAD_HALF+7),iz=mid.z-Math.sin(mid.ang)*(ROAD_HALF+7);const iy=worldH(ix,iz);
    addStamp({id:'inn_'+key,kind:'site',x:ix,z:iz,r:9,blend:8,y:iy});
    const innGeo=buildingGeo(9,6,STYLE.stone,Math.random,{chimney:true,twoStory:true,h:3.0,rise:1.4});const inn=new THREE.LOD();{const hi=new THREE.Mesh(innGeo,VC_MAT),lo=new THREE.Mesh(innGeo.userData.lo,VC_MAT);hi.castShadow=lo.castShadow=true;inn.addLevel(hi,0);inn.addLevel(lo,HOUSE_LOD.far);} /* S202 — the roadside inn in detail near, plain past 80 */inn.position.set(ix,iy-.06,iz);inn.rotation.y=mid.ang-Math.PI/2;/* S237/S239 — turned so its door (the mesh's +z face) looks onto the road */g.add(inn);let smokeS=null;{const ch=chimneyAt(innGeo,inn,'inn');if(ch){smokeS={site:{id:'coach_'+key,x:ix,z:iz},chimneys:[ch],group:g};try{smokeFor(smokeS);}catch(err){}}} /* S345 — the inn's smoke */STATIC_SOL.push({cx:ix,cz:iz,rx:4.7,rz:3.2,c:Math.cos(inn.rotation.y),s:Math.sin(inn.rotation.y)});
    const house=coachInnHouse(key,rt,rd,ix,iz,L);if(!ZONES.world.houses.includes(house))ZONES.world.houses.push(house); // S237 — you can go in
    const l=regLight(0xffb050,1.4,14,'coach:'+key);l.position.set(mid.x+Math.cos(mid.ang)*(ROAD_HALF+2),iy+3,mid.z-Math.sin(mid.ang)*(ROAD_HALF+2));
    // the coach
    const cart=new THREE.Mesh(coachGeo(),VC_MAT);cart.castShadow=true;sc.add(cart); // S261 — the coach on the kit
    const horse=kind=>{const hg=new THREE.Group();const rg=buildWolf(kind,1.6);hg.add(rg.root);return hg;}; // S262 — the horses on the wolf's bones and gait (tickCreatures walks them by the ground they cover)
    const h1=horse('Horse'),h2=horse(pHash(key)&1?'Grey Horse':'Horse');sc.add(h1);sc.add(h2);
    const plat={x0:0,x1:0,z0:0,z1:0,y:0,coach:key};ZONES.world.platforms.push(plat);
    sc.add(g);const C={road:rd,rt,group:g,cart,horses:[h1,h2],plat,u:0,dir:1,state:'wait',len:L,riding:false,smokeS};COACHES.set(key,C);return C;
  }
  function removeCoachLine(key){const C=COACHES.get(key);if(!C)return;{const hs=ZONES.world.houses,i=hs.findIndex(h=>h.coachInn===key);if(i>=0&&!(typeof currentHouse!=='undefined'&&currentHouse===hs[i]))hs.splice(i,1);}sc.remove(C.group);if(C.smokeS&&C.smokeS.smoke)C.smokeS.smoke.geometry.dispose();sc.remove(C.cart);C.horses.forEach(h=>sc.remove(h));const i=ZONES.world.platforms.indexOf(C.plat);if(i>=0)ZONES.world.platforms.splice(i,1);unregLights('coach:'+key);COACHES.delete(key);}
  const COACH_SPEED=13;
  const COACH_STOP=15; // S178 — a quarter of an hour (real seconds, a game minute each) at the midpoint inn, each way
  function tickCoaches(dt){
    const Cs=coaches();
    for(const key in Cs){const rt=Cs[key];const a=siteAnywhere(rt.a),b=siteAnywhere(rt.b);if(!a||!b)continue;const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);const near=Math.hypot(px-(a.x+b.x)/2,pz-(a.z+b.z)/2)<Math.hypot(a.x-b.x,a.z-b.z)/2+500;
      let C=COACHES.get(key);if(!rd||!near){if(C)removeCoachLine(key);continue;}
      if(!C)C=buildCoachLine(key,rt,rd);
      seatCatchUp(C,key); // S267 — a seat held: the coach is at the inn if its call has come
      // schedule: leaves the a-end at 06:00 and the b-end at 18:00; otherwise waits at a station
      const h=hourNow();
      if(C.state==='wait'){if(roadBroken(a,b)){C.halted=true;}else{C.halted=false;if(C.u>0.001&&C.u<0.999){C.state='run';C.dir=C.resumeDir||1;}else if(h>=6&&h<6.2&&C.u<=0.001){C.state='run';C.dir=1;}else if(h>=18&&h<18.2&&C.u>=0.999){C.state='run';C.dir=-1;}}}
      if(C.state==='run'&&roadBroken(a,b)&&C.u>.02&&C.u<.98){C.state='wait';C.halted=true;C.resumeDir=C.dir;C.dir=0;} // the coach halts where it is and goes on when the road is clear
      // S178 — the coach draws up at the coaching inn halfway, once each way, and goes on after COACH_STOP
      if(C.state==='stop'){C.stopT-=dt;const nowM=worldState.gameTimeAbsMinutes||0;
        if(C.riding&&seatNow()&&seatNow().key===key){worldState.coachSeat=null;C.holdTo=0;} // aboard: the seat is used
        if(C.stopT<=0&&seatHeldFor(C,key,C.resumeDir||C.dir)){if(!C.holdTo)C.holdTo=nowM+SEAT_HOLD-COACH_STOP;}
        if(C.stopT<=0&&!(C.holdTo&&nowM<C.holdTo&&seatHeldFor(C,key,C.resumeDir||C.dir))){if(C.holdTo&&seatHeldFor(C,key,C.resumeDir||C.dir)){worldState.coachSeat=null;showMsg('The coach could not wait any longer. Your seat has gone with it.','#c8b880');}
          C.holdTo=0;C.state='run';C.dir=C.resumeDir||C.dir;C.stopped=true;}}
      if(C.state==='run'){const u0=C.u;C.u+=C.dir*COACH_SPEED*dt/C.len;
        if(!C.stopped&&(u0-.5)*(C.u-.5)<=0&&u0!==.5){C.u=.5;C.state='stop';C.stopT=COACH_STOP;C.resumeDir=C.dir;}
        if(C.u>=1){C.u=1;C.state='wait';C.stopped=false;}if(C.u<=0){C.u=0;C.state='wait';C.stopped=false;}}
      const p=roadPoint(rd,C.u);const fwd=C.dir;const ang=p.ang+(fwd<0?Math.PI:0);const y=worldH(p.x,p.z);
      C.cart.position.set(p.x,y,p.z);C.cart.rotation.y=ang;
      C.horses.forEach((hm,k)=>{const ox=(k?-.45:.45);hm.position.set(p.x+Math.sin(ang)*3.2+Math.cos(ang)*ox,worldH(p.x,p.z),p.z+Math.cos(ang)*3.2-Math.sin(ang)*ox);hm.rotation.y=ang;});
      C.plat.x0=p.x-1.2;C.plat.x1=p.x+1.2;C.plat.z0=p.z-1.7;C.plat.z1=p.z+1.7;C.plat.y=y+1.9;
      if(C.riding){px=p.x-Math.sin(ang)*.3;pz=p.z-Math.cos(ang)*.3;jumpY=y+1.9;}
    }
  }
  function coachNear(){for(const C of COACHES.values()){const d=Math.hypot(px-C.cart.position.x,pz-C.cart.position.z);if(d<3.2)return C;}return null;}
  function coachWhen(C){return (C.u>0.001&&C.u<0.999)?'goes on when the road is clear':C.u<=0.001?'leaves at six':'leaves at six in the evening';} // S348 — the prompt and the seat say the same hour
  function coachPrompt(){const C=coachNear();if(!C)return null;if(C.riding)return "Press 'E' to step down";if(C.state==='stop')return "Press 'E' to board the coach (it goes on shortly)";if(C.state==='wait')return `Press 'E' to board the coach (${coachWhen(C)})`;return "Press 'E' to swing aboard";}
  function coachInteract(){const C=coachNear();if(!C)return false;if(C.riding){C.riding=false;const ang=C.cart.rotation.y;px=C.cart.position.x+Math.cos(ang)*2.2;pz=C.cart.position.z-Math.sin(ang)*2.2;jumpY=worldH(px,pz);showMsg('You step down.','#c8b880');if(typeof saveGame==='function')saveGame();return true;} /* S353 — #66 A: stepping off the coach autosaves */C.riding=true;showMsg(C.state==='wait'?`You take a seat. The coach ${coachWhen(C)}.`:'You swing aboard.','#c8b880');if(typeof addLog==='function')addLog('🐎','Took the coach.');return true;}
  function rentSum(){const T=worldState.towns||{};let sum=0,n=0;for(const id in T){if(T[id].flags.owned==null)continue;const t=siteAnywhere(id);if(!t)continue;n++;sum+=Math.round(20+T[id].p*(t.kind==='city'?3:t.kind==='town'?1.6:.8));}return {sum,n};}
  // S498 — the weeks start on day 1, so the rent falls on the first day of the week (calDay), the day the Due view names
  function tickRents(){const wk=Math.floor((worldState.gameTimeAbsMinutes||0)/(1440*7));if(worldState._rentWk===wk)return;worldState._rentWk=wk;const sum=rentSum().sum;if(sum>0){gold+=sum;updateHUD();showMsg(`Rents: ${sum} gold from your towns.`,'#e8d8a0');}}
  // S499 — the seasons in the weather (DECISION #132, part B; the design page: *the Gatelands' winter brings snow on the
  // low ground and rain in autumn rises from today's weight by half; the Mark is colder in each; Aurenne's summer is
  // drier*). Called by weatherWeights on the climate's odds, before the biome's; the season is calDay's. Day length stays.
  function seasonWx(w,cl,at){const se=calDay(at).season;
    if(cl==='temperate'){if(se==='autumn')w.rain*=1.5;else if(se==='winter'){w.snow+=.12;w.rain*=.7;}}
    else if(cl==='cold'){if(se==='winter'){w.snow*=1.5;w.rain*=.5;}else if(se==='autumn'){w.rain*=1.5;w.snow*=1.2;}else if(se==='summer')w.snow*=.5;}
    else if(cl==='warm'){if(se==='summer'){w.rain*=.5;w.storm*=.5;}}
    return w;}
  // S498 — what the calendar owes you (DECISION #132, part B; the Journal's Due view): every dated thing already kept,
  // as {at, icon, text}, soonest first. The rent from the towns you own, the ship on the shipwright's slip, the masons at
  // a town, the room you have let, the coach seat held. Read from the absolute clock alone.
  function calendarDue(){
    const now=worldState.gameTimeAbsMinutes||0,out=[];
    const r=rentSum();if(r.n)out.push({at:(Math.floor(now/(1440*7))+1)*1440*7,icon:'🪙',text:`Rent from ${r.n===1?'your town':`your ${r.n} towns`}, about ${r.sum} gold at today’s prosperity.`});
    const sh=worldState.ship;if(sh&&sh.sunk&&sh.raise){const t=siteAnywhere(sh.raise.site);out.push({at:sh.raise.due,icon:'⛵',text:`The ${sh.name||'ship'} raised and lying at ${t?t.name:'the yard'}.`});}
    const T=worldState.towns||{};for(const id in T){const st=T[id];if(!st||!st.builds)continue;const t=siteAnywhere(id);st.builds.forEach(b=>{if(!b.done&&b.doneDay!=null)out.push({at:b.doneDay*1440,icon:'🧱',text:`The ${b.name} at ${t?t.name:'the town'} finished.`});});}
    const rn=worldState.rented;if(rn&&rn.until>now){out.push({at:rn.until,icon:'🛏',text:'The room you let is the innkeeper’s again.'});}
    const cs=worldState.coachSeat;if(cs&&typeof cs.at==='number'){const m=((cs.tod%1440)+1440)%1440;out.push({at:cs.at,icon:'🐎',text:`Your seat on the ${Math.floor(m/60)}:${String(Math.round(m%60)).padStart(2,'0')} coach.`});}
    const GG=worldState.guild;if(GG)for(const g in GG){const t=GG[g]&&GG[g].active;if(t&&t.due&&t.doneAt==null&&!taskDone(t))out.push({at:t.due-1,icon:'📜',text:`${t.short} — for the ${GUILD_DEF[g].name}: ${Math.round((t.gold||0)*1.25)} gold if it is done by then; after it, the task is taken back.`});}
    qActive().forEach(q=>{if(q.due&&!q.done)out.push({at:q.due-1,icon:'📜',text:`${q.title} — for ${q.giver}: ${Math.round((q.reward||0)*1.25)} gold if it is done by then; after it, the work is taken back.`});});
    return out.filter(e=>isFinite(e.at)).sort((a,b)=>a.at-b.at);
  }
  function stateLine(site){const st=TS(site);const f=Object.keys(st.flags);const p=st.p;const word=st.flags.besieged!=null?'under siege':st.flags.occupied!=null?'occupied':p>=80?'thriving':p>=60?'prosperous':p>=40?'getting by':p>=20?'struggling':'failing';return `${word} (${p})${f.length?' · '+f.join(', '):''}`;}

  // ═══ THE READER (Session Q) — Varek's discoveries, the fields, the Guest's chapel ═══
  // Varek reads the frame through the player. Each discovery is a real
  // property of play: deaths, the gap between sessions, the order places
  // were known. When one is due he stands at the nearest field. He never
  // says game, save, player or screen.
  const VX={due:null,npc:null,site:null,seenT:0};
  function vstate(){return worldState.varek||(worldState.varek={done:{},deaths:0,lastReal:Date.now(),gapH:0,shortRoad:null,chapel:false,masteries:0});}
  function noteDeath(){vstate().deaths++;}
  function noteSessionGap(){const v=vstate();const now=Date.now();if(v.lastReal){const h=(now-v.lastReal)/3.6e6;if(h>=6)v.gapH=Math.max(v.gapH||0,h);}v.lastReal=now;}
  let _lastRealT=0;function tickRealClock(){const now=Date.now();if(now-_lastRealT>60000){_lastRealT=now;vstate().lastReal=now;}}
  // roads walked vs places known first from the map
  let _rwT=0;function tickRoadsWalked(dt){_rwT-=dt;if(_rwT>0)return;_rwT=1;const ri=roadInfo(px,pz);if(ri&&ri.d<ROAD_HALF+2&&ri.seg&&ri.seg.road){const d=ri.seg.road.def;(worldState.roadsWalked||(worldState.roadsWalked={}))[d.a+'|'+d.b]=1;}}
  function noteFastTravel(id){const t=siteAnywhere(id);if(!t||!t.pad)return;const walked=worldState.roadsWalked||{};const rds=ROAD_DEFS.filter(x=>x.a===id||x.b===id);if(rds.length&&!rds.some(x=>walked[x.a+'|'+x.b]||walked[x.b+'|'+x.a])){const v=vstate();if(!v.shortRoad)v.shortRoad=t.name;}}
  // which discovery is due
  function varekDue(){const v=vstate();const M=worldState.masteries||0;
    if(v.chapel&&!v.done.chapel)return 'chapel';
    if(M>=1&&v.deaths>=1&&!v.done.returns)return 'returns';
    if(M>=1&&v.gapH>=6&&!v.done.breath)return 'breath';
    if(M>=2&&v.shortRoad&&!v.done.map)return 'map';
    return null;}
  // the fields: the Ashfeld at home; elsewhere the nation's bleakest site (a ruin or wasteland camp) nearest its centroid
  function fieldFor(nationKey){if(nationKey==='gatelands'){const a=SITE['ashfeld']||siteAnywhere('ashfeld');if(a)return a;}
    landmassOf(0,0);let best=null,bd=1e9;for(let m=0;m<_landmass.count;m++){if(_landmass.nation[m]!==nationKey)continue;const c=_landmass['c'+m];for(const cell of CELLS.values()){if(cell.type==='sea'||nationKeyOf(cell.i,cell.j)!==nationKey)continue;cell.sites.forEach(t=>{if(t.kind!=='ruin'&&t.kind!=='camp')return;const d=Math.hypot(cell.i-c.i,cell.j-c.j);if(d<bd){bd=d;best=t;}});}}return best;}
  const VAREK_LINES={
    returns:[`Áine's brother died in the Mouth fifty years ago and stayed dead. You didn't. I watched. You were on the floor of it, and then you were here, at the door, with your boots dry. I want to know where you go.`,`Don't answer. I've had two hundred and fifty years of answers. Just — stand there a moment, where I can see you.`],
    breath:[`Nine days passed for me between your last word and this one. For you it was an evening. I could tell by your boots — they hadn't dried. The stones felt it too. A skip, like a clock with a tooth missing.`,`Where do you go when you're not here? Not the sea. I'd know the salt.`],
    map:[`You walked to ${'%SHORT%'} by the shortest road on your first day. Nobody has seen that road from above. Nobody has stood high enough.`,`I've drawn this country for two centuries and I still take the long way to Portclare. You didn't take the long way anywhere.`],
    chapel:[`…`,`You went below the church at ${'%CHAPEL%'}. I know because the stones went quiet for four breaths, all of them, everywhere. I didn't think it had a face. I still don't. But it looked at something.`],
  };
  function varekDef(site,kind){
    const lines=VAREK_LINES[kind].map(l=>l.replace('%SHORT%',vstate().shortRoad||'Portclare').replace('%CHAPEL%',worldState.chapelAt||'the cathedral'));
    const def={name:'Varek',role:'',ico:'✒',authored:true,people:'oldblood',sCol:0xd0c8c4,hairCol:0x0e0c0c,bodyScale:[.92,.96,.92],bCol:0x2a2a30,x:site.x+4,z:site.z-3,greeting:[kind==='chapel'?'':lines[0]],
      topics:kind==='chapel'?[{label:'…',response:lines[1]},{label:"You're watching my hands.",response:"Yes."},{label:'Farewell.',bye:true}]:[{label:'Where do you think I go?',response:lines[1]},{label:'What are you?',response:kind==='returns'?"Old. Tired in a way I don't have a word for yet. I'm working on the word.":kind==='breath'?"A man who keeps a list. Your name's on a page by itself now.":"The only one who kept looking. That's all it ever was."},{label:'Farewell.',bye:true}]};
    def.temper='weary';return def;
  }
  function tickVarek(dt){
    tickRoadsWalked(dt);
    if(activeZoneId!=='world')return;
    if(worldState.story&&(worldState.story.step==='ashfeld'||worldState.story.step==='root'))return;
    const kind=varekDue();
    if(!kind){if(VX.npc&&Math.hypot(px-VX.npc.g.position.x,pz-VX.npc.g.position.z)>90){removeVarek();}return;}
    if(VX.npc)return;
    const nk=nationKeyOf(...cellOf(px,pz));const f=fieldFor(nk);if(!f)return;
    if(Math.hypot(px-f.x,pz-f.z)>420)return; // he stands at the field; you have to walk to it
    const def=varekDef(f,kind);const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(def.x,worldH(def.x,def.z),def.z);VX.npc=n;VX.kind=kind;VX.site=f;
    if(!vstate().hinted||vstate().hinted!==kind){vstate().hinted=kind;showMsg('Someone is standing at the field, looking out.','#a0a8c0');}
  }
  function removeVarek(){if(!VX.npc)return;const n=VX.npc;sc.remove(n.g);sc.remove(n.dot);const k=npcs.indexOf(n);if(k>=0)npcs.splice(k,1);VX.npc=null;}
  function varekTalked(){if(VX.npc&&VX.kind){vstate().done[VX.kind]=1;if(typeof addLog==='function')addLog('✒',`Varek, at ${VX.site.name}: ${VX.kind==='returns'?'he watched you die and come back':VX.kind==='breath'?'he felt the world stop while you were gone':VX.kind==='map'?'he knows you took the shortest road':'he knows you went below the church'}.`);}}
  // ── the Guest's chapel: under the cathedral of Aurenne's capital ──
  // S152 — solved once over the whole grid, in grid order: it used to walk only the cells generated so far,
  // so the capital was nowhere until you'd been near Aurenne, and then whichever city's cell loaded first
  let _guestCap;
  function guestChapelHouse(){if(_guestCap!==undefined)return _guestCap;_guestCap=null;
    for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){if(!isLandCell(i,j)||nationKeyOf(i,j)!=='aurenne')continue;const city=getCell(i,j).sites.find(t=>t.kind==='city');if(city){_guestCap=city;return city;}}
    return null;}
  function isGuestCathedral(house){if(house.type!=='church')return false;const cap=guestChapelHouse();return !!cap&&house.siteId===cap.id;}
  function guestPrompt(){if(!currentHouse||currentHouse.type!=='chapel')return null;if(Math.hypot(px-currentHouse.intW/2,pz-2.2)<1.8)return "Press 'E' to pray";return null;}
  function guestInteract(){if(!guestPrompt())return false;
    try{const ov=document.createElement('div');if(ov.style)ov.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;background:#000;z-index:0;pointer-events:none';
    const cv=(typeof REN!=='undefined'&&REN.domElement)||document.querySelector('canvas');if(cv&&cv.parentElement&&cv.insertAdjacentElement)cv.insertAdjacentElement('afterend',ov);else if(document.body&&document.body.appendChild)document.body.appendChild(ov);
    setTimeout(()=>{if(ov.remove)ov.remove();if(typeof addLog==='function')addLog('👁','It saw you.');},4000);}catch(e){}
    vstate().chapel=true;worldState.chapelAt=guestChapelHouse()?guestChapelHouse().name:'the cathedral';return true;}

  // ═══ THE ACTS (Session U) — Act II: The Widening Dark · Act III: What Was Bound ═══
  // ═══ TUTORIAL LINES (Session 125) ═══════════════════════════════════
  // Two optional lines that teach systems already in the world, and read
  // back into Act II. Neither gates anything.
  //  town — "A Town Worth Keeping", from any lord: a job → the road → a
  //         trade route → paying for a build → report when it stands.
  //  sea  — "Salt Water", from Corwin at a harbour: a ferry → a hull (his
  //         note takes a quarter off) → a crossing to another island at
  //         your own wheel → boarding black sails and clearing the deck.
  // worldState.tut = {town:{site,step,build}, sea:{step,note,from,target}, ferries}
  function TUT(){return worldState.tut||(worldState.tut={town:null,sea:null,ferries:0});}
  function tutQuest(id){return QJ().find(q=>q.id===id);}
  function tutLog(msg){if(typeof addLog==='function')addLog('🧭',msg);}
  function tutSet(id,title,giver,desc,objective,reward,done){let q=tutQuest(id);
    if(!q){q={id,giver,title,desc,objective,kind:'tut',data:{},reward:reward||0,tut:true,done:!!done};QJ().push(q);if(typeof addLog==='function')addLog('📜',`${title} — ${giver}`);showMsg(`New quest: ${title}`,'#e8d8a0');}
    else{q.desc=desc;q.objective=objective;q.done=!!done;if(reward!=null)q.reward=reward;}
    return q;}
  function tutFinish(id,gold_){const q=tutQuest(id);if(q){q.done=true;q.turnedIn=true;}const paid=questGold(gold_);gold+=paid;xp+=Math.round(gold_*.9);(worldState.stats||(worldState.stats={})).goldIn=((worldState.stats||{}).goldIn||0)+paid;if(typeof chkLvl==='function')chkLvl();updateHUD();}
  function lordName(site){const l=lordFor(site);return `${l.title} ${l.name}`;}
