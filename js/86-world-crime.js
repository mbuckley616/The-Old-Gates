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
    landGrassDrop(ch); // S1184 (F3): snow lying or melting changes where grass may stand; the next frames grow it again
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
    if(inWorld){const c=cellOf(px,pz),ck=c[0]+','+c[1];if(ck!==WX.cell){const moved=WX.cell!=null;WX.cell=ck;if(moved&&WX.timer<=330){const w=weatherWeights();if(!(w[WX.type]>0)||!(w[WX.next]>0)||(WX.nextHeavy&&!(w[wxName(WX.next,1)]>0))){WX.timer=0;WX.rerolls=(WX.rerolls||0)+1;}}}}
    WX.timer-=dt;
    if(WX.timer<=0){WX.timer=150+Math.random()*180;wxSetNext(WX.ahead||pickWeather());WX.ahead=null;if(WX.next!==WX.type)WX.k=0;} /* S553 — a shift the oilskin foretold comes as foretold */
    // S1433 — a blizzard is snow and heavy rain is rain, with WX.heavy (0 to 1) easing in and out over the 25 s a change takes
    {const ht=WX.nextHeavy&&WX.nextHeavy===WX.next?1:0,h0=WX.heavy||0;WX.heavy=ht>h0?Math.min(ht,h0+dt/25):Math.max(ht,h0-dt/25);}
    if(WX.next!==WX.type){WX.k+=dt/25;if(WX.k>=1){WX.type=WX.next;WX.k=0;}}
    const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?WX.k:0;
    const inten=t=>t==='rain'?.7:t==='storm'?1:t==='snow'?.8:t==='fog'?.6:t==='overcast'?.35:0;
    WX.intensity=(inten(cur)*(1-mix)+inten(nxt)*mix)*(1+.2*WX.heavy);
    const rainAmt=(cur==='rain'||cur==='storm'?1:0)*(1-mix)+(nxt==='rain'||nxt==='storm'?1:0)*mix;
    const snowAmt=(cur==='snow'?1:0)*(1-mix)+(nxt==='snow'?1:0)*mix;
    const storm=(cur==='storm'?1:0)*(1-mix)+(nxt==='storm'?1:0)*mix;WX.storm=storm;WX.wind=windDir();WX.windy=gateWindy(); /* S1369 — Gaoth's toll on Aurenne, for the look's trees */
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
    const hv=1+.6*WX.heavy,rainShown=Math.min(1,rainAmt*.62*sRain*hv),snowShown=Math.min(1,snowAmt*.58*sSnow*hv);
    upd(WX.rain,rainShown,26,1.5,12);upd(WX.snow,snowShown,2.2+2*WX.heavy,1.2+6*WX.heavy,12); /* S1433 — a blizzard's snow is driven */
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
    if(inWorld&&storm>.5&&WX.flashT<=0){WX.flashT=6+Math.random()*14;WX.flash=.14;thunder(.4+Math.random()*2.2);if(typeof noonRingFlash==='function'&&noonRingFlash())WX.flash=.3;} /* S786 — the Noon Ring draws one in three close */
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
    const target=(rainAmt*.055*(WX.sRain||1)+stormAmt*.075*(WX.sRain||1)+snowAmt*.012*(WX.sSnow||1))*mul*(1+.6*(WX.heavy||0)); // rain was .11 flat: too loud in the open
    WX.rainG.gain.value+=(target-WX.rainG.gain.value)*Math.min(1,dt*(target<WX.rainG.gain.value?3.5:2));
    // snow is a breath of wind, not a hiss: the same noise, filtered low
    if(WX.rainF){const snowy=snowAmt>(rainAmt+stormAmt);
      const f=snowy?380:2600,q=snowy?.25:.5;
      WX.rainF.frequency.value+=(f-WX.rainF.frequency.value)*Math.min(1,dt*1.2);WX.rainF.Q.value=q;}
  }
  // called from atmosphere() after the day/night targets are computed
  function applyWeather(){
    const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?WX.k:0;
    WX.sightM=wxSightBlend(cur,nxt,mix,WX.heavy||0);
    const I=WX.intensity;if(I<=0&&!(WX.flash>0))return;
    const col=(t)=>_tmpWx.setHex(WX_COL[t]||0x8a8f96);
    _tmpWx2.copy(col(cur));if(mix>0)_tmpWx2.lerp(col(nxt),mix);
    const night=(typeof _nightFactor==='function')?_nightFactor():0;
    _atm.sky.lerp(_tmpWx2,I*.85);
    // fog colour: the weather's grey by day, a dim blue-grey at night (never black — fogged things must still read)
    _tmpWx.setHex(0x2c3440).lerp(_tmpWx2,.35);_atm.fog.lerp(night>.5?_tmpWx:_tmpWx2,I*.85);
    // visibility: S1420 — Michael's C on #679, by kind: the weather closes the land to its own sight in metres (WX_SIGHT) and
    // no nearer, at any hour and in any country, so fog is 60 m everywhere and a wet day is still a day you travel in. The
    // place's own haze stays under it (a forest's clear day is thicker than rain's 500 m); the weather no longer multiplies it.
    const foggy=(cur==='fog'?1:0)*(1-mix)+(nxt==='fog'?1:0)*mix;
    WX.fogMul=1;WX.fogFloor=wxSightDen(WX.sightM);
    WX.sunMul=1-I*(.55+foggy*.18);
    if(WX.flash>0){_atm.sky.setHex(0xe8eefc);_atm.fog.lerp(_tmpWx.setHex(0xdde6f4),.6);WX.sunMul=2.2;}
  }
  /* S1420 — how far you see in each weather (Michael's C on #679, the concept artist's table in weather.js): metres to where the land
     is 95% gone in the fog (FogExp2's density √3 / sight). A change of weather blends in density, as the fog itself does. S1433 — the
     blizzard (70 m) and the heavy rain (280 m) are snow and rain with WX.heavy at 1 (#723): the weather's kind stays one of the six,
     so everything that reads 'snow' or 'rain' reads them too, and the sight eases from the kind's row to the heavy one's. */
  const WX_SIGHT={clear:2400,overcast:1100,rain:500,storm:220,snow:400,fog:60,blizzard:70,heavyrain:280};
  const WX_HEAVY={blizzard:'snow',heavyrain:'rain'};
  function wxName(t,h){return h?(t==='snow'?'blizzard':t==='rain'?'heavyrain':t):t;}
  // the next weather by the roll's name: a heavy kind is its own kind, marked heavy
  function wxSetNext(k){WX.next=WX_HEAVY[k]||k;WX.nextHeavy=WX_HEAVY[k]?WX.next:null;}
  function wxSightDen(m){return Math.sqrt(3)/Math.max(1,m);}
  function wxDen(t,h){const d=wxSightDen(WX_SIGHT[t]||WX_SIGHT.clear),hk=h>0&&wxName(t,1);return hk&&hk!==t?d+(wxSightDen(WX_SIGHT[hk])-d)*h:d;}
  function wxSightBlend(cur,nxt,mix,h){const a=wxDen(cur,h||0),b=wxDen(nxt,h||0);return Math.sqrt(3)/(a+(b-a)*(mix||0));}
  // the same figure for the foes' sight in the open (canSeePlayer): nobody sees you through fog the land itself is lost in
  function wxSightCap(){if(typeof activeZoneId==='undefined'||activeZoneId!=='world'||lid!=='overworld'||(typeof isInterior==='function'&&isInterior()))return Infinity;return WX.sightM||WX_SIGHT.clear;}
  /* S2211 — Michael's B on #1511 (OG-138, backlog L12), its first half: rain and snow cover your steps, in the open only. The share of
     the walking hearing (3 m) a foe keeps: rain or snow 2/3 (2 m), a storm, heavy rain or a blizzard 1/2 (1.5 m); by the weather's
     kind, as the sight is, eased through a change and through WX.heavy. hearingRadius (10-player.js) floors sneaking at the still 0.9 m. */
  const WX_HEAR={rain:2/3,snow:2/3,storm:.5};
  function wxHearKind(t,h){const k=WX_HEAR[t]||1;return (t==='rain'||t==='snow')?k+(.5-k)*(h||0):k;}
  function wxHearScale(){if(typeof activeZoneId==='undefined'||activeZoneId!=='world'||lid!=='overworld'||(typeof isInterior==='function'&&isInterior()))return 1;
    const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?(WX.k||0):0,h=WX.heavy||0;const a=wxHearKind(cur,h),b=wxHearKind(nxt,h);return a+(b-a)*mix;}
  /* S2216 — Michael's B on #1511, its second half: the wind carries an arrow sideways along windDir(), in the open only (no wind
     indoors, in a gate or in a legacy zone). Across the flight at a breeze's 0.4 m/s², rain or snow's 0.8, a storm's or a blizzard's 2.0
     (plain snow eases to it with WX.heavy; heavy rain stays rain's 0.8). A full crosswind drifts a 28 m/s arrow 0.23 / 0.46 / 1.15 m at
     30 m. Read off the clock and the weather, both saved, so co-op holds. Long eye (Bow 75) halves it for your own arrows (tickArrowMotion). */
  const WX_WIND={rain:.8,snow:.8,storm:2};
  function wxWindKind(t,h){const k=WX_WIND[t]||.4;return t==='snow'?k+(2-k)*(h||0):k;}
  function wxWindAcc(){if(typeof activeZoneId==='undefined'||activeZoneId!=='world'||lid!=='overworld'||(typeof isInterior==='function'&&isInterior()))return 0;
    const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?(WX.k||0):0,h=WX.heavy||0;const a=wxWindKind(cur,h),b=wxWindKind(nxt,h);return a+(b-a)*mix;}
  // the crosswind on a flight (vx, vz): the wind's push less its share along the flight, so a head or tail wind carries nothing
  function arrowWindAcc(vx,vz,mult){const A=wxWindAcc()*(mult==null?1:mult);if(!A)return null;const w=windDir(),wx=Math.sin(w)*A,wz=Math.cos(w)*A;
    const l=Math.hypot(vx,vz);if(l<1e-6)return null;const dx=vx/l,dz=vz/l,along=wx*dx+wz*dz;return {x:wx-along*dx,z:wz-along*dz};}
  const _tmpWx=new THREE.Color(),_tmpWx2=new THREE.Color();
  window.devWeather=function(t){if(!t)return wxName(WX.type,WX.heavy>.5)+(WX.next!==WX.type?' → '+wxName(WX.next,WX.nextHeavy===WX.next):'');wxSetNext(t);WX.k=0;WX.timer=240;return 'weather → '+t;};

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
  // S1285 — the Mark's alehall (Michael's A on DECISION #588): one hall, and a guest rents a place on the furred wall bench, not a
  // room up a stair. The look builder hangs it in a Markish inn and marks it house.kit.alehall; innBench(house) reads that mark, and
  // the keeper then lets six places, three on each bench, left and right as you come in from the door, by these words
  const INN_BENCH_LINES={
    markman:{
      made:'Your place is laid already. Furs and all.',
      madeNamed:R=>`${R}. Your furs are laid. Nobody sits there but you.`,
      empty:'Benches are empty tonight. Just you and the fire.',
      one:'One other on the benches tonight.',
      many:n=>`${n} others on the benches tonight.`,
      offer:(o,p,r)=>`${o} ${p} gold buys a place on the bench — ${r} — with furs, the fire all night, and porridge at first light. Want it?`,
      full:'Every place on the benches is taken tonight. The floor by the hearth’s free, and it’s warm.',
      poor:(p,g)=>`${p} gold, and you’ve ${g}. Come back with it.`,
      paid:(p,R)=>`${p} gold. Aye. ${R}, yours till this time tomorrow. What lies on the next place belongs to whoever sleeps there. Hall keeps the peace, by iron.`,
      not:'Suit yourself. The fire’s free.'}};
  const INN_BENCH_GREET=["Fire's lit. Find a bench.","Benches by the wall. Bowl's on the way.","We don't ask where you've been. Boots off, though."];
  function innBench(house){return !!(house&&house.type==='inn'&&house.kit&&house.kit.alehall);}
  function innBenchName(k){if(k==null)return 'a place on the bench';if(k>5)return 'a place on the benches';
    return `${['the place by the door','the middle place','the place by the counter'][k%3]} on the ${k<3?'left':'right'} bench`;}
  // S783 — the Waylamp at the inns (the approved draft's words, by the inn's people): the holder's *The lamp over the door?* and
  // each house's *The lamp.* on the trial; the rules are lampHangsAt / lampTake / lampTrim (87-world-quests.js)
  const LAMP_LINES={
    gatelander:{over:"That lamp was over the door when my mother had the house, and over some other door before that, and nobody I ever asked could say whose door it was first. It goes from house to house, and the one rule is it goes with somebody honest. Carry it to five inns in five towns, and keep your hands to yourself the length of the road, and it's yours. A light's no use to a house that keeps it.",
      take:"Then take it down yourself; it'll not come for me. Mind it, now. A lamp's like a name: easy carried, hard lit again.",not:"It's waited longer than you'll keep it waiting.",
      trim:(n,l)=>`You're carrying the lamp. Here, let me trim it. ${n} ${plural(n,'house')}, and ${l} to go; a road's shorter walked than talked about.`,again:"This house has trimmed it once. It's another town's turn.",
      fifth:"That's five, and it's yours, and I'd not take it off you now if you asked. They say the lamp knows the road it came by. If it does, it's said nothing to me."},
    markman:{over:"Lamp's not mine. Never was. Goes inn to inn. Carry it to five towns' inns, lit, no thieving on the way, and it's yours. That's the rule. I didn't make it.",
      take:'Take it, then. Keep it lit.',not:"It'll be here.",trim:(n,l)=>`The lamp. Give it here. Wick's trimmed. ${n} done, ${l} left.`,again:'Trimmed it already. Next town.',fifth:"Five. It's yours. Don't lose it."},
    aurennais:{over:'The lamp is not the house\'s property, Master, though it is in the house\'s keeping. It passes from inn to inn on one condition: that whoever carries it carries it into five towns\' inns, lit, without a crime against their name. On the fifth it becomes theirs. No one has written the terms down. No one has needed to.',
      take:'It is in your keeping from this moment, Master. The house wishes you a straight road.',not:'It will be here, Master. It generally is.',
      trim:(n,l)=>`The lamp, Master. Allow me to trim it. That is ${n} ${plural(n,'house')} entered, and ${l} remaining.`,again:"This house has trimmed it already, Master. Another town's house must.",
      fifth:'That is the fifth house, Master. The lamp is yours by the only terms it has ever had, and the house is honoured to have witnessed them.'},
    oldblood:{over:'Lóchrann an Teallaigh. It goes from hearth to hearth. Five inns, five towns. Steal nothing. Then it is yours.',take:'Take it down.',not:'It waits.',
      trim:(n,l)=>`The lamp. There. ${n}. ${l} more.`,again:'Not here again.',fifth:'Five. It is yours. It was always going to someone.'}};
  // S784 — the lamp held: the room offer's first sentence, and the house's thanks when it is given to hang over its door
  const LAMP_HELD={
    gatelander:{room:"There's no charge to the one carrying that lamp. There never was, and I'd not be the first.",
      give:"Over my door? You'll not want it back, now; that's the way of it. The town will know who brought it, and a town's memory is longer than a lord's. Sit; the first cup's the house's, and so's the last."},
    markman:{room:"You've the lamp. No charge.",give:"Over this door? Good. The town'll know it was you. Drink's on the house."},
    aurennais:{room:"The lamp's bearer is not charged, Master. That is the custom, and the house keeps it.",
      give:'You do the house a great honour, Master, and the town also; the town will know whose. Permit me to say that very few who earn the lamp give it up. Fewer than the custom would like.'},
    oldblood:{room:'The lamp pays.',give:'Here. Good. The town will remember you.'}};
  function lampTopics(house,people){if(house.coachInn)return [];const LL=LAMP_LINES[people]||LAMP_LINES.gatelander;
    return [{label:'The lamp over the door?',avail:()=>typeof lampHangsAt==='function'&&lampHangsAt(house),response:LL.over,
        follow:[{label:'I’ll carry it.',quest:true,fn:()=>lampTake(house)?LL.take:LL.not},{label:'Not today.',response:LL.not}]},
      {label:'The lamp.',quest:true,avail:()=>typeof lampTrimAvail==='function'&&lampTrimAvail(house),fn:()=>{const r=lampTrim(house);return !r?LL.again:r.again?LL.again:r.fifth?LL.fifth:LL.trim(r.n,r.left);}},
      {label:'Give the lamp to the house.',quest:true,avail:()=>typeof lampOwn==='function'&&lampOwn(),fn:()=>lampGive(house)?(LAMP_HELD[people]||LAMP_HELD.gatelander).give:LL.not}];}
  function innTopics(house,people){const L=innBench(house)?(INN_BENCH_LINES[people]||INN_BENCH_LINES.markman):(INN_ROOM_LINES[people]||INN_ROOM_LINES.markman);const cap=t=>t.replace(/^./,c=>c.toUpperCase());
    return [{label:'Something to eat and drink?',trade:true,fn:()=>{feastMeal(house);}},{label:'A bed for the night?',
          get response(){const price=innPrice(house),n=innRooms(house),taken=innTaken(house),free=innFreeRoom(house);
            if(rentedNow(house.id)){const mine=myRoom(house.id);return mine==null?L.made:L.madeNamed(cap(innRoomName(mine,n,house)));}
            const others=taken===0?L.empty:taken===1?L.one:L.many(taken);
            const fl=feastInnLine(people),lf=!house.coachInn&&typeof lampFree==='function'&&lampFree()?(LAMP_HELD[people]||LAMP_HELD.gatelander).room+' ':'';return lf+(fl?fl+' ':'')+L.offer(others,price,innRoomName(free,n,house));}, /* S784 — the Waylamp's bearer: the lamp's line first, then the house's own offer */
          get follow(){const price=innPrice(house);if(rentedNow(house.id))return [];
            const lamp=!house.coachInn&&typeof lampFree==='function'&&lampFree();
            return [{label:lamp?'Yes.':`Yes. ${price} gold.`,quest:true,fn:()=>{const n=innRooms(house),free=innFreeRoom(house);
              if(free==null)return L.full;
              if(lamp){worldState.rented={id:house.id,room:free,until:(worldState.gameTimeAbsMinutes||0)+24*60};if(innBench(house))worldState.rented.bench=1;if(typeof addLog==='function')addLog('🛏️',`Rented ${innRoomName(free,n,house)} at ${house.name}; the Waylamp's bearer is not charged.`);return L.madeNamed(cap(innRoomName(free,n,house)));} /* S784 — the lamp pays */
              if(gold<price)return L.poor(price,gold);
              gold-=price;updateHUD();worldState.rented={id:house.id,room:free,until:(worldState.gameTimeAbsMinutes||0)+24*60};if(innBench(house))worldState.rented.bench=1;
              if(typeof addLog==='function')addLog('🛏️',`Rented ${innRoomName(free,n,house)} at ${house.name} for ${price} gold.`);
              return L.paid(price,cap(innRoomName(free,n,house)));}},
            {label:'Not tonight.',response:L.not}];}},{label:'What’s cooking?',fn:()=>typeof dishTalkSay==='function'?dishTalkSay(house,people):''},...lampTopics(house,people)];} /* S2035 — cooking B: the innkeeper teaches one dish a day */
  // S550 — a feast day: the innkeeper's line comes before the room offer, and the meal (a Hot Stew) is the house's, once
  // a feast at each inn, put in your pack when you ask for something to eat; the shop opens as on any day
  function feastInnLine(people){const f=typeof feastOn==='function'&&feastOn(absMin());return f?(FEAST_INN[people]||FEAST_INN.gatelander):'';}
  // S1859 — and on a wedding day in the town (A Fish for the Wedding, S1857: a fine fish brought, `erWeddingAt`), the same stew, once
  function feastMeal(house){if(!house)return false;const f=typeof feastOn==='function'&&feastOn(absMin()),sid=house.siteId||house.site,
    wed=!f&&sid&&typeof erWeddingAt==='function'&&erWeddingAt(sid);if(!f&&!wed)return false;const key=house.id+'@'+dayNow(),M=worldState.feastMeals||(worldState.feastMeals={});
    if(M.day!==dayNow()){for(const k in M)delete M[k];M.day=dayNow();}if(M[key])return false;
    const st=(SHOP_STOCK.inn||[]).find(i=>i.name==='Hot Stew');if(!st)return false;M[key]=1;bagAdd({...st,qty:1});
    if(typeof updateHUD==='function')updateHUD();showMsg(wed?'🥣 Hot Stew — the wedding’s meal, on the house.':`🥣 Hot Stew — ${f.name}’s meal, on the house.`,'#e8c890');return true;}
  // S551 — the barber's fee (Michael's A on DECISION #151): one fee for the visit, an inn room's price in that place (a town
  // 9–17, a city 17–25, by house); anything on the look page may change for it, and leaving with nothing changed costs
  // nothing. barberPay(house, changed) is what the chair's look page (slice 2) calls when you rise: 'free' when nothing
  // changed, 'poor' when the purse is short (nothing taken), else 'paid'.
  function barberFee(house){return innPrice(house);}
  function barberPay(house,changed){if(!changed)return 'free';const fee=barberFee(house);if(gold<fee)return 'poor';gold-=fee;if(typeof updateHUD==='function')updateHUD();
    if(typeof addLog==='function')addLog('✂',`Paid ${fee} gold at ${house.name||'the barber’s'}.`);return 'paid';}
  function innRooms(house){if(innBench(house))return 6; /* S1285 — the alehall: three places on each wall bench */if(kitTavern(house))return 3; /* S1320 — Aurenne's tavern: three rooms upstairs */if(kitCoachRoom(house))return 8; /* S1368 — the town's coaching inn: eight rooms on two floors (#660 A) */if(kitTaproom(house))return house.kit.bays; /* S1161 — the kit's taproom: three rooms off the passage (two on two bays, S1276) */const W=Math.max(10,Math.min(12,(house.w||6)*1.6))/SCALE.ROOM_K;return Math.max(1,Math.floor(W/3.4));} /* S896 (F2a) — as buildInteriorFor lays out the gallery's rooms: the hall's true width in the kit's unit, a room every 3.4 */
  // v80 S424 — the rooms stand in one row behind the gallery, room 0 at the west wall, and you come up the stair facing
  // their doors: from a west stair every door is on your right, the nearest room 0's; from an east stair on your left,
  // the nearest the last room's. The names count the doors from the stair head (were left and right in turn, from room 0).
  function galleryEast(house){if(kitTavern(house))return false; /* S1320 — the tavern's stair is up the west wall */if(kitTaproom(house))return true; /* S1161 — the kit's taproom: its stair is up the east gable */return String(house.id||'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,3)%2===1;}
  function innRoomName(k,n,house){if(innBench(house))return innBenchName(k); /* S1285 — the alehall's places */if(k==null)return 'a room';if(kitCoachRoom(house)&&COACH_ROOM_NAMES[k])return 'the '+COACH_ROOM_NAMES[k]; /* S1368 — the coaching inn's rooms by floor and side */if(n<=1)return 'the room at the top of the stairs';
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
        const bn=innBench(h); /* S1285 — the alehall: a place on the bench, not a room */
        showMsg(`${innGuestRoom(h,bd.room)?(bn?"Another guest's place.":"Another guest's room."):(bn?'An empty place, not the one you took.':'An empty room, not the one you took.')} Yours is ${innRoomName(mine,innRooms(h),h)}.`,'#c8b880');return true;
      }
      showMsg(innBench(h)?'The keeper lets the places on the benches. Ask at the counter.':'The innkeeper lets the rooms. Ask at the counter.','#c8b880');return true;
    }
    return false;
  }
  function bedPrompt(bd){const h=currentHouse;const owner=bd.owner||'free';
    if(owner==='inn'&&innBench(h)){if(!rentedNow(h.id))return `Ask the keeper for a place on the bench (${innPrice(h)} gold)`; /* S1285 — the alehall */
      const mine=myRoom(h.id);if(mine!=null&&bd.room!=null&&bd.room!==mine)return innGuestRoom(h,bd.room)?"Another guest's place":'Not your place';if(mine!=null)return "Your place \u2014 press 'E' to rest";}
    if(owner==='inn'&&!rentedNow(h.id))return `Ask the innkeeper for a room (${innPrice(h)} gold)`;
    if(owner==='inn'){const mine=myRoom(h.id);if(mine!=null&&bd.room!=null&&bd.room!==mine)return innGuestRoom(h,bd.room)?"Another guest's room":'Not your room';if(mine!=null)return "Your room \u2014 press 'E' to rest";} // v80 S141
    if(owner==='home'&&!ownedHouse(h.id))return null;if(owner==='guild'&&!guildMember(h.guild))return "Members' beds";return "Press 'E' to rest";}
  // ── buying a house ──
  function housePrice(house){const k=house.siteKind||'village';const base={village:450,town:900,port:800,city:1500,garrison:700}[k]||600;const hh=String(house.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,3);return base+((hh%7)*50);}
  function forSale(house){if(house.type!=='home'||ownedHouse(house.id))return false;const hh=String(house.id).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,11);return (hh%100)<28;}
  function buyHouse(house){
    if(ownedHouse(house.id)){if(typeof closeDialog==='function')closeDialog();return false;} // S530 — bought once; a stale topic charges nothing
    const price=housePrice(house);if(gold<price)return `She'd take ${price} gold for it. Not a coin less.`;
    gold-=price;updateHUD();(worldState.owned||(worldState.owned={}))[house.id]={name:house.name,site:house.siteId};
    house.name='Your House';house.ownedByPlayer=true;
    if(typeof addLog==='function')addLog('🏠',`Bought a house for ${price} gold.`);
    // the former resident moves out: hide their street self for good
    // S530 — the topic comes off her, and she leaves the town's residents, so the stream never brings her back
    if(house.dlg&&house.dlg._extra){const i=house.dlg._extra.findIndex(t=>t&&t._house===house.id);if(i>=0)house.dlg._extra.splice(i,1);}
    if(typeof closeDialog==='function')closeDialog();
    const S=SETTLE.get(house.siteId),ri=S?S.residents.findIndex(r=>r.def===house.dlg):-1;
    if(ri>=0){const res=S.residents[ri];S.residents.splice(ri,1);const n=res.n;
      if(n){if(n._torch&&n._torch.userData.light)unregLight(n._torch.userData.light);sc.remove(n.g);sc.remove(n.dot);let i=npcs.indexOf(n);if(i>=0)npcs.splice(i,1);i=S.npcs.indexOf(n);if(i>=0)S.npcs.splice(i,1);res.n=null;}}
    return false;
  }
  function houseTopics(house){return forSale(house)?[{label:`Buy this house (${housePrice(house)} gold)`,quest:true,_house:house.id,fn:()=>buyHouse(house)}]:[];}
  // ── cellars ──
  function cellarFor(house){
    if(!house._cellar){const chapel=isGuestCathedral(house);house._cellar={id:house.id+(chapel?'_chapel':'_cellar'),type:chapel?'chapel':'cellar',name:chapel?'Cill an Aoi':`${house.name} — cellar`,keeper:'',parent:house,reg:house.reg,style:house.style,w:house.w,d:house.d,two:false,doorX:house.doorX,doorZ:house.doorZ,exitX:house.exitX,exitZ:house.exitZ,exitYaw:house.exitYaw,siteKind:house.siteKind,guild:house.guild};}
    return house._cellar;
  }
  function hasCellar(house){return house&&(house.type==='inn'||house.type==='guild_f'||house.type==='guild_m'||house.type==='castle'||house.ownedByPlayer||isGuestCathedral(house));}
  const HATCH={x:0,z:0,y:0,active:false};
  // ── S155: town locks and strongboxes (the crime system, part 1 of 4 — the design is in the backlog) ──
  let INT_BOX=null;
  // S551 — the barber keeps one too, at the general goods rate (Michael's A on DECISION #151)
  const BOX_KINDS=['weapon','armor','potion','misc','shipwright','goods','forge','apothecary','armoury','barber'];
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
  // S1110 — cover (Michael's A on #420): a watcher's line (cover true: a is the watcher, b is you) is also blocked, while you crouch,
  // by a solid of counter height or more (COVER_H, from your floor) within COVER_R of you: a counter, a chest, a bed's foot, a barrel.
  // Standing, only walls and shut doors hide you. Lock-on and E's aim (you at a) never ask for cover.
  const COVER_H=.9,COVER_R=1;
  function intSightLine(ax,az,bx,bz,cover){const S_=(typeof INT_SOL!=='undefined'&&INT_SOL)||[];const D_=(typeof INT_DOORS!=='undefined'&&INT_DOORS)||[];
    const fl=typeof jumpY==='number'?jumpY:0,eye=fl+(_sneaking?SCALE.EYE_CROUCH:SCALE.EYE_STAND); /* S1105 — F2b: the line at your eye, 1.65 standing and 1.1 crouched (it was 1.1 always) */const B=S_.filter(s=>s.y0!=null&&s.y1!=null&&s.y0<=eye&&s.y1>=eye&&(s.y1-s.y0>=1.8||D_.some(d=>d.sol===s)));
    const C=cover&&_sneaking?S_.filter(s=>s.y0!=null&&s.y1!=null&&s.y0<=fl+.3&&s.y1>=fl+COVER_H&&!(bx>s.x0&&bx<s.x1&&bz>s.z0&&bz<s.z1)):[];
    const d=Math.hypot(bx-ax,bz-az);const n=Math.max(1,Math.ceil(d/.1));
    /* S1416 — a wall is met along the whole line, not at points 0.1 m apart: the kit's partitions are 0.06 thick, and a line could
       step over one (sightline: the coaching inn's, 0.86 m long, sampled at 5.17 and 5.27 either side of a wall at 5.19 to 5.25).
       The line's ends keep the old 5 cm of grace, as the first and last samples did */
    const e_=d>0?Math.min(.5,.05/d):.5,dx_=bx-ax,dz_=bz-az;
    const cut=s=>{let t0=e_,t1=1-e_;for(const [o,v,lo,hi] of [[ax,dx_,s.x0,s.x1],[az,dz_,s.z0,s.z1]]){
      if(Math.abs(v)<1e-9){if(!(o>lo&&o<hi))return false;continue;}let u=(lo-o)/v,w=(hi-o)/v;if(u>w){const k=u;u=w;w=k;}if(u>t0)t0=u;if(w<t1)t1=w;}return t0<t1;};
    for(const s of B)if(cut(s))return false;
    if(C.length)for(let i=1;i<n;i++){const t=i/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;
      if(d*(1-t)<=COVER_R)for(const s of C)if(x>s.x0&&x<s.x1&&z>s.z0&&z<s.z1)return false;}return true;}
  // S368 — indoors a person sees what they face (Michael's B on #73): a 120° cone about the way they look, (sin ry, cos ry)
  const INT_FOV=Math.cos(Math.PI/3);
  const WIT_HEAR=2;
  /* S1244 — indoors a witness sees within 8.7 m (Michael's B on #516): Session 167's six in the old unit, at true scale (6 × ROOM_K, 1.444),
     so a keeper at a kit shop's counter sees through an open back-room door to the box, not through a shut one; Quiet work halves it */
  const WIT_IN=8.7;
  /* S1436 — a witness indoors sees you on their own floor only: the line (intSightLine) is cut by walls at your eye, but no floor
     stops it, so in a home of three storeys the resident below saw you on the floor above (#728's townhouses). The same 1.6 m as the
     talk's same level (S13); a body's floor is userData.floorY when it has one (a resident woken in an upstairs bed), else its feet */
  function intFloorOf(o){const f=o&&o.userData&&o.userData.floorY;return f!=null?f:(o?o.position.y:0);}
  function intSameFloor(o){return Math.abs((typeof jumpY==='number'?jumpY:0)-intFloorOf(o))<1.6;}
  function intFaces(o){const dx=px-o.position.x,dz=pz-o.position.z,d=Math.hypot(dx,dz);if(d<1e-3)return true;return (Math.sin(o.rotation.y)*dx+Math.cos(o.rotation.y)*dz)/d>=INT_FOV;}
  function witnessOf(house,picking){const quiet=!!picking&&perk('locks',75); /* S973 — Quiet work (Locks 75): a pick is seen from half as far */
    const sneak=(typeof _sneaking!=='undefined')&&_sneaking;let R=cloakOn('hood')?11:12;if(quiet)R*=.5;if(sneak)R*=.5*(1-.4*skillLv('stealth')/100)*inTheDarkMult(); /* S941 — Stealth; S976 — In the dark (Stealth 50) */ /* S552 — the dark hood */if(isNight())R*=.5;
    const scath=gateGift('scath')&&(()=>{const h=((worldState.gameTimeMinutes||0)%1440)/60;return h>=20||h<5;})();if(scath)R=Math.min(R,4); /* S1349 — Scáth's gift: at night, 4 m */
    if(typeof isInterior==='function'&&isInterior()){const inR=Math.min(quiet?WIT_IN/2:WIT_IN,scath?4:1e9); // indoors: whoever is in the room with you, facing you, and can see you
      if(sleeperNear()){wakeSleeper(intNPCMesh,true);return {name:currentHouse.keeper||'the resident'};} /* S739 — a sleeper sees nothing, and hears within two units */
      if(typeof intNPCMesh!=='undefined'&&intNPCMesh&&!sleeperAsleep()&&intSameFloor(intNPCMesh)&&Math.hypot(px-intNPCMesh.position.x,pz-intNPCMesh.position.z)<inR&&intFaces(intNPCMesh)&&intSightLine(intNPCMesh.position.x,intNPCMesh.position.z,px,pz,true))return {name:currentHouse.keeper||'the keeper'};
      const m=(INT_NPCS||[]).find(n=>intSameFloor(n.g)&&Math.hypot(px-n.g.position.x,pz-n.g.position.z)<inR&&intFaces(n.g)&&intSightLine(n.g.position.x,n.g.position.z,px,pz,true));return m?{name:(m.def&&m.def.name)||'someone'}:null;}
    // S705 — the street as the shop (Michael's A on #222): a townsperson or guard sees in the same 120° cone the way they face,
    // to the same ranges; within two units they hear you whichever way they face
    let best=null,bd=R;for(const n of npcs){if(!n.g.visible||n._retreated)continue;const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);if(d>=bd)continue;if(d>=WIT_HEAR&&!intFaces(n.g))continue;if(!clearLine(px,pz,n.g.position.x,n.g.position.z))continue;best=n;bd=d;}
    return best?{name:(best.def&&best.def.name)||'someone',npc:best}:null;}
  // S739 — a householder sleeps (Michael's A on #240): from 23h to 5h a home's resident lies on their own bed, sees nothing, and wakes
  // only to someone within two units (the street's hearing) or to E; awake from 21h to 23h and 5h to 7h. A picked door does not wake
  // them. One woken stays up for the rest of your visit. Asleep is a rule of the hour and the house, no roll. The lying pose is the
  // look builder's (H): until then the standing body lies on the bed turned flat, head to the bed's head (-z for every home's bed).
  const SLEEP_H=[23,5];
  function homeAsleepNow(house){if(!house||house.type!=='home'||!npcInsideNow(house))return false;const h=hourNow();return h>=SLEEP_H[0]||h<SLEEP_H[1];}
  function residentBed(){return (INT_BEDS||[]).find(b=>b.owner==='home')||null;}
  function sleeperAsleep(){return !!(typeof intNPCMesh!=='undefined'&&intNPCMesh&&intNPCMesh.userData.asleep);}
  function laySleeper(m){const b=residentBed();if(!m||!b)return false;const am=m.userData.amble;if(am&&am.stand==null)am.stand=!!am.paused;
    m.userData.asleep={x:b.x,z:b.z,y:b.y||0};if(am)am.paused=true;
    if(typeof personLie!=='function'||!personLie(m,{x:b.x,z:b.cz!=null?b.cz:b.z,y:b.y||0})){m.rotation.set(-Math.PI/2,0,0);m.position.set(b.x,(b.y||0)+.55,b.z+.95);} /* S752 — the lying pose under the quilt (32-people.js) */
    intNPCPos.x=b.x;intNPCPos.z=b.z;return true;}
  function wakeSleeper(m,woken){if(!m||!m.userData.asleep)return false;const b=m.userData.asleep;m.userData.asleep=null;if(typeof personRise==='function')personRise(m);if(woken)m.userData.woke=true;
    const am=m.userData.amble;if(am){am.paused=!!am.stand;am.wt=1.5;}
    let x=b.x+1.1,z=b.z+.6;for(const [ox,oz] of [[1.1,.6],[1.1,1.4],[0,1.6],[1.1,-.2]]){if(!intSolidAt(b.x+ox,b.z+oz,.3,b.y)){x=b.x+ox;z=b.z+oz;break;}}
    m.rotation.set(0,woken?Math.atan2(px-x,pz-z):Math.PI,0);m.position.set(x,b.y,z);m.userData.floorY=b.y||0; /* S1436 — she stands on the bed's floor, and the loop's breath keeps her there */intNPCPos.x=x;intNPCPos.z=z;return true;}
  function sleeperNear(){const b=sleeperAsleep()&&intNPCMesh.userData.asleep;return !!b&&Math.hypot(px-b.x,pz-b.z)<WIT_HEAR&&Math.abs(jumpY-b.y)<1.2;}
  // S770 — woken in the night (Michael's A on #255): the first talk after a householder is woken while the house sleeps opens with a
  // night line by her people, and the introduction is not first. No crime. WOKEN_LINES is the quest writer's, one line per people
  // (gatelander, markman, aurennais, oldblood); until a people has its own, the line from the decision stands for all four.
  const WOKEN_LINES={gatelander:"Weaver keep us — who's that? It's the black of the night. A friend knocks, and a friend knocks by day.",markman:"Iron and blood! Who's there? Middle of the night, friend. Say it quick.",aurennais:"Who is there? Master — it is the middle of the night. Whatever our arrangement was, I do not recall it including this hour.",oldblood:"Who stands there. It is meán oíche. The door was shut."}; /* S785 — the quest review's Finding 29 (run 16), word for word */
  function wokenLine(house){const p=house&&house.dlg&&house.dlg.people;return WOKEN_LINES[p]||"What — who's there? It's the middle of the night.";}
  // asked as E opens a home's talk: the night line if she was woken this visit, the house still keeps its sleeping hours, and she has not yet said it
  function wokenGreetNow(){if(typeof intNPCMesh==='undefined'||!intNPCMesh||!currentHouse)return null;const u=intNPCMesh.userData;
    if(!u.woke||u.wokeSaid||!homeAsleepNow(currentHouse))return null;u.wokeSaid=true;return wokenLine(currentHouse);}
  // each frame indoors: to bed at 23h, up at 5h, and awake to whoever comes within two units of the bed
  function tickSleeper(){if(typeof intNPCMesh==='undefined'||!intNPCMesh||!currentHouse||currentHouse.type!=='home')return;const m=intNPCMesh;
    if(m.userData.asleep){if(sleeperNear())wakeSleeper(m,true);else if(!homeAsleepNow(currentHouse))wakeSleeper(m,false);}
    else if(!m.userData.woke&&homeAsleepNow(currentHouse))laySleeper(m);}
  // a seen crime's cost to its town: favour and debt by its points, the fine 25 a point and the goods' value (S1827: shared with piracy)
  function bookCrime(site,kind,value){const pts=CRIME_PTS[kind]||1;addFavor(site,-pts);const C=worldState.crime||(worldState.crime={});const c=C[site.id]||(C[site.id]={bounty:0,debt:0,last:0});const b0=c.bounty;const fee=25*pts+Math.max(0,Math.round(value||0)),fst=typeof feastOn==='function'&&feastOn(absMin());c.bounty+=fst?Math.round(fee*.5):fee;if(fst)c.feast=dayNow();c.debt+=pts;c.last=dayNow();delete c.claimLost; /* S2228 — a new wrong, a new claim */if(typeof lampCrime==='function')lampCrime(c,fst?Math.round(fee*.5):fee);if(kind==='lock')c.lockFine=(c.lockFine||0)+c.bounty-b0; /* S1795 — the part of the fine that is lock crimes, for Word given */ /* S550 — a feast day halves a petty crime's fine */ /* S168 — a theft's fine is 50 and the goods' value (the spec) */
    return c;}
  function seenCrime(kind,house,w,value){const site=houseSite(house);
    if(site)bookCrime(site,kind,value);
    if(house.keeper&&house.type!=='home')(worldState.refuse||(worldState.refuse={}))[house.id]=dayNow()+5;
    const what=kind==='lock'?'pick the lock':kind==='theft'?'take what was not yours':'strike';
    if(site&&typeof isInterior==='function'&&isInterior())try{dispatchGuard(house,site);}catch(e){} // S239 — seen indoors: a guard is sent
    showMsg(`${w.name} saw you ${what}.`,'#e88a8a');if(typeof addLog==='function')addLog('👁',`${w.name} saw you ${what} at ${house.name}${site?'; '+site.name+' will not forget it':''}.`);}
  // S327 — asked each frame of a town pick (Michael's A on #54): whoever sees you now sees the lock picked
  function pickSeen(house){const w=witnessOf(house,true);if(!w)return null;
    (worldState.crimes||(worldState.crimes=[])).push({kind:'lock',site:house.siteId||null,house:house.id,day:dayNow(),min:absMin()});seenCrime('lock',house,w);return w;}
  // S1542 — the keeper hears the work (Michael's C on #824, `docs/design/strongbox-by-day.md`). A pick snapped in a live lock indoors is
  // a sound: heard within 9 m with no wall between, 6 m through one, not through two (a wall: a solid a person's height or a shut door,
  // crossed at your floor's 1.2 m); Quiet work (Locks 75) halves both. A shop's keeper who hears it comes to look, the named action
  // `keeperLooks`: four seconds to the box's door (the latch and the footsteps at once), opening it if it is shut, a second in, eight
  // seconds facing the box, and back the same way, shutting a door found shut. No roll: your hands, the room and where the keeper stood.
  // Seen while they look is the lock crime as ever (pickSeen); the look is the room's live state, never saved.
  const SNAP_HEAR=[9,6],LOOK_GO=4,LOOK_IN=1,LOOK_HOLD=8;
  function wallsBetween(ax,az,bx,bz,fl){const S_=(typeof INT_SOL!=='undefined'&&INT_SOL)||[],D_=(typeof INT_DOORS!=='undefined'&&INT_DOORS)||[],y=(fl||0)+1.2;
    const dx=bx-ax,dz=bz-az,T=[];
    for(const s of S_){if(s.y0==null||s.y1==null||s.y0>y||s.y1<y||!(s.y1-Math.max(s.y0,fl||0)>=1.8||D_.some(d=>d.sol===s)))continue; /* S2010: tall from the floor; the room's furniture solids start at -0.5 (an armour stand of 1.6 m read 2.3, a wall) */let t0=0,t1=1,ok=true;
      for(const [o,v,lo,hi] of [[ax,dx,s.x0,s.x1],[az,dz,s.z0,s.z1]]){if(Math.abs(v)<1e-9){if(!(o>lo&&o<hi))ok=false;continue;}let u=(lo-o)/v,w=(hi-o)/v;if(u>w){const k=u;u=w;w=k;}if(u>t0)t0=u;if(w<t1)t1=w;}
      if(ok&&t0<t1)T.push([t0,t1]);}
    T.sort((p,q)=>p[0]-q[0]);const L=Math.hypot(dx,dz)||1,gap=.15/L;let n=0,end=-1;for(const [t0,t1] of T){if(t0>end+gap)n++;end=Math.max(end,t1);} // a wall and the leaf in it are one
    return n;}
  function snapReach(walls){const r=SNAP_HEAR[walls];return r==null?0:perk('locks',75)?r/2:r;}
  // asked by lpBreak for a live lock: true when the shop's keeper heard it and comes
  function snapHeard(lock){const house=lock&&lock.house;const m=typeof intNPCMesh!=='undefined'&&intNPCMesh;
    if(!house||!m||house!==currentHouse||house.type==='home'||!(typeof isInterior==='function'&&isInterior())||m.userData.asleep||m.userData.look||!m.userData.amble)return false;
    const fl=(INT_BOX&&INT_BOX.y)||0,d=Math.hypot(px-m.position.x,pz-m.position.z);
    if(d>=snapReach(wallsBetween(m.position.x,m.position.z,px,pz,fl)))return false;
    keeperLooks(house);return true;}
  // a leg the keeper can walk straight (the amble's own test, every 0.1 m)
  function lookClear(a,b){const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(d/.1));for(let i=0;i<=n;i++){const t=i/n;if(intSolidAt(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,.22,0))return false;}return true;}
  // the way across the room's free floor (a 0.2 m grid, breadth first), drawn tight: each point the farthest the last can walk straight to
  function lookPath(s,e,R){if(R==null)return lookPath(s,e,.32)||lookPath(s,e,.22)||[s,e]; /* a margin past the walk's own 0.22 first, so a step between cells keeps clear */
    const St=.2,W=Math.ceil(((currentHouse&&currentHouse.intW)||20)/St)+1,H=Math.ceil(((currentHouse&&currentHouse.intD)||20)/St)+1;
    const id=(x,z)=>Math.round(z/St)*W+Math.round(x/St),free=new Map(),ok=k=>{if(!free.has(k))free.set(k,!intSolidAt((k%W)*St,Math.floor(k/W)*St,R,0));return free.get(k);};
    const a=id(s.x,s.z),b=id(e.x,e.z),prev=new Map([[a,-1]]),Q=[a];
    for(let i=0;i<Q.length&&!prev.has(b);i++){const k=Q[i],cx=k%W,cz=Math.floor(k/W);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=cx+dx,nz=cz+dz,n=nz*W+nx;if(nx<0||nz<0||nx>=W||nz>=H||prev.has(n))continue;if(n!==b&&!ok(n))continue;prev.set(n,k);Q.push(n);}}
    if(!prev.has(b))return null;const P=[];for(let k=b;k!==-1;k=prev.get(k))P.unshift({x:(k%W)*St,z:Math.floor(k/W)*St});P[0]=s;P[P.length-1]=e;
    const out=[s];let i=0;while(i<P.length-1){let j=P.length-1;while(j>i+1&&!lookClear(P[i],P[j]))j--;out.push(P[j]);i=j;}return out;}
  function keeperLooks(house){const m=typeof intNPCMesh!=='undefined'&&intNPCMesh;if(!m||house!==currentHouse||m.userData.look)return false;const am=m.userData.amble,X=INT_BOX;
    const tx=X?X.x:px,tz=X?X.z:pz,s={x:m.position.x,z:m.position.z};
    // the box's door: with a wall between the keeper and the box, the room's door nearest the box
    const door=wallsBetween(s.x,s.z,tx,tz,X&&X.y)>0?(INT_DOORS||[]).slice().sort((a,b)=>Math.hypot(a.x-tx,a.z-tz)-Math.hypot(b.x-tx,b.z-tz))[0]||null:null;
    let front,inside=null;
    if(door){const nx=Math.cos(door.ang),nz=-Math.sin(door.ang),side=((s.x-door.x)*nx+(s.z-door.z)*nz)<0?-1:1;
      front={x:door.x+nx*side*.8,z:door.z+nz*side*.8};inside={x:door.x-nx*side*1.2,z:door.z-nz*side*1.2};}
    else{const d=Math.hypot(s.x-tx,s.z-tz);front=d>2?{x:tx+(s.x-tx)*2/d,z:tz+(s.z-tz)*2/d}:{x:s.x,z:s.z};}
    // to the door: straight, or round the counter and the racks by the room's free floor
    const way=lookClear(s,front)?[s,front]:lookPath(s,front);
    const len=[];for(let i=1;i<way.length;i++)len.push(Math.hypot(way[i].x-way[i-1].x,way[i].z-way[i-1].z));const sum=len.reduce((a,b)=>a+b,0)||1;
    const legs=len.map((l,i)=>({a:way[i],b:way[i+1],T:LOOK_GO*l/sum}));legs[legs.length-1].atDoor=!!door;
    if(inside)legs.push({a:front,b:inside,T:LOOK_IN});const end=inside||front;legs.push({a:end,b:end,T:LOOK_HOLD});
    if(inside)legs.push({a:inside,b:front,T:LOOK_IN,shutAfter:true});
    for(let i=way.length-1;i>0;i--)legs.push({a:way[i],b:way[i-1],T:LOOK_GO*len[i-1]/sum});
    m.userData.look={legs,door,shut:!!door&&!door.open,ph:0,t:0,paused:am.paused,ry:am.ry,tx,tz,home:s};am.paused=true;
    showMsg(`${house.keeper||'The keeper'} heard the pick snap.`,'#e8a880');
    return true;}
  // each frame indoors: the look's legs, timed by the frame's dt; at the door it is opened, and leaving it a door found shut is shut
  function tickKeeperLook(dt){const m=typeof intNPCMesh!=='undefined'&&intNPCMesh,L=m&&m.userData.look;if(!L)return;const am=m.userData.amble,G=L.legs;
    L.t+=dt;while(L.ph<G.length&&L.t>=G[L.ph].T){const g=G[L.ph];L.t-=g.T;L.ph++;
      if(g.atDoor&&L.door&&!L.door.open)intDoorInteract(L.door);
      if(g.shutAfter&&L.shut&&L.door.open&&Math.hypot(px-L.door.x,pz-L.door.z)>.8)intDoorInteract(L.door);} /* unless you stand in it */
    if(L.ph>=G.length){const e=L.home;m.position.x=e.x;m.position.z=e.z;am.paused=L.paused;am.ry=L.ry;am.wt=0;m.userData.look=null;intNPCPos.x=e.x;intNPCPos.z=e.z;return;}
    const g=G[L.ph],k=g.T>0?Math.min(1,L.t/g.T):1,x=g.a.x+(g.b.x-g.a.x)*k,z=g.a.z+(g.b.z-g.a.z)*k;
    m.position.x=x;m.position.z=z;intNPCPos.x=x;intNPCPos.z=z;
    const ry=g.a===g.b?Math.atan2(L.tx-x,L.tz-z):Math.atan2(g.b.x-g.a.x,g.b.z-g.a.z);am.ry=ry;m.rotation.y=ry;}
  function noteCrime(kind,house,value,coins){(worldState.crimes||(worldState.crimes=[])).push({kind,site:house.siteId||null,house:house.id,day:dayNow(),min:absMin()});
    if(coins>0&&house.siteId){const C=worldState.crime||(worldState.crime={});const c=C[house.siteId]||(C[house.siteId]={bounty:0,debt:0,last:0});c.loot=(c.loot||0)+coins;} // S168 — the gold taken in a town, for the cells to take back
    const w=witnessOf(house,kind==='lock');if(w)seenCrime(kind,house,w,value);return !!w;}
  /* S1794 — No mark (Locks 100; Michael's C on #1055, A's half): a shop lock picked with nobody to see it is found by its keeper at the
     next opening (HRS.shopOpen, 8:00): the town's favour −1, a lock crime's point of debt (back after three quiet days, as any), no fine
     and no refusal, since nobody knows whose work it was. Picked with No mark, it is never found. A home's lock is not a shop's: as before,
     nobody finds it. Kept as worldState.crime[site].unfound[house] = {at, name}, so the save carries it with the rest of the town's record. */
  function pickUnseen(house){if(!house||house.type==='home'||!house.siteId||perk('locks',100))return false;
    const C=worldState.crime||(worldState.crime={});const c=C[house.siteId]||(C[house.siteId]={bounty:0,debt:0,last:0});
    const gtm=worldState.gameTimeMinutes||0,op=HRS.shopOpen*60,to=gtm<op?op-gtm:1440-gtm+op;
    (c.unfound||(c.unfound={}))[house.id]={at:absMin()+to,name:house.name||'A shop'};return true;}
  function tickPicksFound(){const C=worldState.crime;if(!C)return;const m=absMin();
    for(const id in C){if(!(C[id].bounty>0)&&C[id].lockFine)delete C[id].lockFine; /* S1795 — paid or waived: no lock fine stands */const U=C[id].unfound;if(!U)continue;for(const hid in U){const u=U[hid];if(m<u.at)continue;delete U[hid];findPick(id,u);}}}
  function findPick(siteId,u){const c=worldState.crime[siteId],site=SITE[siteId]||siteAnywhere(siteId);addFavor(siteId,-1);c.debt=(c.debt||0)+1;c.last=dayNow();
    if(typeof addLog==='function')addLog('🔓',`${u.name} opened on a picked lock${site?' in '+site.name:''}. The town thinks the less of strangers.`);}
  /* S2008 — a farm's beast killed is theft (Michael's B on #1275). A cow, a sheep, a goat or a hen of a farm's stock (wildFarmChunk, S1973)
     struck dead is the theft of the crime system: recorded always; seen by its usual witnesses (witnessOf, the farmer at work in the yard
     among them), it costs the farm's town 2 favour and a fine of 50 and the beast's worth, and the farmer will not talk for 5 days, as a
     wronged keeper will not trade. A village's farm is its village's; a lone farm has no guard or lord, so its theft is the nearest town's
     in its cell and the eight round it. The worth is the beast's: the cargo's horse is 110, a cow half that, a sheep a bale of wool's less 5,
     a goat 20, a hen 5. Asked in Session 2008 as a DECISION; these are the numbers until Michael says otherwise. */
  const STOCK_WORTH={Cow:55,Sheep:25,Goat:20,Hen:5};
  function stockFarm(e){const m=/^farm:(.+):[hf]\d+$/.exec((e&&e._wildKey)||'');return m?m[1]:null;}
  function stockTown(fid){let m=/^farm_(.+)$/.exec(fid);if(m)return siteAnywhere(m[1]);
    m=/^c(-?\d+)_(-?\d+)_f\d+$/.exec(fid);if(!m)return null;const ci=+m[1],cj=+m[2],F=loneFarms(getCell(ci,cj)).find(f=>f.id===fid);if(!F)return null;
    let best=null,bd=1e9;for(let j=cj-1;j<=cj+1;j++)for(let i=ci-1;i<=ci+1;i++){if(i<0||j<0||i>=GRID||j>=GRID)continue;const c=getCell(i,j);if(!c||!c.sites)continue;
      for(const t of c.sites){if(!(t.pad>0)||t.kind==='portal')continue;const d=Math.hypot(t.x-F.cx,t.z-F.cz);if(d<bd){bd=d;best=t;}}}
    return best;}
  function stockKilled(e){const fid=stockFarm(e);if(!fid||!e.farmStock)return null;const site=stockTown(fid),worth=STOCK_WORTH[e.baseName||e.name]||0;
    (worldState.crimes||(worldState.crimes=[])).push({kind:'theft',site:site?site.id:null,house:null,farm:fid,day:dayNow(),min:absMin()});
    const w=witnessOf(null,false);if(!w)return {seen:false,site:site&&site.id};
    if(site)bookCrime(site,'theft',worth);(worldState.refuse||(worldState.refuse={}))['farm:'+fid]=dayNow()+5;
    showMsg(`${w.name} saw you take what was not yours.`,'#e88a8a');if(typeof addLog==='function')addLog('👁',`${w.name} saw you take what was not yours at a farm${site?'; '+site.name+' will not forget it':''}.`);
    return {seen:true,by:w.name,site:site&&site.id,worth};}
  /* the farmer of a farm whose stock you were seen to take: asked as any talk opens (openDialog) */
  function farmerRefuses(def){const fid=def&&def._farm,R=worldState.refuse;if(!fid||!R||R['farm:'+fid]==null)return false;if(dayNow()>=R['farm:'+fid]){delete R['farm:'+fid];return false;}
    const FR={gatelander:"The fox that's had the hen isn't asked in for the eggs.",markman:"I know what you did. Get off my land.",aurennais:"I keep no account with whoever took from my stock, Master. Ours is closed.",oldblood:"You took from the fold. Go."}; /* Finding 44 (quest review, run 41): the line by the farmer's people */
    showMsg(`${def.name||'The farmer'}: “${FR[def.people]||FR.gatelander}”`,'#e8a880');return true;}
  function refusesTrade(house){const R=worldState.refuse;if(!R||!house||R[house.id]==null)return false;if(dayNow()>=R[house.id]){delete R[house.id];return false;}return true;}
  function bountyAt(site){const c=fineRecAt(typeof site==='string'?site:site.id);return c?c.bounty:0;} /* S2229 — Aurenne's is the ledger's */
  function fineTopics(site){const b=bountyAt(site);if(b<=0)return [];
    return [{label:`Pay my fine (${b} gold)`,quest:true,fn:()=>{if(gold<b)return `The fine is ${b} gold. Come back when you have it.`;gold-=b;updateHUD();const _f=fineRecAt(site.id);if(_f)_f.bounty=0;worldState.crime[site.id]&&(worldState.crime[site.id].shut=false);if(typeof addLog==='function')addLog('⚖',`Paid a fine of ${b} gold at ${site.name}.`);return 'Paid. The town will still remember for a while; give it time.';}}];}
  function tickCrimeDay(){tickPicksFound();const C=worldState.crime;if(!C)return;try{ledgerSweep();ledgerInterest();}catch(e){} /* S2229 */const day=dayNow();for(const id in C){if(isLedgerKey(id))continue;const c=C[id];if(c.debt>0&&day-c.last>=3){c.debt--;c.last=day;addFavor(id,1);}}}
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
    CR.cool=Math.max(0,CR.cool-dt);try{tickSent(dt,false);}catch(e){}try{tickPicksFound();}catch(e){}const S=nearSite();if(!S)return;const c=crimeOf(S);const talking=(typeof dlgOpen!=='undefined')&&dlgOpen;
    const f=fineRec(S),sh=!!(c&&c.shut); /* S2229 — the fine is Aurenne's ledger there; a shut gate is still the town's */
    const drawn=drawnAt(S);
    if(drawn.length){ // the fight: they hold while you talk; at low health, the offer to yield
      if(!f||(f.bounty<=0&&!sh)){standDown(S);return;} // S433 — the fine paid to the lord mid-fight: nothing left to fight over (he fought on, and no yield could come)
      if(talking){drawn.forEach(e=>{e.alert=false;e.atkCd=Math.max(e.atkCd||0,.6);});return;}
      drawn.forEach(e=>{e.alert=true;});
      if(!CR.yielded&&PHP<maxHP*.3&&f&&f.bounty>0){CR.yielded=true;offerYield(S,f);}
      return;}
    CR.yielded=false;
    if(CLAIM)return; /* S2228 — the claim's bout: no other halt */
    if(c&&c.claimAt!=null){if(absMin()<c.claimAt&&!c.shut)return;delete c.claimAt;} /* S2228 — the halt waits for 6:00 */
    if(!f||f.bounty<=0||talking)return;if(!sh&&CR.cool>0)return; // shut gates: no talk, no cooldown
    for(const n of guardsOf(S)){if(!n.g.visible||n._retreated||n._drawn)continue;const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);if(d>5)continue;if(!clearLine(px,pz,n.g.position.x,n.g.position.z))continue;
      if(sh)guardDraw(n,S);else confront(n,S,f);return;}
  }
  // S1173 — a guard's blow before the yield (Michael's A on #456). Until the yield has been offered, a drawn guard's blow
  // that would take you under its line stops just under it (29% of health, 38 of a new character's 130), and the next
  // tick makes the offer, in the street or in a room. A heavy blow still takes you from 75 to the line in one. Once you
  // choose *Fight on* (the offer made, CR.yielded), or with no fine to offer terms on, his blows land in full. Only the blow
  // that crosses the line is held: already under it (out of the town's reach, where no offer comes) nothing is.
  function guardBlowCap(e,dmg){if(!e||!e._guard||CR.yielded)return dmg;const c=fineRecAt(e._guard.site); /* S2229 */if(!c||c.bounty<=0)return dmg;
    const line=Math.ceil(maxHP*.3)-1;if(PHP<=line)return dmg;return Math.min(dmg,PHP-line);}
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
  // S1663 — sent after you in the open (arenas-build.md: a ring's murder, "the guard comes, as built"). The yards and the rings stand
  // outside the walls, past any guard's five metres, and dispatchGuard wants a house's door. Here the nearest guard on duty in the
  // site's town is sent straight into S239's chase: he runs you down at CHASE_SPD by the streets, halts you for the fine when he is
  // within five metres with a clear line (tickCrime's confront), follows you into a house within 20 m, and gives up off the town's
  // pad and its 40 m or after CHASE_MAX. A guard already sent is called off for him. Named action: sendGuardAfter(siteId).
  function sendGuardAfter(siteId){const S=SETTLE.get(siteId);if(!S||!S.site)return null;const h=hourNow();let best=null,bd=1e9;
    for(const n of guardsOf(S)){if(n._drawn||!n.g||scheduleFor(n,h).hide)continue;const d=Math.hypot(n.g.position.x-px,n.g.position.z-pz);if(d<bd){bd=d;best=n;}}
    if(!best)return null;if(CR.sent)endSent();
    CR.sent={site:siteId,house:null,npc:best,t:0,ct:0,from:{x:best.g.position.x,z:best.g.position.z},door:null,out:null,walk:0,phase:'chase',mesh:null};
    best._chase=true;best._follow=false;CR.cool=0;return best;}
  function endSent(){const s=CR.sent;if(!s)return;if(s.mesh&&s.mesh.parent)s.mesh.parent.remove(s.mesh);if(s.enemy){const i=ZONES.world.enemies.indexOf(s.enemy);if(i>=0)ZONES.world.enemies.splice(i,1);}if(s.npc)s.npc._chase=false;CR.sent=null;}
  function tickSent(dt,indoor){const s=CR.sent;if(!s)return;const c=fineRecAt(s.site); /* S2229 — Aurenne's ledger */if(!c||c.bounty<=0){endSent();return;}
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
        const keep=ZE;ZE=[e];INT_FOE_Y=e._fy||0;try{tickZoneEnemies(dt,performance.now(),interiorScene);e._fy=footholdY(e.x,e.z,e._fy||0,0);}finally{ZE=keep;INT_FOE_Y=null;}return;} /* S1439 — on his own floor */
      if(s.phase==='coming'&&s.t>=Math.max(GUARD_IN,s.walk)){ // he comes in by the door
        const W=currentHouse._roomW||currentHouse.intW||10,D=currentHouse._roomD||currentHouse.intD||10;
        const g=buildNPCMesh({role:'guard',name:(n.def&&n.def.name)||'Guard',_twin:n.def&&n.def._twin,bCol:(n.def&&n.def.bCol)||0x6a2a2a,sCol:(n.def&&n.def.sCol)||0xd4a878},{nation:nationAt(currentHouse.doorX,currentHouse.doorZ),key:currentHouse.siteId||''});
        g.position.set(currentHouse._exitX!=null?currentHouse._exitX:W/2,0,D-1.0);g.rotation.y=Math.PI;if(interiorScene)interiorScene.add(g);s.mesh=g;s.phase='inside';
        showMsg(`${(n.def&&n.def.name)||'A guard'} comes in.`,'#e88a8a');return;}
      if(s.phase==='inside'&&s.mesh){const g=s.mesh,T=targetOf(n),gy=g.position.y,ty=T.y!=null?T.y:jumpY,dx=T.x-g.position.x,dz=T.z-g.position.z,d=Math.hypot(dx,dz),same=Math.abs(ty-gy)<1.2;g.rotation.y=Math.atan2(dx,dz);
        if((d>1.5||!same)&&!talking){let wx=T.x,wz=T.z,wd=Math.max(.001,d),st=Math.min(Math.max(0,d-1.4),1.8*dt); /* S1190 — round the kit's partitions: a straight line when the floor between is clear, else the route; S1439 — and up the stair to your floor */
          if(!same||walkTo(g.position.x,g.position.z,gy,T.x,T.z)==null){s.rt=(s.rt||0)-dt;if(s.rt<=0||!s.wp||Math.hypot(s.wp.x-g.position.x,s.wp.z-g.position.z)<.25){s.rt=1;s.wp=guardRoute(g.position.x,g.position.z,gy,T.x,T.z,ty);}
            if(s.wp){wx=s.wp.x;wz=s.wp.z;wd=Math.max(.001,Math.hypot(wx-g.position.x,wz-g.position.z));st=Math.min(wd,1.8*dt);g.rotation.y=Math.atan2(wx-g.position.x,wz-g.position.z);}else st=0;}else s.wp=null;
          const nx=g.position.x+(wx-g.position.x)/wd*st,nz=g.position.z+(wz-g.position.z)/wd*st;
          if(guardSolid(nx,nz,gy)){const dr=INT_DOORS.find(q=>!q.open&&Math.hypot(q.x-g.position.x,q.z-g.position.z)<1.2);if(dr)intDoorInteract(dr);} /* he opens a shut door he has walked up to */
          if(!guardSolid(nx,nz,gy)||guardSolid(g.position.x,g.position.z,gy)){g.position.x=nx;g.position.z=nz;} /* S1439 — a solid his own rise has put him in by a few centimetres (a flight above, at chest height) does not hold him */else if(!guardSolid(nx,g.position.z,gy))g.position.x=nx;else if(!guardSolid(g.position.x,nz,gy))g.position.z=nz;
          g.position.y=guardGround(g.position.x,g.position.z,gy);}
        else if(d<=1.5&&same&&!talking&&CR.cool<=0)confrontIndoor(s,S,c);}
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
    if(s.phase==='chase'){s.ct+=dt;const T=targetOf(n),d=Math.hypot(T.x-n.g.position.x,T.z-n.g.position.z);s.last={d,clear:clearLine(T.x,T.z,n.g.position.x,n.g.position.z)};
      const onPad=Math.hypot(T.x-S.site.x,T.z-S.site.z)<(S.site.pad||40)+40;
      if(!onPad||s.ct>CHASE_MAX){showMsg(`${(n.def&&n.def.name)||'The guard'} gives up the chase.`,'#c8b880');endSent();}}
  }
  // S1190 — the guard sent in walks round a room's partitions (the kit's shops keep the strongbox in a back room, behind a wall
  // and a door from the shop door he comes in by; he walked straight at you and stood against the wall). walkClear: the floor
  // between two points, sampled every quarter metre at his girth. guardRoute: a breadth-first path on a 0.4 grid over the room's
  // floor to the nearest floor within 1.4 of you (you may stand where his girth cannot), a shut door counted open (he opens it
  // when he reaches it); it gives the furthest point of the path he can walk straight to, or null. No roll: the same room and the same two points give the same route.
  // S1439 — a house of storeys (the kit's townhouse, three floors): he walks on the room's ground as you do, the highest foothold
  // within a step of his feet (footholdY), and is stopped by the solids at his own height. walkTo: a straight walk from a point at
  // height ay, sampled every quarter metre; the height it ends at, or null if a solid stops it. guardRoute: the breadth-first path
  // over a 0.2 grid (the stair's flights are 0.92 wide, a girth's band in them 0.32) and the floors (a state is a cell and its height), to the nearest floor within 1.4 of you and on your floor
  // (within the halt's 1.2 of your feet).
  // guardSolid: the room's solids against his height, 1.7 m (intSolidAt's body is a metre: he walked in under the half-landing's 1.29 m soffit);
  // over a metre, his head's 0.12 m and not his girth (on the stair's second flight his shoulders' 0.3 m met the flight above the first).
  const GUARD_BODY=1.7;
  function guardSolid(x,z,y){for(let i=0;i<INT_SOL.length;i++){const s=INT_SOL[i];if(s.y1!=null&&s.y1<=y+STEP_UP)continue;if(s.y0!=null&&s.y0>=y+GUARD_BODY)continue;const R=s.y0!=null&&s.y0>=y+PLAYER_H?.12:.3;if(x>s.x0-R&&x<s.x1+R&&z>s.z0-R&&z<s.z1+R)return true;}return false;}
  // guardGround: the highest foothold under his girth, not under one point (he fell through the 5 cm between the stair's two flights).
  function guardGround(x,z,y){let b=footholdY(x,z,y,0);for(const [ox,oz] of [[.15,0],[-.15,0],[0,.15],[0,-.15]])b=Math.max(b,footholdY(x+ox,z+oz,y,0));return b;}
  function walkTo(ax,az,ay,bx,bz){const d=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(d/.25));let y=ay;for(let i=1;i<=n;i++){const t=i/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;if(guardSolid(x,z,y))return null;y=guardGround(x,z,y);}return y;}
  function guardRoute(ax,az,ay,bx,bz,by){const C=.2;let x0=Math.min(ax,bx),x1=Math.max(ax,bx),z0=Math.min(az,bz),z1=Math.max(az,bz);
    for(const q of INT_SOL){if(q.x0<-1e5)continue;x0=Math.min(x0,q.x0);x1=Math.max(x1,q.x1);z0=Math.min(z0,q.z0);z1=Math.max(z1,q.z1);}
    const nx=Math.ceil((x1-x0)/C)+1,nz=Math.ceil((z1-z0)/C)+1;if(nx*nz>40000)return null;
    const shut=INT_DOORS.filter(q=>!q.open),keep=shut.map(q=>[q.sol.x0,q.sol.x1,q.sol.z0,q.sol.z1]);shut.forEach(q=>{q.sol.x0=q.sol.x1=q.sol.z0=q.sol.z1=-9e5;});
    try{const at=i=>({x:x0+(i%nx)*C,z:z0+Math.floor(i/nx)*C}),idx=(x,z)=>Math.min(nx-1,Math.max(0,Math.round((x-x0)/C)))+Math.min(nz-1,Math.max(0,Math.round((z-z0)/C)))*nx;
      const key=(i,y)=>i*32+Math.max(0,Math.min(31,Math.round(y*2))),a=idx(ax,az),prev=new Map(),Y=[],I=[],P=[];let b=-1;
      Y.push(ay);I.push(a);P.push(-1);prev.set(key(a,ay),0);
      const near=(i,y)=>{const p=at(i);return Math.hypot(p.x-bx,p.z-bz)<1.4&&Math.abs(y-by)<1.2;}; /* the end: any floor he can stand on within the halt's reach of you */
      for(let h=0;h<I.length&&b<0&&I.length<60000;h++){const i=I[h],y=Y[h],cx=i%nx;if(h>0&&near(i,y)){b=h;break;}
        for(const j of [cx>0?i-1:-1,cx<nx-1?i+1:-1,i-nx,i+nx]){if(j<0||j>=nx*nz)continue;const p=at(j);if(guardSolid(p.x,p.z,y))continue;const ny=guardGround(p.x,p.z,y),k=key(j,ny);if(prev.has(k))continue;prev.set(k,I.length);I.push(j);Y.push(ny);P.push(h);}}
      if(b<0)return null;const path=[];for(let h=b;h>0;h=P[h])path.push(h);path.reverse();
      let best=path[0];for(let k=1;k<Math.min(path.length,30);k++){const p=at(I[path[k]]),e=walkTo(ax,az,ay,p.x,p.z);if(e!=null&&Math.abs(e-Y[path[k]])<.3)best=path[k];else break;}
      return at(I[best]);}
    finally{shut.forEach((q,k)=>{q.sol.x0=keep[k][0];q.sol.x1=keep[k][1];q.sol.z0=keep[k][2];q.sol.z1=keep[k][3];});}}
  // S241 — refused indoors, the guard draws where he stands: a Town Guard in the room, fought through the zone-enemy code
  // (run on him alone, with the room's floor and solids); the yield comes at a fifth of health, as in the street.
  function guardFightIndoor(s,S){if(!interiorScene||!s.mesh)return;const n=s.npc;const x=s.mesh.position.x,z=s.mesh.position.z,fy=s.mesh.position.y;if(s.mesh.parent)s.mesh.parent.remove(s.mesh);s.mesh=null;
    const e=guardEnemy(n,S,interiorScene,[],x,z);e._indoor=s.house;e._fy=fy;if(e.mesh)e.mesh.position.y=fy;s.enemy=e;s.phase='fight';CR.yielded=false;}
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
  const TALKED_LINES={gatelander:f=>`A soft word turns a hard fine, they say, and you’ve a softer word than most. Half, so: ${f} gold, and we’ll say no more about it.`,markman:f=>`Aye, all right. Half. ${f} gold, and don’t make me sorry.`,aurennais:f=>`You argue it well, Master. The town will accept half, on these terms: ${f} gold, and the matter closed.`,oldblood:f=>`Half, then. ${f} gold.`}; /* S986 — quest review Finding 31: the guard gives way in his people's voice */
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
  // S550 — on the feast day a fine was halved, the guard says so after the halt (the Old Blood keep no watch: the Gatelander line)
  function feastFineLine(S,c){if(!c||c.feast!==dayNow()||typeof FEAST_FINE==='undefined')return '';return ' '+(FEAST_FINE[peopleOfSite(S.site)]||FEAST_FINE.gatelander);}
  function talkedGreet(S,c,fine){if(!c||!c.talkedNow)return '';delete c.talkedNow;return (TALKED_LINES[peopleOfSite(S.site)]||TALKED_LINES.markman)(fine);}
  function haltLines(S){return HALT_LINES[peopleOfSite(S.site)]||HALT_LINES.markman;}
  function yieldLines(S){return YIELD_LINES[peopleOfSite(S.site)]||YIELD_LINES.markman;}
  function confrontIndoor(s,S,c){CR.cool=60;const fine=c.bounty;const n=s.npc;const name=(n.def&&n.def.name)||'The guard';const L=haltLines(S);
    openDialog({name,role:'Guard',ico:'⚔',noIntro:true,greeting:[talkedGreet(S,c,fine)||L.greet(fine,S.site.name)+feastFineLine(S,c)],topics:[
      {label:`Pay the fine (${fine} gold)`,quest:true,fn:()=>{if(gold<fine)return L.poor;gold-=fine;updateHUD();c.bounty=0;c.shut=false;CR.cool=5;if(typeof addLog==='function')addLog('⚖',`Paid ${fine} gold to ${name} at ${S.site.name}.`);if(courtOf(S)==='mark'){delete c.claimLost;claimKeepersBack(S);} /* S2228 */endSent();return L.pay;}},
      ...restitutionTopic(S,c,()=>confrontIndoor(s,S,c),true),
      ...talkDownTopic(S,c,()=>confrontIndoor(s,S,c)),
      ...wordGivenTopic(S,c,true),
      {label:'I’ll not pay.',quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}guardFightIndoor(s,S);},60);return L.refuse;}},
      {label:'Not now.',bye:true}]});}
  function confront(n,S,c){CR.cool=60;if(CR.sent&&CR.sent.npc===n)endSent();/* S239 — caught: the chase is over */const fine=c.bounty;const name=(n.def&&n.def.name)||'The guard';const L=haltLines(S);
    openDialog({name,role:'Guard',ico:'⚔',noIntro:true,greeting:[talkedGreet(S,c,fine)||L.greet(fine,S.site.name)+feastFineLine(S,c)],topics:[
      {label:`Pay the fine (${fine} gold)`,quest:true,fn:()=>{if(gold<fine)return L.poor;gold-=fine;updateHUD();c.bounty=0;c.shut=false;CR.cool=5;if(typeof addLog==='function')addLog('⚖',`Paid ${fine} gold to ${name} at ${S.site.name}.`);if(courtOf(S)==='mark'){delete c.claimLost;claimKeepersBack(S);} /* S2228 — the claim paid: the keepers serve you again */return L.pay;}},
      ...restitutionTopic(S,c,()=>confront(n,S,c),false),
      ...claimTopic(n,S,c),
      ...talkDownTopic(S,c,()=>confront(n,S,c)),
      ...wordGivenTopic(S,c,false),
      {label:'I’ll not pay.',quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}guardDraw(n,S);},60);return L.refuse;}},
      {label:'Not now.',bye:true}]});}
  // S973 — Talk it down (Speech 50): once in each town, a guard's fine is halved; the halt opens again on the new fine
  function talkDownFine(S,c){if(!c||c.talked||c.bounty<=0||!perk('speech',50))return false;c.bounty=Math.ceil(c.bounty/2);c.talked=1;
    if(typeof addLog==='function')addLog('⚖',`Talked the fine at ${S.site.name} down to ${c.bounty} gold.`);return true;}
  function talkDownTopic(S,c,reopen){if(!c||c.talked||!perk('speech',50))return [];
    return [{label:'Talk it down. (Speech)',quest:true,fn:()=>{if(!talkDownFine(S,c))return '';c.talkedNow=1;showMsg(`The fine is halved: ${c.bounty} gold.`,'#c8e88a');
      setTimeout(()=>{try{closeDialog();}catch(e){}reopen();},60);return '';}}];}
  /* S1795 — Word given (Speech 100; Michael's C on #1055, A's half): once a day, a guard who halts you for a fine made only of lock crimes
     (c.lockFine, laid by seenCrime, covers the whole of c.bounty) takes your word and waives it. The favour the locks cost stays lost. */
  function wordGivenOk(c){const W=worldState.speech;return !!c&&c.bounty>0&&(c.lockFine||0)>=c.bounty&&perk('speech',100)&&!(W&&W.word===dayNow());}
  function wordGiven(S,c){if(!wordGivenOk(c))return false;const W=worldState.speech||(worldState.speech={});W.word=dayNow();const f=c.bounty;c.bounty=0;delete c.lockFine;CR.cool=5;
    if(typeof addLog==='function')addLog('⚖',`Word given at ${S.site.name}: a fine of ${f} gold for locks, waived.`);return true;}
  function wordGivenTopic(S,c,indoor){if(!wordGivenOk(c))return [];
    return [{label:'Give my word. (Speech)',quest:true,fn:()=>{if(!wordGiven(S,c))return '';if(indoor)endSent();showMsg('Word given. The fine is waived.','#c8e88a');
      setTimeout(()=>{try{closeDialog();}catch(e){}},60);return '';}}];}
  /* S2227 — law in three registers (Michael's B on #1540, docs/design/law-in-three-registers.md), the Gatelands' court: the Crown's.
     The points, the witnesses, the favour and the halt stay as built; how you settle changes by the island the town stands on (courtOf).
     - Restitution, at the halt: the stolen goods you carry from this town (an item's stolenAt, laid when a box is robbed) are handed back,
       and the fine falls by their worth (buyPrice × qty); the 25 a point stays, since the fine was laid as 25 a point plus the worth. The
       gold stolen (c.loot) is not goods: it stays owed. A fine left over opens the halt again on the new sum.
     - The stocks, after the yield, in place of the cells: an hour on the plaza for every 50 gold of the fine, at least 1 and at most 6
       (stocksHours); the fine is cleared and the stolen goods and gold taken, as the cells take them. The clock runs those hours and you
       stand on the plaza after. The stocks themselves are the look builder's to draw; the guard's words for the court are the quest
       writer's (the page), so the two choices speak only as the narrator for now.
     The Mark's duel and Aurenne's ledger are the next two sessions; until then both keep the cells as built. */
  function courtOf(S){const s=S&&S.site;if(!s)return null;try{return nationAt(s.x,s.z);}catch(e){return null;}}
  function stolenFrom(S){return BAG.filter(b=>b&&b.stolen&&b.stolenAt&&b.stolenAt===S.site.id);}
  function stolenWorth(L){return L.reduce((a,b)=>a+(b.buyPrice||0)*(b.qty||1),0);}
  // named action: the goods handed back. Returns the gold the fine fell by, or 0
  function restitute(S,c){if(courtOf(S)!=='gatelands'||!c||c.bounty<=0)return 0;const L=stolenFrom(S);if(!L.length)return 0;const w=stolenWorth(L),f0=c.bounty;
    for(const it of L){const i=BAG.indexOf(it);if(i>=0)BAG.splice(i,1);}c.bounty=Math.max(0,c.bounty-w);if(c.lockFine)c.lockFine=Math.min(c.lockFine,c.bounty);if(c.bounty===0)c.shut=false;
    if(typeof addLog==='function')addLog('⚖',`Handed back ${L.length===1?L[0].name.toLowerCase():L.length+' stolen things'} at ${S.site.name}: the fine fell from ${f0} to ${c.bounty} gold.`);
    if(typeof renderInv==='function')renderInv();return f0-c.bounty;}
  function restitutionTopic(S,c,reopen,indoor){if(courtOf(S)!=='gatelands'||!c||c.bounty<=0)return [];const L=stolenFrom(S);if(!L.length)return [];
    const left=Math.max(0,c.bounty-stolenWorth(L));
    return [{label:left?`Hand back the goods (the fine falls to ${left} gold)`:'Hand back the goods (the fine is met)',quest:true,fn:()=>{if(!restitute(S,c))return '';
      if(c.bounty>0){showMsg(`The goods are handed back. ${c.bounty} gold is still owed.`,'#c8e88a');setTimeout(()=>{try{closeDialog();}catch(e){}reopen();},60);return '';}
      CR.cool=5;if(indoor)endSent();showMsg('The goods are handed back. The fine is met.','#c8e88a');setTimeout(()=>{try{closeDialog();}catch(e){}},60);return '';}}];}
  function stocksHours(c){return Math.max(1,Math.min(6,Math.ceil((c&&c.bounty||0)/50)));}
  // named action: the stocks (the Crown's court, after the yield)
  function toStocks(S,c){if(typeof isInterior==='function'&&isInterior()){try{closeDialog();}catch(e){}try{exitInterior();}catch(e){}let k=0;const w=()=>{if(!isInterior()||++k>60)toStocks(S,c);else setTimeout(w,100);};setTimeout(w,100);return;}
    const h=stocksHours(c);standDown(S);let stolen=0;for(let i=BAG.length-1;i>=0;i--)if(BAG[i].stolen){BAG.splice(i,1);stolen++;}c.bounty=0;c.shut=false;delete c.lockFine;
    const back=Math.min(Math.max(0,gold),c.loot||0);if(back>0){gold-=back;stolen++;}c.loot=0;
    doFade(()=>{advanceClock(h*60);px=S.site.x;pz=S.site.z+2;jumpY=0;PHP=Math.max(PHP,Math.round(maxHP*.5));
      showMsg(`${h} ${h===1?'hour':'hours'} in the stocks on the plaza. ${stolen?'They took what you stole'+(back?` (${back} gold)`:'')+'. ':''}You are let go.`,'#c8b880');
      if(typeof addLog==='function')addLog('⛓',`${h} ${h===1?'hour':'hours'} in the stocks at ${S.site.name}${stolen?'; the stolen goods were taken'+(back?`, and ${back} gold`:''):''}.`);
      if(typeof renderInv==='function')renderInv();if(typeof updateHUD==='function')updateHUD();});}
  /* S2229 — law in three registers (Michael's B on #1540), Aurenne's court: the Compact's ledger. A fine booked in a town of Aurenne
     is owed to the Compact, one book for the island (worldState.crime['ledger:aurenne'], the character's as the rest of the record):
     every writer still books the town's record as built, and ledgerSweep moves its fine (and the gold stolen, and the lock part)
     onto the ledger whenever the fine is read (fineRec). The favour, the points of debt, a shut gate and a town's talk-down stay the
     town's. So any Aurenne town's guard halts you for the whole book, and paying one pays it. Left unpaid it grows 10% a game-week
     (rounded up), never past double what was booked on it (L.base). After the yield, prison in place of the cells: a night for every
     100 gold, 1 to 3 (prisonNights), the fine cleared and the stolen goods and gold taken; you come out at the keep's door at 7:00.
     The contract (a commission whose pay goes to the fine) is the next session. Named actions: ledgerSweep, toPrison. */
  const LEDGER_KEY='ledger:aurenne',LEDGER_WEEK=.1,LEDGER_CAP=2,PRISON_PER=100,PRISON_MAX=3;
  function ledgerRec(){const C=worldState.crime||(worldState.crime={});return C[LEDGER_KEY]||(C[LEDGER_KEY]={bounty:0,debt:0,last:0,base:0,since:0,weeks:0});}
  function isLedgerKey(id){return typeof id==='string'&&id.indexOf('ledger:')===0;}
  function siteCourt(id){const t=SITE[id];try{if(t)return nationAt(t.x,t.z);const m=/^c(-?\d+)_(-?\d+)_/.exec(String(id));return m?nationKeyOf(+m[1],+m[2]):null;}catch(e){return null;}} /* a town's court by its id, loaded or not (SITE holds the loaded cells' only) */
  function ledgerSweep(){const C=worldState.crime;if(!C)return null;let L=C[LEDGER_KEY]||null;
    for(const id in C){if(isLedgerKey(id))continue;const c=C[id];if(!(c.bounty>0||c.loot>0))continue;if(siteCourt(id)!=='aurenne')continue;
      L=ledgerRec();if(!(L.bounty>0)){L.base=0;L.since=dayNow();L.weeks=0;}
      const b=c.bounty>0?c.bounty:0;L.bounty+=b;L.base+=b;L.loot=(L.loot||0)+(c.loot||0);if(c.lockFine)L.lockFine=(L.lockFine||0)+c.lockFine;if(c.feast)L.feast=c.feast;L.last=dayNow();
      c.bounty=0;c.loot=0;delete c.lockFine;}
    if(L&&!(L.bounty>0)){L.bounty=0;L.base=0;L.weeks=0;delete L.lockFine;}return L;}
  // the record the fine is kept on: Aurenne's ledger, else the town's own
  function fineRec(S){if(!S||!S.site)return null;if(courtOf(S)==='aurenne'){ledgerSweep();return ledgerRec();}return crimeOf(S);}
  function fineRecAt(id){if(siteCourt(id)==='aurenne'){ledgerSweep();return ledgerRec();}return worldState.crime&&worldState.crime[id];}
  // the week's interest, from tickCrimeDay: 10% a game-week since the first fine on the book, never past double what was booked
  function ledgerInterest(){const C=worldState.crime,L=C&&C[LEDGER_KEY];if(!L||!(L.bounty>0))return;const w=Math.floor((dayNow()-(L.since||0))/7);
    while((L.weeks||0)<w){L.weeks=(L.weeks||0)+1;L.bounty=Math.min(Math.round(L.base*LEDGER_CAP),Math.ceil(L.bounty*Math.round(100*(1+LEDGER_WEEK))/100));}}
  function prisonNights(c){return Math.max(1,Math.min(PRISON_MAX,Math.ceil((c&&c.bounty||0)/PRISON_PER)));}
  // named action: prison (the Compact's court, after the yield)
  function toPrison(S,c){if(typeof isInterior==='function'&&isInterior()){try{closeDialog();}catch(e){}try{exitInterior();}catch(e){}let k=0;const w=()=>{if(!isInterior()||++k>60)toPrison(S,c);else setTimeout(w,100);};setTimeout(w,100);return;}
    const nights=prisonNights(c);standDown(S);let stolen=0;for(let i=BAG.length-1;i>=0;i--)if(BAG[i].stolen){BAG.splice(i,1);stolen++;}c.bounty=0;c.shut=false;delete c.lockFine;c.base=0;c.weeks=0;
    const back=Math.min(Math.max(0,gold),c.loot||0);if(back>0){gold-=back;stolen++;}c.loot=0;
    doFade(()=>{const gtm=worldState.gameTimeMinutes||0;const to=(gtm<7*60?7*60-gtm:1440-gtm+7*60)+(nights-1)*1440;advanceClock(to);worldState.gameTimeMinutes=7*60; /* advanceClock wraps the day once only */
      const keep=S.houses.find(h=>h.type==='castle');if(keep){px=keep.exitX!=null?keep.exitX:keep.doorX;pz=keep.exitZ!=null?keep.exitZ:keep.doorZ+2;}else{px=S.site.x;pz=S.site.z;}jumpY=0;PHP=Math.max(PHP,Math.round(maxHP*.5));
      const nn=nights===1?'A night':`${nights} nights`;
      showMsg(`${nn} in the Compact's prison. ${stolen?'They took what you stole'+(back?` (${back} gold)`:'')+'. ':''}The ledger is clear. It is morning.`,'#c8b880');
      if(typeof addLog==='function')addLog('⛓',`${nn} in prison at ${S.site.name}${stolen?'; the stolen goods were taken'+(back?`, and ${back} gold`:''):''}. The Compact's ledger is clear.`);
      if(typeof renderInv==='function')renderInv();if(typeof updateHUD==='function')updateHUD();});}
  /* S2228 — law in three registers (Michael's B on #1540), the Mark's court: the reeve and the claim. In a town of the Mark the fine
     is a claim, and at the halt you may fight it, to a yield, against the town's sword: the guard who halted you, at the law's tier 3
     (GUARD_TIER), under the bout's rules (boutStart: a 5 m ring laid where you stand, over the rope by a metre or down is a loss, he
     kneels at a quarter of his health and is spared after 3 s unstruck, the 0.4 s held blow). Only from 6:00 to noon, the yard's
     duel hours (DUEL_OPEN, DUEL_CLOSE: "a quarrel finished by noon"); asked outside them, the halt waits until 6:00 (c.claimAt) and
     the guards let you by. Won: the claim is void (the fine and the gold stolen are owed no more), half the favour it cost comes back
     (c.debt, the points not yet forgiven), and the town's wronged keepers serve you again. Lost: the claim stands at 1.5×, and the
     guard halts you for it; the claim is fought once (c.claimLost, cleared by a new wrong or the fine paid). Paid at the halt, the
     keepers serve you again too. A blow that kills him after the yield is a guard's death (guardKilled): the gates shut. No claim
     for a guard's death (c.shut), and none indoors: the halt in a room is as built, and outside you are halted again. The reeve's
     words are the quest writer's; the halt's two lines speak as the narrator for now. Named actions: claimStart, claimEnd. */
  const CLAIM_LOSS=1.5;
  let CLAIM=null; /* {foe,npc,site,x,z,f0,end} */
  function claimHours(){return typeof duelRingHours==='function'?duelRingHours():(hourNow()>=6&&hourNow()<12);}
  function nextSixAt(){const m=absMin(),d=Math.floor(m/1440);let t=d*1440+360;if(t<=m)t+=1440;return t;}
  // the keepers this town's wrongs turned away serve you again (the day the claim is paid or won)
  function claimKeepersBack(S){const R=worldState.refuse;if(!R)return 0;let n=0;for(const h of (S.houses||[]))if(R[h.id]!=null){delete R[h.id];n++;}return n;}
  function claimOk(S,c){return courtOf(S)==='mark'&&!!c&&c.bounty>0&&!c.shut&&!c.claimLost&&!CLAIM&&!BOUT;}
  function claimTopic(n,S,c){if(!claimOk(S,c))return [];
    if(!claimHours())return [{label:'Fight the claim. (from 6:00)',quest:true,fn:()=>{c.claimAt=nextSixAt();CR.cool=5;
      if(typeof addLog==='function')addLog('⚖',`The claim at ${S.site.name} is set for 6:00. Until then the guards let you by.`);
      setTimeout(()=>{try{closeDialog();}catch(e){}},60);showMsg('The claim is fought between 6:00 and noon. Until then the guards let you by.','#c8e88a');return '';}}];
    return [{label:`Fight the claim. (to a yield; lose, and it is ${Math.ceil(c.bounty*CLAIM_LOSS)} gold)`,quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}claimStart(n,S,c);},60);return '';}}];}
  // named action: the claim's bout begins, the guard who halted you the town's sword
  function claimStart(n,S,c){if(!claimOk(S,c)||!claimHours()||n._drawn)return null;delete c.claimAt;
    const gx=n.g.position.x,gz=n.g.position.z,x=px,z=pz;const e=guardEnemy(n,S,sc,STATIC_SOL,gx,gz);delete e._guard;e._claim=S.site.id;
    e.name=e.displayName=(n.def&&n.def.name)||'The town’s sword';e.homeX=x;e.homeZ=z;
    CLAIM={foe:e,npc:n,site:S.site.id,x,z,f0:c.bounty,end:null};
    boutStart({foe:e,x,z,r:BOUT_R,on:{
      yield:()=>showMsg(`${e.name} goes down on one knee.`,'#e8d8a0'),
      won:()=>claimEnd('won'),lost:(b,how)=>claimEnd('lost',how),murder:()=>claimEnd('murder')}});
    showMsg(`The claim is fought here, to a yield. ${e.name} draws.`,'#e8d8a0');
    if(typeof addLog==='function')addLog('⚔',`Fought the claim of ${c.bounty} gold at ${S.site.name}.`);return CLAIM;}
  // named action: the claim's end, won, lost, murder or left (the bout gone some other way: a loss)
  function claimEnd(how,why){const L=CLAIM;if(!L)return null;CLAIM=null;if(typeof boutEnd==='function')boutEnd(L.foe);const e=L.foe,n=L.npc,S=SETTLE.get(L.site);
    const C=worldState.crime||(worldState.crime={});const c=C[L.site]||(C[L.site]={bounty:0,debt:0,last:0});const name=e.name;
    if(how==='murder'){e._guard={site:L.site,npc:n};L.end=how;return L;} /* killZoneEnemy, which asked, books the guard's death next (guardKilled) */
    if(e&&!e.dead){e.dead=true;try{(e.mesh&&e.mesh.parent||sc).remove(e.mesh);}catch(err){}const i=ZONES.world.enemies.indexOf(e);if(i>=0)ZONES.world.enemies.splice(i,1);}
    try{const k=staggered.findIndex(q=>q.e===e);if(k>=0)staggered.splice(k,1);}catch(err){}
    if(n){n._drawn=false;n._retreated=false;n.g.visible=true;if(n.dot)n.dot.visible=true;}
    if(how==='won'){const back=Math.floor((c.debt||0)/2);if(back>0){addFavor(L.site,back);c.debt-=back;}c.bounty=0;c.loot=0;delete c.lockFine;delete c.claimLost;
      const kb=S?claimKeepersBack(S):0;CR.cool=5;
      showMsg(`${name} is spared. The claim is void${back?`, and the town comes round by ${back}`:''}.`,'#e8d8a0');
      if(typeof addLog==='function')addLog('⚖',`Won the claim at ${S?S.site.name:L.site}: void.${kb?' The keepers will serve you again.':''}`);}
    else{c.bounty=Math.ceil(c.bounty*CLAIM_LOSS);c.claimLost=1;PHP=Math.max(PHP,1);CR.cool=0;
      showMsg(why==='rope'?`You step over the rope. The claim stands, at ${c.bounty} gold.`:`You go down. The claim stands, at ${c.bounty} gold.`,'#e8d8a0');
      if(typeof addLog==='function')addLog('⚖',`Lost the claim at ${S?S.site.name:L.site}: ${c.bounty} gold owed.`);}
    if(typeof updateHUD==='function')updateHUD();L.end=how;L.why=why||null;return L;}
  function tickClaim(dt){const L=CLAIM;if(!L)return;if(!BOUT||BOUT.foe!==L.foe){claimEnd('lost','left');return;}boutTick(dt);}
  const GUARD_TIER=3;
  function guardDraw(n,S){if(n._drawn)return null;return guardEnemy(n,S,sc,STATIC_SOL,n.g.position.x,n.g.position.z);}
  function guardEnemy(n,S,scn,sol,x,z){n._drawn=true;n._retreated=true;n.g.visible=false;if(n.dot)n.dot.visible=false; // S241 — in the street, or in a room
    let gen=null;n.g.traverse(o=>{if(!gen&&o.userData&&o.userData.rig&&o.userData.rig.g)gen=o.userData.rig.g;}); // S171 — the guard who draws is the guard you spoke to
    // S509 — the guard who draws is keyed (co-op rules): his town, his place among its people, and the minute he drew
    const ni=(S.npcs||[]).indexOf(n);const e=keyFoe(buildZoneEnemy(scn,sol,x,z,'Bandit',null,{genome:gen,tier:GUARD_TIER}),`${S.site.id}:guard:${ni>=0?ni:((n.def&&n.def.name)||'guard')}:${Math.floor(worldState.gameTimeAbsMinutes||0)}`);e.name='Town Guard';e.displayName='Town Guard';e.locked=false;e.minLevel=1;if(e.mesh)e.mesh.visible=true;
    /* S1060 — the law is tier 3 in every town (the enemies-by-place sheet, Morrowind's precedent): its numbers read tier 3's level, 11, not yours */
    const GL=tierLevel(GUARD_TIER);e.hp=e.maxHp=Math.round(40+GL*8);e.dmg=Math.round(6+GL*1.2);e.spd=1.4;e.xpVal=0;e.def=3;e._guard={site:S.site.id,npc:n};e.alert=true;
    try{const body=enemyBodyMesh(e);if(!(e.limbs&&e.limbs.person)&&body&&body.material&&body.material.color)body.material.color.setHex(0x6a2a2a);}catch(err){}
    ZONES.world.enemies.push(e);showMsg(`${(n.def&&n.def.name)||'The guard'} draws.`,'#ff8060');return e;}
  function standDown(S){for(const e of ZONES.world.enemies){if(!e._guard||e.dead||e._guard.site!==S.site.id)continue;e.dead=true;try{(e.mesh&&e.mesh.parent||sc).remove(e.mesh);}catch(err){}if(e.el)e.el.intensity=0;
    const n=e._guard.npc;if(n){n._drawn=false;n._retreated=false;n.g.visible=true;if(n.dot)n.dot.visible=true;}}}
  function offerYield(S,c){const dbl=c.bounty*2;const D_=drawnAt(S);D_.forEach(e=>{e.alert=false;e.atkCd=Math.max(e.atkCd||0,.6);}); // they hold while the offer stands
    const L=yieldLines(S);const gn=D_.map(e=>e._guard&&e._guard.npc&&e._guard.npc.def&&e._guard.npc.def.name).find(Boolean)||'The guard'; // S171 — the guard who drew speaks, by name
    openDialog({name:gn,role:'Guard',ico:'⚔',noIntro:true,greeting:[L.greet(dbl)],topics:[
      {label:`Pay double (${dbl} gold)`,quest:true,fn:()=>{if(gold<dbl)return L.poor;gold-=dbl;updateHUD();c.bounty=0;c.shut=false;standDown(S);if(typeof addLog==='function')addLog('⚖',`Yielded and paid ${dbl} gold at ${S.site.name}.`);return L.pay;}},
      courtOf(S)==='aurenne'?{label:`Prison (${prisonNights(c)} ${prisonNights(c)===1?'night':'nights'}).`,quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}toPrison(S,c);},60);return '';}} /* S2229 — the Compact's court */
      :courtOf(S)==='gatelands'?{label:`The stocks (${stocksHours(c)} h).`,quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}toStocks(S,c);},60);return '';}} /* S2227 — the Crown's court (#1540 B) */
        :{label:'The cells.',quest:true,fn:()=>{setTimeout(()=>{try{closeDialog();}catch(e){}toCells(S,c);},60);return L.cells;}},
      {label:'Fight on.',bye:true}]});}
  function toCells(S,c){if(typeof isInterior==='function'&&isInterior()){try{closeDialog();}catch(e){}try{exitInterior();}catch(e){}let k=0;const w=()=>{if(!isInterior()||++k>60)toCells(S,c);else setTimeout(w,100);};setTimeout(w,100);return;} // S241 — taken from a room: out first
    standDown(S);let stolen=0;for(let i=BAG.length-1;i>=0;i--)if(BAG[i].stolen){BAG.splice(i,1);stolen++;}c.bounty=0;c.shut=false;
    const back=Math.min(Math.max(0,gold),c.loot||0);if(back>0){gold-=back;stolen++;}c.loot=0; // S168 — the gold stolen in this town goes back too, as much of it as you still carry
    doFade(()=>{const gtm=worldState.gameTimeMinutes||0;const to=gtm<7*60?7*60-gtm:1440-gtm+7*60;worldState.gameTimeAbsMinutes=(worldState.gameTimeAbsMinutes||0)+to;worldState.gameTimeMinutes=7*60; // to the next morning, on both clocks
      const keep=S.houses.find(h=>h.type==='castle');if(keep){px=keep.exitX!=null?keep.exitX:keep.doorX;pz=keep.exitZ!=null?keep.exitZ:keep.doorZ+2;}else{px=S.site.x;pz=S.site.z;}jumpY=0;PHP=Math.max(PHP,Math.round(maxHP*.5));
      showMsg(`A night in the cells. ${stolen?'They took what you stole'+(back?` (${back} gold)`:'')+'. ':''}It is morning.`,'#c8b880');if(typeof addLog==='function')addLog('⛓',`A night in the cells at ${S.site.name}${stolen?'; the stolen goods were taken'+(back?`, and ${back} gold`:''):''}.`);
      if(typeof renderInv==='function')renderInv();if(typeof updateHUD==='function')updateHUD();});}
  function guardKilled(e){const id=e._guard.site;const C=worldState.crime||(worldState.crime={});const c=C[id]||(C[id]={bounty:0,debt:0,last:0});addFavor(id,-5);c.debt+=5;c.last=dayNow();c.bounty+=125;c.shut=true;if(typeof lampCrime==='function')lampCrime(c,125);
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
      if(note&&(bountyAt(site)>0||c.shut))return 'A guard of this town is dead by your hand, and the town is not paid. I will not hear you until it is.';
      const day=dayNow();if(c.confessed!=null&&day-c.confessed<3)return 'You have confessed. Now live it; come back to me in a few days.';
      if(gold<25)return 'The tithe is 25 gold. The Weaver keeps no accounts, but the roof does.';
      gold-=25;updateHUD();c.confessed=day;if(c.debt>0){c.debt--;addFavor(site,1);}if(note)note.absolved=day;
      if(typeof addLog==='function')addLog('🕯',`Confessed at ${site.name}; a tithe of 25 gold.`);
      return note?'It is heard. The dead man had a name; learn it. Go, and do not come back to me for the same thing.':'It is heard. The town will come round the sooner for it. Go gently.';}}];}
  function nationRecord(nk){const C=worldState.crime||{};if(nk==='aurenne'){const L=ledgerSweep();if(L&&L.bounty>0)return {name:'the Compact\'s ledger',id:LEDGER_KEY};} /* S2229 */for(const id in C){if(isLedgerKey(id))continue;const c=C[id];if(!(c.bounty>0||c.shut))continue;const t=SITE[id];if(t&&nationKeyOf(...cellOf(t.x,t.z))===nk)return t;}return null;}
  // striking a townsperson: the victim always sees it; a struck guard draws at once, anyone else runs
  function strikeNpc(fx,fz){const S=nearSite();if(!S)return false;let best=null,bd=2.2;
    for(const n of S.npcs||[]){if(!n.g.visible||n._retreated||n._drawn)continue;const ex=n.g.position.x-px,ez=n.g.position.z-pz,d=Math.hypot(ex,ez);if(d>=bd)continue;if((ex*fx+ez*fz)/(d||1)<=.45)continue;best=n;bd=d;}
    if(!best)return false;const name=(best.def&&best.def.name)||'someone';const site=S.site;
    addFavor(site,-3);const C=worldState.crime||(worldState.crime={});const c=C[site.id]||(C[site.id]={bounty:0,debt:0,last:0});c.bounty+=75;c.debt+=3;c.last=dayNow();if(typeof lampCrime==='function')lampCrime(c,75);
    (worldState.crimes||(worldState.crimes=[])).push({kind:'assault',site:site.id,house:null,day:dayNow(),min:absMin()});
    if(best.sched&&(best.sched.type==='guard'||best.sched.type==='watch'||best.sched.type==='constable')){showMsg(`You struck ${name}.`,'#ff6060');guardDraw(best,S);}
    else{best._scared=performance.now()+20000;showMsg(`You struck ${name}. ${site.name} will not forget it.`,'#ff6060');if(typeof addLog==='function')addLog('👁',`Struck ${name} at ${site.name}.`);}
    return true;}
  function doorLockFor(house){const home=house.type==='home';return {seed:'door_'+house.id,minPins:lockPins(house),lockBonus:home?-1:0,lockTitle:home?'A locked door':'A shop door, locked for the night',live:true,house,
    onPick:()=>{(worldState.picked||(worldState.picked={}))[house.id]=absMin();if(!noteCrime('lock',house))pickUnseen(house); /* S1794 — unseen, its keeper finds it at the opening */if(typeof goToInterior==='function')goToInterior(house);}};}
  // a shop's takings before the day's luck (Michael’s A on #68, S361): 10 + 50 a 100 prosperity, by the shop's kind; was 20 + 180 (S155)
  function boxCoins(p,type){const mult=/weapon|armor|armoury|forge/.test(type)?1.2:/potion|apothecary/.test(type)?.8:1;return (10+50*Math.max(0,Math.min(100,p))/100)*mult;}
  function boxState(){if(!INT_BOX)return null;const B=worldState.boxes||(worldState.boxes={});const r=B[INT_BOX.id];if(r&&dayNow()-r.taken<5)return 'empty';if(r&&INT_BOX.open)INT_BOX.open=false; // refilled: locked again
    return INT_BOX.open?'open':'locked';}
  function boxPrompt(){if(!INT_BOX||!currentHouse)return null;if(Math.hypot(px-INT_BOX.x,pz-INT_BOX.z)>TOUCH||Math.abs(jumpY-(INT_BOX.y||0))>.6)return null; /* S1437 — from the chest's own floor (a chest upstairs, INT_BOX.y; it was jumpY > 0.6, so no chest upstairs would open) */if(!aimBox(INT_BOX.x,INT_BOX.z,INT_BOX.y||0,.42,.42,.7))return null; /* S646 — and under the crosshair */const st=boxState();const name=INT_BOX.kind==='home'?'the chest':'the strongbox';
    return st==='empty'?(INT_BOX.kind==='home'?'The chest is empty':'The strongbox is empty'):st==='locked'?`Press 'E' to pick the lock on ${name}`:`Press 'E' to open ${name}`;}
  function boxInteract(){if(!boxPrompt())return false;const st=boxState(),X=INT_BOX;
    if(st==='empty'){showMsg(X.kind==='home'?'Nothing left in it.':'The takings are gone; they will not have refilled it yet.','#c8b880');return true;}
    if(st==='locked'){if(typeof tryLockpick==='function')tryLockpick({seed:'box_'+X.id,live:true,house:X.house,minPins:lockPins(X.house),lockBonus:X.kind==='home'?-1:0,lockTitle:X.kind==='home'?'A small chest':'A strongbox',onPick:()=>{X.open=true;if(X.lid)X.lid.rotation.x=-Math.PI/3;boxInteract();}});return true;}
    // open: the takings by the town's prosperity and one thing from the stock; a home's few coins and a keepsake
    // S604 — the takings roll on the box's own stream, `<house id>:box:<day>` (CLAUDE.md's co-op rules), as the barrels do (S471)
    const R=seededRng('loot',X.id+':box:'+lootDay()),rpick=a=>a[Math.floor(R()*a.length)];
    const items=[];let coins=0;const site=houseSite(X.house);const p=site?prosperity(site):50;
    if(X.kind==='home'){coins=2+Math.floor(R()*11);items.push({name:rpick(['A carved bird','A tin locket','A worn ring','A child’s top','A bone comb','A prayer card','A lock of hair in paper']),ico:'🎁',type:'misc',weight:.1,sellMult:1,buyPrice:8+Math.floor(R()*22),qty:1,stolen:true,stolenAt:site?site.id:null});}
    else{coins=Math.round(boxCoins(p,X.type)*(.8+R()*.4));
      try{const tbl=(typeof SHOP_STOCK!=='undefined')&&(SHOP_STOCK[X.type]||SHOP_STOCK.misc);if(tbl&&tbl.length){items.push(Object.assign({},rpick(tbl),{qty:1,stolen:true,stolenAt:site?site.id:null})); /* S2227 — the goods know their town, for the Gatelands' restitution */}}catch(e){}}
    gold+=coins;let got=0;items.forEach(it=>{if(typeof bagAdd==='function'){bagAdd(it);got++;}});
    (worldState.boxes||(worldState.boxes={}))[X.id]={taken:dayNow()};noteCrime('theft',X.house,coins+items.reduce((a,it)=>a+(it.buyPrice||0),0),coins);
    showMsg(`${coins} gold${got?', and '+items.map(i=>i.name.toLowerCase()).join(', '):''}.`,'#e8d8a0');if(typeof addLog==='function')addLog('💰',`Took ${coins} gold from ${X.kind==='home'?'a chest in':'the strongbox at'} ${X.house.name}.`);
    if(typeof renderInv==='function')renderInv();return true;}
  // S1121 — a book to take from a shelf (the quest writer's ask for *What the Stones Say*): a generated room's bookcase
  // (INT_SHELF, set by buildInteriorFor) offers the book of the first rule in SHELF_BOOKS that names the room's kind and its
  // town's people, once per room: taken, `worldState.shelfTaken[<house id>]` holds the book's id. It is the guild's copy, put
  // out to be read, so taking it is no crime. A rule whose book is not in BOOKS offers nothing.
  let INT_SHELF=null;
  const SHELF_BOOKS=[{type:'guild_m',people:'gatelander',book:'words_on_stones'}];
  function shelfBookFor(house){if(!house)return null;const site=houseSite(house);const pp=site?peopleOfSite(site):null;
    for(const r of SHELF_BOOKS){if(r.type!==house.type||(r.people&&r.people!==pp))continue;const def=BOOKS.find(b=>b.id===r.book);if(def)return def;}
    return null;}
  function shelfPrompt(){if(!INT_SHELF||!currentHouse||INT_SHELF.id!==currentHouse.id)return null;if(worldState.shelfTaken&&worldState.shelfTaken[INT_SHELF.id])return null;
    const def=shelfBookFor(currentHouse);if(!def)return null;
    if(Math.hypot(px-INT_SHELF.x,pz-INT_SHELF.z)>TOUCH||Math.abs(jumpY-INT_SHELF.y)>.9)return null;
    if(!aimBox(INT_SHELF.x,INT_SHELF.z,INT_SHELF.y+.5,INT_SHELF.hx||.25,INT_SHELF.hz||.9,1.3))return null; /* S1703 — a shelf on a back wall (the kit hall's press) gives its own half-widths */
    return `Press 'E' to take ${def.name} from the shelf`;}
  // the named action (co-op): the book into the bag, the room's copy gone for good
  function takeShelfBook(house){const def=shelfBookFor(house);if(!def)return false;const T=worldState.shelfTaken||(worldState.shelfTaken={});if(T[house.id])return false;
    T[house.id]=def.id;if(typeof bagAdd==='function')bagAdd(Object.assign(makeBookItem(def),{qty:1}));
    showMsg(`You take ${def.name} from the shelf.`,'#e8d8a0');if(typeof addLog==='function')addLog('📗',`Took ${def.name} from the shelf at ${house.name}.`);
    if(typeof renderInv==='function')renderInv();return true;}
  function shelfInteract(){if(!shelfPrompt())return false;return takeShelfBook(currentHouse);}
  let INT_LOOT=null;
  // S2062 — an inn's cellar barrels (water B's found bottle, Michael on #1355: one barrel in three holds an empty bottle). Each is a
  // container like a town's barrel: its id is the cellar's and its index, rolled on bottleFind's stream for the loot day, and what you
  // leave in it stays until the day turns. Nothing else is in an inn's cellar barrel.
  const CASKS=new Map();
  function caskAimed(){const C=currentHouse&&currentHouse._casks;if(!C||!C.length)return null;
    for(const c of C){if(Math.hypot(px-c.x,pz-c.z)>TOUCH||jumpY>.6)continue;if(aimBox(c.x,c.z,0,.4,.4,c.y+.1))return c;}return null;}
  function caskOf(c){const k=c.id+':'+lootDay();let o=CASKS.get(k);if(!o){const b=typeof bottleFind==='function'?bottleFind('cellar',k):null;
    o={id:c.id,kind:'barrel',name:'Barrel',displayName:'Barrel',items:b?[b]:[],zone:'interior',opened:false};CASKS.set(k,o);}return o;}
  function caskPrompt(){return caskAimed()?"Press 'E' to search the barrel":null;}
  function caskInteract(){const c=caskAimed();if(!c||typeof openLoot!=='function')return false;openLoot(caskOf(c));return true;}
  function lootPrompt(){const cp=caskPrompt();if(cp)return cp;if(!INT_LOOT||!currentHouse)return null;const taken=worldState.towerLoot&&worldState.towerLoot[INT_LOOT.id];if(taken)return null;if(Math.hypot(px-INT_LOOT.x,pz-INT_LOOT.z)<TOUCH&&Math.abs(jumpY-INT_LOOT.y)<1.2&&aimBox(INT_LOOT.x,INT_LOOT.z,INT_LOOT.y,.45,.45,.75))return towerLocked()?"Press 'E' to pick the chest's lock":"Press 'E' to open the chest";return null;}
  function towerLocked(){return !!INT_LOOT&&!(worldState.towerPicked&&worldState.towerPicked[INT_LOOT.id]);} // S150 — the tower's chest is a good lock
  function lootInteract(){if(caskInteract())return true;if(!lootPrompt())return false;
    if(towerLocked()){const id=INT_LOOT.id;if(typeof tryLockpick==='function')tryLockpick({seed:'tower_'+id,minPins:4,lockTitle:'A locked chest',onPick:()=>{(worldState.towerPicked||(worldState.towerPicked={}))[id]=true;lootInteract();}});return true;}
    const items=(typeof rollContainerLoot==='function'?rollContainerLoot('treasure',2.4,null,1,'tower:'+INT_LOOT.id):[])||[];if(!items.length)items.push({name:'Old Gold',ico:'🪙',type:'misc',weight:.5,sellMult:1,buyPrice:120,qty:1});let got=0;items.forEach(it=>{if(it.qty==null)it.qty=1;if(typeof bagAdd==='function'){bagAdd(it);got++;}});(worldState.towerLoot||(worldState.towerLoot={}))[INT_LOOT.id]=true;showMsg(`The chest yields ${got} thing${got===1?'':'s'}.`,'#e8d8a0');if(typeof addLog==='function')addLog('💰',`Opened the chest atop ${currentHouse.name}.`);return true;}
  function hatchPrompt(){if(currentHouse&&currentHouse.type==='towercellar')return towerCellarPrompt();if(currentHouse&&(currentHouse.type==='limecave'||currentHouse.type==='seacave'||currentHouse.type==='mine'||currentHouse.type==='tunnel'))return limeCavePrompt(); /* S1768 */ /* S1765 — the tower house's cellar: its two ways up */if(!HATCH.active||!currentHouse)return null;if(Math.hypot(px-HATCH.x,pz-HATCH.z)<TOUCH&&Math.abs(jumpY-HATCH.y)<.9&&intHatchAimed())return HATCH.roof?"Press 'E' to climb out onto the roof":(currentHouse.type==='cellar'||currentHouse.type==='chapel')?"Press 'E' to climb up":isGuestCathedral(currentHouse)?"Press 'E' to go down — the bricked stair":"Press 'E' to go down to the cellar";return null;}
  // S646 — the hatch under the crosshair: a way up (the roof's, a cellar's or the chapel's ladder) is the column from its floor to
  // the ceiling, a way down the square of the hatch (1.1 across) and a little above it
  function intHatchAimed(){const up=HATCH.roof||(currentHouse&&(currentHouse.type==='cellar'||currentHouse.type==='chapel'));return aimBox(HATCH.x,HATCH.z,HATCH.y-.1,.65,.65,up?3.2:.6);}
  function hatchInteract(){if(currentHouse&&currentHouse.type==='towercellar')return towerCellarUse(); /* S1765 */if(currentHouse&&(currentHouse.type==='limecave'||currentHouse.type==='seacave'||currentHouse.type==='mine'||currentHouse.type==='tunnel'))return limeCaveUse(); /* S1768 */if(!hatchPrompt())return false;const h=currentHouse;
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
  // S636 — Michael's B on #192 (docs/design/the-ship-in-hand.md): two hulls more, each a trade and each sold on one island, the
  // Mark's cutter (fast, thin-skinned, a small hold) and Aurenne's caravel. `worth` is what the hull stands at, the sloop's 400
  // plus the refits up to it (the cog 1,300 and the galleon 3,500, as the ladder has always cost); `price` stays the fee from
  // a sloop. `at` names the nation whose yards sell her. Until the look builder gives the two their own hulls, the cutter is
  // drawn on the sloop's and the caravel on the cog's, so L and W are those hulls' (buildShipMesh picks the bake by L).
  const SHIP_CLASSES={sloop:{L:13,W:4.4,name:'sloop',price:0,worth:400,speed:7.5,hull:100},cog:{L:17,W:5.6,name:'cog',price:900,worth:1300,speed:8.5,hull:140},galleon:{L:22,W:7.0,name:'galleon',price:2200,worth:3500,speed:9.5,hull:200},
    cutter:{L:13,W:4.4,name:'cutter',price:1600,worth:2000,speed:12,hull:80,at:'mark'},caravel:{L:17,W:5.6,name:'caravel',price:2800,worth:3200,speed:11,hull:130,at:'aurenne'}};
  // the hulls a yard sells: the three everywhere, the cutter at the Mark's, the caravel at Aurenne's
  function yardHulls(site){let nat='gatelands';try{nat=nationAt(site.x,site.z);}catch(e){}return Object.keys(SHIP_CLASSES).filter(k=>!SHIP_CLASSES[k].at||SHIP_CLASSES[k].at===nat);}
  // a refit from one hull to any other pays the difference in worth; to a hull worth less, the yard pays back two thirds of it
  function refitCost(from,to){const d=SHIP_CLASSES[to].worth-SHIP_CLASSES[from||'sloop'].worth;return d>=0?d:-Math.round(-d*2/3);}
  // the next hull up by worth (the Compact's refit): sloop → cog → cutter → caravel → galleon
  function nextHullUp(cls){const order=Object.keys(SHIP_CLASSES).sort((a,b)=>SHIP_CLASSES[a].worth-SHIP_CLASSES[b].worth);const i=order.indexOf(cls||'sloop');return i>=0&&i<order.length-1?order[i+1]:null;}
  const SAIL_TIERS=[0,250,450,700,1100]; // price to reach tier 1..4; S636: each tier +12% of her bare speed (was +1.2 u/s, three tiers)
  const SAIL_STEP=.12;
  const CARGO_TIERS=[0,200,400];    // +25 carry each while aboard or within 20u of her
  // S1726 — Michael's B on #979 (docs/design/making-a-ship-yours.md): her rooms hold fittings, a place each, by hull (sloop 2, cutter 2,
  // cog 3, caravel 3, galleon 5). Stowage is the old hold tier and stays counted in st.cargo (0 to 2, +25 hold each, the 200 and 400
  // as before), so an old save's tiers are fitted stowage as they stand. The rest live in st.fit, one of each, and take hold weight:
  // a ship is a trader or a home. A fitting taken out, or one a smaller hull has no place for, waits in st.stored and is fitted
  // again free at any yard. What each one does at sea (the still, the galley, the crew's stations, the rack) is the page's later sessions.
  const SHIP_PLACES={sloop:2,cutter:2,cog:3,caravel:3,galleon:5};
  const SHIP_FITS={still:{n:'still',a:'a still',w:10,price:400},galley:{n:'galley',a:'a galley',w:10,price:300},chart:{n:'chart table',a:'a chart table',w:5,price:300},bunks:{n:'crew bunks',a:'crew bunks',w:10,price:250},arms:{n:'arms rack',a:'an arms rack',w:5,price:200},ballista:{n:'ballista',a:'a ballista',w:5,price:350}}; /* S1820 — naval combat's ballista */
  function shipFitList(st){st=st||shipCfg();if(!Array.isArray(st.fit))st.fit=[];for(let i=st.fit.length-1;i>=0;i--)if(!SHIP_FITS[st.fit[i]])st.fit.splice(i,1);if(!Array.isArray(st.stored))st.stored=[];return st.fit;}
  function shipPlaces(cls){return SHIP_PLACES[cls||(worldState.ship&&worldState.ship.cls)||'sloop']||2;}
  function shipPlacesUsed(st){st=st||shipCfg();return (st.cargo||0)+shipFitList(st).length;}
  function shipFitWeight(){const st=worldState.ship;if(!st||!Array.isArray(st.fit))return 0;let w=0;for(const k of st.fit)if(SHIP_FITS[k])w+=SHIP_FITS[k].w;return w;}
  function shipFitted(k){const st=worldState.ship;return !!(st&&!st.sunk&&Array.isArray(st.fit)&&st.fit.includes(k));}
  // the named actions (co-op rules): fit one (bought, or from the yard's store), take one out to the store, and fit her to a hull
  // why a fitting cannot go into her now (places, one of each, the hold's weight), or null; gold is the caller's. S1733 — from her
  // bench (src 'bench') one the yard keeps for her is refused too, so a fitting is still one of a kind
  function fitShipWhy(k,src){const st=shipCfg(),f=shipFitList(st);
    if(k==='stowage'){if((st.cargo||0)>=2)return 'She has all the stowage she can take.';}else{if(!SHIP_FITS[k])return 'No such fitting.';if(f.includes(k))return `She has ${SHIP_FITS[k].a} already.`;}
    if(src==='bench'&&st.stored.includes(k))return `The yard keeps her ${shipFitNames([k])[0]} already; it goes back in there for nothing.`;
    if(shipPlacesUsed(st)>=shipPlaces(st.cls))return `Her rooms are full: ${shipPlaces(st.cls)} places, all taken.`;
    const w=k==='stowage'?0:SHIP_FITS[k].w;if(w&&holdUsed()+w>holdCap())return `The ${SHIP_FITS[k].n} take${k==='bunks'?'':'s'} ${w} of the hold; clear the hold first.`;
    return null;}
  // fromStore: true from the yard's store (free), 'bench' built at her bench (free; the materials are the bench's), else bought
  function fitShip(k,fromStore){const st=shipCfg(),f=shipFitList(st);const why=fitShipWhy(k,fromStore);if(why)return why;
    const p=fromStore?0:k==='stowage'?CARGO_TIERS[(st.cargo||0)+1]:SHIP_FITS[k].price;if(gold<p)return null;
    if(fromStore===true){const i=st.stored.indexOf(k);if(i<0)return 'The yard holds no such fitting of hers.';st.stored.splice(i,1);}
    gold-=p;if(p&&typeof updateHUD==='function')updateHUD();if(k==='stowage')st.cargo=(st.cargo||0)+1;else f.push(k);
    if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} fitted with ${k==='stowage'?'stowage':SHIP_FITS[k].a}.`);return true;}
  function unfitShip(k){const st=shipCfg(),f=shipFitList(st);
    if(k==='stowage'){if(!(st.cargo>0))return 'She has no stowage fitted.';if(holdUsed()>holdCap()-25)return 'Clear 25 of the hold before the stowage comes out.';st.cargo--;}
    else{const i=f.indexOf(k);if(i<0)return 'She has no such fitting.';if(k==='bunks'&&Array.isArray(st.crew)&&st.crew.length)return 'Her crew sleep in them: send them ashore first.';f.splice(i,1);} /* S1737 */
    st.stored.push(k);return true;}
  // a refit to a hull with fewer places sends the last fitted to the yard's store first, then the stowage
  function shipFitToHull(){const st=shipCfg(),f=shipFitList(st),n=shipPlaces(st.cls),out=[];
    while(shipPlacesUsed(st)>n){if(f.length)out.push(f.pop());else{st.cargo--;out.push('stowage');}}
    st.stored.push(...out);if(out.includes('bunks')&&Array.isArray(st.crew))for(const r of st.crew.splice(0))(st.ashore||(st.ashore={}))[r]=null; /* S1737 — no bunks, the crew wait at the yard */return out;}
  // S1733 — the still and the galley are in her hold (the build sheet's session 2): brewing there with a still fitted is ×1.10, and a
  // galley is a fire. Until the look builder's fittings stand in the hold, anywhere in it is at them; once a room records a spot
  // (house._fits[k] = {x,z}, the room's metres) it is within 2 m of it, the sheet's reach
  const SHIP_STILL_K=1.10,SHIP_FIT_REACH=2;
  function shipFitAtHand(k){if(!shipFitted(k)||typeof cabinBench!=='function'||!cabinBench())return false;
    const sp=currentHouse._fits&&currentHouse._fits[k];return !sp||Math.hypot(px-sp.x,pz-sp.z)<=SHIP_FIT_REACH;}
  // S1733 — her arms rack (the build sheet, session 2): three weapons kept aboard, a stash for weapons only, opened from her sea chest
  // in her hold. Kept in st.rack in the save's item form (_serItem), so it travels with worldState.ship; taken back through
  // _restoreEnchant. If boarders land while your hands are empty, the first on the rack is drawn for you (rackDraw, tickBoarding)
  const SHIP_RACK_N=3;
  function shipRack(){const st=shipCfg();if(!Array.isArray(st.rack))st.rack=[];return st.rack;}
  function rackHere(){return shipFitted('arms')&&typeof cabinBench==='function'&&cabinBench();}
  function rackItem(s){const it=_restoreEnchant(JSON.parse(JSON.stringify(s)));delete it.qty;return it;}
  // the named actions: a weapon from the bag (its index) onto the rack, one off it into the bag. Each returns true or why not
  function rackPut(i){const it=BAG[i];if(!shipFitted('arms'))return 'She has no arms rack.';if(!it||it.type!=='equip'||it.slot!=='weapon')return 'The rack takes weapons only.';
    if(it.quest||it.artifact)return `The ${it.name} stays with you.`;const R=shipRack();if(R.length>=SHIP_RACK_N)return `The rack is full: ${SHIP_RACK_N} weapons.`;
    let one=it;if((it.qty||1)>1){it.qty--;one={...it,qty:1};}else BAG.splice(i,1);R.push(_serItem(one));return true;}
  function rackTake(j){const R=shipRack(),s=R[j];if(!s)return 'Nothing there.';const it=rackItem(s);if(!canCarry(it))return 'Too heavy to carry!';
    R.splice(j,1);bagAdd(it);return true;}
  function rackDraw(){if(!shipFitted('arms')||EQ.weapon||PHP<=0)return null;const R=shipRack();if(!R.length)return null;
    const it=rackItem(R.shift());EQ.weapon=it;if(typeof SHEATHED!=='undefined'&&SHEATHED&&typeof drawWeapon==='function')drawWeapon();sparKitRefresh();
    showMsg(`You take the ${it.name} from the rack.`,'#e8d8a0');return it;}
  // S1734 — her figureheads (the build sheet, session 3). The yard carves its island's (the harp, the dragon prow, the sun) for 150
  // gold, no virtue. Five more are only found, each as a token in the bag (weight 0, to be fitted at a yard): fitted free at any
  // shipwright, one at her bow at a time, the rest kept for her (st.heads, the yard's store). Their virtues: the Sea's hull +5% top
  // speed in rain or storm; the wreck's maiden, a pirate within 300 m holds off 10 s before closing; the beast's skull, merchantmen
  // give way and keep 30 m off; the gate stone, storm wear ×0.8 (the Drowned Bell's ×0.5 the better, never both); the Weaver's
  // shuttle points the navigator's line at the nearest wreck not yet opened (S1743, shuttleHint; nothing without him)
  const SHIP_HEADS={sea:{n:'the Sea’s Hull'},maiden:{n:'the Wreck’s Maiden'},skull:{n:'the Beast’s Skull'},stone:{n:'the Gate Stone'},shuttle:{n:'the Weaver’s Shuttle'}};
  const HEAD_CARVE={gatelands:'harp',mark:'dragon prow',aurenne:'sun'};
  const HEAD_YARD_PRICE=150,HEAD_SEA_K=1.05,HEAD_MAIDEN_R=300,HEAD_MAIDEN_S=10,HEAD_SKULL_R=30,HEAD_STONE_K=.8;
  function headName(k,st){st=st||worldState.ship||{};return k==='yard'?`the ${HEAD_CARVE[st.yardHead]||'harp'}`:SHIP_HEADS[k]?SHIP_HEADS[k].n:k;}
  function headItem(k){const N=SHIP_HEADS[k].n;return {name:N[0].toUpperCase()+N.slice(1),ico:'🗿',type:'misc',weight:0,buyPrice:0,sellMult:0,unique:true,figurehead:k,desc:'A figurehead, to be fitted at a yard.'};}
  function shipHeads(st){st=st||shipCfg();if(!Array.isArray(st.heads))st.heads=[];return st.heads;}
  function shipHead(){const st=worldState.ship;return st&&!st.sunk&&st.head?st.head:null;}
  function headFound(k){return BAG.some(b=>b&&b.figurehead===k)||!!(worldState.ship&&Array.isArray(worldState.ship.heads)&&worldState.ship.heads.includes(k));}
  // the named actions: one found (its token into the bag, once), and one set at her bow at a yard
  function grantHead(k){if(!SHIP_HEADS[k]||headFound(k))return false;bagAdd(headItem(k));const N=headName(k);
    showMsg(`${N[0].toUpperCase()+N.slice(1)}: a figurehead, to be fitted at a yard.`,'#e8d8a0');if(typeof renderHubInv==='function')renderHubInv();return true;}
  function fitHead(k,nation){const st=shipCfg(),H=shipHeads(st);
    if(k==='yard'){const nat=HEAD_CARVE[nation]?nation:'gatelands';if(st.yardHead!==nat){if(gold<HEAD_YARD_PRICE)return null;gold-=HEAD_YARD_PRICE;if(typeof updateHUD==='function')updateHUD();st.yardHead=nat;}st.head='yard';return true;}
    if(!SHIP_HEADS[k])return 'No such figurehead.';const i=BAG.findIndex(b=>b&&b.figurehead===k);if(i>=0){BAG.splice(i,1);if(!H.includes(k))H.push(k);}
    if(!H.includes(k))return 'She has no such figurehead.';st.head=k;if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} carries ${headName(k)} at her bow.`);return true;}
  // the maiden: a black sail within 300 m holds off 10 s (from tickOtherShips), once a ship; true while she holds
  function headHold(o,dP,dt){if(shipHead()!=='maiden'||dP>HEAD_MAIDEN_R)return false;if(o._maidenT==null){o._maidenT=HEAD_MAIDEN_S;showMsg('The black sail sees the maiden at your bow and holds off. Ten seconds, no more.','#ffb060');}
    if(o._maidenT<=0)return false;o._maidenT-=dt;return true;}
  // the skull: a merchantman within twice 30 m of her turns away from her, so she keeps 30 m off; where to steer, or null
  function headGiveWay(o){if(shipHead()!=='skull'||!SHIP.mesh)return null;const dx=o.x-SHIP.x,dz=o.z-SHIP.z,d=Math.hypot(dx,dz);
    if(d>HEAD_SKULL_R*2||d<1e-3)return null;return {x:o.x+dx/d*100,z:o.z+dz/d*100};}
  // S1736 — the wreck's maiden: in the sea chest of each island's deepest wreck (by its bed, the lowest of every wreck spawnWreck would
  // lay, the same hash and the same first bed of 2.5 to 8 m under the sea), keyed by the chunk; worked out once for the whole world at
  // the first wreck's spawn (the chunks' hashes and worldH, never what has loaded: S533). One maiden in all, so the first of the
  // three taken is the one; until then each of those chests holds her
  let MAIDEN_WRECKS=null,SEA_WRECKS=null;
  // S1743 — every wreck spawnWreck would lay at sea, the same walk the maiden's was (one pass, kept for the session): {key, x, z, bed}
  function seaWrecks(){if(SEA_WRECKS)return SEA_WRECKS;const L=[],N=Math.ceil(GRID*SIZE/CHUNK);
    for(let cz=0;cz<N;cz++)for(let cx=0;cx<N;cx++){if(hash01(cx,cz,150)>.06)continue;const t=maskAt(Math.floor(cx*CHUNK/SIZE),Math.floor(cz*CHUNK/SIZE));if(t==='land')continue;
      const w=wreckSpot(cx,cz);if(w)L.push({key:chunkKey(cx,cz),x:w.x,z:w.z,bed:w.bed});}  /* S1766 — the spot by placeH, the one spawnWreck lays (85-world-sea.js) */
    return SEA_WRECKS=L;}
  function maidenWrecks(){if(MAIDEN_WRECKS)return MAIDEN_WRECKS;const best={};
    for(const w of seaWrecks()){const n=nationAt(w.x,w.z),B=best[n];if(!B||w.bed<B.bed)best[n]={key:w.key,bed:w.bed,x:w.x,z:w.z};}
    return MAIDEN_WRECKS=best;}
  function maidenWreckHere(cx,cz){if(headFound('maiden'))return false;const k=chunkKey(cx,cz),W=maidenWrecks();for(const n in W)if(W[n].key===k)return true;return false;}
  // S1737 — her crew (the build sheet, session 4): the carpenter, the cook and the navigator are met, not hired (crewMeet, the errands'
  // hook, session 5), and two sail with her, in her bunks; the third waits ashore, swapped free at any shipwright. Each works at a skill of
  // 50 from a station: the carpenter one patch of 18 every 90 s under way to her field cap at Joinery 50 (80%), a plank and a pitch from
  // the sea chest; the cook (and her galley), at 6h each game day, one fish or else one joint from the chest, cooked at ×1.0, back into
  // it; the navigator (and her chart table), at sea, the minimap to 116 m and the oilskin's *ahead* line. Sunk, they swim for the nearest port
  const CREW={carpenter:{n:'the carpenter',needs:['bunks']},cook:{n:'the cook',needs:['bunks','galley']},navigator:{n:'the navigator',needs:['bunks','chart']}};
  const CREW_N=2,CREW_PATCH_S=90,CREW_PATCH=18,CREW_JOINERY=50,CREW_COOK_H=6,NAV_MAP_R=116,MINIMAP_R=58;
  // S1780 — the navigator's shoals: water whose bed is under 2 m, drawn on the minimap (and the Local view) at the world map's own shallows, its water a third of the way to parchment
  const SHOAL_D=2,SHOAL_COL='#76888e';
  function shipCrew(st){st=st||shipCfg();if(!Array.isArray(st.crew))st.crew=[];if(!st.ashore||typeof st.ashore!=='object')st.ashore={};return st.crew;}
  function crewName(r,up){const n=CREW[r]?CREW[r].n:r;return up?n[0].toUpperCase()+n.slice(1):n;}
  // aboard and at their station
  function crewAt(r){const st=worldState.ship;return !!(st&&!st.sunk&&CREW[r]&&Array.isArray(st.crew)&&st.crew.includes(r)&&CREW[r].needs.every(k=>shipFitted(k)));}
  // the named actions: met (they wait at that port), taken aboard, sent ashore
  function crewMeet(r,siteId){if(!CREW[r])return false;const st=shipCfg(),C=shipCrew(st);if(C.includes(r)||(r in st.ashore))return false;st.ashore[r]=siteId||null;
    if(siteId){if(!st.met||typeof st.met!=='object')st.met={};if(!st.met[r])st.met[r]=siteId;}return true;}
  // S1791 — where each hand was met (st.met, kept through aboard, ashore and sinking; the bodies builder's ask of S1779), and so their people:
  // the port's own by its townsfolk's stream (peopleOfNpc, a stranger at a port as often as on its quay), keyed by the hand and the port, and
  // the port's nation. null for a hand met before S1791 or with no port, so the hold keeps its old roll by her name
  function crewMetSite(r){const st=worldState.ship,id=st&&st.met&&st.met[r];if(!id)return null;try{return siteAnywhere(id)||null;}catch(e){return null;}}
  function crewPeople(r){const s=crewMetSite(r);if(!s)return null;try{const c=cellOf(s.x,s.z);return [peopleOfNpc(s,seededRng('crew',r+'|'+s.id)),nationKeyOf(c[0],c[1])];}catch(e){return null;}}
  function crewAboard(r){const st=shipCfg(),C=shipCrew(st);if(!CREW[r])return 'No such hand.';if(C.includes(r))return `${crewName(r,1)} is aboard already.`;
    if(!(r in st.ashore))return `You have not met ${crewName(r)}.`;if(!shipFitted('bunks'))return 'She has no bunks for a crew.';
    if(C.length>=CREW_N)return 'Her bunks sleep two, and both are taken.';delete st.ashore[r];C.push(r);return true;}
  function crewAshore(r,siteId){const st=shipCfg(),C=shipCrew(st),i=C.indexOf(r);if(i<0)return `${crewName(r,1)} is not aboard.`;C.splice(i,1);st.ashore[r]=siteId||null;return true;}
  function crewSink(){const st=shipCfg(),C=shipCrew(st);if(!C.length)return '';let port=null,bd=1e9;
    try{for(const t of allPorts()){const d=Math.hypot(t.x-SHIP.x,t.z-SHIP.z);if(d<bd){bd=d;port=t;}}}catch(e){}
    const who=C.splice(0);for(const r of who)st.ashore[r]=port?port.id:null;return `${who.map(r=>crewName(r,1)).join(' and ')} swim for ${port?port.name:'the shore'}, and wait there.`;}
  // the minimap's reach at sea, and the navigator's *ahead* line
  function navMapR(){return crewAt('navigator')&&(SHIP.sailing||onDeck())?NAV_MAP_R:MINIMAP_R;}
  function navAboard(){return crewAt('navigator')&&(SHIP.sailing||onDeck());}
  // S1880 — the chart table read (making-a-ship-yours-build.md's fittings: "Shoals under 2 m appear on the world map while you read it at
  // the table"; #979 B). E at her drawn table, with the chart table fitted, opens the world map with every bed under SHOAL_D drawn
  // SHOAL_COL; the map's tiles for it are kept apart (MAP.shoals, 83's tileKey), and closing the hub puts the plain map back. The table is
  // in the cutter's hold (house._chart) and in the cabin on the main deck of the caravel, the cog and the galleon (userData.chart); the
  // sloop's hold has none drawn. Not under sail, as the berth's rule; no hand is needed (the sheet: the table does little alone).
  const CHART_PROMPT="Press 'E' to read the chart";
  function chartOk(){return typeof SHIP!=='undefined'&&!!SHIP.mesh&&!SHIP.sailing&&shipFitted('chart');}
  function chartHoldNear(){if(!chartOk()||typeof cabinBench!=='function'||!cabinBench()||currentHouse!==CABIN.house)return false;const c=currentHouse._chart;return !!c&&Math.hypot(px-c.x,pz-c.z)<=TOUCH;}
  function chartDeckNear(){const c=SHIP.mesh&&SHIP.mesh.userData.chart;if(!c||!chartOk()||!onDeck()||shipUpper(SHIP.mesh))return false;const [lx,lz]=shipLocal(SHIP.mesh,px,pz);
    return Math.hypot(Math.max(0,Math.abs(lx-c.x)-c.hx),Math.max(0,Math.abs(lz-c.z)-c.hz))<=.6;}
  function chartRead(){if(!chartOk())return false;MAP.shoals=true;MAP.dirty=true;openHub('map');
    if(MAP.cv){const k=baseScale()*MAP.zoom;MAP.ox=MAP.cssW/2-SHIP.x*k;MAP.oy=MAP.cssH/2-SHIP.z*k;mapClamp();MAP.dirty=true;} /* on her, not on the hold's own floor */
    return true;}
  function chartDone(){if(!MAP.shoals)return;MAP.shoals=false;MAP.dirty=true;}
  function stashTakeOne(pred){const i=stashBag.findIndex(b=>b&&pred(b));if(i<0)return null;const b=stashBag[i];const one={...b,qty:1};b.qty=(b.qty||1)-1;if(b.qty<=0)stashBag.splice(i,1);return one;}
  function tickShipCrew(dt){const st=worldState.ship;if(!st||st.sunk||!Array.isArray(st.crew)||!st.crew.length)return;
    if(crewAt('carpenter')&&SHIP.sailing&&Math.abs(SHIP.speed)>.5){SHIP._carpT=(SHIP._carpT||0)+dt;if(SHIP._carpT>=CREW_PATCH_S){SHIP._carpT-=CREW_PATCH_S;crewPatch();}}
    if(crewAt('cook')){const day=Math.floor(gameMinNow()/1440);if(gameHour()>=CREW_COOK_H&&st.cookDay!==day){st.cookDay=day;crewCook();}}}
  function crewPatch(){const b=shipBars(),cap=Math.round(b.hullMax*Math.min(1,.6+.004*CREW_JOINERY));if(b.hull>=cap)return 0;
    const pitch=SURV_ITEMS.pitch.name;if(!stashBag.some(x=>x&&x.plank)||!stashBag.some(x=>x&&x.name===pitch)){if(!SHIP._carpSaid){SHIP._carpSaid=true;showMsg('The carpenter has no plank or no pitch in the sea chest. He waits.','#cc8844');}return 0;}
    SHIP._carpSaid=false;stashTakeOne(x=>x.plank);stashTakeOne(x=>x.name===pitch);const to=Math.min(cap,b.hull+CREW_PATCH);shipCfg().hull=to;shipBarsUI();
    showMsg(`The carpenter's patch holds: hull ${to} of ${b.hullMax}.`,'#d8c8a0');return to-b.hull;}
  function crewCook(){const f=stashTakeOne(x=>x.food==='fish')?'fish':stashTakeOne(x=>x.food==='meat')?'meat':null;if(!f)return null;
    const it=mealItem(f,1);_stashAdd(it);showMsg(`The cook has a ${it.name.toLowerCase()} in the sea chest for you.`,'#d8c8a0');return it;}
  // S1834 — #979 B, the sheet's session 5: renaming her is free, at any yard. One named action (the co-op rules), the name kept in
  // worldState.ship.name (the world's row) and SHIP.name together. Letters, digits, spaces, apostrophes and hyphens, 24 at most;
  // a leading "the" is dropped, since every line says "the {name}". Sunk, or with no ship, nothing is renamed.
  const SHIP_NAME_MAX=24;
  function shipNameClean(s){s=String(s==null?'':s).replace(/[^A-Za-z0-9 '’\-À-ÿ]/g,'').replace(/\s+/g,' ').trim().replace(/^the\s+/i,'').trim();if(s.length>SHIP_NAME_MAX)s=s.slice(0,SHIP_NAME_MAX).trim();return s?s[0].toUpperCase()+s.slice(1):'';}
  function renameShip(n){const st=worldState.ship;if(!st||st.sunk)return null;const nm=shipNameClean(n);if(!nm)return null;const old=st.name||SHIP.name;if(nm===old)return nm;
    st.name=nm;SHIP.name=nm;if(typeof addLog==='function')addLog('⛵',`The ${old} is the ${nm} now.`);return nm;}
  // S1845 — #979 B, the sheet's session 5, with the look builder's swatches (S1843, Michael's "as drawn" on #1133): a yard paints her
  // hull and changes her sails from its own island's four paints and three cloths, 50 gold and an hour on the clock each, as a
  // shipwright's mending is. The swatches are her dress's (#839 A), so a yard works only on a ship in its own island's dress; a refit
  // there gives her that dress first. One named action (the co-op rules): paintShip(k, v), k 'paint' or 'cloth', v an index into
  // PKIT.ships.SWATCHES[her dress] (0 is the dress as built). Kept in worldState.ship.paint and .cloth, the world's row.
  const YARD_PAINT={gold:50,mins:60};
  // the dress her hull wears (shipBake's rule): the cutter is always the Mark's, the caravel Aurenne's, the rest the yard's that sold or refitted her
  function herDress(cls,d){cls=cls||(worldState.ship&&worldState.ship.cls)||'sloop';return cls==='cutter'?'mark':cls==='caravel'?'aurenne':shipDress(d);}
  function shipSwatches(){const W=typeof PKIT!=='undefined'&&PKIT.ships&&PKIT.ships.SWATCHES;return W?W[herDress()]||null:null;}
  function paintShipWhy(site,k,v){const st=worldState.ship;if(!st||st.sunk)return 'She is not afloat.';const W=shipSwatches();if(!W)return 'The yard has no colours for her.';
    const L=k==='paint'?W.paints:k==='cloth'?W.cloths:null;if(!L||!(v>=0&&v<L.length&&v===(v|0)))return 'No such colour.';
    if(site&&nationAt(site.x,site.z)!==herDress())return 'This yard paints only ships of its own island’s build.';
    if(((st[k]|0))===v)return k==='paint'?'She is that colour already.':'Her sails are that cloth already.';if(gold<YARD_PAINT.gold)return `It is ${YARD_PAINT.gold} gold.`;return null;}
  function paintShip(k,v,site){const why=paintShipWhy(site,k,v);if(why)return why;const st=worldState.ship,W=shipSwatches(),nm=(k==='paint'?W.paints:W.cloths)[v].name;
    gold-=YARD_PAINT.gold;updateHUD();st[k]=v;if(typeof advanceClock==='function')advanceClock(YARD_PAINT.mins);else worldState.gameTimeMinutes+=YARD_PAINT.mins;
    if(SHIP.mesh&&typeof shipSwatchOn==='function')shipSwatchOn(SHIP.mesh);
    if(typeof addLog==='function')addLog('⛵',k==='paint'?`The ${st.name||SHIP.name} is painted ${nm}.`:`The ${st.name||SHIP.name} has ${nm} sails.`);return true;}
  // S1922 — #979 B, the sheet's session 5, with the look builder's banner (S1919, Michael's A on #1150): any yard hangs her banner, the
  // Crown's, the Mark's or the Compact's, or strikes it, 50 gold and an hour as her paint is. A banner is only a look (the sheet: until
  // naval combat's C), so no yard refuses another nation's; your house's waits on your house having arms. One named action (the co-op
  // rules): bannerShip(v), v 'gatelands' | 'mark' | 'aurenne' | '' (none). Kept in worldState.ship.banner, the world's row.
  const SHIP_FLAGS=['gatelands','mark','aurenne',''];
  function bannerName(v){const B=typeof PKIT!=='undefined'&&PKIT.ships&&PKIT.ships.BANNERS;return v&&B&&B[v]?B[v].name+'’s':'none';}
  function bannerShipWhy(v){const st=worldState.ship;if(!st||st.sunk)return 'She is not afloat.';if(v==null)v='';if(!SHIP_FLAGS.includes(v))return 'No such banner.';
    if((st.banner||'')===v)return v?'She flies it already.':'She flies none already.';if(gold<YARD_PAINT.gold)return `It is ${YARD_PAINT.gold} gold.`;return null;}
  function bannerShip(v){if(v==null)v='';const why=bannerShipWhy(v);if(why)return why;const st=worldState.ship;
    gold-=YARD_PAINT.gold;updateHUD();if(v)st.banner=v;else delete st.banner;if(typeof advanceClock==='function')advanceClock(YARD_PAINT.mins);else worldState.gameTimeMinutes+=YARD_PAINT.mins;
    if(SHIP.mesh&&typeof shipBannerOn==='function')shipBannerOn(SHIP.mesh);const n=st.name||SHIP.name;
    if(typeof addLog==='function')addLog('⛵',v?`The ${n} flies ${bannerName(v)} banner.`:`The ${n} flies no banner.`);return true;}
  function shipFitNames(arr){return arr.map(k=>k==='stowage'?'stowage':SHIP_FITS[k]?SHIP_FITS[k].n:k);}
  function shipCfg(){return worldState.ship||(worldState.ship={});}
  function shipClass(){return SHIP_CLASSES[(worldState.ship&&worldState.ship.cls)||'sloop'];}
  function shipTopSpeed(){return shipClass().speed*(1+((worldState.ship&&worldState.ship.sails)||0)*SAIL_STEP)*(gateGift('gaoth')?1.5:1)*(shipHead()==='sea'&&(WX.type==='rain'||WX.type==='storm')?HEAD_SEA_K:1);} /* S1734 — the Sea’s hull */ /* S1349 — Gaoth's gift, after the sails */
  // S411 — Michael's A on #85 (docs/design/sailing.md): a hull by class and a rig of 100, kept in worldState.ship (saved).
  // Under half her hull she ships water (speed ×0.8), under a quarter ×0.6; the rig sets ×(0.5 + 0.5 × rig/100);
  // at 0 hull she is waterlogged and makes 2.5 at most. The shipwright mends 4 gold a hull point, 3 a rig point, an hour a 20.
  function shipBars(){const st=shipCfg(),mx=shipClass().hull;if(!(st.hull>=0)||st.hull>mx)st.hull=mx;if(!(st.rig>=0)||st.rig>100)st.rig=100;return {hull:st.hull,rig:st.rig,hullMax:mx,rigMax:100};}
  function shipSpeedMul(){if(!worldState.ship)return 1;const b=shipBars(),f=b.hull/b.hullMax;return (f<.25?.6:f<.5?.8:1)*(.5+.5*b.rig/100);}
  function shipSpeedNow(){const v=shipTopSpeed()*shipSpeedMul();return worldState.ship&&shipBars().hull<=0?Math.min(2.5,v):v;}
  function shipWear(hull,rig){if(!worldState.ship)return null;const b=shipBars(),st=shipCfg();hull=Math.max(0,Math.round(hull||0));rig=Math.max(0,Math.round(rig||0));
    if(b.hull===0&&hull>0&&SHIP.mesh){shipSink();return {hull:0,rig:0,sunk:true};}
    st.hull=Math.max(0,b.hull-hull);st.rig=Math.max(0,b.rig-rig);if(b.hull>0&&st.hull===0)showMsg(`The ${SHIP.name} is waterlogged. She will make two knots and a half.`,'#ff8060');shipBarsUI();return {hull:b.hull-st.hull,rig:b.rig-st.rig};}
  // S1813 — naval combat (Michael's B on #1064, docs/design/naval-combat.md; A's first part): every hull has the bars and one of
  // four states by what is left of it: intact at 75% or more, light 50–75 (holed sails, no penalty), heavy 25–50 (×0.8), sinking
  // under 25 (×0.6, and she loses 1 hull every 10 s until mended or gone). A black sail is a sloop of 100, a merchantman a cog of
  // 140, each with a rig of 100; your own ship's slowdowns were already these (shipSpeedMul). Every change to a hull goes through
  // damageShip, the named action. A ship a quest needs strikes at 25% and lies to for boarding; any other at 0 founders over 8 s.
  const HULL_STATES=[{k:'sinking',f:0,mul:.6},{k:'heavy',f:.25,mul:.8},{k:'light',f:.5,mul:1},{k:'intact',f:.75,mul:1}];
  const SHIP_LEAK_S=10,SHIP_STRIKE=.25,SHIP_FOUNDER_S=8;
  function hullState(hull,max){const f=max>0?hull/max:0;for(let i=HULL_STATES.length-1;i>0;i--)if(f>=HULL_STATES[i].f)return HULL_STATES[i];return HULL_STATES[0];}
  function shipHullOf(o){if(o===SHIP){const b=shipBars();return {hull:b.hull,hullMax:b.hullMax,rig:b.rig};}return {hull:o.hull,hullMax:o.hullMax,rig:o.rig};}
  function shipStateOf(o){const b=shipHullOf(o);return hullState(b.hull,b.hullMax).k;}
  function otherSpeedMul(o){if(!(o.hullMax>0))return 1;return hullState(o.hull,o.hullMax).mul*(.5+.5*Math.max(0,o.rig)/100);}
  function otherWho(o){return o.id&&String(o.id).startsWith('story:')?String(o.name||'She').replace(/^./,c=>c.toUpperCase()):o.kind==='pirate'?'The black sail':'The merchantman';}
  function shipStrikes(o){return !!o&&(String(o.id||'').startsWith('story:')||o.kind==='pirate'&&((typeof tutWantsPirate==='function'&&tutWantsPirate())||(typeof factionWantsPirate==='function'&&factionWantsPirate())));}
  const HULL_SAY={light:'is holed above the waterline',heavy:'is holed and slowing',sinking:'is low in the water and sinking'};
  function damageShip(o,hull,rig){if(!o)return null;if(o===SHIP)return shipWear(hull,rig);if(o.dead||o.founder!=null||!(o.hullMax>0))return null;
    hull=Math.max(0,Math.round(hull||0));rig=Math.max(0,Math.round(rig||0));const was=hullState(o.hull,o.hullMax),h0=o.hull,r0=o.rig;
    const floor=shipStrikes(o)?Math.ceil(o.hullMax*SHIP_STRIKE):0;o.hull=Math.max(Math.min(floor,h0),h0-hull);o.rig=Math.max(0,r0-rig);
    if(floor&&o.hull<=floor&&!o.struck){o.struck=true;o.speed=0;o.ramming=0;showMsg(`${otherWho(o)} lies to, low in the water. Her deck is yours to take.`,'#e8d8a0');}
    else if(o.hull<=0){o.founder=SHIP_FOUNDER_S;o.speed=0;o.ramming=0;showMsg(`${otherWho(o)} founders.`,'#ff8060');}
    else{const now=hullState(o.hull,o.hullMax);if(now!==was&&HULL_SAY[now.k])showMsg(`${otherWho(o)} ${HULL_SAY[now.k]}.`,'#ffb060');}
    return {hull:h0-o.hull,rig:r0-o.rig};}
  // S1824 — the page's merchantmen: "Merchantmen carry nothing and flee at heavy." A merchantman (not a quest's ship) whose hull falls
  // to heavy (under half) turns from whom she would meet (targetOf) and runs at the best her holes allow (×0.8 heavy, ×0.6 sinking), and
  // keeps running until she is out of sight: mended or not, she does not come back. A merchantman never carried arms, so she has none to drop.
  function merchantFlees(o){if(!o||o.kind==='pirate'||String(o.id||'').startsWith('story:')||o.struck||o.founder!=null||o.boarded)return false;if(o.fleeing)return true;
    if(!(o.hullMax>0)||o.hull/o.hullMax>=.5)return false;o.fleeing=true;o.wp=null;showMsg(`${otherWho(o)} crowds on sail and runs.`,'#e8d8a0');return true;}
  // S1827 — the page's piracy (#1064 B): "A hit on a merchantman is piracy. Her crew are witnesses to the crime system, her nation's
  // bounty applies as for a witnessed theft, and she flees." A bolt, a ball, grape on her deck, or your bow rammed into her: the first
  // such hit on a merchantman (not a quest's ship) is booked once for that ship, as a seen theft of nothing (CRIME_PTS.theft: favour −2,
  // debt 2, a fine of 50) at the nearest town of her nation, the nation of the water where she is struck,
  // within two cells (any town there if none of hers is).
  // She runs at once, whatever her hull. Her crew are always aboard to see it. The booking is the named action `piracy`; it returns the line
  // to show, shown after the strike's own so it is the one read.
  const PIRACY_TOWNS=['port','city','town','village'];
  function shipNoun(o){return o.kind==='pirate'?'black sail':o.kind==='merchant'?'merchantman':String(o.name||'ship');}
  function merchantOf(o){return !!o&&o.kind==='merchant'&&!String(o.id||'').startsWith('story:');}
  function piracyTown(o){const nat=o.nation||nationAt(o.x,o.z),[ci,cj]=cellOf(o.x,o.z);let best=null,bd=1e9,any=null,ad=1e9;
    for(let i=ci-2;i<=ci+2;i++)for(let j=cj-2;j<=cj+2;j++){const c=getCell(i,j);if(!c||!c.sites)continue;const n=nationKeyOf(i,j);
      for(const t of c.sites){if(!PIRACY_TOWNS.includes(t.kind))continue;const d=Math.hypot(t.x-o.x,t.z-o.z);if(n===nat&&d<bd){bd=d;best=t;}if(d<ad){ad=d;any=t;}}}
    return best||any;}
  function piracy(o){if(!merchantOf(o)||o.pirated||o.founder!=null||o.dead)return null;o.pirated=true;o.fleeing=true;o.wp=null;
    const site=piracyTown(o);(worldState.crimes||(worldState.crimes=[])).push({kind:'piracy',site:site?site.id:null,house:null,day:dayNow(),min:absMin()});
    if(site)bookCrime(site,'theft',0);
    if(typeof addLog==='function')addLog('👁',`Fired on a merchantman${site?' of '+site.name+'; '+site.name+' will not forget it':''}.`);
    return `Her crew saw you fire on her. ${site?site.name+' will not forget it.':'They will not forget it.'} The merchantman crowds on sail and runs.`;}
  // a ship lying to or foundering steers nothing; a foundering one settles 3 m and lists over 8 s, then she is gone, her living crew
  // and her chest with her (the wreck to dive is naval combat's fourth session); you, on her deck, are left in the water
  function otherDown(o,dt){if(o.founder==null&&!o.struck)return false;o.speed=0;o.ramming=0;placeOther(o);
    if(o.founder!=null){o.founder-=dt;const u=Math.min(1,1-o.founder/SHIP_FOUNDER_S);o.mesh.position.y-=u*3;o.mesh.rotation.z=u*.35;
      if(o.founder<=0){o.dead=true;sinkWreck(o);despawnOtherShip(o);}}
    return true;}
  // S1823 — naval combat's wreck (B's last session, its first half; the page: "A ship that reaches 0 hull founders over 8 s. Her chest
  // becomes one of spawnWreck's wrecks at her depth, keyed by her id, and her crates are lost."). When a foundering ship is gone, her
  // wreck is recorded where she went down (worldState.sunkShips, the world's row, on the S242 list; the last 24 kept), keyed `sunk:<id>`,
  // with her chest: the chest you had opened on her deck as it stands, or, never boarded, the one boarding her would have rolled (the same
  // stream, `<id>:chest`, and the same tier), less every crate. Within 250 m of you it is laid on the bed (sunkWrecksTick, once a second),
  // a broken hull and a sea chest as the scatter's wrecks are, and the chest's items are the record's own, so what you take stays taken.
  const SUNK_MAX=24,SUNK_NEAR=250;const SUNK_LAID=new Map();let _sunkT=0;
  function sunkList(){return Array.isArray(worldState.sunkShips)?worldState.sunkShips:(worldState.sunkShips=[]);}
  function sinkWreck(o){if(!o||!o.id||String(o.id).startsWith('story:'))return null;const L=sunkList(),key='sunk:'+o.id;if(L.some(w=>w.key===key))return null;
    let items;if(o.chest&&Array.isArray(o.chest.items))items=o.chest.items.slice();
    else{items=(typeof rollContainerLoot==='function'?rollContainerLoot('chest',o.kind==='pirate'?1.8:1.2,null,1,`${o.id}:chest`,worldTierAt(o.x,o.z)):[])||[];if(!items.length)items.push({name:o.kind==='pirate'?'Pirate Gold':'Sea-worn Coins',ico:'🪙',type:'misc',weight:.5,sellMult:1,buyPrice:o.kind==='pirate'?120:60});}
    items=items.filter(it=>it&&it.type!=='cargo').map(it=>Object.assign({},it,{qty:it.qty==null?1:it.qty}));
    const w={key,x:+o.x.toFixed(2),z:+o.z.toFixed(2),yaw:+(o.yaw||0).toFixed(3),kind:o.kind,items};L.push(w);while(L.length>SUNK_MAX){const old=L.shift();sunkUnlay(old.key);}
    if(typeof addLog==='function')addLog('⚓',`${otherWho(o)} went down. Her wreck lies on the bed where she sank.`);return w;}
  function sunkLay(w){if(SUNK_LAID.has(w.key)||typeof THREE==='undefined'||!sc)return;const y=worldH(w.x,w.z);if(y>SEA_Y-1)return;
    const m=new THREE.Mesh(wreckGeo(pRng(pHash('sunk|'+w.key))),VC_MAT);m.position.set(w.x,y,w.z);m.rotation.y=w.yaw;sc.add(m);
    const cx=w.x+Math.cos(w.yaw)*2.2,cz=w.z+Math.sin(w.yaw)*2.2,chest=new THREE.Group();chest.position.set(cx,worldH(cx,cz),cz);chest.rotation.set(.08,w.yaw+2.2,-.06);const {lid}=buildChestShell(chest,1.8,0x5a3a1c);sc.add(chest);
    const c={id:w.key,x:cx,z:cz,y:chest.position.y+.3,name:w.kind==='pirate'?"Captain's Chest":'Sea Chest',displayName:w.kind==='pirate'?"Captain's Chest":'Sea Chest',items:w.items,zone:'world',kind:'chest',g:chest,lid,opened:!w.items.length,sunk:w.key};
    if(typeof ZONE_CORPSES!=='undefined')ZONE_CORPSES.push(c);SUNK_LAID.set(w.key,{m,chest,c});}
  function sunkUnlay(key){const L=SUNK_LAID.get(key);if(!L)return;sc.remove(L.m);sc.remove(L.chest);if(L.m.geometry)L.m.geometry.dispose();
    if(typeof ZONE_CORPSES!=='undefined'){const i=ZONE_CORPSES.indexOf(L.c);if(i>=0)ZONE_CORPSES.splice(i,1);}SUNK_LAID.delete(key);}
  function sunkWrecksTick(dt,force){_sunkT-=dt;if(_sunkT>0&&!force)return;_sunkT=1;const L=sunkList(),keep=new Set();
    if(activeZoneId==='world'&&!(typeof isInterior==='function'&&isInterior()))for(const w of L){if(Math.hypot(w.x-px,w.z-pz)<SUNK_NEAR){keep.add(w.key);const Ld=SUNK_LAID.get(w.key);if(Ld&&Ld.c.items!==w.items)sunkUnlay(w.key); /* a save loaded since */sunkLay(w);}}
    for(const k of [...SUNK_LAID.keys()])if(!keep.has(k))sunkUnlay(k);}
  // once a frame: a hull in the sinking state loses 1 every 10 s; yours while you are aboard her, down to waterlogged (never sunk by
  // the leak alone: the sink is still a hull lost at 0), until a shipwright or the carpenter lifts her over a quarter
  function tickShipLeaks(dt){
    for(const o of OTHER){if(o.dead||o.struck||o.founder!=null||!(o.hullMax>0)||hullState(o.hull,o.hullMax).k!=='sinking'){o._leak=0;continue;}
      o._leak=(o._leak||0)+dt;while(o._leak>=SHIP_LEAK_S&&o.founder==null){o._leak-=SHIP_LEAK_S;damageShip(o,1,0);}}
    if(!SHIP.mesh||!worldState.ship||!(SHIP.sailing||onDeck())){SHIP._leak=0;return;}const b=shipBars();
    if(b.hull<=0||hullState(b.hull,b.hullMax).k!=='sinking'){SHIP._leak=0;SHIP._leakSaid=false;return;}
    if(!SHIP._leakSaid){SHIP._leakSaid=true;showMsg(`The ${SHIP.name} is taking water: a hull point every ten seconds until she is mended.`,'#ff8060');}
    SHIP._leak=(SHIP._leak||0)+dt;if(SHIP._leak>=SHIP_LEAK_S){SHIP._leak-=SHIP_LEAK_S;shipWear(1,0);}}
  // S412 — the sea's state where she is, 0 calm, 1 moderate, 2 rough, 3 storm: the weather (clear and fog 0; overcast, rain and
  // snow 1; a storm 3) plus one in open water, at most 3. Open water is the sea's own floor (the bed blends to −8 at a full
  // sea cell, so the page's "below −8" is never met; −7.9 here) with no shore within 150 units. Read once a second.
  const SEA_WORD=['calm','moderate','rough','storm'];
  // S553 — the oilskin's hint (Michael's B on #148): at sea in rain or storm, the sea line says the next shift of weather. It
  // is rolled when first shown (WX.ahead) and the next shift takes it, so the hint never lies; with no hint shown the weather
  // is rolled when it comes, as before
  const AHEAD_WORD={clear:'clearing',overcast:'clouding over',rain:'rain',storm:'a storm',fog:'fog',snow:'snow',blizzard:'a blizzard',heavyrain:'heavy rain'};
  // S1743 — the Weaver's shuttle at her bow, with the navigator at his station: the sea line also points to the nearest wreck whose sea
  // chest you have not opened (worldState.stats.wrecks, the character's, by the wreck's chunk), in any weather. Without him it does nothing
  const SHUTTLE_W={t:0,w:null};
  function wreckVisit(key){if(!key)return false;const st=worldState.stats||(worldState.stats={}),W=st.wrecks||(st.wrecks={});if(W[key])return false;W[key]=1;SHUTTLE_W.t=0;return true;}
  function shuttleWreck(){if(shipHead()!=='shuttle'||!navAboard())return null;const t=performance.now();if(SHUTTLE_W.t&&t-SHUTTLE_W.t<1000)return SHUTTLE_W.w;SHUTTLE_W.t=t;
    const V=(worldState.stats&&worldState.stats.wrecks)||{};let best=null,bd=Infinity;
    for(const w of seaWrecks()){if(V[w.key])continue;const d=(w.x-SHIP.x)**2+(w.z-SHIP.z)**2;if(d<bd){bd=d;best=w;}}
    return SHUTTLE_W.w=best;}
  function shuttleHint(){const w=shuttleWreck();if(!w)return '';const d=Math.hypot(w.x-SHIP.x,w.z-SHIP.z),r=d<200?Math.round(d/10)*10:Math.round(d/50)*50;
    return ` · a wreck ${r} m ${compassWord(w.x-SHIP.x,w.z-SHIP.z)}`;}
  function seaHint(){return seaWxHint()+shuttleHint();}
  function seaWxHint(){if(!navAboard()&&(typeof cloakOn!=='function'||!cloakOn('oilskin'))||(WX.type!=='rain'&&WX.type!=='storm'))return '';if(!WX.ahead)WX.ahead=pickWeather();
    return WX.ahead===wxName(WX.type,WX.heavy>.5)?'':` · ${AHEAD_WORD[WX.ahead]||WX.ahead} ahead`;}
  function weatherSea(){const t=(WX.next!==WX.type&&WX.k>=.5)?WX.next:WX.type;return t==='storm'?3:(t==='clear'||t==='fog')?0:1;}
  function openWater(x,z){if(worldH(x,z)>-7.9)return false;for(let k=0;k<12;k++){const a=k/12*Math.PI*2;for(const r of [50,100,150])if(worldH(x+Math.cos(a)*r,z+Math.sin(a)*r)>SEA_Y-1.4)return false;}return true;}
  function seaState(x,z){if(x==null){x=SHIP.x;z=SHIP.z;}return Math.min(3,weatherSea()+(openWater(x,z)?1:0));}
  // under sail in a rough sea she loses 1 hull and 1 rig a minute; in a storm with W held 1 hull every 6 s and 1 rig every 4 s,
  // half that with no key held while she still makes way, nothing hove to (under half a knot)
  function tickSeaWear(dt,fwd){
    const st=SHIP.sea||0,v=Math.abs(SHIP.speed);let h=0,r=0;
    if(st>=3&&v>.5){const m=fwd>0?1:.5;h=dt/6*m;r=dt/4*m;}else if(st===2&&v>.5){h=dt/60;r=dt/60;}
    if(typeof bellAboard==='function'&&bellAboard()){h*=.5;r*=.5;if(st>=3&&v>.5&&WX.type==='storm')bellStorm();} /* S778 — the Drowned Bell: half the sea's wear; S794 — its line, the first storm */
    else if(st>=3&&shipHead()==='stone'){h*=HEAD_STONE_K;r*=HEAD_STONE_K;} /* S1734 — the gate stone: storm wear ×0.8, never with the Bell */
    if(!h&&!r)return;SHIP._wh=(SHIP._wh||0)+h;SHIP._wr=(SHIP._wr||0)+r;const H=Math.floor(SHIP._wh),R=Math.floor(SHIP._wr);
    if(H||R){SHIP._wh-=H;SHIP._wr-=R;shipWear(H,R);}}
  // S413 — foundering: any hull lost while she is waterlogged sinks her. The wreck lies where she went down (on the map); any
  // shipwright raises her, class and tiers, for 30% of what they cost, and she lies at his quay three game days later. The hold
  // came up with her until S639 (it is lost now, below); the stash is the safehouse's, untouched.
  function shipCostAll(){const st=shipCfg();const cls=st.cls||'sloop';let c=(SHIP_CLASSES[cls]||SHIP_CLASSES.sloop).worth;
    for(let i=1;i<=(st.sails||0);i++)c+=SAIL_TIERS[i];for(let i=1;i<=(st.cargo||0);i++)c+=CARGO_TIERS[i];for(const k of (Array.isArray(st.fit)?st.fit:[]))if(SHIP_FITS[k])c+=SHIP_FITS[k].price; /* S1726 — her fittings are raised with her */return c;}
  function shipRaiseCost(){return Math.round(shipCostAll()*.3);}
  // S639 — Michael's 6 Oct note and B on #192 (the page's shared ground): what she carries is *all lost if the ship is
  // destroyed*. The hold goes down with her, horse and all, and a raised ship comes up empty (Session 413 kept it).
  function shipSink(){const st=shipCfg();const aboard=SHIP.sailing||onDeck();
    const lost=Object.keys(st.hold||{}).reduce((a,k)=>a+(CARGO_GOODS[k]&&st.hold[k]>0?st.hold[k]:0),0);st.hold={}; /* S1820 — crates only: her bolts are not crates */
    const crewSaid=crewSink(); /* S1737 */st.sunk={x:SHIP.x,z:SHIP.z};st.hull=0;Object.assign(st,{x:SHIP.x,z:SHIP.z,yaw:SHIP.yaw});SHIP.sailing=false;SHIP.speed=0;
    for(const e of BOARDERS){if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const j=ZONES.world.enemies.indexOf(e);if(j>=0)ZONES.world.enemies.splice(j,1);}BOARDERS.length=0;
    if(SHIP.mesh){sc.remove(SHIP.mesh);SHIP.mesh=null;}if(SHIP.plat){const j=ZONES.world.platforms.indexOf(SHIP.plat);if(j>=0)ZONES.world.platforms.splice(j,1);SHIP.plat=null;}
    if(aboard){jumpY=SWIM_Y;velY=0;onGround=false;}splash(true);
    showMsg(`The ${SHIP.name} goes down. Any shipwright can raise her.${crewSaid?' '+crewSaid:''}`,'#ff6060');if(typeof addLog==='function')addLog('⛵',lost?`The ${SHIP.name} sank with ${lost} ${lost===1?'crate':'crates'} in her hold.`:`The ${SHIP.name} sank.`);shipBarsUI();}
  // once a second: a raised ship due at her quay is put there
  function tickShipRaise(){const st=worldState.ship;if(!st||!st.sunk||!st.raise||SHIP.mesh)return;if((worldState.gameTimeAbsMinutes||0)<st.raise.due)return;
    const site=siteAnywhere(st.raise.site);if(!site)return;const sd=shoreDir(site)||{dx:1,dz:0};const q=site.quayStart||{x:site.x+sd.dx*site.pad,z:site.z+sd.dz*site.pad};
    delete st.sunk;delete st.raise;st.hull=shipClass().hull;st.rig=100;spawnShip(q.x+sd.dx*22,q.z+sd.dz*22+(sd.dx?12:0),seawardYaw(sd));
    if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} is raised and lies at ${site.name}.`);}
  function shipMendCost(){const b=shipBars();const h=b.hullMax-b.hull,r=100-b.rig;return {hull:h,rig:r,gold:h*4+r*3,mins:Math.round((h+r)*3)};}
  const SHIPBAR={ui:null};
  // S637 — the log (Michael's B on #192, the page's shared ground): a half-dial of 0 to 30 knots on the helm panel, parchment and
  // ink, one knot one unit a second; the needle at her speed, a brass tick at the most she can make now (top speed × hull and
  // rig), the number under it, and a notch on the rim at each hull's top under full sails, so the dial is also the ladder
  const LOG_MAX=30,LOG_CX=67,LOG_CY=62,LOG_R=50;
  function logPt(v,r){const a=Math.PI*(1-Math.max(0,Math.min(LOG_MAX,v))/LOG_MAX);return [+(LOG_CX+Math.cos(a)*r).toFixed(2),+(LOG_CY-Math.sin(a)*r).toFixed(2)];}
  function shipLogSVG(){const ink='#2a2014';let t='';
    for(let k=0;k<=LOG_MAX;k+=5){const [x0,y0]=logPt(k,LOG_R-(k%10?5:8)),[x1,y1]=logPt(k,LOG_R);t+=`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${ink}" stroke-width="${k%10?1:1.6}"/>`;
      if(k%10===0){const [lx,ly]=logPt(k,LOG_R-16);t+=`<text x="${lx+(k===0?3:k===LOG_MAX?-3:0)}" y="${ly+(k%LOG_MAX?3:-3)}" text-anchor="middle" font-size="9" fill="${ink}">${k}</text>`;}}
    const full=Object.keys(SHIP_CLASSES).map(k=>SHIP_CLASSES[k].speed*(1+(SAIL_TIERS.length-1)*SAIL_STEP));
    for(const v of full){const [x0,y0]=logPt(v,LOG_R+5),[x1,y1]=logPt(v,LOG_R+10);t+=`<line class="log-notch" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#d8c8a0" stroke-width="1.6"/>`;}
    const [ax,ay]=logPt(0,LOG_R),[bx,by]=logPt(LOG_MAX,LOG_R);
    return `<svg id="shipbars-log" width="134" height="80" viewBox="0 0 134 80" style="display:block;margin:0 auto 2px;font-family:Georgia,serif">`+
      `<path d="M${ax-4} ${ay} A${LOG_R+4} ${LOG_R+4} 0 0 1 ${bx+4} ${by} Z" fill="#e8dcb8" stroke="#a08a5a"/>`+t+
      `<line id="shipbars-max" x1="${LOG_CX}" y1="${LOG_CY}" x2="${LOG_CX}" y2="${LOG_CY}" stroke="#b08a30" stroke-width="3"/>`+
      `<line id="shipbars-needle" x1="${LOG_CX}" y1="${LOG_CY}" x2="${LOG_CX}" y2="${LOG_CY}" stroke="#8a2a1a" stroke-width="1.8" stroke-linecap="round"/>`+
      `<circle cx="${LOG_CX}" cy="${LOG_CY}" r="3" fill="${ink}"/>`+
      `<text id="shipbars-kn" x="${LOG_CX}" y="77" text-anchor="middle" font-size="11" fill="#e8dcc0">0.0 kn</text></svg>`;}
  // every frame while the panel shows: her speed and her most, written only when the tenth changes
  function shipLogUI(){const v=SHIP.sailing?Math.abs(SHIP.speed||0):0,mx=shipSpeedNow();const key=v.toFixed(1)+'|'+mx.toFixed(1);if(key===SHIPBAR.logKey)return;SHIPBAR.logKey=key;
    const q=id=>document.getElementById(id);const n=q('shipbars-needle'),m=q('shipbars-max'),k=q('shipbars-kn');if(!n||!m||!k)return;
    const [nx,ny]=logPt(v,LOG_R-6);n.setAttribute('x2',nx);n.setAttribute('y2',ny);
    const [m0x,m0y]=logPt(mx,LOG_R-9),[m1x,m1y]=logPt(mx,LOG_R);m.setAttribute('x1',m0x);m.setAttribute('y1',m0y);m.setAttribute('x2',m1x);m.setAttribute('y2',m1y);
    k.textContent=`${v.toFixed(1)} kn`;SHIPBAR.log={v:+v.toFixed(1),max:+mx.toFixed(1),needle:[nx,ny]};}
  function shipBarsUI(){
    if(typeof document==='undefined'||!document.body)return;
    let el=SHIPBAR.ui;if(!el){el=document.createElement('div');if(!el.style)return;el.id='shipbars';el.style.cssText='position:fixed;right:14px;bottom:150px;width:150px;padding:5px 8px;background:rgba(40,30,18,.82);border:1px solid #a08a5a;border-radius:4px;color:#e8dcc0;font:11px Georgia,serif;display:none;z-index:50';
      el.innerHTML='<div id="shipbars-name" style="margin-bottom:3px"></div>'+shipLogSVG()+'<div id="shipbars-sea" style="margin-bottom:3px;color:#c8b890"></div><div>Hull <span id="shipbars-hull"></span></div><div style="height:5px;background:#2a2014;margin:1px 0 3px"><div id="shipbars-hf" style="height:100%;background:#b08a4a"></div></div><div>Rig <span id="shipbars-rig"></span></div><div style="height:5px;background:#2a2014;margin-top:1px"><div id="shipbars-rf" style="height:100%;background:#d8c8a0"></div></div><div id="shipbars-bal" style="margin-top:3px;color:#e8c890;display:none"></div>';document.body.appendChild(el);SHIPBAR.ui=el;}
    const show=!!(worldState.ship&&SHIP.mesh&&activeZoneId==='world'&&!(typeof isInterior==='function'&&isInterior())&&(SHIP.sailing||onDeck()));
    if(show)shipLogUI();
    const b=show?shipBars():null,hint=show?seaHint():'',bal=show?[gunsHud(),ballistaHud()].filter(Boolean).join('\n'):'',key=show?`${SHIP.name}|${b.hull}|${b.hullMax}|${b.rig}|${SHIP.sea||0}|${hint}|${bal}`:'';if(key===SHIPBAR.key)return;SHIPBAR.key=key;el.style.display=show?'block':'none';if(!show)return;
    const q=id=>document.getElementById(id);q('shipbars-name').textContent=`The ${SHIP.name}`;q('shipbars-sea').textContent=`Sea: ${SEA_WORD[SHIP.sea||0]}${hint}`;q('shipbars-hull').textContent=`${b.hull} / ${b.hullMax}`;q('shipbars-rig').textContent=`${b.rig} / 100`;
    q('shipbars-hf').style.width=(b.hull/b.hullMax*100)+'%';q('shipbars-hf').style.background=b.hull/b.hullMax<.25?'#c85040':'#b08a4a';q('shipbars-rf').style.width=b.rig+'%';{const B=q('shipbars-bal');if(B){B.style.whiteSpace='pre-line';B.textContent=bal;B.style.display=bal?'block':'none';}} /* S1820 — the ballista's line */
  }
  // S638 — the boarding nets (Michael's B on #192, the page's shared ground; his 6 Oct note: *a netting or ladder on either
  // side to walk up, or "press E to climb" when looking at the mesh — not a general "board" option always available in
  // range*). Every hull hangs a net on each side amidships, from below the waterline to over the rail, 2.6 long. E climbs
  // only with the crosshair on a net (the eye's ray meets its box in the hull's own frame, within 5 of the eye: a ship moored
  // off a quay lies with her nearest net up to 4.5 from its edge, Beaurouge's, and is still boarded from it), or while swimming
  // against it. The climb takes 0.8 s
  // and sets you at the rail above the net. A black sail's or a merchantman's net boards her when you reach her rail, and
  // landing on her deck any other way (a jump from your rail, lying alongside) boards her the moment you land.
  const NET_HALF=1.3,NET_REACH=5,NET_CLIMB=.8;
  const _netInv=new THREE.Matrix4(),_netO=new THREE.Vector3(),_netD=new THREE.Vector3(),_netR=new THREE.Ray(),_netB=new THREE.Box3(),_netH=new THREE.Vector3(),_netA=new THREE.Vector3(),_netC=new THREE.Vector3();
  function netBox(W,side){const hw=W/2;return _netB.set(_netA.set(side>0?hw-.25:-hw-.35,-.9,-NET_HALF),_netC.set(side>0?hw+.35:-hw+.25,SHIP_DECK+.55,NET_HALF));}
  // the side (1 or −1, the hull's +x or −x) whose net the crosshair is on, or that you swim against; 0 for none
  function shipNetSide(mesh,W){if(!mesh)return 0;mesh.updateMatrixWorld(true);_netInv.copy(mesh.matrixWorld).invert();
    if(isSwimming()){_netO.set(px,SEA_Y,pz).applyMatrix4(_netInv);for(const sd of [1,-1]){const off=sd*_netO.x-W/2;if(Math.abs(_netO.z)<=NET_HALF+.3&&off>-.4&&off<1.1)return sd;}}
    if(typeof CAM==='undefined'||!CAM)return 0;CAM.updateMatrixWorld();CAM.getWorldDirection(_netD);_netO.copy(CAM.position).applyMatrix4(_netInv);_netD.transformDirection(_netInv);_netR.set(_netO,_netD);
    const tpb=(typeof thirdPerson!=='undefined'&&thirdPerson&&typeof TP!=='undefined')?TP.dist:0;let best=0,bd=NET_REACH+tpb;
    for(const sd of [1,-1])if(_netR.intersectBox(netBox(W,sd),_netH)){const d=_netO.distanceTo(_netH);if(d<=bd){bd=d;best=sd;}}return best;}
  // the rail above a side's net, in the world
  function netRail(mesh,W,side){mesh.updateMatrixWorld(true);const v=new THREE.Vector3(side*(W/2-.8),SHIP_DECK,0).applyMatrix4(mesh.matrixWorld);return {x:v.x,z:v.z};}
  let CLIMB=null;
  function startClimb(mesh,W,side,other){mesh.updateMatrixWorld(true);_netInv.copy(mesh.matrixWorld).invert();const lz=_netO.set(px,0,pz).applyMatrix4(_netInv).z;
    CLIMB={t:0,mesh,W,side,other:other||null,x0:px,z0:pz,y0:jumpY,lz:Math.max(-NET_HALF+.3,Math.min(NET_HALF-.3,lz))};return true;}
  function climbing(){return !!CLIMB;}
  // S1588 — Michael's A on #882: the rail. Every deck has a rail 1.0 m high (scale-numbers-build.md, Places) and a plain jump
  // rises 0.84 m, so no step and no jump takes you over it: a step that crosses a deck's outline while your feet are under the
  // rail's top is refused, off a deck (yours, a black sail's, a merchantman's) and onto one from a quay or a deck alongside.
  // Her side holds a swimmer too (the deck's height would otherwise lift one straight aboard): a net is the way up, as before.
  // Over the side is a choice: E at either net, from her deck (overSide).
  const RAIL_H=1.0;
  function inDeck(p,x,z){return !!p&&x>p.x0&&x<p.x1&&z>p.z0&&z<p.z1&&(!p.inside||p.inside(x,z));}
  function deckShips(){const a=[];if(SHIP.mesh&&SHIP.plat)a.push({mesh:SHIP.mesh,W:SHIP.W,plat:SHIP.plat,other:null});
    for(const o of OTHER)if(!o.dead&&o.mesh&&o.plat)a.push({mesh:o.mesh,W:o.W,plat:o.plat,other:o});return a;}
  function shipRailHolds(x0,z0,x1,z1){if(activeZoneId!=='world'||climbing())return false;
    for(const s of deckShips()){const a=inDeck(s.plat,x0,z0),b=inDeck(s.plat,x1,z1);if(a===b)continue;
      const lv=a&&s.mesh.userData.castle&&shipUpper(s.mesh)?s.mesh.userData.castle.y-SHIP_DECK+DECK_Y:DECK_Y;if(jumpY<lv+RAIL_H)return true;}
    return false;}
  // the ship whose deck you stand on with her net under the crosshair, within 2.5 m of the rail above it; null for none
  function overSideAt(){if(climbing()||SHIP.sailing||Math.abs(jumpY-DECK_Y)>.6)return null;
    for(const s of deckShips()){if(!inDeck(s.plat,px,pz)||(s.other&&!s.other.boarded))continue;const sd=shipNetSide(s.mesh,s.W);if(!sd)continue;
      const r=netRail(s.mesh,s.W,sd);if(Math.hypot(px-r.x,pz-r.z)<2.5)return {...s,side:sd};}return null;}
  function overSidePrompt(){return overSideAt()?"Press 'E' to go over the side":null;}
  // over the rail at the net and down her side: you are set a metre outboard of the net, level with the rail, and fall to
  // what is there, the sea beside her or the quay she lies alongside
  function overSide(){const s=overSideAt();if(!s)return false;s.mesh.updateMatrixWorld(true);_netInv.copy(s.mesh.matrixWorld).invert();
    const lz=Math.max(-NET_HALF+.3,Math.min(NET_HALF-.3,_netO.set(px,0,pz).applyMatrix4(_netInv).z));
    const v=new THREE.Vector3(s.side*(s.W/2+1.0),SHIP_DECK,lz).applyMatrix4(s.mesh.matrixWorld);
    px=v.x;pz=v.z;jumpY=DECK_Y+.2;velY=0;onGround=false;showMsg('You go over the side.','#c8b880');return true;}
  // S1820 — naval combat's ballista (Michael's B on #1064, docs/design/naval-combat.md, B's fourth systems session): a fitting of 5
  // hold that stands at her bow (350 gold at a yard, or built at her bench at Joinery 50), and its bolts in her hold (hold.bolts, 20
  // to 1 of the hold, 2 gold each at a yard). At the helm the left button looses a bolt at the nearest black sail (or a quest's ship)
  // that bears: within 30° of her bow either way (the page's 60° arc) and 90 m from the bow to her side. The aim is in the steering,
  // so a bolt that bears strikes (ten bolts to a sloop's 100, a minute of fire, as the page counts): it flies at 60 m/s and takes
  // 10 hull through damageShip when it arrives, and it is a use of Bow. One every 6 s, off the clock, never the frame count. A
  // merchantman is not offered a bolt: firing on one is piracy, the page's foes-by-tier session. The fire bolt, the pots and the
  // heavy arrow at a hand are the next session's.
  // S1821 — the fire bolt (the page's table): the right button at the helm sets the ballista to fire bolts and back. A fire bolt is a
  // bolt and a pitch from your bag; it takes 4 hull, and her rig burns 2 a second for 8 s (16 in all), through damageShip. A fire
  // already in her rig is lit again for its full 8 s, never doubled. Her hands douse it after 3 s (Session 1848, lightRig).
  // S1838 — the heavy arrow at a hand (the page's "or a heavy arrow at a hand on Bow's multiplier"; Michael's A on #1120: 20–30, scaled
  // by Bow). When you loose, if the crosshair lies on one of her living hands (a man-sized upright, 0.55 m about him, 1.8 m tall from his
  // feet) and she bears, the bolt flies at him, not her hull. It rolls 20–30 on his own stream (foeRand), times Bow's multiplier (×0.6 at
  // 0, ×1.0 at 50, ×1.4 at 100), times his resistance to piercing, with the challenge's scale as an arrow's: 2–3 bolts to a hand at low
  // Bow, often one at high. His armour is not read, as the answer's numbers are before it. A hit is a use of Bow; a kill drops him on her
  // deck. A fire bolt at a hand lights her rig as at her hull. If he is dead before it lands, the bolt strikes her hull.
  const BALLISTA={arc:Math.PI/6,range:90,reload:6,hull:10,speed:60,per:20,price:2,fireHull:4,burn:2,burnS:8,hand:[20,30],handR:.55,handH:1.8};
  const BOLTS={t:-1e9,fly:[],n:0,geo:null,mat:null,fire:false};
  // S1839 — black sails by the water's tier (Michael's A on #1115; the page's foes by tier): where a black sail comes up at sea, tier 1
  // water (home's coast, Ashen, Bealach, Royale) sends today's sloop; tier 2 a black-sail cutter, 12 m/s and 80 hull (her class's own
  // numbers) with a bow ballista; tier 3 the cutter too, and one sail in five a black galleon with guns (BLACK_GALLEON, the next session).
  // The roll is the sea's own stream, keyed by where you are and the minute (S508). A quest's ship keeps her own hull. Her ballista is
  // the page's: a bolt every 6 s, 10 hull, at your ship when it lies within 30° of her bow and 90 m to your side, worked by a living hand
  // on her deck (S612: a ship looses nothing herself). It reads the clock, never the frame count, and bears only while you are aboard.
  // S1840 — and the black galleon: one sail in five at tier 3, her class's 200 hull and 9.5 m/s, and her guns turned on you (herGuns): six
  // a side of round shot, 6 hull a ball (36 a broadside, the page's count), in the 0.6 s ripple, a side reloading 20 s, firing when your
  // ship lies within 25° of her beam and 150 m side to side, as yours do. Worked by a living hand, as her ballista is; round shot only.
  const BLACK_GALLEON=true;
  const HER_BALLS=[];let HER_VOL=0;
  function blackSailCls(x,z,r){const t=typeof worldTierAt==='function'?worldTierAt(x,z):1;if(t<=1)return 'sloop';
    if(t>=3&&BLACK_GALLEON&&(r?r():Math.random())<.2)return 'galleon';return 'cutter';}
  function herBallista(o){return !!o&&o.kind==='pirate'&&o.cls==='cutter';}
  function herGuns(o){return !!o&&o.kind==='pirate'&&o.cls==='galleon';}
  // the side of hers that bears on your ship, or null
  function herGunsSide(o){if(!SHIP.mesh||!worldState.ship||!(SHIP.sailing||(typeof onDeck==='function'&&onDeck())))return null;const fx=-Math.sin(o.yaw),fz=-Math.cos(o.yaw),rx=-fz,rz=fx;
    const dx=SHIP.x-o.x,dz=SHIP.z-o.z,lat=dx*rx+dz*rz,lon=dx*fx+dz*fz,d=Math.max(0,Math.hypot(dx,dz)-(o.W||7)/2-(SHIP.W||4.4)/2);
    if(d>BROADSIDE.range||Math.abs(Math.atan2(lon,Math.abs(lat)))>BROADSIDE.arc)return null;return lat>=0?'stbd':'port';}
  function tickHerGuns(now){
    for(const o of OTHER){if(!herGuns(o)||o.dead||o.founder!=null||o.struck||o.boarded||!o.mesh)continue;if(!o.gunT)o.gunT={port:now,stbd:now};
      const sd=herGunsSide(o);if(!sd||now-o.gunT[sd]<BROADSIDE.reload||!o.crew.some(e=>!e.dead&&e._ship===o))continue;o.gunT[sd]=now;HER_VOL++;
      const fx=-Math.sin(o.yaw),fz=-Math.cos(o.yaw),s=sd==='stbd'?1:-1;
      for(let i=0;i<BROADSIDE.guns;i++){const along=(i/(BROADSIDE.guns-1)-.5)*o.L*.6,x0=o.x+fx*along+(-fz)*s*o.W/2,z0=o.z+fz*along+fx*s*o.W/2;
        HER_BALLS.push({o,vol:HER_VOL,t0:now+i*BROADSIDE.ripple/(BROADSIDE.guns-1),dur:Math.hypot(SHIP.x-x0,SHIP.z-z0)/BROADSIDE.speed,last:i===BROADSIDE.guns-1});}
      if(typeof sfxNoise==='function')sfxNoise(.35,0,0,.25,160);showMsg('The black galleon runs out her guns.','#ff8060');}
    /* S2161 — the balls landed this tick, taken out, then met in the order they were fired: a volley's last ball, pushed last, ends its line after every earlier one of the tick (walked from the end it was met first, and a hitched frame's line read part of the hull) */
    const landed=[];for(let i=HER_BALLS.length-1;i>=0;i--){if(now<HER_BALLS[i].t0+HER_BALLS[i].dur)continue;landed.unshift(HER_BALLS[i]);HER_BALLS.splice(i,1);}
    for(const f of landed){if(!SHIP.mesh||!worldState.ship)continue;
      const r=damageShip(SHIP,SHOT.round.hull,0);if(r&&!r.sunk){HER_BALLS.t=(HER_BALLS.v===f.vol?HER_BALLS.t:0)+r.hull;HER_BALLS.v=f.vol;}
      if(f.last&&HER_BALLS.v===f.vol&&HER_BALLS.t>0){showMsg(`The black galleon's broadside strikes the ${SHIP.name}. Hull −${HER_BALLS.t}.`,'#ff8060');HER_BALLS.t=0;}}}
  const HER_BOLTS=[];
  function herBallistaBears(o){if(!SHIP.mesh||!worldState.ship||!(SHIP.sailing||(typeof onDeck==='function'&&onDeck())))return false;
    const fx=-Math.sin(o.yaw),fz=-Math.cos(o.yaw),bx=o.x+fx*o.L/2,bz=o.z+fz*o.L/2,dx=SHIP.x-bx,dz=SHIP.z-bz,c=Math.hypot(dx,dz),d=Math.max(0,c-(SHIP.W||4.4)/2);
    return d<=BALLISTA.range&&(c<.01||(dx*fx+dz*fz)/c>=Math.cos(BALLISTA.arc));}
  function tickHerBallistas(){const now=hookClock();tickHerGuns(now);
    for(const o of OTHER){if(!herBallista(o)||o.dead||o.founder!=null||o.struck||o.boarded||!o.mesh)continue;if(o.balT==null)o.balT=now;
      if(now-o.balT<BALLISTA.reload||!o.crew.some(e=>!e.dead&&e._ship===o)||!herBallistaBears(o))continue;o.balT=now;
      const fx=-Math.sin(o.yaw),fz=-Math.cos(o.yaw),x0=o.x+fx*o.L/2,z0=o.z+fz*o.L/2,fly={o,x0,z0,t0:now,dur:Math.hypot(SHIP.x-x0,SHIP.z-z0)/BALLISTA.speed,mesh:null};
      if(typeof THREE!=='undefined'&&typeof sc!=='undefined'&&sc){if(!BOLTS.geo){BOLTS.geo=new THREE.CylinderGeometry(.05,.05,1.4,5);BOLTS.geo.rotateX(Math.PI/2);BOLTS.mat=new THREE.MeshLambertMaterial({color:0x3a2c1c});}
        fly.mesh=new THREE.Mesh(BOLTS.geo,BOLTS.mat);fly.mesh.position.set(x0,DECK_Y+1.2,z0);sc.add(fly.mesh);}
      HER_BOLTS.push(fly);if(typeof sfxNoise==='function')sfxNoise(.12,0,0,.1,380);}
    for(let i=HER_BOLTS.length-1;i>=0;i--){const f=HER_BOLTS[i],u=Math.min(1,(now-f.t0)/Math.max(.05,f.dur));
      if(f.mesh){f.mesh.position.set(f.x0+(SHIP.x-f.x0)*u,DECK_Y+1.2+Math.sin(u*Math.PI)*1.5,f.z0+(SHIP.z-f.z0)*u);f.mesh.lookAt(SHIP.x,DECK_Y+1.2,SHIP.z);}
      if(u<1)continue;if(f.mesh&&f.mesh.parent)f.mesh.parent.remove(f.mesh);HER_BOLTS.splice(i,1);
      if(!SHIP.mesh||!worldState.ship)continue;const r=damageShip(SHIP,BALLISTA.hull,0);
      if(r&&r.hull>0&&!r.sunk)showMsg(`The black sail's bolt strikes the ${SHIP.name}. Hull −${r.hull}.`,'#ff8060');}}
  function boltsAboard(){const h=worldState.ship&&worldState.ship.hold;return h&&h.bolts>0?h.bolts:0;}
  function shipShotWeight(){const h=(worldState.ship&&worldState.ship.hold)||{};let w=0;for(const k of ['bolts',...Object.keys(SHOT)])if(h[k]>0)w+=Math.ceil(h[k]/BALLISTA.per);return w;} /* S1822 — and the guns' shot, 20 to 1 a kind */
  function ballistaWait(){return Math.max(0,BALLISTA.reload-(hookClock()-BOLTS.t));}
  function ballistaBow(){const fx=-Math.sin(SHIP.yaw),fz=-Math.cos(SHIP.yaw);return {x:SHIP.x+fx*SHIP.L/2,z:SHIP.z+fz*SHIP.L/2,fx,fz};}
  function ballistaFoe(o){return !!o&&(o.kind==='pirate'||String(o.id||'').startsWith('story:'));}
  // the ship she bears on now, or null: the nearest in the arc and the range
  function ballistaBears(){if(!SHIP.mesh||!SHIP.sailing||!shipFitted('ballista'))return null;const b=ballistaBow();let best=null,bd=1e9,mer=null,md=1e9; /* S1827 — a merchantman bears only when no foe does */
    for(const o of OTHER){if(o.dead||o.founder!=null||o.struck||!o.mesh)continue;const foe=ballistaFoe(o);if(!foe&&!merchantOf(o))continue;const dx=o.x-b.x,dz=o.z-b.z,c=Math.hypot(dx,dz);
      const d=Math.max(0,c-(o.W||4)/2);if(d>BALLISTA.range||d>=(foe?bd:md))continue;if(c>.01&&(dx*b.fx+dz*b.fz)/c<Math.cos(BALLISTA.arc))continue;if(foe){bd=d;best=o;}else{md=d;mer=o;}}
    return best||mer;}
  // the living hand of hers under the crosshair, or null
  function ballistaHand(o){if(!o||!o.crew)return null;CAM.getWorldDirection(_laDir);const O=CAM.position;let best=null,bd=1e9;
    for(const e of o.crew){if(e.dead||!(e.hp>0))continue;const y=e.mesh?e.mesh.position.y:DECK_Y;_baA.set(e.x,y,e.z);_baB.set(e.x,y+BALLISTA.handH,e.z);
      const d=Math.hypot(e.x-O.x,e.z-O.z);if(d<bd&&_raySegHit(O,_laDir,_baA,_baB,BALLISTA.handR,0,BALLISTA.range+30)){bd=d;best=e;}}return best;}
  // S1844 — Michael's B on #1136: the arrow is scaled by the water's tier as his health is (enemyHpScale: ×1, 1.75, 2.5 at tiers 1–3),
  // read from the tier he was built at, so the answer's counts on #1120 hold in every water: 20–30, 35–53, 50–75, then Bow's multiplier.
  function ballistaHandTierK(e){const t=e&&e.tier!=null?e.tier:(typeof worldTierAt==='function'&&e?worldTierAt(e.x,e.z):1);return enemyHpScale(t);}
  function ballistaHandDmg(e){const r=BALLISTA.hand[0]+Math.floor(foeRand(e)*(BALLISTA.hand[1]-BALLISTA.hand[0]+1)),k=e.resist&&typeof e.resist.pierce==='number'?e.resist.pierce:1;
    return challengeDealt(Math.max(1,Math.round(r*ballistaHandTierK(e)*skillMult('bow')*k)));}
  // why the ballista cannot loose now, or null
  function ballistaWhy(){if(!shipFitted('ballista'))return 'She has no ballista.';if(!SHIP.sailing)return 'The ballista is worked from the helm.';
    if(!boltsAboard())return 'No bolts in her hold.';if(BOLTS.fire&&typeof pitchCount==='function'&&pitchCount()<1)return 'A fire bolt needs a pitch, and you have none.';if(ballistaWait()>0)return 'The ballista is still winding.';if(!ballistaBears())return 'Nothing bears: bring her bow onto the black sail.';return null;}
  // the named action: loose a bolt at the ship that bears; it strikes when it arrives
  function fireBallista(){const why=ballistaWhy();if(why)return why;const o=ballistaBears(),b=ballistaBow(),h=worldState.ship.hold;
    h.bolts--;if(h.bolts<=0)delete h.bolts;BOLTS.t=hookClock();BOLTS.n++;const fire=BOLTS.fire;if(fire)bagTake(b=>b.name===SURV_ITEMS.pitch.name,1);
    const hand=ballistaHand(o),d=hand?Math.hypot(hand.x-b.x,hand.z-b.z):Math.hypot(o.x-b.x,o.z-b.z),fly={o,hand,x0:b.x,z0:b.z,t0:BOLTS.t,dur:d/BALLISTA.speed,mesh:null,fire};
    if(typeof THREE!=='undefined'&&typeof sc!=='undefined'&&sc){if(!BOLTS.geo){BOLTS.geo=new THREE.CylinderGeometry(.05,.05,1.4,5);BOLTS.geo.rotateX(Math.PI/2);BOLTS.mat=new THREE.MeshLambertMaterial({color:0x3a2c1c});}
      fly.mesh=new THREE.Mesh(BOLTS.geo,BOLTS.mat);fly.mesh.position.set(b.x,DECK_Y+1.2,b.z);sc.add(fly.mesh);}
    BOLTS.fly.push(fly);if(typeof sfxNoise==='function')sfxNoise(.12,0,0,.1,420);shipBarsUI();return true;}
  // once a frame: the bolts in flight; one arrives and strikes her, wherever she has sailed to in the meantime
  function tickBolts(dt){tickHerBallistas();if(!BOLTS.fly.length)return;const now=hookClock();
    for(let i=BOLTS.fly.length-1;i>=0;i--){const f=BOLTS.fly[i],o=f.o,u=Math.min(1,(now-f.t0)/Math.max(.05,f.dur));
      const T=f.hand&&!f.hand.dead?f.hand:o;if(f.mesh){f.mesh.position.set(f.x0+(T.x-f.x0)*u,DECK_Y+1.2+Math.sin(u*Math.PI)*1.5,f.z0+(T.z-f.z0)*u);f.mesh.lookAt(T.x,DECK_Y+1.2,T.z);}
      if(u<1)continue;if(f.mesh){sc.remove(f.mesh);f.mesh=null;}BOLTS.fly.splice(i,1);
      if(o.dead||o.founder!=null||!OTHER.includes(o))continue;
      if(f.hand&&!f.hand.dead&&f.hand.hp>0){const e=f.hand,n=ballistaHandDmg(e),who=shipNoun(o); /* S1838 — the heavy arrow at a hand */
        if(typeof skillUse==='function')skillUse('bow',1,e);e.hp=Math.max(0,e.hp-n);e.alert=true;if(e.hpFg){e.hpFg.scale.x=e.hp/e.maxHp;e.hpFg.position.x=(e.hp/e.maxHp-1)*.275;}
        const dead=e.hp<=0;if(dead&&typeof killZoneEnemy==='function')killZoneEnemy(e,sc);
        showMsg(dead?`Your bolt takes one of the ${who}'s hands.${f.fire?' Her rig is alight.':''}`:`Your bolt strikes one of the ${who}'s hands: −${n}.${f.fire?' Her rig is alight.':''}`,'#e8c890');
        const pm=piracy(o);if(pm)showMsgLong(pm,'#e88a8a');if(f.fire&&o.founder==null&&!o.dead){lightRig(o,BALLISTA.burn,BALLISTA.burnS);}continue;}
      const r=damageShip(o,f.fire?BALLISTA.fireHull:BALLISTA.hull,0),who=shipNoun(o);
      if(r&&r.hull>0){if(typeof skillUse==='function')skillUse('bow',1,'ballista:'+(o.id||'ship'));if(!o.founder&&!o.struck)showMsg(f.fire?`Your fire bolt strikes the ${who}. Hull −${r.hull}, and her rig is alight.`:`Your bolt strikes the ${who}. Hull −${r.hull}.`,'#e8c890');}
      if(r){const pm=piracy(o);if(pm)showMsgLong(pm,'#e88a8a');}
      if(f.fire&&o.founder==null&&!o.dead){lightRig(o,BALLISTA.burn,BALLISTA.burnS);}}}
  // S1848 — her hands douse it (Michael's A on #1143): a living hand on her deck puts the fire in her rig out 3 s after it catches,
  // unless one of her hands is hit in that time (a heavy arrow, the pot's fire, grape, your own blade or bow: any loss of her crew's
  // health), which starts the 3 s again. With none of her hands on her deck the fire runs its full time. So a fire bolt takes 6 rig,
  // or 16 with her hands down; a pot 9, or 18. (A merchantman's two hands douse hers the same way since Session 1935, below.)
  const RIG_DOUSE=3;
  // the named action: her rig catches (or is lit again: a fire already there runs its new time, never doubled), and her hands' 3 s start
  function lightRig(o,rate,secs){if(!o||o.dead||o.founder!=null)return false;o.burn=secs;o.burnRate=rate;o._burnAcc=o._burnAcc||0;o.douse=RIG_DOUSE;o._crewHp=null;return true;}
  function rigHands(o){return (o.crew||[]).filter(e=>!e.dead&&e.hp>0&&e._ship===o);}
  function crewHp(o){let h=0;for(const e of (o.crew||[]))h+=Math.max(0,e.hp||0);return h;}
  // once a frame: a rig alight loses its rate a second until its time is out, her hands douse it, or she founders
  function tickShipFires(dt){for(const o of OTHER){if(!(o.burn>0))continue;if(o.dead||o.founder!=null){o.burn=0;continue;}
    const hp=crewHp(o);if(o._crewHp!=null&&hp<o._crewHp-1e-9)o.douse=RIG_DOUSE;o._crewHp=hp;
    const dousing=o.douse!=null&&rigHands(o).length>0;let t=Math.min(dt,o.burn);if(dousing)t=Math.max(0,Math.min(t,o.douse));
    o.burn-=t;o._burnAcc=(o._burnAcc||0)+t*(o.burnRate||BALLISTA.burn);const n=Math.floor(o._burnAcc+1e-9);if(n>0){o._burnAcc-=n;damageShip(o,0,n);}
    if(dousing){o.douse-=dt;if(o.douse<=1e-6&&o.burn>0){o.burn=0;if(!o.founder&&!o.struck)showMsg(`The ${shipNoun(o)}'s hands put out the fire in her rig.`,'#c8b880');}}
    if(o.burn<=0){o.burn=0;o._burnAcc=0;o.douse=null;}}}
  // S1935 — a merchantman's hands (Michael's A on #1225, "Two unarmed hands with bodies"; naval-combat.md: "Cutting a line is E at its
  // cleat: 1.5 s for you, 6 s for her hand if he reaches it unhurt"). Every merchantman within 250 m of you carries two hands on her deck,
  // townsmen's bodies with nothing in their hands, keyed <her id>:hand:<k>, never hostile (held as a yielded duellist is: they never
  // fight, and a blow never wakes them). Hooked and lashed by you, the first hand standing walks to her end of a line that still holds
  // (1.5 m/s) and cuts it in 6 s; any hit on her hands (any loss of their health: a blade, an arrow, grape, a pot) starts his 6 s again.
  // With both cut she is free, and runs. While you stand on her deck they keep their heads down and cut nothing. A living hand douses
  // her rig by the black sail's rule (rigHands, RIG_DOUSE). Striking a hand is piracy, as any hit on her is (booked once, piracy());
  // killing him is the same piracy, not a murder
  const MERCH_HANDS={n:2,near:250,cut:6,walk:1.5,reach:.8};
  function merchantHands(o){if(!merchantOf(o)||o._hands||o.dead||o.founder!=null||o.struck||(o.crew&&o.crew.length))return false;
    if(Math.hypot(o.x-px,o.z-pz)>MERCH_HANDS.near)return false;o._hands=true;const fwd=[-Math.sin(o.yaw),-Math.cos(o.yaw)];
    for(let k=0;k<MERCH_HANDS.n;k++){const at=k?-2.2:2;let off=.8;while(off<1.6&&o.mesh&&typeof shipPropHit==='function'&&shipPropHit(o.mesh,o.x+fwd[0]*at+(-fwd[1])*(k?off:-off),o.z+fwd[1]*at+fwd[0]*(k?off:-off),.35))off+=.1; /* S2126 — the kit cog's hatch is 1.2 m wide: a hand steps out beside it, not into it */
      const ex=o.x+fwd[0]*at+(-fwd[1])*(k?off:-off),ez=o.z+fwd[1]*at+fwd[0]*(k?off:-off),fid=`${o.id||'ship'}:hand:${k}`;
      const e=buildZoneEnemy(sc,STATIC_SOL,ex,ez,'Pirate',null,{genome:personGenome({name:'Hand '+fid,role:'villager'},{key:fid})});keyFoe(e,fid);
      e.name='Deckhand';e.hand=true;e._duelHold=true;e.alert=false;e.homeX=o.x;e.homeZ=o.z;e._ship=o;ZONES.world.enemies.push(e);o.crew.push(e);}
    o._handHp=crewHp(o);return true;}
  function handOnLine(o){return HOOKS.o===o&&HOOKS.by!=='her'&&HOOKS.phase==='lashed';}
  // the named action: her hand's 6 s at a line run out; that line parts, and with none left she is free and runs
  function handCutLine(o,c){if(!c||c.cut)return false;c.cut=true;if(typeof sfxNoise==='function')sfxNoise(.08,0,0,.05,1600);
    if(HOOKS.cleats.every(x=>x.cut)){hookDrop(`Her hand cuts the last line. The ${shipNoun(o)} is free of you, and runs.`);o.fleeing=true;o.wp=null;return true;}
    showMsg('Her hand cuts one of your lines.','#ff8060');return true;}
  function tickMerchantHands(dt){const now=hookClock();
    for(const o of OTHER){if(!merchantOf(o))continue;if(!o._hands){merchantHands(o);continue;}const live=(o.crew||[]).filter(e=>e.hand&&!e.dead&&e.hp>0);
      const hp=crewHp(o),hurt=o._handHp!=null&&hp<o._handHp-1e-9;o._handHp=hp;
      if(hurt){const pm=piracy(o);if(pm)showMsgLong(pm,'#e88a8a');if(o._cut)o._cut.t0=now;}
      for(const e of live){e.alert=false;e._duelHold=true;}
      const aboard=inDeck(o.plat,px,pz)&&Math.abs(jumpY-DECK_Y)<1;
      if(!handOnLine(o)||!live.length||aboard){if(o._cut&&(aboard||!handOnLine(o)))o._cut=null;}
      else{const c=HOOKS.cleats.find(x=>!x.cut);if(c){const e=live[0],b=hookEnds(c)[1];
        if(!o._cut||o._cut.c!==c||o._cut.e!==e)o._cut={c,e,t0:null};const d=Math.hypot(b.x-e.x,b.z-e.z);
        if(d>MERCH_HANDS.reach){const k=Math.min(1,MERCH_HANDS.walk*dt/d);e.x+=(b.x-e.x)*k;e.z+=(b.z-e.z)*k;e.combatYaw=Math.atan2(b.x-e.x,b.z-e.z);o._cut.t0=null;}
        else{if(o._cut.t0==null)o._cut.t0=now;if(now-o._cut.t0>=MERCH_HANDS.cut){o._cut=null;handCutLine(o,c);}}}}
      for(const e of live)if(e.mesh){const y=typeof activeTerrainH==='function'?activeTerrainH(e.x,e.z):e.mesh.position.y;e.mesh.position.set(e.x,y,e.z);e.mesh.rotation.set(0,e.combatYaw||0,0);}}}
  // S1837 — the fire pot (the page's table: your hand, thrown 20 m; her rig 3 a second for 6 s; 12 fire to a hand within 2 m; Michael's
  // A on #1108 for the pot). Used from the bag, a fire pot is thrown where you look: at the nearest ship whose side is within 20 m and
  // within 15° of your line of sight, a black sail, a quest's ship or a merchantman (a hit on her is piracy, as a bolt's is). With none
  // there it stays in the bag: it is a sea weapon, and nothing is said of it ashore. It flies at 16 m/s and follows her; when it lands her
  // rig is lit for 6 s at 3 a second (a fire already in her rig is lit again with the pot's, never doubled, as the fire bolt's rule), and
  // each living hand within 2 m of where it breaks takes 12 fire, less as his resistance to fire (Tine's) says. It reads no skill.
  const FIRE_POT={range:20,cone:Math.PI/12,speed:16,burn:3,burnS:6,hand:12,handR:2};
  const POTS={fly:[],geo:null,mat:null};
  function potTarget(){if(activeZoneId!=='world'||(typeof isInterior==='function'&&isInterior()))return null;const fx=-Math.sin(yaw),fz=-Math.cos(yaw);let best=null,bd=1e9;
    for(const o of OTHER){if(o.dead||o.founder!=null||o.struck||!o.mesh)continue;const dx=o.x-px,dz=o.z-pz,c=Math.hypot(dx,dz),d=Math.max(0,c-(o.W||4)/2);
      if(d>FIRE_POT.range||d>=bd)continue;if(c>.01&&Math.acos(Math.max(-1,Math.min(1,(dx*fx+dz*fz)/c)))>FIRE_POT.cone+Math.atan2((o.W||4)/2,Math.max(c,.01)))continue;bd=d;best=o;}
    return best;}
  // why a fire pot cannot be thrown now, or null
  function throwPotWhy(){if(typeof firePotCount!=='function'||firePotCount()<1)return 'You have no fire pot.';if(activeZoneId!=='world'||(typeof isInterior==='function'&&isInterior()))return 'Not here.';
    if(!potTarget())return `No ship within a throw: a fire pot carries ${FIRE_POT.range} m.`;return null;}
  // the named action: a fire pot from the bag at the ship you look at; it breaks when it arrives
  function throwPot(){const why=throwPotWhy();if(why)return why;const o=potTarget();bagTake(b=>!!b.firePot,1);
    const fly={o,x0:px,z0:pz,y0:CAM.position.y-.3,t0:hookClock(),dur:Math.max(.1,Math.hypot(o.x-px,o.z-pz)/FIRE_POT.speed),mesh:null};
    if(typeof THREE!=='undefined'&&typeof sc!=='undefined'&&sc){if(!POTS.geo){POTS.geo=new THREE.SphereGeometry(.13,8,6);POTS.mat=new THREE.MeshLambertMaterial({color:0x8a4a2a});}
      fly.mesh=new THREE.Mesh(POTS.geo,POTS.mat);fly.mesh.position.set(px,fly.y0,pz);sc.add(fly.mesh);}
    POTS.fly.push(fly);if(typeof sfxNoise==='function')sfxNoise(.08,0,0,.06,600);if(typeof updateHUD==='function')updateHUD();return true;}
  // once a frame: the pots in flight; one lands on her deck, lights her rig and burns the hands by it
  function tickPots(dt){if(!POTS.fly.length)return;const now=hookClock();
    for(let i=POTS.fly.length-1;i>=0;i--){const f=POTS.fly[i],o=f.o,u=Math.min(1,(now-f.t0)/f.dur);
      if(f.mesh)f.mesh.position.set(f.x0+(o.x-f.x0)*u,f.y0+(DECK_Y+1-f.y0)*u+Math.sin(u*Math.PI)*2,f.z0+(o.z-f.z0)*u);
      if(u<1)continue;if(f.mesh){sc.remove(f.mesh);f.mesh=null;}POTS.fly.splice(i,1);
      if(o.dead||o.founder!=null||!OTHER.includes(o))continue;lightRig(o,FIRE_POT.burn,FIRE_POT.burnS);
      let hit=0;const foes=(ZONES.world&&ZONES.world.enemies)||[];
      for(const e of foes.slice()){if(e.dead||!(e.hp>0)||Math.hypot(e.x-o.x,e.z-o.z)>FIRE_POT.handR)continue;const k=e.resist&&e.resist.tine!=null?e.resist.tine:1;
        e.hp-=Math.max(1,Math.round(FIRE_POT.hand*k));e.alert=true;hit++;if(e.hp<=0&&typeof killZoneEnemy==='function')killZoneEnemy(e,sc);}
      const who=shipNoun(o);showMsg(`Your fire pot breaks on the ${who}'s deck, and her rig is alight.${hit?(hit===1?' One of her hands is caught in it.':` ${hit} of her hands are caught in it.`):''}`,'#e8c890');
      const pm=piracy(o);if(pm)showMsgLong(pm,'#e88a8a');}}
  function ballistaHud(){if(!shipFitted('ballista'))return '';const n=boltsAboard(),w=ballistaWait();
    return `Ballista${BOLTS.fire?' (fire)':''}: ${!n?'no bolts':w>0?`winding, ${Math.ceil(w)} s`:ballistaBears()?(ballistaHand(ballistaBears())?'on a hand':'she bears'):'ready'} · ${n} ${n===1?'bolt':'bolts'}`;}
  // at the helm with a ballista fitted, the left button is the ballista's, not the sword's: caught before the canvas's own handler
  if(typeof window!=='undefined'&&window.addEventListener)window.addEventListener('mousedown',e=>{
    if(e.button!==0||typeof SHIP==='undefined'||!SHIP.sailing||!(shipFitted('ballista')||shipGunned())||typeof started!=='undefined'&&!started)return;
    if(typeof document!=='undefined'&&document.pointerLockElement==null)return;if(typeof _isMenuOpen==='function'&&_isMenuOpen())return;
    e.preventDefault();e.stopPropagation();const r=helmFire();if(r!==true)showMsg(r,'#c8b880');},true);
  /* S1822 — a galleon's side that can fire goes first; else the ballista; else the guns' reason */
  function helmFire(){if(shipGunned()&&!broadsideWhy())return fireBroadside();if(shipFitted('ballista'))return fireBallista();return broadsideWhy();}
  if(typeof window!=='undefined'&&window.addEventListener)window.addEventListener('mousedown',e=>{ /* S1821 — the right button: fire bolts or plain */
    if(e.button!==2||typeof SHIP==='undefined'||!SHIP.sailing||!(shipFitted('ballista')||shipGunned())||typeof started!=='undefined'&&!started)return;
    if(typeof document!=='undefined'&&document.pointerLockElement==null)return;if(typeof _isMenuOpen==='function'&&_isMenuOpen())return;
    e.preventDefault();e.stopPropagation();if(shipGunned())gunsCycle();else ballistaFireMode(!BOLTS.fire);},true);
  function ballistaFireMode(on){BOLTS.fire=!!on;showMsg(on?'Fire bolts: each takes a pitch from your bag.':'Plain bolts.','#c8b880');shipBarsUI();return BOLTS.fire;}
  // S1822 — the galleon's broadside (B's sixth systems session; Michael's 7 A: guns on the top ships only). A galleon carries six guns a
  // side with her hull. The left button at the helm fires the side that bears on a black sail (or a quest's ship): within 25° of abeam
  // and 150 m from her side to the foe's. The six go in a 0.6 s ripple, and that side then takes 20 s to reload. The guns read no skill.
  // The shot comes from her hold, 20 to 1 of the hold a kind, sold 20 at a time at a yard to a galleon:
  //   round 6 hull a ball (1 gold), chain 6 rig a ball (2), grape 20 to every hand of hers within 60 m (2; once a broadside, not a
  //   ball), shell 8 hull a ball and the fire bolt's burn (15, the Mark's yards only: saltpeter, canon).
  // A side fires as many balls as she holds, up to six. The right button cycles the shot; a ballista she also carries looses fire bolts
  // while the shot is shell (the two burning loads) and plain bolts otherwise. Every ball strikes, as the page counts it: a sloop's 100
  // is three broadsides of round. A merchantman is not offered, as for the ballista (piracy is the foes-by-tier session).
  const BROADSIDE={arc:25*Math.PI/180,range:150,guns:6,ripple:.6,reload:20,grapeR:60,grapeHit:20,per:20,speed:150};
  const SHOT={round:{n:'round shot',hull:6,rig:0,price:1},chain:{n:'chain shot',hull:0,rig:6,price:2},grape:{n:'grape',hull:0,rig:0,price:2,grape:true},shell:{n:'shell',hull:8,rig:0,price:15,burn:true,mark:true}};
  const SHOT_KEYS=['round','chain','grape','shell'];
  const GUNS={t:{port:-1e9,stbd:-1e9},shot:'round',fly:[],n:0};
  function shipGunned(){const st=worldState.ship;return !!(st&&!st.sunk&&(st.cls||'sloop')==='galleon');}
  function shotAboard(k){const h=worldState.ship&&worldState.ship.hold;return h&&h[k]>0?h[k]:0;}
  function gunsWait(side){return Math.max(0,BROADSIDE.reload-(hookClock()-GUNS.t[side]));}
  // the ship each side bears on now: {port, stbd}, each the nearest foe in that side's arc and range, or null
  function gunsBear(){const out={port:null,stbd:null};if(!SHIP.mesh||!SHIP.sailing||!shipGunned())return out;const fx=-Math.sin(SHIP.yaw),fz=-Math.cos(SHIP.yaw),rx=-fz,rz=fx;const bd={port:1e9,stbd:1e9};
    const mer={port:null,stbd:null},md={port:1e9,stbd:1e9}; /* S1827 — a merchantman bears on a side only when no foe does */
    for(const o of OTHER){if(o.dead||o.founder!=null||o.struck||!o.mesh)continue;const foe=ballistaFoe(o);if(!foe&&!merchantOf(o))continue;const dx=o.x-SHIP.x,dz=o.z-SHIP.z,lat=dx*rx+dz*rz,lon=dx*fx+dz*fz;
      const side=lat>=0?'stbd':'port',d=Math.max(0,Math.hypot(dx,dz)-SHIP.W/2-(o.W||4)/2);if(d>BROADSIDE.range||d>=(foe?bd:md)[side])continue;if(Math.abs(Math.atan2(lon,Math.abs(lat)))>BROADSIDE.arc)continue;if(foe){bd[side]=d;out[side]=o;}else{md[side]=d;mer[side]=o;}}
    for(const sd of ['port','stbd'])if(!out[sd])out[sd]=mer[sd];
    return out;}
  // the side to fire now: one that bears, is loaded and has shot; the nearer if both
  function gunsSide(){const B=gunsBear();let best=null,bd=1e9;for(const sd of ['port','stbd']){const o=B[sd];if(!o||gunsWait(sd)>0)continue;const d=Math.hypot(o.x-SHIP.x,o.z-SHIP.z);if(d<bd){bd=d;best=sd;}}return best;}
  function broadsideWhy(){if(!shipGunned())return 'Only a galleon carries guns.';if(!SHIP.sailing)return 'The guns are fired from the helm.';const k=GUNS.shot;if(!shotAboard(k))return `No ${SHOT[k].n} in her hold.`;
    const B=gunsBear();if(!B.port&&!B.stbd)return 'Nothing bears: bring her abeam of the black sail.';if(!gunsSide())return 'That side is still loading.';return null;}
  // the named action: fire the side that bears; each ball strikes when it arrives
  function fireBroadside(){const why=broadsideWhy();if(why)return why;const sd=gunsSide(),o=gunsBear()[sd],k=GUNS.shot,h=worldState.ship.hold,n=Math.min(BROADSIDE.guns,shotAboard(k));
    h[k]-=n;if(h[k]<=0)delete h[k];const t0=hookClock();GUNS.t[sd]=t0;GUNS.n++;const fx=-Math.sin(SHIP.yaw),fz=-Math.cos(SHIP.yaw),s=sd==='stbd'?1:-1;
    for(let i=0;i<n;i++){const along=(i/(BROADSIDE.guns-1)-.5)*SHIP.L*.6,x0=SHIP.x+fx*along+(-fz)*s*SHIP.W/2,z0=SHIP.z+fz*along+fx*s*SHIP.W/2;
      GUNS.fly.push({o,k,x0,z0,t0:t0+i*BROADSIDE.ripple/(BROADSIDE.guns-1),dur:Math.hypot(o.x-x0,o.z-z0)/BROADSIDE.speed,first:i===0,last:i===n-1,vol:GUNS.n,hit:0});}
    if(typeof sfxNoise==='function')sfxNoise(.35,0,0,.25,180);showMsg(`${sd==='stbd'?'Starboard':'Port'} guns, ${SHOT[k].n}: fire!`,'#e8c890');shipBarsUI();return true;}
  // once a frame: the balls in flight. Grape is reckoned once a broadside, on its first ball's arrival
  function tickGuns(dt){if(!GUNS.fly.length)return;const now=hookClock();let said=null,pir=null;
    for(let i=GUNS.fly.length-1;i>=0;i--){const f=GUNS.fly[i],o=f.o;if(now<f.t0+f.dur)continue;GUNS.fly.splice(i,1);if(o.dead||o.founder!=null||!OTHER.includes(o))continue;const S=SHOT[f.k];
      if(S.grape){if(!f.first)continue;const d=Math.max(0,Math.hypot(o.x-f.x0,o.z-f.z0)-(o.W||4)/2);if(d>BROADSIDE.grapeR){said='The grape falls short of her deck.';continue;}let hit=0;
        for(const e of (o.crew||[]).slice()){if(e.dead)continue;e.hp-=BROADSIDE.grapeHit;hit++;if(e.hp<=0&&typeof killZoneEnemy==='function')killZoneEnemy(e,sc);}pir=piracy(o)||pir;said=hit?`Grape sweeps her deck: ${hit} of her crew hit.`:'Grape sweeps her empty deck.';continue;}
      const r=damageShip(o,S.hull,S.rig);if(r)pir=piracy(o)||pir;if(S.burn&&o.founder==null&&!o.dead){lightRig(o,BALLISTA.burn,BALLISTA.burnS);}
      const V=GUNS.fly.filter(q=>q.vol===f.vol).length;if(r){const V0=GUNS._v||(GUNS._v={}),T0=V0[f.vol]||(V0[f.vol]={h:0,r:0});T0.h+=r.hull;T0.r+=r.rig;}
      if(!V&&GUNS._v&&GUNS._v[f.vol]){const T=GUNS._v[f.vol];delete GUNS._v[f.vol];if(!o.founder&&!o.struck)said=`The broadside strikes the ${shipNoun(o)}.${T.h?` Hull −${T.h}.`:''}${T.r?` Rig −${T.r}.`:''}${S.burn?' Her rig is alight.':''}`;}}
    if(pir)showMsgLong(pir,'#e88a8a');else if(said)showMsg(said,'#e8c890');}
  function gunsHud(){if(!shipGunned())return '';const k=GUNS.shot,n=shotAboard(k),B=gunsBear(),w=sd=>{const t=gunsWait(sd);return t>0?`${Math.ceil(t)} s`:B[sd]?'bears':'ready';};
    return `Guns, ${SHOT[k].n} (${n}): port ${w('port')} · starboard ${w('stbd')}`;}
  function gunsShot(k){if(!SHOT[k])return null;GUNS.shot=k;if(shipFitted('ballista'))BOLTS.fire=k==='shell';showMsg(`The guns load ${SHOT[k].n}${shipFitted('ballista')?(k==='shell'?'; the ballista, fire bolts':'; the ballista, plain bolts'):''}.`,'#c8b880');shipBarsUI();return k;}
  function gunsCycle(){return gunsShot(SHOT_KEYS[(SHOT_KEYS.indexOf(GUNS.shot)+1)%SHOT_KEYS.length]);}
  // S1814 — naval combat's hooks (Michael's B on #1064, docs/design/naval-combat.md, A): from your deck or the helm, with her hull
  // under the crosshair within 10 m and the two ships moving at under 3 m/s to each other, E throws the hooks. The throw takes 1.0 s;
  // then 4 s of hauling draws her alongside, parallel and 0.6 m off, and both ships come to 0 m/s. Lashed, she is held there and
  // your ship makes no way; E at your rail with her deck under the crosshair crosses to it (boarding her) and back. Each line is
  // made fast at a cleat on your rail, two of them; E at a cleat cuts that line in 1.5 s (stay by it), and with both cut she is
  // free. In a rough sea a throw misses one time in two (seeded by her id and the throw); in a storm nobody throws. Her crew's
  // own hooks, and her hand cutting yours (6 s), are the next session's (repel boarders).
  const HOOK_BOARD=6,HOOK_REACH=10,HOOK_CLOSE=3,HOOK_THROW=1.0,HOOK_HAUL=4,HOOK_CUT=1.5,HOOK_GAP=.6,HOOK_CROSS=3,HOOK_CLEAT=1.3;
  const HOOKS={o:null,phase:null,t0:0,n:{},side:1,lz:0,yawK:0,from:null,cleats:[],lines:[],cut:null};
  function hookClock(){return performance.now()/1000;}
  function shipToWorld(mesh,lx,lz){const ry=mesh.rotation.y,c=Math.cos(ry),s=Math.sin(ry);return {x:mesh.position.x+lx*c+lz*s,z:mesh.position.z-lx*s+lz*c};}
  const _hkInv=new THREE.Matrix4(),_hkO=new THREE.Vector3(),_hkD=new THREE.Vector3(),_hkR=new THREE.Ray(),_hkB=new THREE.Box3(),_hkH=new THREE.Vector3(),_hkA=new THREE.Vector3(),_hkC=new THREE.Vector3();
  // the eye's distance to a hull's box (her sides to a hand over the rail), or -1 when the crosshair is not on her
  function eyeOnHull(mesh,W,L){if(!mesh||typeof CAM==='undefined'||!CAM)return -1;mesh.updateMatrixWorld(true);_hkInv.copy(mesh.matrixWorld).invert();
    CAM.updateMatrixWorld();CAM.getWorldDirection(_hkD);_hkO.copy(CAM.position).applyMatrix4(_hkInv);_hkD.transformDirection(_hkInv);_hkR.set(_hkO,_hkD);
    _hkB.set(_hkA.set(-W/2-.3,-.6,-L/2),_hkC.set(W/2+.3,SHIP_DECK+1.4,L/2));return _hkR.intersectBox(_hkB,_hkH)?_hkO.distanceTo(_hkH):-1;}
  function eyeSlack(){return (typeof thirdPerson!=='undefined'&&thirdPerson&&typeof TP!=='undefined')?TP.dist:0;}
  function shipVel(o){const v=o.speed||0;return [-Math.sin(o.yaw||0)*v,-Math.cos(o.yaw||0)*v];}
  function hookCloseSpeed(o){const a=shipVel(SHIP),b=shipVel(o);return Math.hypot(a[0]-b[0],a[1]-b[1]);}
  function hookAimed(){if(HOOKS.o||!SHIP.mesh||climbing()||!(onDeck()||SHIP.sailing))return null;let best=null,bd=1e9;
    for(const o of OTHER){if(o.dead||o.founder!=null||!o.mesh)continue;if(deckOff(o.plat)>HOOK_REACH)continue;const d=eyeOnHull(o.mesh,o.W,o.L);if(d<0||d>HOOK_REACH+eyeSlack()||d>=bd)continue;bd=d;best=o;}
    return best;}
  function hookPrompt(){if(HOOKS.o)return lashPrompt();const o=hookAimed();if(!o)return null;if(seaState()>=3)return 'No hook will hold in this sea';
    if(hookCloseSpeed(o)>=HOOK_CLOSE)return 'Close with her more slowly to throw the hooks';return "Press 'E' to throw the hooks";}
  function hookInteract(){if(HOOKS.o)return lashInteract();const o=hookAimed();if(!o||seaState()>=3||hookCloseSpeed(o)>=HOOK_CLOSE)return false;return throwHooks(o);}
  // the named action: the throw at a ship; it lands (or not) 1 s later
  function throwHooks(o,by){if(!o||HOOKS.o||!SHIP.mesh||o.dead||o.founder!=null)return false;by=by==='her'?'her':'you';const k=o.id||'ship';HOOKS.n[k]=(HOOKS.n[k]||0)+1;
    const miss=seaState()>=2&&seededRng('hooks',`${k}:${HOOKS.n[k]}`)()<.5;
    hookFrame(o);
    Object.assign(HOOKS,{o,by,phase:'throw',t0:hookClock(),tl:0,miss,cut:null,from:{x:o.x,z:o.z,yaw:o.yaw,v:SHIP.speed||0}});o.ramming=0;
    hookLines(true);if(typeof sfxNoise==='function')sfxNoise(.15,0,0,.08,700);showMsg(by==='her'?'Her hooks come over your rail!':'You throw the hooks.',by==='her'?'#ff8060':'#c8b880');return true;}
  // which side of you she lies, how far along, which way she faces, and the cleats on that side: taken at the throw and again when
  // the hooks bite, so a ship that sailed on during the throw is hauled in on the side she is on, not across your deck
  function hookFrame(o){const [lx,lz]=shipLocal(SHIP.mesh,o.x,o.z);HOOKS.side=lx>=0?1:-1;HOOKS.lz=Math.max(-SHIP.L/2,Math.min(SHIP.L/2,lz));
    let dy=(o.yaw-SHIP.yaw)%(Math.PI*2);dy=Math.atan2(Math.sin(dy),Math.cos(dy));HOOKS.yawK=Math.abs(dy)>Math.PI/2?Math.PI:0;
    HOOKS.cleats=[-.25,.25].map(f=>({lx:HOOKS.side*cleatOff(f*SHIP.L),lz:f*SHIP.L,cut:false}));}
  // a cleat stands on your planking, 0.35 m in from the deck's edge at its station (the deck narrows fore and aft)
  function cleatOff(lz){const p=SHIP.plat;let w=SHIP.W/2-.3;if(p&&p.inside)for(;w>.4;w-=.05){const q=shipToWorld(SHIP.mesh,HOOKS.side*w,lz);if(p.inside(q.x,q.z))break;}return Math.max(.4,w-.35);}
  // where she lies when lashed: parallel to your hull, 0.6 m off your side, as far along as she was
  function lashPose(){const o=HOOKS.o,p=shipToWorld(SHIP.mesh,HOOKS.side*(SHIP.W/2+o.W/2+HOOK_GAP),HOOKS.lz);return {x:p.x,z:p.z,yaw:SHIP.yaw+HOOKS.yawK};}
  function hookEnds(c){const o=HOOKS.o,a=shipToWorld(SHIP.mesh,c.lx,c.lz),[ox,oz]=shipLocal(o.mesh,a.x,a.z);
    const sd=ox>=0?1:-1,b=shipToWorld(o.mesh,sd*(o.W/2-.3),Math.max(-o.L/2+1,Math.min(o.L/2-1,oz)));return [a,b];}
  function hookLines(make){for(const l of HOOKS.lines){sc.remove(l);l.geometry.dispose();}HOOKS.lines=[];if(!make)return;
    const mat=new THREE.LineBasicMaterial({color:0x5a4428});for(const c of HOOKS.cleats){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const l=new THREE.Line(g,mat);l.frustumCulled=false;l.userData.c=c;sc.add(l);HOOKS.lines.push(l);}}
  function hookDrop(why){const o=HOOKS.o;if(o){o.lashed=false;if(HOOKS.by==='her'&&!o.sentBoarders){o._rammed=false;o.ramWait=PIRATE_RAM.wait;o.hookWait=10;}} /* S1815 — her hooks lost: she circles and must ram again */hookLines(false);Object.assign(HOOKS,{o:null,phase:null,cut:null,cleats:[]});if(why)showMsg(why,'#c8b880');}
  function lashed(o){return !!HOOKS.o&&HOOKS.phase==='lashed'&&(!o||HOOKS.o===o);}
  // once a frame, after the other ships have moved: the throw, the haul, the lashing held, a cut
  function tickHooks(dt){const o=HOOKS.o;if(!o)return;
    if(!SHIP.mesh||o.dead||o.founder!=null||!OTHER.includes(o)||activeZoneId!=='world'){hookDrop(SHIP.mesh&&o.founder!=null?'The lines go with her.':null);return;}
    const t=hookClock()-HOOKS.t0;o.ramming=0;
    if(HOOKS.phase==='throw'){if(t>=HOOK_THROW){if(HOOKS.miss){hookDrop(HOOKS.by==='her'?'Her hooks fall short in the swell.':'The hooks fall short in the swell.');return;}HOOKS.phase='haul';HOOKS.t0=hookClock();hookFrame(o);hookLines(true);
        HOOKS.from={x:o.x,z:o.z,yaw:o.yaw,v:SHIP.speed||0};showMsg(HOOKS.by==='her'?'Her hooks bite. Cut the lines, or her crew will be across.':'The hooks bite. Haul her in.',HOOKS.by==='her'?'#ff8060':'#e8d8a0');}}
    else if(HOOKS.phase==='haul'){const u=Math.min(1,t/HOOK_HAUL),e=u*u*(3-2*u),P=lashPose(),f=HOOKS.from;
      let dy=P.yaw-f.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));o.x=f.x+(P.x-f.x)*e;o.z=f.z+(P.z-f.z)*e;o.yaw=f.yaw+dy*e;o.speed=0;SHIP.speed=f.v*(1-u);placeOther(o);
      if(u>=1){HOOKS.phase='lashed';HOOKS.tl=hookClock();o.lashed=true;showMsg(HOOKS.by==='her'?'She has you lashed.':`Lashed. ${o.kind==='pirate'?'Her crew are waiting.':'Her crew keep back from the rail.'}`,HOOKS.by==='her'?'#ff8060':'#e8d8a0');}}
    else{const P=lashPose();o.x=P.x;o.z=P.z;o.yaw=P.yaw;o.speed=0;SHIP.speed=0;placeOther(o);
      if(HOOKS.by==='her'&&!o.sentBoarders&&hookClock()-HOOKS.tl>=HOOK_BOARD)pirateCross(o);}
    if(HOOKS.o&&HOOKS.phase!=='throw'){
      const C=HOOKS.cut;if(C){const a=shipToWorld(SHIP.mesh,C.c.lx,C.c.lz);if(!onDeck()||Math.hypot(px-a.x,pz-a.z)>HOOK_CLEAT+.3){HOOKS.cut=null;showMsg('You leave the line uncut.','#c8b880');}
        else if(hookClock()-C.t0>=HOOK_CUT){HOOKS.cut=null;cutLine(C.c);}}}
    const draw=HOOKS.phase==='throw'?Math.min(1,t/HOOK_THROW):1;
    for(const l of HOOKS.lines){const c=l.userData.c;l.visible=!c.cut;if(c.cut)continue;const [a,b]=hookEnds(c),A=l.geometry.attributes.position;
      A.setXYZ(0,a.x,DECK_Y+.4,a.z);A.setXYZ(1,a.x+(b.x-a.x)*draw,DECK_Y+.6+Math.sin(draw*Math.PI)*1.5,a.z+(b.z-a.z)*draw);A.needsUpdate=true;}}
  // the named action: one line cut; with none left she is free
  function cutLine(c){if(!c||c.cut)return false;c.cut=true;if(typeof sfxNoise==='function')sfxNoise(.08,0,0,.05,1600);
    if(HOOKS.cleats.every(x=>x.cut)){hookDrop('The last line parts. She is free of you.');return true;}showMsg('You cut a line. One holds her still.','#c8b880');return true;}
  function cleatNear(){if(!HOOKS.o||HOOKS.phase==='throw'||(HOOKS.phase==='haul'&&HOOKS.by!=='her')||!onDeck()||HOOKS.cut)return null;for(const c of HOOKS.cleats){if(c.cut)continue;const a=shipToWorld(SHIP.mesh,c.lx,c.lz);if(Math.hypot(px-a.x,pz-a.z)<HOOK_CLEAT)return c;}return null;}
  // across the gap: from your deck with her hull under the crosshair, within 3 m, onto her deck at her near rail (boarding her);
  // from hers with yours under it, back
  function crossTarget(){if(!lashed()||climbing()||SHIP.sailing||Math.abs(jumpY-DECK_Y)>.6)return null;const o=HOOKS.o;
    const mine=onDeck(),hers=inDeck(o.plat,px,pz);if(!mine&&!hers)return null;const to=mine?{mesh:o.mesh,W:o.W,L:o.L,other:o}:{mesh:SHIP.mesh,W:SHIP.W,L:SHIP.L,other:null};
    const d=eyeOnHull(to.mesh,to.W,to.L);if(d<0||d>HOOK_CROSS+eyeSlack())return null;return to;}
  function lashPrompt(){if(HOOKS.phase==='throw')return null;if(HOOKS.cut)return 'Cutting the line…';if(cleatNear())return "Press 'E' to cut the line";if(HOOKS.phase!=='lashed')return null;const t=crossTarget();if(t)return t.other?"Press 'E' to cross to her deck":"Press 'E' to cross back aboard";return null;}
  function lashInteract(){if(HOOKS.phase==='throw')return false;const c=cleatNear();if(c){HOOKS.cut={c,t0:hookClock()};showMsg('You set your knife to the line.','#c8b880');return true;}if(HOOKS.phase!=='lashed')return false;
    const t=crossTarget();if(!t)return false;const [lx,lz]=shipLocal(t.mesh,px,pz),sd=lx>=0?1:-1,P=shipToWorld(t.mesh,sd*(t.W/2-.9),Math.max(-t.L/2+1.5,Math.min(t.L/2-1.5,lz)));
    if(t.other&&!t.other.boarded)boardOther(t.other,P);else{px=P.x;pz=P.z;jumpY=DECK_Y;velY=0;onGround=true;}return true;}
  // S743 — Michael's A on #237: the body is held on the net, .35 off the planking, where it took hold (the first .15 of the
  // climb carries it there from the water or the quay), rising evenly to the deck's height by four-fifths of the climb; the
  // last fifth swings it in over the rail (an arc of .5 over the deck) to the rail's walk. `climbPose()` gives the third
  // person's body the climb's progress and the way to face (the hull).
  const NET_OFF=.38;
  function climbNetPt(C){return new THREE.Vector3(C.side*(C.W/2+NET_OFF),SHIP_DECK,C.lz||0).applyMatrix4(C.mesh.matrixWorld);}
  function climbPose(){if(!CLIMB)return null;const C=CLIMB;C.mesh.updateMatrixWorld(true);const n=climbNetPt(C),c=new THREE.Vector3(0,SHIP_DECK,C.lz||0).applyMatrix4(C.mesh.matrixWorld);
    return {u:Math.min(1,C.t/NET_CLIMB),ry:Math.atan2(c.x-n.x,c.z-n.z)};}
  // every world tick: the climb follows the hull as she moves, and a deck landed on is boarded
  function tickNetClimb(dt){
    if(CLIMB){const C=CLIMB;if(!C.mesh.parent){CLIMB=null;return;}C.t+=Math.min(dt,.1);const u=Math.min(1,C.t/NET_CLIMB);const r=netRail(C.mesh,C.W,C.side),n=climbNetPt(C);
      const a=Math.min(1,u/.15),e=a*a*(3-2*a),k=Math.max(0,(u-.8)/.2),hx=C.x0+(n.x-C.x0)*e,hz=C.z0+(n.z-C.z0)*e;
      px=hx+(r.x-hx)*k;pz=hz+(r.z-hz)*k;jumpY=k>0?DECK_Y+.1*(1-k)+.5*Math.sin(Math.PI*k):C.y0+(DECK_Y+.1-C.y0)*Math.min(1,u/.8);velY=0;onGround=true;
      if(u>=1){CLIMB=null;px=r.x;pz=r.z;jumpY=DECK_Y;if(C.other)boardOther(C.other,r);else showMsg('You climb aboard. E again for the wheel.','#c8b880');}return;}
    for(const o of OTHER){if(o.boarded||o.dead)continue;const p=o.plat;if(px>p.x0&&px<p.x1&&pz>p.z0&&pz<p.z1&&Math.abs(jumpY-DECK_Y)<1&&(!p.inside||p.inside(px,pz))){boardOther(o,{x:px,z:pz});break;}}}
  // until the look builder hangs the real nets: a plain rope net on each side, 2.6 by 2.3, about 170 triangles a side
  function shipNetMesh(W){const c=new THREE.Color(0x6a5434),parts=[];
    for(const sd of [1,-1]){const x=sd*(W/2+.07);
      for(let k=0;k<7;k++)parts.push({geo:new THREE.BoxGeometry(.05,2.3,.05),color:c,x,y:-.7+1.15+.05,z:-1.2+k*.4});
      for(let k=0;k<7;k++)parts.push({geo:new THREE.BoxGeometry(.05,.05,2.5),color:c,x,y:-.6+k*.32,z:0});}
    const m=new THREE.Mesh(mergeParts(parts),VC_MAT);m.name='nets';return m;}
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
    return out;
  }
  // S642 — the yard's offers (Michael's B on #192, item 3): the buy, the refits, the sails and the hold, as {label, fn} rows
  // with the shipwright's own lines for answers. They were chat rows (upgradeTopics) until the yard panel (openYardPanel)
  // took them; the panel shows these labels as its buttons. With no ship only the sloop is sold, as before; sunk, nothing.
  function yardOffers(site){
    if(!worldState.ship){const p=shipPriceNow();return [{label:`Buy a ship (${p} gold${p<SHIP_PRICE?", with Corwin's note":''})`,cls:'sloop',quest:true,fn:()=>buyShip(site)}];}
    const st=shipCfg();const out=[];const L=SHIPWRIGHT_LINES[peopleOfSite(site)]||SHIPWRIGHT_LINES.markman;if(st.sunk)return out;
    // S636 — refits branch: every hull this yard sells but hers, up for the difference, down with two thirds of it paid back.
    // A hull no bigger than hers takes the shipwright's first sentence only (*Longer, broader* is not true of a cutter).
    const cls=st.cls||'sloop';
    for(const next of yardHulls(site)){if(next===cls)continue;const c0=refitCost(cls,next);
      out.push({label:c0>=0?`Refit her as a ${next} (${c0} gold)`:`Refit her as a ${next} (the yard pays ${-c0} gold)`,cls:next,quest:true,fn:()=>{const from=st.cls||'sloop',p=refitCost(from,next);if(p>0&&gold<p)return L.refitPoor(next,p);gold-=p;updateHUD();
        const nd=nationAt(site.x,site.z);if(herDress(from,st.dress)!==herDress(next,nd)){st.paint=0;st.cloth=0;} /* S1845 — a new dress is worn as built */st.cls=next;st.hull=SHIP_CLASSES[next].hull;st.dress=nd;const left=shipFitToHull(); /* S1726 — what her new rooms cannot hold waits in the yard */applyShipClass(); /* S1538 — #839 A: refitted, she takes this yard's dress */if(typeof addLog==='function')addLog('⛵',`The ${SHIP.name} refitted as a ${next}.`);
        const line=L.refitted(next),said=SHIP_CLASSES[next].L>SHIP_CLASSES[from].L?line:line.split(/[.:]/)[0]+'.';return left.length?`${said} Kept at the yard, no place for them: ${shipFitNames(left).join(', ')}.`:said;}});}
    const sails=st.sails||0;if(sails<SAIL_TIERS.length-1)out.push({label:`Better sails, tier ${sails+1} (${SAIL_TIERS[sails+1]} gold)`,cls,quest:true,fn:()=>{const p=SAIL_TIERS[sails+1];if(gold<p)return L.sailsPoor(p);gold-=p;updateHUD();st.sails=sails+1;return L.sailed(shipTopSpeed().toFixed(1));}});
    const cargo=st.cargo||0,free=shipPlacesUsed(st)<shipPlaces(cls);if(cargo<2&&free&&!st.stored.includes('stowage'))out.push({label:`Bigger hold, tier ${cargo+1} (${CARGO_TIERS[cargo+1]} gold)`,cls,quest:true,fn:()=>{const p=CARGO_TIERS[cargo+1];if(gold<p)return L.holdPoor(p);gold-=p;updateHUD();st.cargo=cargo+1;return L.held(25*(cargo+1));}});
    // S1726 — the fittings (#979 B): a row for each one she lacks while a place is free, one to fit back each stored one, one to take each out
    if(free)for(const k in SHIP_FITS){if(st.fit.includes(k)||st.stored.includes(k))continue;const F=SHIP_FITS[k];
      out.push({label:`Fit ${F.a} (${F.price} gold, ${F.w} of the hold)`,cls,quest:true,fn:()=>{const r=fitShip(k);return r===true?`Fitted: ${F.a}. Her hold takes ${holdCap()} now.`:r===null?`${F.a[0].toUpperCase()+F.a.slice(1)}: ${F.price} gold.`:r;}});}
    if(shipGunned()&&shipHere(site))for(const k of SHOT_KEYS){const S=SHOT[k];if(S.mark&&nationAt(site.x,site.z)!=='mark')continue; /* S1822 — the guns' shot; shell at the Mark's yards only */
      out.push({label:`${S.n[0].toUpperCase()+S.n.slice(1)} for the guns, ${BROADSIDE.per} (${BROADSIDE.per*S.price} gold, 1 of the hold)`,cls,quest:true,fn:()=>{const p=BROADSIDE.per*S.price;if(gold<p)return `${BROADSIDE.per} ${S.n}: ${p} gold.`;
        const n=shotAboard(k),w=Math.ceil((n+BROADSIDE.per)/BROADSIDE.per)-Math.ceil(n/BROADSIDE.per);if(holdUsed()+w>holdCap())return `No room in her hold for the ${S.n}.`;
        gold-=p;updateHUD();const h=holdOf();h[k]=n+BROADSIDE.per;shipBarsUI();return `${BROADSIDE.per} ${S.n} stowed. She carries ${h[k]}.`;}});}
    if(shipFitted('ballista')&&shipHere(site))out.push({label:`Bolts for the ballista, ${BALLISTA.per} (${BALLISTA.per*BALLISTA.price} gold, 1 of the hold)`,cls,quest:true,fn:()=>{const p=BALLISTA.per*BALLISTA.price;if(gold<p)return `${BALLISTA.per} bolts: ${p} gold.`; /* S1820 */
      const n=boltsAboard(),w=Math.ceil((n+BALLISTA.per)/BALLISTA.per)-Math.ceil(n/BALLISTA.per);if(holdUsed()+w>holdCap())return 'No room in her hold for the bolts.';
      gold-=p;updateHUD();const h=holdOf();h.bolts=n+BALLISTA.per;shipBarsUI();return `${BALLISTA.per} bolts stowed. She carries ${h.bolts}.`;}});
    if(free)for(const k of [...new Set(st.stored)])out.push({label:`Fit her ${shipFitNames([k])[0]} again (kept at the yard)`,cls,quest:true,fn:()=>{const r=fitShip(k,true);return r===true?`Fitted again: ${shipFitNames([k])[0]}. Her hold takes ${holdCap()} now.`:r;}});
    // S1734 — her figureheads: each found one in the bag fitted free, each kept one set back free, the yard's own island's carved for 150
    {const H=shipHeads(st),nat=nationAt(site.x,site.z),cap=t=>t[0].toUpperCase()+t.slice(1);
      for(const k of [...new Set(BAG.filter(b=>b&&SHIP_HEADS[b.figurehead]).map(b=>b.figurehead))])out.push({label:`Fit ${headName(k)} at her bow (free)`,cls,quest:true,fn:()=>{const r=fitHead(k);return r===true?`${cap(headName(k))} rides at her bow now.`:r;}});
      for(const k of H)if(k!==st.head)out.push({label:`Set ${headName(k)} at her bow again (kept at the yard)`,cls,quest:true,fn:()=>{const r=fitHead(k);return r===true?`${cap(headName(k))} rides at her bow again.`:r;}});
      if(st.yardHead&&st.head!=='yard')out.push({label:`Set her carved ${HEAD_CARVE[st.yardHead]} at her bow again (kept at the yard)`,cls,quest:true,fn:()=>{const r=fitHead('yard',st.yardHead);return r===true?`The ${HEAD_CARVE[st.yardHead]} rides at her bow again.`:r;}});
      if(HEAD_CARVE[nat]&&st.yardHead!==nat)out.push({label:`Carve her a figurehead: the ${HEAD_CARVE[nat]} (${HEAD_YARD_PRICE} gold)`,cls,quest:true,fn:()=>{const r=fitHead('yard',nat);return r===true?`Carved: the ${HEAD_CARVE[nat]} rides at her bow.`:r===null?`The ${HEAD_CARVE[nat]}: ${HEAD_YARD_PRICE} gold.`:r;}});}
    // S1737 — her crew: each one met and waiting taken aboard free while a bunk is free, each aboard sent ashore here
    {const C=shipCrew(st);for(const r in st.ashore)out.push({label:`Take ${crewName(r)} aboard (free)`,cls,quest:true,fn:()=>{const x=crewAboard(r);return x===true?`${crewName(r,1)} comes aboard and stows a bag in her bunks.`:x;}});
      for(const r of C.slice())out.push({label:`Send ${crewName(r)} ashore here`,cls,quest:true,fn:()=>{const x=crewAshore(r,site.id);return x===true?`${crewName(r,1)} goes ashore at ${site.name} to wait.`:x;}});}
    for(const k of [...(cargo?['stowage']:[]),...st.fit])out.push({label:`Take out her ${shipFitNames([k])[0]}`,cls,quest:true,fn:()=>{const r=unfitShip(k);return r===true?`The ${shipFitNames([k])[0]} comes out and waits at the yard. Her hold takes ${holdCap()} now.`:r;}});
    return out;
  }
  // ── fish ──
  const FISH_KINDS={shallow:['Herring','Bream','Mackerel'],deep:['Cod','Silverfin','Ling'],cold:['Char','Haddock'],warm:['Grouper','Snapper']};
  function nearSchool(){if(!isSwimming())return null;if(typeof gateToll==='function'&&gateToll('uisce')&&uisceWaters())return null; /* S1359 — Uisce's toll: no fish in the Gatelands' waters */for(const s of LIFE.fish){if(s.cool>0||schoolNetted(s))continue; /* S2215 — a netted school is gone for the day */if(Math.hypot(px-s.cx,pz-s.cz)<s.r+1.4&&Math.abs(jumpY-s.y)<1.6)return s;}return null;}
  // S1759 — a trout in a river or a lake (#1014 A): swimming, within reach of one that has not darted off, E takes it by hand, as the sea's
  // catch (the same reach; Uisce's toll and face hold for it as for the sea's fish in the Gatelands' waters)
  function nearTrout(){if(!isSwimming())return null;if(typeof gateToll==='function'&&gateToll('uisce')&&uisceWaters())return null;let best=null,bd=1.4;
    for(const e of ZONES.world.enemies){if(!e.swim||e.dead||!e.mesh)continue;const d=Math.hypot(px-e.x,pz-e.z);if(d<bd&&Math.abs(jumpY-e.mesh.position.y)<1.6){bd=d;best=e;}}return best;}
  function takeTrout(e){const item=riverFishItem(e.baseName); /* S1797 — the trout, the pike or the salmon */
    if(typeof canCarry==='function'&&!canCarry(item)){showMsg('Too heavy to carry!','#cc8844');return true;}
    e.dead=true;if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);if(e.el&&e.el.parent)e.el.parent.remove(e.el);
    const i=ZONES.world.enemies.indexOf(e);if(i>=0)ZONES.world.enemies.splice(i,1);wildTaken(e);
    bagAdd(item);if(typeof gateGift==='function'&&gateGift('uisce')&&uisceWaters()&&(typeof canCarry!=='function'||canCarry(item)))bagAdd(riverFishItem(e.baseName));
    splash(false);showMsg(`Caught a ${item.name}.`,'#88cc88');if(typeof addLog==='function')addLog('🐟',`Caught a ${item.name}.`);return true;}
  // S2214 — the rod (Michael's B on #1504, docs/design/adventurers-kit.md; ROD_ITEM, 50-travel.js): standing, a rod in the bag, E at
  // water 0.6 m deep 1 to 4 m in front of you casts. A bite comes 15 to 45 game minutes later (as many real seconds), and E within one
  // game minute of it (1.0 s) strikes; E before it reels in, and a bite left past its minute gets away. Walking 2 m off, swimming, a
  // deck under sail or leaving the open world ends the cast. The water's own fish: a river's or a lake's (a trout; in the Gatelands over
  // a bed more than 3 m down a River Pike one time in two; in the Mark's rivers a Riverjaw Salmon one time in two, the wild fish's own
  // rule) or the sea's (FISH_KINDS, by climate and the bed, as a school's catch). Seeded `rod:<cell>:<day>:<cast>` (the co-op rules).
  // Nothing bites in the Gatelands' waters under Uisce's toll. The cast is not saved.
  const ROD={cast:null,n:{}};const ROD_REACH=4,ROD_DEEP=.6,ROD_STRIKE=1,ROD_LEAVE=2;
  function hasRod(){return BAG.some(b=>b&&b.tool==='rod');}
  function rodSpot(){if(activeZoneId!=='world'||isInterior()||isSwimming()||SHIP.sailing||!onGround||!hasRod())return null;
    const fx=-Math.sin(yaw),fz=-Math.cos(yaw);for(const da of [0,-.35,.35,-.7,.7])for(let r=1;r<=ROD_REACH;r+=.5){const c=Math.cos(da),s=Math.sin(da),dx=fx*c-fz*s,dz=fx*s+fz*c;
      const x=px+dx*r,z=pz+dz*r;if(SEA_Y-worldH(x,z)>=ROD_DEEP)return {x,z};}return null;}
  function rodFish(x,z,R){const [i,j]=cellOf(x,z);let isle=null;try{isle=nationKeyOf(i,j);}catch(err){}
    const inland=wildRiverNear(x,z,0)||wildLakeNear(x,z);
    if(inland){const half=R()<.5;if(isle==='gatelands'&&SEA_Y-worldH(x,z)>3&&half)return riverFishItem('River Pike');if(isle==='mark'&&wildRiverNear(x,z,0)&&half)return riverFishItem('Riverjaw Salmon');return troutItem();}
    const cl=climateOfCell(i,j),bed=worldH(x,z);const pool=(cl==='cold'&&R()<.5)?FISH_KINDS.cold:(cl==='warm'&&R()<.5)?FISH_KINDS.warm:bed<-5?FISH_KINDS.deep:FISH_KINDS.shallow;
    const name=pool[Math.floor(R()*pool.length)],big=R()<.12;return {name:(big?'Fine ':'')+name,ico:'🐟',type:'misc',weight:big?1.2:.6,sellMult:big?1.2:.7,buyPrice:big?26:9,qty:1,_typeKey:'fish',food:'fish'};}
  function rodCast(spot){const t=worldState.gameTimeAbsMinutes||0,day=lootDay(),[i,j]=cellOf(spot.x,spot.z);ROD.n[day]=(ROD.n[day]||0)+1;
    const key=`${i},${j}:${day}:${ROD.n[day]}`,R=seededRng('rod',key);const barren=typeof gateToll==='function'&&gateToll('uisce')&&uisceWaters();
    ROD.cast={x:px,z:pz,wx:spot.x,wz:spot.z,at:t,bite:barren?Infinity:t+15+R()*30,R,key};if(typeof sfxNoise==='function')try{sfxNoise(.12,0,0,.05,900);}catch(e){}showMsg('You cast the line.','#88aacc');return true;}
  function rodStrike(){const C=ROD.cast,t=worldState.gameTimeAbsMinutes||0;ROD.cast=null;
    if(t<C.bite){showMsg('You reel in.','#a0a090');return true;}
    if(t>=C.bite+ROD_STRIKE){showMsg('It got away.','#a0a090');return true;}
    const item=rodFish(C.wx,C.wz,C.R);if(typeof canCarry==='function'&&!canCarry(item)){showMsg('Too heavy to carry!','#cc8844');return true;}
    bagAdd(item);splash(false);showMsg(`Caught a ${item.name}.`,'#88cc88');if(typeof addLog==='function')addLog('🐟',`Caught a ${item.name}.`);return true;}
  function tickRod(){const C=ROD.cast;if(!C)return;const t=worldState.gameTimeAbsMinutes||0;
    if(activeZoneId!=='world'||isInterior()||isSwimming()||SHIP.sailing||Math.hypot(px-C.x,pz-C.z)>ROD_LEAVE||!hasRod()){ROD.cast=null;return;}
    if(t>=C.bite&&!C.told){C.told=true;showMsg('A bite! Strike!','#ffd070');try{splash(false);}catch(e){}}
    if(t>=C.bite+ROD_STRIKE){ROD.cast=null;showMsg('It got away.','#a0a090');}}
  // S2215 — the net (Michael's B on #1504, the page's table): on your own deck, not at the helm, with her making 2 knots or less, a net
  // in the bag and a school under you (within its spread and 3 m), E casts the net. 8 s later (the wall clock: a dropped frame changes
  // nothing) it comes up with 3 to 5 fish into the sea chest, where the cook takes them (crewCook); the school is gone until the next day.
  // Leaving the deck, taking the helm or her passing 2 knots hauls it in empty. The haul is seeded `<chunk>:<day>` (the co-op rules), its
  // fish the school's own (FISH_KINDS by climate and bed, as a swimmer's catch), and the school's day is kept in worldState.netted
  // (the world's: a school is a place's).
  const NET={on:null};const NET_MS=8000,NET_KNOTS=2,NET_N0=3,NET_N1=5;
  function schoolNetted(s){const n=worldState.netted;return !!(n&&s&&s.chunk&&n[s.chunk]===lootDay());}
  function deckSchool(){if(activeZoneId!=='world'||!SHIP.mesh||SHIP.sailing||!onDeck()||Math.abs(SHIP.speed||0)>NET_KNOTS||!BAG.some(b=>b&&b.tool==='net'))return null;
    if(typeof gateToll==='function'&&gateToll('uisce')&&uisceWaters())return null;
    for(const s of LIFE.fish){if(schoolNetted(s))continue;if(Math.hypot(px-s.cx,pz-s.cz)<s.r+3)return s;}return null;}
  function netCast(s){NET.on={s,t0:performance.now(),x:px,z:pz};if(typeof sfxNoise==='function')try{sfxNoise(.2,0,0,.08,700);}catch(e){}showMsg('You pay the net out over the side.','#88aacc');return true;}
  function netHaul(){const N=NET.on;NET.on=null;const s=N.s,day=lootDay(),R=seededRng('net',(s.chunk||(Math.round(s.cx)+','+Math.round(s.cz)))+':'+day);
    const [i,j]=cellOf(s.cx,s.cz),cl=climateOfCell(i,j),bed=worldH(s.cx,s.cz),n=NET_N0+Math.floor(R()*(NET_N1-NET_N0+1));const got=[];
    for(let k=0;k<n;k++){const pool=(cl==='cold'&&R()<.5)?FISH_KINDS.cold:(cl==='warm'&&R()<.5)?FISH_KINDS.warm:bed<-5?FISH_KINDS.deep:FISH_KINDS.shallow;
      const name=pool[Math.floor(R()*pool.length)],big=R()<.12;const it={name:(big?'Fine ':'')+name,ico:'🐟',type:'misc',weight:big?1.2:.6,sellMult:big?1.2:.7,buyPrice:big?26:9,qty:1,_typeKey:'fish',food:'fish'};_stashAdd(it);got.push(it.name);}
    if(!worldState.netted)worldState.netted={};for(const k in worldState.netted)if(worldState.netted[k]!==day)delete worldState.netted[k];
    worldState.netted[s.chunk||(Math.round(s.cx)+','+Math.round(s.cz))]=day;if(s.im)s.im.visible=false;splash(false);
    showMsg(`The net comes up with ${n} fish. Into the sea chest.`,'#88cc88');if(typeof addLog==='function')addLog('🐟',`Netted ${n} fish: ${got.join(', ')}.`);return got;}
  function tickNet(){const N=NET.on;if(!N)return;
    if(activeZoneId!=='world'||!SHIP.mesh||SHIP.sailing||!onDeck()||Math.abs(SHIP.speed||0)>NET_KNOTS){NET.on=null;showMsg('You haul the net in empty.','#a0a090');return;}
    if(performance.now()-N.t0>=NET_MS)netHaul();}
  function tickNetted(){for(const s of LIFE.fish)if(s.im)s.im.visible=!schoolNetted(s);}
  // S2226 — the spyglass (Michael's B on #1504, docs/design/adventurers-kit.md; GLASS_ITEM, 50-travel.js). Used from the bag, it is raised:
  // the view narrows ×5 (glassZoom, read by the loop's field of view in 90-main.js) and a step, a jump, a blow struck or taken, leaving the
  // open world or putting it away lowers it. At the helm the keys steer her, so only a blow lowers it there. Four times a second
  // (tickGlass) it reads what lies in the narrow view, out to its reach:
  // - its reach (glassReach) is the weather's sight (WX.sightM, #679: fog's 60 m), capped at 1,000 m; after dusk (_nightFactor over .5) it
  //   is 0, so the glass sees no further than your eye and the hilltop is a clear day's thing;
  // - a ship (OTHER) within 800 m and the reach, nearest the view's middle within her own breadth and 1°, shows a card: her trade
  //   (a merchantman, a black sail, or the ship a quest of yours is after), her build, her waters, and her hull and rig if hurt;
  // - a town, a fort, a lair or a gate's door (GLASS_KINDS) within the reach, inside the narrow view and over no ridge (glassClear samples
  //   the ground every 10 m against the line of sight), not yet discovered, is sighted: worldState.sighted[id], the character's key
  //   (SS_CHAR_WS, the S242 list). The map pencils it with its name (83-world-generator.js); fast travel still wants it walked to.
  //   Places by and off the road are never sighted (#1292 A). Sighting gives no experience: discovering does.
  const GLASS={up:false,php:0,t:0,ship:null,el:null,ring:null};const GLASS_ZOOM=5,GLASS_SHIP=800,GLASS_PLACE=1000;
  const GLASS_KINDS={city:1,town:1,village:1,port:1,garrison:1,lair:1,fort:1,cave:1};
  function hasGlass(){return BAG.some(b=>b&&b.tool==='glass');}
  function glassCan(){return activeZoneId==='world'&&lid==='overworld'&&!isInterior()&&!isSwimming()&&!dead;}
  function glassReach(){if(!glassCan())return 0;if(typeof _nightFactor==='function'&&_nightFactor()>.5)return 0;return Math.min(GLASS_PLACE,WX.sightM||WX_SIGHT.clear);}
  function glassZoom(){if(GLASS.up&&!glassCan())glassDown();return GLASS.up?GLASS_ZOOM:1;}
  function glassSighted(id){return !!(worldState.sighted&&worldState.sighted[id]);}
  function glassRaise(){if(!hasGlass())return false;if(!glassCan()){showMsg('Not here.','#a0a090');return false;}
    GLASS.up=true;GLASS.php=PHP;GLASS.t=0;GLASS.ship=null;glassDress(true);return true;}
  function glassDown(){if(!GLASS.up)return;GLASS.up=false;GLASS.ship=null;glassDress(false);}
  function glassToggle(){return GLASS.up?(glassDown(),true):glassRaise();}
  // the narrow view's ring and the ship's card: two plain elements made on first use
  function glassDress(on){if(on&&!GLASS.ring){const r=document.createElement('div');r.id='glass-ring';r.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:40;display:none;background:radial-gradient(circle at 50% 50%,rgba(0,0,0,0) 0,rgba(0,0,0,0) 38vmin,rgba(8,6,4,.92) 41vmin)';document.body.appendChild(r);GLASS.ring=r;
      const c=document.createElement('div');c.id='glass-card';c.style.cssText='position:fixed;left:50%;top:calc(50% + 24vmin);transform:translateX(-50%);pointer-events:none;z-index:41;display:none;padding:8px 14px;background:rgba(28,20,12,.86);border:1px solid #8a6a3a;border-radius:4px;color:#e8d8b0;font:14px Georgia,serif;text-align:center;min-width:180px';document.body.appendChild(c);GLASS.el=c;}
    if(GLASS.ring)GLASS.ring.style.display=on?'block':'none';if(GLASS.el&&!on)GLASS.el.style.display='none';}
  // what the card says of a ship: her trade, her build, her waters, and her bars when hurt
  function glassCard(o){const quest=String(o.id||'').startsWith('story:')||o.oswy;const trade=quest?(o.name||'The ship you are after'):o.kind==='pirate'?'A black sail':'A merchantman';
    const nk=typeof nationAt==='function'?nationAt(o.x,o.z):null,N=nk&&NATIONS[nk];const L=[trade,`${o.cls||'ship'}${N?' · in the waters of '+N.name:''}`];
    const hurt=[];if(o.hull<o.hullMax)hurt.push(`hull ${Math.max(0,Math.round(o.hull))} of ${o.hullMax}`);if(o.rig<100)hurt.push(`rig ${Math.max(0,Math.round(o.rig))} of 100`);if(hurt.length)L.push(hurt.join(' · '));
    return L;}
  // the ground under the line from the eye to a place, every 10 m: nothing over a ridge is sighted
  function glassClear(ex,ey,ez,tx,ty,tz){const d=Math.hypot(tx-ex,tz-ez),n=Math.floor(d/10);for(let k=1;k<n;k++){const f=k/n;if(worldH(ex+(tx-ex)*f,ez+(tz-ez)*f)>ey+(ty-ey)*f)return false;}return true;}
  const _glV=new THREE.Vector3();
  function glassLook(){const reach=glassReach();const out={ship:null,sighted:[]};if(!reach)return out;
    CAM.updateMatrixWorld();CAM.getWorldDirection(_glV);const dx=_glV.x,dy=_glV.y,dz=_glV.z,ex=CAM.position.x,ey=CAM.position.y,ez=CAM.position.z;
    const ang=(x,y,z)=>{const vx=x-ex,vy=y-ey,vz=z-ez,L=Math.hypot(vx,vy,vz)||1;return Math.acos(Math.max(-1,Math.min(1,(vx*dx+vy*dy+vz*dz)/L)));};
    let best=null,ba=Infinity;for(const o of OTHER){if(o.dead)continue;const d=Math.hypot(o.x-ex,o.z-ez);if(d>Math.min(GLASS_SHIP,reach))continue;
      const a=ang(o.x,SEA_Y+3,o.z),lim=Math.atan((o.L||12)/2/Math.max(1,d))+Math.PI/180;if(a<lim&&a<ba){ba=a;best=o;}}
    out.ship=best;
    // the narrow view's own frustum: half its height and half its width, from the zoomed field of view
    const vh=Math.atan(Math.tan(CAM.fov*Math.PI/360)),hh=Math.atan(Math.tan(vh)*(CAM.aspect||1.6)),yawV=Math.atan2(dx,dz);
    const [ci,cj]=cellOf(ex,ez);for(let j=cj-1;j<=cj+1;j++)for(let i=ci-1;i<=ci+1;i++){let c;try{c=getCell(i,j);}catch(e){continue;}if(!c)continue;
      for(const e of mapEntries(c)){if(!GLASS_KINDS[e.kind]||discovered(e.id)||glassSighted(e.id))continue;const d=Math.hypot(e.x-ex,e.z-ez);if(d>reach||d<1)continue;
        let h=Math.atan2(e.x-ex,e.z-ez)-yawV;while(h>Math.PI)h-=2*Math.PI;while(h<-Math.PI)h+=2*Math.PI;if(Math.abs(h)>hh)continue;
        const ty=worldH(e.x,e.z)+4,v=Math.atan2(ty-ey,d)-Math.asin(Math.max(-1,Math.min(1,dy)));if(Math.abs(v)>vh)continue;
        if(!glassClear(ex,ey,ez,e.x,ty,e.z))continue;out.sighted.push(e);}}
    return out;}
  // named action: a place sighted through the glass (the character's knowledge, like wdisc)
  function sightPlace(id,name){if(!worldState.sighted)worldState.sighted={};if(worldState.sighted[id]||discovered(id))return false;worldState.sighted[id]=1;
    showMsg(`Sighted: ${name}. Pencilled on your map.`,'#c8c0a8');if(typeof addLog==='function')addLog('🔭',`Sighted ${name} through the glass.`);return true;}
  function tickGlass(dt){if(!GLASS.up)return;
    const steps=!SHIP.sailing&&(K['KeyW']||K['KeyA']||K['KeyS']||K['KeyD']||K['ArrowUp']||K['ArrowDown']||K['ArrowLeft']||K['ArrowRight']||K['Space']);
    if(!hasGlass()||!glassCan()||PHP<GLASS.php||steps){glassDown();return;}GLASS.php=PHP;
    GLASS.t-=dt;if(GLASS.t>0)return;GLASS.t=.25;const R=glassLook();GLASS.ship=R.ship;for(const e of R.sighted)sightPlace(e.id,e.name);
    if(GLASS.el){if(R.ship){GLASS.el.innerHTML=glassCard(R.ship).map((l,i)=>i?`<div style="font-size:12px;color:#b8a880">${l}</div>`:`<div style="font-weight:600">${l}</div>`).join('');GLASS.el.style.display='block';}else GLASS.el.style.display='none';}}
  function rodPrompt(){if(NET.on)return 'Netting…';if(deckSchool())return "Press 'E' to cast the net";if(ROD.cast)return ROD.cast.told?"Press 'E' to strike":"Press 'E' to reel in";return rodSpot()?"Press 'E' to cast":null;}
  function rodAct(){if(NET.on)return true;{const ds=deckSchool();if(ds)return netCast(ds);}if(ROD.cast)return rodStrike();const s=rodSpot();return s?rodCast(s):false;}
  function fishPrompt(){return nearSchool()||nearTrout()?"Press 'E' to catch a fish":rodPrompt();}
  function catchFish(){const s=nearSchool();if(!s&&!isSwimming()&&(ROD.cast||NET.on||deckSchool()||rodSpot()))return rodAct();if(!s){const t=nearTrout();return t?takeTrout(t):false;}
    const [i,j]=cellOf(px,pz);const cl=climateOfCell(i,j);const bed=worldH(px,pz);
    // S605 — the catch rolls on the school's stream, `<chunk>:fish:<minute>` (co-op rules; a school is one a chunk, S508's key by place and minute)
    const R=seededRng('fish',(s.chunk||(Math.round(s.cx)+','+Math.round(s.cz)))+':fish:'+Math.floor(worldState.gameTimeAbsMinutes||0));
    const pool=(cl==='cold'&&R()<.5)?FISH_KINDS.cold:(cl==='warm'&&R()<.5)?FISH_KINDS.warm:bed<-5?FISH_KINDS.deep:FISH_KINDS.shallow;
    const name=pool[Math.floor(R()*pool.length)];const big=R()<.12;
    const item={name:(big?'Fine ':'')+name,ico:'🐟',type:'misc',weight:big?1.2:.6,sellMult:big?1.2:.7,buyPrice:big?26:9,qty:1,_typeKey:'fish',food:'fish'}; /* S2028 — a main for the pot */
    if(typeof canCarry==='function'&&!canCarry(item)){showMsg('Too heavy to carry!','#cc8844');return true;}
    if(typeof bagAdd==='function'){bagAdd(item);if(typeof gateGift==='function'&&gateGift('uisce')&&uisceWaters()&&(typeof canCarry!=='function'||canCarry(item)))bagAdd(Object.assign({},item));} /* S1359 — Uisce's face: two fish a catch in the Gatelands' waters */s.cool=18+R()*12;splash(false);showMsg(`Caught a ${item.name}.`,'#88cc88');if(typeof addLog==='function')addLog('🐟',`Caught a ${item.name}.`);return true;}
  function tickSchoolCool(dt){for(const s of LIFE.fish)if(s.cool>0)s.cool-=dt;tickRod();tickNet();tickNetted();tickGlass(dt);} /* S2214 — the rod's cast; S2215 — the net, and a netted school out of sight */
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
// S641 — the factor's panel (Michael's B on #192, the ship in hand, item 4): the harbourmaster's *Cargo* opens a parchment
// panel in place of the chat rows. One row per good: the ask (only the island's own goods are sold here), the bid, what you
// hold aboard and on your back, − and + a crate, and Fill (as many of one good as the hold takes and the purse pays for);
// under it the hold's bar, used of capacity. Every change goes through cargoBuy/cargoSell (84-world-interiors.js), so the
// prices, the 4% step, the tithe and where a crate goes are what they were in the chat. The crates on deck are the look's.
let cargoOpen=false,cargoSite=null,cargoSaid='';
function cargoNotes(site){const nk=cargoNation(site);let s='';
  if(nk==='aurenne')s+=` The Compact tithes every sale a tenth.`;
  if(cargoHard(site))s+=` Grain and iron are dear here: the town has been hard used.`;
  if(cargoAtWar(site))s+=` The war has put up iron and horses.`;
  if(cargoBlockaded(site))s+=` Black sails off the coast: goods from abroad are dearer.`;
  return s.trim();}
function cargoFill(site,key){const g=CARGO_GOODS[key];if(!g||g.home!==cargoNation(site))return 'That is not sold here.';
  if(!worldState.ship)return 'You have no ship to fill.';if(!shipHere(site))return `The ${SHIP.name} is not at this harbour.`;
  let n=0,paid=0;while(n<200&&holdUsed()+g.w<=holdCap()){const p=cargoAsk(site,key);if(gold<p)break;if(!/^Bought/.test(cargoBuy(site,key)))break;n++;paid+=p;}
  if(!n)return holdUsed()+g.w>holdCap()?'No room in the hold.':`A ${g.n.toLowerCase()} is ${cargoAsk(site,key)} gold.`;
  return `Took aboard ${n} × ${g.n.toLowerCase()} for ${paid} gold.`;}
function cargoPanelDraw(){const ov=document.getElementById('cargoui');if(!ov||!cargoSite)return;const site=cargoSite,nk=cargoNation(site),here=shipHere(site);
  const B='background:none;border:1px solid #8a7040;border-radius:3px;font:14px Georgia,serif;color:#3a2c18;cursor:pointer;padding:1px 7px;margin-left:3px';
  const keys=Object.keys(CARGO_GOODS).sort((a,b)=>(CARGO_GOODS[a].home===nk?0:1)-(CARGO_GOODS[b].home===nk?0:1));
  let h='<tr style="font-size:12px;color:#6a5a3a;text-align:right"><td style="text-align:left">Good</td><td>Ask</td><td>Bid</td><td>Held</td><td></td></tr>';
  for(const k of keys){const g=CARGO_GOODS[k],own=g.home===nk,hv=cargoHave(k),held=(here?hv.hold:0)+hv.bag,bid=cargoBid(site,k).net;
    const heldTxt=held?(hv.bag&&here&&hv.hold?`${hv.hold} + ${hv.bag}`:`${held}`):'—';
    h+=`<tr data-k="${k}" style="text-align:right"><td style="text-align:left">${g.n}</td><td>${own?cargoAsk(site,k):'—'}</td><td>${bid}</td><td title="aboard + carried">${heldTxt}</td><td style="white-space:nowrap">`+
      `<button type="button" data-a="sell" style="${B}"${held?'':' disabled'}>−</button><button type="button" data-a="buy" style="${B}"${own?'':' disabled'}>+</button>`+
      `<button type="button" data-a="fill" style="${B}"${own&&here?'':' disabled'}>Fill</button></td></tr>`;}
  ov.querySelector('#cargo-rows').innerHTML=h;
  for(const b of ov.querySelectorAll('#cargo-rows button')){if(b.disabled)b.style.opacity='.35';const k=b.closest('tr').dataset.k,a=b.dataset.a;
    b.onclick=()=>{cargoSaid=a==='buy'?cargoBuy(site,k):a==='sell'?cargoSell(site,k):cargoFill(site,k);cargoPanelDraw();};}
  const ship=worldState.ship,used=here?holdUsed():0,cap=here?holdCap():0;
  ov.querySelector('#cargo-hold').innerHTML=!ship?'You have no ship: what you buy, you carry.':!here?`The ${SHIP.name} is not at this harbour; what you buy, you carry.`:
    `The ${SHIP.name}'s hold: ${used} of ${cap}<div style="height:9px;margin-top:4px;border:1px solid #8a7040;background:rgba(138,112,64,.12)"><div id="cargo-bar" style="height:100%;width:${Math.min(100,Math.round(used/Math.max(1,cap)*100))}%;background:#8a6a3a"></div></div>`;
  ov.querySelector('#cargo-notes').textContent=cargoNotes(site);
  ov.querySelector('#cargo-said').textContent=cargoSaid;ov.querySelector('#cargo-gold').textContent=`Your purse: ${gold} gold`;}
function openCargoPanel(site){if(!site)return;
  if(typeof _releasePointerLockForMenu==='function')_releasePointerLockForMenu();
  let ov=document.getElementById('cargoui');
  if(!ov){ov=document.createElement('div');ov.id='cargoui';
    ov.style.cssText='position:fixed;inset:0;z-index:8500;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.35)';
    ov.innerHTML='<div style="width:560px;max-width:94vw;max-height:92vh;overflow:auto;padding:18px 22px;background:#e9dcc2;color:#3a2c18;border:6px double #8a7040;border-radius:6px;font-family:Georgia,serif;box-shadow:0 10px 40px #000a">'+
      '<div id="cargo-title" style="font-size:20px;letter-spacing:.04em;text-align:center"></div>'+
      '<div id="cargo-notes" style="font-size:13px;color:#6a5a3a;text-align:center;margin:4px 0 8px"></div>'+
      '<table id="cargo-rows" style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.7"></table>'+
      '<div id="cargo-hold" style="font-size:14px;margin:10px 0 4px"></div>'+
      '<div id="cargo-said" style="font-size:13px;color:#6a5a3a;text-align:center;min-height:18px"></div>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #a89060;padding-top:8px;margin-top:6px">'+
      '<span id="cargo-gold" style="font-size:14px"></span>'+
      '<button type="button" id="cargo-done" style="background:none;border:none;font:18px Georgia,serif;color:#3a2c18;cursor:pointer">Done</button></div></div>';
    document.body.appendChild(ov);ov.querySelector('#cargo-done').onclick=closeCargoPanel;}
  cargoSite=site;cargoSaid='';ov.querySelector('#cargo-title').textContent=`The factor’s board — ${site.name}`;
  ov.style.display='flex';cargoOpen=true;cargoPanelDraw();}
function closeCargoPanel(){const ov=document.getElementById('cargoui');if(ov)ov.style.display='none';cargoOpen=false;cargoSite=null;if(typeof G!=='undefined'&&G&&G.focus)G.focus();}
window.addEventListener('keydown',e=>{if(!cargoOpen)return;if(e.code==='Escape'||e.code==='KeyE'){if(!e.repeat)closeCargoPanel();e.preventDefault();e.stopPropagation();}},true);
// S642 — the yard panel (Michael's B on #192, the ship in hand, item 3): the shipwright's *Browse ships* opens a parchment
// slip. The hulls this yard sells down the left; the chosen one turning in the middle on a small stage of its own (its own
// renderer on a 320 × 240 canvas, built by buildShipMesh as the inspector builds it, drawn only while the slip is open); on
// the right her numbers on the helm's dial (a band from her bare speed to her speed under full sails), hull, hold and worth,
// and the yard's offers for her (yardOffers: the buy, a refit, the sails, the hold) with the shipwright's lines for answers.
// Mend, raise and fetch stay in his chat.
let yardOpen=false;const YARD={site:null,cls:'sloop',said:'',r:null,s:null,c:null,m:{},raf:0,last:0,yaw:0};
function yardDialSVG(bare,full){const ink='#2a2014';let t='';
  for(let k=0;k<=LOG_MAX;k+=5){const [x0,y0]=logPt(k,LOG_R-(k%10?5:8)),[x1,y1]=logPt(k,LOG_R);t+=`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${ink}" stroke-width="${k%10?1:1.6}"/>`;
    if(k%10===0){const [lx,ly]=logPt(k,LOG_R-16);t+=`<text x="${lx+(k===0?3:k===LOG_MAX?-3:0)}" y="${ly+(k%LOG_MAX?3:-3)}" text-anchor="middle" font-size="9" fill="${ink}">${k}</text>`;}}
  const [a0,b0]=logPt(bare,LOG_R+2),[a1,b1]=logPt(full,LOG_R+2),[nx,ny]=logPt(bare,LOG_R-4),[mx0,my0]=logPt(full,LOG_R-12),[mx1,my1]=logPt(full,LOG_R+4);
  const [ax,ay]=logPt(0,LOG_R),[bx,by]=logPt(LOG_MAX,LOG_R);
  return `<svg id="yard-dial" data-bare="${bare.toFixed(2)}" data-full="${full.toFixed(2)}" width="134" height="80" viewBox="0 0 134 80" style="display:block;margin:0 auto;font-family:Georgia,serif">`+
    `<path d="M${ax-4} ${ay} A${LOG_R+4} ${LOG_R+4} 0 0 1 ${bx+4} ${by} Z" fill="#f2e8cc" stroke="#a08a5a"/>`+
    `<path d="M${a0} ${b0} A${LOG_R+2} ${LOG_R+2} 0 0 1 ${a1} ${b1}" fill="none" stroke="#b08a30" stroke-width="5" opacity=".55"/>`+t+
    `<line x1="${mx0}" y1="${my0}" x2="${mx1}" y2="${my1}" stroke="#b08a30" stroke-width="3"/>`+
    `<line x1="${LOG_CX}" y1="${LOG_CY}" x2="${nx}" y2="${ny}" stroke="#8a2a1a" stroke-width="1.8" stroke-linecap="round"/>`+
    `<circle cx="${LOG_CX}" cy="${LOG_CY}" r="3" fill="${ink}"/></svg>`;}
function yardStage(){if(YARD.r)return true;const cv=document.getElementById('yard-cv');if(!cv)return false;
  try{YARD.r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});YARD.r.setSize(320,240,false);YARD.r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    YARD.s=new THREE.Scene();YARD.s.add(new THREE.AmbientLight(0xffffff,.6));const d=new THREE.DirectionalLight(0xfff0d0,.85);d.position.set(10,16,12);YARD.s.add(d);
    YARD.c=new THREE.PerspectiveCamera(30,320/240,.5,200);}catch(e){YARD.r=null;return false;}return true;}
function yardShow(cls){const C=SHIP_CLASSES[cls];if(!C||!yardStage())return;for(const k in YARD.m)YARD.m[k].visible=false;
  let m=YARD.m[cls];if(!m){try{m=buildShipMesh(C.L,C.W,'player',cls);} /* S683 — the stage shows each class on its own hull (S665's cutter and caravel), not the hull of her length */catch(e){return;}YARD.m[cls]=m;YARD.s.add(m);}
  const st=worldState.ship;if(st&&!st.sunk&&(st.cls||'sloop')===cls&&m.userData.kit===herDress()&&typeof shipSwatchOn==='function'){shipSwatchOn(m);if(typeof shipBannerOn==='function')shipBannerOn(m);} /* S1845 — her own hull on the stage wears her colours; S1922 — and her banner */
  m.visible=true;const d=C.L*1.9;YARD.c.position.set(0,C.L*.55,d);YARD.c.lookAt(0,2.2,0);}
function yardLoop(){if(!yardOpen){YARD.raf=0;return;}YARD.raf=requestAnimationFrame(yardLoop);const now=performance.now(),dt=Math.min(.1,(now-(YARD.last||now))/1000);YARD.last=now;
  YARD.yaw+=dt*.35;const m=YARD.m[YARD.cls];if(m)m.rotation.y=YARD.yaw;if(YARD.r)try{YARD.r.render(YARD.s,YARD.c);}catch(e){}}
function yardPanelDraw(){const ov=document.getElementById('yardui');if(!ov||!YARD.site)return;const site=YARD.site,hulls=yardHulls(site),st=worldState.ship;
  if(!hulls.includes(YARD.cls))YARD.cls=hulls[0];const cls=YARD.cls,C=SHIP_CLASSES[cls],mine=st&&!st.sunk?(st.cls||'sloop'):null;
  const B='display:block;width:100%;text-align:left;background:none;border:none;border-left:3px solid transparent;font:16px Georgia,serif;color:#3a2c18;cursor:pointer;padding:4px 8px;text-transform:capitalize';
  ov.querySelector('#yard-list').innerHTML=hulls.map(k=>`<button type="button" data-cls="${k}" style="${B}${k===cls?';border-left-color:#8a6a3a;background:rgba(138,112,64,.15)':''}">${k}${k===mine?' <span style="font-size:12px;color:#6a5a3a;text-transform:none">(yours)</span>':''}</button>`).join('');
  for(const b of ov.querySelectorAll('#yard-list button'))b.onclick=()=>{YARD.cls=b.dataset.cls;YARD.said='';yardPanelDraw();};
  const bare=C.speed,full=C.speed*(1+(SAIL_TIERS.length-1)*SAIL_STEP);
  let h=yardDialSVG(bare,full)+`<div id="yard-kn" style="text-align:center;font-size:13px;margin-bottom:6px">${bare.toFixed(1)} kn bare, ${full.toFixed(1)} under full sails</div>`+
    `<table style="width:100%;font-size:14px;line-height:1.6"><tr><td>Hull</td><td style="text-align:right">${C.hull}</td></tr><tr><td>Hold</td><td style="text-align:right">${CARGO_HOLD[cls]}</td></tr><tr><td>Worth</td><td style="text-align:right">${C.worth} gold</td></tr>`;
  if(mine)h+=`<tr><td>Yours, a ${mine}</td><td style="text-align:right">${SHIP_CLASSES[mine].worth} gold</td></tr>`;
  if(mine===cls)h+=`<tr><td>Sails</td><td style="text-align:right">tier ${st.sails||0} of ${SAIL_TIERS.length-1}</td></tr><tr><td>Her hold now</td><td style="text-align:right">${holdCap()}</td></tr><tr><td>Places</td><td style="text-align:right">${shipPlacesUsed(st)} of ${shipPlaces(cls)}</td></tr><tr><td>Fitted</td><td style="text-align:right">${shipFitNames([...Array(st.cargo||0).fill('stowage'),...shipFitList(st)]).join(', ')||'nothing'}</td></tr>`; /* S1726 — #979 B: her places and fittings */
  h+='</table>';ov.querySelector('#yard-info').innerHTML=h;
  const offers=yardOffers(site).filter(o=>o.cls===cls);let note='';
  if(st&&st.sunk){const n=st.name||SHIP.name;if(st.raise){const d=Math.max(1,Math.ceil((st.raise.due-(worldState.gameTimeAbsMinutes||0))/1440)),y=(siteAnywhere(st.raise.site)||{}).name||'the quay';note=`The ${n} lies on the bottom. The yard at ${y} is raising her: ${d===1?'one day':d+' days'} yet.`;}else note=`The ${n} lies on the bottom. Ask about raising her.`;}
  else if(!st&&cls!=='sloop')note=`Sold as a sloop; refitted as a ${cls} for ${refitCost('sloop',cls)} gold more.`;
  const A='display:block;width:100%;margin-top:6px;background:none;border:1px solid #8a7040;border-radius:3px;font:15px Georgia,serif;color:#3a2c18;cursor:pointer;padding:4px 8px';
  ov.querySelector('#yard-acts').innerHTML=offers.map((o,i)=>`<button type="button" data-i="${i}" style="${A}">${o.label}</button>`).join('')+(note?`<div style="font-size:13px;color:#6a5a3a;margin-top:6px">${note}</div>`:'');
  if(mine&&mine===cls){const nm=st.name||SHIP.name||'';ov.querySelector('#yard-acts').insertAdjacentHTML('beforeend',`<div style="margin-top:10px;font-size:13px;color:#6a5a3a">Her name</div><input id="yard-name" type="text" maxlength="${SHIP_NAME_MAX+4}" value="${nm}" style="width:100%;box-sizing:border-box;margin-top:2px;font:15px Georgia,serif;color:#3a2c18;background:#f4ead6;border:1px solid #8a7040;border-radius:3px;padding:3px 6px"><button type="button" id="yard-rename" style="${A}">Rename her</button>`); /* S1834 — renaming her is free (#979 B, session 5) */
    const inp=ov.querySelector('#yard-name'),go=()=>{const was=worldState.ship.name||SHIP.name,r=renameShip(inp.value);YARD.said=r&&r!==was?`Renamed: the ${r}.`:'';yardPanelDraw();};
    ov.querySelector('#yard-rename').onclick=go;inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Enter'){e.preventDefault();go();}else if(e.code==='Escape'){closeYardPanel();}});}
  if(mine&&mine===cls){const W=shipSwatches(),acts=ov.querySelector('#yard-acts'); /* S1845 — her paint and her sails (#979 B, session 5) */
    if(W&&nationAt(site.x,site.z)===herDress()){const chip=c=>`<span style="display:inline-block;width:12px;height:12px;margin-right:6px;vertical-align:-1px;border:1px solid #6a5a3a;background:${c}"></span>`;
      const hex=n=>'#'+(n>>>0).toString(16).padStart(6,'0');
      const row=(k,L,col)=>`<div style="margin-top:10px;font-size:13px;color:#6a5a3a">${k==='paint'?'Her paint':'Her sails'} (${YARD_PAINT.gold} gold, an hour)</div>`+L.map((o,i)=>`<button type="button" data-paint="${k}" data-v="${i}" style="${A};text-transform:capitalize${(st[k]|0)===i?';border-width:2px;font-weight:bold':''}">${chip(col(o))}${o.name}${(st[k]|0)===i?' <span style="font-size:12px;font-weight:normal;text-transform:none">(hers)</span>':''}</button>`).join('');
      acts.insertAdjacentHTML('beforeend',row('paint',W.paints,o=>hex(o.hex))+row('cloth',W.cloths,o=>o.base||(o.cloths&&o.cloths[0])||'#ccc'));
      for(const b of acts.querySelectorAll('button[data-paint]'))b.onclick=e=>{e.stopPropagation();const k=b.dataset.paint,v=+b.dataset.v,r=paintShip(k,v,site),W2=shipSwatches(),L2=k==='paint'?W2.paints:W2.cloths;
        YARD.said=r===true?(k==='paint'?`Painted ${L2[v].name}.`:`${L2[v].name[0].toUpperCase()+L2[v].name.slice(1)} sails.`):r;yardPanelDraw();};}
    else if(W)acts.insertAdjacentHTML('beforeend',`<div style="font-size:13px;color:#6a5a3a;margin-top:10px">This yard paints only ships of its own island’s build. A refit here would give her its lines and its colours.</div>`);
    if(typeof PKIT!=='undefined'&&PKIT.ships&&PKIT.ships.BANNERS){const flies=st.banner||''; /* S1922 — her banner (#979 B, session 5; #1150 A) at any yard */
      acts.insertAdjacentHTML('beforeend',`<div style="margin-top:10px;font-size:13px;color:#6a5a3a">Her banner (${YARD_PAINT.gold} gold, an hour)</div>`+SHIP_FLAGS.map(v=>{const B=v&&PKIT.ships.BANNERS[v],on=flies===v;
        return `<button type="button" data-flag="${v}" style="${A}${on?';border-width:2px;font-weight:bold':''}">${B?`<span style="display:inline-block;width:12px;height:12px;margin-right:6px;vertical-align:-1px;border:1px solid #6a5a3a;background:${B.field};box-shadow:inset 0 -3px ${B.trim}"></span>`+B.name[0].toUpperCase()+B.name.slice(1)+'’s':'None'}${on?' <span style="font-size:12px;font-weight:normal">(hers)</span>':''}</button>`;}).join(''));
      for(const b of acts.querySelectorAll('button[data-flag]'))b.onclick=e=>{e.stopPropagation();const v=b.dataset.flag,r=bannerShip(v);
        YARD.said=r===true?(v?`She flies ${bannerName(v)} banner.`:'Her banner is struck.'):r;yardPanelDraw();};}}
  for(const b of ov.querySelectorAll('#yard-acts button[data-i]'))b.onclick=()=>{const o=offers[+b.dataset.i];const r=o.fn();YARD.said=typeof r==='string'?r:'';if(worldState.ship&&!worldState.ship.sunk)YARD.cls=yardHulls(site).includes(worldState.ship.cls||'sloop')?(worldState.ship.cls||'sloop'):YARD.cls;yardPanelDraw();};
  ov.querySelector('#yard-said').textContent=YARD.said;ov.querySelector('#yard-gold').textContent=`Your purse: ${gold} gold`;
  yardShow(cls);}
function openYardPanel(site){if(!site)return;
  if(typeof _releasePointerLockForMenu==='function')_releasePointerLockForMenu();
  let ov=document.getElementById('yardui');
  if(!ov){ov=document.createElement('div');ov.id='yardui';
    ov.style.cssText='position:fixed;inset:0;z-index:8500;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.35)';
    ov.innerHTML='<div style="width:820px;max-width:96vw;max-height:94vh;overflow:auto;padding:18px 22px;background:#e9dcc2;color:#3a2c18;border:6px double #8a7040;border-radius:6px;font-family:Georgia,serif;box-shadow:0 10px 40px #000a">'+
      '<div id="yard-title" style="font-size:20px;letter-spacing:.04em;text-align:center"></div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:14px;margin:12px 0;align-items:flex-start;justify-content:center">'+
      '<div id="yard-list" style="width:130px;flex:none"></div>'+
      '<canvas id="yard-cv" width="320" height="240" style="width:320px;height:240px;max-width:100%;background:rgba(40,28,12,.85);border:1px solid #a89060;border-radius:4px;flex:none"></canvas>'+
      '<div style="width:220px;flex:none"><div id="yard-info"></div><div id="yard-acts"></div></div></div>'+
      '<div id="yard-said" style="font-size:14px;color:#5a4426;text-align:center;min-height:20px;font-style:italic"></div>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #a89060;padding-top:8px;margin-top:6px">'+
      '<span id="yard-gold" style="font-size:14px"></span>'+
      '<button type="button" id="yard-done" style="background:none;border:none;font:18px Georgia,serif;color:#3a2c18;cursor:pointer">Done</button></div></div>';
    document.body.appendChild(ov);ov.querySelector('#yard-done').onclick=closeYardPanel;}
  YARD.site=site;YARD.said='';const st=worldState.ship;YARD.cls=st&&!st.sunk&&yardHulls(site).includes(st.cls||'sloop')?(st.cls||'sloop'):'sloop';
  ov.querySelector('#yard-title').textContent=`The yard at ${site.name}`;
  ov.style.display='flex';yardOpen=true;yardPanelDraw();YARD.last=0;if(!YARD.raf)YARD.raf=requestAnimationFrame(yardLoop);}
function closeYardPanel(){const ov=document.getElementById('yardui');if(ov)ov.style.display='none';yardOpen=false;YARD.site=null;if(typeof G!=='undefined'&&G&&G.focus)G.focus();}
window.addEventListener('keydown',e=>{if(!yardOpen)return;if(e.target&&e.target.id==='yard-name')return; /* S1834 — typing her name: E is a letter there */if(e.code==='Escape'||e.code==='KeyE'){if(!e.repeat)closeYardPanel();e.preventDefault();e.stopPropagation();}},true);
