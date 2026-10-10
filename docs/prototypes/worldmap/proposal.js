// The world map, proposed (concept artist, 9 Oct 2026; backlog E, Michael's notes of 5 Oct: quest markers on the overworld map,
// and the map often blurry). A plain script loaded after the game: every function here replaces the one of the same name in
// js/83-world-generator.js (they are globals since Session 484), so the builder can lift each one over its namesake.
//
// Why today's map is blurry (measured by shoot-current.mjs, see current.json):
//  1. The canvas is sized in CSS pixels (`root.width = r.width`), so on a screen with devicePixelRatio 2 every tile, line,
//     icon and letter is drawn at half resolution and stretched by the browser.
//  2. A province's fine tile (320 px) is built by `mapJobs`, which does ONE 12-row step a frame and breaks (the `break` after
//     a step that did not finish), whatever its 24 ms budget: 54 frames a tile, one tile at a time. Until it lands the
//     province is its 48 px coarse tile stretched to 150–320 px: mush for nine seconds after opening on nine provinces.
//  3. Past 320 px a province (zoom ×1.05 from where the map opens) the fine tile is only stretched further; at the deepest
//     zoom one tile pixel covers 12 screen pixels.
// The fix, below: the canvas at CSS × devicePixelRatio, drawn in CSS units through setTransform; tiles in a quadtree (a
// province, its quarters, their quarters… five levels) chosen so a tile pixel is never more than 1.15 screen pixels; the
// jobs spending their budget (8 ms a frame) across tiles nearest the middle first; and a tile not ready drawn from the
// best finished ancestor, cropped, never from the 48 px tile once anything finer exists.
//
// Why quest markers don't work: the map has its own list (`questMarkers`, 87-world-quests.js) and the compass another
// (`compassMarkers`). The map's misses a job that is done (no "report to" mark: the compass has one), a find quest's
// person on the move, a townsperson's directions, faction and war and guild marks, Corwin, and Act I's givers; and the map
// draws none at all below 60 px a province (the whole continent), nor says where a mark off the edge is.
// The fix: `mapMarks()` is the compass's list, each mark carrying its quest's name and line; every mark is drawn at every
// zoom as a numbered wax seal (red: go there; gilt: report back; blue: directions), off-edge marks sit on the frame as an
// arrow with their number and distance, and the panel lists them when nothing is hovered (a click centres the map on one).
(function(){
  const DPR=()=>Math.max(1,Math.min(3,window.devicePixelRatio||1));
  const TQ=256;           // a quadtree tile is 256×256
  const LMAX=5;           // a province, then quarters down to 1/32 of a side (75 units: 0.29 u a tile pixel)
  // ── 1. CSS units for the maths, device pixels for the store ──
  window.baseScale=function(){return Math.min(MAP.cssW||MAP.cv.width,MAP.cssH||MAP.cv.height)/(SIZE*GRID);};
  window.mapClamp=function(){const s=baseScale()*MAP.zoom,w=SIZE*GRID*s,cw=MAP.cssW,ch=MAP.cssH;MAP.ox=Math.min(Math.max(MAP.ox,cw-w-60),60);MAP.oy=Math.min(Math.max(MAP.oy,ch-w-60),60);if(w<cw)MAP.ox=(cw-w)/2;if(w<ch)MAP.oy=(ch-w)/2;};
  window.visibleCells=function(){const [x0,z0]=screenToMap(0,0),[x1,z1]=screenToMap(MAP.cssW||MAP.cv.width,MAP.cssH||MAP.cv.height);const out=[];for(let j=Math.max(0,Math.floor(z0/SIZE));j<=Math.min(GRID-1,Math.floor(z1/SIZE));j++)for(let i=Math.max(0,Math.floor(x0/SIZE));i<=Math.min(GRID-1,Math.floor(x1/SIZE));i++)out.push(getCell(i,j));return out;};
  function mapFit(){const pane=document.getElementById('wm-map-pane'),root=MAP.cv;if(!pane||!root)return;const r=pane.getBoundingClientRect(),d=DPR();
    MAP.cssW=Math.max(300,r.width|0);MAP.cssH=Math.max(300,r.height|0);root.width=Math.round(MAP.cssW*d);root.height=Math.round(MAP.cssH*d);MAP.dpr=d;}
  const _openMap=openMap;
  window.openMap=function(){_openMap();mapFit();
    MAP.zoom=Math.max(1,Math.min(64,(Math.min(MAP.cssW,MAP.cssH)*.55)/(SIZE*baseScale())));const s=baseScale()*MAP.zoom;MAP.ox=MAP.cssW/2-px*s;MAP.oy=MAP.cssH/2-pz*s;mapClamp();MAP.dirty=true;mapDraw();};
  WORLD.openMap=window.openMap;   // the hub opens the map through the export (66-hub.js), so the export takes the new one too
  window.addEventListener('resize',()=>{if(MAP.cv&&MAP.cv.style.display!=='none'){mapFit();mapClamp();MAP.dirty=true;}});
  // ── 2. quadtree tiles ──
  // A tile is (cell, L, qi, qj): the cell's square cut in 2^L a side, tile (qi,qj) of those, at TQ px (fewer when the whole
  // province is smaller than that on the screen). Heights first, then pixels, as tileStep does; the relief is shaded by the
  // slope per world unit, so a deep tile is shaded as strongly as a province tile (tileStep's .045 at 7.5 u a pixel).
  function qKey(c,L,qi,qj,res){return 'q'+c.i+','+c.j+':'+L+':'+qi+','+qj+':'+res;}
  function startQ(c,L,qi,qj,res){const key=qKey(c,L,qi,qj,res);let t=MAP.tiles.get(key);if(t)return t;
    const span=SIZE/(1<<L);const cv=document.createElement('canvas');cv.width=res;cv.height=res;const ctx=cv.getContext('2d');
    t={cv,ctx,img:ctx.createImageData(res,res),H:new Float32Array((res+1)*(res+1)),row:0,hrow:0,done:false,cell:c,res,L,qi,qj,span,step:span/res,X0:c.ox+qi*span,Z0:c.oz+qj*span,q:true};
    MAP.tiles.set(key,t);MAP.jobs.push(t);return t;}
  function stepQ(t,budgetMs,t0){const {res,step,H,X0,Z0}=t;
    withCellData(t.cell,()=>{
      while(t.hrow<=res&&performance.now()-t0<budgetMs){const j=t.hrow;for(let i=0;i<=res;i++)H[j*(res+1)+i]=worldH(X0+i*step,Z0+j*step);t.hrow++;}
      if(t.hrow<=res)return;const d=t.img.data,px3=[0,0,0],k=.675/(2*step);
      while(t.row<res&&performance.now()-t0<budgetMs){const j=t.row;
        for(let i=0;i<res;i++){const h=H[j*(res+1)+i];
          const hx=H[j*(res+1)+Math.min(res,i+1)]-H[j*(res+1)+Math.max(0,i-1)],hz=H[Math.min(res,j+1)*(res+1)+i]-H[Math.max(0,j-1)*(res+1)+i];
          const shade=Math.max(.72,Math.min(1.22,1+(-hx-hz)*k));mapPixel(X0+i*step,Z0+j*step,h,shade,px3);const o=(j*res+i)*4;d[o]=px3[0];d[o+1]=px3[1];d[o+2]=px3[2];d[o+3]=255;}
        t.row++;}
      if(t.row>=res){t.ctx.putImageData(t.img,0,0);
        if(t.step<=10){const c=t.ctx,gap=Math.max(4,Math.round(45/t.step/1.5));c.strokeStyle='rgba(60,90,110,.22)';c.lineWidth=1;   // the hatched water, its lines 45 u apart whatever the zoom
          for(let j=gap>>1;j<res;j+=gap){c.beginPath();let on=false;for(let i=0;i<res;i++){const h=H[j*(res+1)+i];if(h<-.6){if(!on){c.moveTo(i,j);on=true;}else c.lineTo(i,j);}else on=false;}c.stroke();}}
        t.H=null;t.img=null;t.done=true;MAP.dirty=true;}
    });}
  // the jobs: 8 ms a frame, spent across tiles, nearest the middle of the view first (wanted is refreshed by each draw)
  window.mapJobs=function(){const t0=performance.now();
    MAP.jobs=MAP.jobs.filter(t=>!t.done&&(!t.q||t.want>=MAP.drawN-2));   // a tile scrolled out of view waits; it is queued again when seen
    MAP.jobs.sort((a,b)=>(a.pri||0)-(b.pri||0));
    for(const t of MAP.jobs){if(performance.now()-t0>=8)break;if(t.q)stepQ(t,8,t0);else tileStep(t,1e9);}
    MAP.jobs=MAP.jobs.filter(t=>!t.done);};
  function levelFor(cellPxDev){if(cellPxDev<=TQ*1.15)return 0;return Math.min(LMAX,Math.ceil(Math.log2(cellPxDev/(TQ*1.15))));}
  function resFor(cellPxDev,L){if(L>0)return TQ;return Math.max(32,Math.min(TQ,Math.ceil(cellPxDev/32)*32));}
  // draw one province: its coarse 48 tile (always there), then each visible quad tile, or the best finished ancestor cropped
  function drawCell(ctx,c,cellPx,cw,ch){
    const [sx,sy]=mapToScreen(c.ox,c.oz);const co=MAP.tiles.get(tileKey(c.i,c.j,TILE_C))||startTile(c,TILE_C);
    ctx.imageSmoothingQuality='high';ctx.drawImage(co.cv,sx,sy,cellPx,cellPx);
    const dev=cellPx*MAP.dpr,L=levelFor(dev),res=resFor(dev,L),n=1<<L,tp=cellPx/n;
    const i0=Math.max(0,Math.floor(-sx/tp)),i1=Math.min(n-1,Math.floor((cw-sx)/tp)),j0=Math.max(0,Math.floor(-sy/tp)),j1=Math.min(n-1,Math.floor((ch-sy)/tp));
    for(let qj=j0;qj<=j1;qj++)for(let qi=i0;qi<=i1;qi++){
      const t=startQ(c,L,qi,qj,res);t.want=MAP.drawN;if(!t.done&&!MAP.jobs.includes(t))MAP.jobs.push(t);const tx=sx+qi*tp,ty=sy+qj*tp;t.pri=L*1e-3+Math.hypot(tx+tp/2-cw/2,ty+tp/2-ch/2);
      if(t.done){ctx.drawImage(t.cv,tx,ty,tp+.5,tp+.5);continue;}
      for(let a=L-1;a>=0;a--){const sh=L-a,ai=qi>>sh,aj=qj>>sh;let best=null;   // an ancestor, any resolution that finished
        for(const r of [TQ,224,192,160,128,96,64,32]){const u=MAP.tiles.get(qKey(c,a,ai,aj,r));if(u&&u.done){best=u;break;}}
        if(best){const f=best.res/(1<<sh);ctx.drawImage(best.cv,(qi-(ai<<sh))*f,(qj-(aj<<sh))*f,f,f,tx,ty,tp+.5,tp+.5);break;}}
    }}
  // ── 3. the marks: one list for the compass and the map ──
  const GO='#9a2a20',BACK='#b8862a',WAYC='#3f6488';
  function inRange(m){return m&&isFinite(m.x)&&isFinite(m.z);}
  window.mapMarks=function(){const out=[];const add=m=>{if(inRange(m))out.push(m);};
    for(const q of qActive()){const d=q.data||{};let x=null,z=null,line=q.objective,st='go';
      if(q.done){const g=q.giverSite?siteAnywhere(q.giverSite):null;if(g){x=g.x;z=g.z;}line=`Report to ${q.giver}`;st='back';}
      else if(q.kind==='deliver'){const t=siteAnywhere(d.siteId);if(t){x=t.x;z=t.z;}}
      else if(q.kind==='find'&&q._npc&&q._npc.g){x=q._npc.g.position.x;z=q._npc.g.position.z;}
      else if(q.kind==='retrieve'&&d.got){const g=siteAnywhere(q.giverSite);if(g){x=g.x;z=g.z;}line=`Bring ${d.item} to ${q.giver}`;st='back';}
      else if(q.kind==='duel'&&d.state==='lost')continue;
      else{x=d.x;z=d.z;}
      add({id:'mk_'+q.id,title:q.title,line,x,z,st,due:q.due});}
    const G=worldState.guild;if(G)for(const g in G){const t=G[g].active;if(!t)continue;const done=taskDone(t);
      let x=t.sx!=null?t.sx:t.x!=null?t.x:(t.siteId?(siteAnywhere(t.siteId)||{}).x:null),z=t.sz!=null?t.sz:t.z!=null?t.z:(t.siteId?(siteAnywhere(t.siteId)||{}).z:null);
      add({id:'mk_g_'+g,title:t.title||t.short,line:done?'Report to the guild':t.short,x,z,st:done?'back':'go'});}
    // everything else the compass shows (the story, directions, factions, war, the guilds' own marks, rubbings, Act I's givers)
    let comp=[];try{comp=compassMarkers();}catch(e){}
    for(const m of comp){if(out.some(o=>Math.hypot(o.x-m.x,o.z-m.z)<30))continue;const way=typeof WAY!=='undefined'&&WAY&&m.x===WAY.x&&m.z===WAY.z;
      add({id:'mk_c_'+Math.round(m.x)+'_'+Math.round(m.z),title:way?'Directions':(m.label||'').replace(/^report to /,'Report to '),line:way?`${m.label}, as you were told`:'',x:m.x,z:m.z,st:way?'way':(m.col===RED?'go':'go')});}
    out.forEach((m,i)=>m.n=i+1);return out;};
  function seal(ctx,m,r,on){const col=m.st==='back'?BACK:m.st==='way'?WAYC:GO;
    ctx.save();if(on){ctx.beginPath();ctx.arc(0,0,r+6,0,Math.PI*2);ctx.fillStyle='rgba(255,236,170,.45)';ctx.fill();}
    ctx.beginPath();for(let k=0;k<14;k++){const a=k/14*Math.PI*2,rr=r*(k%2?1:.9);ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();   // the wax's crimped edge
    ctx.fillStyle=col;ctx.shadowColor='rgba(30,15,5,.45)';ctx.shadowBlur=3;ctx.shadowOffsetY=1;ctx.fill();ctx.shadowColor='transparent';
    ctx.lineWidth=1;ctx.strokeStyle='rgba(30,12,6,.7)';ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.66,0,Math.PI*2);ctx.strokeStyle='rgba(255,230,190,.45)';ctx.stroke();
    ctx.fillStyle='#fbefd6';ctx.font=`700 ${Math.round(r*1.05)}px Georgia, serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(m.st==='back'?'✓':String(m.n),0,1);ctx.restore();}
  function label(ctx,text,x,y,size,italic){ctx.font=`${italic?'italic ':''}600 ${size}px Georgia, serif`;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineJoin='round';ctx.lineWidth=3.5;ctx.strokeStyle='rgba(244,233,206,.92)';ctx.strokeText(text,x,y);ctx.fillStyle='#2a1c10';ctx.fillText(text,x,y);}
  function fmtDist(m){const d=Math.hypot(m.x-px,m.z-pz);if(d<40)return 'here';return d>=1000?(d/1000).toFixed(1).replace(/\.0$/,'')+'k u':Math.round(d/10)*10+' u';}
  function drawMarks(ctx,cw,ch,cellPx){MAP._marks=[];if(MAP.filt.quests===false)return;const marks=mapMarks();const r=cellPx<100?8:10;
    // seals on one spot (a cull and a report-back both at the town) stand side by side, not on top of each other
    const at=marks.map(m=>mapToScreen(m.x,m.z));for(let a=0;a<marks.length;a++){if(at[a].fanned)continue;const grp=[a];for(let b=a+1;b<marks.length;b++)if(!at[b].fanned&&Math.hypot(at[a][0]-at[b][0],at[a][1]-at[b][1])<2*r)grp.push(b);
      if(grp.length>1){const [ax,ay]=at[a];grp.forEach((g,k)=>{at[g]=[ax+(k-(grp.length-1)/2)*(2*r+3),ay];at[g].fanned=true;});}}
    // a label goes only where it is clear of the other marks' labels
    const boxes=[],edges=[];const free=(x,y,w,h)=>{if(boxes.some(b=>x<b[0]+b[2]&&x+w>b[0]&&y<b[1]+b[3]&&y+h>b[1]))return false;boxes.push([x,y,w,h]);return true;};
    for(let mi=0;mi<marks.length;mi++){const m=marks[mi];const [sx,sy]=at[mi];const on=MAP.hover===m.id||MAP.sel===m.id;
      if(sx>=-r&&sy>=-r&&sx<=cw+r&&sy<=ch+r){MAP._marks.push({m,sx,sy});ctx.save();ctx.translate(sx,sy-r-4);
        ctx.beginPath();ctx.moveTo(0,r+4);ctx.lineTo(-3,r-1);ctx.lineTo(3,r-1);ctx.closePath();ctx.fillStyle='rgba(40,20,10,.85)';ctx.fill();   // the seal's tag points at the spot
        seal(ctx,m,r,on);if(cellPx>=100||on){ctx.font='italic 600 12px Georgia, serif';const w=ctx.measureText(m.title).width+6;if(on||free(sx-w/2,sy-2*r-24,w,15))label(ctx,m.title,0,-r-5,12,true);}ctx.restore();continue;}
      // off the edge: a seal on the frame, an arrow towards the mark, and how far
      const cx=cw/2,cy=ch/2,dx=sx-cx,dy=sy-cy,pad=26,kx=(cw/2-pad)/Math.abs(dx||1e-6),ky=(ch/2-pad)/Math.abs(dy||1e-6),k=Math.min(kx,ky),a=Math.atan2(dy,dx);let ex=cx+dx*k,ey=cy+dy*k;
      const side=kx<ky;for(let g=0;g<12&&edges.some(e=>Math.hypot(e[0]-ex,e[1]-ey)<2*r+22);g++){if(side)ey+=(ey>cy?-1:1)*(2*r+22);else ex+=(ex>cx?-1:1)*(2*r+22);}edges.push([ex,ey]);   // marks off the same side stack along the frame
      MAP._marks.push({m,sx:ex,sy:ey,edge:true});ctx.save();ctx.translate(ex,ey);ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(r+9,0);ctx.lineTo(r+1,-5);ctx.lineTo(r+1,5);ctx.closePath();ctx.fillStyle=m.st==='back'?BACK:m.st==='way'?WAYC:GO;ctx.fill();ctx.restore();
      seal(ctx,m,r-1,on);const ly=ey>ch/2?-r-6:r+15;label(ctx,fmtDist(m),0,ly,11,false);ctx.restore();}}
  window.mapPickMark=function(sx,sy){let best=null,bd=14;(MAP._marks||[]).forEach(o=>{const d=Math.hypot(sx-o.sx,sy-(o.edge?o.sy:o.sy-14));if(d<bd){bd=d;best=o.m;}});return best;};
  // the panel with nothing hovered: the marks, numbered as on the map, nearest first
  const _mapPanel=mapPanel;
  window.mapPanel=function(e){if(e&&!e._mark)return _mapPanel(e);const body=document.getElementById('wm-panel-body');if(!body)return;
    if(e&&e._mark){const m=e._mark;body.innerHTML=`<div class="mk-head">${m.title}</div><div class="mk-line">${m.line||''}</div><div class="mk-line">${fmtDist(m)}${Math.hypot(m.x-px,m.z-pz)<40?'':' '+compassWord(m.x-px,m.z-pz)+' of you'}</div>`;return;}
    const marks=mapMarks();if(!marks.length)return _mapPanel(null);
    body.innerHTML=`<div class="mk-sec">Where your work is</div>`+marks.map(m=>`<div class="mk-row" data-id="${m.id}"><span class="mk-n mk-${m.st}">${m.st==='back'?'✓':m.n}</span><span><b>${m.title}</b><br><i>${m.line||''}</i><br><small>${fmtDist(m)}${Math.hypot(m.x-px,m.z-pz)<40?'':' '+compassWord(m.x-px,m.z-pz)}</small></span></div>`).join('');
    body.querySelectorAll('.mk-row').forEach(el=>el.onclick=()=>{const m=mapMarks().find(o=>o.id===el.dataset.id);if(!m)return;const s=baseScale()*MAP.zoom;MAP.ox=MAP.cssW/2-m.x*s;MAP.oy=MAP.cssH/2-m.z*s;mapClamp();MAP.sel=m.id;MAP.dirty=true;});};
  const st=document.createElement('style');st.textContent=`
    .mk-sec{font:600 11px Georgia,serif;letter-spacing:.14em;text-transform:uppercase;color:#c8b880;margin:0 0 8px}
    .mk-row{display:flex;gap:8px;align-items:flex-start;padding:6px 4px;border-bottom:1px solid rgba(120,100,60,.25);cursor:pointer;font:12px/1.35 Georgia,serif;color:#e8dcc0}
    .mk-row:hover{background:rgba(200,168,74,.08)} .mk-row i{color:#b8a880} .mk-row small{color:#8a7a60}
    .mk-n{flex:0 0 20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 11px Georgia,serif;color:#fbefd6;background:${GO}}
    .mk-n.mk-back{background:${BACK}} .mk-n.mk-way{background:${WAYC}}
    .mk-head{font:600 16px Georgia,serif;color:#e8d8a0} .mk-line{color:#b8a880;font-size:12px;margin-top:4px}`;document.head.appendChild(st);
  // ── 4. mapDraw: today's, with the store at device pixels, the quadtree tiles and the marks ──
  window.mapDraw=function(){
    const ctx=MAP.ctx;if(!ctx)return;if(!MAP.cssW)mapFit();MAP.drawN=(MAP.drawN||0)+1;const d=MAP.dpr||1,cw=MAP.cssW,ch=MAP.cssH;
    ctx.setTransform(d,0,0,d,0,0);
    ctx.fillStyle='#2b241a';ctx.fillRect(0,0,cw,ch);
    if(MAP.mode==='local'){const size=Math.min(cw,ch);ctx.save();ctx.translate((cw-size)/2,(ch-size)/2);drawLocalMap(ctx,size,130,true);ctx.restore();MAP.dirty=true;return;}
    const s=baseScale()*MAP.zoom,cellPx=SIZE*s;
    const cells=visibleCells();
    const [pi,pj]=cellOf(px,pz);
    for(const c of cells){drawCell(ctx,c,cellPx,cw,ch);
      const [sx,sy]=mapToScreen(c.ox,c.oz);
      if(c.type!=='sea'&&!(c.i===pi&&c.j===pj)&&!c.sites.some(x=>discovered(x.id))){ctx.fillStyle='rgba(60,40,20,.22)';ctx.fillRect(sx,sy,cellPx,cellPx);}}
    if(cellPx>=140){ctx.strokeStyle='rgba(40,28,14,.25)';ctx.lineWidth=1;ctx.setLineDash([6,4]);for(const c of cells){if(c.type==='sea')continue;const [sx,sy]=mapToScreen(c.ox,c.oz);ctx.strokeRect(sx,sy,cellPx,cellPx);}ctx.setLineDash([]);}
    if(cellPx>=160){ctx.strokeStyle='rgba(88,58,30,.85)';ctx.lineWidth=Math.max(1,Math.min(2.2,cellPx/300));ctx.setLineDash([5,3]);
      for(const c of cells){const k=cellKey(c.i,c.j);
        if(LOADED.has(k)){for(const rd of ROADS){if(rd.cell!==k)continue;ctx.beginPath();rd.pts.forEach((p,i)=>{const [x,y]=mapToScreen(p.x,p.z);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}}
        else{const byId={};c.sites.forEach(t=>byId[t.id]=t);for(const dd of c.roadDefs){const A=byId[dd.a],B=byId[dd.b];if(!A||!B)continue;const [ax,ay]=mapToScreen(A.x,A.z),[bx,by]=mapToScreen(B.x,B.z);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}}}
      ctx.setLineDash([]);}
    if(cellPx>=100){const Cs=worldState.coaches||{};for(const key in Cs){const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);if(!rd)continue;ctx.setLineDash([]);ctx.strokeStyle='rgba(60,40,20,.95)';ctx.lineWidth=Math.max(4,cellPx/120);ctx.beginPath();rd.pts.forEach((p,i)=>{const [x,y]=mapToScreen(p.x,p.z);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.strokeStyle='rgba(220,200,160,.9)';ctx.lineWidth=Math.max(1.5,cellPx/300);ctx.stroke();}}
    // trade routes: a firm brown line along the road
    if(cellPx>=100){const R=worldState.routes||{};ctx.strokeStyle='rgba(120,70,20,.9)';ctx.lineWidth=Math.max(2,cellPx/200);ctx.setLineDash([]);for(const key in R){const rt=R[key];const rd=ROADS.find(r=>routeKey(r.def.a,r.def.b)===key);if(rd){if(rt.broken){ctx.strokeStyle='rgba(160,40,20,.8)';ctx.setLineDash([4,4]);}ctx.beginPath();rd.pts.forEach((p,i)=>{const [x,y]=mapToScreen(p.x,p.z);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba(120,70,20,.9)';}else{const a=siteAnywhere(rt.a),b=siteAnywhere(rt.b);if(a&&b){const [ax,ay]=mapToScreen(a.x,a.z),[bx,by]=mapToScreen(b.x,b.z);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}}}}
    // labels
    ctx.textAlign='center';
    if(cellPx<140){ctx.font=`italic 700 ${Math.max(16,Math.min(30,cellPx*.28))}px Georgia, serif`;ctx.fillStyle='rgba(60,40,20,.55)';landmassOf(0,0);for(let m=0;m<_landmass.count;m++){const c=_landmass['c'+m];if(c.n<3)continue;const key=_landmass.nation[m];const nat=NATIONS[key];const [x,y]=mapToScreen((c.i+.5)*SIZE,(c.j+.5)*SIZE);ctx.fillText(nat.formal,x,y-8);ctx.font=`italic 500 ${Math.max(10,Math.min(16,cellPx*.16))}px Georgia, serif`;ctx.fillText(nat.name,x,y+10);ctx.font=`italic 700 ${Math.max(16,Math.min(30,cellPx*.28))}px Georgia, serif`;}}
    if(cellPx>=60&&cellPx<520){ctx.font=`italic 600 ${Math.max(10,Math.min(18,cellPx*.09))}px Georgia, serif`;ctx.fillStyle='rgba(70,50,30,.7)';for(const c of cells){if(c.type==='sea')continue;const [x,y]=mapToScreen(c.ox+SIZE/2,c.oz+SIZE*.12);ctx.fillText(c.name||'',x,y,cellPx-8);}}
    if(cellPx>=520){ctx.font='italic 600 14px Georgia, serif';for(const c of cells){ctx.fillStyle='rgba(70,50,30,.55)';c.regions.forEach(r=>{const [x,y]=mapToScreen(r.x,r.z);ctx.fillText(r.name||r.id,x,y-14);});ctx.fillStyle='rgba(60,70,90,.6)';c.lakes.forEach(l=>{const [x,y]=mapToScreen(l.x,l.z);ctx.fillText(l.name,x,y+4);});ctx.fillStyle='rgba(60,50,40,.7)';c.peaks.forEach(p=>{const [x,y]=mapToScreen(p.x,p.z);ctx.fillText(p.name,x,y-10);});}}
    const entries=[];const isc=Math.max(.9,Math.min(2.2,cellPx/420))*(Math.min(cw,ch)/700);
    if(cellPx>=60){for(const c of cells)for(const e of mapEntries(c)){if(e.kind==='quest')continue;if(!discovered(e.id))continue;if(cellPx<160&&!e.major)continue;if(!mapAllowed(e))continue;entries.push(e);}}
    MAP._entries=entries;
    for(const e of entries){const [sx,sy]=mapToScreen(e.x,e.z);ctx.save();ctx.translate(sx,sy);
      if(MAP.hover===e.id||MAP.sel===e.id){ctx.beginPath();ctx.arc(0,0,13*isc,0,Math.PI*2);ctx.fillStyle='rgba(255,230,160,.35)';ctx.fill();}
      drawIcon(ctx,e.kind,isc,true);
      if(cellPx>=260||e.kind==='city'||MAP.hover===e.id){ctx.font=`${Math.round(11*isc)}px Georgia, serif`;ctx.fillStyle='#2a1c10';ctx.strokeStyle='rgba(240,228,200,.8)';ctx.lineWidth=3;ctx.strokeText(e.name,0,14*isc+4);ctx.fillText(e.name,0,14*isc+4);}
      ctx.restore();}
    const [pxs,pys]=mapToScreen(px,pz);ctx.save();ctx.translate(pxs,pys);ctx.rotate(-yaw);ctx.beginPath();ctx.moveTo(0,-9*isc);ctx.lineTo(6*isc,7*isc);ctx.lineTo(0,3*isc);ctx.lineTo(-6*isc,7*isc);ctx.closePath();ctx.fillStyle='#c8322a';ctx.fill();ctx.strokeStyle='#2a0c08';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
    drawMarks(ctx,cw,ch,cellPx);
    ctx.save();ctx.translate(cw-46,52);ctx.strokeStyle='rgba(40,28,14,.7)';ctx.fillStyle='rgba(240,228,200,.75)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(5,0);ctx.lineTo(0,20);ctx.lineTo(-5,0);ctx.closePath();ctx.fillStyle='#8a2a22';ctx.fill();ctx.fillStyle='#2a1c10';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText('N',0,-27);ctx.restore();
    const [fx,fy]=mapToScreen(0,0);ctx.strokeStyle='rgba(40,28,14,.8)';ctx.lineWidth=3;ctx.strokeRect(fx,fy,SIZE*GRID*s,SIZE*GRID*s);
    MAP.dirty=MAP.jobs.length>0;
  };
})();
