  // ── fort compounds: a curtain wall with corner towers, a gate on the road
  // side, two barracks, banners and torches around every fort exterior.
  // S256 — the fort's keep in detail: a battered plinth, walls of coursed rubble on a mortar core, stepped buttresses, a
  // string course, dressed arrow slits, a corbelled crenellated parapet over a hipped lead roof, coursed round turrets
  // with slated caps, a round-arched doorway of voussoirs with its two plank leaves standing open, round-headed windows
  // with sills, torch brackets and the nation's banner on a pole. The old keep's footprint (11 by 9, 7.2 to the walk),
  // door, windows and lights are where they were; y 0 at the ground, the south face at +D/2.
  function fortKeepGeoHi(W,D,H,banner,rr){const P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+rr()*a*2).getHex(),wc=0x5a4a40,pale=0xc8b8a0,dk=0x2a2622,mortar=0x3e342e,iron=0x2a2624,wood=0x5a3d22;
    const frustum=(w0,d0,w1,d1,h)=>{const g=new THREE.BoxGeometry(1,h,1),p=g.attributes.position;for(let i=0;i<p.count;i++){const up=p.getY(i)>0;p.setX(i,p.getX(i)*(up?w1:w0));p.setZ(i,p.getZ(i)*(up?d1:d0));}g.computeVertexNormals();return g;};
    const PL=1.0,DW=1.2,DY=3.0; // the plinth's height; the doorway's half-width and the arch's springing
    // the plinth splays out at the foot and runs a metre into the ground for a slope; the core behind the courses
    add(frustum(W+1.0,D+1.0,W+.3,D+.3,PL+1.0),vary(0x4a3e36,.04),0,PL/2-.5,0,0,0,0,.06);
    add(new THREE.BoxGeometry(W+.5,.18,D+.5),vary(pale,.04),0,PL+.02,0,0,0,0,.03);
    add(new THREE.BoxGeometry(W-.1,H-PL,D-1.0),mortar,0,(H+PL)/2,-.5,0,0,0,.02);
    add(new THREE.BoxGeometry(W/2-DW-.05,H-PL,1.0),mortar,-(W/2+DW)/2,(H+PL)/2,D/2-.55,0,0,0,.02);
    add(new THREE.BoxGeometry(W/2-DW-.05,H-PL,1.0),mortar,(W/2+DW)/2,(H+PL)/2,D/2-.55,0,0,0,.02);
    {const top=DY+DW+.6,s=new THREE.Shape();s.moveTo(-DW,DY);s.lineTo(-DW,top);s.lineTo(DW,top);s.lineTo(DW,DY);s.absarc(0,DY,DW,0,Math.PI,false);
      add(new THREE.ExtrudeGeometry(s,{depth:1.0,bevelEnabled:false,curveSegments:10}),mortar,0,0,D/2-1.05,0,0,0,.02);
      add(new THREE.BoxGeometry(2*DW+.1,H-top,1.0),mortar,0,(H+top)/2,D/2-.55,0,0,0,.02);
      const b=new THREE.Shape();b.moveTo(-DW,0);b.lineTo(DW,0);b.lineTo(DW,DY);b.absarc(0,DY,DW,0,Math.PI,false);b.lineTo(-DW,0);add(new THREE.ShapeGeometry(b,10),0x0c0908,0,0,D/2-.95,0,0,0,0);}
    // courses of rubble on each face, laid broken-joint, leaving the doorway and the windows open
    const WINX=3.4,WY=H*.62,faces=[[0,D/2,W,0],[0,-D/2,W,Math.PI],[W/2,0,D,Math.PI/2],[-W/2,0,D,-Math.PI/2]];
    for(const [fx,fz,L,ry] of faces){const south=ry===0,nx=Math.sin(ry),nz=Math.cos(ry),tx=Math.cos(ry),tz=-Math.sin(ry);
      const gaps=south?[[-DW-.25,DW+.25,0,DY+DW+.4],[-WINX-.55,-WINX+.55,WY-.7,WY+.85],[WINX-.55,WINX+.55,WY-.7,WY+.85]]:[];
      for(let y=PL+.12;y<H-.05;){const ch=Math.min(H-y,.48+rr()*.26);let x=-L/2+.2;
        while(x<L/2-.25){let bl=Math.min(L/2-.2-x,.8+rr()*1.3);const g=gaps.find(q=>y+ch>q[2]&&y<q[3]&&x+bl>q[0]&&x<q[1]);
          if(g){if(x<g[0]-.05)bl=g[0]-x;else{x=g[1];continue;}}
          const t=.14+(rr()-.5)*.06,cx=x+bl/2;add(new THREE.BoxGeometry(bl-.05,ch-.05,t),vary(wc,.16),fx+tx*cx+nx*(t/2-.04),y+ch/2,fz+tz*cx+nz*(t/2-.04),0,ry,0,.05);x+=bl;}
        y+=ch;}}
    // stepped buttresses on the long sides, the string course, arrow slits in dressed surrounds
    for(const k of [-1,1])for(const q of [-1,1]){const bz=q*D*.28,bx=k*(W/2+.35);add(SK.rbox(.8,H*.5,.9,.06,1),vary(pale,.06),bx,H*.25,bz,0,0,0,.05);add(SK.rbox(.6,H*.3,.75,.06,1),vary(pale,.06),bx-k*.1,H*.62,bz,0,0,0,.05);add(new THREE.BoxGeometry(.6,.4,.8),vary(pale,.05),bx-k*.12,H*.78,bz,0,0,k*.7,.04);}
    add(SK.rbox(W+.34,.24,D+.34,.06,1),vary(pale,.04),0,H*.55,0,0,0,0,.03);
    const slit=(x,y,z,ry)=>{const nx=Math.sin(ry),nz=Math.cos(ry),tx=Math.cos(ry),tz=-Math.sin(ry);add(new THREE.BoxGeometry(.14,1.0,.1),0x100c0a,x+nx*.06,y,z+nz*.06,0,ry,0,0);
      for(const s of [-1,1])add(new THREE.BoxGeometry(.2,1.3,.18),vary(pale,.06),x+tx*s*.17+nx*.06,y,z+tz*s*.17+nz*.06,0,ry,0,.04);add(new THREE.BoxGeometry(.56,.2,.2),vary(pale,.06),x+nx*.07,y+.72,z+nz*.07,0,ry,0,.04);add(new THREE.BoxGeometry(.56,.14,.22),vary(pale,.06),x+nx*.07,y-.68,z+nz*.07,0,ry,0,.04);};
    for(let k=0;k<3;k++){slit(-3.5+k*3.5,H*.8,-D/2,Math.PI);slit(W/2,H*.72,-3+k*3,Math.PI/2);slit(-W/2,H*.72,-3+k*3,-Math.PI/2);}
    // the parapet: corbels carry a projecting walk, merlons on the old spacing, a hipped lead roof inside it
    for(const [fx,fz,L,ry] of faces){const nx=Math.sin(ry),nz=Math.cos(ry),tx=Math.cos(ry),tz=-Math.sin(ry);
      for(let t=-L/2+.5;t<L/2-.3;t+=1.1)add(new THREE.BoxGeometry(.26,.42,.34),vary(pale,.05),fx+tx*t+nx*.14,H-.2,fz+tz*t+nz*.14,0,ry,0,.04);
      add(SK.rbox(L+.6,.34,.46,.06,1),vary(pale,.04),fx+nx*.2,H+.1,fz+nz*.2,0,ry,0,.03);}
    for(let k=0;k<Math.floor(W/1.4);k++)for(const s of [1,-1])add(SK.rbox(.8,.8,.46,.07,1),vary(pale,.08),-W/2+.7+k*1.4,H+.66,s*(D/2-.06),0,0,0,.05);
    for(let k=0;k<Math.floor(D/1.4);k++)for(const s of [1,-1])add(SK.rbox(.46,.8,.8,.07,1),vary(pale,.08),s*(W/2-.06),H+.66,-D/2+.7+k*1.4,0,0,0,.05);
    {const g=new THREE.ConeGeometry(Math.SQRT1_2,1,4,1);g.rotateY(Math.PI/4);g.scale(W-1.4,1.3,D-1.4);add(g,0x4a4c52,0,H+.65,0,0,0,0,.04);add(SK.rbox(W-.6,.12,D-.6,.04,1),0x6a6258,0,H+.02,0,0,0,0,.03);}
    // corner turrets: coursed round towers on a battered foot, slits, a corbelled crenellated top, a slated cone and finial
    const TT=H+2.4,R0=1.2,R1=1.4;for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=sx*(W/2-.2),z=sz*(D/2-.2),out=Math.atan2(sx,sz);
      add(new THREE.CylinderGeometry(R1+.05,R1+.22,PL+1.0,12),vary(0x4a3e36,.04),x,PL/2-.5,z,0,0,0,.05);
      add(new THREE.CylinderGeometry(R0,R1,TT-PL,12,2),vary(pale,.05),x,(TT+PL)/2,z,0,0,0,.08);
      for(let y=PL+.8;y<TT-.6;y+=1.3){const rad=R1-(R1-R0)*((y-PL)/(TT-PL))+.01;add(SK.torus(rad,.045,3,10),0x8a7c68,x,y,z,Math.PI/2,0,0,.03);}
      for(let q=0;q<2;q++){const a=out+(q-.5)*1.1,y=3.0+q*2.4,rad=R1-(R1-R0)*((y-PL)/(TT-PL))+.02;add(new THREE.BoxGeometry(.13,.8,.1),0x100c0a,x+Math.sin(a)*rad,y,z+Math.cos(a)*rad,0,a,0,0);}
      for(let k=0;k<7;k++){const a=k/7*Math.PI*2;add(new THREE.BoxGeometry(.26,.34,.3),vary(pale,.05),x+Math.sin(a)*(R0+.08),TT-.25,z+Math.cos(a)*(R0+.08),0,a,0,.04);}
      add(new THREE.CylinderGeometry(R0+.32,R0+.32,.3,12),vary(pale,.04),x,TT+.05,z);
      for(let k=0;k<6;k++){const a=k/6*Math.PI*2+.3;add(new THREE.BoxGeometry(.62,.55,.3),vary(pale,.07),x+Math.sin(a)*(R0+.16),TT+.47,z+Math.cos(a)*(R0+.16),0,a,0,.05);}
      for(let k=0;k<4;k++){const r1=(R0+.18)*(1-k/4),r2=(R0+.18)*(1-(k+1)/4);add(new THREE.CylinderGeometry(Math.max(.03,r2),r1,.45,12,1,true),vary(dk,.1),x,TT+.35+k*.45+.22,z,0,0,0,.05);}
      add(SK.cyl(.04,.04,.5,4),0x8a7a4a,x,TT+2.35,z);add(SK.ball(.1,6,5),0xc8a850,x,TT+2.62,z);}
    // the doorway: dressed jambs in long and short stones, a ring of voussoirs with a keystone, the leaves open against
    // the reveals, a threshold and the old two steps
    for(const s of [-1,1]){let y=0,k=0;while(y<DY-.02){const h=Math.min(DY-y,.5+rr()*.12),long=k++%2===0;add(SK.rbox(long?.62:.42,h-.04,.34,.05,1),vary(pale,.07),s*(DW+(long?.29:.19)),y+h/2,D/2+.03,0,0,0,.05);y+=h;}}
    for(let k=0;k<=10;k++){const a=k/10*Math.PI,key=k===5,rad=DW+(key?.36:.3);add(SK.rbox(.34,key?.72:.6,.36,.05,1),vary(pale,.07),Math.cos(a)*rad,DY+Math.sin(a)*rad,D/2+(key?.06:.03),0,0,a-Math.PI/2,.05);}
    for(const s of [-1,1]){const lx=s*(DW-.06),z0=D/2-.9,lw=DW-.05;
      for(let k=0;k<5;k++)add(new THREE.BoxGeometry(.07,DY-.1,lw/5-.015),vary(wood,.12),lx,(DY-.1)/2+.05,z0+(k+.5)*lw/5,0,0,0,.06);
      for(const y of [.5,DY-.6])add(new THREE.BoxGeometry(.03,.1,lw-.08),iron,lx-s*.05,y,z0+lw/2,0,0,0,.03);
      add(SK.torus(.09,.018,4,8),iron,lx-s*.06,1.25,z0+lw-.2,0,Math.PI/2,0,.02);}
    add(SK.rbox(2*DW+.3,.12,.9,.04,1),vary(pale,.05),0,.02,D/2-.4,0,0,0,.03);
    add(SK.rbox(3.6,.3,1.6,.06,1),vary(pale,.06),0,.15,D/2+1.0,0,0,0,.04);add(SK.rbox(4.4,.3,1.2,.06,1),vary(pale,.06),0,-.05,D/2+2.2,0,0,0,.04);
    // windows: a dark recess, dressed jambs, a round head and a sill on the string course; the lit panes stay the old planes
    for(const s of [-1,1]){const x=s*WINX;add(new THREE.BoxGeometry(.8,1.0,.1),0x14100c,x,WY,D/2-.06,0,0,0,0);
      for(const q of [-1,1])add(SK.rbox(.2,1.1,.24,.04,1),vary(pale,.06),x+q*.5,WY-.02,D/2+.04,0,0,0,.04);
      add(SK.torus(.5,.1,4,10,Math.PI),vary(pale,.05),x,WY+.52,D/2+.04,0,0,0,.04);add(new THREE.BoxGeometry(.8,.4,.06),0x14100c,x,WY+.55,D/2-.04,0,0,0,0);
      add(SK.rbox(1.24,.14,.4,.04,1),vary(pale,.05),x,WY-.6,D/2+.12,0,0,0,.03);}
    // torch brackets under the old flames, and the banner on a pole with its finials, cut to a point
    for(const s of [-1,1]){const x=s*2.2;add(SK.cyl(.03,.03,.55,5),iron,x,2.58,D/2+.26,Math.PI/2,0,0,.02);add(SK.lathe([[.001,0],[.06,0],[.1,.14],[.001,.14]],8),iron,x,2.6,D/2+.5,0,0,0,.02);add(SK.cyl(.02,.02,.3,4),iron,x,2.45,D/2+.36,-.8,0,0,.02);}
    add(SK.cyl(.04,.04,1.6,6),iron,0,7.02,D/2+.14,0,0,Math.PI/2,.02);for(const s of [-1,1]){add(SK.ball(.06,6,4),0xa89048,s*.82,7.02,D/2+.14);add(SK.cyl(.025,.025,.2,4),iron,s*.55,7.02,D/2+.06,Math.PI/2,0,0,.02);}
    {const b=new THREE.Shape();b.moveTo(-.6,0);b.lineTo(.6,0);b.lineTo(.6,-1.7);b.lineTo(0,-2.05);b.lineTo(-.6,-1.7);b.lineTo(-.6,0);const g=new THREE.ExtrudeGeometry(b,{depth:.03,bevelEnabled:false});add(g,banner,0,6.98,D/2+.1,0,0,0,.04);
      add(new THREE.BoxGeometry(1.2,.12,.045),new THREE.Color(banner).multiplyScalar(.6).getHex(),0,6.9,D/2+.13,0,0,0,.02);}
    return mergeParts(P);}
  const FORT_KEEP={}; // S256 — a fort keep's pieces, left by buildFortKeep (the doors step) for its compound (the next step)
  function buildFortKeep(p){
    // a stone keep whose door is the portal: a recessed arched doorway in the south face, buttresses, arrow slits,
    // a crenellated parapet, corner turrets, a banner — and solid all the way through (no corridor inside the face)
    const r=(function(){let q=(p.seed||7)%2147483647;return()=>{q=(q*48271)%2147483647;return q/2147483647;};})();
    // v80 S132 — a keep at the player's scale, with a door you can see from the gate
    const W_=11,D_=9,H_=7.2;const cx=p.x,cz=p.z-D_/2;const y=worldH(cx,cz);const c=x=>new THREE.Color(x);const parts=[];
    const wallC=c(0x5a4a40),wall2=c(0xc8b8a0),dark=c(0x2a2622); // v80 S132 — the keep in warm dark stone with pale quoins; the ring stays grey, so the two never read as one wall
    parts.push({geo:new THREE.BoxGeometry(W_,H_,D_),color:wallC,y:H_/2,jitter:.02});
    // buttresses on the long sides, a string course, arrow slits, the parapet
    for(let k=-1;k<=1;k+=2){for(let q=-1;q<=1;q+=2)parts.push({geo:new THREE.BoxGeometry(.9,H_*.8,.9),color:wall2,x:k*(W_/2+.3),z:q*(D_*.28),y:H_*.4});}
    parts.push({geo:new THREE.BoxGeometry(W_+.4,.3,D_+.4),color:wall2,y:H_*.55});
    for(let k=0;k<3;k++){parts.push({geo:new THREE.BoxGeometry(.25,1.1,.2),color:dark,x:-3.5+k*3.5,z:D_/2+.02,y:H_*.72});parts.push({geo:new THREE.BoxGeometry(.2,1.1,.25),color:dark,x:W_/2+.02,z:-3+k*3,y:H_*.72});parts.push({geo:new THREE.BoxGeometry(.2,1.1,.25),color:dark,x:-W_/2-.02,z:-3+k*3,y:H_*.72});}
    for(let k=0;k<Math.floor(W_/1.4);k++){parts.push({geo:new THREE.BoxGeometry(.8,.8,.5),color:wall2,x:-W_/2+.7+k*1.4,z:D_/2-.25,y:H_+.4});parts.push({geo:new THREE.BoxGeometry(.8,.8,.5),color:wall2,x:-W_/2+.7+k*1.4,z:-D_/2+.25,y:H_+.4});}
    for(let k=0;k<Math.floor(D_/1.4);k++){parts.push({geo:new THREE.BoxGeometry(.5,.8,.8),color:wall2,x:W_/2-.25,z:-D_/2+.7+k*1.4,y:H_+.4});parts.push({geo:new THREE.BoxGeometry(.5,.8,.8),color:wall2,x:-W_/2+.25,z:-D_/2+.7+k*1.4,y:H_+.4});}
    // corner turrets with caps
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{parts.push({geo:new THREE.CylinderGeometry(1.2,1.4,H_+2.4,8),color:wall2,x:sx*(W_/2-.2),z:sz*(D_/2-.2),y:(H_+2.4)/2,jitter:.03});parts.push({geo:new THREE.ConeGeometry(1.5,1.6,8),color:dark,x:sx*(W_/2-.2),z:sz*(D_/2-.2),y:H_+2.4+.8});});
    // the doorway: a recess in the south face with an arch, and the dark of the door itself
    parts.push({geo:new THREE.BoxGeometry(2.6,3.4,.9),color:c(0x100c0a),z:D_/2-.3,y:1.7});
    parts.push({geo:new THREE.BoxGeometry(3.6,.3,1.6),color:wall2,z:D_/2+1.0,y:.15});parts.push({geo:new THREE.BoxGeometry(4.4,.3,1.2),color:wall2,z:D_/2+2.2,y:-.05}); // steps
    for(let k=-1;k<=1;k+=2)parts.push({geo:new THREE.BoxGeometry(.8,1.0,.15),color:c(0x2a2010),x:k*3.4,z:D_/2+.05,y:H_*.62}); // windows
    parts.push({geo:new THREE.TorusGeometry(1.5,.28,6,10,Math.PI),color:wall2,z:D_/2+.15,y:3.3,rx:0});
    parts.push({geo:new THREE.BoxGeometry(.35,3.4,.7),color:wall2,x:-1.55,z:D_/2+.15,y:1.7});parts.push({geo:new THREE.BoxGeometry(.35,3.4,.7),color:wall2,x:1.55,z:D_/2+.15,y:1.7});
    // a banner over the door, and torches either side
    parts.push({geo:new THREE.BoxGeometry(1.2,2.0,.06),color:c(nationOf(...cellOf(cx,cz)).banner),z:D_/2+.1,y:6.0});
    // S256 — the keep's meshes go into the compound's group (buildFortCompound), in detail near and these boxes far
    FORT_KEEP[p.seed]={lo:parts,x:cx,z:cz,y:y-.06,banner:nationOf(...cellOf(cx,cz)).banner};
    // the doorway glows warm and the windows are lit, so the door reads from the gate at night
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(2.2,3.0),new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:.55}));glow.position.set(cx,y+1.5,cz+D_/2+.02);sc.add(glow);
    for(let k=-1;k<=1;k+=2){const w=new THREE.Mesh(new THREE.PlaneGeometry(.6,.8),new THREE.MeshBasicMaterial({color:0xffc870}));w.position.set(cx+k*3.4,y+H_*.62,cz+D_/2+.14);sc.add(w);const fl=new THREE.Mesh(new THREE.ConeGeometry(.12,.35,6),new THREE.MeshBasicMaterial({color:0xffa030}));fl.position.set(cx+k*2.2,y+2.9,cz+D_/2+.5);sc.add(fl);}
    for(let k=-1;k<=1;k+=2){const l=regLight(0xffb060,1.4,9,'keep:'+p.seed);l.position.set(cx+k*2.2,y+2.8,cz+D_/2+.7);}
    // solids: the whole keep is a mass — the door is the portal, not a way in
    STATIC_SOL.push({cx,cz,rx:W_/2+.5,rz:D_/2+.5});
    addStamp({id:'keep_'+p.seed,kind:'site',x:cx,z:cz,r:Math.max(W_,D_)*.9,blend:6,y});
  }
  function buildFortCompound(e,p,cellK){
    const cx=p.x,cz=p.z+4,R=27;const st=STYLE.garrison;const c=x=>new THREE.Color(x);const wallC=c(st.wall),capC=c(st.wall2);
    const r=(function(){let q=e.seed%2147483647;return()=>{q=(q*48271)%2147483647;return q/2147483647;};})();
    const group=new THREE.Group();const sol=[];const y0=worldH(cx,cz);
    const gateAng=Math.PI/2; // the door faces +z; the spur leaves south
    const segs=Math.round(2*Math.PI*R/3.2);
    for(let i=0;i<segs;i++){
      const a0=i/segs*Math.PI*2,a1=(i+1)/segs*Math.PI*2,am=(a0+a1)/2;
      let d=am-gateAng;d=Math.atan2(Math.sin(d),Math.cos(d));
      if(Math.abs(d)<.16)continue; // the gate gap
      const mx=cx+Math.cos(am)*R,mz=cz+Math.sin(am)*R;const len=2*R*Math.sin(Math.PI/segs)+.3;const wry=-am-Math.PI/2;
      // S251 — each segment coursed stone near (the town walls' builder, no buttresses on so short a run), its old box and
      // three caps (v80 S132: 3.4 tall, a wall, not a cliff) the distant copy
      {const lp=[{geo:new THREE.BoxGeometry(len,3.4,1.0),color:wallC,y:1.7,jitter:.06}];for(let k=-1;k<=1;k++)lp.push({geo:new THREE.BoxGeometry(.8,.55,1.1),color:capC,x:k*len*.3,y:3.65,jitter:.05});
        const tx_=-Math.sin(am)*len/2,tz_=Math.cos(am)*len/2;const hiG=wallSegHi('stone',len,3.4,1.0,wallC,capC,worldH(mx-tx_,mz-tz_)-y0,worldH(mx+tx_,mz+tz_)-y0,pRng(pHash('fort|'+e.seed+'|'+i)),true);
        for(const [geo,lod] of [[hiG,'hi'],[mergeParts(lp),'lo']]){const m=new THREE.Mesh(geo,VC_MAT);m.position.set(mx,y0,mz);m.rotation.y=wry;m.castShadow=true;m.receiveShadow=true;m.userData.lod=lod;group.add(m);}}
      sol.push({cx:mx,cz:mz,rx:len/2,rz:.8,c:Math.cos(wry),s:Math.sin(wry),bt:'wall'});
    }
    // corner towers and gate towers
    const towers=[Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4,gateAng-.24,gateAng+.24];
    towers.forEach((a,i)=>{const tx=cx+Math.cos(a)*R,tz=cz+Math.sin(a)*R;const gate=i>=4;const h=gate?5.6:4.8;sol.push({cx:tx,cz:tz,rx:2.0,rz:2.0});
      // S251 — a coursed round tower near, the old tower its distant copy, both where the tower stands
      for(const [geo,lod] of [[gateTowerHi('stone',h-2.4,capC,c(st.roof),pRng(pHash('fortT|'+e.seed+'|'+i))),'hi'],[mergeParts([{geo:new THREE.CylinderGeometry(1.4,1.6,h,8),color:capC,y:h/2,jitter:.05},{geo:new THREE.ConeGeometry(1.7,1.4,8),color:c(st.roof),y:h+.8,jitter:.05}]),'lo']]){const m=new THREE.Mesh(geo,VC_MAT);m.position.set(tx,y0,tz);m.castShadow=true;m.receiveShadow=true;m.userData.lod=lod;group.add(m);}
      if(gate){ /* S251 — the banner hangs clear of the wider tower */ const pole=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,1.0),new THREE.MeshLambertMaterial({color:0x2a2622}));pole.position.set(tx,y0+h+.4,tz+2.05);group.add(pole);const cloth=new THREE.Mesh(new THREE.PlaneGeometry(.9,2.6),new THREE.MeshLambertMaterial({color:nationOf(...cellOf(cx,cz)).banner,side:THREE.DoubleSide}));cloth.position.set(tx,y0+h-.9,tz+2.3);group.add(cloth);}});
    // S256 — the keep, in detail near and its old boxes far, both where the keep stands so they share a bake cluster
    {const K=FORT_KEEP[e.seed];if(K){delete FORT_KEEP[e.seed];for(const [geo,lod] of [[fortKeepGeoHi(11,9,7.2,K.banner,pRng(pHash('fortK|'+e.seed))),'hi'],[mergeParts(K.lo),'lo']]){const m=new THREE.Mesh(geo,VC_MAT);m.position.set(K.x,K.y,K.z);m.castShadow=true;m.receiveShadow=true;m.userData.lod=lod;m.userData.keep=true;group.add(m);}}}
    // barracks either side of the yard, doors toward the keep
    const S={site:{id:'fort_'+e.seed,x:cx,z:cz,pad:R+2,kind:'fort'},group,sol,houses:[],npcs:[],reg:'anglo',residents:[],lamps:[],_gates:[],reach:R+6,chimneys:[]};
    [[-1,0],[1,0]].forEach(([sx])=>{const bx=cx+sx*15,bz=cz+9;const geo=buildingGeo(7,5,STYLE.garrison,r,{chimney:true,twoStory:false,h:2.8,rise:1.2});const m=new THREE.Mesh(geo,VC_MAT);m.position.set(bx,worldH(bx,bz)-.06,bz);m.rotation.y=sx>0?Math.PI/2:-Math.PI/2;{const ch=chimneyAt(geo,m,'barracks');if(ch)S.chimneys.push(ch);} /* S345 — the barracks' smoke */m.castShadow=true;m.receiveShadow=true;group.add(m);if(geo.userData.lo){m.userData.lod='hi';const l=new THREE.Mesh(geo.userData.lo,VC_MAT);l.position.copy(m.position);l.rotation.y=m.rotation.y;l.castShadow=true;l.userData.lod='lo';group.add(l);} /* S202 — its distant copy, baked into the POI's clusters */sol.push({cx:bx,cz:bz,rx:2.7,rz:3.7,c:Math.cos(m.rotation.y),s:Math.sin(m.rotation.y),bt:'barracks'});});
    // v80 S132 — a paved way from the gate to the keep's steps, so the courtyard reads as a courtyard
    {const z0=cz+R-1,z1=cz-8.5+4.5+2.4;const segs2=Math.max(4,Math.round(Math.abs(z0-z1)/3));for(let i=0;i<segs2;i++){const zz=z0+(z1-z0)*(i+.5)/segs2;const m=new THREE.Mesh(new THREE.BoxGeometry(2.6,.12,Math.abs(z1-z0)/segs2+.1),new THREE.MeshLambertMaterial({color:0x8a8078}));m.position.set(cx,worldH(cx,zz)+.05,zz);group.add(m);}}
    // torches on the gate towers
    towers.slice(4).forEach(a=>{const tx=cx+Math.cos(a)*R*.86,tz=cz+Math.sin(a)*R*.86;const glass=new THREE.Group();const fl=new THREE.Mesh(new THREE.ConeGeometry(.12,.35,6),new THREE.MeshBasicMaterial({color:0xffa030}));glass.add(fl);glass.position.set(tx,y0+5.4,tz);group.add(glass);const l=regLight(0xffb050,0,14,S.site.id);l.position.copy(glass.position);S.lamps.push({glass,light:l});});
    bakeSettlement(S);if(S.chimneys.length)try{smokeFor(S);}catch(err){console.warn('smoke',err);}sc.add(group);SETTLE.set(S.site.id,S);if(IMPOSTORS['door_'+e.seed])IMPOSTORS['door_'+e.seed].visible=false; // v80 S132 — the fort's stand-in (a 48u grey cylinder) was never hidden: it was the "ring inside the fort"
    S.impostorId='door_'+e.seed;return S;
  }
  // Heavy statics (door rocks, fort exteriors, signposts, camps) only for a
  // cell the player is in or within NEAR_STATIC of — ~9 cells of them is
  // thousands of draw calls.
  const NEAR_STATIC=420,FAR_STATIC=900;
  function cellRectDist(c){const dx=Math.max(c.ox-px,0,px-(c.ox+SIZE)),dz=Math.max(c.oz-pz,0,pz-(c.oz+SIZE));return Math.hypot(dx,dz);}
  function staticSteps(L){
    const c=L.cell,k=cellKey(c.i,c.j);let solStart=0;L.statics2=[];
    const track=fn=>{const before=sc.children.length;fn();for(let n=before;n<sc.children.length;n++)L.statics2.push(sc.children[n]);};
    return [
      ()=>{solStart=STATIC_SOL.length;track(()=>{const pts=c.doors.filter(e=>dungeonWorldPos[e.seed]).map(e=>{const p=makePortalDef(e);const w=dungeonWorldPos[e.seed];p.x=w.x;p.z=w.z;p.zone='world';p.cell=k;p.sigil=!!(e.sigil||e.kind==='fort_door');p.theme=p.theme||e.theme;if(e.lair)p.lair=e.lair;return p;});
        // caves get the engine's door rocks; forts get our keep (the exterior kit had stray shells and walk-through walls)
        spawnPortalMeshes(sc,pts.filter(p=>p.kind!=='fort_door'),STATIC_SOL,worldH);pts.filter(p=>p.kind==='fort_door').forEach(p=>buildFortKeep(p));pts.forEach(p=>{portals.push(p);L.portals.push(p);});});},
      ()=>{L.forts=[];c.doors.filter(e=>e.kind==='fort_door'&&dungeonWorldPos[e.seed]).forEach(e=>{const S=buildFortCompound(e,dungeonWorldPos[e.seed],k);L.forts.push(S);});},
      ()=>track(()=>buildSiteMarkersFor(c)),
      ()=>track(()=>buildCampsFor(c,k)),
      ()=>{for(let n=solStart;n<STATIC_SOL.length;n++)STATIC_SOL[n].cell=k;L.staticsBuilt=true;L.staticsPending=false;
        // bake: every plain top-level static mesh in this cell into cluster meshes
        const flat=[];(L.statics2||[]).forEach(o=>{if(o.isMesh&&!o.userData.noBake)flat.push(o);else if(o.isGroup)o.children.filter(c=>c.isMesh).forEach(c=>{c.userData.parentGroup=o;});});
        const baked=bakeMeshes(flat,sc,new Set());L.statics2=(L.statics2||[]).filter(o=>o.parent).concat(baked);},
    ];
  }
  function dropStatics(L){
    const k=cellKey(L.cell.i,L.cell.j);
    (L.statics2||[]).forEach(o=>sc.remove(o));L.statics2=[];
    (L.forts||[]).forEach(S=>{sc.remove(S.group);SETTLE.delete(S.site.id);unregLights(S.site.id);if(S.impostorId&&IMPOSTORS[S.impostorId])IMPOSTORS[S.impostorId].visible=true;});L.forts=[];unregLights('cell:'+k);
    L.portals.forEach(p=>{const i=portals.indexOf(p);if(i>=0)portals.splice(i,1);});L.portals=[];
    for(let i=STATIC_SOL.length-1;i>=0;i--)if(STATIC_SOL[i].cell===k&&STATIC_SOL[i].rx!==undefined)STATIC_SOL.splice(i,1);
    for(let i=beds.length-1;i>=0;i--)if(beds[i].cell===k)beds.splice(i,1);
    for(let i=STAMPS.length-1;i>=0;i--)if(STAMPS[i].cell===k&&String(STAMPS[i].id).startsWith('camp_')){sgRemove(STAMPS[i]);STAMPS.splice(i,1);}
    L.staticsBuilt=false;
  }
  function loadCell(i,j){const st=loadCellSteps(i,j);if(st){st.forEach(f=>f());const L=LOADED.get(cellKey(i,j));if(L&&!L.staticsBuilt){L.staticsPending=true;staticSteps(L).forEach(f=>f());}}}
  function unloadCell(k){
    const L=LOADED.get(k);if(!L)return;const c=L.cell;
    // settlements in this cell go first
    c.sites.forEach(t=>{if(SETTLE.has(t.id))disposeSettlement(t.id);});
    if(L.staticsBuilt||L.staticsPending)dropStatics(L);
    L.statics.forEach(o=>{sc.remove(o);});
    c.regions.forEach(r_=>{const i=REGIONS.indexOf(r_);if(i>=0)REGIONS.splice(i,1);});
    c.peaks.forEach(p=>{const i=PEAKS.indexOf(p);if(i>=0)PEAKS.splice(i,1);});c.lakes.forEach(l=>{const i=LAKES.indexOf(l);if(i>=0)LAKES.splice(i,1);});c.rivers.forEach(rv=>{const i=RIVERS.indexOf(rv);if(i>=0)RIVERS.splice(i,1);});(c.inlets||[]).forEach(inl=>{const i=INLETS.indexOf(inl);if(i>=0)INLETS.splice(i,1);});
    c.sites.forEach(t=>{const i=SITES.indexOf(t);if(i>=0)SITES.splice(i,1);delete SITE[t.id];});
    L.stamps.forEach(s=>{const i=STAMPS.indexOf(s);if(i>=0)STAMPS.splice(i,1);sgRemove(s);});
    L.portals.forEach(p=>{const i=portals.indexOf(p);if(i>=0)portals.splice(i,1);});
    L.doorSeeds.forEach(sd=>{delete dungeonWorldPos[sd];const i=CELL_DOORS.findIndex(e=>e.seed===sd);if(i>=0)CELL_DOORS.splice(i,1);});
    for(let i=STATIC_SOL.length-1;i>=0;i--)if(STATIC_SOL[i].cell===k)STATIC_SOL.splice(i,1);
    for(let i=beds.length-1;i>=0;i--)if(beds[i].cell===k)beds.splice(i,1);
    for(let i=impostorList.length-1;i>=0;i--)if(impostorList[i].cell===k){delete IMPOSTORS[impostorList[i].id];impostorList.splice(i,1);}
    // roads: drop this cell's segments and rebuild the grid
    L.roads.forEach(rd=>{const i=ROADS.indexOf(rd);if(i>=0)ROADS.splice(i,1);});
    rebuildRoadGrid();
    LOADED.delete(k);
  }
  let _cellT=0;
  function tickCells(dt,force){
    _cellT+=dt;if(!force&&_cellT<.75)return;_cellT=0;
    const [pi,pj]=cellOf(px,pz);
    // unload far cells
    for(const k of Array.from(LOADED.keys())){const L=LOADED.get(k);if(Math.abs(L.cell.i-pi)>1||Math.abs(L.cell.j-pj)>1)unloadCell(k);}
    // load the 3×3, nearest first, through the job queue
    const want=[];for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=pi+di,j=pj+dj;if(i<0||j<0||i>=GRID||j>=GRID)continue;if(!LOADED.has(cellKey(i,j)))want.push([i,j,di*di+dj*dj]);}
    want.sort((a,b)=>a[2]-b[2]);
    if(force)want.forEach(([i,j])=>loadCell(i,j));
    // S458 — a cell unloaded while its job is part-way stops the job: its later steps (doors above all) went on into a cell
    // no longer listed, and loaded again its doors stood twice in DOORS, so the next unload left one with no position
    else want.forEach(([i,j])=>{if(!JOBS.some(x=>x.cellKey===cellKey(i,j))){let steps=null,L0=null;const job={fn:()=>{if(!steps){steps=loadCellSteps(i,j);if(!steps)return false;L0=LOADED.get(cellKey(i,j));}if(LOADED.get(cellKey(i,j))!==L0)return false;const f=steps.shift();if(f)f();return steps.length>0;},prio:5,cellKey:cellKey(i,j)};JOBS.push(job);}});
    // statics near the player, dropped when far
    for(const L of LOADED.values()){if(L.pending)continue;const d=cellRectDist(L.cell);
      if(d<NEAR_STATIC&&!L.staticsBuilt&&!L.staticsPending){L.staticsPending=true;if(force){staticSteps(L).forEach(f=>f());}else{let st=null;const lk=cellKey(L.cell.i,L.cell.j);JOBS.push({fn:()=>{if(LOADED.get(lk)!==L)return false;if(!st)st=staticSteps(L);const f=st.shift();if(f)f();return st.length>0;},prio:6});}}
      else if(d>FAR_STATIC&&L.staticsBuilt)dropStatics(L);}
  }

  // ═══ SITES ═══════════════════════════════════════════════════════════
  // Settlement / POI table. Positions follow MAP_LAYOUT's col/row grid so
  // the world matches the lore map. `r` is the flattened pad radius (the
  // Session 3 settlement generator builds inside it). Nothing is built on
  // a site yet except a cairn + signpost (and the trader tent at Ashenmoor).
  const GX=c=>250+c*270, GZ=r=>330+r*295;
  const HOME_SITES=[
    {id:'mur_pierre',    name:'Mur Pierre',      kind:'garrison', x:800,z:700, pad:70},
    {id:'colmans_rest',  name:"Colmán's Rest",   kind:'village',  x:1000,z:1250, pad:45},
    {id:'la_grise',      name:'La Grise',        kind:'village',  x:1350,z:1050, pad:45},
    {id:'la_porte_grise',name:'La Porte Grise',  kind:'outpost',  x:450,z:350, pad:26},
    {id:'vieux_marche',  name:'Vieux Marché',    kind:'town',     x:1500,z:800, pad:95},
    {id:'ironhaven',     name:'Ironhaven',       kind:'town',     x:1900,z:450, pad:100},
    {id:'dunmore',       name:'Dunmore',         kind:'town',     x:1550,z:1400, pad:95},
    {id:'portclare',     name:'Portclare',       kind:'port',     x:1950,z:1250, pad:90},
    {id:'coeur_de_vie',  name:'Coeur de Vie',    kind:'city',     x:1150,z:380, pad:135},
    {id:'thorngate',     name:'The Thorngate',   kind:'outpost',  x:450,z:800, pad:26},
    {id:'salthaven',     name:'Salthaven',       kind:'village',  x:350,z:1050, pad:45},
    {id:'hearthwick',    name:'Hearthwick',      kind:'village',  x:1100,z:1450, pad:45},
    {id:'droichead',     name:'Droichead',       kind:'village',  x:1250,z:1200, pad:45},
    {id:'cill_beag',     name:'Cill Beag',       kind:'village',  x:1350,z:1650, pad:40},
    {id:'carraig_mor',   name:'Carraig Mór',     kind:'town',     x:450,z:1800, pad:90},
    {id:'ashenmoor',     name:'Ashenmoor',       kind:'village',  x:800,z:1750, pad:58},
    {id:'hermit_camp',   name:"Hermit's Camp",   kind:'camp',     x:1750,z:1000, pad:16},
    {id:'caer_uaigneach',name:'Caer Uaigneach',  kind:'ruin',     x:2100,z:900, pad:45},
    {id:'inis_rua',      name:'Inis Rua',        kind:'poi',      x:150,z:2050, pad:0},
    {id:'ashfeld',       name:'The Ashfeld',     kind:'poi',      x:600,z:2000, pad:35},
    {id:'redwater_ford', name:'Redwater Ford',   kind:'village',  x:950,z:2050, pad:45},
  ];
  HOME_SITES.forEach(t=>{if(t.x==null){t.x=GX(t.c);t.z=GZ(t.r);}}); // v80 S134 — the province laid out by hand (x,z), the grid kept for anything still on it
  const SITES=[],SITE={}; // live: sites of loaded cells
  let ASH_X=0,ASH_Z=0; // set when the home cell loads
  const ASH_LOCAL=60; // old overworld zone content centre (local coords)

  // Roads: settlement pairs. `via` names the lore corridor (for signposts
  // later); `fort` places that fort a little off the road's midpoint.
  const HOME_ROAD_DEFS=[
    {a:'ashenmoor',b:'hearthwick',   via:'An Bealach Mór'},
    {a:'ashenmoor',b:'ashfeld',      via:'South Road'},
    {a:'ashfeld',b:'redwater_ford',  via:'South Road'},
    {a:'ashenmoor',b:'salthaven',    via:'West Track'},
    {a:'salthaven',b:'carraig_mor',  via:'Coastal Road'},
    {a:'hearthwick',b:'thorngate',   via:'An Bealach Mór'},
    {a:'thorngate',b:'la_porte_grise',via:'The Deepwood Road', fort:7106, fortAt:.55, fortOff:90},
    {a:'la_porte_grise',b:'vieux_marche',via:'La Route Royale'},
    {a:'vieux_marche',b:'ironhaven', via:'La Route Royale', fort:7104},
    {a:'vieux_marche',b:'dunmore',   via:'La Route Royale'},
    {a:'dunmore',b:'portclare',      via:'Coastal Road', fort:7103},
    {a:'ironhaven',b:'portclare',    via:'Garrison Road'},
    {a:'portclare',b:'coeur_de_vie', via:'Capital Road'},
    {a:'hearthwick',b:'droichead',   via:'An Bealach Mór', fort:7100},
    {a:'thorngate',b:'droichead',    via:'The North Approach', fort:7099},
    {a:'droichead',b:'cill_beag',    via:'Cill Beag Path'},
    {a:'vieux_marche',b:'la_grise',  via:'Northern Road', fort:7105},
    {a:'la_grise',b:'colmans_rest',  via:'Foothill Track'},
    {a:'colmans_rest',b:'mur_pierre',via:'Mountain Pass', fort:7102, fortAt:.5},
    {a:'cill_beag',b:'hermit_camp',  via:'The Wastes'},
    {a:'hermit_camp',b:'caer_uaigneach',via:'The Wastes', fort:7101},
  ];
  const ROAD_DEFS=[]; // live

  // ═══ ROADS ═══════════════════════════════════════════════════════════
  // Each road is a Catmull-Rom spline through its two sites and three
  // interior points pushed sideways by hashed noise, sampled every 6u.
  // Sample heights are baseH smoothed along the spline so the road bed
  // rolls with the land instead of stair-stepping. Segments are indexed in
  // a 32u grid so roadInfo() is one lookup.
  const ROADS=[];            // {def, pts:[{x,z,y}]}
  const RSEG=[];             // {ax,az,bx,bz,ay,by,len2,road}
  const RGRID=new Map();     // cellId -> [segIdx]
  const RCELL=32;
  const RREACH=ROAD_BLEND+2;
  function rcell(x,z){return (Math.floor(x/RCELL)+1)*4096+(Math.floor(z/RCELL)+1);} // x up to 28,800 → cx ≤ 900, fits
  function catmull(p0,p1,p2,p3,t){
    const t2=t*t,t3=t2*t;
    return {x:.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
            z:.5*((2*p1.z)+(-p0.z+p2.z)*t+(2*p0.z-5*p1.z+4*p2.z-p3.z)*t2+(-p0.z+3*p1.z-3*p2.z+p3.z)*t3)};
  }
  function buildRoads(){/* superseded by buildRoad(def) per cell */}
  function buildRoad(def){
      const A=SITE[def.a],B=SITE[def.b];if(!A||!B)return null;
      ROAD_DEFS.push(def);
      const ri=ROAD_DEFS.length;
      const dx=B.x-A.x,dz=B.z-A.z,L=Math.hypot(dx,dz);
      const nx=-dz/L,nz=dx/L; // left normal
      const ctrl=[{x:A.x,z:A.z}];
      for(let k=1;k<=3;k++){
        const t=k/4;
        const off=(_smoothNoise(ri*37+k*11,ri*5,SEED+40,1)-.5)*2*L*.11;
        ctrl.push({x:A.x+dx*t+nx*off,z:A.z+dz*t+nz*off});
      }
      ctrl.push({x:B.x,z:B.z});
      // sample
      const pts=[];
      const n=ctrl.length;
      for(let i=0;i<n-1;i++){
        const p0=ctrl[Math.max(0,i-1)],p1=ctrl[i],p2=ctrl[i+1],p3=ctrl[Math.min(n-1,i+2)];
        const segL=Math.hypot(p2.x-p1.x,p2.z-p1.z);
        const steps=Math.max(2,Math.round(segL/6));
        for(let sI=0;sI<steps;sI++){pts.push(catmull(p0,p1,p2,p3,sI/steps));}
      }
      pts.push({x:B.x,z:B.z});
      return registerRoad(def,pts);
  }
  function rebuildRoadGrid(){
    RSEG.length=0;RGRID.clear();ROAD_DEFS.length=0;
    ROADS.forEach(road=>{ROAD_DEFS.push(road.def);indexRoad(road);});
  }
  function indexRoad(road){
    const pts=road.pts;
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1];
      const seg={ax:a.x,az:a.z,bx:b.x,bz:b.z,ay:a.y,by:b.y,len2:(b.x-a.x)**2+(b.z-a.z)**2,road};
      const idx=RSEG.push(seg)-1;
      const x0=Math.min(a.x,b.x)-RREACH,x1=Math.max(a.x,b.x)+RREACH,z0=Math.min(a.z,b.z)-RREACH,z1=Math.max(a.z,b.z)+RREACH;
      for(let cz=Math.floor(z0/RCELL);cz<=Math.floor(z1/RCELL);cz++)for(let cx=Math.floor(x0/RCELL);cx<=Math.floor(x1/RCELL);cx++){
        const id=(cx+1)*4096+(cz+1);let arr=RGRID.get(id);if(!arr){arr=[];RGRID.set(id,arr);}arr.push(idx);}
    }
  }
  function registerRoad(def,pts){
    {
      // heights: baseH smoothed over ±5 samples (~30u each way)
      const raw=pts.map(p=>baseH(p.x,p.z));
      for(let i=0;i<pts.length;i++){
        let acc=0,w=0;
        for(let k=-5;k<=5;k++){const j=i+k;if(j<0||j>=raw.length)continue;const wt=6-Math.abs(k);acc+=raw[j]*wt;w+=wt;}
        pts[i].y=Math.max(SEA_Y+.6,acc/w);
        // inside a site pad the bed is the pad — no smoothed-in dip from outside
        const st=stampAt(pts[i].x,pts[i].z);
        if(st&&st.kind==='site'){const d=Math.hypot(pts[i].x-st.x,pts[i].z-st.z);const t=1-sstep(st.r-14,st.r,d);pts[i].y=pts[i].y*(1-t)+st.y*t;}
      }
      const road={def,pts};
      ROADS.push(road);indexRoad(road);
      return road;
    }
  }
  // Spur paths from each fort's gate to the nearest point on its road.
  // v80 S134 — a stone bridge where a road crosses a river: a deck above the ford, parapets, piers; a named place on the map
  // S248 — a stone bridge in one vertex-coloured mesh, along local z, the deck's top at .22 where the old deck's was .25
  // and its width, rails and piers where they were (the collision is unchanged). The side's profile is extruded across
  // the bridge with the arches cut out of it, so the piers, spandrels and barrel vaults are one solid; a ring of arch
  // stones stands proud on each face, the piers get pointed cutwaters up- and downstream, a string course runs under
  // the rails, the deck is paved in setts, and the rails are two courses of blocks on a mortar core with a coping and
  // a post at each end. drop: from the deck down to the river bed.
  function bridgeGeo(len,drop,seed){const r=pRng(seed>>>0),P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+r()*a*2).getHex();
    const W=2.6,top=.22,crown=-.6,yb=-drop+.15,piers=Math.max(1,Math.round(len/9)),pz=[];for(let q=0;q<piers;q++)pz.push(-len/2+len*(q+.5)/piers);
    const spans=[];const edges=[-len/2+2,...pz.flatMap(z=>[z-1.1,z+1.1]),len/2-2];for(let q=0;q<edges.length;q+=2){const z0=edges[q],z1=edges[q+1],sp=z1-z0;if(sp<2)continue;
      const ys=Math.max(yb+.4,crown-sp/2),h=Math.max(.3,Math.min(sp/2,crown-ys)),R=(sp*sp/4+h*h)/(2*h);spans.push({z0,z1,ys,h,R,zc:(z0+z1)/2,yc:ys+h-R,al:Math.asin(Math.min(1,sp/2/R))});}
    const sh=new THREE.Shape();sh.moveTo(-len/2,-drop);sh.lineTo(len/2,-drop);sh.lineTo(len/2,top);sh.lineTo(-len/2,top);sh.lineTo(-len/2,-drop);
    for(const a of spans){const h=new THREE.Path();h.moveTo(a.z0,yb);h.lineTo(a.z1,yb);h.lineTo(a.z1,a.ys);const N=14;for(let i=1;i<N;i++){const t=Math.PI/2-a.al+2*a.al*i/N;h.lineTo(a.zc+a.R*Math.cos(t),a.yc+a.R*Math.sin(t));}h.lineTo(a.z0,a.ys);h.lineTo(a.z0,yb);sh.holes.push(h);}
    const body=new THREE.ExtrudeGeometry(sh,{depth:W*2,bevelEnabled:false,curveSegments:4});body.translate(0,0,-W);add(body,0x8a8078,0,0,0,0,Math.PI/2,0,.02);
    // the arch stones: a ring on each face, the keystone a little larger (local z is minus the profile's u)
    for(const a of spans){const N=Math.max(7,Math.round(a.R*2*a.al/.55));for(let i=0;i<N;i++){const t=Math.PI/2+a.al-2*a.al*(i+.5)/N,rr=a.R+.22,key=i===(N>>1);
      const L=a.R*2*a.al/N-.05;for(const sx of [-1,1])add(new THREE.BoxGeometry(.14,key?.56:.44,L),vary(0x9a9084,.08),sx*(W+.05),a.yc+rr*Math.sin(t)+(key?.04:0),-(a.zc+rr*Math.cos(t)),t-Math.PI/2,0,0,.04);}}
    // cutwaters, pointed up- and downstream, to the arches' springing, capped with a stone pyramid
    const yCut=Math.min(...spans.map(a=>a.ys),crown-.4),ch=yCut+drop;
    if(ch>.3)for(const z of pz)for(const sx of [-1,1]){const rr=1.27;add(new THREE.CylinderGeometry(rr,rr,ch,3),0x6e675e,sx*(W+rr*.5-.02),-drop+ch/2,z,0,sx*Math.PI/2,0,.08);add(SK.cone(rr,.9,3),0x7a7268,sx*(W+rr*.5-.02),yCut+.45,z,0,sx*Math.PI/2,0,.06);}
    // a string course under the rails, the deck paved in rows of slabs laid broken-joint
    for(const sx of [-1,1])add(SK.rbox(.24,.18,len,.05,1),0x7a7268,sx*(W-.02),.04,0,0,0,0,.05);
    for(let z=-len/2+.45;z<len/2-.3;z+=.9){let x=-2.15;while(x<2.1){const w=Math.min(2.15-x,.9+r()*.9);if(w>.2)add(new THREE.BoxGeometry(w-.05,.06,.84),vary(0x736c62,.12),x+w/2,top+.03,z,0,0,0,.05);x+=w;}}
    // the rails: a mortar core, two courses of blocks laid broken-joint, a coping, a post at each end
    for(const sx of [-1,1]){const x=sx*2.45;add(new THREE.BoxGeometry(.26,.78,len-.6),0x4e4940,x,top+.39,0,0,0,0,.03);
      for(let c=0;c<2;c++){let z=-len/2+.6,L=c?.5+r()*.5:1.1+r()*.5;while(z<len/2-.65){L=Math.min(len/2-.6-z,L);add(new THREE.BoxGeometry(.34,.36,L-.05),vary(0x8e8478,.12),x,top+.2+c*.39,z+L/2,0,0,0,.05);z+=L;L=1.1+r()*.5;}}
      for(let z=-len/2+.6;z<len/2-.65;){const L=Math.min(len/2-.6-z,2.4);add(SK.rbox(.44,.14,L-.03,.05,1),vary(0xa0978a,.06),x,top+.86,z+L/2,0,0,0,.04);z+=L;}
      for(const e of [-1,1]){add(SK.rbox(.6,1.3,.6,.08,1),vary(0x8a8078,.06),x,top+.65,e*(len/2-.3),0,0,0,.05);add(SK.cone(.43,.35,4),0x9a9084,x,top+1.47,e*(len/2-.3),0,Math.PI/4,0,.04);}}
    return mergeParts(P);}
  function buildBridges(c,k,L){const rivers=RIVERS.filter(rv=>rv.w);if(!rivers.length)return;const built=new Set();
    for(const rd of L.roads){if(!rd.pts||rd.pts.length<4)continue;
      for(const rv of rivers){let run=[];const runs=[];for(let i=0;i<rd.pts.length;i++){const p=rd.pts[i];riverSample(rv,0,rv.pts.length-2,p.x,p.z,_rs);if(_rs[0]<_rs[1]+(rv.ws?.4*(8+_rs[1]):0)+1.5)run.push(i);else if(run.length){runs.push(run);run=[];}}if(run.length)runs.push(run);
        for(const rn of runs){const i0=rn[0],i1=rn[rn.length-1];const a=rd.pts[Math.max(0,i0-1)],b=rd.pts[Math.min(rd.pts.length-1,i1+1)];const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;riverSample(rv,0,rv.pts.length-2,mx,mz,_rs);const bed=rv.depth!=null?rv.depth:rvDepth(_rs[1]); /* S432 — a routed piece's bed follows its width at the crossing */
        if(rn.length<2)continue;if(Math.min(...rn.map(i=>rd.pts[i].y))>bed+5)continue; /* on a bank, not a crossing */
          // S248 — a crossing already bridged in this pass is skipped; one bridged when the cell last loaded keeps its site
          // (the cell is cached with it) and is built again: the old test skipped it, so a reloaded cell lost its bridges
          const prev=c.sites.find(t=>t.kind==='bridge'&&Math.hypot(t.x-mx,t.z-mz)<40);if(prev&&built.has(prev))continue;
          const len=Math.hypot(b.x-a.x,b.z-a.z)+6;const ang=Math.atan2(b.x-a.x,b.z-a.z);const y=Math.max(a.y,b.y,SEA_Y+.9)+.25;
          const g=new THREE.Mesh(bridgeGeo(len,y-bed+.05,Math.round(mx)*31+Math.round(mz)),VC_MAT);g.position.set(mx,y,mz);g.rotation.y=ang;g.castShadow=true;g.receiveShadow=true;g.userData.bridge=true; // S248 — a stone arch bridge on the kit (it was a deck, two rails and piers as boxes)
          sc.add(g);const s_=Math.sin(ang),c_=Math.cos(ang);for(const sx of [-1,1]){STATIC_SOL.push({cx:mx+c_*sx*2.45,cz:mz-s_*sx*2.45,rx:.2,rz:len/2,c:Math.cos(ang),s:Math.sin(ang),cell:k});}
          const name=`${(rv.name||rd.def.via||'the river').replace(/^the /,'')} Bridge`;if(prev){built.add(prev);continue;}const site={id:`bridge_${k}_${c.sites.length}`,name,kind:'bridge',x:mx,z:mz,pad:0,cell:k,bridge:{y,len,ang}};c.sites.push(site);SITES.push(site);SITE[site.id]=site;built.add(site);
        }}}}
  function addFortSpurs(){}
  function addFortSpur(e,cellK){
    {
      const p=dungeonWorldPos[e.seed];if(!p)return;const gx=p.x,gz=p.z+33; // just outside the compound gate
      let best=null,bd=1e9;
      for(const r of ROADS){if(r.def.via==='spur')continue;for(const q of r.pts){const d=Math.hypot(q.x-gx,q.z-gz);if(d<bd){bd=d;best=q;}}}
      if(!best)return;
      const n=Math.max(2,Math.round(bd/6));const pts=[];
      for(let i=0;i<=n;i++){const t=i/n;pts.push({x:gx+(best.x-gx)*t,z:gz+(best.z-gz)*t});}
      const rd=registerRoad({a:'door_'+e.seed,b:'road',via:'spur'},pts);if(rd){rd.cell=cellK;const L=LOADED.get(cellK);if(L)L.roads.push(rd);}
    }
  }
  // Nearest road within RREACH: {d, y, seg} or null.
  function roadInfo(x,z){
    const arr=RGRID.get(rcell(x,z));
    if(!arr)return null;
    let best=null,bd=RREACH;
    for(let i=0;i<arr.length;i++){
      const s=RSEG[arr[i]];
      const vx=s.bx-s.ax,vz=s.bz-s.az;
      let t=s.len2>0?((x-s.ax)*vx+(z-s.az)*vz)/s.len2:0;
      t=t<0?0:t>1?1:t;
      const px_=s.ax+vx*t,pz_=s.az+vz*t;
      const d=Math.hypot(x-px_,z-pz_);
      if(d<bd){bd=d;best={d,y:s.ay+(s.by-s.ay)*t,seg:s,t};}
    }
    return best;
  }
  // Point on a road at parameter u (0..1 along its samples) plus its left normal.
  function roadPoint(road,u){
    const i=Math.min(road.pts.length-2,Math.max(0,Math.floor(u*(road.pts.length-1))));
    const a=road.pts[i],b=road.pts[i+1];
    const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1;
    return {x:(a.x+b.x)/2,z:(a.z+b.z)/2,nx:-dz/L,nz:dx/L,dx:dx/L,dz:dz/L};
  }
  // Road ribbon per chunk: a quad strip along every segment whose midpoint
  // is inside the chunk, laid on the (already flattened) terrain.
  const ROAD_MAT=VC_MAT;
  const _roadTone={};
  function roadTone(x,z){
    const ws=regionWeights(x,z);_tmpC2.setRGB(0,0,0);
    for(const e of ws){if(e.w<=0)continue;let c=_roadTone[e.r.biome];if(!c){c=_roadTone[e.r.biome]=new THREE.Color((BIOME_PROFILES[e.r.biome]||BIOME_PROFILES.plains).pathCol);}_tmpC2.r+=c.r*e.w;_tmpC2.g+=c.g*e.w;_tmpC2.b+=c.b*e.w;}
    return _tmpC2;
  }
  function buildRoadRibbons(cx,cz,group){
    const ox=cx*CHUNK,oz=cz*CHUNK;
    const pos=[],col=[];
    const W=ROAD_HALF*.85;
    function addQuad(a,b){
      const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1,nx=-dz/L*W,nz=dx/L*W;
      const c=roadTone((a.x+b.x)/2,(a.z+b.z)/2);
      const y=(x,z)=>worldH(x,z)+.07;
      const v=[[a.x+nx,a.z+nz],[a.x-nx,a.z-nz],[b.x-nx,b.z-nz],[b.x+nx,b.z+nz]];
      // Winding: counter-clockwise seen from above (+y), whichever way the road runs.
      const cross=(v[1][0]-v[0][0])*(v[2][1]-v[0][1])-(v[1][1]-v[0][1])*(v[2][0]-v[0][0]);
      const tri=cross<0?[0,1,2,0,2,3]:[0,2,1,0,3,2];
      for(const k of tri){
        const [x,z]=v[k];pos.push(x,y(x,z),z);
        // darker, worn edges; a little grain
        const edge=(k===0||k===3)?.82:(k===1||k===2)?.82:1;
        const g=1+(Math.random()-.5)*.14;
        const mid=(k===0||k===1)?1.0:1.0;
        col.push(c.r*edge*g*mid,c.g*edge*g*mid,c.b*edge*g*mid);
      }
    }
    for(const road of ROADS){
      const pts=road.pts;
      for(let i=0;i<pts.length-1;i++){
        const mx=(pts[i].x+pts[i+1].x)/2,mz=(pts[i].z+pts[i+1].z)/2;
        if(mx<ox||mx>=ox+CHUNK||mz<oz||mz>=oz+CHUNK)continue;
        addQuad(pts[i],pts[i+1]);
      }
    }
    if(!pos.length)return;
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    // Road beds are near-flat: straight-up normals (the quad winding varies
    // with road direction, so computed normals could face down and get culled).
    const nor=new Float32Array(pos.length);for(let i=1;i<nor.length;i+=3)nor[i]=1;
    g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
    g.computeBoundingSphere();
    const m=new THREE.Mesh(g,ROAD_MAT);m.receiveShadow=true;
    snowWatch(g); // v80 S147 — a road takes snow too, but trodden: half of what the fields take
    group.add(m);
  }

  // ═══ STAMPS: sites, dungeon doors, forts ═════════════════════════════
  // Old zone-local dungeon coords → world. Each old zone maps to an anchor
  // site and a scale; entries are spread around that anchor.
  const ZONE_ANCHOR={
    overworld:{x:()=>ASH_X,z:()=>ASH_Z,local:60,scale:3.4}, // v80 S134 — the seven gates that ringed Ashenmoor at 75u now lie within ~200u
    forest:{x:()=>(SITE.thorngate.x+SITE.la_porte_grise.x)/2+40,z:()=>(SITE.thorngate.z+SITE.la_porte_grise.z)/2,local:150,scale:1.5},
    ironhaven:{x:()=>SITE.ironhaven.x,z:()=>SITE.ironhaven.z,local:100,scale:2.6},
  };
  let dungeonWorldPos={}; // seed -> {x,z}
  function placeDungeons(){}
  function placeDoor(e,cellK){
    const fortRoad={};ROAD_DEFS.forEach(d=>{if(d.fort)fortRoad[d.fort]=d;});
    {
      let wx,wz;
      if(e.kind==='fort_door'&&fortRoad[e.seed]){
        const d=fortRoad[e.seed];
        const road=ROADS.find(r=>r.def===d);
        // Pick the point on the road farthest from any settlement, then
        // push 120u off it into the wilderness (north side of E–W roads so
        // the south-facing gate looks back toward the road). A spur path
        // links gate and road (addFortSpurs).
        let bestU=.5,bestD=-1;
        for(let u=.2;u<=.8;u+=.05){const q=roadPoint(road,u);let md=1e9;for(const t of SITES){if(t.pad<=0)continue;md=Math.min(md,Math.hypot(q.x-t.x,q.z-t.z));}if(md>bestD){bestD=md;bestU=u;}}
        const p=roadPoint(road,d.fortAt==null?bestU:d.fortAt);
        const nx=p.nx!=null?p.nx:Math.cos(p.ang),nz=p.nz!=null?p.nz:-Math.sin(p.ang); // v80 S131 — roadPoint gives an angle now; the old normal fields made every fort NaN
        const autoSide=nz>0?-1:1;
        const off=(d.fortOff==null?120:d.fortOff)*(d.fortSide==null?autoSide:d.fortSide);
        wx=p.x+nx*off;wz=p.z+nz*off;
        for(const t of SITES){if(t.pad<=0)continue;const dd=Math.hypot(wx-t.x,wz-t.z);const min=t.pad+120;if(dd<min){const dx=wx-t.x,dz=wz-t.z,L=Math.hypot(dx,dz)||1;wx=t.x+dx/L*min;wz=t.z+dz/L*min;}}
      } else if(e.zone==='gen'){
        wx=e.x;wz=e.z;
        for(let k=0;k<10;k++){const ri=roadInfo(wx,wz);const st=stampAt(wx,wz);
          if(ri&&ri.d<=16){const sg=ri.seg,vx=sg.bx-sg.ax,vz=sg.bz-sg.az,L=Math.hypot(vx,vz)||1;const side=(hash01(e.seed,1,77)<.5?-1:1);wx+=(-vz/L)*side*(18-ri.d+4);wz+=(vx/L)*side*(18-ri.d+4);continue;}
          if(st&&st.kind!=='door'){const dx=wx-st.x,dz=wz-st.z,L=Math.hypot(dx,dz)||1;wx=st.x+dx/L*(st.r+14);wz=st.z+dz/L*(st.r+14);continue;}
          let near=null,nd=1e9;for(const o of stampsNear(wx,wz)){if(o.kind!=='door')continue;const d=Math.hypot(wx-o.x,wz-o.z);if(d<nd){nd=d;near=o;}}
          const minD=near&&near.r>10?near.r+22:30;if(near&&nd<minD){const dx=wx-near.x,dz=wz-near.z,L=Math.hypot(dx,dz)||1e-3;const ang=L<1?hash01(e.seed,k,78)*Math.PI*2:Math.atan2(dz,dx);wx=near.x+Math.cos(ang)*(minD+2);wz=near.z+Math.sin(ang)*(minD+2);continue;}
          break;}
        if(e.wet)return null; /* S447 — one answer per gate, decided once on the bare land (dryDoors), not on what is loaded */
      } else {
        const an=ZONE_ANCHOR[e.zone]||ZONE_ANCHOR.overworld;
        wx=an.x()+(e.x-an.local)*an.scale;wz=an.z()+(e.z-an.local)*an.scale;
        // Keep cave doors off the road bed (push straight away from the
        // road) and out of site pads (push away from the pad centre).
        for(let k=0;k<10;k++){
          const ri=roadInfo(wx,wz);const st=stampAt(wx,wz);
          if(ri&&ri.d<=16){
            const sg=ri.seg,vx=sg.bx-sg.ax,vz=sg.bz-sg.az,L=Math.hypot(vx,vz)||1;
            const side=(hash01(e.seed,1,77)<.5?-1:1);
            wx+=(-vz/L)*side*(18-ri.d+4);wz+=(vx/L)*side*(18-ri.d+4);continue;
          }
          if(st&&st.kind!=='door'){
            const dx=wx-st.x,dz=wz-st.z,L=Math.hypot(dx,dz)||1;
            wx=st.x+dx/L*(st.r+14);wz=st.z+dz/L*(st.r+14);continue;
          }
          // Minimum spacing from any other door / fort.
          // v80 S134 — never inside a settlement's pad
          {let ps=null,pd=1e9;for(const t of SITES){if(!t.pad)continue;const d=Math.hypot(wx-t.x,wz-t.z);if(d<t.pad+18&&d<pd){pd=d;ps=t;}}if(ps){const dx=wx-ps.x,dz=wz-ps.z,L=Math.hypot(dx,dz)||1e-3;const ang=L<1?hash01(e.seed,k,79)*Math.PI*2:Math.atan2(dz,dx);wx=ps.x+Math.cos(ang)*(ps.pad+20);wz=ps.z+Math.sin(ang)*(ps.pad+20);continue;}}
          let near=null,nd=1e9;
          for(const o of STAMPS){if(o.kind!=='door')continue;const d=Math.hypot(wx-o.x,wz-o.z);if(d<nd){nd=d;near=o;}}
          const minD=near&&near.r>10?near.r+22:30;
          if(near&&nd<minD){
            const dx=wx-near.x,dz=wz-near.z,L=Math.hypot(dx,dz)||1e-3;
            const ang=L<1?hash01(e.seed,k,78)*Math.PI*2:Math.atan2(dz,dx);
            wx=near.x+Math.cos(ang)*(minD+2);wz=near.z+Math.sin(ang)*(minD+2);continue;
          }
          break;
        }
      }
      dungeonWorldPos[e.seed]={x:wx,z:wz};CELL_DOORS.push(e);
      const isFort=e.kind==='fort_door';
      addStamp({id:'door_'+e.seed,kind:'door',x:wx,z:wz,r:isFort?46:7,blend:isFort?34:12,cell:cellK});
      return dungeonWorldPos[e.seed];
    }
  }
  function defineSiteStamps(){}
  function definePortals(){}

  // ═══ SITE MARKERS: cairn + signpost, and the Ashenmoor trader ═════════
  // Trade sign: painted board with a symbol per business and the name below.
  const SIGN_STYLE={shipwright:{bg:'#1e3040',fg:'#d8e8f0'},guild_f:{bg:'#4a1818',fg:'#f0d8b0'},guild_m:{bg:'#182a4a',fg:'#d8e0f8'},weapon:{bg:'#3a2a1a',fg:'#e8d8b0'},armor:{bg:'#2a3040',fg:'#d8dce8'},potion:{bg:'#2e4a2a',fg:'#dce8c0'},misc:{bg:'#4a3a22',fg:'#f0e0b8'},inn:{bg:'#5a2a1e',fg:'#f2dcb0'},church:{bg:'#3a3230',fg:'#f4e8c8'},castle:{bg:'#2a2430',fg:'#e0d0a0'}};
  const _signCache={};
  function signTexture(type,name){
    const key=type+'|'+name;if(_signCache[key])return _signCache[key];
    const cv=document.createElement('canvas');cv.width=256;cv.height=256;const ctx=cv.getContext('2d');
    const st=SIGN_STYLE[type]||SIGN_STYLE.misc;
    ctx.fillStyle=st.bg;ctx.fillRect(0,0,256,256);
    ctx.strokeStyle=st.fg;ctx.lineWidth=6;ctx.strokeRect(10,10,236,236);
    ctx.fillStyle=st.fg;ctx.strokeStyle=st.fg;ctx.lineWidth=10;ctx.lineJoin='round';ctx.lineCap='round';
    ctx.save();ctx.translate(128,104);
    if(type==='weapon'){ // hammer over anvil
      ctx.fillRect(-52,18,104,14);ctx.fillRect(-34,32,68,10);ctx.fillRect(-12,42,24,18);
      ctx.save();ctx.rotate(-.7);ctx.fillRect(-6,-70,12,70);ctx.fillRect(-26,-84,52,26);ctx.restore();
    } else if(type==='armor'){ // shield
      ctx.beginPath();ctx.moveTo(-50,-50);ctx.lineTo(50,-50);ctx.lineTo(50,10);ctx.quadraticCurveTo(50,50,0,64);ctx.quadraticCurveTo(-50,50,-50,10);ctx.closePath();ctx.fill();
      ctx.fillStyle=st.bg;ctx.fillRect(-6,-36,12,80);ctx.fillRect(-36,-8,72,12);
    } else if(type==='potion'){ // bottle with leaf
      ctx.fillRect(-12,-62,24,18);ctx.beginPath();ctx.moveTo(-14,-44);ctx.lineTo(14,-44);ctx.lineTo(38,10);ctx.quadraticCurveTo(44,56,0,60);ctx.quadraticCurveTo(-44,56,-38,10);ctx.closePath();ctx.fill();
      ctx.fillStyle=st.bg;ctx.beginPath();ctx.ellipse(6,18,14,26,-.6,0,Math.PI*2);ctx.fill();
    } else if(type==='misc'){ // sack
      ctx.beginPath();ctx.moveTo(-20,-56);ctx.lineTo(20,-56);ctx.lineTo(26,-40);ctx.quadraticCurveTo(58,20,40,58);ctx.lineTo(-40,58);ctx.quadraticCurveTo(-58,20,-26,-40);ctx.closePath();ctx.fill();
      ctx.strokeStyle=st.bg;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-30,-42);ctx.lineTo(30,-42);ctx.stroke();
    } else if(type==='inn'){ // tankard
      ctx.fillRect(-40,-50,64,100);ctx.beginPath();ctx.arc(30,0,26,-Math.PI/2,Math.PI/2);ctx.lineWidth=14;ctx.stroke();
      ctx.fillStyle=st.bg;ctx.fillRect(-32,-42,48,16);ctx.fillRect(-32,-18,48,10);
    } else if(type==='church'){ // candle flame over a cross
      ctx.fillRect(-8,-10,16,70);ctx.fillRect(-36,10,72,14);ctx.beginPath();ctx.moveTo(0,-64);ctx.quadraticCurveTo(26,-36,0,-14);ctx.quadraticCurveTo(-26,-36,0,-64);ctx.fill();
    } else if(type==='shipwright'){ // anchor
      ctx.beginPath();ctx.arc(0,-44,12,0,Math.PI*2);ctx.lineWidth=10;ctx.stroke();ctx.fillRect(-6,-32,12,88);ctx.fillRect(-34,-18,68,10);ctx.beginPath();ctx.arc(0,18,40,.15*Math.PI,.85*Math.PI);ctx.lineWidth=12;ctx.stroke();
    } else if(type==='guild_f'){ // crossed swords
      ctx.save();ctx.rotate(.78);ctx.fillRect(-8,-62,16,110);ctx.fillRect(-28,10,56,10);ctx.restore();ctx.save();ctx.rotate(-.78);ctx.fillRect(-8,-62,16,110);ctx.fillRect(-28,10,56,10);ctx.restore();
    } else if(type==='guild_m'){ // six-point star
      for(let k=0;k<2;k++){ctx.save();ctx.rotate(k*Math.PI);ctx.beginPath();ctx.moveTo(0,-60);ctx.lineTo(52,30);ctx.lineTo(-52,30);ctx.closePath();ctx.fill();ctx.restore();}ctx.fillStyle=st.bg;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();
    } else { // tower
      ctx.fillRect(-30,-30,60,90);for(let i=-30;i<30;i+=20)ctx.fillRect(i,-48,12,18);
    }
    ctx.restore();
    ctx.fillStyle=st.fg;ctx.font='bold 22px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
    const words=name.split(' ');let lines=[''];words.forEach(w=>{if((lines[lines.length-1]+' '+w).trim().length>16)lines.push(w);else lines[lines.length-1]=(lines[lines.length-1]+' '+w).trim();});
    lines.slice(0,2).forEach((ln,i)=>ctx.fillText(ln,128,196+i*26,230));
    const tex=new THREE.CanvasTexture(cv);_signCache[key]=tex;return tex;
  }
  // Bracket from the wall above the door, board hanging beneath it, both faces painted.
  // S258 — a town's ironwork on the kit, each piece one vertex-coloured mesh in its own frame (local +z out from the wall or
  // towards the street, y 0 at the ground or the lantern's middle); the lit glass and flames stay the old groups.
  const IRON=0x2a2622,IRON2=0x3a3430;
  const ironAdd=P=>(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.04:j});
  // a lantern's housing round its middle: a base plate, four ribs, a pyramid cap with a ring on top (s the half-width)
  function lanternCage(add,s,h,z,y){y=y||0;add(SK.rbox(2*s+.04,.035,2*s+.04,.012,1),IRON,0,y-h/2-.02,z);for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])add(SK.cyl(.012,.012,h,4),IRON,a*s,y,z+b*s);
    add(SK.cone(s*1.55,h*.45,4),IRON,0,y+h/2+h*.2,z,0,Math.PI/4,0);add(SK.torus(.035,.01,3,8),IRON2,0,y+h/2+h*.48,z);}
  // a lamp post: a stone footing, a lathed iron post with collars and a finial, a scrolled arm and the lantern hung at .42
  function lampPostGeo(){const P=[],add=ironAdd(P);
    add(SK.rbox(.46,.22,.46,.05,1),0x7a746a,0,.09,0,0,0,0,.06);
    add(SK.lathe([[.001,.2],[.12,.2],[.12,.3],[.085,.38],[.07,1.15],[.095,1.2],[.07,1.26],[.055,3.18],[.085,3.22],[.085,3.31],[.001,3.35]],8),IRON,0,0,0);
    add(SK.ball(.055,6,4),IRON2,0,3.4,0);
    add(SK.cyl(.022,.022,.5,5),IRON,0,3.26,.25,Math.PI/2,0,0);add(SK.ball(.035,5,4),IRON2,0,3.26,.5);
    add(SK.torus(.13,.015,3,10,Math.PI*1.1),IRON,0,3.13,.14,0,Math.PI/2,-.1);
    add(SK.cyl(.012,.012,.08,4),IRON,0,3.23,.42);lanternCage(add,.13,.36,.42,2.85);
    return mergeParts(P);}
  // a door lantern: a wall plate, a bracket with a scroll under it, the lantern hung at .25 out, its middle at y 0
  function doorLanternGeo(){const P=[],add=ironAdd(P);
    add(SK.rbox(.1,.26,.03,.01,1),IRON,0,.12,.015);add(SK.cyl(.016,.016,.3,4),IRON,0,.14,.15,Math.PI/2,0,0);
    add(SK.torus(.08,.01,3,8,Math.PI),IRON,0,.06,.08,0,Math.PI/2,Math.PI/2);lanternCage(add,.08,.24,.25);return mergeParts(P);}
  // a hanging trade sign: a wall plate, the arm out to 1.3 with a finial, a scrolled brace below it, rings and short chains,
  // and a framed board round the old painted faces (1.0 square at x ±.035, its middle 1.15 out and 2.1 up)
  function tradeSignGeo(){const P=[],add=ironAdd(P);
    add(SK.rbox(.12,.5,.035,.012,1),IRON,0,2.55,.018);add(SK.cyl(.028,.028,1.3,5),IRON,0,2.65,.65,Math.PI/2,0,0);
    add(SK.ball(.045,6,4),IRON2,0,2.65,1.32);
    for(const [r_,y,z] of [[.36,2.32,.34],[.16,2.52,.72]])add(SK.torus(r_,.016,3,10,Math.PI/2),IRON,0,y,z,0,Math.PI/2,Math.PI/2);
    add(SK.cyl(.018,.018,.7,4),IRON,0,2.36,.27,.95,0,0);
    for(const s of [-1,1]){const z=1.15+s*.38;add(SK.torus(.03,.008,3,6),IRON2,0,2.62,z);add(SK.torus(.025,.007,3,6),IRON2,0,2.64,z,0,Math.PI/2,0);}
    add(SK.rbox(.06,1.02,1.02,.015,1),0x4a3a26,0,2.1,1.15,0,0,0,.06);
    for(const [w,h,y,dz] of [[1.12,.06,2.63,0],[1.12,.06,1.57,0],[.06,1.12,2.1,-.53],[.06,1.12,2.1,.53]])add(SK.rbox(.078,h,w===1.12?1.12:.06,.012,1),0x3a2a1a,0,y,1.15+dz,0,0,0,.06);
    return mergeParts(P);}
  function buildTradeSign(group,type,name,doorX,doorZ,tx,tz,ry,y){
    if(type==='barber'){buildBasinSign(group,doorX,doorZ,tx,tz,y);return;}
    const armLen=1.3;const bx=doorX+tx*(armLen-.15),bz=doorZ+tz*(armLen-.15);
    {const m=new THREE.Mesh(tradeSignGeo(),VC_MAT);m.position.set(doorX,y,doorZ);m.rotation.y=ry;m.castShadow=true;group.add(m);} // S258 — the arm, brace, chains and framed board on the kit
    const tex=signTexture(type,name);
    [1,-1].forEach(sd=>{const f=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.0),new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide}));
      // board faces along the wall: normal = wall tangent
      f.position.set(bx+(-tz)*sd*.035,y+2.1,bz+(tx)*sd*.035);f.rotation.y=ry-Math.PI/2*sd;f.userData.sign=name;group.add(f);}); // front of each face points away from the board
  }
  // S512 — the barber's sign: the furniture kit's three brass basins on an iron arm (no painted board), at the world's scale
  // (the kit is drawn at the rooms' scale, a man 1.28 tall), the arm out from the wall over the door
  function buildBasinSign(group,doorX,doorZ,tx,tz,y){const K=furnKit(),P=K.basinSign(1),m=new THREE.Mesh(K.merge(P.list,true),VC_MAT);
    m.scale.setScalar(1.9);m.position.set(doorX,y+2.32,doorZ);m.rotation.y=Math.atan2(-tz,tx);m.castShadow=true;m.userData.sign='barber';group.add(m);}
  const _txtCache={};
  function textPlane(str,w,h,fg,bg){
    const key=str+'|'+w+'|'+h;
    let tex=_txtCache[key];
    if(!tex){
      const cv=document.createElement('canvas');cv.width=256;cv.height=64;
      const ctx=cv.getContext('2d');ctx.fillStyle=bg||'#6b4a26';ctx.fillRect(0,0,256,64);
      ctx.fillStyle=fg||'#f0e0b8';ctx.font='bold 34px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(str,128,34,240);
      tex=new THREE.CanvasTexture(cv);_txtCache[key]=tex;
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:tex}));
  }
  // S253 — the signpost and the town's name boards on the kit, each one vertex-coloured mesh (they were boxes): a
  // round weathered post with a cap on a little cairn, arms of plank cut to a point; the name board framed on two round
  // posts with caps and stone footings. The lettering stays the textured planes it was, on the planks' faces.
  function signpostGeo(angs,seed){const r=pRng(seed>>>0),P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+r()*a*2).getHex();
    for(let k=0;k<5;k++){const a=k/5*Math.PI*2+r(),d=.22+r()*.1;add(SK.rbox(.26+r()*.12,.2+r()*.1,.24+r()*.1,.05,1),vary(0x7a746a,.12),Math.cos(a)*d,.06,Math.sin(a)*d,r()*.3,r()*3,r()*.3,.08);}
    add(SK.cyl(.1,.12,3.3,8),vary(0x5a3d1e,.06),0,1.6,0,0,0,0,.08);add(SK.cone(.14,.2,8),0x4a3018,0,3.35,0);
    const sh=new THREE.Shape();sh.moveTo(.1,-.15);sh.lineTo(1.45,-.15);sh.lineTo(1.72,0);sh.lineTo(1.45,.15);sh.lineTo(.1,.15);sh.lineTo(.1,-.15);
    angs.forEach((ang,i)=>{const g=new THREE.ExtrudeGeometry(sh,{depth:.12,bevelEnabled:false});g.rotateY(-Math.PI/2);g.translate(.06,0,0);const y=2.7-i*.42;
      add(g,vary(0x7a5a36,.1),0,y,0,0,ang,0,.07);add(SK.cyl(.025,.025,.2,5),0x2a2622,Math.sin(ang)*.2,y,Math.cos(ang)*.2,0,ang,Math.PI/2,.02);});
    return mergeParts(P);}
  function nameBoardGeo(seed){const r=pRng(seed>>>0),P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});
    for(const sx of [-1.25,1.25]){add(SK.cyl(.08,.1,2.45,8),new THREE.Color(0x4a3018).multiplyScalar(.92+r()*.16).getHex(),sx,1.12,0,0,0,0,.08);add(SK.cone(.11,.14,8),0x3a2412,sx,2.42,0);add(SK.rbox(.36,.2,.34,.05,1),0x7a746a,sx,.06,0,0,r()*2,0,.08);}
    add(SK.rbox(2.7,.62,.08,.02,1),0x5a3d20,0,2.0,0,0,0,0,.06);
    for(const y of [2.345,1.655])add(new THREE.BoxGeometry(2.84,.07,.11),0x3a2412,0,y,0,0,0,0,.04);for(const x of [1.385,-1.385])add(new THREE.BoxGeometry(.07,.76,.11),0x3a2412,x,2.0,0,0,0,0,.04);
    return mergeParts(P);}
  function buildSignpost(x,z,arms){ // arms: [{label, tx, tz}]
    const y=worldH(x,z);const angs=arms.map(a=>Math.atan2(a.tx-x,a.tz-z)); // yaw toward target (+z forward)
    const post=new THREE.Mesh(signpostGeo(angs,Math.round(x)*7+Math.round(z)),VC_MAT);post.position.set(x,y,z);post.castShadow=true;post.receiveShadow=true;post.userData.signpost=true;sc.add(post);
    arms.forEach((a,i)=>{
      const g=new THREE.Group();g.position.set(x,y+2.7-i*.42,z);g.rotation.y=angs[i];
      const t1=textPlane(a.label,1.3,.26);t1.position.set(.068,0,.85);t1.rotation.y=Math.PI/2;g.add(t1);
      const t2=textPlane(a.label,1.3,.26);t2.position.set(-.068,0,.85);t2.rotation.y=-Math.PI/2;g.add(t2);
      sc.add(g);
    });
    STATIC_SOL.push({cx:x,cz:z,rx:.25,rz:.25});
  }
  function buildSiteMarkers(){}
  function buildSiteMarkersFor(c){
    const stone=new THREE.MeshLambertMaterial({color:0x7a746a});
    c.sites.forEach(t=>{
      if(t.pad<=0)return;
      // a wooden name board on two posts beside each road in, facing the road
      const outs=ROAD_DEFS.filter(d=>d.a===t.id||d.b===t.id).map(d=>SITE[d.a===t.id?d.b:d.a]).filter(Boolean);
      if(!outs.length)return;
      outs.slice(0,3).forEach(o=>{const dx=o.x-t.x,dz=o.z-t.z,L=Math.hypot(dx,dz)||1;const ux=dx/L,uz=dz/L;const bx=t.x+ux*(t.pad+3)-uz*3.4,bz=t.z+uz*(t.pad+3)+ux*3.4;const y=worldH(bx,bz);const ang=Math.atan2(ux,uz);
        const board=new THREE.Mesh(nameBoardGeo(Math.round(bx)*7+Math.round(bz)),VC_MAT);board.position.set(bx,y,bz);board.rotation.y=ang;board.castShadow=true;board.receiveShadow=true;board.userData.nameBoard=true;sc.add(board); // S253 — framed, on round posts (it was three boxes)
        [1,-1].forEach(sd=>{const nb=textPlane(t.name,2.5,.5,'#f4e6c0','#3a2a16');nb.position.set(bx+ux*sd*.05,y+2.0,bz+uz*sd*.05);nb.rotation.y=ang+(sd<0?Math.PI:0);sc.add(nb);});
        STATIC_SOL.push({cx:bx,cz:bz,rx:1.4,rz:.3});});
      const o=outs[0];const dx=o.x-t.x,dz=o.z-t.z,L=Math.hypot(dx,dz);
      const sx=t.x+dx/L*(t.pad+4)+(-dz/L)*4,sz=t.z+dz/L*(t.pad+4)+(dx/L)*4;
      buildSignpost(sx,sz,outs.map(s=>({label:s.name,tx:s.x,tz:s.z})));
    });
  }
  // Roadside camps (Session 9): every ~260u along a road, 16u off to one side —
  // two tents, a fire, a bedroll you can rest on (and take a banked level).
  const beds=[];
  function buildCamps(){}
  function buildCampsFor(c,k){
    let n=0;const LD=LOADED.get(k);if(!LD)return 0;
    LD.roads.forEach((rd,ri)=>{
      if(rd.def.via==='spur')return;
      let acc=120+hash01(ri,3,201)*120;
      for(let i=1;i<rd.pts.length;i++){
        const a=rd.pts[i-1],b=rd.pts[i];acc+=Math.hypot(b.x-a.x,b.z-a.z);
        if(acc<260)continue;acc=0;
        const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1,side=hash01(ri,i,202)<.5?-1:1;
        const cx=b.x+(-dz/L)*side*16,cz=b.z+(dx/L)*side*16;
        if(worldH(cx,cz)<1.5||slopeNormalY(cx,cz)<.75)continue;
        if(SITES.some(t=>t.pad>0&&Math.hypot(cx-t.x,cz-t.z)<t.pad+60))continue;
        if(stampAt(cx,cz))continue;
        const cs=addStamp({id:'camp_'+k+'_'+ri+'_'+i,kind:'door',x:cx,z:cz,r:7,blend:9,cell:k});LD.stamps.push(cs);
        const y=worldH(cx,cz);
        [[-2.6,-1.2,.4],[2.4,-1.6,2.6]].forEach(([ox,oz,ry],ti)=>{const t=new THREE.Mesh(campTentGeo(ri+i+ti),VC_MAT);t.position.set(cx+ox,worldH(cx+ox,cz+oz),cz+oz);t.rotation.y=ry;t.castShadow=true;t.receiveShadow=true;t.userData.roadCamp=true;sc.add(t); // S254 — the bandit camp's ridge tent (it was an open cone on a pole)
          STATIC_SOL.push({cx:cx+ox,cz:cz+oz,rx:1.4,rz:1.4});});
        {const q=x=>new THREE.Color(x),P=[];for(let s=0;s<9;s++){const a=s/9*Math.PI*2;P.push({geo:cragGeo(.24,s+ri+3),color:q(0x5a5650).multiplyScalar(.85+(s%3)*.12),x:Math.cos(a)*.85,z:1.2+Math.sin(a)*.85,y:.1,ry:-a,jitter:.06});} // S254 — the bandit camp's fire ring and logs (seven dodecahedra), a blanket with its head rolled and a pack (two boxes)
          for(let s=0;s<3;s++){const a=s/3*Math.PI*2+.4;P.push({geo:SK.cyl(.07,.09,.9,6),color:q(0x3a2818),x:Math.cos(a)*.22,z:1.2+Math.sin(a)*.22,y:.18,rx:Math.PI/2-.35,ry:-a+Math.PI/2,jitter:.08});}
          const bx0=-.2,bz0=3.6,cr=Math.cos(.3),sr=Math.sin(.3),at=(u,w)=>[bx0+u*cr+w*sr,bz0-u*sr+w*cr];
          {const [x,z]=at(0,.1);P.push({geo:SK.rbox(.72,.06,1.4,.025,1),color:q(0x6a5a3a),x,z,y:worldH(cx+x,cz+z)-y+.04,ry:.3,jitter:.1});}
          {const [x,z]=at(0,-.72);P.push({geo:SK.cyl(.11,.11,.74,8),color:q(0x7a6a48),x,z,y:worldH(cx+x,cz+z)-y+.11,ry:.3,rz:Math.PI/2,jitter:.08});}
          {const [x,z]=at(-.62,-.5);P.push({geo:SK.rbox(.34,.4,.26,.06,1),color:q(0x5a3a1e),x,z,y:worldH(cx+x,cz+z)-y+.2,ry:.3+.4,jitter:.06});}
          const m=new THREE.Mesh(mergeParts(P),VC_MAT);m.position.set(cx,y,cz);m.castShadow=true;m.receiveShadow=true;m.userData.roadCamp=true;sc.add(m);}
        const ember=new THREE.Mesh(new THREE.SphereGeometry(.24,6,6),new THREE.MeshBasicMaterial({color:0xff7a22}));ember.position.set(cx,y+.2,cz+1.2);sc.add(ember);
        const fl=regLight(0xff8a30,1.1,9,'cell:'+k);fl.position.set(cx,y+.9,cz+1.2);STATIC_SOL.push({cx,cz:cz+1.2,rx:.8,rz:.8});
        const bx=cx-.2,bz=cz+3.6;
        beds.push({x:bx,z:bz,cell:k});n++;
      }
    });
    return n;
  }
  function homeLoaded(){
    const A=SITE.ashenmoor;if(!A)return;ASH_X=A.x;ASH_Z=A.z;
    const rd=ROADS.find(r=>r.def.a==='ashenmoor'&&r.def.b==='hearthwick');
    if(rd){let i=rd.pts.findIndex(q=>Math.hypot(q.x-ASH_X,q.z-ASH_Z)>62);if(i<1)i=1;const q=rd.pts[i],n=rd.pts[Math.min(rd.pts.length-1,i+2)];spawn.x=q.x;spawn.z=q.z;spawn.yaw=Math.atan2(-(n.x-q.x),-(n.z-q.z));}
    else{spawn.x=ASH_X;spawn.z=ASH_Z-62;}
  }
  function buildTrader(){
    // A canvas tent, a fire, and Fen the trader — the stopgap merchant until
    // the settlement generator lands in Session 3. Interact opens the
    // general-goods shop directly (see talkNPC hook).
    const x=ASH_X+18,z=ASH_Z-12,y=worldH(x,z);
    const canvas=new THREE.MeshLambertMaterial({color:0xb8a880,side:THREE.DoubleSide});
    const tent=new THREE.Mesh(new THREE.ConeGeometry(3.2,3.4,4,1,true),canvas);tent.rotation.y=Math.PI/4;tent.position.set(x,y+1.7,z);tent.castShadow=true;sc.add(tent);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,3.6,5),new THREE.MeshLambertMaterial({color:0x4a3018}));pole.position.set(x,y+1.8,z);sc.add(pole);
    STATIC_SOL.push({cx:x,cz:z,rx:2.4,rz:2.4});
    // fire
    const fx=x+4.5,fz=z+1.5,fy=worldH(fx,fz);
    const stone=new THREE.MeshLambertMaterial({color:0x5a5450});
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.28,0),stone);m.position.set(fx+Math.cos(a)*.75,fy+.18,fz+Math.sin(a)*.75);sc.add(m);}
    const ember=new THREE.Mesh(new THREE.SphereGeometry(.28,6,6),new THREE.MeshBasicMaterial({color:0xff7a22}));ember.position.set(fx,fy+.22,fz);sc.add(ember);
    const fl=regLight(0xff8a30,1.4,12,'trader');fl.position.set(fx,fy+1,fz);
    STATIC_SOL.push({cx:fx,cz:fz,rx:.9,rz:.9});
    // Fen
    const def={name:'Fen',role:'trader',x:x+2.6,z:z+3.4,bCol:0x6a4a2a,sCol:0xd4a878,
      shop:{id:'trader_fen',name:"Fen's Wagon",keeper:'Fen',type:'misc',tagline:'"Anything you\'re carrying, I\'ll price. Anything I\'m carrying, you\'ll want."'}};
    const g=buildNPCMesh(def);g.position.set(def.x,worldH(def.x,def.z),def.z);g.rotation.y=Math.PI*.8;sc.add(g);
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),new THREE.MeshBasicMaterial({color:0xffdd00}));dot.position.set(def.x,worldH(def.x,def.z)+1.5,def.z);dot.visible=false;sc.add(dot);
    npcs.push({g,dot,def,wa:0,wt:0,ph:0,_static:true});
    STATIC_SOL.push({cx:def.x,cz:def.z,rx:.35,rz:.35});
  }
  const npcs=[];let _curSettle=null;
  // ═══ NPC SCHEDULES (Session 10) ══════════════════════════════════════
  // One person, one life: the street mesh and the interior mesh are the
  // same character at different hours. Keepers are behind their counter
  // 8–18, out to the inn in the evening, home at night; residents wander
  // the plaza by day, drink in the evening, sleep at night; villagers roam
  // by day; guards patrol gate ↔ plaza around the clock.
  const HRS={shopOpen:8,shopClose:18,eve:18,night:21,dawn:7};
  function hourNow(){return (typeof gameHour==='function')?gameHour():12;}
  function npcInsideNow(house){
    const h=hourNow(),t=house.type;
    if(house.siteId==='ashenmoor'&&storyRuin('ashenmoor')&&ASH_SURVIVORS.includes(house.keeper))return true; // S269 — Edna can't walk; Oswin won't leave
    if(t==='inn')return h>=6||h<2;
    if(t==='church')return h>=6&&h<21;
    if(t==='castle')return h>=8&&h<20;
    if(t==='guild_f'||t==='guild_m')return true;
    if(t==='cabin'||t==='cellar'||t==='tower'||t==='chapel')return false;
    if(t==='home'){if(house.shuttered)return false;if(house.ownedByPlayer||ownedHouse(house.id))return false;return h>=HRS.night||h<HRS.dawn;}
    return h>=HRS.shopOpen&&h<HRS.shopClose; // shops
  }
  function shopClosedNow(house){const t=house.type;if(t==='home'||t==='inn'||t==='church'||t==='castle'||t==='guild_f'||t==='guild_m'||t==='cabin'||t==='cellar'||t==='tower'||t==='chapel')return false;return !npcInsideNow(house);}
  function scheduleFor(n,h){
    try{if(typeof QUEST_DEFS!=='undefined'&&n.def&&QUEST_DEFS.some(q=>q.giver===n.def.name&&(qState(q.id)==='available'||qState(q.id)==='active'||qState(q.id)==='reward')||qState(q.id)==='active'&&(q.objectives||[]).some(o=>o.type==='talk_to'&&o.npc===n.def.name)))return {go:(n.sched&&n.sched.door)||{x:n.def.x,z:n.def.z},idle:true};}catch(e){} // v80 — a quest giver is always findable (S236: and whoever an active quest sends you to)
    const sc_=n.sched;if(!sc_)return {idle:true};
    const eve=h>=HRS.eve&&h<HRS.night,night=h>=HRS.night||h<HRS.dawn,day=!eve&&!night;
    switch(sc_.type){
      case 'keeper':
        if(h>=HRS.shopOpen&&h<HRS.shopClose)return {hide:true};
        // S273 — the sea tutorial sends you to buy a ship: until you have one, the shipwright waits at his door out of hours (S236's rule)
        if(sc_.shop==='shipwright'&&!worldState.ship&&TUT().sea&&TUT().sea.step==='ship')return {go:sc_.door,idle:true};
        if(eve)return sc_.inn?{go:sc_.inn,thenHide:true}:{go:sc_.door,idle:true};
        if(night)return {hide:true};
        return {go:sc_.door,idle:true}; // dawn: at the door before opening
      case 'innkeeper': return {hide:true};
      case 'harbour': return night?{hide:true}:{go:sc_.door,idle:true}; // v80 S235 — at his post on the quay from 7 to 21
      case 'resident':
        if(night)return {hide:true};
        if(eve)return sc_.inn?{go:sc_.inn,thenHide:true}:{go:sc_.door,idle:true};
        return {wander:sc_.plaza,r:sc_.padR||14};
      case 'villager':
        if(night||eve&&h>=20)return {hide:true};
        return {wander:sc_.plaza,r:sc_.padR||14};
      case 'guard': {const B=(h>=19||h<6.5)&&beatOf(n._settle);return B?{beat:B}:{patrol:[sc_.a,sc_.b]};} // v80 S166 — the lantern beat after dark
      case 'constable': return (h>=19||h<6.5)?{hide:true}:{patrol:[sc_.a,sc_.b]}; // S268 — the day constable, the watchman's other half
      case 'watch': {if(!(h>=19||h<6.5))return {hide:true};const B=beatOf(n._settle);return B?{beat:B}:{patrol:[sc_.a,sc_.b]};}
      case 'lost': return {idle:true};
      default: return {idle:true};
    }
  }
  // The watch goes by the streets: a breadth-first search over a one-unit grid of the pad (built once per town), the
  // path pulled straight wherever the line is clear. Returns the turning points from a to b, not b itself; [] when
  // the line is clear or no way is found (he walks the direct line as before).
  function townRoute(S){if(S._route)return S._route;const cx=S.site.x,cz=S.site.z;
    const R=Math.ceil((S.site.pad||40)+8),N=2*R+1,sol=new Uint8Array(N*N);
    const fill=()=>{for(let j=0;j<N;j++)for(let i=0;i<N;i++)sol[j*N+i]=solidAt(cx-R+i,cz-R+j)?1:0;};fill();
    const cel=p=>[Math.max(0,Math.min(N-1,Math.round(p.x-cx+R))),Math.max(0,Math.min(N-1,Math.round(p.z-cz+R)))];
    const find=(s0,g0)=>{const prev=new Int32Array(N*N).fill(-1);prev[s0]=s0;const q=[s0];
      for(let h=0;h<q.length&&prev[g0]<0;h++){const c=q[h],ci=c%N,cj=(c-ci)/N;
        for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=N||nj>=N)continue;const k=nj*N+ni;
          if(prev[k]>=0||(sol[k]&&k!==g0))continue;if(di&&dj&&(sol[cj*N+ni]||sol[nj*N+ci]))continue;prev[k]=c;q.push(k);}}
      if(prev[g0]<0)return null;const ks=[];for(let c=g0;c!==s0;c=prev[c])ks.push(c);ks.push(s0);return ks.reverse();};
    // S378 — the grid is read once, but solids go on arriving after the town is built (the chunks' trees and rocks, the
    // town's own later pieces): 3,710 solid cells at Dunmore's build, 3,928 six minutes on. A way through a cell gone solid
    // since held a guard against it for good, and asking again gave him the same way. Each way is checked against the
    // world as it is now: a cell gone solid is marked and the way found again; no way at all reads the whole grid afresh, once.
    // S513 — his own cell is the nearest by rounding, unless he stands clear and its centre is inside a solid (at its edge, in a corner:
    // CI held a guard so at 38.57 units for good); then the corner of the lattice round him nearest that he can walk to straight.
    const startCel=p=>{const c0=cel(p);if(!solidAt(cx-R+c0[0],cz-R+c0[1])||solidAt(p.x,p.z))return c0;const fi=Math.floor(p.x-cx+R),fj=Math.floor(p.z-cz+R);let best=null,bd=1e9;
      for(const [i,j] of [[fi,fj],[fi+1,fj],[fi,fj+1],[fi+1,fj+1]]){if(i<0||j<0||i>=N||j>=N)continue;const x=cx-R+i,z=cz-R+j;let ok=true;
        for(let t=1;t<=6&&ok;t++)if(solidAt(p.x+(x-p.x)*t/6,p.z+(z-p.z)*t/6))ok=false;
        const d=Math.hypot(x-p.x,z-p.z);if(ok&&d<bd){bd=d;best=[i,j];}}
      return best||cel(p);};
    S._route=(a,b,raw)=>{const [ai,aj]=startCel(a),[bi,bj]=cel(b),s0=aj*N+ai,g0=bj*N+bi;let ks=null,fresh=false;
      for(let tries=0;tries<12;tries++){ks=find(s0,g0);
        if(!ks){if(fresh)break;fill();fresh=true;continue;}
        let stale=false;for(let i=1;i<ks.length-1;i++){const k=ks[i];if(solidAt(cx-R+k%N,cz-R+Math.floor(k/N))){sol[k]=1;stale=true;}}
        if(!stale)break;ks=null;}
      if(!ks)return [];const cells=ks.map(c=>({x:cx-R+c%N,z:cz-R+Math.floor(c/N)})); // S247 — his own cell first: from a corner the line to the first turn can cut the wall
      if(raw)return cells; // S247 — every cell of the way, for a man the pulled-straight path has already failed
      const out=[];let from=a;for(let i=0;i<cells.length-1;i++){if(!clearLine(from.x,from.z,cells[i+1].x,cells[i+1].z)){out.push(cells[i]);from=cells[i];}}return out;};
    return S._route;}
  // v80 S166 — the night watch's beat: a loop through the street in front of every shop door, in order round the
  // town's centre, so a lantern passes each locked shop in turn. Built once per settlement; null where there are no shops.
  function beatOf(S){if(!S||!S.site)return null;if(S._beat!==undefined)return S._beat;
    const cx=S.site.x,cz=S.site.z;const P=(S.houses||[]).filter(x=>/weapon|armor|potion|misc/.test(x.type)&&x.keeper&&x.exitX!=null).map(x=>({x:x.exitX,z:x.exitZ,house:x.id}));
    P.sort((a,b)=>Math.atan2(a.z-cz,a.x-cx)-Math.atan2(b.z-cz,b.x-cx));if(P.length===1)P.push({x:cx+4,z:cz+4});
    const route=townRoute(S);
    const B=[];for(let i=0;i<P.length;i++){B.push(P[i]);if(P.length>1)B.push(...route(P[i],P[(i+1)%P.length]));}
    S._beat=B.length?B:null;return S._beat;}
  // With the town's favour at −2 or worse (canon §12), the nearest guard on duty trails you while you are on its pad
  // and out of doors; one per town, kept until he goes off duty or you leave.
  function pickFollowers(h,now){const out=!((typeof isInterior==='function')&&isInterior());
    for(const S of SETTLE.values()){if(!S.site)continue;const G=guardsOf(S);let f=null;
      if(out&&favor(S.site)<=-2&&Math.hypot(px-S.site.x,pz-S.site.z)<(S.site.pad||40)){
        const ok=n=>n.g.visible&&!n._drawn&&!(n._scared&&now<n._scared)&&!scheduleFor(n,h).hide;
        if(S._follower&&G.includes(S._follower)&&ok(S._follower))f=S._follower;
        else{let bd=1e9;for(const n of G){if(!ok(n))continue;const T=targetOf(n),d=Math.hypot(T.x-n.g.position.x,T.z-n.g.position.z);if(d<bd){bd=d;f=n;}}}}
      S._follower=f;for(const n of G)n._follow=(n===f);}}
  // Guards carry a torch after dark: stick + flame + a small point light.
  function ensureTorch(n){
    if(n._torch)return n._torch;
    const t=new THREE.Group();
    const stick=new THREE.Mesh(new THREE.CylinderGeometry(.03,.035,.5,5),new THREE.MeshLambertMaterial({color:0x4a3018}));stick.position.y=.25;t.add(stick);
    const head=new THREE.Mesh(new THREE.CylinderGeometry(.05,.04,.1,6),new THREE.MeshLambertMaterial({color:0x2a2018}));head.position.y=.53;t.add(head);
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.06,.16,6),new THREE.MeshBasicMaterial({color:0xffa030}));flame.position.y=.66;t.add(flame);
    const l=regLight(0xff9a40,1.1,7,'npc');l.follow=t;t.userData.light=l;
    t.scale.set(.55,.55,.55);const rig=n.g.userData.rig;
    if(rig&&rig.B.wrL){t.position.set(0,-.05,.05);t.rotation.x=-.45;rig.B.wrL.add(t);} // S153 — in the left hand
    else{t.position.set(-.26,.42,.14);t.rotation.z=.3;n.g.add(t);}
    n._torch=t;return t;
  }
  // A few words when two of them meet: bubbles over both heads for a moment.
  const PLEASANTRIES=["Morning.","Fine day for it.","Mind the road after dark.","Any news from the coast?","Heard the wolves again last night.","Keep well.","The smith's prices, eh?","Rain's coming, I can feel it.","Good to see you.","Aye.","Watch yourself out there.","Bread's dear this week."];
  const _bubbleTex={};
  function bubbleFor(text){
    if(_bubbleTex[text])return _bubbleTex[text];
    const cv=document.createElement('canvas');cv.width=256;cv.height=64;const ctx=cv.getContext('2d');
    ctx.fillStyle='rgba(240,228,200,.92)';ctx.strokeStyle='#4a3a26';ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect?ctx.roundRect(4,4,248,44,10):ctx.rect(4,4,248,44);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(118,48);ctx.lineTo(128,60);ctx.lineTo(138,48);ctx.fill();
    ctx.fillStyle='#2a1c10';ctx.font='20px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,27,236);
    const tex=new THREE.CanvasTexture(cv);_bubbleTex[text]=tex;return tex;
  }
  function sayBubble(n,text){
    if(n._bubble){n.g.remove(n._bubble);}
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:bubbleFor(text),transparent:true,depthTest:false}));sp.scale.set(1.6,.4,1);sp.position.set(0,1.95,0);n.g.add(sp);n._bubble=sp;n._bubbleT=3.2;
  }
  let _chatT=0;
  function tickChatter(dt){
    for(const n of npcs){if(n._bubble){n._bubbleT-=dt;if(n._bubbleT<=0){n.g.remove(n._bubble);n._bubble=null;}}}
    _chatT-=dt;if(_chatT>0)return;_chatT=1.2;
    const near=npcs.filter(n=>n.g.visible&&!n._bubble&&Math.hypot(px-n.g.position.x,pz-n.g.position.z)<45);
    for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++){
      const a=near[i],b=near[j];if(a._bubble||b._bubble)continue;
      const d=Math.hypot(a.g.position.x-b.g.position.x,a.g.position.z-b.g.position.z);
      if(d<2.4&&Math.random()<.35){
        a.g.rotation.y=Math.atan2(b.g.position.x-a.g.position.x,b.g.position.z-a.g.position.z);b.g.rotation.y=a.g.rotation.y+Math.PI;
        sayBubble(a,pick(Math.random,PLEASANTRIES));setTimeout(()=>{if(b.g.visible)sayBubble(b,pick(Math.random,PLEASANTRIES));},900);
        a.wt=Math.max(a.wt||0,4);b.wt=Math.max(b.wt||0,4);a._tgt=null;b._tgt=null;
      }
    }
  }
  function npcStep(n,tx,tz,spd,dt,near){
    const gx=n.g.position.x,gz=n.g.position.z,dx=tx-gx,dz=tz-gz,d=Math.hypot(dx,dz);
    if(d<(near||.8))return true;
    if(near&&d<spd*dt){n.g.position.x=tx;n.g.position.z=tz;return true;}
    const mx=dx/d*spd*dt,mz=dz/d*spd*dt;
    const try_=(x,z)=>!solidAt(x,z);
    if(try_(gx+mx,gz+mz)){n.g.position.x+=mx;n.g.position.z+=mz;}
    else if(try_(gx+mx,gz))n.g.position.x+=mx;
    else if(try_(gx,gz+mz))n.g.position.z+=mz;
    else{n._stuck=(n._stuck||0)+1;if(n._stuck>40){n._stuck=0;return true;}return false;}
    n._stuck=0;n.g.rotation.y=Math.atan2(dx,dz);
    return false;
  }
  // S357 — a guard walking you down (trailing you at favour −2, or sent after you): the pulled-straight way by the streets,
  // and when he has gained nothing on you for a second and a half (a corner the straight line misses, where npcStep gives
  // up and he stood for good), every cell of the way, as the night beat does (S247)
  function trailStep(n,spd,dt,every){const T=targetOf(n),tx=T.x,tz=T.z,gx=n.g.position.x,gz=n.g.position.z,fd=Math.hypot(tx-gx,tz-gz); /* S542 — co-op rule: whom he runs down is targetOf's */
    if(n._twBest==null||fd<n._twBest-.5){n._twBest=fd;n._twS=0;}else n._twS+=dt;
    if(n._twS>1.5){n._twS=0;n._twBest=fd;n._twRaw=townRoute(n._settle)({x:gx,z:gz},{x:tx,z:tz},true);}
    if(n._twRaw&&n._twRaw.length){const w=n._twRaw[0];npcStep(n,w.x,w.z,spd,dt,.2);if(Math.hypot(w.x-n.g.position.x,w.z-n.g.position.z)<.3)n._twRaw.shift();return;}
    n._fwT=(n._fwT||0)-dt;if(n._fwT<=0){n._fwT=every;const w=townRoute(n._settle)({x:gx,z:gz},{x:tx,z:tz});n._fw=w.length?w[0]:null;}
    const t=n._fw&&Math.hypot(n._fw.x-gx,n._fw.z-gz)>.9?n._fw:{x:tx,z:tz};npcStep(n,t.x,t.z,spd,dt);}
  // Filled in by build() from the road geometry; the fallback is the pad edge.
  const spawn={x:ASH_X,z:ASH_Z-62,yaw:0};
  function tickTownNPCs(dt,now){
    const h=hourNow();
    try{pickFollowers(h,now);}catch(e){}
    for(const n of npcs){
      const gx=n.g.position.x,gz=n.g.position.z;
      const plan=(n._settle&&n._settle.raid)?{hide:true}:scheduleFor(n,h);
      // hidden = indoors somewhere; the interior generator spawns them there
      if(plan.hide||(n._arrivedHide)){if(n.g.visible){n.g.visible=false;n.dot.visible=false;}if(n._torch&&n._torch.visible){n._torch.visible=false;n._torch.userData.light.intensity=0;}n._retreated=true;if(plan.hide)n._arrivedHide=false;continue;}
      if(n._drawn)continue; // S157 — drawn against you; the enemy stands in
      if(!n.g.visible){n.g.visible=true;n._retreated=false;n.g.position.set(n.home.x,worldH(n.home.x,n.home.z),n.home.z);}
      n._retreated=false;
      if(n._scared&&now<n._scared){const a=Math.atan2(n.g.position.x-px,n.g.position.z-pz);npcStep(n,n.g.position.x+Math.sin(a)*6,n.g.position.z+Math.cos(a)*6,1.3,dt);n.g.position.y=worldH(n.g.position.x,n.g.position.z);n.dot.position.set(n.g.position.x,n.g.position.y+1.52,n.g.position.z);continue;} // S157 — struck: runs
      const spd=n.sched&&n.sched.type==='guard'?.95:.7;
      let moving=false;
      if(n._chase){const T=targetOf(n),fd=Math.hypot(T.x-n.g.position.x,T.z-n.g.position.z); // S239 — sent after you: he runs you down by the streets
        if(fd>1.4){trailStep(n,CHASE_SPD,dt,.6);moving=true;}
        else{n._twBest=null;n._twRaw=null;n.g.rotation.y=Math.atan2(T.x-n.g.position.x,T.z-n.g.position.z);}}
      else if(n._follow){const T=targetOf(n),fd=Math.hypot(T.x-n.g.position.x,T.z-n.g.position.z); // S166 — trailing you at six to eight units
        if(fd>8){trailStep(n,Math.min(3.4,spd+(fd-8)*.6),dt,1);moving=true;}
        else{n._twBest=null;n._twRaw=null;n.g.rotation.y=Math.atan2(T.x-n.g.position.x,T.z-n.g.position.z);}}
      else if(plan.beat){const B=plan.beat;
        if(n._beatI==null||n._beatI>=B.length){const G=guardsOf(n._settle).filter(g=>g.sched.type!=='constable');const k=Math.max(0,G.indexOf(n));n._beatI=Math.floor(k*B.length/Math.max(1,G.length))%B.length;}
        if(n._beatWait>0){n._beatWait-=dt;}
        else{const t=B[n._beatI]; // S247 — a beat point he can't walk straight to (he joins the beat anywhere, or a house is in the way) is reached by the streets
          const td=Math.hypot(t.x-n.g.position.x,t.z-n.g.position.z);if(n._bwT!==t||td<n._bwBest-.5){n._bwT=t;n._bwBest=td;n._bwS=0;}else n._bwS+=dt;
          if(n._bwS>2.5&&!(n._bwp&&n._bwp.length)){n._bwS=0;n._bwp=townRoute(n._settle)({x:n.g.position.x,z:n.g.position.z},t);}
          const w=n._bwp&&n._bwp.length?n._bwp[0]:null;const next=()=>{n._beatI=(n._beatI+1)%B.length;n._beatWait=2+Math.random()*2;n._bwp=null;n._bwTry=null;};
          if(w){if(npcStep(n,w.x,w.z,spd,dt,.2)){if(Math.hypot(w.x-n.g.position.x,w.z-n.g.position.z)<.3)n._bwp.shift();else next();}moving=true;}
          else{let arrived=npcStep(n,t.x,t.z,spd,dt); // blocked for good (npcStep gives up) is not arriving: once more cell by cell, then on to the next point
            if(arrived&&Math.hypot(t.x-n.g.position.x,t.z-n.g.position.z)>=.8&&n._bwTry!==t){n._bwTry=t;n._bwp=townRoute(n._settle)({x:n.g.position.x,z:n.g.position.z},t,true);arrived=!n._bwp.length;}
            if(arrived)next();moving=!arrived;}}}
      else if(plan.go){const arrived=npcStep(n,plan.go.x,plan.go.z,spd,dt);if(arrived&&plan.thenHide)n._arrivedHide=true;moving=!arrived;}
      else if(plan.wander){
        n.wt-=dt;
        if(!n._tgt||n.wt<=0){const a=Math.random()*Math.PI*2,r=Math.random()*plan.r;n._tgt={x:plan.wander.x+Math.cos(a)*r,z:plan.wander.z+Math.sin(a)*r};n.wt=10+Math.random()*12;}
        const arrived=npcStep(n,n._tgt.x,n._tgt.z,spd*.75,dt);if(arrived){n._tgt=null;n.wt=3+Math.random()*6;}moving=!arrived;
      }
      else if(plan.patrol){n._leg=n._leg||0;const t=plan.patrol[n._leg];const arrived=npcStep(n,t.x,t.z,spd,dt);if(arrived){n._leg=1-n._leg;}moving=!arrived;}
      if(n.sched&&(n.sched.type==='guard'||n.sched.type==='watch')){const dark=isNight()||h<6.5||h>=19;const t=ensureTorch(n);t.visible=dark;t.userData.light.intensity=dark?1.1:0;}
      const cy=worldH(n.g.position.x,n.g.position.z);
      n.g.position.y=cy; // S153 — the rig carries its own breath and stride
      n.dot.position.set(n.g.position.x,cy+1.52,n.g.position.z);
      const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);
      if(d<5&&!moving){const target=Math.atan2(px-n.g.position.x,pz-n.g.position.z);let diff=target-n.g.rotation.y;diff=Math.atan2(Math.sin(diff),Math.cos(diff));n.g.rotation.y+=diff*Math.min(1,dt*4);}
    }
  }


  // ═══ HERBS ═══════════════════════════════════════════════════════════
  // Harvestables scattered per chunk from HERB_DEF, keyed by the old zone
  // each herb was authored for: forest herbs in forest regions, ironhaven
  // herbs in the foothills/royale, overworld herbs elsewhere. Glow lights
  // are not added to the scene (a ring of 80 chunks would be ~120 point
  // lights); the mesh keeps its emissive read.
  const HERB_ZONE={coastal:'overworld',ashen:'overworld',bealach:'overworld',deepwood:'forest',foothills:'ironhaven',royale:'ironhaven',wastes:'overworld',greywood:'forest'};
  let _herbPool=null;
  function herbPool(){if(_herbPool)return _herbPool;_herbPool={};if(typeof HERB_DEF==='undefined')return _herbPool;for(const k in HERB_DEF){const z=HERB_DEF[k].zone||'overworld';(_herbPool[z]=_herbPool[z]||[]).push(k);}return _herbPool;}
  // Placement contexts: each herb prefers some ground. 'tree' = within 4u of a
  // trunk, 'water' = the shore band, 'sand' = beach, 'house' = beside a
  // building, 'rock' = steep ground, 'open' = anywhere else.
  const HERB_PLACE={
    firemoss:{ctx:['rock','open'],biomes:['wastes','wasteland','plains','moor']},silverleaf:{ctx:['tree','open'],biomes:['plains','autumn','forest']},heartroot:{ctx:['tree'],biomes:['forest','autumn','fen']},ashwort:{ctx:['rock','open'],biomes:['wastes','wasteland','dunes']},
    muirfhear:{ctx:['water','sand'],biomes:['coast','dunes','fen']},goldenrod:{ctx:['open','house'],biomes:['plains','autumn','moor','coast']},thornberry:{ctx:['tree','house'],biomes:['plains','forest','autumn']},coldmoss:{ctx:['rock','tree'],biomes:['tundra','moor','forest']},
    fearnog:{ctx:['tree'],biomes:['forest','autumn']},shadowcap:{ctx:['tree'],biomes:['forest','swamp','fen']},caorthann:{ctx:['tree','open'],biomes:['forest','autumn','plains']},deepmoss:{ctx:['tree','rock'],biomes:['forest','swamp']},briarweed:{ctx:['open','house'],biomes:['forest','plains','moor']},luibhuisce:{ctx:['water'],biomes:['forest','fen','swamp','coast']},
    ferrousweed:{ctx:['rock'],biomes:['moor','wastes','wasteland','tundra']},graywort:{ctx:['rock','open'],biomes:['moor','wastes','tundra']},caordubh:{ctx:['tree','rock'],biomes:['wastes','wasteland','swamp']},mistfern:{ctx:['water','tree'],biomes:['fen','swamp','forest']},stonecress:{ctx:['rock'],biomes:['moor','tundra','plains']},veilwort:{ctx:['house','open'],biomes:['plains','coast','autumn']},credearg:{ctx:['rock','open'],biomes:['wasteland','wastes','dunes']},duilleogghorm:{ctx:['water','sand'],biomes:['coast','dunes','fen']},
  };
  // S533 — a tree within 4 units, by the scatter's own roll in this chunk (scatterChunk's lattice and tree test), without
  // the stamps and roads it also skips: those arrive as cells load, so ch.treePts held trees on one machine that another
  // never planted, and a herb's kind went with them (herbids red on CI: 11 of 28 herbs another kind)
  function herbTreeNear(ch,x,z){const STEP=6,ox=ch.cx*CHUNK,oz=ch.cz*CHUNK,n=CHUNK/STEP;
    const i0=Math.max(0,Math.floor((x-ox-4)/STEP)-1),i1=Math.min(Math.ceil(n)-1,Math.floor((x-ox+4)/STEP)+1),j0=Math.max(0,Math.floor((z-oz-4)/STEP)-1),j1=Math.min(Math.ceil(n)-1,Math.floor((z-oz+4)/STEP)+1);
    for(let iz=j0;iz<=j1;iz++)for(let ix=i0;ix<=i1;ix++){
      const gx=ch.cx*n+ix,gz=ch.cz*n+iz,tx=ox+(ix+.15+hash01(gx,gz,1)*.7)*STEP,tz=oz+(iz+.15+hash01(gx,gz,2)*.7)*STEP;
      if(Math.abs(tx-x)>=4||Math.abs(tz-z)>=4)continue;if(tx<2||tz<2||tx>SIZE*GRID-2||tz>SIZE*GRID-2||worldH(tx,tz)<1.6)continue;
      const h=meshH(tx,tz)-.04,ny=slopeNormalY(tx,tz),p=regionScalar(tx,tz,'density')*(.5+fbm(tx,tz,60,SEED+21,2)*1.3)*sstep(.55,.8,ny)*(1-sstep(30,44,h));
      if(hash01(gx,gz,3)<p)return true;}
    return false;}
  function placeCtx(x,z,h,ch){
    if(h<-1.2)return 'sea';
    const ny=slopeNormalY(x,z);if(ny<.84)return 'rock';
    if(h<2.6){const sea=seaAt(x,z);if(sea>.02||h<1.6)return h<2.0?'sand':'water';}
    // near water: a river or lake within a short walk (bed below 0 within 6u)
    for(const [dx,dz] of [[6,0],[-6,0],[0,6],[0,-6]])if(worldH(x+dx,z+dz)<0)return 'water';
    if(herbTreeNear(ch,x,z))return 'tree';
    // S533 — near the houses is the place's own ground, read from the sites and not from the towns built so far: a herb's
    // kind must not hang on whether its town had loaded (co-op rules; herbids was red on CI when it had not)
    {const [ci,cj]=cellOf(x,z);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const c=getCell(ci+di,cj+dj);if(!c||!c.sites)continue;
      for(const t of c.sites){if(!(t.pad>0)||Math.abs(t.x-x)>t.pad+11||Math.abs(t.z-z)>t.pad+11)continue;if(Math.hypot(t.x-x,t.z-z)<t.pad+11)return 'house';}}}
    return 'open';
  }
  function herbCandidates(biome,ctx){const out=[];for(const k in HERB_PLACE){const p=HERB_PLACE[k];if(!HERB_DEF[k])continue;if(!p.biomes.includes(biome))continue;const w=p.ctx.indexOf(ctx);if(w<0)continue;out.push([k,w===0?3:1]);}return out;}
  const HERB_GEO={};
  function herbGeoFor(type,def){
    if(HERB_GEO[type])return HERB_GEO[type];
    {const pg=plantGeo(type,false);if(pg)return (HERB_GEO[type]=pg);} // v80 S167 — the plant's own bake
    const {g,gl}=mkHerbMesh(0,0,def,sc);if(gl&&gl.parent)gl.parent.remove(gl);sc.remove(g);g.updateMatrixWorld(true);
    const list=[];g.traverse(o=>{if(!o.isMesh)return;const mat=o.material;if(!mat||mat.isMeshBasicMaterial||mat.map)return;const geo=o.geometry;if(!geo||!geo.attributes.position)return;const src=geo.index?geo.toNonIndexed():geo;list.push([src,o.matrixWorld.clone(),(mat.vertexColors?new THREE.Color(1,1,1):mat.color)||new THREE.Color(1,1,1)]);});
    HERB_GEO[type]=list.length?mergeGeos(list):null;return HERB_GEO[type];
  }
  const _hm=new THREE.Matrix4(),_hq=new THREE.Quaternion(),_hp=new THREE.Vector3(),_hs=new THREE.Vector3();
  function herbInstances(ch){
    // build one InstancedMesh per type from the chunk's herb records
    const byType={};ch.herbs.forEach(h=>{if(!h.bed){(byType[h.type]||(byType[h.type]=[])).push(h);}});
    for(const type in byType){const list=byType[type];const geo=herbGeoFor(type,HERB_DEF[type]);if(!geo)continue;
      herbIM(type,geo,list,ch.group,h=>propH(h.x,h.z));}
  }
  // one InstancedMesh per kind, and for a plant that stays when picked (a bush, a sapling) a second of its picked
  // copy: each herb shows in one of the two, the other holding it at a thousandth of its size (syncHerbInstance)
  function herbIM(type,geo,list,group,yOf){const kind=PLANT_KIND[type];const pg=plantGeo(type,true);
    const mk=(g,picked)=>{const im=new THREE.InstancedMesh(g,HERB_MAT,list.length);im.castShadow=false;im.receiveShadow=true;im.userData.noBake=true;
      list.forEach((h,i)=>{if(picked)h.instP=im;else{h.inst=im;h.idx=i;}const show=picked?h.harvested:!h.harvested;_hp.set(h.x,yOf(h),h.z);_hq.setFromAxisAngle(_hy,h.ph);_hs.setScalar(show?1:.001);_hm.compose(_hp,_hq,_hs);im.setMatrixAt(i,_hm);});
      im.instanceMatrix.needsUpdate=true;group.add(im);return im;};
    const a=mk(geo,false),b=pg?mk(pg,true):null;let cx=0,cz=0;list.forEach(h=>{cx+=h.x;cz+=h.z;});cx/=list.length;cz/=list.length;
    const rec={ims:b?[a,b]:[a],x:cx,z:cz,shadow:!!kind&&PLANT_SHADOW.has(kind),list,picked:list.some(h=>h.harvested)};list.forEach(h=>{h._imr=rec;});HERB_IMS.push(rec);} // S263 — the picked copy is drawn only while one is picked (every kind has one now)
  // A plant a third of a unit tall is under a pixel past about seventy units, and a chunk's herbs are one mesh per kind,
  // so each chunk's herb meshes are drawn only within HERB_LOD.far of the player, and the tall kinds cast shadows only
  // within HERB_LOD.shadow (S167: all 81 loaded chunks' herbs were 1.8M triangles, and their shadows another .9M)
  const HERB_IMS=[],HERB_LOD={far:100,shadow:45};
  function tickHerbLod(){for(let i=HERB_IMS.length-1;i>=0;i--){const r=HERB_IMS[i],im=r.ims[0];if(!im.parent||!im.parent.parent){HERB_IMS.splice(i,1);continue;}
      const d=Math.hypot(px-r.x,pz-r.z),vis=d<HERB_LOD.far,cast=r.shadow&&d<HERB_LOD.shadow;for(let k=0;k<r.ims.length;k++){const m=r.ims[k];m.visible=vis&&(k===0||r.picked);m.castShadow=cast;}}}
  function syncHerbInstance(h){if(!h.inst)return;const hidden=h.harvested||!h.g.visible;_hp.set(h.x,propH(h.x,h.z),h.z);_hq.setFromAxisAngle(_hy,h.ph);_hs.set(hidden?.001:1,hidden?.001:1,hidden?.001:1);_hm.compose(_hp,_hq,_hs);h.inst.setMatrixAt(h.idx,_hm);h.inst.instanceMatrix.needsUpdate=true;
    if(h.instP){_hs.setScalar(h.harvested?1:.001);_hm.compose(_hp,_hq,_hs);h.instP.setMatrixAt(h.idx,_hm);h.instP.instanceMatrix.needsUpdate=true;}
    if(h._imr){h._imr.picked=h._imr.list.some(q=>q.harvested);if(h._imr.picked&&h.instP)h.instP.visible=h.inst.visible;}} // the picked bush stands where the whole one did
  const _hy=new THREE.Vector3(0,1,0);
  let _herbSyncT=0;
  function tickHerbSync(dt){_herbSyncT-=dt;if(_herbSyncT>0)return;_herbSyncT=.5;tickHerbLod();for(const h of ZONES.world.herbs){if(!h.inst)continue;const hidden=h.harvested||!h.g.visible;const y=propH(h.x,h.z);if(hidden!==h._shownHidden||Math.abs((h._y==null?-1e9:h._y)-y)>.05){h._shownHidden=hidden;h._y=y;syncHerbInstance(h);}}} // v80 S132 — re-seat when the ground under a herb changes (a pad stamped after it was placed)
  function spawnChunkHerbs(ch){
    if(typeof mkHerbMesh!=='function'||typeof HERB_DEF==='undefined')return;
    const cxw=ch.cx*CHUNK+CHUNK/2,czw=ch.cz*CHUNK+CHUNK/2;
    if(worldH(cxw,czw)<-2)return;
    const dom=dominantRegion(cxw,czw).r;const biome=dom.biome;
    const dens={forest:1.3,autumn:1.3,fen:1.2,swamp:1.2,plains:1.0,coast:.9,moor:.8,tundra:.6,dunes:.5,wastes:.7,wasteland:.6}[biome]||1;
    // a hotspot: one herb, many of it, clustered
    const hot=hash01(ch.cx,ch.cz,124)<.14;
    let n=Math.floor((8+hash01(ch.cx,ch.cz,120)*8)*dens); // v80 — denser: 8–16 a chunk before the biome factor
    // S514 — each herb is <chunk>:herb|verge|hot:<i>, the placing try that put it (co-op rules), so a spot refused on one machine moves no other's id
    const put=(hx,hz,type,k)=>{const def=HERB_DEF[type];if(!def)return false;const g=new THREE.Group();g.position.set(hx,worldH(hx,hz),hz);const gl={intensity:0,parent:null};const h={id:ch.cx+','+ch.cz+':'+k,x:hx,z:hz,type,def,g,gl,harvested:false,respawnT:0,ph:Math.random()*Math.PI*2};ZONES.world.herbs.push(h);ch.herbs.push(h);return true;};
    const okSpot=(hx,hz)=>{if(solidAt(hx,hz))return false;const ri=roadInfo(hx,hz);if(ri&&ri.d<ROAD_HALF+1.2)return false;const st=stampAt(hx,hz);if(st&&st.kind==='site'&&Math.hypot(hx-st.x,hz-st.z)<st.r-6)return false;return true;};
    let placed=0;
    for(let i=0;i<n*3&&placed<n;i++){
      const hx=ch.cx*CHUNK+3+hash01(ch.cx+i,ch.cz,121)*(CHUNK-6),hz=ch.cz*CHUNK+3+hash01(ch.cz,ch.cx+i,122)*(CHUNK-6);
      const h=worldH(hx,hz);if(h<1.0||!okSpot(hx,hz))continue;
      const ctx=placeCtx(hx,hz,h,ch);if(ctx==='sea')continue;
      const cands=herbCandidates(biome,ctx);if(!cands.length)continue;
      let tw=0;cands.forEach(c=>tw+=c[1]);let pk=hash01(ch.cx,ch.cz,123+i)*tw,type=cands[0][0];for(const c of cands){pk-=c[1];if(pk<=0){type=c[0];break;}}
      if(put(hx,hz,type,'herb:'+i))placed++;
    }
    // v80 — the verge: herbs grow along the sides of roads, just off the surface
    {let vp=0;for(let i=0;i<40&&vp<6;i++){const hx=ch.cx*CHUNK+1+hash01(ch.cx+i,ch.cz+7,131)*(CHUNK-2),hz=ch.cz*CHUNK+1+hash01(ch.cz+i,ch.cx+3,132)*(CHUNK-2);const ri=roadInfo(hx,hz);if(!ri||ri.d<ROAD_HALF+1.0||ri.d>ROAD_HALF+3.2)continue;const h=worldH(hx,hz);if(h<1.0||solidAt(hx,hz))continue;const st=stampAt(hx,hz);if(st&&st.kind==='site'&&Math.hypot(hx-st.x,hz-st.z)<st.r)continue;const cands=herbCandidates(biome,'open');if(!cands.length)continue;const type=cands[Math.floor(hash01(ch.cx+i,ch.cz,133)*cands.length)][0];if(put(hx,hz,type,'verge:'+i))vp++;}
    }
    if(hot){
      const hx0=ch.cx*CHUNK+10+hash01(ch.cx,ch.cz,125)*(CHUNK-20),hz0=ch.cz*CHUNK+10+hash01(ch.cz,ch.cx,126)*(CHUNK-20);const h0=worldH(hx0,hz0);if(h0<1)return;
      const ctx=placeCtx(hx0,hz0,h0,ch);const cands=herbCandidates(biome,ctx==='sea'?'open':ctx);if(!cands.length)return;
      const type=cands[Math.floor(hash01(ch.cx,ch.cz,127)*cands.length)][0];const m=8+Math.floor(hash01(ch.cx,ch.cz,128)*9);
      for(let i=0;i<m;i++){const a=hash01(ch.cx+i,ch.cz,129)*Math.PI*2,rr=1.5+hash01(ch.cz+i,ch.cx,130)*7;const hx=hx0+Math.cos(a)*rr,hz=hz0+Math.sin(a)*rr;if(worldH(hx,hz)<1||!okSpot(hx,hz))continue;put(hx,hz,type,'hot:'+i);}
    }
    herbInstances(ch);
  }


  // ═══ ENCOUNTERS ══════════════════════════════════════════════════════
  // Per-region spawn tables. Each chunk rolls once against the region's
  // `enc` density when it builds; a hit picks one group and spawns 2–4 of
  // it at random open points in the chunk. Night groups only roll at
  // night. Enemies are tagged with their chunk and removed when it drops;
  // a chunk whose spawns all died is "cleared" for RESPAWN_H in-game hours.
  const ENC={
    coastal:  [{name:'Wolf',w:3,n:[2,3]},{name:'Bandit',w:2,n:[1,2],road:true}],
    ashen:    [{name:'Wolf',w:4,n:[2,4]},{name:'Spider',w:2,n:[2,3]},{name:'Bandit',w:2,n:[1,2],road:true},{name:'Goblin',w:3,n:[2,4]}],
    bealach:  [{name:'Bandit',w:4,n:[2,3],road:true},{name:'Wolf',w:3,n:[2,3]},{name:'Goblin',w:2,n:[2,3]},{name:'Skeleton',w:2,n:[2,3],night:true}],
    deepwood: [{name:'Wolf',w:3,n:[3,4]},{name:'Spider',w:3,n:[2,4]},{name:'Forest Troll',w:2,n:[1,2]}],
    foothills:[{name:'Wolf',w:3,n:[2,3]},{name:'Cave Bear',w:2,n:[1,1]},{name:'Bandit',w:2,n:[2,3],road:true},{name:'Ogre',w:1,n:[1,1]}],
    royale:   [{name:'Bandit',w:3,n:[1,2],road:true},{name:'Wolf',w:2,n:[2,2]}],
    wastes:   [{name:'Ash Hound',w:4,n:[2,4]},{name:'Hollowed',w:3,n:[2,3]},{name:'Hollowed',w:4,n:[3,5],night:true}],
    greywood: [{name:'Wolf',w:3,n:[2,4]},{name:'Spider',w:3,n:[3,4]},{name:'Forest Troll',w:2,n:[1,2]},{name:'Ogre',w:1,n:[1,1]},{name:'Skeleton',w:2,n:[2,4],night:true}],
  };
  const ENC_BIOME={
    plains:  [{name:'Wolf',w:3,n:[2,3]},{name:'Boar',w:3,n:[1,2],day:true},{name:'Bandit',w:3,n:[2,3],road:true},{name:'Bandit Archer',w:2,n:[1,2],road:true},{name:'Goblin Slinger',w:1,n:[1,2]},{name:'Highwayman',w:2,n:[1,2],road:true},{name:'Kobold',w:2,n:[2,4]},{name:'Skeleton',w:2,n:[2,3],night:true},{name:'Ghoul',w:2,n:[1,2],night:true}],
    forest:  [{name:'Wolf',w:4,n:[2,4]},{name:'Spider',w:3,n:[2,4]},{name:'Boar',w:2,n:[1,2],day:true},{name:'Forest Troll',w:2,n:[1,2]},{name:'Dire Wolf',w:2,n:[1,2],night:true},{name:'Bandit',w:2,n:[2,3],road:true}],
    coast:   [{name:'Wolf',w:2,n:[2,2]},{name:'Bandit',w:3,n:[1,3],road:true},{name:'Bandit Archer',w:2,n:[1,2],road:true},{name:'Deserter',w:2,n:[1,2],road:true},{name:'Ghoul',w:2,n:[1,3],night:true}],
    wastes:  [{name:'Ash Hound',w:4,n:[2,4]},{name:'Hollowed',w:3,n:[2,3]},{name:'Hollowed',w:4,n:[3,5],night:true},{name:'Cultist',w:2,n:[2,3],night:true}],
    tundra:  [{name:'Dragon',w:.35,n:[1,1]},{name:'Snow Wolf',w:4,n:[2,4]},{name:'Frost Troll',w:2,n:[1,1]},{name:'Deserter',w:2,n:[1,2],road:true},{name:'Wraith',w:2,n:[1,2],night:true}],
    fen:     [{name:'Bog Crawler',w:4,n:[2,4]},{name:'Ghoul',w:2,n:[1,3],night:true},{name:'Marsh Hag',w:2,n:[1,1],night:true},{name:'Bandit',w:2,n:[1,2],road:true}],
    moor:    [{name:'Kobold',w:3,n:[2,4]},{name:'Wolf',w:3,n:[2,3]},{name:'Highwayman',w:3,n:[1,3],road:true},{name:'Wraith',w:2,n:[1,1],night:true},{name:'Skeleton',w:2,n:[2,3],night:true}],
    autumn:  [{name:'Boar',w:3,n:[1,3],day:true},{name:'Wolf',w:3,n:[2,3]},{name:'Dire Wolf',w:2,n:[1,2],night:true},{name:'Bandit',w:3,n:[2,3],road:true},{name:'Cultist',w:1,n:[2,2],night:true}],
    dunes:   [{name:'Sand Scorpion',w:4,n:[1,3]},{name:'Bandit',w:3,n:[2,3],road:true},{name:'Highwayman',w:2,n:[1,2],road:true},{name:'Ghoul',w:2,n:[2,3],night:true}],
    swamp:   [{name:'Bog Crawler',w:4,n:[2,4]},{name:'Marsh Hag',w:2,n:[1,2]},{name:'Ghoul',w:3,n:[2,3],night:true},{name:'Cultist',w:2,n:[2,3],night:true}],
    wasteland:[{name:'Dragon',w:.35,n:[1,1]},{name:'Ash Hound',w:3,n:[2,3]},{name:'Ash Wight',w:2,n:[1,1]},{name:'Hollowed',w:3,n:[2,4]},{name:'Cultist',w:2,n:[2,3]},{name:'Wraith',w:2,n:[1,2],night:true}],
  };
  const NIGHT_EXTRA={cold:[{name:'Wraith',w:1,n:[1,1]},{name:'Snow Wolf',w:1,n:[2,3]}],temperate:[{name:'Skeleton',w:1,n:[2,3]},{name:'Ghoul',w:1,n:[1,2]}],warm:[{name:'Ghoul',w:1,n:[2,3]},{name:'Cultist',w:1,n:[2,2]}]};
  const RESPAWN_H=48;
  const cleared=new Proxy({},{get:(_,k)=>(worldState.wcleared||{})[k],set:(_,k,v)=>{(worldState.wcleared||(worldState.wcleared={}))[k]=v;return true;},ownKeys:()=>Object.keys(worldState.wcleared||{}),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})}); // chunkKey -> hours-at-clear, lives in worldState so it saves
  function nowHours(){return ((worldState&&(worldState.gameTimeAbsMinutes!=null?worldState.gameTimeAbsMinutes:worldState.gameTimeMinutes))||0)/60;}
  function isNight(){return (typeof _nightFactor==='function')&&_nightFactor()>.5;}
  function spawnChunkEncounters(ch){
    const key=chunkKey(ch.cx,ch.cz);
    if(cleared[key]!=null&&nowHours()-cleared[key]<RESPAWN_H)return;
    const cxw=ch.cx*CHUNK+CHUNK/2,czw=ch.cz*CHUNK+CHUNK/2;
    const dom=dominantRegion(cxw,czw);
    if(worldH(cxw,czw)<-3){ // open water: sharks, occasionally
      if(hash01(ch.cx,ch.cz,170)>.06)return;const ex=cxw+(hash01(ch.cx,ch.cz,171)-.5)*20,ez=czw+(hash01(ch.cz,ch.cx,172)-.5)*20;
      const e=keyFoe(buildZoneEnemy(sc,STATIC_SOL,ex,ez,'Shark',null),key+':'+Math.floor(nowHours()/RESPAWN_H)+':shark');e._chunk=key;e.homeX=ex;e.homeZ=ez;ZONES.world.enemies.push(e);ch.enemies.push(e);return;}
    if(worldH(cxw,czw)<1.5)return;
    // Deterministic per chunk per "spawn epoch" so re-entering doesn't reroll every time.
    const epoch=Math.floor(nowHours()/RESPAWN_H);
    const roll=hash01(ch.cx*7+epoch,ch.cz*13-epoch,91);
    let dens=dom.r.enc*3.4*(isNight()?1.7:1); // dense; more at night
    // No spawns inside site pads.
    for(const t of SITES){if(t.pad>0&&Math.hypot(cxw-t.x,czw-t.z)<t.pad+70)return;}
    const [ci,cj]=cellOf(cxw,czw);
    const nearRoad=(()=>{const ri=roadInfo(cxw,czw);return ri&&ri.d<40;})();
    const patrolled=nationKeyOf(ci,cj)==='gatelands'&&roadInfo(cxw,czw)&&roadInfo(cxw,czw).d<40; // the Crown patrols its roads
    const ambush=nearRoad&&hash01(ch.cx*3+epoch,ch.cz*5+epoch,96)<(patrolled?.12:nationKeyOf(ci,cj)==='mark'?.34:.26); // bandits work the roads; more in the Mark
    if(roll>dens&&!ambush)return;
    const night=isNight();const cl=climateOfCell(ci,cj);
    let table=(ENC[dom.r.id]||ENC_BIOME[dom.r.biome]||ENC_BIOME.plains).filter(g=>(!g.night||night)&&(!g.day||!night));
    if(night)table=table.concat(NIGHT_EXTRA[cl]||NIGHT_EXTRA.temperate);
    // marauders everywhere: a human band is always on the table
    table=table.concat([{name:'Bandit',w:2,n:[2,4]},{name:'Highwayman',w:1,n:[1,3]},{name:'Deserter',w:1,n:[2,3]}]);
    if(ambush)table=[{name:'Bandit',w:3,n:[2,4],road:true},{name:'Highwayman',w:2,n:[2,3],road:true},{name:'Deserter',w:1,n:[2,3],road:true},{name:'Bandit Archer',w:2,n:[1,2],road:true}];
    let tw=0;table.forEach(g=>tw+=g.w);
    let pick=hash01(ch.cx,ch.cz,92+epoch)*tw,grp=table[0];
    for(const g of table){pick-=g.w;if(pick<=0){grp=g;break;}}
    let count=grp.n[0]+Math.floor(hash01(ch.cx,ch.cz,93+epoch)*(grp.n[1]-grp.n[0]+1));
    if(level>=6&&count>1&&hash01(ch.cx,ch.cz,97+epoch)<.35)count++;
    const leader=(grp.name==='Bandit'||grp.name==='Highwayman')&&level>=5&&count>=2&&hash01(ch.cx,ch.cz,98+epoch)<.5?'Bandit Captain':null;
    // Anchor: near the road for road groups, else anywhere open.
    let ax=cxw,az=czw;
    if(grp.road){
      let best=null,bd=1e9;
      for(let k=0;k<12;k++){const tx=ch.cx*CHUNK+hash01(k,ch.cx,94)*CHUNK,tz=ch.cz*CHUNK+hash01(k,ch.cz,95)*CHUNK;const ri=roadInfo(tx,tz);if(ri&&ri.d<bd){bd=ri.d;best={x:tx,z:tz};}}
      if(!best)return; // road groups don't spawn away from roads
      ax=best.x;az=best.z;
    } else {
      ax=ch.cx*CHUNK+8+hash01(ch.cx,ch.cz,96)*(CHUNK-16);az=ch.cz*CHUNK+8+hash01(ch.cz,ch.cx,97)*(CHUNK-16);
    }
    for(let i=0;i<count;i++){
      let ex=ax,ez=az,ok=false;
      for(let k=0;k<8;k++){
        ex=ax+(hash01(i,k,98)-.5)*14;ez=az+(hash01(k,i,99)-.5)*14;
        if(worldH(ex,ez)>1.5&&slopeNormalY(ex,ez)>.6&&!solidAt(ex,ez)&&!(stampAt(ex,ez)&&stampAt(ex,ez).kind==='site')){ok=true;break;}
      }
      if(!ok)continue;
      const fid=key+':'+epoch+':'+i; // S477 — a chunk's foe is its chunk, its spawn epoch and its index (co-op rules)
      const variant=(typeof pickVariant==='function')?pickVariant(grp.name,typeof level!=='undefined'?level:1,'normal',seededRng('variant',fid)):null;
      const e=keyFoe(buildZoneEnemy(sc,STATIC_SOL,ex,ez,(i===0&&leader)?leader:grp.name,variant),fid);
      e._chunk=key;
      ZONES.world.enemies.push(e);ch.enemies.push(e);
    }
  }
  function despawnChunkEncounters(ch){
    if(!ch.enemies.length)return;
    const key=chunkKey(ch.cx,ch.cz);
    let alive=0;
    for(const e of ch.enemies){
      if(e.dead){continue;}
      alive++;
      if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);
      if(e.el&&e.el.parent)e.el.parent.remove(e.el);
      const i=ZONES.world.enemies.indexOf(e);if(i>=0)ZONES.world.enemies.splice(i,1);
    }
    if(alive===0)cleared[key]=nowHours();
    ch.enemies.length=0;
  }
  // Called each tick: mark chunks whose spawns have all died as cleared so
  // a corpse field doesn't refill the moment the player steps out and back.
  function tickCleared(){
    for(const [key,ch] of chunks){
      if(!ch.enemies.length||ch._clearedChecked)continue;
      if(ch.enemies.every(e=>e.dead)){cleared[key]=nowHours();ch._clearedChecked=true;}
    }
  }

  // ═══ SETTLEMENTS (Session 3) ═════════════════════════════════════════
  // Every site with a pad generates a settlement from (seed, region, kind):
  // streets along the roads that cross the pad, lots on both sides, a plaza
  // at the centre (well, stalls), walls with gates for towns/cities/garrisons,
  // palisades for outposts, tents for camps, broken walls for ruins. Shops
  // get interiors via ZONES.world.houses; keepers stand at their doors;
  // villagers wander the plaza by day. Dialog is pooled by role and
  // region and carries the ambient lore: what the place is, where the roads
  // go, which doors nearby swallow patrols. Settlements stream in within
  // SETTLE_IN and out beyond SETTLE_OUT so the scene holds one or two at a
  // time. Hero sites (Ashenmoor, Ironhaven) pass their authored shop rosters
  // through the same generator.
  const SETTLE_IN=480,SETTLE_OUT=580;
  const SETTLE=new Map(); // siteId -> {group, sol, houses:[], npcs:[]}
  const REGISTER={coastal:'irish',ashen:'irish',bealach:'irish',deepwood:'irish',foothills:'french',royale:'french',wastes:'anglo',greywood:'anglo'};
  const NAMES={
    irish:{m:['Cormac','Fionn','Tadhg','Niall','Donnacha','Eoin','Ruairí','Cathal','Oisín','Pádraig','Lorcan','Séamus'],
           f:['Aoife','Gráinne','Niamh','Sorcha','Bríd','Órla','Maeve','Clodagh','Róisín','Eilís','Sinéad','Caoimhe']},
    french:{m:['Étienne','Guillaume','Thibault','Renaud','Mathieu','Olivier','Aymeric','Gaspard','Bertrand','Loïc','Rémi','Amaury'],
            f:['Isabeau','Margaux','Aliénor','Ysolde','Clémence','Blanche','Héloïse','Odile','Sabine','Adèle','Mireille','Colette']},
    anglo:{m:['Wulfstan','Eadric','Godwin','Leofric','Eadwulf','Osric','Cuthbert','Hereward','Beorn','Wigmund','Wilfrid','Dunstan'],
           f:['Æthelflæd','Eadgyth','Hilda','Wynflæd','Mildrith','Godgifu','Ealhswith','Leofgifu','Cynethryth','Eanflæd','Elfrida','Osgyth']},
  };
  const SHOP_NOUN={
    weapon:{irish:'Forge',french:'Forge',anglo:'Smithy'},
    armor:{irish:'Armoury',french:'Armurerie',anglo:'Armoury'},
    potion:{irish:'Apothecary',french:'Herboristerie',anglo:'Physic'},
    misc:{irish:'Goods',french:'Comptoir',anglo:'Stores'},
    shipwright:{irish:'Boatyard',french:'Chantier',anglo:'Shipwright'},
    church:{irish:'Oratory',french:'Chapelle',anglo:'Chapel'},
    barber:{irish:'Barber',french:'Barbier',anglo:'Barber'}, // S512 — the barber and dyer (Michael's B on #144)
  };
  const INN_NAMES={
    irish:['The Grey Heron','The Salt Hound','The Wandering Ram','The Broken Oar','The Rowan Cup','The Bramble Hearth'],
    french:['Auberge du Cerf','Le Coq Doré','Auberge de la Grise','La Lanterne','Le Vieux Pressoir','Auberge du Pont'],
    anglo:['The Ash and Bone','The Hollow Lamp','The Crooked Gate','The Last Ember','The Black Ram','The Wayfarer'],
  };
  const SHOP_ROLE={weapon:'Smith',armor:'Armourer',potion:'Apothecary',misc:'Merchant',inn:'Innkeeper',church:'Priest',castle:'Steward',guild_f:'Guildmaster',guild_m:'Archmage',shipwright:'Shipwright',barber:'Barber'};
  const TAGLINES={
    weapon:['"Edges kept keen, prices kept fair."','"Steel for the road ahead."','"If it bends, I did not make it."'],
    armor:['"Padding first, then plate."','"Walk out heavier, walk back at all."','"Nothing fancy. Everything tested."'],
    potion:['"Roots, tinctures, and honest advice."','"Bitter cures for bitter roads."','"Ask before you drink."'],
    misc:['"Odds, ends, and things that fell off carts."','"Rope, salt, candles, and questions."','"I buy what you carry."'],
    inn:['"A bed, a bowl, and no questions."','"Fire\'s lit. Door\'s open."','"Travellers welcome. Trouble isn\'t."'],
    barber:[''], // S512 — no tagline until the quest writer gives the barber one
    church:['"The door is always open."','"Come in out of the dark."','"Rest a moment. It costs nothing."'],
  };
  // Per-kind plan: building count, shop set, extras. S512: `late` shops come after the optional ones, so a new trade takes
  // the first home's lot and no shop that stood before moves (the barber and dyer, Michael's B on #144)
  const KIND_PLAN={
    village: {n:[10,14], shops:['weapon','potion','misc','inn'],   optional:['church'], rows:1, walls:false, stalls:0},
    town:    {n:[60,85], shops:['guild_f','guild_m','weapon','armor','potion','misc','misc','misc','inn','inn','inn','church'], optional:['weapon','potion','inn'], late:['barber'], rows:2, walls:true, stalls:4},
    city:    {n:[150,190],shops:['castle','guild_f','guild_m','church','church','weapon','weapon','weapon','armor','armor','potion','potion','potion','misc','misc','misc','misc','misc','inn','inn','inn','inn','inn'], optional:['inn','misc','armor'], late:['barber'], rows:2, walls:true, stalls:8},
    garrison:{n:[24,32], shops:['weapon','armor','potion','inn','inn','misc'],  optional:[], rows:1, walls:true, stalls:0},
    outpost: {n:[3,4],  shops:['misc','inn'],                     optional:[], rows:1, walls:'palisade', stalls:0},
    port:    {n:[30,45], shops:['shipwright','weapon','potion','misc','misc','inn','inn','church'], optional:['misc'], rows:2, walls:false, stalls:3},
    camp:    {n:[0,0],  shops:[],                                 optional:[], rows:0, walls:false, stalls:0, tents:3},
    ruin:    {n:[0,0],  shops:[],                                 optional:[], rows:0, walls:false, stalls:0, ruins:7},
    poi:     {n:[0,0],  shops:[],                                 optional:[], rows:0, walls:false, stalls:0, stones:6},
    glade:{n:[0,0],shops:[],optional:[],rows:0,walls:false,stalls:0},shrine:{n:[0,0],shops:[],optional:[],rows:0,walls:false,stalls:0},lair:{n:[0,0],shops:[],optional:[],rows:0,walls:false,stalls:0},tower:{n:[0,0],shops:[],optional:[],rows:0,walls:false,stalls:0},bcamp:{n:[0,0],shops:[],optional:[],rows:0,walls:false,stalls:0},
  };
  // Region build register: wall/roof colours and framing.
  // Biome builders: whole-building shapes for the wilder regions.
  function mushroomGeo(w,d,st,r){
    const c=x=>new THREE.Color(x);const R=Math.max(w,d)/2;const parts=[];
    parts.push({geo:new THREE.CylinderGeometry(R*.62,R*.75,2.6,10),color:c(0xd8cfa8),y:1.3,jitter:.04});
    parts.push({geo:new THREE.SphereGeometry(R*1.15,12,7,0,Math.PI*2,0,Math.PI/2),color:c([0x9a3a2a,0xb04a30,0x8a5a2a,0x7a3a5a][Math.floor(r()*4)]),y:2.6,jitter:.05});
    parts.push({geo:new THREE.CylinderGeometry(R*1.15,R*1.0,.4,12),color:c(0xe8dcc0),y:2.5,jitter:.03});
    for(let k=0;k<5;k++){const a=r()*Math.PI*2,rr=R*(.35+r()*.6);parts.push({geo:new THREE.SphereGeometry(.28+r()*.2,6,5),color:c(0xf0e8d8),x:Math.cos(a)*rr,z:Math.sin(a)*rr,y:2.6+Math.sqrt(Math.max(0,(R*1.15)**2-rr*rr))*.95,jitter:0});}
    parts.push({geo:new THREE.BoxGeometry(.9,1.7,.1),color:c(0x3a2a1a),x:0,y:.85,z:R*.72,jitter:0});
    [-1,1].forEach(sd=>parts.push({geo:new THREE.BoxGeometry(.5,.5,.1),color:c(0x2a2622),x:sd*R*.4,y:1.6,z:R*.68,jitter:0}));
    return mergeParts(parts);
  }
  function iceGeo(w,d,st,r){
    const c=x=>new THREE.Color(x);const R=Math.max(w,d)/2;const parts=[];
    parts.push({geo:new THREE.SphereGeometry(R,12,8,0,Math.PI*2,0,Math.PI/2),color:c(0xdce9f2),y:0,jitter:.03});
    for(let k=0;k<3;k++)parts.push({geo:new THREE.TorusGeometry(R*Math.cos((k+1)*.35),.06,5,16),color:c(0xb8cddc),y:R*Math.sin((k+1)*.35),rx:Math.PI/2,jitter:0});
    parts.push({geo:new THREE.BoxGeometry(1.4,1.2,1.6),color:c(0xcfe0ec),z:R*.85,y:.6,jitter:.03});
    parts.push({geo:new THREE.BoxGeometry(.9,1.0,.1),color:c(0x3a4a5a),x:0,y:.5,z:R*.85+.8,jitter:0});
    parts.push({geo:new THREE.CylinderGeometry(.18,.22,.6,6),color:c(0x6a7a86),y:R,jitter:0});
    return mergeParts(parts);
  }
  // Regional build styles. h = wall height, rise = roof pitch height,
  // thatch = thick rounded overhanging roof layer, twoStory = chance of
  // an upper floor with a jetty band, door = door colour.
  const STYLE={
    // whitewashed lime, dark stone footing, straw thatch, low and squat
    irish:{wall:0xe6e0d0,wall2:0xd4ccb8,roof:0xb8925a,roof2:0x9a7844,plinth:0x565048,frame:0x3a2a1a,framed:false,h:2.4,rise:1.5,thatch:true,twoStory:0,door:0x2f5e3a},
    // cream plaster, dark half-timbering, steep slate, tall, jettied
    french:{wall:0xdccfb0,wall2:0xc8ba98,roof:0x55596a,roof2:0x43475a,plinth:0x7a746a,frame:0x3e2c1c,framed:true,h:3.1,rise:2.3,thatch:false,twoStory:.55,door:0x5a3820},
    // grey rubble stone, dark timber, low shingle roofs, moss-dark
    anglo:{wall:0x7f7666,wall2:0x6a6256,roof:0x3a3430,roof2:0x2c2824,plinth:0x4e4840,frame:0x221a12,framed:true,h:2.5,rise:1.15,thatch:false,twoStory:.15,door:0x3a2a1a},
    // pale ashlar, terracotta tile, tall city blocks with cornice bands
    stone:{wall:0xb9b3a4,wall2:0xa59f90,roof:0x9a5a3a,roof2:0x7e482e,plinth:0x8a857a,frame:0x6a655c,framed:false,h:3.3,rise:1.5,thatch:false,twoStory:.7,door:0x3e2a16},
    // the Mark: dark timber longhouses, dark shingle, steep; nothing decorative
    mark:{wall:0x4a3826,wall2:0x3a2c1e,roof:0x26221e,roof2:0x1c1815,plinth:0x55524c,frame:0x2a1a10,framed:false,h:2.6,rise:2.3,thatch:false,twoStory:.15,door:0x1a1612},
    // Aurenne: cream plaster, terracotta tile, low pitch, painted doors
    aurenne:{wall:0xf0e4cc,wall2:0xe2d4b6,roof:0xb86a3a,roof2:0xa05a30,plinth:0x8a7a6a,frame:0x8a6a4a,framed:false,h:3.1,rise:.9,thatch:false,twoStory:.6,door:0x3a5a8a},
    // Bavarian: cream render, dark timber, very steep roofs, painted shutters
    bavarian:{wall:0xf0e6d0,wall2:0xdccfb4,roof:0x5a3a2a,roof2:0x4a2e20,plinth:0x6a665e,frame:0x3a2412,framed:true,h:3.0,rise:2.9,thatch:false,twoStory:.75,door:0x7a2a1a},
    // garrison: same ashlar, slate roofs, squat
    garrison:{wall:0x8f8b82,wall2:0x7c7870,roof:0x4a4c56,roof2:0x3a3c46,plinth:0x5a5650,frame:0x4a4a4a,framed:false,h:2.9,rise:1.2,thatch:false,twoStory:.25,door:0x2e2418},
  };
  function rngFor(a,b){let s=(a*73856093^b*19349663^SEED)>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
  function pick(r,arr){return arr[Math.floor(r()*arr.length)%arr.length];}
  // v80 S172 — the same single draw as pick(); if that one is taken in this town, the next free one along the list (so a
  // town's draws, and every name that did not collide, stay as they were). Taken by everyone: the draw stands.
  let _townNames=null,_curNM=null,_twinUsed=null,_roleNames=null; // S248 — how many hold each name, and the names held by someone with a post
  function pickFor(r,arr,post){const v=pickFree(r,arr,_townNames);if(!post||!_townNames||!_townNames.has(v)||!_roleNames||!_roleNames.has(v))return v; // S248 — a bank used up: a man with a post takes a name no other post-holder has
    const i=arr.indexOf(v);for(let k=1;k<arr.length;k++){const c=arr[(i+k)%arr.length];if(!_roleNames.has(c))return c;}return v;}
  function noteName(name,post,fixed){if(!_townNames)return 0;_townNames.add(name);if(post&&_roleNames)_roleNames.add(name);if(!_twinUsed)return 0; // S250 — a kept number, or the lowest one nobody on the town's record holds
    let u=_twinUsed.get(name);if(!u)_twinUsed.set(name,u=new Set());let t=fixed!=null&&fixed!==''&&!isNaN(+fixed)?+fixed:null;if(t==null){t=0;while(u.has(t))t++;}u.add(t);return t;}
  function twinsFromRecord(NM){const m=new Map();for(const k in NM){const p=String(NM[k]).split('|');const nm=p[0],t=k.startsWith('tw:')?p[1]:p[6];if(t==null||t===''||isNaN(+t))continue;let u=m.get(nm);if(!u)m.set(nm,u=new Set());u.add(+t);}return m;}
  function pickFree(r,arr,used){const v=pick(r,arr);if(!used||!used.has(v))return v;const i=arr.indexOf(v);for(let k=1;k<arr.length;k++){const c=arr[(i+k)%arr.length];if(!used.has(c))return c;}return v;}
  function cardinalFace(tx,tz){ // unit vector → 'N' (−z) 'S' (+z) 'E' 'W'
    if(Math.abs(tx)>Math.abs(tz))return tx>0?'E':'W';
    return tz>0?'S':'N';
  }
  // Hero rosters: authored shops for Ashenmoor and Ironhaven.
  function heroShops(site){
    if(site.id==='ashenmoor'&&typeof HOUSES!=='undefined')return HOUSES.map(h=>({name:h.name,keeper:h.keeper,type:h.type,tagline:h.tagline,bCol:h.bCol,sCol:h.sCol}));
    if(site.id==='ironhaven'&&typeof IRONHAVEN_HOUSES!=='undefined')return IRONHAVEN_HOUSES.filter(h=>h.id!=='ih7').map(h=>({name:h.name,keeper:h.keeper,type:h.type,tagline:h.tagline,bCol:h.bCol,sCol:h.sCol}));
    if(site.id==='hearthwick'&&typeof HEARTHWICK_HOUSES!=='undefined')return HEARTHWICK_HOUSES.map(h=>({name:h.name,keeper:h.keeper,type:h.type,tagline:h.tagline,bCol:h.bCol,sCol:h.sCol}));
    return null;
  }

  // ── Building geometry (merged, vertex-coloured; one mesh per building) ──
  // ── S194: the house in detail (backlog H.5; Michael's decision A on Session 179's prototype) ──
  // buildingGeo builds today's house (buildingGeoLo, on the town's own dice, exactly as before, so every town keeps
  // its layout and its people) and a detailed one beside it, which rolls its own dice from what the plain one picked.
  // The detailed house is what you see near; the plain one is its distant copy (houseLod, per baked cluster).
  // Parts: a footing ringed with rough stones; walls; half-timbering with braces and a jetty where the style frames;
  // recessed windows with sills, lintels, mullions and shutters, kept under the eaves; a framed plank door with hinges
  // and a step; a roof with thickness, eaves on rafter ends, bargeboards, and its covering in courses (slate, shingle,
  // half-round tile), or a rounded, lumpy thatch; a coursed chimney with a cap; by the house's dice a lean-to, a
  // woodpile, a water butt. Each culture draws variants from its neighbours (Michael: Nordic into the Mark, the
  // Mediterranean into Aurenne, Irish, Celtic and Western European into the Irish).
  const HOUSE_VARIANTS={
    irish:[{},{},{thatch:false,slate:true,roof:0x4a4e58,roof2:0x3a3e48,wall:0xb8b0a0,wall2:0xa49c8c,rubble:true},{wall:0xf0e8d8,door:0xa02a2a},{thatch:false,slate:true,roof:0x3e4450,roof2:0x30343e,framed:true,frame:0x2a2018,wall:0xe8e0cc,twoStoryAdd:.3}],
    anglo:[{},{shingle:true},{rubble:true}],
    french:[{shutter:0x3a5a4a},{shutter:0x6a3a2a},{shutter:0x4a5a7a,wall:0xe8dcc0}],
    bavarian:[{shutter:0x2a5a2a},{shutter:0x7a2a1a},{shutter:0x2a3a6a,wall:0xf4ecd8}],
    mark:[{long:true,shingle:true},{long:true,turf:true},{long:true,shingle:true,wall:0x5a4430},{long:true,turf:true,wall:0x3e2e20}],
    aurenne:[{tile:true,shutter:0x3a6a9a},{tile:true,shutter:0x3a7a5a,wall:0xecc89a},{tile:true,shutter:0x8a4a3a,wall:0xf2d8c8},{tile:true,shutter:0x3a6a9a,wall:0xfaf6ee}],
    stone:[{tile:true},{tile:true,shutter:0x4a5a3a}],
    garrison:[{slate:true}]};
  let _houseN=0;
  function houseKey(st){for(const k in STYLE)if(STYLE[k]===st)return k;return null;}
  function buildingGeoHi(w,d,st0,r,opts,lo){
    const key=houseKey(st0)||opts.styleKey||'irish';const V=HOUSE_VARIANTS[key]||[{}];
    const r0=pRng((Math.round(w*7)*131+Math.round(d*7)*977+lo.wallHex+lo.roofHex*3+(_houseN++)*7919)>>>0);
    const st=Object.assign({},st0,V[Math.floor(r0()*V.length)%V.length]);if(key==='french'&&st.slate==null)st.slate=true;if(key==='bavarian'||key==='garrison')st.slate=true;
    const P=[];const c=x=>new THREE.Color(x);const add=(geo,col,x,y,z,rx,ry,rz,j)=>{P.push({geo,color:c(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});};
    const two=lo.two,H=(opts.h||st.h||2.6)+(two?2.2:0),pl=.3,fr=st.frame,dark=0x1e1a18;
    const wallC=st0.wall===st.wall?lo.wallHex:c(st.wall).lerp(c(st.wall2||st.wall),r0()*.4).getHex();
    const stoneC=st.plinth;
    add(new THREE.BoxGeometry(w+.2,pl,d+.2),stoneC,0,pl/2,0,0,0,0,.1);
    for(let i=0;i<Math.floor((w+d)*1.6);i++){const t=r0(),side=r0()<.5;const x=side?(t-.5)*w:(r0()<.5?-1:1)*(w/2+.08),z=side?(r0()<.5?-1:1)*(d/2+.08):(t-.5)*d;const s=.16+r0()*.14;
      add(SK.bumpy(SK.ball(s,6,4),.03,9,r0()*9),c(stoneC).multiplyScalar(.85+r0()*.3).getHex(),x,.12,z,0,r0()*3,0,.05);}
    add(new THREE.BoxGeometry(w,H,d),wallC,0,pl+H/2,0,0,0,0,.05);
    // rubble-stone walls (Celtic and upland variants): stones proud of the face in rough courses
    if(st.rubble)for(const fz of [1,-1])for(let y=pl+.25;y<pl+H-.2;y+=.42)for(let x=-w/2+.3+(Math.round(y*10)%2)*.25;x<w/2-.2;x+=.55+r0()*.2){if(fz>0&&Math.abs(x)<.75&&y<pl+2.1)continue;
      add(new THREE.BoxGeometry(.4+r0()*.16,.26+r0()*.08,.08),c(wallC).lerp(c(stoneC),.35).multiplyScalar(.68+r0()*.3).getHex(),x+(r0()-.5)*.08,y+(r0()-.5)*.05,fz*(d/2+.02),0,0,(r0()-.5)*.12,.06);}
    if(st.framed){for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])add(new THREE.BoxGeometry(.2,H,.2),fr,sx*w/2,pl+H/2,sz*d/2,0,0,0,.04);
      for(const fz of [1,-1]){for(const y of [pl+.08,pl+H-.08,two?pl+H-2.3:null])if(y!=null)add(new THREE.BoxGeometry(w+.04,.16,.08),fr,0,y,fz*(d/2+.03),0,0,0,.04);
        const n=Math.max(2,Math.round(w/1.1));for(let k=1;k<n;k++){const x=-w/2+k*w/n;if(Math.abs(x)<.7)continue;add(new THREE.BoxGeometry(.12,H,.07),fr,x,pl+H/2,fz*(d/2+.03),0,0,0,.04);}
        for(const sx of [-1,1]){const hh=Math.min(H,2.2)*.9,L=Math.hypot(w/n,hh);add(new THREE.BoxGeometry(.1,L,.06),fr,sx*(w/2-w/n/2),pl+Math.min(H,2.2)*.5,fz*(d/2+.035),0,0,sx*fz*Math.atan2(w/n,hh),.04);}}}
    if(two&&st.framed){add(new THREE.BoxGeometry(w+.5,.24,d+.5),fr,0,pl+H-2.25,0);for(let k=0;k<Math.round(w/.5);k++)add(new THREE.BoxGeometry(.12,.12,.3),fr,-w/2+.25+k*.5,pl+H-2.42,d/2+.15);}
    // the roof's numbers first: the windows are kept under its eaves (Michael: the Irish eaves covered the window heads)
    const rise=opts.rise||st.rise||1.6,thatch=!!(st.thatch||st.turf),over=thatch?.45:.55,run=d/2+over,slope=Math.atan2(rise,d/2),len=Math.hypot(run,rise*run/(d/2)),th=thatch?.46:.14;
    const yb=pl+H,eaveLow=yb-over*rise/(d/2)-th/2/Math.cos(slope);
    const win=(x,y,z,fz,wd,ht)=>{add(new THREE.BoxGeometry(wd,ht,.08),0x2a3038,x,y,z-fz*.06,0,0,0,0);add(new THREE.BoxGeometry(wd+.24,.1,.24),stoneC,x,y-ht/2-.05,z+fz*.04);add(new THREE.BoxGeometry(wd+.2,.12,.14),st.framed?fr:stoneC,x,y+ht/2+.06,z+fz*.02);
      add(new THREE.BoxGeometry(.05,ht,.06),fr,x,y,z-fz*.02);add(new THREE.BoxGeometry(wd,.05,.06),fr,x,y+.05,z-fz*.02);for(const s of [-1,1])add(new THREE.BoxGeometry(.06,ht,.1),fr,x+s*wd/2,y,z);
      if(st.shutter)for(const s of [-1,1])add(new THREE.BoxGeometry(wd/2,ht+.04,.05),st.shutter,x+s*(wd*.75+.06),y,z+fz*.03,0,s*fz*.25,0,.06);};
    const wh=.78,wy=Math.min(pl+Math.min(H,st.h||2.6)*.58,(two?yb-2.2:eaveLow)-.22-wh/2-.06),nw=st.long?3:2;
    for(let k=0;k<nw;k++){const x=(k-(nw-1)/2)*w/nw*1.05;if(Math.abs(x)<.8)continue;win(x,wy,d/2,1,.62,wh);}
    win(0,wy,-d/2,-1,.62,wh);if(two)for(const x of [-w*.28,0,w*.28])win(x,Math.min(pl+H-1.1,eaveLow-.22-.35-.06),d/2+(st.framed?.25:0),1,.56,.7);
    add(new THREE.BoxGeometry(1.2,2.05,.12),st.framed?fr:stoneC,0,pl+1.02,d/2+.01);add(new THREE.BoxGeometry(.92,1.85,.08),st.door||0x3e2a16,0,pl+.93,d/2-.02,0,0,0,.03);
    for(let k=-2;k<=2;k++)add(new THREE.BoxGeometry(.02,1.8,.02),c(st.door||0x3e2a16).multiplyScalar(.7).getHex(),k*.18,pl+.93,d/2+.025,0,0,0,0);
    for(const y of [.5,1.4])add(new THREE.BoxGeometry(.5,.05,.03),dark,-.18,pl+y,d/2+.03,0,0,0,0);add(SK.ball(.04,6,4),0x8a7a4a,.3,pl+.95,d/2+.05);
    add(new THREE.BoxGeometry(1.4,.16,.55),stoneC,0,.08,d/2+.35,0,0,0,.08);
    const rc=st0.roof===st.roof?lo.roofHex:c(st.roof).lerp(c(st.roof2||st.roof),r0()*.4).getHex();
    const turfC=0x5a7a3a;
    for(const s of [1,-1]){const cz=s*(run/2),cy=yb+rise/2-(over/(d/2))*rise/2;
      if(thatch){// a rounded, lumpy slab (it read as a board) with a rolled lip along the eaves
        const g=SK.bumpy(SK.rbox(w+over*2,th,len,.16,2),.05,7,s*3+r0()*5);add(g,st.turf?turfC:rc,0,cy,cz,s*slope,0,0,.07);
        const ex=-Math.cos(slope)*len/2,lipY=cy-Math.sin(slope)*len/2*1,lipZ=cz+s*Math.cos(slope)*len/2;
        add(SK.bumpy(SK.cyl(.2,.2,w+over*2,8),.03,9,s),st.turf?turfC:c(rc).multiplyScalar(.9).getHex(),0,lipY,lipZ,0,0,Math.PI/2,.06);}
      else{add(new THREE.BoxGeometry(w+over*2,th,len),c(rc).multiplyScalar(.8).getHex(),0,cy,cz,s*slope,0,0,.04);
        const rows=Math.round(len/(st.tile?.4:.26));for(let k=0;k<rows;k++){const t=(k+.5)/rows-.5;const y=cy-Math.sin(slope)*t*len+th*.6*Math.cos(slope),z=cz+s*Math.cos(slope)*t*len+s*th*.6*Math.sin(slope);
          if(st.tile){for(let q=0;q<Math.round((w+over*2)/.3);q++){const g=SK.cyl(.12,.12,.42,4,1,true,-Math.PI/2,Math.PI);add(g,c(rc).multiplyScalar(.85+r0()*.3).getHex(),-(w/2+over)+.15+q*.3,y,z,s*(Math.PI/2+slope),0,0,.05);}}
          else add(new THREE.BoxGeometry(w+over*2,.05,len/rows*1.08),c(rc).multiplyScalar(.82+r0()*.3).getHex(),0,y,z,s*slope,0,0,.08);}
        for(let k=0;k<Math.round((w+over*2)/.6);k++)add(new THREE.BoxGeometry(.1,.12,over+.1),fr,-(w/2+over)+.3+k*.6,yb-.08-(over/2)*rise/(d/2),s*(d/2+over/2),s*slope,0,0,.04);}}
    if(thatch)add(SK.bumpy(new THREE.CylinderGeometry(.44,.44,w+over*2+.3,10,1),.05,8,2),st.turf?turfC:c(st.roof2||st.roof).getHex(),0,yb+rise+.02,0,0,0,Math.PI/2,.05);
    else add(SK.cyl(.12,.12,w+over*2+.1,6),st.roof2||st.roof,0,yb+rise+.08,0,0,0,Math.PI/2,.04);
    for(const gx of [1,-1]){const gt=new THREE.Shape();gt.moveTo(-d/2,0);gt.lineTo(d/2,0);gt.lineTo(0,rise-.02);gt.closePath();add(new THREE.ShapeGeometry(gt),wallC,gx*(w/2+.001),yb,0,0,gx*Math.PI/2,0,.04);
      if(!thatch)for(const s of [1,-1]){const L=Math.hypot(run,rise*run/(d/2));add(new THREE.BoxGeometry(.06,.26,L),fr,gx*(w/2+over+.02),yb+rise/2-(over/(d/2))*rise/2+.06,s*run/2,s*slope,0,0,.04);}
      if(st.long)for(const s of [1,-1])add(new THREE.BoxGeometry(.08,.9,.14),fr,gx*(w/2+over+.02),yb+rise+.3,s*.18,s*.5,0,0,.04);}
    let chTop=null;if(opts.chimney){const chx=w*.3*(r0()<.5?1:-1),chz=-d*.18;for(let k=0;k<6;k++)add(new THREE.BoxGeometry(.56,.24,.56),c(stoneC).multiplyScalar(.85+r0()*.25).getHex(),chx,yb+rise*.4+k*.25,chz,0,(r0()-.5)*.08,0,.06);
      add(new THREE.BoxGeometry(.7,.1,.7),stoneC,chx,yb+rise*.4+1.55,chz);chTop=[chx,yb+rise*.4+1.62,chz];}
    // a lean-to against a gable end (it was a box): two posts, a sloping roof with thickness on a plate, plank walls
    // at the back and one side, a woodpile under it
    if(!opts.noYard&&r0()<.55){const s=r0()<.5?1:-1,lw=1.5,ld=Math.min(d*.8,3.2),lz=-d*.08,hi_=Math.min(2.1,H-.2),lo_=1.45,x0=s*w/2,x1=s*(w/2+lw);
      for(const z of [lz-ld/2+.1,lz+ld/2-.1])add(new THREE.BoxGeometry(.14,lo_,.14),fr,x1-s*.07,pl+lo_/2,z,0,0,0,.05);
      add(new THREE.BoxGeometry(.14,.14,ld),fr,x1-s*.07,pl+lo_,lz,0,0,0,.04);
      const ang=Math.atan2(hi_-lo_,lw),rl=Math.hypot(lw,hi_-lo_)+.25;add(new THREE.BoxGeometry(rl,.08,ld+.3),c(rc).multiplyScalar(.85).getHex(),(x0+x1)/2+s*.08,pl+(hi_+lo_)/2+.1,lz,0,0,-s*ang,.06);
      for(let k=0;k<Math.floor(lw/.3);k++)add(new THREE.BoxGeometry(.28,1.35,.05),c(0x6a4a2a).multiplyScalar(.8+r0()*.3).getHex(),x0+s*(.17+k*.3),pl+.68,lz-ld/2+.06,0,0,0,.05);
      for(let k=0;k<12;k++)add(SK.cyl(.08,.08,.8,6),0x7a5a3a,(x0+x1)/2+s*.1+(k%4)*.17*s-s*.3,pl+.1+Math.floor(k/4)*.15,lz+ld*.1,Math.PI/2,0,0,.1);}
    if(!opts.noYard&&r0()<.5){const x=(r0()<.5?1:-1)*(w/2-.6);for(let k=0;k<9;k++)add(SK.cyl(.08,.08,.7,6),0x7a5a3a,x+(k%3)*.17-.17,.1+Math.floor(k/3)*.15,d/2+.4,0,0,Math.PI/2,.1);}
    if(!opts.noYard&&r0()<.5)add(SK.lathe([[.001,0],[.25,0],[.28,.3],[.26,.6],[.001,.6]],10),0x6a4a2a,-w/2+.5,0,d/2+.45);
    const g=mergeParts(P,HAO);g.userData.variant=key;g.userData.thatch=thatch;g.userData.winTop=wy+wh/2+.12;g.userData.eaveLow=eaveLow;g.userData.chimney=chTop;return g;}
  function buildingGeo(w,d,st,r,opts){opts=opts||{};const lo=buildingGeoLo(w,d,st,r,opts);if(opts.plain)return lo;
    const hi=buildingGeoHi(w,d,st,r,opts,lo.userData.picks);hi.userData.lo=lo;return hi;}
  function buildingGeoLo(w,d,st,r,opts){
    const parts=[];const c=x=>new THREE.Color(x);
    const two=opts.twoStory!=null?opts.twoStory:(r()<(st.twoStory||0));
    const H=(opts.h||st.h||2.6)+(two?2.2:0), plinthH=.22;
    const wallC=c(st.wall).lerp(c(st.wall2),r()*.6);
    // stone plinth, slightly wider
    parts.push({geo:new THREE.BoxGeometry(w+.12,plinthH+.3,d+.12),color:c(st.plinth),y:plinthH/2-.15,jitter:.10});
    // body
    parts.push({geo:new THREE.BoxGeometry(w,H,d),color:wallC,y:plinthH+H/2,jitter:.05});
    // timber framing: corner posts + a mid rail
    if(st.framed||opts.framed){
      const fc=c(st.frame);
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>parts.push({geo:new THREE.BoxGeometry(.16,H,.16),color:fc,x:sx*(w/2),z:sz*(d/2),y:plinthH+H/2,jitter:.04}));
      parts.push({geo:new THREE.BoxGeometry(w+.02,.12,d+.02),color:fc,y:plinthH+H*.55,jitter:.04});
    }
    // jetty band between storeys
    if(two){parts.push({geo:new THREE.BoxGeometry(w+.3,.22,d+.3),color:c(st.frame),y:plinthH+H-2.2,jitter:.04});
      [-w*.28,w*.28].forEach(wx=>{parts.push({geo:new THREE.BoxGeometry(.6,.7,.08),color:c(0x2a2622),x:wx,y:plinthH+H-1.1,z:d/2+.02,jitter:0});});}
    // gable roof: a triangular prism along x (ridge along x), with eaves
    const rise=opts.rise||st.rise||1.6, over=st.thatch?.7:.45;
    const tri=new THREE.Shape();tri.moveTo(-(d/2+over),0);tri.lineTo(d/2+over,0);tri.lineTo(0,rise);tri.closePath();
    const roofG=new THREE.ExtrudeGeometry(tri,{depth:w+over*2,bevelEnabled:false});
    // extrude is along +z; rotate so the ridge runs along x
    const roofC=c(st.roof).lerp(c(st.roof2),r()*.5);parts.push({geo:roofG,color:roofC,x:-(w/2+over),y:plinthH+H-.05,z:0,ry:Math.PI/2,jitter:.08});
    // ridge beam (thatch gets a thick rounded ridge cap instead)
    if(st.thatch)parts.push({geo:new THREE.CylinderGeometry(.34,.34,w+over*2+.2,7),color:c(st.roof2),y:plinthH+H+rise-.1,rz:Math.PI/2,jitter:.08});
    else parts.push({geo:new THREE.BoxGeometry(w+over*2+.1,.14,.22),color:c(st.roof2),y:plinthH+H+rise-.05,jitter:.05});
    // stone city blocks: cornice band under the eaves
    if(st===STYLE.stone)parts.push({geo:new THREE.BoxGeometry(w+.25,.18,d+.25),color:c(st.plinth),y:plinthH+H-.1,jitter:.04});
    // chimney
    if(opts.chimney){parts.push({geo:new THREE.BoxGeometry(.5,1.3,.5),color:c(st.plinth),x:w*.3,y:plinthH+H+rise*.5+.5,z:d*.2,jitter:.08});}
    // windows: two dark insets on the front face (+z), one on the back
    const winC=c(0x2a2622);
    [-w*.28,w*.28].forEach(wx=>{parts.push({geo:new THREE.BoxGeometry(.6,.7,.08),color:winC,x:wx,y:plinthH+H*.6,z:d/2+.02,jitter:0});});
    parts.push({geo:new THREE.BoxGeometry(.6,.7,.08),color:winC,x:0,y:plinthH+H*.6,z:-d/2-.02,jitter:0});
    // door on the front face (+z)
    parts.push({geo:new THREE.BoxGeometry(.9,1.7,.1),color:c(st.door||0x3e2a16),x:0,y:plinthH+.85,z:d/2+.03,jitter:.04});
    parts.push({geo:new THREE.BoxGeometry(1.1,.14,.16),color:c(st.frame),x:0,y:plinthH+1.78,z:d/2+.04,jitter:0});
    const g=mergeParts(parts);g.userData.picks={wallHex:wallC.getHex(),roofHex:roofC.getHex(),two};return g;
  }
  // ── S195: churches and keeps in detail (H.5, Michael's A: buildings and structures, with a distant copy) ──
  // The old builders stay as the distant copies; neither took the town's dice, so the detailed ones roll their own.
  let _civN=0;
  function churchGeoHi(w,d,st){const r0=pRng((Math.round(w*13)+Math.round(d*29)*7+(_civN++)*7919)>>>0);const P=[];const c=x=>new THREE.Color(x);
    const add=(geo,col,x,y,z,rx,ry,rz,j)=>{P.push({geo,color:c(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});};
    const S=STYLE.stone,wallC=c(S.wall).lerp(c(S.wall2),r0()*.4).getHex(),dk=c(wallC).multiplyScalar(.82).getHex(),roofC=S.roof,H=4.2,b=.5;
    // stepped plinth
    add(new THREE.BoxGeometry(w+.6,.28,d+.6),st.plinth,0,.14,0,0,0,0,.08);add(new THREE.BoxGeometry(w+.3,.3,d+.3),st.plinth,0,.4,0,0,0,0,.08);
    add(new THREE.BoxGeometry(w,H,d),wallC,0,b+H/2,0);
    // string course and cornice; quoins up every corner
    add(new THREE.BoxGeometry(w+.14,.12,d+.14),dk,0,b+H*.42,0);add(new THREE.BoxGeometry(w+.3,.22,d+.3),dk,0,b+H-.05,0);
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])for(let k=0;k<Math.floor(H/.45);k++){const L=k%2?.5:.32;add(new THREE.BoxGeometry(k%2?L:.34,.4,k%2?.34:L),c(wallC).multiplyScalar(1.05+r0()*.1).getHex(),sx*(w/2-(k%2?L/2-.14:0)),b+.22+k*.45,sz*(d/2-(k%2?0:L/2-.14)),0,0,0,.04);}
    // buttresses along the sides, stepped back twice, and lancet windows between them
    const nb=Math.max(2,Math.round(d/2.6));for(let k=0;k<=nb;k++){const z=-d/2+k*d/nb;if(Math.abs(z)>d/2-.2&&k>0&&k<nb)continue;
      for(const sx of [-1,1]){add(new THREE.BoxGeometry(.6,H*.62,.5),dk,sx*(w/2+.3),b+H*.31,z,0,0,0,.05);add(new THREE.BoxGeometry(.4,H*.3,.46),dk,sx*(w/2+.2),b+H*.62+H*.15,z,0,0,0,.05);add(new THREE.BoxGeometry(.62,.1,.52),S.plinth,sx*(w/2+.3),b+H*.62,z,0,0,-sx*.4);}
      if(k<nb)for(const sx of [-1,1]){const zc=z+d/nb/2;add(new THREE.BoxGeometry(.08,1.7,.48),0x2a2a36,sx*(w/2+.01),b+H*.55,zc,0,0,0,0);add(SK.cone(.3,.5,4),0x2a2a36,sx*(w/2+.01),b+H*.55+1.1,zc,0,Math.PI/4,0,0);
        add(new THREE.BoxGeometry(.14,.1,.6),S.plinth,sx*(w/2+.05),b+H*.55-.9,zc);}}
    // the roof: two slabs with thickness, courses of slate, a ridge
    const rise=2.4,over=.4,run=w/2+over,slope=Math.atan2(rise,w/2),len=Math.hypot(run,rise*run/(w/2)),yb=b+H;
    for(const s of [1,-1]){const cx=s*run/2,cy=yb+rise/2-(over/(w/2))*rise/2;add(new THREE.BoxGeometry(len,.16,d+over*2),c(roofC).multiplyScalar(.8).getHex(),cx,cy,0,0,0,-s*slope,.04);
      const rows=Math.round(len/.32);for(let k=0;k<rows;k++){const t=(k+.5)/rows-.5;add(new THREE.BoxGeometry(len/rows*1.08,.05,d+over*2),c(roofC).multiplyScalar(.82+r0()*.3).getHex(),cx+s*Math.cos(slope)*t*len-s*.1*Math.sin(slope),cy-Math.sin(slope)*t*len+.1*Math.cos(slope),0,0,0,-s*slope,.06);}}
    add(SK.cyl(.13,.13,d+over*2+.1,6),S.roof2,0,yb+rise+.08,0,Math.PI/2,0,0,.04);
    for(const gz of [1,-1]){const gt=new THREE.Shape();gt.moveTo(-w/2,0);gt.lineTo(w/2,0);gt.lineTo(0,rise-.02);gt.closePath();add(new THREE.ShapeGeometry(gt),wallC,0,yb,gz*(d/2+.001),0,gz>0?0:Math.PI,0,.04);}
    // the west front: a rose window, a gabled porch with an arch over the door, and a cross on the gable
    add(new THREE.CylinderGeometry(.6,.6,.1,14),0x2a2a36,0,yb+.7,d/2+.02,Math.PI/2,0,0,0);add(SK.torus(.62,.08,6,16),S.plinth,0,yb+.7,d/2+.05,0,0,0);
    for(let k=0;k<6;k++)add(new THREE.BoxGeometry(.04,1.1,.04),S.plinth,0,yb+.7,d/2+.06,0,0,k*Math.PI/6,0);
    const pw=2.2,pd=1.3,ph=2.8;add(new THREE.BoxGeometry(pw,ph,pd),wallC,0,b+ph/2,d/2+pd/2);
    const pg=new THREE.Shape();pg.moveTo(-pw/2-.15,0);pg.lineTo(pw/2+.15,0);pg.lineTo(0,1.1);pg.closePath();add(new THREE.ExtrudeGeometry(pg,{depth:pd+.2,bevelEnabled:false}),S.roof,0,b+ph,d/2-.1,0,0,0,.05);
    add(new THREE.BoxGeometry(1.2,1.9,.1),0x3e2a16,0,b+.95,d/2+pd+.01,0,0,0,.03);add(SK.torus(.6,.1,6,12,Math.PI),S.plinth,0,b+1.9,d/2+pd+.04,0,0,0,.04);
    add(new THREE.BoxGeometry(.12,.9,.12),0x8a7a5a,0,yb+rise+.5,d/2-.1);add(new THREE.BoxGeometry(.5,.12,.12),0x8a7a5a,0,yb+rise+.68,d/2-.1);
    // the bell tower at the east end: quoined, a belfry with an opening each way, a cornice, a slated spire and a cross
    const tz=-d/2+1.1,TH=H+3.2,tw=2.4;add(new THREE.BoxGeometry(tw,TH,tw),c(wallC).multiplyScalar(.95).getHex(),0,b+TH/2,tz);
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])add(new THREE.BoxGeometry(.3,TH,.3),dk,sx*tw/2,b+TH/2,tz+sz*tw/2,0,0,0,.05);
    for(let q=0;q<4;q++){const a=q*Math.PI/2,ox=Math.sin(a)*(tw/2+.01),oz=Math.cos(a)*(tw/2+.01);add(new THREE.BoxGeometry(.7,1.2,.1),0x16141a,ox,b+TH-1,tz+oz,0,a,0,0);add(SK.cone(.35,.4,4),0x16141a,ox,b+TH-.2,tz+oz,0,a+Math.PI/4,0,0);}
    add(new THREE.BoxGeometry(tw+.4,.25,tw+.4),dk,0,b+TH+.1,tz);add(SK.cone(1.75,4.2,8),S.roof2,0,b+TH+.2+2.1,tz,0,Math.PI/8,0,.05);
    add(new THREE.BoxGeometry(.12,1.1,.12),0x8a7a5a,0,b+TH+4.8,tz);add(new THREE.BoxGeometry(.6,.12,.12),0x8a7a5a,0,b+TH+5.0,tz);
    // a few graves in the yard
    for(let k=0;k<4;k++)if(r0()<.7){const gx=(r0()<.5?-1:1)*(w/2+1.4+r0()*.8),gz=-d/2+1+r0()*(d-2);add(SK.rbox(.5,.8,.14,.08,2),0x7a7a74,gx,.4,gz,0,Math.PI/2+(r0()-.5)*.3,(r0()-.5)*.15,.08);}
    return mergeParts(P);}
  function keepGeoHi(w,d,st){const r0=pRng((Math.round(w*17)+Math.round(d*31)*5+(_civN++)*104729)>>>0);const P=[];const c=x=>new THREE.Color(x);
    const add=(geo,col,x,y,z,rx,ry,rz,j)=>{P.push({geo,color:c(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});};
    const S=STYLE.stone,wallC=S.wall,w2=S.wall2,dk=c(w2).multiplyScalar(.85).getHex(),H=6.5,b=.35;
    // a battered base (the wall's foot splays out), the wall, courses of stone proud of it
    add(new THREE.CylinderGeometry(Math.hypot(w,d)/2*.72,Math.hypot(w,d)/2*.78,1.2,4,1),dk,0,.25,0,0,Math.PI/4,0,.06);
    add(new THREE.BoxGeometry(w+.5,1,d+.5),dk,0,.2,0,0,0,0,.08);add(new THREE.BoxGeometry(w,H,d),wallC,0,b+H/2,0);
    for(let y=b+.6;y<b+H;y+=.55)add(new THREE.BoxGeometry(w+.06,.06,d+.06),dk,0,y,0,0,0,0,.03);
    // a machicolated parapet all round: corbels, the walk's overhang, merlons on every side
    const top=b+H;for(const [lx,lz,L,ax] of [[0,d/2,w,1],[0,-d/2,w,1],[w/2,0,d,0],[-w/2,0,d,0]]){const n=Math.floor(L/.8);
      for(let k=0;k<n;k++){const t=-L/2+.4+k*L/n;const x=ax?t:lx,z=ax?lz:t;add(new THREE.BoxGeometry(.3,.5,.3),dk,x+(ax?0:Math.sign(lx)*.2),top-.2,z+(ax?Math.sign(lz)*.2:0),0,0,0,.05);}
      add(new THREE.BoxGeometry(ax?L+.6:.5,.7,ax?.5:L+.6),w2,lx+(ax?0:Math.sign(lx)*.25),top+.3,lz+(ax?Math.sign(lz)*.25:0));
      for(let k=0;k<Math.floor(L/1.2);k++){const t=-L/2+.6+k*1.2;add(new THREE.BoxGeometry(ax?.7:.5,.7,ax?.5:.7),w2,ax?t:lx+Math.sign(lx)*.25,top+1,ax?lz+Math.sign(lz)*.25:t,0,0,0,.05);}}
    // corner towers: round, a battered foot, arrow slits, a corbelled ring and a conical cap with a finial
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=sx*w/2,z=sz*d/2,TH=H+2.2;add(new THREE.CylinderGeometry(1.4,1.75,1.4,10),dk,x,.5,z,0,0,0,.05);
      add(new THREE.CylinderGeometry(1.4,1.5,TH,12),w2,x,.8+TH/2,z,0,0,0,.05);add(new THREE.CylinderGeometry(1.7,1.45,.5,12),dk,x,.8+TH+.1,z);
      for(let q=0;q<3;q++){const a=Math.atan2(sz,sx)+(q-1)*.9;add(new THREE.BoxGeometry(.12,.8,.1),0x14121a,x+Math.cos(a)*1.46,2+q*1.6,z+Math.sin(a)*1.46,0,-a+Math.PI/2,0,0);}
      add(SK.cone(1.85,2.4,12),S.roof2,x,.8+TH+.35+1.2,z,0,0,0,.05);add(SK.ball(.14,6,4),0x8a7a4a,x,.8+TH+.35+2.45,z);}
    // arrow slits in the curtain, the gate: a round arch, a portcullis, a stone surround
    for(const fz of [1,-1])for(let k=-1;k<=1;k++){if(fz>0&&k===0)continue;add(new THREE.BoxGeometry(.12,.9,.1),0x14121a,k*w/3.2,b+H*.6,fz*(d/2+.01),0,0,0,0);}
    add(new THREE.BoxGeometry(2.4,3.3,.3),dk,0,.8+1.65,d/2+.08);add(new THREE.BoxGeometry(1.6,2.6,.2),0x1a140e,0,.8+1.3,d/2+.15);add(SK.torus(.82,.14,6,14,Math.PI),w2,0,.8+2.6,d/2+.22);
    for(let k=-3;k<=3;k++)add(new THREE.BoxGeometry(.05,2.2,.05),0x3a3a3a,k*.22,.8+1.5,d/2+.28,0,0,0,0);for(let k=0;k<5;k++)add(new THREE.BoxGeometry(1.5,.05,.05),0x3a3a3a,0,.8+.6+k*.45,d/2+.28,0,0,0,0);
    // a flag pole on the roof
    add(SK.cyl(.06,.06,3.2,5),0x4a3018,w*.2,top+1.6,-d*.2);add(new THREE.BoxGeometry(1.1,.7,.03),0x8a2a2a,w*.2+.58,top+2.8,-d*.2,0,0,0,.08);
    return mergeParts(P);}
  function churchGeo(w,d,st,r){const lo=churchGeoLo(w,d,st,r);const hi=churchGeoHi(w,d,st);hi.userData.lo=lo;return hi;}
  function churchGeoLo(w,d,st,r){
    const parts=[];const c=x=>new THREE.Color(x);
    const H=4.2;
    parts.push({geo:new THREE.BoxGeometry(w+.3,.5,d+.3),color:c(st.plinth),y:.25,jitter:.1});
    parts.push({geo:new THREE.BoxGeometry(w,H,d),color:c(STYLE.stone.wall),y:.5+H/2,jitter:.06});
    const rise=2.2,over=.4;
    const tri=new THREE.Shape();tri.moveTo(-(w/2+over),0);tri.lineTo(w/2+over,0);tri.lineTo(0,rise);tri.closePath();
    parts.push({geo:new THREE.ExtrudeGeometry(tri,{depth:d+over*2,bevelEnabled:false}),color:c(STYLE.stone.roof),x:0,y:.5+H-.05,z:-(d/2+over),jitter:.08});
    // bell tower at the back
    parts.push({geo:new THREE.BoxGeometry(2.2,H+3.2,2.2),color:c(STYLE.stone.wall2),x:0,y:.5+(H+3.2)/2,z:-d/2+1.1,jitter:.06});
    parts.push({geo:new THREE.ConeGeometry(1.7,2.2,4),color:c(STYLE.stone.roof2),x:0,y:.5+H+3.2+1.1,z:-d/2+1.1,ry:Math.PI/4,jitter:.06});
    // tall arched-ish windows
    [-w*.3,w*.3].forEach(wx=>{parts.push({geo:new THREE.BoxGeometry(.6,1.8,.08),color:c(0x3a3020),x:wx,y:.5+H*.55,z:d/2+.02,jitter:0});});
    parts.push({geo:new THREE.BoxGeometry(1.2,2.2,.12),color:c(0x3e2a16),x:0,y:.5+1.1,z:d/2+.03,jitter:.04});
    return mergeParts(parts);
  }
  function keepGeo(w,d,st,r){const lo=keepGeoLo(w,d,st,r);const hi=keepGeoHi(w,d,st);hi.userData.lo=lo;return hi;}
  function keepGeoLo(w,d,st,r){
    const parts=[];const c=x=>new THREE.Color(x);
    const H=6.5;
    parts.push({geo:new THREE.BoxGeometry(w+.3,.9,d+.3),color:c(st.plinth),y:-.1,jitter:.1}); // mostly buried
    parts.push({geo:new THREE.BoxGeometry(w,H,d),color:c(STYLE.stone.wall),y:.35+H/2,jitter:.05});
    parts.push({geo:new THREE.BoxGeometry(w+.4,.5,d+.4),color:c(STYLE.stone.wall2),y:.8+H+.25,jitter:.05});
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
      parts.push({geo:new THREE.CylinderGeometry(1.4,1.6,H+2.2,8),color:c(STYLE.stone.wall2),x:sx*w/2,z:sz*d/2,y:.8+(H+2.2)/2,jitter:.05});
      parts.push({geo:new THREE.ConeGeometry(1.7,1.8,8),color:c(STYLE.stone.roof2),x:sx*w/2,z:sz*d/2,y:.8+H+2.2+.9,jitter:.05});
    });
    for(let i=0;i<Math.floor(w/1.6);i++){parts.push({geo:new THREE.BoxGeometry(.7,.7,.5),color:c(STYLE.stone.wall),x:-w/2+1+i*1.6,y:.8+H+.85,z:d/2,jitter:.05});}
    parts.push({geo:new THREE.BoxGeometry(1.6,2.6,.2),color:c(0x2e2016),x:0,y:.8+1.3,z:d/2+.05,jitter:.03});
    return mergeParts(parts);
  }
  function tentGeoLo(r){
    const parts=[];const c=x=>new THREE.Color(x);
    const tc=c(0xa89878).lerp(c(0x8a7a5a),r());parts.push({geo:new THREE.ConeGeometry(2.4,2.8,5,1,false),color:tc,y:1.4,jitter:.08});parts.tc=tc.getHex();
    parts.push({geo:new THREE.CylinderGeometry(.06,.06,3,5),color:c(0x4a3018),y:1.5});
    const g=mergeParts(parts);g.userData.picks={tc:parts.tc};return g;
  }
  function stallGeoLo(r){
    const parts=[];const c=x=>new THREE.Color(x);
    const cloth=pick(r,[0x9a3a2a,0x2a5a8a,0x8a7a2a,0x4a7a3a,0x7a3a6a]);const goods=[];
    [[-1.4,-.9],[1.4,-.9],[-1.4,.9],[1.4,.9]].forEach(([x,z])=>parts.push({geo:new THREE.BoxGeometry(.12,2.2,.12),color:c(0x5a3d1e),x,z,y:1.1}));
    parts.push({geo:new THREE.BoxGeometry(3.2,.08,2.2),color:c(cloth),y:2.25,jitter:.1});
    parts.push({geo:new THREE.BoxGeometry(3.0,.9,.9),color:c(0x6a4a2a),y:.45,z:.5,jitter:.06});
    for(let i=0;i<3;i++){const gc=pick(r,[0xc8a040,0x8a3a2a,0x5a8a3a,0xd8d0b0,0x6a4a8a]);goods.push(gc);parts.push({geo:new THREE.BoxGeometry(.5,.35,.4),color:c(gc),x:-1+i*1,y:1.05,z:.5,jitter:.1});}
    const g=mergeParts(parts);g.userData.picks={cloth,goods};return g;
  }
  function wellGeoLo(){
    const parts=[];const c=x=>new THREE.Color(x);
    parts.push({geo:new THREE.CylinderGeometry(1.1,1.2,1.0,10),color:c(0x7a746a),y:.5,jitter:.1});
    parts.push({geo:new THREE.CylinderGeometry(.75,.75,1.02,10),color:c(0x1a2028),y:.5});
    [[-1,0],[1,0]].forEach(([x])=>parts.push({geo:new THREE.BoxGeometry(.14,2.4,.14),color:c(0x5a3d1e),x:x*.9,y:1.2}));
    parts.push({geo:new THREE.BoxGeometry(2.2,.12,.14),color:c(0x5a3d1e),y:2.4});
    parts.push({geo:new THREE.BoxGeometry(2.6,.5,1.6),color:c(0x6b5a3a),y:2.7,jitter:.06});
    return mergeParts(parts);
  }
  function ruinGeoLo(r){
    const parts=[];const c=x=>new THREE.Color(x);
    const n=2+Math.floor(r()*3);
    const picks=[];for(let i=0;i<n;i++){const w=2+r()*4,h=.6+r()*2.4,col=c(0x6a6258).lerp(c(0x4a443c),r()),x=(r()-.5)*5,z=(r()-.5)*5,ry=r()*Math.PI;picks.push({w,h,col:col.getHex(),x,z,ry});parts.push({geo:new THREE.BoxGeometry(w,h,.6),color:col,x,z,y:.6,ry,jitter:.12});}
    const g=mergeParts(parts);g.userData.picks=picks;return g;
  }
  function standingStoneGeoLo(r){
    const w=.9+r()*.6,h=2.6+r()*1.8,ry=r()*.6,rz=(r()-.5)*.15;const g=mergeParts([{geo:new THREE.BoxGeometry(w,h,.6),color:new THREE.Color(0x5a5852),y:1.6,ry,rz,jitter:.12}]);g.userData.picks={w,h,ry,rz};return g;
  }
  // ── S203: the town's furniture and the POIs' structures in detail (H.5, Michael's A), each with its old self as the
  // distant copy. The old builders take the town's dice as before and report what they picked; the detailed ones
  // follow those picks (a ruin's walls stand where they stood) and roll the rest on their own dice.
  // ── S249: a town's walls and gate towers in detail (H.5, Michael's A), the old boxes as the distant copy. A wall
  // segment is built along local x (len long, the outer face at -z), its foot at 0 in the middle; gA and gB are the
  // ground at its two ends against the middle, so posts, logs and footings follow a slope where the box floated.
  function wallSegHi(WT,len,H,d,wallC,capC,gA,gB,rr,noButt){const P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+rr()*a*2).getHex(),gAt=x=>gA+(gB-gA)*(x/len+.5),foot=Math.min(0,gA,gB)-.5,slope=Math.atan2(gB-gA,len);
    const wc=wallC.getHex(),cc=capC.getHex();
    if(WT==='fence'){const n=Math.max(2,Math.round(len/2.4));for(let i=0;i<=n;i++){const x=-len/2+i*len/n,g=gAt(x);add(SK.cyl(.065,.085,1.6,6),vary(cc,.12),x,g+.5,0,(rr()-.5)*.06,0,(rr()-.5)*.06,.04);}
      for(let i=0;i<n;i++){const x0=-len/2+i*len/n,x1=x0+len/n,g0=gAt(x0),g1=gAt(x1),L=Math.hypot(x1-x0,g1-g0);for(const h of [.55,1.05])add(SK.cyl(.045,.05,L,5),vary(wc,.12),(x0+x1)/2,(g0+g1)/2+h-.03*rr(),(rr()-.5)*.04,0,0,Math.atan2(g1-g0,x1-x0)-Math.PI/2,.04);}
      return mergeParts(P);}
    if(WT==='logs'){for(let x=-len/2+.22;x<len/2;x+=.44){const g=gAt(x),top=H+(rr()-.5)*.45,b=g-.4,rad=.2+rr()*.04;add(SK.cyl(rad,rad*1.05,top-b,6,1,true),vary(wc,.14),x,(top+b)/2,0,0,rr()*3,0,.05);add(SK.cone(rad,.55,6,1,true),vary(wc,.1),x,top+.27,0,0,rr()*3,0,.05);}
      for(const h of [1.0,2.4])add(SK.cyl(.13,.13,len,6),vary(cc,.08),0,(gA+gB)/2+h,.36,0,0,slope-Math.PI/2,.04);
      return mergeParts(P);}
    const dressed=WT==='dressed',plinth=dressed?1.0:1.2;
    add(new THREE.BoxGeometry(len,plinth-foot,d+.5),new THREE.Color(wc).multiplyScalar(.82).getHex(),0,(plinth+foot)/2,0,0,0,0,.05);
    add(new THREE.BoxGeometry(len,.2,d+.3),new THREE.Color(wc).multiplyScalar(.9).getHex(),0,plinth+.02,0,.0,0,0,.04);
    add(new THREE.BoxGeometry(len-.02,H-plinth,d-.08),0x4e4940,0,(H+plinth)/2,0,0,0,0,.03);
    // courses of blocks laid broken-joint on the mortar core: rubble uneven and mottled, ashlar even and pale
    for(let y=plinth+.1;y<H-.05;){const ch=Math.min(H-y,dressed?.5:.5+rr()*.3);let x=-len/2;
      while(x<len/2-.05){const bl=Math.min(len/2-x,dressed?1.3+rr()*.5:1.0+rr()*1.4);const inset=dressed?0:(rr()-.5)*.08;add(new THREE.BoxGeometry(bl-.06,ch-.05,d+inset),vary(wc,dressed?.06:.16),x+bl/2,y+ch/2,0,0,0,0,.05);x+=bl;}y+=ch;}
    if(!dressed){const nb=noButt?0:Math.max(1,Math.round(len/7));for(let i=0;i<nb;i++){const x=-len/2+(i+.5)*len/nb,g=Math.min(0,gAt(x))-.4,bh=H*.72-g;add(SK.rbox(.9,bh,.8,.06,1),vary(wc,.08),x,g+bh/2,-d/2-.35,0,0,0,.05);add(new THREE.BoxGeometry(.9,.5,.6),vary(cc,.06),x,H*.72+.1,-d/2-.28,-.6,0,0,.04);}}
    else{add(SK.rbox(len,.2,d+.24,.06,1),cc,0,H-1.4,0,0,0,0,.03);for(let x=-len/2+.5;x<len/2-.2;x+=1.0)add(new THREE.BoxGeometry(.28,.4,.34),vary(cc,.05),x,H-.2,-d/2-.12,0,0,0,.03);}
    // the parapet on the outer edge, crenellated: merlons and embrasures along the whole run
    const pz=-d/2+(dressed?-.08:.2),pd=dressed?.5:.42;add(new THREE.BoxGeometry(len,.35,pd),vary(cc,.05),0,H+.17,pz,0,0,0,.04);
    for(let x=-len/2+.55;x<len/2-.4;x+=dressed?1.6:1.8)add(SK.rbox(dressed?.95:1.0,.8,pd,.06,1),vary(cc,.08),x,H+.35+.4,pz,0,0,0,.05);
    return mergeParts(P);}
  // a gate tower: a timber watchtower beside a palisade; a coursed round tower with slits, a crenellated top and a
  // slated cone beside stone. y 0 at its foot, as the old tower.
  function gateTowerHi(WT,H,capC,roofC,rr){const P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+rr()*a*2).getHex(),cc=capC.getHex(),rc=roofC.getHex();
    if(WT==='logs'){const T=H+1.2;for(const [x,z] of [[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]])add(SK.cyl(.14,.16,T+.6,6),vary(0x5a4222,.1),x,T/2-.3,z,0,0,0,.05);
      for(const s of [-1,1]){add(SK.cyl(.06,.06,2.0,5),0x4a3418,s*.8,T*.35,0,.72*s,0,0,.04);add(SK.cyl(.06,.06,2.0,5),0x4a3418,0,T*.35,s*.8,0,0,.72*s,.04);}
      add(new THREE.BoxGeometry(2.1,.14,2.1),0x4a3418,0,T-1.6,0);for(let k=0;k<7;k++){const o=-.9+k*.3;for(const [x,z,ry] of [[o,-.98,0],[o,.98,0],[-.98,o,Math.PI/2],[.98,o,Math.PI/2]])add(new THREE.BoxGeometry(.28,1.1,.07),vary(0x6a5030,.1),x,T-1.0,z,0,ry,0,.05);}
      add(SK.cone(1.75,1.3,4),vary(rc,.06),0,T+.65,0,0,Math.PI/4,0,.05);add(SK.cyl(.05,.05,.6,4),0x3a2a1a,0,T+1.5,0);return mergeParts(P);}
    const dressed=WT==='dressed',R0=dressed?2.1:1.8,R1=dressed?2.3:2.0,T=H+2.4;
    add(new THREE.CylinderGeometry(R1+.05,R1+.4,1.6,16),new THREE.Color(cc).multiplyScalar(.85).getHex(),0,.3,0);
    add(new THREE.CylinderGeometry(R0,R1,T,16,4),cc,0,T/2,0,0,0,0,.08);
    for(let y=1.6;y<T-.8;y+=1.3){const rr2=R1-(R1-R0)*(y/T);add(SK.torus(rr2+.01,.05,3,16),new THREE.Color(cc).multiplyScalar(.8).getHex(),0,y,0,Math.PI/2,0,0,.03);}
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2+rr()*.6,y=2.2+i*1.3,rr2=R1-(R1-R0)*(y/T)+.02;if(y>T-1.2)continue;add(new THREE.BoxGeometry(.16,.8,.12),0x14141a,Math.sin(a)*rr2,y,Math.cos(a)*rr2,0,a,0,0);}
    add(new THREE.CylinderGeometry(R0+.35,R0,.5,16),new THREE.Color(cc).multiplyScalar(.92).getHex(),0,T-.15,0);add(new THREE.CylinderGeometry(R0+.35,R0+.35,.3,16),cc,0,T+.25,0);
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2;add(SK.rbox(.9,.7,.4,.06,1),vary(cc,.06),Math.sin(a)*(R0+.18),T+.75,Math.cos(a)*(R0+.18),0,a,0,.05);}
    for(let k=0;k<5;k++){const r1=(R0+.1)*(1-k/5),r2=(R0+.1)*(1-(k+1)/5);add(new THREE.CylinderGeometry(Math.max(.04,r2),r1,.62,16,1,true),vary(rc,.08),0,T+.4+k*.6+.31,0,0,0,0,.05);}
    add(SK.cyl(.05,.05,.8,4),0x8a7a4a,0,T+3.6,0);add(SK.ball(.12,6,5),0xc8a850,0,T+4.0,0);
    return mergeParts(P);}
  // S275 — the town gate between the gate towers (Michael, 28 Sep: A, the Session 273 prototype). In the wall segment's frame:
  // x along the wall, +z into the town, y 0 at the road. Stone and dressed stone: an arch of seventeen voussoirs from jamb to
  // jamb, the spandrels filled, a wall-walk with merlons over it. Palisade and fence: a braced timber lintel on two posts. In
  // both, two plank leaves with iron bands and a brace stand open against the inside (nothing shuts a town's gate yet).
  // `inner` is the jambs' distance from the road's middle; the leaves come back in userData.leaves for their colliders.
  function townGateGeo(WT,inner,H,d,wallC,capC,rr){const P=[],L=[];const add=(geo,col,x,y,z,rx,ry,rz,j,sx)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.05:j,sx});
    const vary=(c,a)=>new THREE.Color(c).multiplyScalar(1-a+rr()*a*2).getHex(),wc=wallC.getHex(),cc=capC.getHex();
    const stone=WT==='stone'||WT==='dressed',timberH=Math.max(H,2.4);let lh,hz,LO;
    if(stone){const span=inner,rise=2.2,spring=H-1.4-rise*.3,crown=spring+rise,top=H+1.2;
      for(let k=0;k<=16;k++){const a=k/16*Math.PI;add(SK.rbox(.55,.8,d+.2,.06,1),new THREE.Color(wc).multiplyScalar(k%2?.92:1).getHex(),Math.cos(a)*span,spring+Math.sin(a)*rise,0,0,0,a-Math.PI/2,.05,k===8?1.3:1);}
      for(let y=spring+.3;y<crown+.1;y+=.5){const e=Math.min(1,(y-spring)/rise),xa=span*Math.sqrt(1-e*e)+.35,w=span+.3-xa;if(w>.1)for(const s of [-1,1])add(new THREE.BoxGeometry(w,.5,d),vary(wc,.12),s*(xa+w/2),y,0);}
      add(new THREE.BoxGeometry(span*2+.6,top-crown+.2,d),vary(cc,.04),0,(crown-.2+top)/2,0,0,0,0,.04);
      add(new THREE.BoxGeometry(span*2+.8,.2,d+.2),new THREE.Color(cc).multiplyScalar(.9).getHex(),0,top+.02,0,0,0,0,.03);
      for(let x=-span+.3;x<span;x+=1.8)add(SK.rbox(1.0,.8,.45,.06,1),vary(cc,.06),x,top+.5,-d/2+.2,0,0,0,.05);
      for(const s of [-1,1])add(new THREE.BoxGeometry(.6,spring+1,d+.2),new THREE.Color(wc).multiplyScalar(.95).getHex(),s*(span-.3),(spring-1)/2,0);
      lh=WT==='dressed'?3.6:3.4;hz=d/2+.15;
      LO=[{geo:new THREE.BoxGeometry(.6,spring+1,d+.2),color:new THREE.Color(wc),x:-(span-.3),y:(spring-1)/2},{geo:new THREE.BoxGeometry(.6,spring+1,d+.2),color:new THREE.Color(wc),x:span-.3,y:(spring-1)/2},{geo:new THREE.BoxGeometry(span*2+.6,top-spring,d),color:new THREE.Color(cc),y:(spring+top)/2}];}
    else{const span=inner,T=timberH;
      for(const s of [-1,1])add(SK.cyl(.2,.22,T+2.6,7),vary(0x5a4222,.08),s*span,(T+.6)/2,0);
      for(const yy of [T+.6,T+1.3])add(SK.cyl(.16,.16,span*2+.6,7),vary(0x4a3418,.06),0,yy,0,0,0,Math.PI/2);
      for(const s of [-1,1])add(SK.cyl(.09,.09,1.6,5),0x4a3418,s*(span-.6),T+.1,0,0,0,s*.7);
      lh=WT==='fence'?1.3:2.8;hz=d/2+.1;
      LO=[{geo:new THREE.BoxGeometry(.4,T+2.6,.4),color:new THREE.Color(0x5a4222),x:-span,y:(T+.6)/2},{geo:new THREE.BoxGeometry(.4,T+2.6,.4),color:new THREE.Color(0x5a4222),x:span,y:(T+.6)/2},{geo:new THREE.BoxGeometry(span*2+.6,.3,.3),color:new THREE.Color(0x4a3418),y:T+1.3}];}
    // the leaves: hinged by the jambs, planks running in from the hinge, swung open 83 degrees into the town
    const w=inner-.2,ang=1.45;
    for(const s of [-1,1]){const phi=s*ang,cs=Math.cos(phi),sn=Math.sin(phi),hx=s*(inner-.1);
      const at=(lx,lz)=>[hx+lx*cs+lz*sn,hz-lx*sn+lz*cs];
      for(let k=0;k<6;k++){const [x,z]=at(-s*(k+.5)*w/6,0);add(SK.rbox(w/6-.02,lh,.12,.02,1),new THREE.Color(0x5a3d22).multiplyScalar(k%2?1.08:.96).getHex(),x,lh/2,z,0,phi,0,.06);}
      for(const yy of (lh>2?[.5,lh-.6]:[.3,lh-.3])){const [x,z]=at(-s*w/2,.08);add(new THREE.BoxGeometry(w,.12,.04),0x2a2624,x,yy,z,0,phi,0,.03);}
      {const [x,z]=at(-s*w/2,.08),bl=lh>2?lh-1.2:lh-.6;add(new THREE.BoxGeometry(.12,Math.hypot(w,bl),.1),0x4a3018,x,lh/2,z,0,phi,s*Math.atan2(w,bl),.04);}
      const [mx,mz]=at(-s*w/2,0);L.push({x:mx,z:mz,rx:w/2,rz:.12,ry:phi});}
    const g=mergeParts(P);g.userData.lo=mergeParts(LO);g.userData.leaves=L;return g;}
  let _furnN=0;const furnRng=()=>pRng(((_furnN++)*2654435761)>>>0);
  const FPART=(P,geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.06:j});
  function wellGeoHi(){const r0=furnRng(),P=[];const stone=0x7a746a;
    for(let ring=0;ring<3;ring++)for(let k=0;k<12;k++){const a=(k+(ring%2)*.5)/12*Math.PI*2;FPART(P,SK.rbox(.62,.3,.34,.06,1),new THREE.Color(stone).multiplyScalar(.82+r0()*.3).getHex(),Math.sin(a)*1.02,.16+ring*.31,Math.cos(a)*1.02,0,a,0,.05);}
    FPART(P,new THREE.CylinderGeometry(1.14,1.14,.1,14),0x6a655c,0,1.0,0);FPART(P,new THREE.CircleGeometry(.8,14),0x16202a,0,.55,0,-Math.PI/2,0,0,0);
    for(const x of [-.95,.95]){FPART(P,SK.rbox(.16,2.4,.16,.03,1),0x5a3d1e,x,1.2,0,0,0,0,.05);}
    FPART(P,SK.cyl(.14,.14,1.7,10),0x6a4a2a,0,1.85,0,0,0,Math.PI/2);FPART(P,SK.cyl(.02,.02,.4,5),0x2a2420,1.0,1.85,.18,0,0,0);FPART(P,SK.cyl(.018,.018,.25,5),0x2a2420,1.0,1.7,.3,Math.PI/2,0,0);
    FPART(P,SK.cyl(.012,.012,1.1,4),0xb09a70,0,1.25,0);FPART(P,SK.lathe([[.001,0],[.13,0],[.15,.22],[.001,.22]],8),0x5a4028,0,.6,0);
    for(const s of [1,-1])FPART(P,SK.rbox(2.6,.08,1.0,.03,1),0x4a3a2a,0,2.72,s*.42,s*.55,0,0,.08);FPART(P,SK.cyl(.06,.06,2.7,6),0x3a2a1a,0,2.95,0,0,0,Math.PI/2);
    return mergeParts(P);}
  function stallGeoHi(pk){const r0=furnRng(),P=[];const cl=new THREE.Color(pk.cloth),wh=new THREE.Color(0xe8e0c8);
    for(const [x,z] of [[-1.4,-.9],[1.4,-.9],[-1.4,.9],[1.4,.9]])FPART(P,SK.rbox(.12,z<0?2.5:2.1,.12,.02,1),0x5a3d1e,x,z<0?1.25:1.05,z,0,0,0,.05);
    for(let k=0;k<8;k++)FPART(P,new THREE.BoxGeometry(.42,.04,2.5),(k%2?wh:cl).getHex(),-1.47+k*.42,2.36,0,-.16,0,0,.05);
    for(let k=0;k<8;k++)FPART(P,SK.cone(.21,.22,3),(k%2?wh:cl).getHex(),-1.47+k*.42,2.05,1.23,Math.PI,Math.PI/6,0,.05);
    FPART(P,SK.rbox(3.0,.08,1.0,.02,1),0x7a5a36,0,.92,.5,0,0,0,.06);FPART(P,SK.rbox(2.9,.84,.9,.03,1),0x6a4a2a,0,.46,.5,0,0,0,.06);for(let k=0;k<6;k++)FPART(P,new THREE.BoxGeometry(.02,.7,.02),0x4a3420,-1.25+k*.5,.46,.96,0,0,0,0);
    pk.goods.forEach((gc,i)=>{const x=-1+i;const kind=Math.floor(r0()*3);
      if(kind===0)for(let q=0;q<5;q++)FPART(P,SK.ball(.1,8,6),gc,x+(q%3-1)*.14,1.06+Math.floor(q/3)*.11,.45+(q%2)*.1,0,0,0,.1);
      else if(kind===1)FPART(P,SK.lathe([[.001,0],[.13,0],[.17,.12],[.12,.26],[.07,.3],[.001,.3]],10),gc,x,.96,.5,0,0,0,.06);
      else{FPART(P,SK.rbox(.5,.18,.38,.03,1),0x8a6a40,x,1.05,.5,0,0,0,.05);for(let q=0;q<3;q++)FPART(P,SK.ball(.08,6,5),gc,x-.14+q*.14,1.17,.5,0,0,0,.1);}});
    return mergeParts(P);}
  function tentGeoHi(pk){const P=[];const tc=pk.tc;
    FPART(P,SK.lathe([[.001,2.9],[.25,2.75],[1.4,1.4],[2.2,.55],[2.35,.35],[2.35,0],[2.2,0],[2.2,.3],[2.05,.5],[1.3,1.35],[.2,2.72],[.001,2.82]],12),tc,0,0,0,0,0,0,.06);
    FPART(P,SK.cyl(.06,.06,3.2,6),0x4a3018,0,1.6,0);FPART(P,SK.ball(.1,6,5),0x8a2a1a,0,3.25,0);
    for(let k=0;k<6;k++){const a=k/6*Math.PI*2+.3,x0=Math.sin(a)*2.2,z0=Math.cos(a)*2.2,x1=Math.sin(a)*3.4,z1=Math.cos(a)*3.4;const L=Math.hypot(x1-x0,.55,z1-z0);
      const g=SK.cyl(.012,.012,L,4);g.translate(0,L/2,0);const v=new THREE.Vector3(x1-x0,-.55,z1-z0).normalize();const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v);const e=new THREE.Euler().setFromQuaternion(q);
      FPART(P,g,0xb09a70,x0,.55,z0,e.x,e.y,e.z,0);FPART(P,SK.cyl(.03,.02,.3,4),0x5a4028,x1,.1,z1,0,0,0);}
    FPART(P,new THREE.BoxGeometry(.9,1.1,.04),new THREE.Color(tc).multiplyScalar(.6).getHex(),0,.55,2.12,-.2,0,0,0);
    return mergeParts(P);}
  function ruinGeoHi(pk){const r0=furnRng(),P=[];
    for(const w of pk.picks){const c0=Math.cos(w.ry),s0=Math.sin(w.ry);const rows=Math.max(1,Math.round(w.h/.34));
      for(let row=0;row<rows;row++){const top=row===rows-1;const n=Math.max(1,Math.round(w.w/.55));for(let k=0;k<n;k++){if(top&&r0()<.35)continue;if(row>rows*.5&&(k<n*.2||k>n*.8)&&r0()<.6)continue;
        const lx=-w.w/2+(k+.5+(row%2)*.3)*w.w/n;if(Math.abs(lx)>w.w/2)continue;const y=.17+row*.34;const x=w.x+lx*c0,z=w.z-lx*s0;
        FPART(P,SK.rbox(w.w/n*.94,.3,.58,.06,1),new THREE.Color(w.col).multiplyScalar(.85+r0()*.35).getHex(),x,y,z,0,w.ry+(r0()-.5)*.06,(r0()-.5)*.05,.06);}}
      for(let k=0;k<4;k++){const a=r0()*6.28,d=1+r0()*1.5;FPART(P,SK.rbox(.5,.28,.4,.06,1),new THREE.Color(w.col).multiplyScalar(.8+r0()*.3).getHex(),w.x+Math.sin(a)*d,.14,w.z+Math.cos(a)*d,(r0()-.5)*.4,r0()*3,(r0()-.5)*.4,.06);}
      for(let k=0;k<3;k++)FPART(P,SK.bumpy(SK.ball(.22,8,5,0,Math.PI*2,0,Math.PI/2),.04,8,k),0x4a6a30,w.x+(r0()-.5)*w.w*.8*c0,.02,w.z-(r0()-.5)*w.w*.8*s0,0,0,0,.1);}
    return mergeParts(P);}
  function standingStoneGeoHi(pk){const r0=furnRng(),P=[];const g=SK.bumpy(SK.rbox(pk.w,pk.h,.6,.18,3),.05,6,r0()*9);
    FPART(P,g,0x5a5852,0,1.6,0,0,pk.ry,pk.rz,.1);for(let k=0;k<5;k++){const y=.4+r0()*pk.h*.8;FPART(P,SK.ball(.12+r0()*.1,6,4),r0()<.5?0x8a9a5a:0xb0a878,(r0()-.5)*pk.w*.7,y,.31,0,0,0,.1);}
    FPART(P,SK.bumpy(SK.ball(.7,10,5,0,Math.PI*2,0,Math.PI/2),.06,7,3),0x4a6a30,0,0,0,0,0,0,.1);return mergeParts(P);}
  function wellGeo(){const lo=wellGeoLo(),hi=wellGeoHi();hi.userData.lo=lo;return hi;}
  function stallGeo(r){const lo=stallGeoLo(r),hi=stallGeoHi(lo.userData.picks);hi.userData.lo=lo;return hi;}
  function tentGeo(r){const lo=tentGeoLo(r),hi=tentGeoHi(lo.userData.picks);hi.userData.lo=lo;return hi;}
  function ruinGeo(r){const lo=ruinGeoLo(r),hi=ruinGeoHi({picks:lo.userData.picks});hi.userData.lo=lo;return hi;}
  function standingStoneGeo(r){const lo=standingStoneGeoLo(r),hi=standingStoneGeoHi(lo.userData.picks);hi.userData.lo=lo;return hi;}
  const SETTLE_MAT=VC_MAT;
