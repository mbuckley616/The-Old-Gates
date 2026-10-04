  // ── v80 S147: footprints ──
  // A ring of flat marks dropped as you walk on snow, fading as the cover does. One material each so
  // they can fade independently; they are re-used round-robin, so the cost is fixed.
  const FP={pool:[],i:0,last:null,side:1,max:48};
  function fpEnsure(){
    if(FP.pool.length)return;
    const geo=new THREE.PlaneGeometry(.15,.30);geo.rotateX(-Math.PI/2);
    for(let k=0;k<FP.max;k++){
      const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x5f6b78,transparent:true,opacity:0,depthWrite:false}));
      m.visible=false;m.userData.t=0;m.renderOrder=2;sc.add(m);FP.pool.push(m);
    }
  }
  function fpDrop(){
    fpEnsure();const m=FP.pool[FP.i];FP.i=(FP.i+1)%FP.max;
    const s=Math.sin(yaw),c=Math.cos(yaw);
    const ox=c*.19*FP.side,oz=-s*.19*FP.side;FP.side*=-1;
    m.position.set(px+ox,worldH(px+ox,pz+oz)+.035,pz+oz);m.rotation.y=yaw;
    m.userData.t=1;m.material.opacity=.5;m.visible=true;
  }
  function tickFootprints(dt){
    if(!FP.pool.length)return;
    for(const m of FP.pool){if(!m.visible)continue;
      m.userData.t-=dt/26;                      // a print lasts under half a minute
      const o=Math.max(0,m.userData.t)*.5*Math.min(1,WX.cover*2.2); // and goes with the snow it was made in
      m.material.opacity=o;if(o<=.01)m.visible=false;}
  }
  function fpWalk(){ // called from the footstep beat
    if(activeZoneId!=='world'||lid!=='overworld')return false;
    if(WX.cover<.18)return false;
    const p=FP.last;if(p&&Math.hypot(px-p.x,pz-p.z)<.55)return true;
    FP.last={x:px,z:pz};fpDrop();return true;
  }
  function snowRepaintStep(){
    if(!WX.coverQ||!WX.coverQ.length)return;
    // S177 — two chunks a frame (was six): a chunk costs about a millisecond, and a town's hundred or so are still done inside a second
    let n=0;while(WX.coverQ.length&&n<2){const ch=WX.coverQ.pop();if(ch&&ch.terrain)recolourChunk(ch);n++;}
  }
  function recolourChunk(ch){
    const geo=ch.terrain,pa=geo.attributes.position,col=geo.attributes.color;const ox=ch.cx*CHUNK,oz=ch.cz*CHUNK;const c=_tmpC;
    for(let i=0;i<pa.count;i++){const x=pa.getX(i)+ox+CHUNK/2,z=pa.getZ(i)+oz+CHUNK/2;const h=pa.getY(i);
      groundColor(x,z,h,slopeNormalY(x,z),c);col.setXYZ(i,c.r,c.g,c.b);}
    col.needsUpdate=true;
  }
  // S330 (Michael's 1, #57) — the world's wind: the way it blows, (sin, cos) in the world. It is read off the absolute
  // clock, so it is the same after a load and needs no save: three slow swells over 9–53 game hours, and in a storm a
  // gusting swing of a few seconds on top. Look only: nothing's speed reads it.
  function windDir(){const t=(worldState.gameTimeAbsMinutes||0)/60,P=2*Math.PI;
    let w=1.3+1.2*Math.sin(t*P/53+.4)+.9*Math.sin(t*P/21+1.9)+.25*Math.sin(t*P/9+.7);
    const st=WX.storm||0;if(st>0)w+=st*(.22*Math.sin(t*60*P/.07)+.12*Math.sin(t*60*P/.031+1.3));
    return w;}
  // S343 (Michael's B on #63) — chimney smoke on the world's wind. A town's smoke is one Points object: 24 puffs a chimney on a
  // ten-second life that rise, drift downwind along windDir(), swell from .5 to 3.3 across and fade; a storm shortens the life and
  // lays the plume flat, so the puffs stay close enough to read as one plume. By the hearth's hours: the inn, the smithy and the
  // guild halls always; homes 6–9 and 17–23 in full, a thin thread 9–17, cold at night; every chimney at every hour in snow or
  // the tundra. Positions are relative to the town's centre (float32 on the GPU, see CLAUDE.md).
  const SMOKE={K:24,L:10,t:0,mat:null};
  function smokeMat(){if(SMOKE.mat)return SMOKE.mat;const cv=document.createElement('canvas');cv.width=cv.height=64;const cx=cv.getContext('2d');let sd=7;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
    for(let k=0;k<5;k++){const ox=32+(r()-.5)*18,oy=32+(r()-.5)*18,gr=cx.createRadialGradient(ox,oy,0,ox,oy,22);gr.addColorStop(0,'rgba(255,255,255,.8)');gr.addColorStop(1,'rgba(255,255,255,0)');cx.fillStyle=gr;cx.fillRect(0,0,64,64);}
    return SMOKE.mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:true,
      uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:new THREE.CanvasTexture(cv)},tint:{value:new THREE.Color(0xb8b4ae)},scale:{value:770}}]),
      vertexShader:'attribute float aSize;attribute float aAlpha;varying float vA;uniform float scale;\n#include <fog_pars_vertex>\nvoid main(){vA=aAlpha;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*scale/max(.1,-mvPosition.z);gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader:'uniform sampler2D map;uniform vec3 tint;varying float vA;\n#include <fog_pars_fragment>\nvoid main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(tint,t.a*vA);\n#include <fog_fragment>\n}'});}
  function smokeFor(S){const N=S.chimneys.length*SMOKE.K,geo=new THREE.BufferGeometry(),seed=new Float32Array(N);let sd=(String(S.site.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7)%2147483646)+1;
    for(let i=0;i<N;i++){sd=(sd*16807)%2147483647;seed[i]=sd/2147483647;}
    geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));geo.setAttribute('aSize',new THREE.BufferAttribute(new Float32Array(N),1));geo.setAttribute('aAlpha',new THREE.BufferAttribute(new Float32Array(N),1));
    const pts=new THREE.Points(geo,smokeMat());pts.position.set(S.site.x,0,S.site.z);pts.frustumCulled=false;pts.renderOrder=2;pts.userData.seed=seed;pts.userData.smoke=true;pts.visible=false;S.smoke=pts;S.group.add(pts);return pts;}
  // S345 — a chimney's world position from the placed house (its geometry's chimney top in the house's frame)
  function chimneyAt(geo,o,t){const q=geo.userData&&geo.userData.chimney;if(!q)return null;const c=Math.cos(o.rotation.y),s=Math.sin(o.rotation.y);return {x:o.position.x+q[0]*c+q[2]*s,y:o.position.y+q[1],z:o.position.z-q[0]*s+q[2]*c,t:t||'home',k:0};}
  // how hard a chimney smokes now, 0–1
  function smokeWant(c,h,cold){if(cold||c.t==='inn'||c.t==='weapon'||c.t==='armor'||c.t==='guild_f'||c.t==='guild_m')return 1;
    return (h>=6&&h<9)||(h>=17&&h<23)?1:(h>=9&&h<17)?.3:0;}
  // S354 — a legacy village (its own scene, where WORLD.tick does not run) keeps its chimneys on the scene; the main loop
  // calls this while it is the active scene. Positions are the scene's own, so the Points sit at its origin.
  function smokeLegacy(dt,vs){let S=vs.userData.smokeS;if(!S){S=vs.userData.smokeS={site:{id:'legacy_'+(vs.userData.chimneys.map(c=>c.x.toFixed(1)).join()),x:0,z:0},chimneys:vs.userData.chimneys,group:vs};smokeFor(S);}tickSmoke(dt,[S]);return S;}
  function tickSmoke(dt,list){SMOKE.t+=dt;const h=gameHour(),storm=WX.storm||0,snow=WX.type==='snow'||(WX.next==='snow'&&WX.k>.5),w=windDir(),wx=Math.sin(w),wz=Math.cos(w);
    const drift=.45+1.2*storm,L=SMOKE.L/(1+2*storm),K=SMOKE.K,rise=.38/(1+drift*.4),grow=1+.5*storm;
    if(SMOKE.mat)SMOKE.mat.uniforms.tint.value.setHex(h>=20.5||h<5.5?0x4a4c56:h>=17.5?0x9a8a84:h<7?0x8a8a90:0xb8b4ae);
    const all=list||[...SETTLE.values()];if(!list)for(const C of COACHES.values())if(C.smokeS)all.push(C.smokeS);
    for(const S of all){const P=S.smoke;if(!P)continue;const far=Math.hypot(S.site.x-px,S.site.z-pz)>300;P.visible=!far;if(far)continue;
      const pos=P.geometry.attributes.position.array,size=P.geometry.attributes.aSize.array,al=P.geometry.attributes.aAlpha.array,seed=P.userData.seed,cold=snow||S.tundra,ox=S.site.x,oz=S.site.z;
      for(let ci=0;ci<S.chimneys.length;ci++){const c=S.chimneys[ci];c.k+=(smokeWant(c,h,cold)-c.k)*Math.min(1,dt*.5);
        for(let k=0;k<K;k++){const i=ci*K+k;if(c.k<.01){al[i]=0;continue;}const a=((SMOKE.t/L+k/K+seed[i]*.05)%1),t=a*SMOKE.L,wob=Math.sin(t*1.3+seed[i]*20)*.12*a,d=drift*Math.pow(a*L,1.25);
          pos[i*3]=c.x-ox+wx*d+wz*wob;pos[i*3+1]=c.y+.1+rise*t;pos[i*3+2]=c.z-oz+wz*d-wx*wob;
          size[i]=(.5+2.8*a)*(.55+.45*c.k)*grow;al[i]=Math.min(1,a*6)*Math.pow(1-a,1.3)*.9*c.k;}}
      P.geometry.attributes.position.needsUpdate=P.geometry.attributes.aSize.needsUpdate=P.geometry.attributes.aAlpha.needsUpdate=true;}}
  function tickWeather(dt){
    snowRepaintStep();tickFootprints(dt);
    const inWorld=activeZoneId==='world'&&lid==='overworld';
    // choose / transition
    // v80 S450 — weather carried into a cell that could never roll it (snow off the Mark's border, or a ship's snow
    // brought into the Gatelands) is rolled again there, and blends out as any change does. A timer past the roll's
    // own 330 s is a weather held on purpose (the tests'), and is left alone.
    if(inWorld){const c=cellOf(px,pz),ck=c[0]+','+c[1];if(ck!==WX.cell){const moved=WX.cell!=null;WX.cell=ck;if(moved&&WX.timer<=330){const w=weatherWeights();if(!(w[WX.type]>0)||!(w[WX.next]>0)){WX.timer=0;WX.rerolls=(WX.rerolls||0)+1;}}}}
    WX.timer-=dt;
    if(WX.timer<=0){WX.timer=150+Math.random()*180;WX.next=pickWeather();if(WX.next!==WX.type)WX.k=0;}
    if(WX.next!==WX.type){WX.k+=dt/25;if(WX.k>=1){WX.type=WX.next;WX.k=0;}}
    const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?WX.k:0;
    const inten=t=>t==='rain'?.7:t==='storm'?1:t==='snow'?.8:t==='fog'?.6:t==='overcast'?.35:0;
    WX.intensity=inten(cur)*(1-mix)+inten(nxt)*mix;
    const rainAmt=(cur==='rain'||cur==='storm'?1:0)*(1-mix)+(nxt==='rain'||nxt==='storm'?1:0)*mix;
    const snowAmt=(cur==='snow'?1:0)*(1-mix)+(nxt==='snow'?1:0)*mix;
    const storm=(cur==='storm'?1:0)*(1-mix)+(nxt==='storm'?1:0)*mix;WX.storm=storm;WX.wind=windDir();
    ensureWx();
    // particles follow the camera
    const upd=(pts,amt,fall,drift,wrapH)=>{
      if(!pts)return;pts.visible=inWorld&&amt>.02;if(!pts.visible)return;
      const p=pts.geometry.attributes.position.array,v=pts.userData.v;const n=p.length/3;const cx=px,cy=jumpY+8,cz=pz;
      const shown=Math.floor(n*amt);pts.geometry.setDrawRange(0,shown);
      for(let i=0;i<shown;i++){p[i*3+1]-=fall*v[i]*dt;p[i*3]+=drift*dt*(0.5+Math.sin(i)*.5);
        if(p[i*3+1]<cy-wrapH){p[i*3+1]+=24;p[i*3]=cx+(Math.random()-.5)*44;p[i*3+2]=cz+(Math.random()-.5)*44;}
        if(Math.abs(p[i*3]-cx)>22)p[i*3]=cx+(Math.random()-.5)*44;if(Math.abs(p[i*3+2]-cz)>22)p[i*3+2]=cz+(Math.random()-.5)*44;}
      pts.geometry.attributes.position.needsUpdate=true;
    };
    // v80 S146 — strength where you stand
    const sRain=wxLocal('rain'),sSnow=wxLocal('snow'),sFog=wxLocal('fog'),cold=wxLocal('cold');
    WX.sRain=sRain;WX.sSnow=sSnow;WX.sFog=sFog;WX.cold=cold;
    const rainShown=Math.min(1,rainAmt*.62*sRain),snowShown=Math.min(1,snowAmt*.58*sSnow);
    upd(WX.rain,rainShown,26,1.5,12);upd(WX.snow,snowShown,2.2,1.2,12);
    // snow settles on the ground while it falls, and goes off again when it stops — slowly where it is cold
    if(inWorld){
      const falling=snowAmt*sSnow;
      const floor=cold>=.85?.30:0; // the far north keeps a covering of its own
      if(falling>.08)WX.cover+=dt*(.009*Math.min(1.6,falling)*(.45+cold)); // a couple of minutes to lie thick
      else WX.cover-=dt*(.016*(1.25-cold));
      WX.cover=Math.max(floor,Math.min(1,WX.cover));
      if(Math.abs(WX.cover-WX.coverPainted)>.045)snowRepaint();
    }
    // lightning
    WX.flashT-=dt;
    if(inWorld&&storm>.5&&WX.flashT<=0){WX.flashT=6+Math.random()*14;WX.flash=.14;thunder(.4+Math.random()*2.2);}
    if(WX.flash>0){WX.flash-=dt;}
    // sound is ticked from the main loop now (wxAudio), so it keeps fading when you step inside
  }
  // v80 S145 — the loudness of the weather, and how much of it reaches you.
  // The world tick only runs in the open world, so the gain used to freeze at whatever it was when you
  // left: a downpour followed you into a house or a cave at full volume. This runs every frame instead.
  function wxAudio(dt){
    rainLoop(true);if(!WX.rainG)return;
    const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?WX.k:0;
    const amtOf=t=>(cur===t?1:0)*(1-mix)+(nxt===t?1:0)*mix;
    const rainAmt=amtOf('rain'),stormAmt=amtOf('storm'),snowAmt=amtOf('snow');
    const open=activeZoneId==='world'&&lid==='overworld';
    const inside=(typeof isInterior==='function'&&isInterior());
    const mul=open?1:inside?.22:(activeZoneId==='dungeon')?.05:.3; // muffled through a wall, all but gone underground
    const target=(rainAmt*.055*(WX.sRain||1)+stormAmt*.075*(WX.sRain||1)+snowAmt*.012*(WX.sSnow||1))*mul; // rain was .11 flat: too loud in the open
    WX.rainG.gain.value+=(target-WX.rainG.gain.value)*Math.min(1,dt*(target<WX.rainG.gain.value?3.5:2));
    // snow is a breath of wind, not a hiss: the same noise, filtered low
    if(WX.rainF){const snowy=snowAmt>(rainAmt+stormAmt);
      const f=snowy?380:2600,q=snowy?.25:.5;
      WX.rainF.frequency.value+=(f-WX.rainF.frequency.value)*Math.min(1,dt*1.2);WX.rainF.Q.value=q;}
  }
  // called from atmosphere() after the day/night targets are computed
  function applyWeather(){
    const I=WX.intensity;if(I<=0&&!(WX.flash>0))return;
    const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?WX.k:0;
    const col=(t)=>_tmpWx.setHex(WX_COL[t]||0x8a8f96);
    _tmpWx2.copy(col(cur));if(mix>0)_tmpWx2.lerp(col(nxt),mix);
    const night=(typeof _nightFactor==='function')?_nightFactor():0;
    _atm.sky.lerp(_tmpWx2,I*.85);
    // fog colour: the weather's grey by day, a dim blue-grey at night (never black — fogged things must still read)
    _tmpWx.setHex(0x2c3440).lerp(_tmpWx2,.35);_atm.fog.lerp(night>.5?_tmpWx:_tmpWx2,I*.85);
    // visibility: a storm roughly halves the view; fog closes it right down. v80 S145 — fog was 2.2x a
    // biome density of ~.008, which is barely a haze; it now also carries a floor so it reads anywhere.
    const foggy=(cur==='fog'?1:0)*(1-mix)+(nxt==='fog'?1:0)*mix;
    const sFog=WX.sFog||1; // v80 S146 — a fen fogs harder than a downland
    const fogK=(1.2+foggy*5.0)*sFog;WX.fogMul=1+I*fogK*(1-night*.35);
    WX.fogFloor=foggy*(night>.5?.020:.028)*sFog; // ~35-50 steps of sight in the thick of it
    WX.sunMul=1-I*(.55+foggy*.18);
    if(WX.flash>0){_atm.sky.setHex(0xe8eefc);_atm.fog.lerp(_tmpWx.setHex(0xdde6f4),.6);WX.sunMul=2.2;}
  }
  const _tmpWx=new THREE.Color(),_tmpWx2=new THREE.Color();
  window.devWeather=function(t){if(!t)return WX.type+(WX.next!==WX.type?' → '+WX.next:'');WX.next=t;WX.k=0;WX.timer=240;return 'weather → '+t;};

  // ═══ INTERIORS II (Session G) ════════════════════════════════════════
  // Beds have owners: 'inn' (rent a room for the night, 5–25 gold), 'home'
  // (yours only if you own the house), 'guild' (members only), 'free'
  // (camps, fort cots, your ship). Houses can be bought from their
  // resident. Larger buildings have an instanced cellar under a floor
  // hatch. Interior windows are painted backdrops that follow the clock.
  function ownedHouse(id){return !!(worldState.owned&&worldState.owned[id]);}
  function rentedNow(id){const r=worldState.rented;if(!r||r.id!==id)return false;return (worldState.gameTimeAbsMinutes||0)<r.until;}
  // v80 S141 — you rent a room, not the inn. The interior's width comes from the footprint, so the
  // room count is known without going in; the other doors belong to other people.
  // v80 S237 — the innkeeper's own business, a meal and a room (was inline in the town builder; the coaching inn shares it)
  // v80 S442 — the innkeeper lets the rooms in the house's people's voice (quest review run 6, Finding 7, as written);
  // no row is the Markish text unchanged
  const INN_ROOM_LINES={
    gatelander:{
      made:'Your room’s made up already, and the bed’s getting no warmer for the waiting. Upstairs.',
      madeNamed:R=>`${R}, made up already. The key’s in the door, where a key does the most good.`,
      empty:'The house is empty tonight, and an empty house is a cold one, so you’re doubly welcome.',
      one:'There’s one other guest in tonight.',
      many:n=>`There’s ${n} guests in tonight.`,
      offer:(o,p,r)=>`${o} A room is ${p} gold — ${r}, a bed, a bolt on the door, and breakfast if you’re up for it. Will I make it up for you?`,
      full:'Every room’s taken tonight, and two strangers in the one room never made a friend of either. The fire’s free, and the chair by it.',
      poor:(p,g)=>`That’s ${p} gold, and you’ve ${g}. A purse is like a well: you’ll not draw from it what isn’t in it. Come back when it’s filled.`,
      paid:(p,R)=>`${p} gold, and thank you. ${R}, up the stairs, and yours till this time tomorrow. The other doors aren’t mine to open, nor yours either.`,
      not:'The road’s long and the night’s longer. The fire’s free, if you change your mind.'},
    markman:{
      made:'Your room’s made up already. Upstairs.',
      madeNamed:R=>`${R} — made up already. The key’s in the door.`,
      empty:'The house is empty tonight.',
      one:'One other guest in tonight.',
      many:n=>`${n} guests in tonight.`,
      offer:(o,p,r)=>`${o} A room is ${p} gold — ${r}, a bed, a bolt on the door, and breakfast if you’re up for it. Shall I make it up?`,
      full:'Every room’s taken tonight, and I’ll not put two strangers in one. The fire’s free.',
      poor:(p,g)=>`That’s ${p} gold, and you’ve ${g}. Come back with it.`,
      paid:(p,R)=>`${p} gold, thank you. ${R}, up the stairs — yours till this time tomorrow. The other doors aren’t mine to open.`,
      not:'Suit yourself. The fire’s free.'},
    aurennais:{
      made:'Your room is made up, Master, as agreed. Upstairs.',
      madeNamed:R=>`${R}, Master, made up as agreed. The key is in the door.`,
      empty:'The house has no other guests tonight, Master.',
      one:'One other guest is entered tonight, Master.',
      many:n=>`${n} guests are entered tonight, Master.`,
      offer:(o,p,r)=>`${o} A room is ${p} gold: ${r}, a bed, a bolt on the door, and breakfast at the posted hour. Shall I enter you for it?`,
      full:'Every room is let tonight, Master, and the house does not lodge two strangers in one room. The fire is free of charge.',
      poor:(p,g)=>`The room is ${p} gold, Master, and you have ${g}. The house does not extend credit.`,
      paid:(p,R)=>`${p} gold, received with thanks. ${R}, up the stairs, until this hour tomorrow. The other doors are let to others, and are not mine to open.`,
      not:'As you wish, Master. The fire is free of charge.'},
    oldblood:{
      made:'Your room is ready. Upstairs.',
      madeNamed:R=>`${R}. Ready. The key is in the door.`,
      empty:'No one else tonight.',
      one:'One other tonight.',
      many:n=>`${n} others tonight.`,
      offer:(o,p,r)=>`${o} ${p} gold. ${r[0].toUpperCase()+r.slice(1)}, a bed, a bolt, bread in the morning. Shall I make it ready?`,
      full:'Every room is taken. I do not put strangers together. The fire is free.',
      poor:(p,g)=>`${p} gold. You have ${g}.`,
      paid:(p,R)=>`${p} gold. ${R}, up the stairs, until this hour tomorrow. The other doors are not mine to open.`,
      not:'The fire is free.'}};
  function innTopics(house,people){const L=INN_ROOM_LINES[people]||INN_ROOM_LINES.markman;const cap=t=>t.replace(/^./,c=>c.toUpperCase());
    return [{label:'Something to eat and drink?',trade:true},{label:'A bed for the night?',
          get response(){const price=innPrice(house),n=innRooms(house),taken=innTaken(house),free=innFreeRoom(house);
            if(rentedNow(house.id)){const mine=myRoom(house.id);return mine==null?L.made:L.madeNamed(cap(innRoomName(mine,n,house)));}
            const others=taken===0?L.empty:taken===1?L.one:L.many(taken);
            return L.offer(others,price,innRoomName(free,n,house));},
          get follow(){const price=innPrice(house);if(rentedNow(house.id))return [];
            return [{label:`Yes. ${price} gold.`,quest:true,fn:()=>{const n=innRooms(house),free=innFreeRoom(house);
              if(free==null)return L.full;
              if(gold<price)return L.poor(price,gold);
              gold-=price;updateHUD();worldState.rented={id:house.id,room:free,until:(worldState.gameTimeAbsMinutes||0)+24*60};
              if(typeof addLog==='function')addLog('🛏️',`Rented ${innRoomName(free,n,house)} at ${house.name} for ${price} gold.`);
              return L.paid(price,cap(innRoomName(free,n,house)));}},
            {label:'Not tonight.',response:L.not}];}}];}
  function innRooms(house){const W=Math.max(8,Math.round((house.w||6)*1.8));return Math.max(1,Math.floor(W/4.5));}
  // v80 S424 — the rooms stand in one row behind the gallery, room 0 at the west wall, and you come up the stair facing
  // their doors: from a west stair every door is on your right, the nearest room 0's; from an east stair on your left,
  // the nearest the last room's. The names count the doors from the stair head (were left and right in turn, from room 0).
  function galleryEast(house){return String(house.id||'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,3)%2===1;}
  function innRoomName(k,n,house){if(k==null)return 'a room';if(n<=1)return 'the room at the top of the stairs';
    const east=galleryEast(house),i=east?n-1-k:k,side=east?'left':'right';
    if(i===n-1&&n>2)return `the last door on the ${side}`;
    return `the ${['first','second','third','fourth','fifth','sixth'][i]||`${i+1}th`} door on the ${side}`;}
  function innGuestRoom(house,k){return k!=null&&k<innTaken(house);} // S424 — rooms below the night's free one are other guests'; above it, empty
  function innDay(){return Math.floor((worldState.gameTimeAbsMinutes||0)/1440);}
  function innTaken(house){const n=innRooms(house);if(n<=1)return 0;if(house.coachInn)return n-1; // S237 — the roadside inn has one room to let; travellers hold the rest
   const h=String(house.id+'|'+innDay()).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,5);return h%n;} // other guests: steady for the night, never the whole house
  function innFreeRoom(house){const n=innRooms(house),taken=innTaken(house);return taken<n?taken:null;}
  function myRoom(id){const r=worldState.rented;return (r&&r.id===id&&r.room!=null)?r.room:null;}
  function innPrice(house){const k=house.reg||'irish';const base={village:6,town:12,port:10,city:20,garrison:8}[house.siteKind||'village']||10;const h=String(house.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);return Math.min(25,Math.max(5,base+(h%9)-3));}
  function guildMember(g){const st=(worldState.guild||{})[g];return !!(st&&(st.done>0||st.joined));}
  // Called by the engine's E handler when standing at a bed. Returns true if it handled it.
  function bedInteract(bd){
    const h=currentHouse;const owner=bd.owner||'free';
    if(owner==='free')return false;                       // engine sleeps
    if(owner==='home'){if(ownedHouse(h.id))return false;showMsg("That's someone else's bed.",'#c8b880');return true;}
    if(owner==='guild'){if(guildMember(h.guild))return false;showMsg('Members only. Take a task from the desk first.','#c8b880');return true;}
    if(owner==='inn'){
      if(rentedNow(h.id)){
        const mine=myRoom(h.id); // v80 S141 — an old save rented the whole inn: any bed there
        if(mine==null||bd.room==null||bd.room===mine)return false;
        showMsg(`${innGuestRoom(h,bd.room)?"Another guest's room.":'An empty room, not the one you took.'} Yours is ${innRoomName(mine,innRooms(h),h)}.`,'#c8b880');return true;
      }
      showMsg('The innkeeper lets the rooms. Ask at the counter.','#c8b880');return true;
    }
    return false;
  }
  function bedPrompt(bd){const h=currentHouse;const owner=bd.owner||'free';
    if(owner==='inn'&&!rentedNow(h.id))return `Ask the innkeeper for a room (${innPrice(h)} gold)`;
    if(owner==='inn'){const mine=myRoom(h.id);if(mine!=null&&bd.room!=null&&bd.room!==mine)return innGuestRoom(h,bd.room)?"Another guest's room":'Not your room';if(mine!=null)return "Your room \u2014 press 'E' to rest";} // v80 S141
    if(owner==='home'&&!ownedHouse(h.id))return null;if(owner==='guild'&&!guildMember(h.guild))return "Members' beds";return "Press 'E' to rest";}
  // ── buying a house ──
  function housePrice(house){const k=house.siteKind||'village';const base={village:450,town:900,port:800,city:1500,garrison:700}[k]||600;const hh=String(house.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,3);return base+((hh%7)*50);}
  function forSale(house){if(house.type!=='home'||ownedHouse(house.id))return false;const hh=String(house.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,11);return (hh%100)<28;}
  function buyHouse(house){
    const price=housePrice(house);if(gold<price)return `She'd take ${price} gold for it. Not a coin less.`;
    gold-=price;updateHUD();(worldState.owned||(worldState.owned={}))[house.id]={name:house.name,site:house.siteId};
    house.name='Your House';house.ownedByPlayer=true;
    if(typeof addLog==='function')addLog('🏠',`Bought a house for ${price} gold.`);
    // the former resident moves out: hide their street self for good
    const n=npcs.find(n=>n.def&&n.def.name===house.keeper&&n.sched&&n.sched.type==='resident');if(n){n.g.visible=false;n.dot.visible=false;n._retreated=true;n.sched={type:'gone'};}
    if(typeof closeDialog==='function')closeDialog();
    return false;
  }
  function houseTopics(house){return forSale(house)?[{label:`Buy this house (${housePrice(house)} gold)`,quest:true,fn:()=>buyHouse(house)}]:[];}
  // ── cellars ──
  function cellarFor(house){
    if(!house._cellar){const chapel=isGuestCathedral(house);house._cellar={id:house.id+(chapel?'_chapel':'_cellar'),type:chapel?'chapel':'cellar',name:chapel?'Cill an Aoi':`${house.name} — cellar`,keeper:'',parent:house,reg:house.reg,style:house.style,w:house.w,d:house.d,two:false,doorX:house.doorX,doorZ:house.doorZ,exitX:house.exitX,exitZ:house.exitZ,exitYaw:house.exitYaw,siteKind:house.siteKind,guild:house.guild};}
    return house._cellar;
  }
  function hasCellar(house){return house&&(house.type==='inn'||house.type==='guild_f'||house.type==='guild_m'||house.type==='castle'||house.ownedByPlayer||isGuestCathedral(house));}
  const HATCH={x:0,z:0,y:0,active:false};
  // ── S155: town locks and strongboxes (the crime system, part 1 of 4 — the design is in the backlog) ──
  let INT_BOX=null;
  const BOX_KINDS=['weapon','armor','potion','misc','shipwright','goods','forge','apothecary','armoury'];
  const bpick=a=>a[Math.floor(Math.random()*a.length)];
  function absMin(){return worldState.gameTimeAbsMinutes||0;}
  function houseSite(house){return (house&&house.siteId&&SITE[house.siteId])||null;}
  // a shop is locked while it is shut (18–8); a home from night to dawn, unless it is yours
  function doorLockNow(house){if(!house||house.ownedByPlayer||ownedHouse(house.id))return null;const h=hourNow();
    if(house.type==='home')return (h>=HRS.night||h<HRS.dawn)?{kind:'home',opens:HRS.dawn}:null;
    return shopClosedNow(house)?{kind:'shop',opens:HRS.shopOpen}:null;}
  function doorPicked(house){const P=worldState.picked;const t=P&&P[house.id];return t!=null&&absMin()-t<12*60;} // a picked door stays open for the night
  function lockPins(house){const st=houseSite(house);const p=st?prosperity(st):50;return house.type==='home'?2:(p>=60?4:3);} // a rich town buys better locks
  // ── S156: witnesses and favour (the crime system, part 2 of 4) ──
  // Anyone awake within sight sees it: a townsperson or guard within twelve units with a clear line, six indoors;
  // sneaking halves the range and night halves it again. Seen, the town's favour drops on the canon's scale, the
  // wronged keeper refuses your custom for five days, and a fine accrues that the lord will take. Favour lost to
  // crime comes back a point for every three quiet days.
  const CRIME_PTS={lock:1,theft:2,assault:3};
  // indoors, a wall between you and the keeper hides you (S182, the critic's section I): only what stands across eye
  // height counts (walls, partitions, a shut door), not a counter or a table you could see over
  function intClearLine(ax,az,bx,bz){if(typeof INT_SOL==='undefined')return true;const d=Math.hypot(bx-ax,bz-az);const n=Math.max(1,Math.ceil(d/.25));
    for(let i=1;i<n;i++){const t=i/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;for(const s2 of INT_SOL){if(s2.y1!=null&&s2.y1<1.5)continue;if(s2.y0!=null&&s2.y0>1.2)continue;if(x>s2.x0&&x<s2.x1&&z>s2.z0&&z<s2.z1)return false;}}return true;}
  function clearLine(ax,az,bx,bz){const d=Math.hypot(bx-ax,bz-az);const n=Math.max(1,Math.ceil(d/.6));for(let i=1;i<n;i++){const t=i/n;if(solidAt(ax+(bx-ax)*t,az+(bz-az)*t))return false;}return true;}
  // v80 S167 — indoors, sight stops at a partition wall (a solid taller than a person's head) or a shut door; counters,
  // tables and beds do not block it. An open door's box stands out of the way, so its doorway is clear.
  function intSightLine(ax,az,bx,bz){const S_=(typeof INT_SOL!=='undefined'&&INT_SOL)||[];const D_=(typeof INT_DOORS!=='undefined'&&INT_DOORS)||[];
    const eye=(typeof jumpY==='number'?jumpY:0)+1.1;const B=S_.filter(s=>s.y0!=null&&s.y1!=null&&s.y0<=eye&&s.y1>=eye&&(s.y1-s.y0>=1.8||D_.some(d=>d.sol===s)));
    const d=Math.hypot(bx-ax,bz-az);const n=Math.max(1,Math.ceil(d/.1));
    for(let i=1;i<n;i++){const t=i/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;for(const s of B)if(x>s.x0&&x<s.x1&&z>s.z0&&z<s.z1)return false;}return true;}
  // S368 — indoors a person sees what they face (Michael's B on #73): a 120° cone about the way they look, (sin ry, cos ry)
  const INT_FOV=Math.cos(Math.PI/3);
  function intFaces(o){const dx=px-o.position.x,dz=pz-o.position.z,d=Math.hypot(dx,dz);if(d<1e-3)return true;return (Math.sin(o.rotation.y)*dx+Math.cos(o.rotation.y)*dz)/d>=INT_FOV;}
  function witnessOf(house){
    const sneak=(typeof _sneaking!=='undefined')&&_sneaking;let R=12;if(sneak)R*=.5;if(isNight())R*=.5;
    if(typeof isInterior==='function'&&isInterior()){const inR=6; // indoors: whoever is in the room with you, facing you, and can see you
      if(typeof intNPCMesh!=='undefined'&&intNPCMesh&&Math.hypot(px-intNPCMesh.position.x,pz-intNPCMesh.position.z)<inR&&intFaces(intNPCMesh)&&intSightLine(intNPCMesh.position.x,intNPCMesh.position.z,px,pz))return {name:currentHouse.keeper||'the keeper'};
      const m=(INT_NPCS||[]).find(n=>Math.hypot(px-n.g.position.x,pz-n.g.position.z)<inR&&intFaces(n.g)&&intSightLine(n.g.position.x,n.g.position.z,px,pz));return m?{name:(m.def&&m.def.name)||'someone'}:null;}
    let best=null,bd=R;for(const n of npcs){if(!n.g.visible||n._retreated)continue;const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);if(d>=bd)continue;if(!clearLine(px,pz,n.g.position.x,n.g.position.z))continue;best=n;bd=d;}
    return best?{name:(best.def&&best.def.name)||'someone',npc:best}:null;}
  function seenCrime(kind,house,w,value){const site=houseSite(house);const pts=CRIME_PTS[kind]||1;
    if(site){addFavor(site,-pts);const C=worldState.crime||(worldState.crime={});const c=C[site.id]||(C[site.id]={bounty:0,debt:0,last:0});c.bounty+=25*pts+Math.max(0,Math.round(value||0));c.debt+=pts;c.last=dayNow();} // S168 — a theft's fine is 50 and the goods' value (the spec)
    if(house.keeper&&house.type!=='home')(worldState.refuse||(worldState.refuse={}))[house.id]=dayNow()+5;
    const what=kind==='lock'?'pick the lock':kind==='theft'?'take what was not yours':'strike';
    if(site&&typeof isInterior==='function'&&isInterior())try{dispatchGuard(house,site);}catch(e){} // S239 — seen indoors: a guard is sent
    showMsg(`${w.name} saw you ${what}.`,'#e88a8a');if(typeof addLog==='function')addLog('👁',`${w.name} saw you ${what} at ${house.name}${site?'; '+site.name+' will not forget it':''}.`);}
  // S327 — asked each frame of a town pick (Michael's A on #54): whoever sees you now sees the lock picked
  function pickSeen(house){const w=witnessOf(house);if(!w)return null;
    (worldState.crimes||(worldState.crimes=[])).push({kind:'lock',site:house.siteId||null,house:house.id,day:dayNow(),min:absMin()});seenCrime('lock',house,w);return w;}
  function noteCrime(kind,house,value,coins){(worldState.crimes||(worldState.crimes=[])).push({kind,site:house.siteId||null,house:house.id,day:dayNow(),min:absMin()});
    if(coins>0&&house.siteId){const C=worldState.crime||(worldState.crime={});const c=C[house.siteId]||(C[house.siteId]={bounty:0,debt:0,last:0});c.loot=(c.loot||0)+coins;} // S168 — the gold taken in a town, for the cells to take back
    const w=witnessOf(house);if(w)seenCrime(kind,house,w,value);return !!w;}
  function refusesTrade(house){const R=worldState.refuse;if(!R||!house||R[house.id]==null)return false;if(dayNow()>=R[house.id]){delete R[house.id];return false;}return true;}
  function bountyAt(site){const C=worldState.crime;const c=C&&C[typeof site==='string'?site:site.id];return c?c.bounty:0;}
  function fineTopics(site){const b=bountyAt(site);if(b<=0)return [];
    return [{label:`Pay my fine (${b} gold)`,quest:true,fn:()=>{if(gold<b)return `The fine is ${b} gold. Come back when you have it.`;gold-=b;updateHUD();worldState.crime[site.id].bounty=0;worldState.crime[site.id].shut=false;if(typeof addLog==='function')addLog('⚖',`Paid a fine of ${b} gold at ${site.name}.`);return 'Paid. The town will still remember for a while; give it time.';}}];}
  function tickCrimeDay(){const C=worldState.crime;if(!C)return;const day=dayNow();for(const id in C){const c=C[id];if(c.debt>0&&day-c.last>=3){c.debt--;c.last=day;addFavor(id,1);}}}
  // ── S157: guards (the crime system, part 3 of 4) ──
  // With a fine on you, a guard within five units and a clear line stops you: pay, or he draws. Drawn, the guard
  // stands in as a zone enemy (the Bandit body for now, in the watch's red) and the guard himself steps out of the
  // street. At low health you may yield: pay double, or a night in the cells, which takes the stolen goods and
  // clears the fine. Killing a guard costs five favour, shuts the town's gates to you until you pay, and the Church
  // hears of it. Striking anyone is assault, seen by its victim; a struck guard draws at once.
  const CR={cool:0,yielded:false};
  function nearSite(){let best=null,bd=1e9;for(const S of SETTLE.values()){if(!S.site)continue;const d=Math.hypot(px-S.site.x,pz-S.site.z);if(d<(S.site.pad||40)+40&&d<bd){bd=d;best=S;}}return best;}
  function guardsOf(S){return (S&&S.npcs||[]).filter(n=>n.sched&&(n.sched.type==='guard'||n.sched.type==='watch'||n.sched.type==='constable'));}
  function crimeOf(S){const C=worldState.crime;return C&&S&&C[S.site.id];}
  function drawnAt(S){return ZONES.world.enemies.filter(e=>e._guard&&!e.dead&&e._guard.site===S.site.id);}
  function tickCrime(dt,now){
    CR.cool=Math.max(0,CR.cool-dt);try{tickSent(dt,false);}catch(e){}const S=nearSite();if(!S)return;const c=crimeOf(S);const talking=(typeof dlgOpen!=='undefined')&&dlgOpen;
    const drawn=drawnAt(S);
    if(drawn.length){ // the fight: they hold while you talk; at low health, the offer to yield
      if(!c||(c.bounty<=0&&!c.shut)){standDown(S);return;} // S433 — the fine paid to the lord mid-fight: nothing left to fight over (he fought on, and no yield could come)
      if(talking){drawn.forEach(e=>{e.alert=false;e.atkCd=Math.max(e.atkCd||0,.6);});return;}
      drawn.forEach(e=>{e.alert=true;});
      if(!CR.yielded&&PHP<maxHP*.3&&c&&c.bounty>0){CR.yielded=true;offerYield(S,c);}
      return;}
    CR.yielded=false;
    if(!c||c.bounty<=0||talking)return;if(!c.shut&&CR.cool>0)return; // shut gates: no talk, no cooldown
    for(const n of guardsOf(S)){if(!n.g.visible||n._retreated||n._drawn)continue;const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);if(d>5)continue;if(!clearLine(px,pz,n.g.position.x,n.g.position.z))continue;
      if(c.shut)guardDraw(n,S);else confront(n,S,c);return;}
  }
  // S239 — guards indoors (Michael, issue #23: B). Seen indoors with a fine on you, the nearest guard on duty is sent.
  // Half a minute on (or when he has walked there, if that is longer) he comes in by the door and halts you where you
  // stand. Leave before then and he is in the street where his walk had got him, and gives chase: he halts you if he
  // catches you, and gives up when you leave the town's pad or after a minute and a half. Refuse him indoors and he
  // takes it outside, where he draws (the fight indoors is the next session). The clock runs in both ticks.
  const GUARD_IN=30,CHASE_SPD=3.0,CHASE_MAX=90;
  function dispatchGuard(house,site){const S=SETTLE.get(site.id);if(!S)return;if(CR.sent&&CR.sent.site===site.id&&CR.sent.house===house.id)return;
    const h=hourNow();let best=null,bd=1e9;
    for(const n of guardsOf(S)){if(n._drawn||scheduleFor(n,h).hide)continue;const d=Math.hypot(n.g.position.x-house.exitX,n.g.position.z-house.exitZ);if(d<bd){bd=d;best=n;}}
    if(!best)return;if(CR.sent)endSent();
    CR.sent={site:site.id,house:house.id,npc:best,t:0,ct:0,from:{x:best.g.position.x,z:best.g.position.z},door:{x:house.exitX,z:house.exitZ},out:{x:house.exitX-house.doorX,z:house.exitZ-house.doorZ},walk:bd/CHASE_SPD,phase:'coming',mesh:null};
    best._follow=false;}
  function endSent(){const s=CR.sent;if(!s)return;if(s.mesh&&s.mesh.parent)s.mesh.parent.remove(s.mesh);if(s.enemy){const i=ZONES.world.enemies.indexOf(s.enemy);if(i>=0)ZONES.world.enemies.splice(i,1);}if(s.npc)s.npc._chase=false;CR.sent=null;}
  function tickSent(dt,indoor){const s=CR.sent;if(!s)return;const C=worldState.crime;const c=C&&C[s.site];if(!c||c.bounty<=0){endSent();return;}
    const S=SETTLE.get(s.site);const n=s.npc;if(!S||!n||(n._drawn&&s.phase!=='fight')){endSent();return;}
    s.t+=dt;const talking=(typeof dlgOpen!=='undefined')&&dlgOpen;
    if(indoor){CR.cool=Math.max(0,CR.cool-dt);/* S241 — the halt's minute runs indoors too (it only ran in the street's tick) */const inHouse=typeof currentHouse!=='undefined'&&currentHouse&&currentHouse.id===s.house;
      if(s.phase==='chase'){ // you ducked in somewhere while he was on your heels (within 20 units): he follows you in
        if(currentHouse&&s.last&&s.last.d<=20){s.house=currentHouse.id;s.door={x:currentHouse.exitX,z:currentHouse.exitZ};s.out={x:currentHouse.exitX-currentHouse.doorX,z:currentHouse.exitZ-currentHouse.doorZ};s.phase='coming';s.t=GUARD_IN-s.last.d/CHASE_SPD;s.walk=0;n._chase=false;}
        else{endSent();}return;}
      if(!inHouse)return;
      if(s.phase==='fight'){const e=s.enemy;if(!e||e.dead){endSent();return;} // S241 — killed (guardKilled has run) or stood down
        if(talking){e.alert=false;e.atkCd=Math.max(e.atkCd||0,.6);return;}
        e.alert=true;if(!CR.yielded&&PHP<maxHP*.3&&c.bounty>0){CR.yielded=true;offerYield(S,c);return;}
        const keep=ZE;ZE=[e];try{tickZoneEnemies(dt,performance.now(),interiorScene);}finally{ZE=keep;}return;}
      if(s.phase==='coming'&&s.t>=Math.max(GUARD_IN,s.walk)){ // he comes in by the door
        const W=currentHouse._roomW||currentHouse.intW||10,D=currentHouse._roomD||currentHouse.intD||10;
        const g=buildNPCMesh({role:'guard',name:(n.def&&n.def.name)||'Guard',_twin:n.def&&n.def._twin,bCol:(n.def&&n.def.bCol)||0x6a2a2a,sCol:(n.def&&n.def.sCol)||0xd4a878},{nation:nationAt(currentHouse.doorX,currentHouse.doorZ),key:currentHouse.siteId||''});
        g.position.set(W/2,0,D-1.0);g.rotation.y=Math.PI;if(interiorScene)interiorScene.add(g);s.mesh=g;s.phase='inside';
        showMsg(`${(n.def&&n.def.name)||'A guard'} comes in.`,'#e88a8a');return;}
      if(s.phase==='inside'&&s.mesh){const g=s.mesh,dx=px-g.position.x,dz=pz-g.position.z,d=Math.hypot(dx,dz);g.rotation.y=Math.atan2(dx,dz);
        if(d>1.5&&!talking){const st=Math.min(d-1.4,1.8*dt),nx=g.position.x+dx/d*st,nz=g.position.z+dz/d*st;
          if(!intSolidAt(nx,nz,.3,0)){g.position.x=nx;g.position.z=nz;}else if(!intSolidAt(nx,g.position.z,.3,0))g.position.x=nx;else if(!intSolidAt(g.position.x,nz,.3,0))g.position.z=nz;}
        else if(d<=1.5&&!talking&&CR.cool<=0&&Math.abs(jumpY)<1.2)confrontIndoor(s,S,c);}
      return;}
    // out of doors
    if(s.phase==='fight'){const e=s.enemy;const hp=e?e.hp:null;if(e){e.dead=true;try{e.mesh&&e.mesh.parent&&e.mesh.parent.remove(e.mesh);}catch(err){}const i=ZONES.world.enemies.indexOf(e);if(i>=0)ZONES.world.enemies.splice(i,1);} // S241 — you ran out mid-fight: he follows and fights on in the street
      const ol=Math.hypot(s.out.x,s.out.z)||1,gx=s.door.x+s.out.x/ol*1.8,gz=s.door.z+s.out.z/ol*1.8;n._drawn=false;n.g.position.set(gx,worldH(gx,gz),gz);s.enemy=null;endSent();const e2=guardDraw(n,S);if(e2&&hp!=null)e2.hp=Math.max(1,hp);return;}
    if(s.phase==='inside'||s.phase==='coming'){ // you are out: he is where his walk had got him (at the door if he was already in)
      const k=s.phase==='inside'?1:Math.min(1,s.t/Math.max(.01,s.walk));const x=s.from.x+(s.door.x-s.from.x)*k,z=s.from.z+(s.door.z-s.from.z)*k;
      if(s.mesh&&s.mesh.parent)s.mesh.parent.remove(s.mesh);s.mesh=null;
      n.g.position.set(x,worldH(x,z),z);n.g.visible=true;n._retreated=false;if(n.dot)n.dot.visible=true;
      if(s.drawOnExit){const ol=Math.hypot(s.out.x,s.out.z)||1,gx=s.door.x+s.out.x/ol*1.8,gz=s.door.z+s.out.z/ol*1.8;n.g.position.set(gx,worldH(gx,gz),gz);endSent();CR.cool=0;guardDraw(n,S);return;}
      s.phase='chase';s.ct=0;n._chase=true;n._follow=false;CR.cool=0;}
    if(s.phase==='chase'){s.ct+=dt;const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);s.last={d,clear:clearLine(px,pz,n.g.position.x,n.g.position.z)};
      const onPad=Math.hypot(px-S.site.x,pz-S.site.z)<(S.site.pad||40)+40;
      if(!onPad||s.ct>CHASE_MAX){showMsg(`${(n.def&&n.def.name)||'The guard'} gives up the chase.`,'#c8b880');endSent();}}
  }
  // S241 — refused indoors, the guard draws where he stands: a Town Guard in the room, fought through the zone-enemy code
  // (run on him alone, with the room's floor and solids); the yield comes at a fifth of health, as in the street.
  function guardFightIndoor(s,S){if(!interiorScene||!s.mesh)return;const n=s.npc;const x=s.mesh.position.x,z=s.mesh.position.z;if(s.mesh.parent)s.mesh.parent.remove(s.mesh);s.mesh=null;
    const e=guardEnemy(n,S,interiorScene,[],x,z);e._indoor=s.house;s.enemy=e;s.phase='fight';CR.yielded=false;}
  // S254 — the halt and the yield in the voice of the town's people; markman is the old text (quest review, run 1, findings 2–3)
  const HALT_LINES={
    gatelander:{greet:(f,t)=>`Stand a moment. There’s a fine of ${f} gold owed in ${t}, and it won’t pay itself. Settle it, or I’ll have to draw.`,
      poor:'You haven’t got it. A debt only grows in the dark, so find it, and soon.',
      pay:'Paid is paid. Walk easy.',
      refuse:'Then the sword, and Weaver forgive the both of us.'},
    markman:{greet:(f,t)=>`Halt. There’s a fine of ${f} gold on you in ${t}. Pay it, or I draw.`,
      poor:'You haven’t got it. Then find it, and quick.',
      pay:'Good. Keep your nose clean.',
      refuse:'Then it’s the sword.'},
    aurennais:{greet:(f,t)=>`A moment, Master. There is a fine of ${f} gold entered against you in ${t}. Settle it now, or I am obliged to draw.`,
      poor:'You have not the sum, Master. Find it before the town finds you.',
      pay:'Settled, and struck from the book. Good day.',
      refuse:'Then you leave me no other term.'},
    oldblood:{greet:(f,t)=>`Stop. ${t} is owed ${f} gold by you. Pay, or I draw.`,
      poor:'You have not got it. Find it.',
      pay:'It is paid.',
      refuse:'Then the blade.'}};
  const YIELD_LINES={
    gatelander:{greet:d=>`A bent knee mends faster than a broken head. ${d} gold, or a night in the cells.`,
      poor:'You haven’t got it. Then it’s the cells, or the sword again, and I’d not choose the sword.',
      pay:'That’s the wiser road. Go on, and go quiet.',
      cells:'Come along, so. The cells are dry, at least.'},
    markman:{greet:d=>`Yield, and it goes easier. ${d} gold, or a night in the cells.`,
      poor:'You haven’t got it. The cells, then, or fight on.',
      pay:'Wise. Go on, then.',
      cells:'Come along, then.'},
    aurennais:{greet:d=>`Yield, and the terms improve. ${d} gold, Master, or a night in the cells.`,
      poor:'You have not the sum, Master. The cells, then, or we continue.',
      pay:'Settled, and noted. You may go.',
      cells:'The cells, then. It will be entered in the town’s book.'},
    oldblood:{greet:d=>`Yield. ${d} gold, or the cells until light.`,
      poor:'You have not got it. The cells, or the blade.',
      pay:'It is paid. Go.',
      cells:'Come. The cells are quiet.'}};
  function haltLines(S){return HALT_LINES[peopleOfSite(S.site)]||HALT_LINES.markman;}
  function yieldLines(S){return YIELD_LINES[peopleOfSite(S.site)]||YIELD_LINES.markman;}
  function confrontIndoor(s,S,c){CR.cool=60;const fine=c.bounty;const n=s.npc;const name=(n.def&&n.def.name)||'The guard';const L=haltLines(S);
    openDialog({name,role:'Guard',ico:'⚔',greeting:[L.greet(fine,S.site.name)],topics:[
      {label:`Pay the fine (${fine} gold)`,quest:true,fn:()=>{if(gold<fine)return L.poor;gold-=fine;updateHUD();c.bounty=0;c.shut=false;CR.cool=5;if(typeof addLog==='function')addLog('⚖',`Paid ${fine} gold to ${name} at ${S.site.name}.`);endSent();return L.pay;}},
      {label:'I’ll not pay.',quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}guardFightIndoor(s,S);},60);return L.refuse;}},
      {label:'Not now.',bye:true}]});}
  function confront(n,S,c){CR.cool=60;if(CR.sent&&CR.sent.npc===n)endSent();/* S239 — caught: the chase is over */const fine=c.bounty;const name=(n.def&&n.def.name)||'The guard';const L=haltLines(S);
    openDialog({name,role:'Guard',ico:'⚔',greeting:[L.greet(fine,S.site.name)],topics:[
      {label:`Pay the fine (${fine} gold)`,quest:true,fn:()=>{if(gold<fine)return L.poor;gold-=fine;updateHUD();c.bounty=0;c.shut=false;CR.cool=5;if(typeof addLog==='function')addLog('⚖',`Paid ${fine} gold to ${name} at ${S.site.name}.`);return L.pay;}},
      {label:'I’ll not pay.',quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}guardDraw(n,S);},60);return L.refuse;}},
      {label:'Not now.',bye:true}]});}
  function guardDraw(n,S){if(n._drawn)return null;return guardEnemy(n,S,sc,STATIC_SOL,n.g.position.x,n.g.position.z);}
  function guardEnemy(n,S,scn,sol,x,z){n._drawn=true;n._retreated=true;n.g.visible=false;if(n.dot)n.dot.visible=false; // S241 — in the street, or in a room
    let gen=null;n.g.traverse(o=>{if(!gen&&o.userData&&o.userData.rig&&o.userData.rig.g)gen=o.userData.rig.g;}); // S171 — the guard who draws is the guard you spoke to
    const e=buildZoneEnemy(scn,sol,x,z,'Bandit',null,{genome:gen});e.name='Town Guard';e.displayName='Town Guard';e.locked=false;e.minLevel=1;if(e.mesh)e.mesh.visible=true;
    e.hp=e.maxHp=Math.round(40+level*8);e.dmg=Math.round(6+level*1.2);e.spd=1.4;e.xpVal=0;e.def=3;e._guard={site:S.site.id,npc:n};e.alert=true;
    try{const body=enemyBodyMesh(e);if(!(e.limbs&&e.limbs.person)&&body&&body.material&&body.material.color)body.material.color.setHex(0x6a2a2a);}catch(err){}
    ZONES.world.enemies.push(e);showMsg(`${(n.def&&n.def.name)||'The guard'} draws.`,'#ff8060');return e;}
  function standDown(S){for(const e of ZONES.world.enemies){if(!e._guard||e.dead||e._guard.site!==S.site.id)continue;e.dead=true;try{(e.mesh&&e.mesh.parent||sc).remove(e.mesh);}catch(err){}if(e.el)e.el.intensity=0;
    const n=e._guard.npc;if(n){n._drawn=false;n._retreated=false;n.g.visible=true;if(n.dot)n.dot.visible=true;}}}
  function offerYield(S,c){const dbl=c.bounty*2;const D_=drawnAt(S);D_.forEach(e=>{e.alert=false;e.atkCd=Math.max(e.atkCd||0,.6);}); // they hold while the offer stands
    const L=yieldLines(S);const gn=D_.map(e=>e._guard&&e._guard.npc&&e._guard.npc.def&&e._guard.npc.def.name).find(Boolean)||'The guard'; // S171 — the guard who drew speaks, by name
    openDialog({name:gn,role:'Guard',ico:'⚔',greeting:[L.greet(dbl)],topics:[
      {label:`Pay double (${dbl} gold)`,quest:true,fn:()=>{if(gold<dbl)return L.poor;gold-=dbl;updateHUD();c.bounty=0;c.shut=false;standDown(S);if(typeof addLog==='function')addLog('⚖',`Yielded and paid ${dbl} gold at ${S.site.name}.`);return L.pay;}},
      {label:'The cells.',quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}toCells(S,c);},60);return L.cells;}},
      {label:'Fight on.',bye:true}]});}
  function toCells(S,c){if(typeof isInterior==='function'&&isInterior()){try{closeDialog();}catch(e){}try{exitInterior();}catch(e){}let k=0;const w=()=>{if(!isInterior()||++k>60)toCells(S,c);else setTimeout(w,100);};setTimeout(w,100);return;} // S241 — taken from a room: out first
    standDown(S);let stolen=0;for(let i=BAG.length-1;i>=0;i--)if(BAG[i].stolen){BAG.splice(i,1);stolen++;}c.bounty=0;c.shut=false;
    const back=Math.min(Math.max(0,gold),c.loot||0);if(back>0){gold-=back;stolen++;}c.loot=0; // S168 — the gold stolen in this town goes back too, as much of it as you still carry
    doFade(()=>{const gtm=worldState.gameTimeMinutes||0;const to=gtm<7*60?7*60-gtm:1440-gtm+7*60;worldState.gameTimeAbsMinutes=(worldState.gameTimeAbsMinutes||0)+to;worldState.gameTimeMinutes=7*60; // to the next morning, on both clocks
      const keep=S.houses.find(h=>h.type==='castle');if(keep){px=keep.exitX!=null?keep.exitX:keep.doorX;pz=keep.exitZ!=null?keep.exitZ:keep.doorZ+2;}else{px=S.site.x;pz=S.site.z;}jumpY=0;PHP=Math.max(PHP,Math.round(maxHP*.5));
      showMsg(`A night in the cells. ${stolen?'They took what you stole'+(back?` (${back} gold)`:'')+'. ':''}It is morning.`,'#c8b880');if(typeof addLog==='function')addLog('⛓',`A night in the cells at ${S.site.name}${stolen?'; the stolen goods were taken'+(back?`, and ${back} gold`:''):''}.`);
      if(typeof renderInv==='function')renderInv();if(typeof updateHUD==='function')updateHUD();});}
  function guardKilled(e){const id=e._guard.site;const C=worldState.crime||(worldState.crime={});const c=C[id]||(C[id]={bounty:0,debt:0,last:0});addFavor(id,-5);c.debt+=5;c.last=dayNow();c.bounty+=125;c.shut=true;
    (worldState.church||(worldState.church={notes:[]})).notes.push({kind:'guard',site:id,day:dayNow()});const S=SETTLE.get(id);
    try{const t=S?S.site:SITE[id];if(t){const st=fstate()[factionOf(nationKeyOf(...cellOf(t.x,t.z)))];if(st.done>0){st.done=Math.max(0,st.done-3);st.rank=Math.min(3,Math.floor(st.done/3));}}}catch(err){} // a service lost, and the rank with it
    showMsg(`You have killed a guard of ${S?S.site.name:'the town'}. Its gates are shut to you until you pay.`,'#ff6060');if(typeof addLog==='function')addLog('☠',`Killed a guard at ${S?S.site.name:id}. The Church will hear of it.`);}
  // ── S158: the Church and the factions (the crime system, part 4 of 4) ──
  // The priest of a town where you have a record hears a confession: a tithe of 25 gold, once in three days, buys
  // back one point of the favour crime cost you. Not for a guard's death while the town is unpaid. The nation's
  // faction will not serve you while any of its towns has a fine on you or its gates shut, and its discount is
  // gone; a guard's death in its nation costs a service and the rank that went with it.
  function recordAt(site){const c=crimeOf({site});return c&&(c.debt>0||c.bounty>0||c.shut)?c:null;}
  function churchNoteAt(siteId){const N=(worldState.church&&worldState.church.notes)||[];return N.find(n=>n.kind==='guard'&&n.site===siteId&&!n.absolved);}
  function penanceTopics(site){const c=recordAt(site);if(!c)return [];const note=churchNoteAt(site.id);if(c.debt<=0&&!note)return []; /* S425 — no favour owed and no guard's death to hear: a fine alone is the lord's, and the tithe bought nothing */
    return [{label:'Confess.',quest:true,fn:()=>{
      if(note&&(c.bounty>0||c.shut))return 'A guard of this town is dead by your hand, and the town is not paid. I will not hear you until it is.';
      const day=dayNow();if(c.confessed!=null&&day-c.confessed<3)return 'You have confessed. Now live it; come back to me in a few days.';
      if(gold<25)return 'The tithe is 25 gold. The Weaver keeps no accounts, but the roof does.';
      gold-=25;updateHUD();c.confessed=day;if(c.debt>0){c.debt--;addFavor(site,1);}if(note)note.absolved=day;
      if(typeof addLog==='function')addLog('🕯',`Confessed at ${site.name}; a tithe of 25 gold.`);
      return note?'It is heard. The dead man had a name; learn it. Go, and do not come back to me for the same thing.':'It is heard. The town will come round the sooner for it. Go gently.';}}];}
  function nationRecord(nk){const C=worldState.crime||{};for(const id in C){const c=C[id];if(!(c.bounty>0||c.shut))continue;const t=SITE[id];if(t&&nationKeyOf(...cellOf(t.x,t.z))===nk)return t;}return null;}
  // striking a townsperson: the victim always sees it; a struck guard draws at once, anyone else runs
  function strikeNpc(fx,fz){const S=nearSite();if(!S)return false;let best=null,bd=2.2;
    for(const n of S.npcs||[]){if(!n.g.visible||n._retreated||n._drawn)continue;const ex=n.g.position.x-px,ez=n.g.position.z-pz,d=Math.hypot(ex,ez);if(d>=bd)continue;if((ex*fx+ez*fz)/(d||1)<=.45)continue;best=n;bd=d;}
    if(!best)return false;const name=(best.def&&best.def.name)||'someone';const site=S.site;
    addFavor(site,-3);const C=worldState.crime||(worldState.crime={});const c=C[site.id]||(C[site.id]={bounty:0,debt:0,last:0});c.bounty+=75;c.debt+=3;c.last=dayNow();
    (worldState.crimes||(worldState.crimes=[])).push({kind:'assault',site:site.id,house:null,day:dayNow(),min:absMin()});
    if(best.sched&&(best.sched.type==='guard'||best.sched.type==='watch'||best.sched.type==='constable')){showMsg(`You struck ${name}.`,'#ff6060');guardDraw(best,S);}
    else{best._scared=performance.now()+20000;showMsg(`You struck ${name}. ${site.name} will not forget it.`,'#ff6060');if(typeof addLog==='function')addLog('👁',`Struck ${name} at ${site.name}.`);}
    return true;}
  function doorLockFor(house){const home=house.type==='home';return {seed:'door_'+house.id,minPins:lockPins(house),lockBonus:home?-1:0,lockTitle:home?'A locked door':'A shop door, locked for the night',live:true,house,
    onPick:()=>{(worldState.picked||(worldState.picked={}))[house.id]=absMin();noteCrime('lock',house);if(typeof goToInterior==='function')goToInterior(house);}};}
  // a shop's takings before the day's luck (Michael’s A on #68, S361): 10 + 50 a 100 prosperity, by the shop's kind; was 20 + 180 (S155)
  function boxCoins(p,type){const mult=/weapon|armor|armoury|forge/.test(type)?1.2:/potion|apothecary/.test(type)?.8:1;return (10+50*Math.max(0,Math.min(100,p))/100)*mult;}
  function boxState(){if(!INT_BOX)return null;const B=worldState.boxes||(worldState.boxes={});const r=B[INT_BOX.id];if(r&&dayNow()-r.taken<5)return 'empty';if(r&&INT_BOX.open)INT_BOX.open=false; // refilled: locked again
    return INT_BOX.open?'open':'locked';}
  function boxPrompt(){if(!INT_BOX||!currentHouse)return null;if(Math.hypot(px-INT_BOX.x,pz-INT_BOX.z)>1.6||jumpY>.6)return null;const st=boxState();const name=INT_BOX.kind==='home'?'the chest':'the strongbox';
    return st==='empty'?(INT_BOX.kind==='home'?'The chest is empty':'The strongbox is empty'):st==='locked'?`Press 'E' to pick the lock on ${name}`:`Press 'E' to open ${name}`;}
  function boxInteract(){if(!boxPrompt())return false;const st=boxState(),X=INT_BOX;
    if(st==='empty'){showMsg(X.kind==='home'?'Nothing left in it.':'The takings are gone; they will not have refilled it yet.','#c8b880');return true;}
    if(st==='locked'){if(typeof tryLockpick==='function')tryLockpick({seed:'box_'+X.id,live:true,house:X.house,minPins:lockPins(X.house),lockBonus:X.kind==='home'?-1:0,lockTitle:X.kind==='home'?'A small chest':'A strongbox',onPick:()=>{X.open=true;if(X.lid)X.lid.rotation.x=-Math.PI/3;boxInteract();}});return true;}
    // open: the takings by the town's prosperity and one thing from the stock; a home's few coins and a keepsake
    const items=[];let coins=0;const site=houseSite(X.house);const p=site?prosperity(site):50;
    if(X.kind==='home'){coins=2+Math.floor(Math.random()*11);items.push({name:bpick(['A carved bird','A tin locket','A worn ring','A child’s top','A bone comb','A prayer card','A lock of hair in paper']),ico:'🎁',type:'misc',weight:.1,sellMult:1,buyPrice:8+Math.floor(Math.random()*22),qty:1,stolen:true});}
    else{coins=Math.round(boxCoins(p,X.type)*(.8+Math.random()*.4));
      try{const tbl=(typeof SHOP_STOCK!=='undefined')&&(SHOP_STOCK[X.type]||SHOP_STOCK.misc);if(tbl&&tbl.length){items.push(Object.assign({},bpick(tbl),{qty:1,stolen:true}));}}catch(e){}}
    gold+=coins;let got=0;items.forEach(it=>{if(typeof bagAdd==='function'){bagAdd(it);got++;}});
    (worldState.boxes||(worldState.boxes={}))[X.id]={taken:dayNow()};noteCrime('theft',X.house,coins+items.reduce((a,it)=>a+(it.buyPrice||0),0),coins);
    showMsg(`${coins} gold${got?', and '+items.map(i=>i.name.toLowerCase()).join(', '):''}.`,'#e8d8a0');if(typeof addLog==='function')addLog('💰',`Took ${coins} gold from ${X.kind==='home'?'a chest in':'the strongbox at'} ${X.house.name}.`);
    if(typeof renderInv==='function')renderInv();return true;}
  let INT_LOOT=null;
  function lootPrompt(){if(!INT_LOOT||!currentHouse)return null;const taken=worldState.towerLoot&&worldState.towerLoot[INT_LOOT.id];if(taken)return null;if(Math.hypot(px-INT_LOOT.x,pz-INT_LOOT.z)<1.5&&Math.abs(jumpY-INT_LOOT.y)<1.2)return towerLocked()?"Press 'E' to pick the chest's lock":"Press 'E' to open the chest";return null;}
  function towerLocked(){return !!INT_LOOT&&!(worldState.towerPicked&&worldState.towerPicked[INT_LOOT.id]);} // S150 — the tower's chest is a good lock
  function lootInteract(){if(!lootPrompt())return false;
    if(towerLocked()){const id=INT_LOOT.id;if(typeof tryLockpick==='function')tryLockpick({seed:'tower_'+id,minPins:4,lockTitle:'A locked chest',onPick:()=>{(worldState.towerPicked||(worldState.towerPicked={}))[id]=true;lootInteract();}});return true;}
    const items=(typeof rollContainerLoot==='function'?rollContainerLoot('treasure',2.4,null,1,'tower:'+INT_LOOT.id):[])||[];if(!items.length)items.push({name:'Old Gold',ico:'🪙',type:'misc',weight:.5,sellMult:1,buyPrice:120,qty:1});let got=0;items.forEach(it=>{if(it.qty==null)it.qty=1;if(typeof bagAdd==='function'){bagAdd(it);got++;}});(worldState.towerLoot||(worldState.towerLoot={}))[INT_LOOT.id]=true;showMsg(`The chest yields ${got} thing${got===1?'':'s'}.`,'#e8d8a0');if(typeof addLog==='function')addLog('💰',`Opened the chest atop ${currentHouse.name}.`);return true;}
  function hatchPrompt(){if(!HATCH.active||!currentHouse)return null;if(Math.hypot(px-HATCH.x,pz-HATCH.z)<1.3&&Math.abs(jumpY-HATCH.y)<.9)return HATCH.roof?"Press 'E' to climb out onto the roof":(currentHouse.type==='cellar'||currentHouse.type==='chapel')?"Press 'E' to climb up":isGuestCathedral(currentHouse)?"Press 'E' to go down — the bricked stair":"Press 'E' to go down to the cellar";return null;}
  function hatchInteract(){if(!hatchPrompt())return false;const h=currentHouse;
    if(HATCH.roof){const S=SETTLE.get((h.siteId)||'');const site=siteAnywhere(h.siteId);const roof=(S&&S.roof)||(site?roofFor(site):null);if(!roof)return false;const hh=h;if(typeof exitInterior==='function'){window._pendingWorldPos={x:roof.x,z:roof.z+1.2,yaw:Math.PI,jumpY:roof.y};exitInterior();}showMsg('Wind. The whole country, from up here.','#c8b880');return true;}
    if(h.type==='cellar'||h.type==='chapel'){const p=h.parent;goToInterior(p);setTimeout(()=>{if(currentHouse===p&&p._hatch){px=p._hatch.x;pz=p._hatch.z+.9;jumpY=0;}},900);return true;}
    const c=cellarFor(h);goToInterior(c);return true;}
  // ── painted windows ──
  // S331 (Michael, on #53: "more medieval, and it should reflect the type of town") — the view through a window is drawn by
  // the time of day, the town's prosperity and its nation: a poor place shows fields, trees and perhaps a cottage; a middling
  // one a few gabled houses round a church tower; a rich one its curtain wall with towers and the roofs and spires inside.
  // No mullions are painted: the kit frame in front of the pane carries them. One texture per (time, tier, nation), cached.
  const WINTEX={};
  function winTier(p){return p==null?0:p<35?0:p<60?1:2;}
  function windowTexture(tier,nation){
    const h=hourNow();const key=h<5.5?'night':h<7.5?'dawn':h<17.5?'day':h<19.5?'dusk':'night';
    tier=tier==null?1:tier;nation=nation||'gatelands';const ck=key+'|'+tier+'|'+nation;
    if(WINTEX[ck])return WINTEX[ck];
    let sd=(tier*7919+nation.length*104729+key.length*31)>>>0;const R=()=>{sd=(sd*16807)%2147483647||1;return sd/2147483647;};
    const cv=document.createElement('canvas');cv.width=256;cv.height=256;const ctx=cv.getContext('2d');
    const sky=ctx.createLinearGradient(0,0,0,256);
    if(key==='day'){sky.addColorStop(0,'#8fbce0');sky.addColorStop(1,'#d9e6ee');}
    else if(key==='dusk'){sky.addColorStop(0,'#3a3a66');sky.addColorStop(.6,'#c8683c');sky.addColorStop(1,'#f0b070');}
    else if(key==='dawn'){sky.addColorStop(0,'#5a6a9a');sky.addColorStop(.7,'#e8b890');sky.addColorStop(1,'#f8dcb0');}
    else{sky.addColorStop(0,'#0a0e22');sky.addColorStop(1,'#1c2242');}
    ctx.fillStyle=sky;ctx.fillRect(0,0,256,256);
    if(key==='night'){ctx.fillStyle='#e8e8ff';for(let i=0;i<60;i++)ctx.fillRect(R()*256,R()*120,1.2,1.2);ctx.fillStyle='#f4f0d8';ctx.beginPath();ctx.arc(190,46,14,0,Math.PI*2);ctx.fill();}
    if(key==='day'){ctx.fillStyle='rgba(255,255,255,.7)';[[40,44,24],[130,30,30],[210,54,20]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.arc(x+r*.8,y-r*.3,r*.7,0,Math.PI*2);ctx.arc(x-r*.7,y+r*.1,r*.6,0,Math.PI*2);ctx.fill();});}
    // everything on the ground is drawn in day colours and pulled towards the light of the hour
    const TINT={day:[0,[0,0,0]],dawn:[.35,[110,90,120]],dusk:[.5,[70,40,60]],night:[.82,[12,14,30]]}[key];
    const col=hex=>{const c=parseInt(hex.slice(1),16),k=TINT[0],t=TINT[1];const m=(v,i)=>Math.round(v*(1-k)+t[i]*k);return `rgb(${m(c>>16,0)},${m((c>>8)&255,1)},${m(c&255,2)})`;};
    const lit=key!=='day';const glow=()=>lit?'#ffc860':col('#2a2622');
    const poly=(pts,fill)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(const q of pts.slice(1))ctx.lineTo(q[0],q[1]);ctx.closePath();ctx.fill();};
    // hills: a far blue ridge and a nearer green one
    const hill=(y0,amp,c,ph)=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,256);for(let x=0;x<=256;x+=8)ctx.lineTo(x,y0-amp*Math.sin(x*.021+ph)-amp*.5*Math.sin(x*.047+ph*2));ctx.lineTo(256,256);ctx.closePath();ctx.fill();};
    hill(150,12,col('#7c93a0'),R()*6);hill(176,9,col('#6f8a58'),R()*6);
    // the roofs by nation: thatch and slate in the Gatelands, dark shingle in the Mark, terracotta in Aurenne
    const ROOFS={gatelands:['#8a7448','#5a5e66','#7a6a44'],mark:['#4a3a2e','#3e3a36','#5a4838'],aurenne:['#a8583a','#b86a44','#9a4e34']}[nation]||['#8a7448','#5a5e66','#7a6a44'];
    const WALLS={gatelands:['#d8ccb0','#cabb98'],mark:['#8a6a4a','#7a5c40'],aurenne:['#e0cfa8','#d4b890']}[nation]||['#d8ccb0','#cabb98'];
    const tree=(x,y,r,dark)=>{ctx.fillStyle=col('#4a3622');ctx.fillRect(x-1.5,y-r*.4,3,r*.6);ctx.fillStyle=col(dark?'#3e5a2e':'#557038');ctx.beginPath();ctx.arc(x,y-r,r,0,Math.PI*2);ctx.arc(x-r*.6,y-r*.6,r*.7,0,Math.PI*2);ctx.arc(x+r*.6,y-r*.65,r*.7,0,Math.PI*2);ctx.fill();};
    const pine=(x,y,hh)=>{ctx.fillStyle=col('#34502e');ctx.beginPath();ctx.moveTo(x,y-hh);ctx.lineTo(x+hh*.28,y);ctx.lineTo(x-hh*.28,y);ctx.closePath();ctx.fill();};
    // a house: a wall with a door and a window, a steep gable roof, a chimney
    const house=(x,y,w,hh,k)=>{const wall=col(WALLS[k%2]),roof=col(ROOFS[k%3]);ctx.fillStyle=wall;ctx.fillRect(x,y-hh,w,hh);
      poly([[x-3,y-hh],[x+w/2,y-hh-w*.62],[x+w+3,y-hh]],roof);ctx.fillStyle=col('#3a2a1c');ctx.fillRect(x+w*.62,y-hh-w*.46,4,10);
      ctx.fillStyle=glow();ctx.fillRect(x+w*.2,y-hh*.7,5,6);ctx.fillStyle=col('#4a3020');ctx.fillRect(x+w*.55,y-hh*.55,6,hh*.55);};
    const tower=(x,y,w,hh,spire)=>{ctx.fillStyle=col('#a89c88');ctx.fillRect(x,y-hh,w,hh);if(spire)poly([[x-2,y-hh],[x+w/2,y-hh-w*2.2],[x+w+2,y-hh]],col(ROOFS[1]));
      else{ctx.fillStyle=col('#a89c88');for(let k=0;k<w;k+=6)ctx.fillRect(x+k,y-hh-5,3.5,5);}ctx.fillStyle=lit?'#e0a850':col('#2a2622');ctx.fillRect(x+w/2-1.5,y-hh*.75,3,7);};
    const ground=196;
    if(tier===0){
      // fields in strips, a hedge, trees, and a cottage one time in two
      [['#8a9a50',ground-4],['#a89a58',ground+10],['#7a8a48',ground+26]].forEach(([c,y])=>poly([[0,y],[256,y-6],[256,256],[0,256]],col(c)));
      ctx.fillStyle=col('#3e5a2e');for(let x=0;x<256;x+=5)ctx.fillRect(x,ground-6-2*Math.sin(x*.3),6,6);
      if(R()<.5)house(150+R()*40,ground-2,38,20,0);
      tree(30,ground+30,16,false);tree(78,ground-2,12,true);pine(118,ground-2,34);tree(222,ground+34,18,true);pine(240,ground,30);if(R()<.6)tree(190,ground-4,10,false);
    }else if(tier===1){
      // a village: gabled houses round a church tower, trees between
      tower(118,ground-8,18,54,true);
      let x=-6;const back=[];while(x<256){const w=30+R()*16;back.push([x,w]);x+=w+6+R()*10;}
      back.forEach(([bx,w],k)=>{if(bx+w>112&&bx<140)return;house(bx,ground-6,w,20+R()*8,k);});
      tree(20,ground+16,14,true);tree(236,ground+18,15,false);
      ctx.fillStyle=col('#7a8a48');ctx.fillRect(0,ground-2,256,60);
      for(let k=0;k<3;k++)house(10+k*86+R()*20,ground+18,40,26,k+1);
      ctx.fillStyle=col('#9a8a68');poly([[110,256],[146,256],[132,ground+22],[124,ground+22]],col('#9a8a68'));
    }else{
      // a city: a curtain wall with round towers, a gate, and inside the roofs, a keep and a spire
      tower(40,ground-30,22,70,false);tower(170,ground-34,16,82,true);
      let x=-8;while(x<256){const w=20+R()*16,hh=22+R()*18;house(x,ground-24,w,hh,Math.floor(R()*6));x+=w+2;}
      const wallY=ground+14,wc=col('#b0a48c');ctx.fillStyle=wc;ctx.fillRect(0,wallY-44,256,44);
      ctx.fillStyle=wc;for(let k=0;k<256;k+=10)ctx.fillRect(k,wallY-52,6,8);
      ctx.strokeStyle=col('#8a7e68');ctx.lineWidth=1;for(let y=wallY-40;y<wallY;y+=8){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}
      for(const tx of [22,128,234]){ctx.fillStyle=col('#a89c84');ctx.fillRect(tx-14,wallY-66,28,66);poly([[tx-17,wallY-66],[tx,wallY-96],[tx+17,wallY-66]],col(ROOFS[1]));ctx.fillStyle=lit?'#e0a850':col('#2a2622');ctx.fillRect(tx-2,wallY-54,4,8);}
      ctx.fillStyle=col('#2a2018');ctx.beginPath();ctx.moveTo(114,wallY);ctx.lineTo(114,wallY-18);ctx.arc(128,wallY-18,14,Math.PI,0);ctx.lineTo(142,wallY);ctx.closePath();ctx.fill();
      ctx.fillStyle=col('#6f8a58');ctx.fillRect(0,wallY,256,256-wallY);poly([[112,256],[144,256],[140,wallY],[116,wallY]],col('#9a8a68'));
      tree(60,wallY+30,12,true);tree(200,wallY+34,14,false);
    }
    const tex=new THREE.CanvasTexture(cv);WINTEX[ck]=tex;return tex;
  }
  // a window's view: the painted town of the room's own place (its settlement's prosperity and nation); a church's glass is lit
  function windowMat(type,house){if(type==='church')return new THREE.MeshBasicMaterial({color:0xc8b070});
    let tier=0,nation='gatelands';if(house){const t=houseSite(house)||(house.siteId&&siteAnywhere(house.siteId));if(t&&(t.kind in BASE_P))tier=winTier(prosperity(t));try{nation=nationAt(house.doorX,house.doorZ);}catch(e){}}
    return new THREE.MeshBasicMaterial({map:windowTexture(tier,nation)});}

  // ═══ NAVAL II (Session H) ═════════════════════════════════════════════
  // Ship classes and upgrades (speed, cargo, hull size — no hull HP),
  // fish you catch by swimming up to a school, whales in deep water,
  // pirates who board you, and hulls that push each other apart.
  const SHIP_CLASSES={sloop:{L:13,W:4.4,name:'sloop',price:0,speed:7.5,hull:100},cog:{L:17,W:5.6,name:'cog',price:900,speed:8.5,hull:140},galleon:{L:22,W:7.0,name:'galleon',price:2200,speed:9.5,hull:200}};
  const SAIL_TIERS=[0,250,450,700]; // price to reach tier 1..3, +1.2 u/s each
  const CARGO_TIERS=[0,200,400];    // +25 carry each while aboard or within 20u of her
  function shipCfg(){return worldState.ship||(worldState.ship={});}
  function shipClass(){return SHIP_CLASSES[(worldState.ship&&worldState.ship.cls)||'sloop'];}
  function shipTopSpeed(){return shipClass().speed+((worldState.ship&&worldState.ship.sails)||0)*1.2;}
  // S411 — Michael's A on #85 (docs/design/sailing.md): a hull by class and a rig of 100, kept in worldState.ship (saved).
  // Under half her hull she ships water (speed ×0.8), under a quarter ×0.6; the rig sets ×(0.5 + 0.5 × rig/100);
  // at 0 hull she is waterlogged and makes 2.5 at most. The shipwright mends 4 gold a hull point, 3 a rig point, an hour a 20.
  function shipBars(){const st=shipCfg(),mx=shipClass().hull;if(!(st.hull>=0)||st.hull>mx)st.hull=mx;if(!(st.rig>=0)||st.rig>100)st.rig=100;return {hull:st.hull,rig:st.rig,hullMax:mx,rigMax:100};}
  function shipSpeedMul(){if(!worldState.ship)return 1;const b=shipBars(),f=b.hull/b.hullMax;return (f<.25?.6:f<.5?.8:1)*(.5+.5*b.rig/100);}
  function shipSpeedNow(){const v=shipTopSpeed()*shipSpeedMul();return worldState.ship&&shipBars().hull<=0?Math.min(2.5,v):v;}
  function shipWear(hull,rig){if(!worldState.ship)return null;const b=shipBars(),st=shipCfg();hull=Math.max(0,Math.round(hull||0));rig=Math.max(0,Math.round(rig||0));
    if(b.hull===0&&hull>0&&SHIP.mesh){shipSink();return {hull:0,rig:0,sunk:true};}
    st.hull=Math.max(0,b.hull-hull);st.rig=Math.max(0,b.rig-rig);if(b.hull>0&&st.hull===0)showMsg(`The ${SHIP.name} is waterlogged. She will make two knots and a half.`,'#ff8060');shipBarsUI();return {hull:b.hull-st.hull,rig:b.rig-st.rig};}
  // S412 — the sea's state where she is, 0 calm, 1 moderate, 2 rough, 3 storm: the weather (clear and fog 0; overcast, rain and
  // snow 1; a storm 3) plus one in open water, at most 3. Open water is the sea's own floor (the bed blends to −8 at a full
  // sea cell, so the page's "below −8" is never met; −7.9 here) with no shore within 150 units. Read once a second.
  const SEA_WORD=['calm','moderate','rough','storm'];
  function weatherSea(){const t=(WX.next!==WX.type&&WX.k>=.5)?WX.next:WX.type;return t==='storm'?3:(t==='clear'||t==='fog')?0:1;}
  function openWater(x,z){if(worldH(x,z)>-7.9)return false;for(let k=0;k<12;k++){const a=k/12*Math.PI*2;for(const r of [50,100,150])if(worldH(x+Math.cos(a)*r,z+Math.sin(a)*r)>SEA_Y-1.4)return false;}return true;}
  function seaState(x,z){if(x==null){x=SHIP.x;z=SHIP.z;}return Math.min(3,weatherSea()+(openWater(x,z)?1:0));}
  // under sail in a rough sea she loses 1 hull and 1 rig a minute; in a storm with W held 1 hull every 6 s and 1 rig every 4 s,
  // half that with no key held while she still makes way, nothing hove to (under half a knot)
  function tickSeaWear(dt,fwd){
    const st=SHIP.sea||0,v=Math.abs(SHIP.speed);let h=0,r=0;
    if(st>=3&&v>.5){const m=fwd>0?1:.5;h=dt/6*m;r=dt/4*m;}else if(st===2&&v>.5){h=dt/60;r=dt/60;}
    if(!h&&!r)return;SHIP._wh=(SHIP._wh||0)+h;SHIP._wr=(SHIP._wr||0)+r;const H=Math.floor(SHIP._wh),R=Math.floor(SHIP._wr);
    if(H||R){SHIP._wh-=H;SHIP._wr-=R;shipWear(H,R);}}
  // S413 — foundering: any hull lost while she is waterlogged sinks her. The wreck lies where she went down (on the map); any
  // shipwright raises her, class and tiers, for 30% of what they cost, and she lies at his quay three game days later. The hold
  // comes up with her; the stash is the safehouse's, untouched.
  function shipCostAll(){const st=shipCfg();const cls=st.cls||'sloop';let c=SHIP_PRICE+(cls!=='sloop'?SHIP_CLASSES.cog.price:0)+(cls==='galleon'?SHIP_CLASSES.galleon.price:0);
    for(let i=1;i<=(st.sails||0);i++)c+=SAIL_TIERS[i];for(let i=1;i<=(st.cargo||0);i++)c+=CARGO_TIERS[i];return c;}
  function shipRaiseCost(){return Math.round(shipCostAll()*.3);}
  function shipSink(){const st=shipCfg();const aboard=SHIP.sailing||onDeck();
    st.sunk={x:SHIP.x,z:SHIP.z};st.hull=0;Object.assign(st,{x:SHIP.x,z:SHIP.z,yaw:SHIP.yaw});SHIP.sailing=false;SHIP.speed=0;
    for(const e of BOARDERS){if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const j=ZONES.world.enemies.indexOf(e);if(j>=0)ZONES.world.enemies.splice(j,1);}BOARDERS.length=0;
    if(SHIP.mesh){sc.remove(SHIP.mesh);SHIP.mesh=null;}if(SHIP.plat){const j=ZONES.world.platforms.indexOf(SHIP.plat);if(j>=0)ZONES.world.platforms.splice(j,1);SHIP.plat=null;}
    if(aboard){jumpY=SWIM_Y;velY=0;onGround=false;}splash(true);
    showMsg(`The ${SHIP.name} goes down. Any shipwright can raise her.`,'#ff6060');if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} sank.`);shipBarsUI();}
  // once a second: a raised ship due at her quay is put there
  function tickShipRaise(){const st=worldState.ship;if(!st||!st.sunk||!st.raise||SHIP.mesh)return;if((worldState.gameTimeAbsMinutes||0)<st.raise.due)return;
    const site=siteAnywhere(st.raise.site);if(!site)return;const sd=shoreDir(site)||{dx:1,dz:0};const q=site.quayStart||{x:site.x+sd.dx*site.pad,z:site.z+sd.dz*site.pad};
    delete st.sunk;delete st.raise;st.hull=shipClass().hull;st.rig=100;spawnShip(q.x+sd.dx*22,q.z+sd.dz*22+(sd.dx?12:0),seawardYaw(sd));
    if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} is raised and lies at ${site.name}.`);}
  function shipMendCost(){const b=shipBars();const h=b.hullMax-b.hull,r=100-b.rig;return {hull:h,rig:r,gold:h*4+r*3,mins:Math.round((h+r)*3)};}
  const SHIPBAR={ui:null};
  function shipBarsUI(){
    if(typeof document==='undefined'||!document.body)return;
    let el=SHIPBAR.ui;if(!el){el=document.createElement('div');if(!el.style)return;el.id='shipbars';el.style.cssText='position:fixed;right:14px;bottom:150px;width:150px;padding:5px 8px;background:rgba(40,30,18,.82);border:1px solid #a08a5a;border-radius:4px;color:#e8dcc0;font:11px Georgia,serif;display:none;z-index:50';
      el.innerHTML='<div id="shipbars-name" style="margin-bottom:3px"></div><div id="shipbars-sea" style="margin-bottom:3px;color:#c8b890"></div><div>Hull <span id="shipbars-hull"></span></div><div style="height:5px;background:#2a2014;margin:1px 0 3px"><div id="shipbars-hf" style="height:100%;background:#b08a4a"></div></div><div>Rig <span id="shipbars-rig"></span></div><div style="height:5px;background:#2a2014;margin-top:1px"><div id="shipbars-rf" style="height:100%;background:#d8c8a0"></div></div>';document.body.appendChild(el);SHIPBAR.ui=el;}
    const show=!!(worldState.ship&&SHIP.mesh&&activeZoneId==='world'&&!(typeof isInterior==='function'&&isInterior())&&(SHIP.sailing||onDeck()));
    const b=show?shipBars():null,key=show?`${SHIP.name}|${b.hull}|${b.hullMax}|${b.rig}|${SHIP.sea||0}`:'';if(key===SHIPBAR.key)return;SHIPBAR.key=key;el.style.display=show?'block':'none';if(!show)return;
    const q=id=>document.getElementById(id);q('shipbars-name').textContent=`The ${SHIP.name}`;q('shipbars-sea').textContent=`Sea: ${SEA_WORD[SHIP.sea||0]}`;q('shipbars-hull').textContent=`${b.hull} / ${b.hullMax}`;q('shipbars-rig').textContent=`${b.rig} / 100`;
    q('shipbars-hf').style.width=(b.hull/b.hullMax*100)+'%';q('shipbars-hf').style.background=b.hull/b.hullMax<.25?'#c85040':'#b08a4a';q('shipbars-rf').style.width=b.rig+'%';
  }
  function applyShipClass(){const c=shipClass();SHIP.L=c.L;SHIP.W=c.W;if(SHIP.mesh){sc.remove(SHIP.mesh);SHIP.mesh=buildShipMesh(SHIP.L,SHIP.W);sc.add(SHIP.mesh);shipUpdatePlacement();}}
  function cargoBonus(){if(!SHIP.mesh)return 0;const t=(worldState.ship&&worldState.ship.cargo)||0;if(!t)return 0;return (Math.hypot(px-SHIP.x,pz-SHIP.z)<20||onDeck())?t*25:0;}
  const SHIPWRIGHT_LINES={
    gatelander:{
      raisePoor:c=>`Raising her is ${c} gold. The sea gives nothing back for less, and it gives grudgingly then.`,
      raised:`Three days, and she'll be lying at the quay here, Weaver willing. A drowned boat comes up slow, like a man who knows he's in the wrong.`,
      fetchPoor:f=>`Bringing her round is ${f} gold. A boat on the wrong shore is no boat at all, but a shipwright working for thanks is no shipwright either.`,
      fetched:`The lads'll have her alongside before your cup's cold. She's at the quay.`,
      mendPoor:g=>`Putting her right is ${g} gold. A stitch in time, they say, and they never once say it's free.`,
      mended:hw=>`${hw} in the yard, and she's sound again, hull and rig. Treat her kindly and she'll return it.`,
      refitPoor:(n,p)=>`A ${n} hull is ${p} gold. A bigger boat's a bigger bill, the same as a bigger house.`,
      refitted:n=>`She's a ${n} now. Longer, broader, and she'll carry more sail. You'll hardly know her, and she'll hardly know you.`,
      sailsPoor:p=>`That canvas is ${p} gold. Good cloth was never cheap, and cheap cloth was never good.`,
      sailed:k=>`New canvas. She'll make ${k} knots with a wind, and the wind is the Weaver's business, not mine.`,
      holdPoor:p=>`The carpentry's ${p} gold. Wood is dear, and the joiner dearer.`,
      held:n=>`More room below. You'll carry ${n} more aboard her, and you'll find a way to fill it.`},
    markman:{
      raisePoor:c=>`Raising her is ${c} gold.`,
      raised:`Three days, and she'll be lying at the quay here.`,
      fetchPoor:f=>`Bringing her round is ${f} gold.`,
      fetched:`Lads'll have her alongside by the time you've finished your drink. She's at the quay.`,
      mendPoor:g=>`Putting her right is ${g} gold.`,
      mended:hw=>`${hw} in the yard. She's sound again, hull and rig.`,
      refitPoor:(n,p)=>`A ${n} hull is ${p} gold.`,
      refitted:n=>`She's a ${n} now. Longer, broader, and she'll carry more sail.`,
      sailsPoor:p=>`That canvas is ${p} gold.`,
      sailed:k=>`New canvas. She'll make ${k} knots with a wind.`,
      holdPoor:p=>`The carpentry's ${p} gold.`,
      held:n=>`More room below. You'll carry ${n} more aboard her.`},
    aurennais:{
      raisePoor:c=>`The raising is ${c} gold, Master, payable before the work.`,
      raised:`Three days, Master, and she will be lying at the quay here. The yard's receipt is entered.`,
      fetchPoor:f=>`Bringing her round is ${f} gold, Master. The fee covers the crew and the tow.`,
      fetched:`The yard's crew has her alongside, Master. She is at the quay, as agreed.`,
      mendPoor:g=>`The repair is ${g} gold, Master, at the yard's posted rate.`,
      mended:hw=>`${hw} in the yard, Master. She is sound again, hull and rig, and the work is warranted to the next storm, if not through it.`,
      refitPoor:(n,p)=>`A ${n} hull is ${p} gold, Master. The yard does not extend credit on hulls.`,
      refitted:n=>`She is a ${n} now, Master: longer, broader, and rated for more sail. The new rating is entered against her name.`,
      sailsPoor:p=>`That canvas is ${p} gold, Master.`,
      sailed:k=>`New canvas, Master. Under a fair wind she should make ${k} knots. The yard warrants the cloth, not the wind.`,
      holdPoor:p=>`The joinery is ${p} gold, Master.`,
      held:n=>`More room below, Master. She is rated for ${n} more aboard.`},
    oldblood:{
      raisePoor:c=>`${c} gold, to raise her.`,
      raised:`Three days. She will be at the quay.`,
      fetchPoor:f=>`${f} gold, to bring her round.`,
      fetched:`She is at the quay.`,
      mendPoor:g=>`${g} gold.`,
      mended:hw=>`${hw} in the yard. Sound again, hull and rig.`,
      refitPoor:(n,p)=>`A ${n} hull is ${p} gold.`,
      refitted:n=>`A ${n} now. Longer. Broader. More sail.`,
      sailsPoor:p=>`${p} gold, the canvas.`,
      sailed:k=>`New canvas. ${k} knots, with a wind.`,
      holdPoor:p=>`${p} gold, the joinery.`,
      held:n=>`More room below. ${n} more.`}};
  function upgradeTopics(site){
    if(!worldState.ship)return [];
    const st=shipCfg();const out=[];const L=SHIPWRIGHT_LINES[peopleOfSite(site)]||SHIPWRIGHT_LINES.markman;
    if(st.sunk){if(st.raise)return out;const rc=shipRaiseCost();out.push({label:`Raise the ${st.name||SHIP.name} (${rc} gold)`,quest:true,fn:()=>{const c=shipRaiseCost();if(gold<c)return L.raisePoor(c);gold-=c;updateHUD();
      st.raise={site:site.id,due:(worldState.gameTimeAbsMinutes||0)+3*1440};if(typeof addLog==='function')addLog('⛵',`Paid ${site.name}'s shipwright to raise the ${st.name||SHIP.name}.`);return L.raised;}});return out;}
    if(SHIP.mesh&&!shipHere(site)){const fee=Math.min(150,Math.round(25+Math.hypot(SHIP.x-site.x,SHIP.z-site.z)/200));out.push({label:`Fetch the ${SHIP.name} to this harbour (${fee} gold)`,quest:true,fn:()=>{if(gold<fee)return L.fetchPoor(fee);gold-=fee;updateHUD();const sd=shoreDir(site)||{dx:1,dz:0};const q=site.quayStart||{x:site.x+sd.dx*site.pad,z:site.z+sd.dz*site.pad};SHIP.x=q.x+sd.dx*22;SHIP.z=q.z+sd.dz*22+ (sd.dx?12:0);SHIP.yaw=seawardYaw(sd);SHIP.speed=0;SHIP.sailing=false;shipUpdatePlacement();Object.assign(worldState.ship,{x:SHIP.x,z:SHIP.z,yaw:SHIP.yaw});if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} brought round to ${site.name}.`);return L.fetched;}});}
    const mc=shipMendCost();if(mc.gold>0&&shipHere(site)){const b=shipBars();out.push({label:`Mend her: hull ${b.hull} of ${b.hullMax}, rig ${b.rig} of 100 (${mc.gold} gold)`,quest:true,fn:()=>{const m=shipMendCost();if(gold<m.gold)return L.mendPoor(m.gold);gold-=m.gold;updateHUD();
      const s2=shipCfg();s2.hull=shipClass().hull;s2.rig=100;if(typeof advanceClock==='function')advanceClock(m.mins);else worldState.gameTimeMinutes+=m.mins;shipBarsUI();const h=Math.max(1,Math.round(m.mins/60));
      if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} mended at ${site.name}.`);return L.mended(h===1?'An hour':h+' hours');}});}
    const cls=st.cls||'sloop';const next=cls==='sloop'?'cog':cls==='cog'?'galleon':null;
    if(next)out.push({label:`Refit her as a ${next} (${SHIP_CLASSES[next].price} gold)`,quest:true,fn:()=>{const p=SHIP_CLASSES[next].price;if(gold<p)return L.refitPoor(next,p);gold-=p;updateHUD();st.cls=next;st.hull=SHIP_CLASSES[next].hull;applyShipClass();if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} refitted as a ${next}.`);return L.refitted(next);}});
    const sails=st.sails||0;if(sails<3)out.push({label:`Better sails, tier ${sails+1} (${SAIL_TIERS[sails+1]} gold)`,quest:true,fn:()=>{const p=SAIL_TIERS[sails+1];if(gold<p)return L.sailsPoor(p);gold-=p;updateHUD();st.sails=sails+1;return L.sailed(shipTopSpeed().toFixed(1));}});
    const cargo=st.cargo||0;if(cargo<2)out.push({label:`Bigger hold, tier ${cargo+1} (${CARGO_TIERS[cargo+1]} gold)`,quest:true,fn:()=>{const p=CARGO_TIERS[cargo+1];if(gold<p)return L.holdPoor(p);gold-=p;updateHUD();st.cargo=cargo+1;return L.held(25*(cargo+1));}});
    return out;
  }
  // ── fish ──
  const FISH_KINDS={shallow:['Herring','Bream','Mackerel'],deep:['Cod','Silverfin','Ling'],cold:['Char','Haddock'],warm:['Grouper','Snapper']};
  function nearSchool(){if(!isSwimming())return null;for(const s of LIFE.fish){if(s.cool>0)continue;if(Math.hypot(px-s.cx,pz-s.cz)<s.r+1.4&&Math.abs(jumpY-s.y)<1.6)return s;}return null;}
  function fishPrompt(){return nearSchool()?"Press 'E' to catch a fish":null;}
  function catchFish(){const s=nearSchool();if(!s)return false;
    const [i,j]=cellOf(px,pz);const cl=climateOfCell(i,j);const bed=worldH(px,pz);
    const pool=(cl==='cold'&&Math.random()<.5)?FISH_KINDS.cold:(cl==='warm'&&Math.random()<.5)?FISH_KINDS.warm:bed<-5?FISH_KINDS.deep:FISH_KINDS.shallow;
    const name=pool[Math.floor(Math.random()*pool.length)];const big=Math.random()<.12;
    const item={name:(big?'Fine ':'')+name,ico:'🐟',type:'misc',weight:big?1.2:.6,sellMult:big?1.2:.7,buyPrice:big?26:9,qty:1,_typeKey:'fish'};
    if(typeof canCarry==='function'&&!canCarry(item)){showMsg('Too heavy to carry!','#cc8844');return true;}
    if(typeof bagAdd==='function')bagAdd(item);s.cool=18+Math.random()*12;splash(false);showMsg(`Caught a ${item.name}.`,'#88cc88');if(typeof addLog==='function')addLog('🐟',`Caught a ${item.name}.`);return true;}
  function tickSchoolCool(dt){for(const s of LIFE.fish)if(s.cool>0)s.cool-=dt;}
  // ── whales ──
  const WHALES=[];
  function spawnWhale(x,z){const c=k=>new THREE.Color(k);const g=mergeParts([{geo:new THREE.CylinderGeometry(1.6,.7,14,10),color:c(0x3a4650),rx:Math.PI/2,jitter:.03},{geo:new THREE.SphereGeometry(1.7,10,8),color:c(0x3a4650),z:7,jitter:.03},{geo:new THREE.BoxGeometry(5.2,.3,2.2),color:c(0x2e3a44),z:-8.2,jitter:.03},{geo:new THREE.ConeGeometry(.5,1.2,4),color:c(0x2e3a44),y:1.6,z:-2},{geo:new THREE.BoxGeometry(2.6,.25,1.4),color:c(0x2e3a44),x:2.2,z:2.5,y:-.6},{geo:new THREE.BoxGeometry(2.6,.25,1.4),color:c(0x2e3a44),x:-2.2,z:2.5,y:-.6}]);
    const m=new THREE.Mesh(g,VC_MAT);sc.add(m);const w={m,x,z,yaw:Math.random()*Math.PI*2,ph:Math.random()*10,spout:null};
    const sp=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(60*3),3)),new THREE.PointsMaterial({color:0xe8f0f8,size:.35,transparent:true,opacity:.8,depthWrite:false}));sp.visible=false;sc.add(sp);w.spout=sp;WHALES.push(w);return w;}
  function tickWhales(dt,now){
    if(atSea()&&WHALES.length<2&&Math.random()<dt*.04){for(let k=0;k<10;k++){const a=Math.random()*Math.PI*2,d=180+Math.random()*220;const x=px+Math.cos(a)*d,z=pz+Math.sin(a)*d;if(worldH(x,z)<-6){spawnWhale(x,z);break;}}}
    for(let i=WHALES.length-1;i>=0;i--){const w=WHALES[i];if(Math.hypot(w.x-px,w.z-pz)>700){sc.remove(w.m);sc.remove(w.spout);WHALES.splice(i,1);continue;}
      w.yaw+=Math.sin(now*.0003+w.ph)*.15*dt;const fx=-Math.sin(w.yaw),fz=-Math.cos(w.yaw);const nx=w.x+fx*2.2*dt,nz=w.z+fz*2.2*dt;if(worldH(nx,nz)<-6){w.x=nx;w.z=nz;}else w.yaw+=1.2*dt;
      const t=now*.0009+w.ph;const surf=Math.sin(t);const y=SEA_Y-3.2+surf*3.4;w.m.position.set(w.x,y,w.z);w.m.rotation.y=w.yaw+Math.PI;w.m.rotation.x=-Math.cos(t)*.25;
      const up=surf>.85;w.spout.visible=up;if(up){const p=w.spout.geometry.attributes.position.array;for(let k=0;k<60;k++){const h=(k/60)*(4+surf*2),spread=.2+h*.25;p[k*3]=w.x+fx*4+(Math.random()-.5)*spread;p[k*3+1]=y+1.8+h;p[k*3+2]=w.z+fz*4+(Math.random()-.5)*spread;}w.spout.geometry.attributes.position.needsUpdate=true;if(!w._blew){w._blew=true;if(typeof sfxNoise==='function'&&Math.hypot(w.x-px,w.z-pz)<120)sfxNoise(.9,0,0,.12,900);}}else w._blew=false;}
  }
