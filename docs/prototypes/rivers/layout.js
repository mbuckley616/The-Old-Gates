// Mountains and rivers on the world map — the prototype's layout generator (Session 430, backlog: the world).
// A plain script, loaded into the booted game by render.mjs. It changes nothing in the game: it reads the
// continent (WORLD.MASK, the cells' islets and sites) and proposes, for one rule of range-laying, where the ranges
// snake and where the rivers run. The rivers are not drawn by hand: a coarse height proxy (distance from the sea,
// plus the proposed ranges) is routed with a priority flood and steepest descent, so every channel reaches the sea
// or a lake, tributaries join and the width follows the catchment. The real build (Session 2 onward) would run the
// same routing once per seed and carve the result into rawH.
//   RIVERS_PROTO.layout(rule) -> {spines, rivers, lakes, stats}
//   rules: 'spine' (A), 'rim' (B), 'horseshoe' (C)
var RIVERS_PROTO=(()=>{
  const SIZE=WORLD.SIZE,GRID=WORLD.GRID,W=SIZE*GRID;
  const STEP=60,N=Math.round(W/STEP);           // the routing lattice: 480×480 nodes of 60u
  const HOME={i:5,j:10};                          // the authored cell keeps its own rivers; the Ferrous wall is its north border
  const noise=(x,z,seed,scale)=>_smoothNoise(x,z,seed,scale);
  function fbm(x,z,scale,seed,oct){let a=1,s=scale,sum=0,norm=0;for(let i=0;i<oct;i++){sum+=a*noise(x+i*173.1,z-i*91.7,seed+i*7919,s);norm+=a;a*=.5;s*=.5;}return sum/norm;}
  const sstep=(e0,e1,v)=>{const t=Math.max(0,Math.min(1,(v-e0)/(e1-e0)));return t*t*(3-2*t);};
  function polyDist(pts,x,z){let best=1e9;for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];const vx=b[0]-a[0],vz=b[1]-a[1],l2=vx*vx+vz*vz||1;let t=((x-a[0])*vx+(z-a[1])*vz)/l2;t=t<0?0:t>1?1:t;const d=Math.hypot(x-(a[0]+vx*t),z-(a[1]+vz*t));if(d<best)best=d;}return best;}

  // ── the landmasses, as the game sees them ──
  function masses(){
    const seen={},out=[];const land=(i,j)=>i>=0&&j>=0&&i<GRID&&j<GRID&&['land','coast'].includes(WORLD.MASK[j][i]);
    for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){if(!land(i,j)||seen[i+','+j])continue;const cells=[],st=[[i,j]];seen[i+','+j]=1;
      while(st.length){const [a,b]=st.pop();cells.push([a,b]);[[1,0],[-1,0],[0,1],[0,-1]].forEach(([di,dj])=>{const x=a+di,y=b+dj;if(land(x,y)&&!seen[x+','+y]){seen[x+','+y]=1;st.push([x,y]);}});}
      if(cells.length<3)continue;
      const cx=cells.reduce((s,c)=>s+c[0]+.5,0)/cells.length,cz=cells.reduce((s,c)=>s+c[1]+.5,0)/cells.length;
      // principal axis of the cell cloud
      let sxx=0,szz=0,sxz=0;for(const [a,b] of cells){const dx=a+.5-cx,dz=b+.5-cz;sxx+=dx*dx;szz+=dz*dz;sxz+=dx*dz;}
      const ang=.5*Math.atan2(2*sxz,sxx-szz);const ax=Math.cos(ang),az=Math.sin(ang);
      let lo=1e9,hi=-1e9,wlo=1e9,whi=-1e9;for(const [a,b] of cells){const t=(a+.5-cx)*ax+(b+.5-cz)*az,u=-(a+.5-cx)*az+(b+.5-cz)*ax;lo=Math.min(lo,t);hi=Math.max(hi,t);wlo=Math.min(wlo,u);whi=Math.max(whi,u);}
      const nat=WORLD.nationOf(cells[0][0],cells[0][1]).name;
      out.push({cells,cx,cz,ax,az,lo,hi,wlo,whi,nat,home:cells.some(c=>c[0]===HOME.i&&c[1]===HOME.j)});}
    return out;
  }
  const inLand=(m,x,z)=>{const i=Math.floor(x/SIZE),j=Math.floor(z/SIZE);return m.cells.some(c=>c[0]===i&&c[1]===j);};
  // walk a line across a mass, dropping the ends that leave the land, with a wander so it reads as a chain of hills
  function wander(m,pts,seed,amp){
    const out=[];for(let k=0;k<pts.length;k++){const [x,z]=pts[k];const t=k/(pts.length-1);const w=Math.sin(t*Math.PI)*amp;const nx=x+(noise(x,z,seed,1700)-.5)*2*w,nz=z+(noise(x+5000,z,seed+1,1700)-.5)*2*w;out.push([nx,nz]);}
    // keep the longest run inside the land
    let best=[],cur=[];for(const p of out){if(inLand(m,p[0],p[1]))cur.push(p);else{if(cur.length>best.length)best=cur;cur=[];}}if(cur.length>best.length)best=cur;
    return best;
  }
  function lineAlong(m,off,t0,t1,n){const pts=[];for(let k=0;k<=n;k++){const t=m.lo+(m.hi-m.lo)*(t0+(t1-t0)*k/n);const x=(m.cx+m.ax*t-m.az*off)*SIZE,z=(m.cz+m.az*t+m.ax*off)*SIZE;pts.push([x,z]);}return pts;}
  // the Ferrous wall: the home cell's north border, in every layout (the canon's impassable northern wall)
  function ferrous(){const x0=HOME.i*SIZE,z=HOME.j*SIZE;return {pts:[[x0-200,z+40],[x0+SIZE*.5,z-60],[x0+SIZE+200,z+40]],h:150,hw:380,name:'The Ferrous Mountains',fixed:true};}

  const RULES={
    // A — one long range along each island's spine, wandering; rivers to both coasts
    spine(m,seed){const sp=[];sp.push({pts:wander(m,lineAlong(m,0,.1,.9,8),seed,SIZE*.5),h:140,hw:560});
      // a shoulder range at an angle on the bigger islands
      if(m.cells.length>=17){const off=(m.whi-m.wlo)*.28*(seed%2?1:-1);sp.push({pts:wander(m,lineAlong(m,off,.45,.95,4),seed+9,SIZE*.3),h:95,hw:420});}
      return sp;},
    // B — the range along one rim of the island; long rivers with the island's whole catchment on the far side
    rim(m,seed){const side=(seed%2?1:-1);const off=(side>0?m.whi:m.wlo)*.78;const sp=[{pts:wander(m,lineAlong(m,off,.05,.95,9),seed,SIZE*.35),h:160,hw:620}];
      // a spur toward the middle so the rivers fork
      sp.push({pts:wander(m,[[(m.cx+m.ax*(m.lo+(m.hi-m.lo)*.5)-m.az*off)*SIZE,(m.cz+m.az*(m.lo+(m.hi-m.lo)*.5)+m.ax*off)*SIZE],[(m.cx+m.ax*(m.lo+(m.hi-m.lo)*.62)-m.az*off*.25)*SIZE,(m.cz+m.az*(m.lo+(m.hi-m.lo)*.62)+m.ax*off*.25)*SIZE]],seed+3,SIZE*.2),h:100,hw:420});
      return sp;},
    // C — a horseshoe of ranges round a basin, open on one side: the basin drains through the gap as one great river, with a lake
    horseshoe(m,seed){const open=(seed%4)*Math.PI/2;const R=Math.min(m.hi-m.lo,m.whi-m.wlo)*.34;const pts=[];
      const cx=m.cx-(m.ax*Math.cos(open)-m.az*Math.sin(open))*R*.25,cz=m.cz-(m.az*Math.cos(open)+m.ax*Math.sin(open))*R*.25; // the basin sits back from the gap
      for(let k=0;k<=12;k++){const a=open+Math.PI*(.4+1.2*k/12);const u=Math.cos(a)*R,v=Math.sin(a)*R;pts.push([(cx+m.ax*u-m.az*v)*SIZE,(cz+m.az*u+m.ax*v)*SIZE]);}
      const ox=m.ax*Math.cos(open)-m.az*Math.sin(open),oz=m.az*Math.cos(open)+m.ax*Math.sin(open); // toward the gap
      return [{pts:wander(m,pts,seed,SIZE*.2),h:150,hw:520,basin:{x:cx*SIZE,z:cz*SIZE,dx:ox,dz:oz,R:R*SIZE}}];},
  };

  function layout(rule,seed){
    seed=seed||8080;const t0=performance.now();
    const ms=masses();const spines=[];
    for(let k=0;k<ms.length;k++){const m=ms[k];for(const s of RULES[rule](m,seed+k*17)){if(s.pts.length>=2){s.mass=k;s.nat=m.nat;spines.push(s);}}}
    spines.push(ferrous());
    // ── the lattice ──
    const H=new Float32Array(N*N),sea=new Uint8Array(N*N),home=new Uint8Array(N*N);
    const isletsOf={};const islets=(i,j)=>{const k=i+','+j;if(!(k in isletsOf)){const c=WORLD.getCell(i,j);isletsOf[k]=c.islets||[];}return isletsOf[k];};
    for(let b=0;b<N;b++)for(let a=0;a<N;a++){const x=(a+.5)*STEP,z=(b+.5)*STEP;const i=Math.floor(x/SIZE),j=Math.floor(z/SIZE);const n=b*N+a;
      sea[n]=WORLD.seaBare(x,z,islets(i,j))>.5?1:0;home[n]=(i===HOME.i&&j===HOME.j)?1:0;}
    // distance from the sea (4-connected BFS, in steps)
    const dsea=new Int32Array(N*N).fill(-1);const q=new Int32Array(N*N);let qh=0,qt=0;
    for(let n=0;n<N*N;n++)if(sea[n]){dsea[n]=0;q[qt++]=n;}
    while(qh<qt){const n=q[qh++];const a=n%N,b=(n/N)|0;const d=dsea[n]+1;
      if(a>0&&dsea[n-1]<0){dsea[n-1]=d;q[qt++]=n-1;}if(a<N-1&&dsea[n+1]<0){dsea[n+1]=d;q[qt++]=n+1;}
      if(b>0&&dsea[n-N]<0){dsea[n-N]=d;q[qt++]=n-N;}if(b<N-1&&dsea[n+N]<0){dsea[n+N]=d;q[qt++]=n+N;}}
    // the proxy height: a gentle dome from the coast, the ranges on top, a little wander
    const raw=new Float32Array(N*N);
    for(let b=0;b<N;b++)for(let a=0;a<N;a++){const n=b*N+a;if(sea[n]){H[n]=-5;raw[n]=-5;continue;}const x=(a+.5)*STEP,z=(b+.5)*STEP;
      let h=2+Math.sqrt(Math.max(0,dsea[n])*STEP)*.9+(fbm(x,z,420,seed+1,3)-.5)*12+(fbm(x,z,110,seed+2,2)-.5)*4;
      for(const s of spines){if(s.basin){const B=s.basin;const qx=x-B.x,qz=z-B.z;const d=Math.hypot(qx,qz);const t=(qx*B.dx+qz*B.dz)/B.R,u=Math.abs(-qx*B.dz+qz*B.dx)/B.R;if(t<0){if(d<B.R*1.3)h*=1-sstep(B.R*1.3,B.R*.6,d)*.5;}else h*=1-sstep(1.0,.35,u)*(.5+.15*Math.min(1,t));} // the basin floor, and a valley out through the gap to the coast, so it drains instead of filling
        const d=polyDist(s.pts,x,z);if(d>=s.hw)continue;const vary=s.fixed?1:.55+fbm(x,z,240,seed+73,2)*.9;const pass=s.fixed?1:sstep(.18,.34,fbm(x,z,320,seed+74,2));const m=sstep(s.hw,s.hw*.18,d);h+=m*m*s.h*vary*pass;}
      raw[n]=h;H[n]=h;}
    // ── priority flood (Barnes 2014): a surface with no pits, every land node draining to the sea ──
    const heap=[];const push=(n,h)=>{heap.push([h,n]);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
    const pop=()=>{const top=heap[0];const last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let s=i;if(l<heap.length&&heap[l][0]<heap[s][0])s=l;if(r<heap.length&&heap[r][0]<heap[s][0])s=r;if(s===i)break;[heap[s],heap[i]]=[heap[i],heap[s]];i=s;}}return top;};
    const done=new Uint8Array(N*N);const order=new Int32Array(N*N);let no=0;
    for(let n=0;n<N*N;n++)if(sea[n]){done[n]=1;push(n,H[n]);}
    const NB=[-1,1,-N,N,-N-1,-N+1,N-1,N+1];
    while(heap.length){const [h,n]=pop();order[no++]=n;const a=n%N,b=(n/N)|0;
      for(let k=0;k<8;k++){const d=NB[k];const na=a+(k===0||k===4||k===6?-1:k===1||k===5||k===7?1:0),nb=b+(k===2||k===4||k===5?-1:k===3||k===6||k===7?1:0);if(na<0||nb<0||na>=N||nb>=N)continue;const m=n+d;if(done[m])continue;done[m]=1;if(H[m]<=h)H[m]=h+1e-3;push(m,H[m]);}}
    // flow direction: steepest descent on the filled surface
    const down=new Int32Array(N*N).fill(-1);
    for(let b=0;b<N;b++)for(let a=0;a<N;a++){const n=b*N+a;if(sea[n])continue;let best=-1,bs=0;
      for(let k=0;k<8;k++){const na=a+(k===0||k===4||k===6?-1:k===1||k===5||k===7?1:0),nb=b+(k===2||k===4||k===5?-1:k===3||k===6||k===7?1:0);if(na<0||nb<0||na>=N||nb>=N)continue;const m=n+NB[k];const s=(H[n]-H[m])/(k<4?1:1.4142);if(s>bs){bs=s;best=m;}}
      down[n]=best;}
    // accumulation, highest first (the flood's pop order reversed)
    const acc=new Float32Array(N*N).fill(1);
    for(let k=no-1;k>=0;k--){const n=order[k];if(sea[n]||home[n])continue;const d=down[n];if(d>=0&&!home[d])acc[d]+=acc[n];}
    // lakes: where the flood raised the ground more than a little
    const lake=new Uint8Array(N*N);for(let n=0;n<N*N;n++)if(!sea[n]&&H[n]-raw[n]>3.5)lake[n]=1;
    // ── channels ──
    const AREA=STEP*STEP;const T=280,TB=90;                // 280 nodes ≈ 1 km² of catchment makes a river; 90 a brook (the 4u streams of today)
    const width=a=>2+6.5*Math.log(1+a*AREA/400000);       // catchment → width: 5.5u at a brook's head, 10u at 1 km², 16u at 3.2 km², 25u at 12 km²
    const NAV=16;                                          // a ship (13 by 4.4) needs sixteen units of water
    const xz=n=>[((n%N)+.5)*STEP,(((n/N)|0)+.5)*STEP];
    const trace=(lo,hi)=>{const chan=new Uint8Array(N*N);for(let n=0;n<N*N;n++)if(!sea[n]&&!home[n]&&acc[n]>=lo&&acc[n]<hi&&!lake[n])chan[n]=1;
      const upc=new Uint8Array(N*N);for(let n=0;n<N*N;n++)if(chan[n]&&down[n]>=0&&chan[down[n]])upc[down[n]]++;
      const out=[];
      for(let n=0;n<N*N;n++){if(!chan[n]||upc[n]===1)continue;         // a source (0 upstream) or a junction (2+): a reach starts here
        let m=n;const pts=[],ws=[];let end=null;
        for(let guard=0;guard<4000;guard++){pts.push(xz(m));ws.push(width(acc[m]));const d=down[m];
          if(d<0||sea[d]||lake[d]){end=sea[d]?'sea':'lake';if(d>=0)pts.push(xz(d));break;}
          if(!chan[d]){end=acc[d]>=hi?'river':'sink';pts.push(xz(d));break;}
          m=d;if(upc[m]>=2){pts.push(xz(m));ws.push(width(acc[m]));end='join';break;}}
        out.push({pts:chaikin(pts,2),w0:ws[0],w1:ws[ws.length-1],acc:acc[m],end,mouth:end==='sea'?xz(down[m]>=0?down[m]:m):null,src:n,last:m});}
      return out;};
    const rivers=trace(T,1e18),brooks=trace(TB,T);
    // the great rivers: the mouths with the largest catchment; the main stem traced upstream by the larger branch
    const mouths=rivers.filter(r=>r.end==='sea').sort((a,b)=>b.acc-a.acc);
    const byLast={};for(const r of rivers)byLast[r.last]=byLast[r.last]||[];for(const r of rivers)byLast[r.last].push(r);
    const upOf={};for(const r of rivers){upOf[r.last]=upOf[r.last]||[];upOf[r.last].push(r);}
    const great=[];const perIsl={};for(const mo of mouths){if(mo.acc*AREA<3e6)break;{const [i,j]=WORLD.cellOf(mo.mouth[0],mo.mouth[1]);const nk=WORLD.nationOf(i,j).name;perIsl[nk]=(perIsl[nk]||0)+1;if(perIsl[nk]>4)continue;}const stem=[mo];let cur=mo;let len=0;
      for(let g=0;g<60;g++){const ups=(upOf[cur.src]||[]).filter(r=>r!==cur);if(!ups.length)break;ups.sort((a,b)=>b.acc-a.acc);cur=ups[0];stem.push(cur);}
      for(const r of stem)len+=r.pts.reduce((s,p,i)=>i?s+Math.hypot(p[0]-r.pts[i-1][0],p[1]-r.pts[i-1][1]):0,0);
      const mx=mo.mouth[0],mz=mo.mouth[1];const [i,j]=WORLD.cellOf(mx,mz);
      great.push({mouth:mo.mouth,acc:mo.acc,area:mo.acc*AREA,wMouth:width(mo.acc),len,reaches:stem.length,stem:stem.map(r=>r.pts),nat:WORLD.nationOf(i,j).name,forkAt:stem.length>1?stem[0].pts[0]:null});}
    // a delta for the two largest on each island: the last stretch fans into distributaries
    const perNat={};for(const g of great){perNat[g.nat]=(perNat[g.nat]||0)+1;if(perNat[g.nat]<=1&&g.area>6e6)g.delta=delta(g,sea);}
    // the sites on the banks: within reach of a navigable river (a quay), or under one (the river bends round the pad)
    const sites=[];for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){const c=WORLD.getCell(i,j);for(const s of c.sites){if(!['city','town','port','village','garrison'].includes(s.kind))continue;sites.push({id:s.id,name:s.name,kind:s.kind,x:s.x,z:s.z,pad:s.pad});}}
    const nav=rivers.filter(r=>r.w1>=NAV);
    for(const s of sites){let dn=1e9,da=1e9;for(const r of nav){const d=polyDist(r.pts,s.x,s.z);if(d<dn)dn=d;}for(const r of rivers){const d=polyDist(r.pts,s.x,s.z)-r.w1;if(d<da)da=d;}
      s.quay=dn<s.pad+220;s.bend=da<s.pad;}
    const stats={ms:Math.round(performance.now()-t0),nodes:N*N,land:Array.from(sea).filter(v=>!v).length,reaches:rivers.length,brooks:brooks.length,mouths:mouths.length,great:great.length,navRivers:nav.filter(r=>r.end==='sea').length,
      navigableLen:Math.round(nav.reduce((s,r)=>s+r.pts.reduce((q,p,i)=>i?q+Math.hypot(p[0]-r.pts[i-1][0],p[1]-r.pts[i-1][1]):0,0),0)),
      lakes:countBlobs(lake),quays:sites.filter(s=>s.quay).length,bends:sites.filter(s=>s.bend).length,sitesTotal:sites.length};
    return {rule,spines,rivers,brooks,great,lakeMask:lake,N,STEP,sites,stats,NAV};
  }
  function delta(g,sea){const stem=g.stem[0];const n=stem.length;if(n<6)return null;const k=Math.max(0,n-9);const a=stem[k],b=stem[n-1];
    const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1;const ux=dx/L,uz=dz/L;const arms=[];
    for(const side of [-1,1]){const ang=side*.42;const cx=Math.cos(ang),sx=Math.sin(ang);const vx=ux*cx-uz*sx,vz=ux*sx+uz*cx;const pts=[a];let x=a[0],z=a[1];
      for(let s=0;s<40;s++){x+=vx*45+(side*uz)*Math.sin(s*.3)*8;z+=vz*45-(side*ux)*Math.sin(s*.3)*8;pts.push([x,z]);const i=Math.floor(x/STEP),j=Math.floor(z/STEP);if(i<0||j<0||i>=N||j>=N||sea[j*N+i])break;}
      arms.push(pts);}
    return {from:a,arms};}
  function chaikin(pts,n){let p=pts;for(let k=0;k<n;k++){if(p.length<3)return p;const o=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25]);o.push([a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}o.push(p[p.length-1]);p=o;}return p;}
  function countBlobs(mask){const seen=new Uint8Array(N*N);let n=0;for(let s=0;s<N*N;s++){if(!mask[s]||seen[s])continue;let size=0;const st=[s];seen[s]=1;while(st.length){const m=st.pop();size++;const a=m%N,b=(m/N)|0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(([di,dj])=>{const x=a+di,y=b+dj;if(x<0||y<0||x>=N||y>=N)return;const t=y*N+x;if(mask[t]&&!seen[t]){seen[t]=1;st.push(t);}});}if(size>=6)n++;}return n;}
  return {layout,masses,RULES};
})();
