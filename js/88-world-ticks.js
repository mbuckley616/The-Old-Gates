  // ── the town line ──
  function tutTownSite(){const T=TUT().town;return T?siteAnywhere(T.site):null;}
  function tutTownIs(site){const T=TUT().town;return !!T&&!!site&&T.site===site.id&&T.step!=='done';}
  function tutTownStage(site){
    const T=TUT().town,L=lordFor(site),lord=lordName(site),nm=site.name;
    const S=story();
    const stages={
      work:{desc:`${L.name}: "A sword's a start. A town is kept by people who do the small work, and the small work comes first. Take a job from me, finish it, and come back for the next."`,obj:`Finish a job for ${lord} at ${nm} (ask for work)`},
      road:{desc:`${L.name}: "Carts won't take a road with a camp on it, and a town without carts is a town that empties. Clear it. The road stays clean while it's watched — and a clean road raises every town on it."`,obj:`Clear the road out of ${nm}, then tell ${lord} it's done`},
      route:{desc:`${L.name}: "Now the road's clean, put something on it. Ask me to open a trade route — a caravan out in the morning, back at night. Both towns grow by it while it runs. A camp near the road breaks it; you'd have to clear that and reopen."`,obj:`Open a trade route from ${nm} (ask ${lord})`},
      invest:{desc:`${L.name}: "You've done work, cleared a road, sent a cart. That's a friend of the town. Friends pay for things. Ask what the town needs — a well is cheapest — and the masons start the next day. Pay for three and the town will talk to you about a deed."`,obj:`Pay for a build at ${nm} (ask ${lord})`},
      building:{desc:`${L.name}: "Three days. Walk the country; it'll be standing when you're back."`,obj:`Wait for the ${T&&T.build||'build'} at ${nm} to be finished`},
      report:{desc:`The ${T&&T.build||'build'} at ${nm} is finished.`,obj:`Tell ${lord}`,done:true}
    };
    return stages[T.step]||stages.work;
  }
  function tutTownSync(site){const T=TUT().town;if(!T||T.step==='done')return;const s=tutTownStage(site);tutSet('tut_town','A Town Worth Keeping',lordName(site),s.desc,s.obj,null,!!s.done);}
  function tutTownAdvance(site,step,msg){const T=TUT().town;T.step=step;tutTownSync(site);if(msg){showMsg(msg,'#e8d8a0');tutLog(msg);}}
  function tutTownTopics(site){
    const T=TUT().town;const out=[];if(!site||site.kind==='portal')return out;
    if(!T){
      out.push({label:`What does ${site.name} need, beyond a sword?`,quest:true,fn:()=>{
        TUT().town={site:site.id,step:'work',build:null};
        // a job already in hand from this lord counts
        tutTownSync(site);
        const has=qActive().find(q=>q.giverSite===site.id);
        return `A town's not kept by swords. It's kept by roads, carts, and people who pay for wells. ${has?`Finish the job you've got from me — "${has.title}" — and`:'Ask me for work, do it, and'} come back. I'll show you the rest one piece at a time.`;}});
      return out;
    }
    if(T.site!==site.id||T.step==='done')return out;
    if(T.step==='report')out.push({label:`The ${T.build||'build'} is finished.`,quest:true,fn:()=>{
      const reward=questGold(150+level*20);T.step='done';setProsperity(site,prosperity(site)+3);addFavor(site,1);tutFinish('tut_town',150+level*20);
      tutLog(`A Town Worth Keeping: ${site.name} (${reward} gold).`);
      const S=story();
      const coda=S.act>=2
        ?`Word is the Crown's survey teams have been in the gates, and not to clear them. The man asking questions about it is at the harbours — Corwin. A town's only as safe as the stones under it.`
        :`People who can clear a road and read a ledger get noticed in Ironhaven. When the Crown's commission comes — and it comes to people like you — the sea opens, and you'll know what a town is worth when you see one burning.`;
      return `I saw it. ${reward} gold, from the ${site.kind}'s purse, and your name where the masons can cut it. From here it's yours to push: more builds and the deed, a coaching road once we're big enough, the Crown's service if you want a title. ${coda}`;}});
    else out.push({label:'What next, for the town?',get response(){return tutTownStage(site).desc.replace(/^[^:]+: "/,'').replace(/"$/,'');}});
    return out;
  }
  // called from the lord's "It's done." after a town quest turns in — returns words to add
  function tutOnTurnIn(q,site){
    const T=TUT().town;if(!T||T.site!==site.id)return '';
    if(T.step==='work'&&q.kind==='road'){ // the job was the road: that lesson's learned
      tutTownAdvance(site,'route',null);
      return ` That was the first piece, and the second with it — the road's clean. Now put a cart on it: ask me to open a trade route. A caravan both ways, and both towns grow while it runs.`;
    }
    if(T.step==='work'){
      const rq=townQuestFor(site,'road');rq.tut='town';if(!qFind(rq.id))qAdd(rq);
      tutTownAdvance(site,'road',null);
      return ` That's the first piece. The second: ${rq.desc.replace(/^[^:]+: /,'')} (${rq.reward} gold.)`;
    }
    if(T.step==='road'&&q.tut==='town'){
      tutTownAdvance(site,'route',null);
      return ` The road's clean. Now put a cart on it — ask me to open a trade route. A caravan both ways, and both towns grow while it runs.`;
    }
    return '';
  }
  function tickTutTown(){
    const T=TUT().town;if(!T||T.step==='done')return;const site=tutTownSite();if(!site)return;
    if(T.step==='road'){ // a road already cleared by other means counts
      const R=worldState.roadsCleared||{};if(Object.keys(R).some(k=>k.split('|').includes(site.id))&&!qActive().some(q=>q.tut==='town'))tutTownAdvance(site,'route',`${site.name}'s road is clean. ${lordName(site)} will want a cart on it.`);}
    if(T.step==='route'){const R=routes();if(Object.values(R).some(rt=>!rt.broken&&(rt.a===site.id||rt.b===site.id)))tutTownAdvance(site,'invest',`A cart on ${site.name}'s road. ${lordName(site)} counts you a friend now — ask what the town needs.`);}
    if(T.step==='invest'){const st=TS(site);const b=st.builds[st.builds.length-1];if(b){T.build=b.name;tutTownAdvance(site,b.done?'report':'building',`The masons are at ${site.name}. Three days.`);}}
    if(T.step==='building'){const st=TS(site);if(st.builds.some(b=>b.done)){const b=st.builds.find(b=>b.done);T.build=b.name;tutTownAdvance(site,'report',`The ${b.name} at ${site.name} ${b.key==='walls'?'are':'is'} standing. ${lordName(site)} will want to see you.`);}}
  }
  // gates the lord waives for the line's own town at the step that teaches them
  function tutWaivesRoute(site){const T=TUT().town;return !!T&&T.site===site.id&&T.step==='route';}
  function tutWaivesInvest(site){const T=TUT().town;return !!T&&T.site===site.id&&T.step==='invest';}

  // ── the sea line ──
  function tutSeaOpen(){const S=story();const T=TUT();if(T.sea&&T.sea.step==='done')return false;
    if(S.act>=2)return true;
    // v80 S133 — only once the merchant's own quest is done: before that Corwin belongs to Ashenmoor, and the journal points there
    try{if(typeof qState==='function'&&(qState('q3_the_merchant_knows')==='complete'||qState('q4_crypt_of_embers')!=='locked'))return true;}catch(e){}
    return false;}
  function tutSeaStage(){
    const E=TUT().sea;const tgt=E&&E.target?siteAnywhere(E.target):null;const shipName=(worldState.ship&&worldState.ship.name)||'your ship';
    return ({
      ferry:{desc:`Corwin: "Before you own a boat, ride in one. Ask the harbourmaster for passage — any port, anywhere. You'll see what the sea costs in hours and coin."`,obj:'Take a ferry from any harbour (ask the harbourmaster)'},
      ship:{desc:`Corwin: "Now buy a hull. Any shipwright. Show them my note — a quarter off; they owe me for a winter's timber. There's a net down each side of her: put your eye on it and press E, and up you go. E again at the wheel. W and S for the sails, A and D to steer."`,obj:`Buy a ship from a shipwright (Corwin's note: a quarter off)`},
      crossing:{desc:`Corwin: "A ferry takes you. A ship, you take. Sail the ${shipName} yourself to a harbour on another island${tgt?` — ${tgt.name} is nearest`:''}. Keep off the rocks; they don't move for anyone."`,obj:`Sail the ${shipName} to a harbour on another island${tgt?` (${tgt.name})`:''}`},
      board:{desc:`Corwin: "Out on the water you'll meet black sails. They shoot first. Don't run — come alongside, put your eye on her net and press E, and clear her deck once you're over the rail. The captain's chest is yours after."`,obj:'Board a pirate ship and clear her deck'},
      report:{desc:`Corwin: "Come and tell me. I'm at whatever harbour you're at — it's a talent."`,obj:'Tell Corwin at any harbour',done:true}
    })[E?E.step:'ferry'];
  }
  function tutSeaSync(){const E=TUT().sea;if(!E||E.step==='done')return;const s=tutSeaStage();tutSet('tut_sea','Salt Water','Corwin',s.desc,s.obj,null,!!s.done);}
  function tutSeaAdvance(step,msg){TUT().sea.step=step;tutSeaSync();if(msg){showMsg(msg,'#e8d8a0');tutLog(msg);}}
  function foreignPortFrom(x,z){const nk=nationKeyOf(...cellOf(x,z));let best=null,bd=1e9;for(const p of allPorts()){if(nationKeyOf(...cellOf(p.x,p.z))===nk)continue;const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;best=p;}}return best;}
  function shipPriceNow(){const E=TUT().sea;return Math.round(SHIP_PRICE*(E&&E.note&&!worldState.ship?.75:1));}
  function tutCorwinTopics(){
    const E=TUT().sea;const out=[];if(!tutSeaOpen())return out;
    if(!E){out.push({label:'Teach me the sea.',quest:true,fn:()=>{TUT().sea={step:'ferry',note:false,from:null,target:null};tutSeaSync();tickTutSea();
      return story().act>=2?"Good — you'll need it before the Mark. Ferry first, then a hull, then your own crossing, then black sails. I'll be at whatever harbour you're at.":"Ferry first, then a hull, then your own crossing, then black sails. In that order, or you'll drown in the wrong one. I'll be at whatever harbour you're at.";}});return out;}
    if(E.step==='report')out.push({label:"I've taken a pirate's deck.",quest:true,fn:()=>{
      const reward=questGold(200+level*20);E.step='done';tutFinish('tut_sea',200+level*20);tutLog(`Salt Water: Corwin (${reward} gold).`);
      return story().act>=2?`Then the strait's yours as much as anyone's. ${reward} gold — the reeve paid a bounty on that crew and I took the liberty. Go and count the gates; you won't need the ferries.`:`Then you're a sailor, which is to say poorer and harder to kill. ${reward} gold — the reeve's bounty on that crew. When Aldwyn's commission comes through, the other islands stop being a rumour. You'll have a deck under you when they do.`;}});
    else if(E.step!=='done')out.push({label:'About the sea…',get response(){return tutSeaStage().desc.replace(/^Corwin: "/,'').replace(/"$/,'');}});
    return out;
  }
  function tickTutSea(){
    const E=TUT().sea;if(!E||E.step==='done')return;
    if(E.step==='ferry'&&(TUT().ferries>0||worldState.ship)){E.note=true;tutSeaAdvance('ship',"Corwin's note is in your pocket — any shipwright takes a quarter off a hull.");}
    if(E.step==='ship'&&worldState.ship){const f=foreignPortFrom(worldState.ship.x,worldState.ship.z);E.from=nationKeyOf(...cellOf(worldState.ship.x,worldState.ship.z));E.target=f?f.id:null;tutSeaAdvance('crossing',`A hull of your own. Now another island${f?` — ${f.name} is nearest`:''}.`);}
    if(E.step==='crossing'&&SHIP.mesh&&(SHIP.sailing||onDeck())){for(const p of allPorts()){if(nationKeyOf(...cellOf(p.x,p.z))===E.from)continue;if(Math.hypot(SHIP.x-p.x,SHIP.z-p.z)<200){tutSeaAdvance('board',`${p.name}, at your own wheel. Watch for black sails on the way back.`);break;}}}
    if(E.step==='board'&&OTHER.some(o=>o.kind==='pirate'&&o.boarded&&o.crew.length&&o.crew.every(e=>e.dead)))tutSeaAdvance('report','Her deck is yours. Corwin will want to hear it.');
  }
  function tutWantsPirate(){const E=TUT().sea;return !!E&&E.step==='board';}

  // ── ticks, markers, leads ──
  let _tutT=0;
  function tickTut(){_tutT--;if(_tutT>0)return;_tutT=30;try{tickTutTown();tickTutSea();}catch(e){console.warn('tut',e);}}
  function tutMarkers(push){
    const T=TUT().town;if(T&&T.step!=='done'){const s=tutTownSite();if(s&&(T.step==='route'||T.step==='invest'||T.step==='report'||(T.step==='work'&&!qActive().some(q=>q.giverSite===s.id))))push(s.x,s.z,GREEN,lordName(s));}
    const E=TUT().sea;if(E&&E.step!=='done'){
      if(E.step==='crossing'&&E.target){const t=siteAnywhere(E.target);if(t)push(t.x,t.z,GREEN,t.name);}
      if(E.step==='ferry'||E.step==='ship'||E.step==='report'){let best=null,bd=1e9;for(const p of allPorts()){const d=Math.hypot(px-p.x,pz-p.z);if(d<bd){bd=d;best=p;}}if(best&&!(E.step==='report'&&CORWIN.npc))push(best.x,best.z,GREEN,E.step==='report'?'Corwin — '+best.name:E.step==='ferry'?'harbourmaster — '+best.name:'shipwright — '+best.name);else if(CORWIN.npc&&E.step==='report')push(CORWIN.npc.g.position.x,CORWIN.npc.g.position.z,GREEN,'Corwin');}
    }
  }
  function tutLeads(){const out=[];const T=TUT();
    if(!T.town)out.push({title:'A Town Worth Keeping',text:"Any lord or elder has more than odd jobs, if you ask what the town needs. Roads, carts, and wells — how a town grows."});
    if(!T.sea&&tutSeaOpen())out.push({title:'Salt Water',text:"Corwin has taken to the harbours. Ask him to teach you the sea — ferries, a ship of your own, black sails."});
    return out;}

  // worldState.story = {act, step, proof:{gatelands,mark,aurenne}, choice, ending}
  // Steps: 'corwin' → 'proof' (three etched gates, one per island) → 'courier' (Oswy's log) → 'ashfeld' (the choice) → 'root' → 'end'
  function story(){return worldState.story||(worldState.story={act:1,step:null,proof:{},choice:null,ending:null,gates:{}});}
  function storyBegun(){return !!worldState.commissioned||(story().act>=2);}
  function etchedGateFor(nationKey){const S=story();if(S.gates[nationKey])return S.gates[nationKey];
    let best=null,bd=1e9;const seat=nationKey==='gatelands'?siteAnywhere('ironhaven'):nationKey==='mark'?anchoredPlaces().caer_slige:anchoredPlaces().compact_seat;if(!seat)return null;
    for(const e of sigilDoors()){const [i,j]=cellOf(e.x,e.z);if(nationKeyOf(i,j)!==nationKey)continue;const p=dungeonWorldPos[e.seed]||{x:e.x,z:e.z};const d=Math.hypot(p.x-seat.x,p.z-seat.z);if(d>120&&d<bd){bd=d;best=e;}}
    if(best){S.gates[nationKey]={seed:best.seed,name:best.canonicalName||(typeof dungeonName==='function'?dungeonName(best.seed,best.theme):'an old gate'),x:(dungeonWorldPos[best.seed]||best).x,z:(dungeonWorldPos[best.seed]||best).z};best.etched=true;}
    return S.gates[nationKey];
  }
  function storyQuest(id,title,giver,desc,objective,data){if(qFind(id))return qFind(id);return qAdd({id,giver,giverSite:null,title,desc,objective,kind:'story',data:data||{},reward:0,story:true});}
  function beginActII(){const S=story();if(S.act>=2)return;S.act=2;S.step='corwin';showMsg('Act II — The Widening Dark','#e8d8a0');if(typeof addLog==='function')addLog('📖','Act II — The Widening Dark. Corwin has gone ahead to the coast; find him at a harbour.');
    storyQuest('act2_corwin','The Widening Dark','Corwin',"Aldwyn's commission opens the sea. Corwin went ahead to the coast to see whether the etching stops at the water. It doesn't. Find him at a harbour.",'Find Corwin at any harbour');}
  // Corwin: the travelling face — at whichever port you land at when the story needs him
  const CORWIN={npc:null,site:null};
  function corwinLines(step,S){const g=etchedGateFor('gatelands'),m=etchedGateFor('mark'),a=etchedGateFor('aurenne');
    const sailed=TUT().sea&&TUT().sea.step==='done';
    if(step==='corwin')return {greet:sailed?"You came — and on your own deck, by the look of the salt on you. Good. I've been at three quays and they all say the same thing with different accents.":"You came. Good. I've been at three quays and they all say the same thing with different accents.",topics:[{label:'What did you find?',response:`Etching. The same hand, over the sigils — not clearing them, *writing over them*. It's on the home island — ${g?g.name:'an old gate'} — and the harbourmasters say the same of the Mark and Aurenne. I need someone to see all three. Not me: they know my face at the Compact.`},{label:"I'll go.",quest:true,fn:()=>{S.step='proof';const q=qFind('act2_corwin');if(q)qComplete(q);storyQuest('act2_proof','Proof from Three Islands','Corwin',`Three etched sigils, one on each island: ${g?g.name:'the home gate'} in the Gatelands, ${m?m.name:'a gate'} near Caer Slige in the Mark, ${a?a.name:'a gate'} near Fortargent in Aurenne. Stand in each. Then you'll understand the scale, and so will I.`,'Enter the three etched gates',{});return `${g?g.name:'The gate'} first; it's nearest. ${sailed?`Then the ${(worldState.ship&&worldState.ship.name)||'ship'} — you don't need the ferries.`:worldState.ship?'Then the ferries, or your own hull.':'Then the ferries. Or buy a hull and let me teach you the water on the way.'} Ask for me at whatever harbour you land at — I'll be the one arguing with the reeve.`;}}]};
    if(step==='proof')return {greet:"Still counting. Which have you seen?",topics:[{label:'Where am I with it?',get response(){const p=S.proof;return `${p.gatelands?'The Gatelands, yes.':'Not the Gatelands yet.'} ${p.mark?'The Mark, yes.':'Not the Mark.'} ${p.aurenne?'Aurenne, yes.':'Not Aurenne.'}`;}}]};
    if(step==='courier')return {greet:"Three. Then it's not a man with a chisel. Someone is *moving* what they take.",topics:[{label:'Moving it where?',response:`By sea. Every harbourmaster on the strait knows a black-sailed captain who pays in silver and asks no tithe — Oswy Blackhand, out of Port Blackhand in the Mark.${TUT().sea&&TUT().sea.step==='done'?" You've taken a black-sailed deck before; this one's the same, with a better captain.":''} He keeps a log. Captains like him always do; it's the only thing they're afraid of losing.`},{label:'And then?',response:"Then bring me the log, and we take it to whichever of them you trust — Caldric, Aldwyn, the Prior. I have opinions. Bring me the log first."}]};
    if(step==='ashfeld')return {greet:"You read it. So did I, over your shoulder — forgive me. 'The one who reads over my shoulder.' He wasn't writing to Varek.",topics:[{label:'Then who?',response:"I don't know. I know where he is. The Ashfeld. He always goes back to the Ashfeld. Whatever you decide there, decide it with your eyes open."}]};
    return {greet:"Go on. I'll be at the harbour.",topics:[]};}
  function tickCorwin(){const S=story();if(corwinInAshenmoor(S))return;const seaKey=(TUT().sea?TUT().sea.step:'none')+(tutSeaOpen()?'':'x');const early=S.act<2&&tutSeaOpen();if(!early&&(S.act<2||S.step==='root'||S.step==='end')){if(CORWIN.npc)removeCorwin();return;}
    // the nearest port within reach
    let best=null,bd=1e9;for(const t of SITES){if(t.kind!=='port')continue;const d=Math.hypot(px-t.x,pz-t.z);if(d<bd){bd=d;best=t;}}
    if(!best||bd>140){if(CORWIN.npc&&Math.hypot(px-CORWIN.npc.g.position.x,pz-CORWIN.npc.g.position.z)>220)removeCorwin();return;}
    const ckey=(early?'early':S.step)+'|'+seaKey;if(CORWIN.npc){if(CORWIN.step!==ckey||CORWIN.site!==best){removeCorwin();}else return;} // S439 — and at the harbour you are at: a passage to another kept him at the last one
    const q={x:best.x+3,z:best.z+3};const L=early?corwinEarly():corwinLines(S.step,S); // v80 S133 — on the plaza, not under the quay
    const def={name:'Corwin',role:'',ico:'📜',authored:true,people:'gatelander',sCol:0xe0b898,hairCol:0x3a2a1a,bodyScale:[1,1,1],bCol:0x3a4a5a,x:q.x-6,z:q.z+3,greeting:[L.greet],topics:[...L.topics,...tutCorwinTopics(),{label:'Farewell.',bye:true}]};def.temper='weary';
    const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(def.x,worldH(def.x,def.z),def.z);CORWIN.npc=n;CORWIN.site=best;CORWIN.step=ckey;}
  // S240 — while the merchant's own quest is his to give (Q3: available, active, or its reward owed) Corwin is in Ashenmoor,
  // where the journal sends you. Only the legacy village ever placed him there, so in the open world Q3 could not be taken.
  function corwinInAshenmoor(S){let due=false;try{due=S.act<2&&!tutSeaOpen()&&QUEST_DEFS.some(q=>q.giver==='Corwin'&&['available','active','reward'].includes(qState(q.id)));}catch(e){}
    if(!due){if(CORWIN.npc&&CORWIN.step==='ashenmoor')removeCorwin();return false;}const A=siteAnywhere('ashenmoor');if(!A)return false;
    if(Math.hypot(px-A.x,pz-A.z)>(A.pad||40)+180){if(CORWIN.npc)removeCorwin();return true;}
    if(CORWIN.npc&&CORWIN.step==='ashenmoor')return true;if(CORWIN.npc)removeCorwin();
    const src=(typeof NPC_DEF!=='undefined'&&NPC_DEF.find(n=>n.name==='Corwin'))||{name:'Corwin',role:'Traveling Merchant',ico:'\u{1F9F3}',greeting:['Just passing through.'],topics:[{label:'Safe travels.',bye:true}]};
    let x=A.x+6,z=A.z+4;for(let k=0;k<16;k++){const a=k*.785,r=5+Math.floor(k/8)*3,cx=A.x+Math.cos(a)*r,cz=A.z+Math.sin(a)*r;if(!solidAt(cx,cz)){x=cx;z=cz;break;}}
    const def=Object.assign({},src,{authored:true,people:'gatelander',x,z});def.temper='weary';
    const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(x,worldH(x,z),z);CORWIN.npc=n;CORWIN.site=A;CORWIN.step='ashenmoor';return true;}
  // before the commission: Corwin trading at the quays, with the sea to teach
  function corwinEarly(){const E=TUT().sea;const step=E?E.step:null;
    const greet=!E?"You again. Told you we'd cross paths. I've taken to the quays — there's more to buy on a harbour than in a village, and more to hear.":step==='done'?"The sailor. Go on — the tide won't wait and neither will I.":step==='report'?"You've the look of someone who's been shot at from a deck. Tell me.":"Still learning the water? Good. Nobody stops.";
    return {greet,topics:[{label:'What do you trade in, out here?',response:"Timber, rope, rumour. The rumour pays best. The harbourmasters say the marks in the old gates run on past the water — on the Mark, on Aurenne. I'd like to see that for myself, one day, with someone who can sail."}]};}
  function removeCorwin(){const n=CORWIN.npc;if(!n)return;sc.remove(n.g);sc.remove(n.dot);const k=npcs.indexOf(n);if(k>=0)npcs.splice(k,1);CORWIN.npc=null;}
  // entering an etched gate counts as proof
  function onEnterPortal(portal){const S=story();if(S.step!=='proof'||!portal)return;for(const nk of ['gatelands','mark','aurenne']){const g=S.gates[nk];if(g&&g.seed===portal.seed&&!S.proof[nk]){S.proof[nk]=true;showMsg(`${g.name}: the sigil is etched over. ${nk==='gatelands'?'One.':nk==='mark'?'Two.':'Three.'}`,'#e8d8a0');if(typeof addLog==='function')addLog('📖',`Proof: ${g.name} (${NATIONS[nk].name}).`);}}
    if(S.proof.gatelands&&S.proof.mark&&S.proof.aurenne){S.step='courier';const q=qFind('act2_proof');if(q)qComplete(q);storyQuest('act2_courier','The Courier','Corwin',"Three islands, one hand. Someone is carrying what the etching takes. Corwin will know who. Find him at a harbour.",'Find Corwin, then Oswy Blackhand at Port Blackhand',{});}}
  // Oswy Blackhand: a named pirate off Port Blackhand while the courier step is live; his log is in the captain's chest
  const OSWY={ship:null};
  function tickOswy(){const S=story();if(S.step!=='courier'){return;}const pb=anchoredPlaces().blackhand;if(!pb)return;if(Math.hypot(px-pb.x,pz-pb.z)>700)return;
    if(!OSWY.ship||!OTHER.includes(OSWY.ship)){const sd=pb.shore||[1,0];let x=pb.x+sd[0]*220,z=pb.z+sd[1]*220;for(let k=0;k<10&&worldH(x,z)>-4;k++){x+=sd[0]*40;z+=sd[1]*40;}const o=spawnOtherShip('pirate',x,z,'story:oswy');o.name="Oswy Blackhand's ship, the Kestrel";o.oswy=true;o.speed=0;o.wp={x,z};OSWY.ship=o;o.crew.forEach((e,i)=>{if(i===0){e.name='Oswy Blackhand';e.hp=e.maxHp=Math.round(e.maxHp*2);}});
      showMsg('Black sails, at anchor off Port Blackhand. She isn\u2019t going anywhere.','#ffb060');}
    const o=OSWY.ship;if(o.boarded&&o.chest&&!o.chest._log){o.chest._log=true;o.chest.items.unshift({name:"Oswy's Log",ico:'📕',type:'misc',weight:.4,sellMult:0,buyPrice:0,qty:1,story:'log'});}
    if(typeof BAG!=='undefined'&&BAG.some(it=>it.story==='log')&&S.step==='courier'){S.step='ashfeld';const q=qFind('act2_courier');if(q)qComplete(q);storyQuest('act2_ashfeld','The Ashfeld','Corwin',"The log is written to 'the one who reads over my shoulder.' Corwin will want to see it; then there is only one person left to ask, and he is always at the Ashfeld.",'Talk to Corwin, then go to the Ashfeld',{});}}
  // the Ashfeld: Varek and the choice
  const ASH={npc:null};
  function tickAshfeld(){const S=story();if(S.step!=='ashfeld'){if(ASH.npc)removeAsh();return;}const f=siteAnywhere('ashfeld');if(!f)return;if(Math.hypot(px-f.x,pz-f.z)>200){if(ASH.npc&&Math.hypot(px-f.x,pz-f.z)>400)removeAsh();return;}if(ASH.npc)return;
    const def={name:'Varek',role:'',ico:'✒',authored:true,people:'oldblood',sCol:0xd0c8c4,hairCol:0x0e0c0c,bodyScale:[.92,.96,.92],bCol:0x2a2a30,x:f.x+3,z:f.z-4,greeting:["You have his log. I know what it says; I've had letters like it for a hundred years. Sailors think someone is behind them. Someone is. It isn't me."],
      topics:[{label:'Then what are you doing to the sigils?',response:"Unwriting them. Every one I can reach. They built a cage and called it a loom, and the dead pay for its keeping. Take it apart, and the dead can stay. I've spent two hundred and fifty years at it, stone by stone. You've spent a season keeping it running, gate by gate, for coin. Did anyone ever tell you what it runs on?"},
              {label:'Stop. Leave the gates.',quest:true,fn:()=>{S.choice='stop';S.step='root';finishAsh();return "You'd have me leave it running. Then go and see what it runs on. The place beneath all the gates is on the far side of Aurenne, under the water. The Root. I'll be there before you, because I always am. Decide there.";}},
              {label:"I'll help you unbind it.",quest:true,fn:()=>{S.choice='help';S.step='root';finishAsh();return "Then there is one gate left that matters, and it isn't a gate. The Root, under the water off Aurenne's far shore. Everything runs back to it. Meet me there, and we'll take the last stone out with our hands.";}},
              {label:'Neither. I want to see it first.',quest:true,fn:()=>{S.choice='third';S.step='root';finishAsh();return "That's the first honest thing anyone has said to me on this field. The Root, then. Off Aurenne's far shore, under the water. Come and look, and then tell me what you see between us.";}},
              {label:'Farewell.',bye:true}]};def.temper='weary';
    const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(def.x,worldH(def.x,def.z),def.z);ASH.npc=n;showMsg('He is standing at the edge of the field, looking out.','#a0a8c0');}
  function finishAsh(){const q=qFind('act2_ashfeld');if(q)qComplete(q);const S=story();S.act=3;showMsg('Act III — What Was Bound','#e8d8a0');if(typeof addLog==='function')addLog('📖','Act III — What Was Bound. The Root, under the water off Aurenne\u2019s far shore.');storyQuest('act3_root','What Was Bound','Varek',"The place beneath all the gates. Under the water off Aurenne's far shore, on a rock in the east. You'll need to breathe down there, or a hull to reach it.",'Reach the Root and kill what guards it',{});}
  function removeAsh(){const n=ASH.npc;if(!n)return;sc.remove(n.g);sc.remove(n.dot);const k=npcs.indexOf(n);if(k>=0)npcs.splice(k,1);ASH.npc=null;}
  // the Root: when its beast is dead, Varek, and the ending
  const ROOTS={npc:null,done:false};
  function onLeavePortal(portal,cleared){if(portal&&cleared&&portal.lair){(worldState.masters||(worldState.masters={}))[portal.seed]=true;} // v80 — the master of a cavern dies once
    if(!portal||portal.seed!==9001)return;if(cleared){const S=story();S.rootCleared=true;showMsg('The Root is quiet. Something is standing at its mouth.','#a0a8c0');}}
  function tickRoot(){const S=story();if(S.step!=='root')return;const r=anchoredPlaces().root;if(!r)return;if(!S.rootCleared)return;if(ROOTS.npc)return;
    const c=S.choice;const def={name:'Varek',role:'',ico:'✒',authored:true,people:'oldblood',sCol:0xd0c8c4,hairCol:0x0e0c0c,bodyScale:[.92,.96,.92],bCol:0x2a2a30,x:r.x+3,z:r.z+4,greeting:["Here it is. The root of every gate. Put your hand on it and you'll feel them all — and you'll feel the other side. I've stood here a long time. When you look at me — what is between us?"],
      topics:[{label:'…',response:"You took too long to answer. That's the answer. Two hundred and fifty years. Every death written down. And I was the whole of your evening."},
              {label:'Break it. Let the world unbind.',quest:true,fn:()=>{ending('unbound');return "Then it comes down, all of it, and whatever is on the other side gets a new book to read. Your name goes in the first line. I'll be in the first gate, waiting to be found.";}},
              {label:'Seal it. Close the window.',quest:true,fn:()=>{ending('sealed');return "Then it narrows, and the reading stops, and the world is smaller and yours. My list has one line left in it, and I know whose.";}},
              {label:'Leave it open. Knowing.',quest:true,fn:()=>{ending('open');return "Stay, then. Knowing. That's more than any of us managed. Once in a long while someone will say a thing about you and go back to their bread, and you'll know what they meant. So will I.";}},
              {label:'Farewell.',bye:true}]};def.temper='weary';
    const n=spawnNPC(def,0,true);n.sched={type:'lost'};n.g.position.set(def.x,worldH(def.x,def.z),def.z);ROOTS.npc=n;showMsg('Varek is standing at the mouth of the Root.','#a0a8c0');}
  function ending(kind){const S=story();S.ending=kind;S.step='end';const q=qFind('act3_root');if(q){qComplete(q);q.turnedIn=true;}
    if(kind==='unbound'){worldState.unbound=true;try{localStorage.setItem('og_carry',JSON.stringify({name:typeof playerName!=='undefined'?playerName:'',people:worldState.people,look:worldState.look||null,item:(typeof BAG!=='undefined'&&BAG[0])?BAG[0]:null,seed:Date.now()%100000}));}catch(e){}}
    if(kind==='open'){worldState.knowing=true;}
    if(typeof addLog==='function')addLog('📖',kind==='unbound'?'The Root broken. The world unbinds; a new book begins.':kind==='sealed'?'The Root sealed. The window narrows.':'The Root left open, knowing.');
    setTimeout(()=>endingScreen(kind),1500);}
  function endingScreen(kind){const text=kind==='unbound'?['THE LOOM RELEASED','Everything held comes loose, gently, the way a hand opens. Somewhere a new coast is being drawn, with your name in the first line of it.','A new world waits at the title screen — the same name, the same people, one thing carried through.']:kind==='sealed'?['THE WINDOW NARROWED','The reading stops. The stones go cold for good. The world is smaller, and safe, and yours.','Varek\u2019s list has its last line.']:['LEFT OPEN, KNOWING','The sigils warm again. Magic deepens. The world lives watched, and lives anyway.','Once in a long while, someone will say one of the three descriptions to you, and go back to their bread.'];
    try{const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;background:rgba(6,4,2,.96);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#e8dcc0;font-family:Georgia,serif;text-align:center;padding:40px';ov.innerHTML=`<div style="font-size:34px;letter-spacing:.25em;margin-bottom:18px">${text[0]}</div><div style="max-width:640px;font-size:17px;line-height:1.6;color:#c8b890">${text[1]}</div><div style="max-width:640px;font-size:14px;line-height:1.6;color:#8a7a60;margin-top:16px">${text[2]}</div><button style="margin-top:34px;padding:10px 22px;background:#3a2a16;color:#f0e2c0;border:1px solid #8a6a3a;border-radius:4px;cursor:pointer;font:15px Georgia,serif">Go on</button>`;ov.querySelector('button').onclick=()=>ov.remove();document.body.appendChild(ov);}catch(e){}}
  function tickStory(){if(activeZoneId!=='world')return;const S=story();if(S.act<2&&storyBegun())beginActII();tickTut();try{tickRival();tickFactionKinds();tickSieges();}catch(e){console.warn('story tick',e);}if(S.act<2){tickCorwin();return;}tickCorwin();tickOswy();tickAshfeld();tickRoot();}

  // ═══ BUILD / ENTER / TICK ════════════════════════════════════════════
  function build(){
    if(sc)return sc;
    sc=new THREE.Scene();
    sc.background=new THREE.Color(BIOME_PROFILES.plains.bgCol);
    sc.fog=new THREE.FogExp2(BIOME_PROFILES.plains.fogCol,.004);
    terrainTex=makeTerrainTex();terrainTex.repeat.set(CHUNK/4,CHUNK/4);
    terrainMat=new THREE.MeshLambertMaterial({map:terrainTex,vertexColors:true});
    buildProtos();
    buildLights();buildSky();buildWater();
    ZONES.world={scene:sc,sol:STATIC_SOL,solidFn:solidAt,npcs,enemies:[],gates:[],size:SIZE*GRID,portals,herbs:[],houses:[],getY:groundY,platforms:[],_cfg:{id:'world',size:SIZE*GRID,seed:SEED}};
    // the home cell now (everything the spawn needs); neighbours stream in via jobs
    loadCell(HOME_I,HOME_J);
    restoreShip();
    ZONES.world.beds=beds;
    if(!worldState.wdisc)worldState.wdisc={};
    if(!worldState.wcleared)worldState.wcleared={};
    sc.userData.dayNight={isLocked:true};
    return sc;
  }
  function bindZone(){
    scene=sc;ZE=ZONES.world.enemies;ZB=[];PORTALS=portals;
  }
  function enter(sx,sz,y,label){
    const go=()=>{
      _clearInteractPrompt();
      blocking=false;staggered=[];
      lid='overworld';currentHouse=null;activeZoneId='world';
      build();bindZone();
      // Null coords = the default spawn, which build() derives from the road.
      if(sx==null){sx=spawn.x;sz=spawn.z;y=spawn.yaw;}
      px=sx;pz=sz;yaw=y||0;pitch=0;velY=0;onGround=true;
      tickCells(0,true);stream(px,pz,true); // the destination cell (and its statics) load synchronously behind the fade
      tickSettlements(0,true);
      freeSpot();
      jumpY=worldH(px,pz);
      atmosphere(10);
      showZoneName(label||'🌍 The open country');
      const fb=document.getElementById('fbtn');if(fb)fb.style.display='block';
      if(typeof saveGame==='function')saveGame();
    };
    if(typeof doFade==='function')doFade(go);else go();
  }
  function tick(dt,now){
    if(activeZoneId!=='world'||!sc)return;
    tickCells(dt,false);runJobs();
    tickLightPool(dt);tickWeather(dt);tickSmoke(dt);tickShip(dt);tickSailTrim(dt);tickBehaviours(dt);cabinUpdate();tickSchoolCool(dt);tickWhales(dt,now||performance.now());tickBoarding(dt);tickHullCollisions(dt);tickOtherShips(dt,now||performance.now());tickCrew();tickSharks();tickFish(dt,now||performance.now());tickGulls(dt,now||performance.now());tickDolphins(dt,now||performance.now());
    stream(px,pz,false);
    houseLod();
    atmosphere(dt);
    tickSettlements(dt,false);
    tickTownNPCs(dt,now||performance.now());try{tickCrime(dt,now||performance.now());}catch(e){}
    tickChatter(dt);
    ensureTaskWorldObjects();tickPickups();qTick();
    tickHerbSync(dt);tickAshenmoorStory();tickProsperity();tickRents();tickDatedWork();tickCaravans(dt);tickCoaches(dt);tickStory();try{tickDuel(dt);}catch(e){console.warn('duel',e);}tickSiteDeaths();tickVarek(dt);sweepLights();
    tickCleared();
    tickDiscovery(dt);
  }
  function restore(sx,sz,y){
    try{anchoredPlaces();}catch(e){}
    build();activeZoneId='world';bindZone();
    px=sx;pz=sz;yaw=y||0;
    tickCells(0,true);stream(px,pz,true);
    tickSettlements(0,true);
    freeSpot();
    atmosphere(10);
    showZoneName('🌍 The open country');
  }
  // If the player is standing inside a trunk/rock/door, spiral outward to
  // the nearest open ground (also used on save restore, since scatter can
  // change between builds).
  function freeSpot(){
    if(!solidAt(px,pz))return;
    for(let r=1;r<=12;r+=1)for(let k=0;k<12;k++){
      const a=k/12*Math.PI*2,tx=px+Math.cos(a)*r,tz=pz+Math.sin(a)*r;
      if(!solidAt(tx,tz)&&worldH(tx,tz)>1){px=tx;pz=tz;return;}
    }
  }
  function setRadius(n){RADIUS=Math.max(1,Math.min(8,n|0));lastCX=null;lastCZ=null;if(sc)stream(px,pz,true);}
  // Where is everything — for the devlog / console.
  function gazetteer(){
    const out={sites:SITES.map(t=>`${t.name} (${t.kind}) ${t.x|0},${t.z|0}`),dungeons:[]};
    CELL_DOORS.forEach(e=>{const w=dungeonWorldPos[e.seed];if(w)out.dungeons.push(`${e.canonicalName||('#'+e.seed)} [${e.theme}/${e.diff}${e.kind==='fort_door'?'/fort':''}] ${w.x|0},${w.z|0}`);});
    return out;
  }

  function devUnlockAll(){if(!worldState.wdisc)worldState.wdisc={};let n=0;for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){const c=getCell(i,j);c.sites.forEach(t=>{if(t.kind==='portal'||t.pad<0)return;if(!discovered(t.id)){worldState.wdisc[t.id]=true;n++;}});c.doors.forEach(e=>{if(!e.wet&&!discovered('door_'+e.seed)){worldState.wdisc['door_'+e.seed]=true;n++;}});c.peaks.forEach(p=>{if(!discovered(p.id)){worldState.wdisc[p.id]=true;n++;}});c.lakes.forEach(l=>{if(!discovered(l.id)){worldState.wdisc[l.id]=true;n++;}});}if(typeof showMsg==='function')showMsg(`Unlocked ${n} places across the continent.`,'#e8d8a0');return n;}
var WORLD={SIZE,innTopics,CARGO_GOODS,startTile,tileStep,withCellData,ridgeAt,routeWorld,get routed(){return RV;},movedPlaceAt,rvSpines,spinePeaks,basinAt,riverSample,cargoItem,ferryTopics,ferryPrice,shipRaiseCost,compactRefit,mapEntries,restoreShip,seaState,openWater,spawnShip,shipBarsUI,shipBars,shipWear,shipSpeedNow,shipMendCost,upgradeTopics,tickHullCollisions,volley,get boarders(){return BOARDERS;},cargoNation,cargoWorld,cargoBlockaded,cargoAsk,cargoBid,cargoBuy,cargoSell,cargoRows,cargoBoard,cargoTopic,holdCap,holdUsed,duelKill,duelDown,get duel(){return DUEL;},tickDuel,get rival(){return RIVAL;},liveRumours,shipTrim,windDir,smokeWant,smokeLegacy,shellWalls,shellFrame,get smoke(){return SMOKE;},windowView:windowTexture,townGateGeo,CHUNK,SEA_Y,GRID,MASK,wxAudio,get sky(){return SKY;},footprint:fpWalk,get footprints(){return FP;},get wx(){return WX;},chunkList(){return [...chunks.values()];},dominant(){return dominantRegion(px,pz).r.biome;},get scene(){return sc;},intDoorInteract,intDoorPrompt,get intDoors(){return INT_DOORS;},get intNpcs(){return INT_NPCS;},drawLocalMap,BLD,directionTopics,compassWord,get way(){return WAY;},set way(v){WAY=v;},get settle(){return SETTLE;},devUnlockAll,tutLeads,camSolid,devSurvey,get tut(){return TUT();},siteAnywhere,get jobs(){return JOBS;},CULTURES,shipInteract,shipPrompt,isSwimming,buyShip,get ship(){return SHIP;},diveTick,get dive(){return DIVE;},get others(){return OTHER;},despawnOtherShip,get STATIC_SOL(){return STATIC_SOL;},rainIndoor(m){WX.indoorMul=m;if(WX.rainG&&activeZoneId!=='world'){WX.rainG.gain.value+=(0-WX.rainG.gain.value)*.08;}},compassPlaces,cellarFor,doorAnywhere,doorAnywhere,spawnOtherShip,boardOther,allPorts,ferryTo,lordFor,nationOf,nationKeyOf,PEOPLES,NATIONS,NAMES,peopleOfSite,haltLines,yieldLines,guildGreet:GUILD_GREET,playerPeople,TS,prosperity,favor,addFavor,setProsperity,flag,stateLine,townCard,routes,coaches,coachInteract,compassMarkers,tickBehaviours,get arrows(){return ARROWS;},story,beginActII,onEnterPortal,onLeavePortal,etchedGateFor,canonicalGateName,get coachLines(){return COACHES;},FACTIONS,fstate,anchoredPlaces,get caravans(){return CARAVANS;},get wrecks(){return WRECKS;},nearestSigilDoor,onMasteryTouch,sigilDoors,GODS,priceMulAt(id){const t=SITE[id];return t&&(t.kind in BASE_P)?priceMul(t)*factionPriceMul(t):1;},priceMulHere(){let best=null,bd=1e9;for(const t of SITES){if(!(t.kind in BASE_P))continue;const d=Math.hypot(px-t.x,pz-t.z);if(d<t.pad+40&&d<bd){bd=d;best=t;}}return best?priceMul(best)*factionPriceMul(best):1;},mirrorLight,regLight,unregLight,sweepLights,seaBare,nearNpcName,get lightSources(){return LSRC;},get quests(){return QJ();},townQuestFor,qTurnIn,cargoBonus,catchFish,get whales(){return WHALES;},get boarders(){return BOARDERS;},get fish(){return LIFE.fish;},get herbLod(){return {list:HERB_IMS,lod:HERB_LOD};},treeProtos(){return PROTO;},houseProto(key,w,d,seed,opts){const r=pRng(seed>>>0);const st=STYLE[key];opts=Object.assign({chimney:true,twoStory:null},opts||{});const hi=buildingGeo(w,d,st,r,opts);return {hi,lo:hi.userData.lo,variant:hi.userData.variant,winTop:hi.userData.winTop,eaveLow:hi.userData.eaveLow,thatch:hi.userData.thatch};},houseStyles(){return Object.keys(STYLE);},poiPreview,poiGeo(k){return k==='tower'?towerGeoHi(38,4.6):k==='shrine'?shrineGeoHi():cragGeo(2,1);},furnProto(k,seed){const r=pRng(seed>>>0);const f={well:()=>wellGeo(),stall:()=>stallGeo(r),tent:()=>tentGeo(r),ruin:()=>ruinGeo(r),stone:()=>standingStoneGeo(r)}[k];const hi=f();return {hi,lo:hi.userData.lo};},civicProto(kind,w,d){const f=kind==='church'?churchGeo:keepGeo;const hi=f(w,d,STYLE.stone,Math.random);return {hi,lo:hi.userData.lo};},treeMix(){return TREE_MIX;},shipBake,boatBake,SHIP_MAT,boatBake,buildShipMesh,bedInteract,bedPrompt,hatchPrompt,hatchInteract,lootPrompt,lootInteract,get intLoot(){return INT_LOOT;},boxPrompt,boxInteract,boxCoins,get intBox(){return INT_BOX;},doorLockNow,doorLockFor,doorPicked,refusesTrade,bountyAt,tickCrimeDay,witnessOf,intSightLine,intClearLine,tickCrime,strikeNpc,guardKilled,guardsOf,guardDraw,dispatchGuard,get guardSent(){return CR.sent;},penanceTopics,nationRecord,factionTopics,guestPrompt,guestInteract,guestChapelHouse,noteDeath,noteSessionGap,tickRealClock,get varek(){return vstate();},fieldFor,varekDue,HOME_I,HOME_J,getCell,cellOf,LOADED,DOORS:CELL_DOORS,REGIONS,SITES,SITE,ROAD_DEFS,STAMPS,PEAKS,LAKES,RIVERS,buildInteriorFor,shopClosedNow,npcInsideNow,drawMinimap,drawLocalMap,tickInterior,interiorTalk,guild:{onKill,onHarvest,onTalk,onEnterInterior,onCast,state:gstate,rankOf,GUILD_DEF},worldH,rawH,baseH,landH,roadInfo,bridgeGeo,buildSiteGeo,fortKeepGeoHi,wreckGeo,coachGeo,rockProto,lampPostGeo,doorLanternGeo,tradeSignGeo,signpostGeo,nameBoardGeo,loadCell,unloadCell,wallSegHi,gateTowerHi,quayGeoHi,breakwaterHeap,netHeapGeo,openMap,closeMap,fastTravel,discover,discovered,arrivalFor,regionWeights,dominantRegion,addStamp,build,enter,restore,tick,solidAt,setRadius,gazetteer,genSettlement,pickSeen,disposeSettlement,get settlements(){return SETTLE;},
          get scene(){return sc;},get chunks(){return chunks;},get portals(){return portals;},get cleared(){return cleared;},get roads(){return ROADS;},get dungeonPos(){return dungeonWorldPos;}};
