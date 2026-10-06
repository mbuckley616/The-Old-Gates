  // ── Ships on the shape kit (backlog H.5b, Session 168) ──
  // A hull is lofted, not boxed: stations along the length, each a round-bilged section from the keel to the gunwale,
  // fining to a stem at the bow and a transom or sternpost aft, the gunwale rising to both ends; each row of faces is a
  // strake with its own shade, tarred below the waterline. Deck, rails, wale, keel and stem, rudder, bowsprit, rigging
  // and sails are baked with it into one vertex-coloured geometry: one draw call a ship, as before. The frame is the
  // game's: the mesh sits at SEA_Y, +z is the prow, the deck is flat at 1.0 (DECK_Y), the wheel at -L/2+2.8, the hatch at
  // L/2-3.2. The deck you can stand on follows the hull's breadth (mesh.userData.deckAt), not the old box's rectangle.
  // Prototype: docs/prototypes/boats (Michael, 27 Sep: the rigs per class, the pirate and merchant looks; the sails
  // filled, ratlines, the spritsail brought in).
  const SHIP_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0,side:THREE.DoubleSide});
  const SHIP_DECK=1.0;
  function ShipBake(){this.parts=[];}
  {const _e=new THREE.Euler(0,0,0,'YXZ'),_q=new THREE.Quaternion();
    ShipBake.prototype.add=function(geo,p,r,s,col){_e.set(r?r[0]:0,r?r[1]:0,r?r[2]:0,'YXZ');_q.setFromEuler(_e);
      const m=new THREE.Matrix4().compose(new THREE.Vector3(p?p[0]:0,p?p[1]:0,p?p[2]:0),_q,new THREE.Vector3(s?s[0]:1,s?s[1]:1,s?s[2]:1));
      this.parts.push([geo,m,col==null?null:new THREE.Color(col)]);return this;};}
  // a part between two points (spars, stays, shrouds, ratlines)
  ShipBake.prototype.rod=function(a,b,r0,r1,col,seg){const A=new THREE.Vector3(a[0],a[1],a[2]),B=new THREE.Vector3(b[0],b[1],b[2]),d=B.clone().sub(A),L=d.length();
    const g=new THREE.CylinderGeometry(r1==null?r0:r1,r0,L,seg||5,1,true);g.translate(0,L/2,0);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
    this.parts.push([g,new THREE.Matrix4().compose(A,q,new THREE.Vector3(1,1,1)),new THREE.Color(col)]);return this;};
  ShipBake.prototype.bake=function(){
    let n=0;const flat=this.parts.map(([g,m,c])=>{const gg=g.index?g.toNonIndexed():g.clone();g.dispose();gg.applyMatrix4(m);if(!gg.attributes.normal)gg.computeVertexNormals();n+=gg.attributes.position.count;return [gg,c];});
    const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;
    flat.forEach(([g,c])=>{const p=g.attributes.position,nn=g.attributes.normal,vc=g.attributes.color;
      for(let i=0;i<p.count;i++,o++){pos[o*3]=p.getX(i);pos[o*3+1]=p.getY(i);pos[o*3+2]=p.getZ(i);nor[o*3]=nn.getX(i);nor[o*3+1]=nn.getY(i);nor[o*3+2]=nn.getZ(i);
        if(c){col[o*3]=c.r;col[o*3+1]=c.g;col[o*3+2]=c.b;}else{col[o*3]=vc.getX(i);col[o*3+1]=vc.getY(i);col[o*3+2]=vc.getZ(i);}}g.dispose();});
    const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('color',new THREE.BufferAttribute(col,3));
    out.computeBoundingBox();out.computeBoundingSphere();return out;};
  const shC=x=>new THREE.Color(x);
  // the hull: o {L,W,draft,sheer,bowRise,sternRise,stem,transom,full,strakes,bottom,wale,band,rows,stations}
  // returns the geometry, a transom, at(z) -> {b half-breadth at the gunwale, g gunwale height, k keel}, and the keel and gunwale lines
  function shipHull(o){
    const D=SHIP_DECK,L=o.L,W=o.W,NS=o.stations||28,NR=o.rows||12,zs=-L/2-(o.transom?.15:.6),zb=L/2+(o.stem||2.2);
    const rows=[],kpts=[],gpts=[];const U=u=>zs+(zb-zs)*u;
    const breadth=u=>{const z=U(u);let k=1;
      if(z>L/2-2.4){const t=(z-(L/2-2.4))/(zb-(L/2-2.4));k=Math.max(.015,1-Math.pow(t,o.full||1.7));}
      if(z<-L/2+2.2){const t=(-L/2+2.2-z)/(-L/2+2.2-zs);k=Math.min(k,1-Math.pow(t,2.2)*(1-(o.transom||.12)));}
      return W/2*k;};
    const gun=u=>{const z=U(u),t=z/(L/2);return D+(o.sheer||.45)+(t>0?(o.bowRise||.5)*Math.pow(Math.max(0,t),2.2):(o.sternRise||.35)*Math.pow(-t,2.4));};
    const keel=u=>{const z=U(u);let y=-(o.draft||1.1);
      if(z>L/2-3.5){const t=(z-(L/2-3.5))/(zb-(L/2-3.5));y+=(gun(u)-.05-y)*Math.pow(t,2.1);}
      if(z<-L/2+1.5){const t=(-L/2+1.5-z)/(-L/2+1.5-zs);y+=(o.transom?(.55+.3*t):1.2)*t*t;}
      return y;};
    for(let s=0;s<=NS;s++){const u=s/NS,z=U(u),b=breadth(u),g=gun(u),k=keel(u);kpts.push(new THREE.Vector3(0,k,z));gpts.push(new THREE.Vector3(b,g,z));
      const ring=[];for(let j=0;j<=NR;j++){const th=j/NR*Math.PI/2;const sx=Math.pow(Math.sin(th),.45),cy=Math.pow(Math.cos(th),.55);
        const flare=1+.05*Math.max(0,(1-cy)-.6);ring.push([b*sx*flare,g-(g-k)*cy,z]);}
      rows.push(ring);}
    const pos=[],colr=[];const push=(a,c)=>{pos.push(a[0],a[1],a[2]);colr.push(c.r,c.g,c.b);};
    const strake=(j,y,s)=>{if(y<.08)return shC(o.bottom||0x2e2620);if(o.wale&&y>D-.28&&y<D-.02)return shC(o.wale);
      if(o.band&&y>D+.02)return shC(o.band);const base=shC(o.strakes[j%o.strakes.length]);return base.multiplyScalar(.94+.06*((s*7)%3)/2);};
    for(let s=0;s<NS;s++)for(let j=0;j<NR;j++)for(const side of [1,-1]){
      const a=rows[s][j],b=rows[s+1][j],c=rows[s+1][j+1],d=rows[s][j+1];const f=q=>[q[0]*side,q[1],q[2]];
      const col=strake(NR-1-j,(a[1]+c[1])/2,Math.floor(s/4));
      const tri=side>0?[a,b,c,a,c,d]:[a,c,b,a,d,c];for(const q of tri)push(f(q),col);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colr,3));
    geo.computeVertexNormals();shipSmoothNormals(geo);
    let tgeo=null;if(o.transom){const r=rows[0],cz=r[0][2],tp=[],tc=[];const col=shC(o.transomCol||o.strakes[0]).multiplyScalar(.85);
      for(let j=0;j<NR;j++)for(const side of [1,-1]){const a=r[j],d=r[j+1];const f=q=>[q[0]*side,q[1],cz];
        const quad=[a,d,[0,d[1],cz],[0,a[1],cz]];const ix=side>0?[0,2,1,0,3,2]:[0,1,2,0,2,3];for(const i of ix){const q=f(quad[i]);tp.push(q[0],q[1],q[2]);tc.push(col.r,col.g,col.b);}}
      tgeo=new THREE.BufferGeometry();tgeo.setAttribute('position',new THREE.Float32BufferAttribute(tp,3));tgeo.setAttribute('color',new THREE.Float32BufferAttribute(tc,3));tgeo.computeVertexNormals();}
    const at=z=>{const u=Math.min(1,Math.max(0,(z-zs)/(zb-zs)));return {b:breadth(u),g:gun(u),k:keel(u)};};
    return {geo,tgeo,at,kpts,gpts,zs,zb};
  }
  // smooth normals across faces that share a point: the strakes are coloured flat, the hull shades round
  function shipSmoothNormals(g){const p=g.attributes.position,n=g.attributes.normal,m=new Map();const key=i=>`${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    for(let i=0;i<p.count;i++){const k=key(i);let v=m.get(k);if(!v)m.set(k,v=new THREE.Vector3());v.x+=n.getX(i);v.y+=n.getY(i);v.z+=n.getZ(i);}
    for(let i=0;i<p.count;i++){const v=m.get(key(i)).clone().normalize();n.setXYZ(i,v.x,v.y,v.z);}}
  // the deck: planks fore and aft, clipped to the hull's breadth. deckAt(z) is the half-breadth you can stand on there
  function shipDeck(B,H,L,cols){const y=SHIP_DECK,NZ=24,NP=9;const pos=[],col=[];const z0=-L/2-.05,z1=H.zb-.5;
    for(let s=0;s<NZ;s++){const za=z0+(z1-z0)*s/NZ,zb=z0+(z1-z0)*(s+1)/NZ;const ba=H.at(za).b*.97,bb=H.at(zb).b*.97;
      for(let p=0;p<NP;p++){const fa=-1+2*p/NP,fb=-1+2*(p+1)/NP;const c=shC(cols[(p+(s>>3))%cols.length]);
        const q=[[ba*fa,y,za],[ba*fb,y,za],[bb*fb,y,zb],[bb*fa,y,zb]];for(const i of [0,2,1,0,3,2]){pos.push(q[i][0],q[i][1],q[i][2]);col.push(c.r,c.g,c.b);}}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();B.add(g);
    return {z0,z1,at:z=>z<z0||z>z1?0:H.at(z).b*.97};}
  function shipRail(B,H,r,col,dy){for(const side of [1,-1]){const pts=H.gpts.filter((q,i)=>i%2===0||i===H.gpts.length-1).map(q=>new THREE.Vector3(q.x*side,q.y+(dy||0),q.z));
    B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),28,r,5,false),null,null,null,col);}}
  function shipWale(B,H,y,r,col){for(const side of [1,-1]){const pts=[];for(let z=H.zs+.2;z<H.zb-.6;z+=.6){const b=H.at(z).b;pts.push(new THREE.Vector3(b*side*1.01,y,z));}
    B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,r,4,false),null,null,null,col);}}
  function shipKeel(B,H,r,col,top){const pts=H.kpts.filter((q,i)=>i%2===0).map(q=>q.clone());const last=H.kpts[H.kpts.length-1];pts.push(new THREE.Vector3(0,last.y+(top||.35),last.z+.12));
    B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,r,5,false),null,null,null,col);}
  // a square sail, filled: it bellies forward most in the middle and low down, the foot curving up at the clews, the
  // leeches drawn in a little, the way a sail full of wind hangs from its yard
  function shipSail(B,w0,w1,h,belly,col,seam,at){const nx=8,ny=8,pos=[],cl=[];const c0=shC(col),c1=shC(seam||col);
    const P=(i,j)=>{const t=j/ny,u=i/nx,w=w1+(w0-w1)*t,s=Math.sin(Math.PI*u);const x=(u-.5)*w*(1-.06*Math.sin(Math.PI*t));
      const y=-h*t+h*.1*t*t*(1-s);const bz=belly*s*Math.pow(Math.sin(Math.PI*(.12+.8*t)),.8)*(.75+.25*t);return [x,y,bz];};
    for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const q=[P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)];const c=(i%2?c1:c0);for(const k of [0,1,2,0,2,3])pos.push(q[k][0],q[k][1],q[k][2]),cl.push(c.r,c.g,c.b);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.computeVertexNormals();
    B.add(g,at);}
  // the wheel is its own small mesh on the hull, so it can turn with the helm
  function shipWheelMesh(){const B=new ShipBake(),W=0x5a3a1c;B.add(SK.torus(.4,.045,6,14),[0,0,0],0,null,W);
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2;B.rod([Math.cos(a)*.1,Math.sin(a)*.1,0],[Math.cos(a)*.56,Math.sin(a)*.56,0],.022,.018,W,4);}
    B.add(SK.cyl(.08,.1,.1,8),[0,0,0],[Math.PI/2,0,0],null,0x3a2410);const m=new THREE.Mesh(B.bake(),SHIP_MAT);m.castShadow=true;return m;}
  function shipHatch(B,z){const D=SHIP_DECK;B.add(new THREE.BoxGeometry(1.3,.14,1.3),[0,D+.07,z],0,null,0x4a3018);
    for(let k=-2;k<=2;k++)B.add(new THREE.BoxGeometry(1.1,.04,.12),[0,D+.15,z+k*.22],0,null,0x2e1e10);
    B.add(SK.torus(.1,.022,5,10),[.34,D+.16,z],[Math.PI/2,0,0],null,0x2a2622);}
  function shipBarrel(B,x,z,col){const y=SHIP_DECK;B.add(SK.lathe([[.001,0],[.2,0],[.24,.12],[.26,.25],[.24,.38],[.2,.5],[.001,.5]],10),[x,y,z],0,null,col||0x7a5228);
    for(const h of [.06,.44])B.add(SK.torus(.235,.018,5,10),[x,y+h,z],[Math.PI/2,0,0],null,0x3a3530);}
  function shipCrate(B,x,z,s,ry){const y=SHIP_DECK;B.add(new THREE.BoxGeometry(s,s*.8,s),[x,y+s*.4,z],[0,ry||0,0],null,0x8a6a38);B.add(new THREE.BoxGeometry(s*1.02,s*.12,s*1.02),[x,y+s*.4,z],[0,ry||0,0],null,0x5a4020);}
  function shipLantern(B,x,y,z){B.rod([x,y-.5,z],[x,y,z],.03,.03,0x2a2622,4);B.add(SK.cyl(.08,.1,.22,6),[x,y+.11,z],0,null,0xffc860);B.add(SK.cone(.12,.1,6),[x,y+.27,z],0,null,0x2a2622);}
  // shrouds from the chains at the gunwale to the masthead, and ratlines across them every .42 up to climb by
  function shipShrouds(B,H,z,top,n,dz,rc){for(const s of [1,-1]){const ends=[];for(let k=0;k<n;k++){const zz=z-dz*(n-1)/2+k*dz;const a=H.at(zz);const lo=[a.b*s*1.02,a.g-.1,zz],hi=[.13*s,top,z];B.rod(lo,hi,.02,.02,rc,3);ends.push([lo,hi]);}
    if(n<2)continue;const lo0=ends[0][0][1],steps=Math.floor((top-lo0)*.62/.42);
    for(let q=1;q<=steps;q++){const pts=ends.map(([lo,hi])=>{const t=q*.42/(top-lo[1]);return [lo[0]+(hi[0]-lo[0])*t,lo[1]+(hi[1]-lo[1])*t,lo[2]+(hi[2]-lo[2])*t];});
      for(let k=0;k<pts.length-1;k++)B.rod(pts[k],pts[k+1],.011,.011,rc,3);}}}
  // a gaff sail aft of a mast: boom at bY, gaff peaking up from gY, the sail between them filled to leeward
  function shipGaff(B0,mz0,bY,gY,boomL,gaffL,lk,rigs){const B=rigs?new ShipBake():B0,mz=rigs?0:mz0;B.rod([0,bY,mz-.1],[0,bY+.25,mz-boomL],.07,.05,0x5a3c1e,6);B.rod([0,gY,mz-.1],[0,gY+gaffL*.3,mz-gaffL],.06,.045,0x5a3c1e,6);
    const nx=8,ny=8,pos=[],cl=[];const c0=shC(lk.sail),c1=shC(lk.seam);
    const Pm=(i,j)=>{const t=i/nx,v=j/ny;const zf=mz-.15-t*(v*(gaffL-.2)+(1-v)*(boomL-.3));const yb=bY+.1+.25*t,yt=gY-.05+gaffL*.3*t;const y=yb+(yt-yb)*v;
      return [1.05*Math.pow(Math.sin(Math.PI*t),.85)*Math.sin(Math.PI*(.12+.8*v))*(1-.35*v),y,zf];};
    for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const q=[Pm(i,j),Pm(i+1,j),Pm(i+1,j+1),Pm(i,j+1)];const c=j%2?c1:c0;for(const k of [0,1,2,0,2,3])pos.push(q[k][0],q[k][1],q[k][2]),cl.push(c.r,c.g,c.b);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.computeVertexNormals();B.add(g);
    if(rigs)rigs.push({geo:B.bake(),z:mz0,type:'gaff'});}
  // a mast with a top, its shrouds and ratlines, the yard and a square sail (and a topsail over it)
  function shipSquareMast(B,H,z,h,yardW,sailH,o){const D=SHIP_DECK,mc=o.mast||0x5a3c1e,rc=o.rope||0x2e2820;const foot=D-.8;
    B.add(SK.cyl(.1*o.k,.17*o.k,h+.8,8),[0,foot+(h+.8)/2,z],0,null,mc);
    if(o.top)B.add(SK.cyl(.42*o.k,.3*o.k,.14,10),[0,D+h*.72,z],0,null,mc);
    shipShrouds(B,H,z,D+h*.72,3,.55,rc);
    // S330 — the yards and sails a rig of their own (o.rigs), braced round the mast by shipTrim
    const R=o.rigs?new ShipBake():B,zr=o.rigs?0:z;
    const yy=D+h*.66;R.rod([-yardW/2,yy,zr+.18],[yardW/2,yy,zr+.18],.06*o.k,.06*o.k,mc,6);
    shipSail(R,yardW*.94,yardW*1.02,sailH,yardW*.11,o.sail,o.seam,[0,yy-.05,zr+.22]);
    if(o.topsail){const y2=D+h*.95;R.rod([-yardW*.35,y2,zr+.14],[yardW*.35,y2,zr+.14],.045,.045,mc,6);shipSail(R,yardW*.66,yardW*.84,h*.2,yardW*.07,o.sail,o.seam,[0,y2-.04,zr+.18]);}
    if(o.rigs)o.rigs.push({geo:R.bake(),z,type:'square'});
    return yy;}
  const SHIP_LOOKS={
    player:{strakes:[0x6a4424,0x5c3a1e,0x714a28],wale:0x3a2410,band:null,bottom:0x2e2620,sail:0xece2c8,seam:0xdccfac,trim:0x3a2410,deck:[0xa8865a,0x9c7c52,0xb08e62]},
    pirate:{strakes:[0x2e2824,0x26201c,0x322a24],wale:0x6a1a14,band:0x1a1614,bottom:0x1e1a16,sail:0x2a2624,seam:0x1e1a18,trim:0x6a1a14,deck:[0x6a5a44,0x5e503c,0x72604a]},
    merchant:{strakes:[0x7a5a34,0x6e5030,0x84623a],wale:0x2a4a3a,band:0x3a6a52,bottom:0x3a2e24,sail:0xeee2c6,seam:0xa84a30,trim:0x2a4a3a,deck:[0xb09264,0xa48658,0xb89a6c]}
  };
  const SHIP_GEO=new Map();
  // kind 'sloop' | 'cog' | 'galleon'; look 'player' | 'pirate' | 'merchant'. One bake per kind and look, shared.
  function shipBake(kind,look){const key=kind+'|'+look;let r=SHIP_GEO.get(key);if(r)return r;
    const D=SHIP_DECK,lk=SHIP_LOOKS[look]||SHIP_LOOKS.player;const B=new ShipBake();
    const cls={sloop:{L:13,W:4.4},cog:{L:17,W:5.6},galleon:{L:22,W:7.0}}[kind];const L=cls.L,W=cls.W;
    const hopt={sloop:{draft:1.05,sheer:.42,bowRise:.45,sternRise:.3,stem:2.4,transom:.34,full:1.8},
      cog:{draft:1.25,sheer:.55,bowRise:.85,sternRise:.9,stem:1.4,transom:0,full:1.3},
      galleon:{draft:1.5,sheer:.5,bowRise:.7,sternRise:1.25,stem:3.0,transom:.62,full:2.0}}[kind];
    const H=shipHull(Object.assign({L,W,strakes:lk.strakes,wale:lk.wale,band:lk.band,bottom:lk.bottom,transomCol:lk.strakes[1],stations:kind==='galleon'?34:28},hopt));
    B.add(H.geo);if(H.tgeo)B.add(H.tgeo);const deckAt=shipDeck(B,H,L,lk.deck);
    shipRail(B,H,.06,lk.trim,.02);shipWale(B,H,D-.15,.07,lk.wale);shipKeel(B,H,.09,lk.trim,kind==='cog'?.2:.45);
    const st=H.at(H.zs+.01);B.rod([0,st.k-.1,H.zs-.05],[0,st.g+.1,H.zs-.12],.08,.08,lk.trim,5);
    const rud=new THREE.BoxGeometry(.12,1,1);rud.translate(0,-.5,-.5);B.add(rud,[0,D-.15,H.zs-.1],null,[1,1.1+hopt.draft*.7,.8],lk.trim);
    const bow=H.at(H.zb-.3);const sp=kind==='cog'?1.8:kind==='galleon'?6:4.4;const bz=H.zb-.6,by=bow.g-.05;
    const spA=[0,by-.15,bz-1.2],spB=[0,by+sp*.35,bz+sp];B.rod(spA,spB,.13,.06,lk.trim,6);
    B.add(SK.cyl(.1,.13,.95,6),[0,D+.475,-L/2+2.92],0,null,0x4a3018); // the wheel's post; the wheel itself turns (shipWheelMesh)
    shipHatch(B,L/2-3.2);
    shipLantern(B,0,H.at(-L/2).g+.55,H.zs+.15);
    shipBarrel(B,W/2-.7,-1.6);shipBarrel(B,W/2-.75,-2.25,0x6a4a22);shipCrate(B,-W/2+.8,-1.9,.7,.3);shipCrate(B,-W/2+.75,-2.6,.55,-.2);
    const rigs=[];const mopt={k:kind==='galleon'?1.25:kind==='cog'?1.1:1,sail:lk.sail,seam:lk.seam,rope:0x2e2820,mast:0x5a3c1e,rigs};
    let mastTop=D+8.6,mastZ=.6;
    if(kind==='sloop'){
      // one mast, a gaff mainsail aft of it and a jib to the bowsprit
      const mz=.6,mh=8.6;B.add(SK.cyl(.11,.17,mh+.8,8),[0,D-.8+(mh+.8)/2,mz],0,null,0x5a3c1e);
      shipShrouds(B,H,mz,D+mh*.85,2,.5,0x2e2820);
      B.rod([0,D+mh*.85,mz],[0,by+sp*.33,bz+sp-.2],.022,.022,0x2e2820,3);B.rod([0,D+mh,mz],[0,H.at(-L/2).g,-L/2+.3],.02,.02,0x2e2820,3);
      shipGaff(B,mz,D+1.6,D+mh*.82,7.2,5.2,lk,rigs);
      // the jib, filled: a triangle from the masthead to the bowsprit and the deck at the bow, bellied to leeward
      const jh=[0,D+mh*.82,mz+.25],jt=[0,by+sp*.3,bz+sp-.5],jc=[.3,D+.6,L/2-.8];const jp=[],jcl=[];const N=7;const c=shC(lk.sail);
      const pt=(a,b)=>{const w=1-a-b;return [jh[0]*w+jt[0]*a+jc[0]*b+12*a*b*w,jh[1]*w+jt[1]*a+jc[1]*b,jh[2]*w+jt[2]*a+jc[2]*b];};
      for(let i=0;i<N;i++)for(let j=0;j<N-i;j++){const A=pt(i/N,j/N),Bq=pt((i+1)/N,j/N),Cq=pt(i/N,(j+1)/N);jp.push(...A,...Bq,...Cq);jcl.push(c.r,c.g,c.b,c.r,c.g,c.b,c.r,c.g,c.b);
        if(j<N-i-1){const Dq=pt((i+1)/N,(j+1)/N);jp.push(...Bq,...Dq,...Cq);jcl.push(c.r,c.g,c.b,c.r,c.g,c.b,c.r,c.g,c.b);}}
      const jg=new THREE.BufferGeometry();jg.setAttribute('position',new THREE.Float32BufferAttribute(jp,3));jg.setAttribute('color',new THREE.Float32BufferAttribute(jcl,3));jg.computeVertexNormals();const JB=new ShipBake();JB.add(jg);rigs.push({geo:JB.bake(),z:0,type:'jib'});
    }
    if(kind==='cog'){
      // one tall mast, one great square sail; castle rails on posts over the raised ends (the deck stays flat to walk on)
      shipSquareMast(B,H,.4,10.5,8.2,6.6,Object.assign({top:true},mopt));mastTop=D+10.5;mastZ=.4;
      B.rod([0,D+10.5*.72,.4],[0,by+sp*.3,bz+sp-.1],.025,.025,0x2e2820,3);
      for(const [z0,z1] of [[-L/2+.2,-L/2+3.2],[L/2-1.8,L/2+.8]])for(const s of [1,-1]){for(let z=z0;z<=z1+.01;z+=.75){const a=H.at(z);B.rod([a.b*s*.96,a.g,z],[a.b*s*.96,a.g+.55,z],.045,.045,lk.trim,4);}
        const pts=[];for(let z=z0;z<=z1+.01;z+=.5){const a=H.at(z);pts.push(new THREE.Vector3(a.b*s*.96,a.g+.55,z));}B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.05,4,false),null,null,null,lk.trim);}
      if(look!=='pirate'){const sh=H.at(0);for(const s of [1,-1])for(let k=0;k<4;k++){const z=-2.4+k*1.5;B.add(SK.cyl(.36,.36,.06,10),[sh.b*s*1.03,sh.g-.28,z],[0,0,Math.PI/2],null,[0xa83a2a,0xd8c49a,0x2a4a7a,0xd8c49a][k]);}}
    }
    if(kind==='galleon'){
      // fore and main square-rigged with topsails, a gaff mizzen; the spritsail hangs from a yard under the bowsprit,
      // a third of the way out (the prototype's hung far ahead of the bow)
      shipSquareMast(B,H,5.2,10.5,7.4,5.8,Object.assign({top:true,topsail:true},mopt));
      shipSquareMast(B,H,-.4,13,9.4,7.2,Object.assign({top:true,topsail:true},mopt));mastTop=D+13;mastZ=-.4;
      const mz=-6.6,mh=9;B.add(SK.cyl(.12,.19,mh+.8,8),[0,D-.8+(mh+.8)/2,mz],0,null,0x5a3c1e);
      shipShrouds(B,H,mz,D+mh*.8,2,.5,0x2e2820);
      shipGaff(B,mz,D+1.9,D+mh*.78,4.6,3.6,lk,rigs);
      const t=.36,sy=spA[1]+(spB[1]-spA[1])*t-.18,sz=spA[2]+(spB[2]-spA[2])*t;
      B.rod([-2.1,sy,sz],[2.1,sy,sz],.045,.045,0x5a3c1e,5);shipSail(B,4.0,4.3,1.7,.4,lk.sail,lk.seam,[0,sy-.05,sz+.05]);
      for(const [a,b] of [[[0,D+13*.72,-.4],[0,D+10.5*.72,5.2]],[[0,D+10.5*.72,5.2],[0,by+sp*.3,bz+sp-.2]],[[0,D+9*.8,mz],[0,D+13*.72,-.4]]])B.rod(a,b,.025,.025,0x2e2820,3);
      const tz=H.zs-.02;for(let k=-2;k<=2;k++){B.add(new THREE.BoxGeometry(.5,.55,.06),[k*.72,D+.55,tz],0,null,0x1a1a22);B.add(new THREE.BoxGeometry(.62,.08,.1),[k*.72,D+.87,tz],0,null,0xc8a040);}
      B.add(new THREE.BoxGeometry(4.2,.12,.14),[0,D+.2,tz],0,null,0xc8a040);
      const gp=look==='merchant'?0:6;for(const s of [1,-1])for(let k=0;k<gp;k++){const z=-5+k*2.1;const a=H.at(z);B.add(new THREE.BoxGeometry(.06,.42,.5),[a.b*s*1.005,D-.45,z],0,null,0x1a1614);}
      shipLantern(B,-1.6,H.at(-L/2).g+.5,H.zs+.2);shipLantern(B,1.6,H.at(-L/2).g+.5,H.zs+.2);
    }
    if(look==='pirate'){const fl=new THREE.PlaneGeometry(1.4,.9,3,1);const p=fl.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*3)*.08);fl.computeVertexNormals();
      const FB=new ShipBake();FB.add(fl,[0,mastTop+.9,-.8],[0,Math.PI/2,0],null,0x111111);FB.add(SK.ball(.14,8,6),[.03,mastTop+.95,-.8],0,[1,1,.6],0xd8d0c0);rigs.push({geo:FB.bake(),z:mastZ,type:'flag'});/* S332 — the black flag streams downwind */B.rod([0,mastTop,mastZ],[0,mastTop+1.4,mastZ],.03,.03,0x2a2622,4);}
    r={geo:B.bake(),deck:deckAt,L,W,zs:H.zs,zb:H.zb,rigs};SHIP_GEO.set(key,r);return r;}
  // a harbour boat: an open clinker boat with thwarts, oars shipped, a stubby mast with the sail furled; four paints
  function boatBake(v){const key='boat|'+v;let r=SHIP_GEO.get(key);if(r)return r;
    const R=(()=>{let s=(v*2654435761+12345)>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};})();const B=new ShipBake();const paint=[0x5a6a4a,0x6a3a2a,0x3a4a6a,0x7a6a4a][v%4];
    const L=6,W=2.2,G=.55;const H=shipHull({L,W,draft:.55,sheer:G-SHIP_DECK,bowRise:.35,sternRise:.25,stem:1.0,transom:.4,full:1.5,rows:9,stations:20,strakes:[0x7a5634,0x6a4a2c,0x84603a],band:null,wale:null,bottom:0x3a3028});
    B.add(H.geo);if(H.tgeo)B.add(H.tgeo);const at=z=>H.at(z);
    for(const side of [1,-1]){const pts=H.gpts.filter((q,i)=>i%2===0).map(q=>new THREE.Vector3(q.x*side,q.y+.02,q.z));B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,.05,4,false),null,null,null,paint);}
    const pts=H.kpts.filter((q,i)=>i%2===0).map(q=>new THREE.Vector3(0,q.y,q.z));B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,.06,4,false),null,null,null,paint);
    B.add(new THREE.BoxGeometry(W*.5,.04,L*.72),[0,at(0).k+.22,-.1],0,null,0x9a7a4a);
    for(const z of [-1.7,-.2,1.2]){const a=at(z);B.add(new THREE.BoxGeometry(a.b*1.9,.07,.3),[0,a.g-.2,z],0,null,0xa0804e);}
    const st=at(-L/2);B.add(new THREE.BoxGeometry(st.b*1.8,.07,.9),[0,st.g-.22,-L/2+.3],0,null,0xa0804e);
    for(const s of [.3,-.3]){B.rod([s,at(0).g-.1,-2.2],[s*.8,at(0).g-.08,2.1],.03,.03,0xb09060,4);B.add(new THREE.BoxGeometry(.14,.02,.55),[s*.8,at(0).g-.08,2.3],0,null,0xb09060);}
    const mz=1.2,mh=3.6;B.add(SK.cyl(.05,.08,mh,6),[0,at(mz).k+mh/2+.1,mz],0,null,0x5a3c1e);
    const yy=at(mz).k+mh-.2;B.rod([0,yy,mz+.1],[0,yy-.9,mz-2.2],.035,.03,0x5a3c1e,5);B.rod([0,yy-.12,mz-.05],[0,yy-.95,mz-2.1],.1,.07,0xd8ccae,8);
    B.add(SK.torus(.16,.04,5,12),[.35,at(-1).k+.3,-1],[Math.PI/2,0,0],null,0x8a7a58);
    B.add(SK.bumpy(SK.ball(.28,10,6,0,Math.PI*2,0,1.8),.05,11,R()*9),[-.2,at(.5).k+.28,.5],0,[1,.5,1.3],0x8a8060);
    B.add(SK.lathe([[.001,0],[.16,0],[.2,.22],[.19,.24],[.001,.24]],9),[.3,at(-2.4).k+.24,-2.4],0,null,0x9a7a40);
    r={geo:B.bake()};SHIP_GEO.set(key,r);return r;}
  // a point in world space against a ship's deck: in the mesh's frame (turned by rotation.y), within the deck's breadth there
  function onShipDeck(mesh,wx,wz){const d=mesh.userData.deck;if(!d)return true;const ry=mesh.rotation.y,c=Math.cos(ry),s=Math.sin(ry);
    const dx=wx-mesh.position.x,dz=wz-mesh.position.z;const lx=dx*c-dz*s,lz=dx*s+dz*c;return Math.abs(lx)<d.at(lz)-.1;}
  // the ship's mesh: the class by its length, the look by who sails her; the wheel a child that turns with the helm
  function buildShipMesh(SHIP_L,SHIP_W,look){
    const kind=(SHIP_L||13)>=20?'galleon':(SHIP_L||13)>=15?'cog':'sloop';const r=shipBake(kind,look||'player');
    const mesh=new THREE.Mesh(r.geo,SHIP_MAT);mesh.castShadow=true;mesh.receiveShadow=true;
    const wheel=shipWheelMesh();wheel.position.set(0,SHIP_DECK+.95,-r.L/2+2.8);mesh.add(wheel);
    mesh.userData.wheel=wheel;mesh.userData.deck=r.deck;mesh.userData.kind=kind;
    mesh.userData.rigs=(r.rigs||[]).map(q=>{const m=new THREE.Mesh(q.geo,SHIP_MAT);m.castShadow=true;m.position.z=q.z;mesh.add(m);return {m,type:q.type,a:0};});
    mesh.userData.trimSnap=true;
    return mesh;
  }
  // S330 (Michael's 1, #57) — trim a ship's sails to the wind. th is the way the wind blows, against the bow in the hull's frame (0 dead astern,
  // +/-PI/2 on the beam, towards +x or -x). Square yards brace round to bisect the wind and the bow, at most 35 degrees; a gaff's
  // boom swings to leeward, out to 72 degrees running and in to 15 close-hauled; the gaff sails and the jib belly to leeward
  function shipTrim(mesh,th,dt){const R=mesh&&mesh.userData.rigs;if(!R)return;th=Math.atan2(Math.sin(th),Math.cos(th));const side=Math.sin(th)>=0?1:-1;
    for(const q of R){let t=0;if(q.type==='square')t=Math.max(-.61,Math.min(.61,th/2));else if(q.type==='gaff')t=-side*Math.max(.26,Math.min(1.25,(Math.PI-Math.abs(th))/2));
      // S332 — a flag has no bound: it points the way the wind goes (its cloth runs aft at 0) and turns the short way round, quicker than a sail
      if(q.type==='flag'){t=th+Math.PI;const d=Math.atan2(Math.sin(t-q.a),Math.cos(t-q.a));q.a=dt==null?t:q.a+d*Math.min(1,dt*3);q.m.rotation.y=q.a;continue;}
      q.a=dt==null?t:q.a+(t-q.a)*Math.min(1,dt*1.2);q.m.rotation.y=q.a;if(q.type!=='square')q.m.scale.x=side;}}
  // every ship afloat trims to the world's wind; a ship just built sets its sails at once, then eases round through a turn
  function tickSailTrim(dt){const w=windDir();const one=m=>{if(!m||!m.userData.rigs)return;const snap=m.userData.trimSnap;m.userData.trimSnap=false;shipTrim(m,w-m.rotation.y,snap?null:dt);};
    one(SHIP.mesh);for(const o of OTHER)one(o.mesh);}
  // the deck platform's box: the hull turned by yaw (the bow's deck reaches past L/2 now); the deck's own outline is plat.inside
  function shipPlatBox(plat,mesh,x,z,yaw,L,W){const d=mesh&&mesh.userData.deck;const hl=d?Math.max(-d.z0,d.z1):L/2;
    const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw));const hw=W/2*c+hl*s,hd=W/2*s+hl*c;
    plat.x0=x-hw;plat.x1=x+hw;plat.z0=z-hd;plat.z1=z+hd;if(mesh&&!plat.inside)plat.inside=(wx,wz)=>onShipDeck(mesh,wx,wz);}
  function shipUpdatePlacement(){
    const m=SHIP.mesh;if(!m)return;
    m.position.set(SHIP.x,SEA_Y+Math.sin(performance.now()*.0012)*.05,SHIP.z);m.rotation.y=SHIP.yaw+Math.PI; // mesh +z is the prow; movement forward is (-sin,-cos)
    m.rotation.z=Math.sin(performance.now()*.0017)*.02;
    // deck platform: the box around the turned hull, and within it the deck's own outline (S168)
    if(!SHIP.plat){SHIP.plat={x0:0,x1:0,z0:0,z1:0,y:DECK_Y,ship:true};ZONES.world.platforms.push(SHIP.plat);}
    if(SHIP.plat.mesh!==m){SHIP.plat.mesh=m;SHIP.plat.inside=null;}m.updateMatrix();
    shipPlatBox(SHIP.plat,m,SHIP.x,SHIP.z,SHIP.yaw,SHIP.L,SHIP.W);
    // the wheel in world space
    const wx=-Math.sin(SHIP.yaw)*(-SHIP.L/2+2.8),wz=-Math.cos(SHIP.yaw)*(-SHIP.L/2+2.8);
    SHIP.wheel.x=SHIP.x+wx;SHIP.wheel.z=SHIP.z+wz;
    // the helmsman stands a pace aft of the wheel, looking forward over it
    SHIP.helm={x:SHIP.x-Math.sin(SHIP.yaw)*(-SHIP.L/2+1.7),z:SHIP.z-Math.cos(SHIP.yaw)*(-SHIP.L/2+1.7)};
    if(m.userData.wheel)m.userData.wheel.rotation.z=(SHIP.sailing?SHIP.turn||0:0)*.6;
  }
  function spawnShip(x,z,yaw){
    const cc=shipClass();SHIP.L=cc.L;SHIP.W=cc.W;
    if(!SHIP.mesh){SHIP.mesh=buildShipMesh(SHIP.L,SHIP.W);sc.add(SHIP.mesh);}
    SHIP.x=x;SHIP.z=z;SHIP.yaw=yaw||0;SHIP.speed=0;SHIP.sailing=false;
    SHIP.name=(worldState.ship&&worldState.ship.name)||SHIP_NAMES[Math.floor(Math.random()*SHIP_NAMES.length)];
    Object.assign(worldState.ship||(worldState.ship={}),{x,z,yaw:SHIP.yaw,name:SHIP.name});shipUpdatePlacement();
  }
  function restoreShip(){if(worldState.ship&&!worldState.ship.sunk&&!SHIP.mesh)spawnShip(worldState.ship.x,worldState.ship.z,worldState.ship.yaw);}
  // buy at a shipwright: the ship appears off the seaward end of the quay
  // S473 — a ship moored at a quay lies with her bow to the sea: her forward is (−sin yaw, −cos yaw), so the yaw that points
  // her along the shore direction sd is atan2(−sd.dx, −sd.dz). Buying and the Compact's grant used atan2(sd.dx, sd.dz), the
  // bow at the quay (the critic, 4 Oct: the first W cost Hull −22); fetching and raising faced the land on a north or south shore.
  function seawardYaw(sd){return Math.atan2(-sd.dx,-sd.dz);}
  function buyShip(site){
    if(worldState.ship)return 'You have a ship already. She\u2019s wherever you left her.';
    const price=shipPriceNow();
    if(gold<price)return `A hull is ${price} gold. Come back when your purse is heavier.`;
    const plat=ZONES.world.platforms.find(p=>p.site===site.id);const sd=shoreDir(site);
    if(!plat||!sd)return 'No berth here to launch from.';
    const ex=sd.dx?(sd.dx>0?plat.x1:plat.x0):(plat.x0+plat.x1)/2,ez=sd.dz?(sd.dz>0?plat.z1:plat.z0):(plat.z0+plat.z1)/2;
    const bx=ex+sd.dx*4-sd.dz*(SHIP.W/2+6),bz=ez+sd.dz*4+sd.dx*(SHIP.W/2+6);
    gold-=price;updateHUD();spawnShip(bx,bz,seawardYaw(sd));if(price<SHIP_PRICE&&typeof addLog==='function')addLog('📜',"The shipwright read Corwin's note and took a quarter off.");
    if(typeof addLog==='function')addLog('⛵',`Bought a ship at ${site.name}.`);
    return `She\u2019s the ${SHIP.name}, and she\u2019s yours — moored off the seaward end of the quay, ${compassWord(bx-site.x,bz-site.z)} of here. Walk out, press E beside her to board, E again for the wheel.`;
  }
  // S457 — the Compact's claim is *a house and a ship* (Session 99), and its line says "The ship is at the quay under your
  // name.", but it deeded the house alone. With no ship of your own, a sloop is moored where buyShip would launch one, at
  // the seat's harbour or (Fortargent is inland) the nearest of the Compact's own; the quay's box from the ground (quayLine)
  // when that harbour is not loaded.
  // S467 — a Prior who already owns a ship is given a refit instead (Michael's B on #128): she is mended and raised one class
  // free (sloop → cog → galleon; a galleon is only mended), where she lies. A sunk ship is raised free by the shipwright
  // nearest her wreck (three days, as a paid raise) a class up; one already being raised comes up a class up.
  function compactRefit(){
    const st=shipCfg();const cls=st.cls||'sloop';const next=cls==='sloop'?'cog':cls==='cog'?'galleon':null;if(next)st.cls=next;
    const nm=st.name||SHIP.name;
    if(st.sunk){if(!st.raise){const port=allPorts().filter(p=>shoreDir(p)).sort((a,b)=>Math.hypot(a.x-st.sunk.x,a.z-st.sunk.z)-Math.hypot(b.x-st.sunk.x,b.z-st.sunk.z))[0];
        if(port)st.raise={site:port.id,due:(worldState.gameTimeAbsMinutes||0)+3*1440};}
      if(typeof addLog==='function')addLog('⛵',next?`The Compact is raising the ${nm} and refitting her as a ${next}.`:`The Compact is raising the ${nm}.`);return st.raise||null;}
    st.hull=shipClass().hull;st.rig=100;if(next)applyShipClass();shipBarsUI();
    if(typeof addLog==='function')addLog('⛵',next?`The Compact mended the ${nm} and refitted her as a ${next}.`:`The Compact mended the ${nm}.`);
    return {cls:st.cls||'sloop',up:!!next};
  }
  function grantShip(seat){
    if(worldState.ship)return compactRefit();
    const nk=FACTIONS.compact.nation;const ports=allPorts().filter(p=>nationKeyOf(...cellOf(p.x,p.z))===nk&&shoreDir(p)).sort((a,b)=>Math.hypot(a.x-seat.x,a.z-seat.z)-Math.hypot(b.x-seat.x,b.z-seat.z));
    const port=(seat.kind==='port'&&shoreDir(seat))?seat:ports[0];if(!port)return null;const sd=shoreDir(port);
    let plat=ZONES.world.platforms.find(p=>p.site===port.id&&!p.river&&!p.shallow);
    if(!plat){const L=quayLine(port,sd,1.1),hw=Math.abs(sd.dx)?L.len/2:4,hd=Math.abs(sd.dz)?L.len/2:4;plat={x0:L.mx-hw,x1:L.mx+hw,z0:L.mz-hd,z1:L.mz+hd};}
    const ex=sd.dx?(sd.dx>0?plat.x1:plat.x0):(plat.x0+plat.x1)/2,ez=sd.dz?(sd.dz>0?plat.z1:plat.z0):(plat.z0+plat.z1)/2;
    const bx=ex+sd.dx*4-sd.dz*(SHIP.W/2+6),bz=ez+sd.dz*4+sd.dx*(SHIP.W/2+6);
    spawnShip(bx,bz,seawardYaw(sd));if(typeof addLog==='function')addLog('⛵',`The Compact deeded you a ship at ${port.name}.`);
    return port;
  }
  // E near the wheel takes / leaves the helm
  function onDeck(){const p=SHIP.plat;return !!p&&px>p.x0&&px<p.x1&&pz>p.z0&&pz<p.z1&&(!p.inside||p.inside(px,pz))&&Math.abs(jumpY-DECK_Y)<1;}
  function hullDist(){const p=SHIP.plat;if(!p)return 1e9;const dx=Math.max(p.x0-px,0,px-p.x1),dz=Math.max(p.z0-pz,0,pz-p.z1);return Math.hypot(dx,dz);}
  function nearShip(){return !!SHIP.mesh&&!onDeck()&&hullDist()<3.5&&jumpY<4;}
  function nearWheel(){return onDeck()&&Math.hypot(px-SHIP.wheel.x,pz-SHIP.wheel.z)<2.4;}
  function shipInteract(){
    if(roofInteract())return true;
    if(coachInteract())return true;
    if(shrineInteract())return true;
    if(catchFish())return true;
    if(otherInteract())return true;
    if(!SHIP.mesh)return false;
    if(!SHIP.sailing&&cabinPrompt()){goToInterior(CABIN.house);return true;}
    if(SHIP.sailing){SHIP.sailing=false;SHIP.speed=0;Object.assign(worldState.ship,{x:SHIP.x,z:SHIP.z,yaw:SHIP.yaw,name:SHIP.name});showMsg('You let go of the wheel.','#c8b880');return true;}
    if(nearWheel()){px=SHIP.helm.x;pz=SHIP.helm.z;jumpY=DECK_Y;yaw=SHIP.yaw;SHIP.sailing=true;showMsg(`You take the wheel of the ${SHIP.name}. W/S sail, A/D turn, E to let go.`,'#c8b880');return true;}
    if(nearShip()){px=SHIP.x-Math.sin(SHIP.yaw)*-1.5;pz=SHIP.z-Math.cos(SHIP.yaw)*-1.5;jumpY=DECK_Y;onGround=true;velY=0;showMsg('You climb aboard. E again for the wheel.','#c8b880');return true;}
    return false;
  }
  function nearNpcName(){let best=null,bd=3.2;for(const n of npcs){if(n._retreated||!n.g.visible)continue;const d=Math.hypot(n.g.position.x-px,n.g.position.z-pz);if(d<bd){bd=d;best=n;}}return best?`${best.def.name}${best.def.role&&best.def.role!=='Villager'?' — '+best.def.role:''}`:null;}
  function roofPrompt(){for(const S of SETTLE.values()){if(!S.roof)continue;if(Math.abs(jumpY-S.roof.y)<1.2&&Math.hypot(px-S.roof.hatch.x,pz-S.roof.hatch.z)<1.4)return "Press 'E' to climb back down";}return null;}
  function roofInteract(){for(const S of SETTLE.values()){if(!S.roof)continue;if(Math.abs(jumpY-S.roof.y)<1.2&&Math.hypot(px-S.roof.hatch.x,pz-S.roof.hatch.z)<1.4){const hs=ZONES.world.houses.find(x=>x.type==='tower'&&x.siteId===S.site.id);if(!hs)return false;window._pendingPos={x:4.5,z:4.5-2.2+1.0,yaw:0,jumpY:30};goToInterior(hs);return true;}}return false;}
  function shipPrompt(){const rp=roofPrompt();if(rp)return rp;const cop=coachPrompt();if(cop)return cop;const sp=shrinePrompt();if(sp)return sp;const fp=fishPrompt();if(fp)return fp;const op=otherPrompt();if(op)return op;if(!SHIP.mesh)return null;if(SHIP.sailing)return "Press 'E' to let go of the wheel";const cp=cabinPrompt();if(cp)return cp;if(nearWheel())return `Press 'E' to pilot the ${SHIP.name}`;if(nearShip())return `Press 'E' to board the ${SHIP.name}`;return null;}
  // ── sea sounds (use the engine's AX / sfxGain) ──
  const SND={wind:null,windG:null,creakT:0,splashT:0,wasSwim:false};
  function ensureWind(){if(SND.wind||typeof AX==='undefined'||!AX)return;const buf=AX.createBuffer(1,AX.sampleRate*2,AX.sampleRate);const d=buf.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){l=l*.97+(Math.random()*2-1)*.03;d[i]=l*4;}const src=AX.createBufferSource();src.buffer=buf;src.loop=true;const f=AX.createBiquadFilter();f.type='lowpass';f.frequency.value=380;const g=AX.createGain();g.gain.value=0;src.connect(f);f.connect(g);g.connect(sfxGain);src.start();SND.wind=src;SND.windG=g;}
  function creak(){if(typeof sfxNoise==='function'){sfxNoise(.35,0,0,.09,220);sfxTone(90,60,.3,.05,'triangle');}}
  function splash(big){if(typeof sfxNoise==='function'){sfxNoise(big?.5:.25,0,0,big?.22:.09,big?1400:2600);}}
  function tickSeaSounds(dt){
    const swim=isSwimming();if(swim&&!SND.wasSwim)splash(true);SND.wasSwim=swim;
    if(swim){SND.splashT-=dt;if(SND.splashT<=0){SND.splashT=.9+Math.random()*.9;if(HELD_KEYS.KeyW||HELD_KEYS.KeyA||HELD_KEYS.KeyS||HELD_KEYS.KeyD)splash(false);}}
    if(!SHIP.mesh)return;
    ensureWind();
    if(SND.windG){const target=SHIP.sailing?Math.min(.35,Math.abs(SHIP.speed)/7.5*.35):0;SND.windG.gain.value+=(target-SND.windG.gain.value)*Math.min(1,dt*2);}
    if(SHIP.sailing&&Math.abs(SHIP.speed)>1){SND.splashT-=dt;if(SND.splashT<=0){SND.splashT=1.2+Math.random()*1.6;splash(false);}}
    if(SHIP.sailing&&SHIP.turn){SND.creakT-=dt;if(SND.creakT<=0){SND.creakT=.9+Math.random()*1.2;creak();}}else SND.creakT=0;
  }
  function tickShip(dt){
    tickSeaSounds(dt);
    SHIP._raiseT=(SHIP._raiseT||0)-dt;if(SHIP._raiseT<=0){SHIP._raiseT=1;tickShipRaise();}
    if(!SHIP.mesh)return;
    if(worldState.ship&&(SHIP.sailing||onDeck())){SHIP._seaT=(SHIP._seaT||0)-dt;if(SHIP._seaT<=0){SHIP._seaT=1;SHIP.sea=seaState();}}else SHIP._seaT=0;
    if(SHIP.sailing){
      const fwd=(HELD_KEYS.KeyW?1:0)-(HELD_KEYS.KeyS?.5:0),turn=(HELD_KEYS.KeyA?1:0)-(HELD_KEYS.KeyD?1:0);SHIP.turn=turn;
      const target=fwd*shipSpeedNow();SHIP.speed+=(target-SHIP.speed)*Math.min(1,dt*.8);
      SHIP.yaw+=turn*dt*.55*Math.min(1,Math.abs(SHIP.speed)/3+.3);
      const fx=-Math.sin(SHIP.yaw),fz=-Math.cos(SHIP.yaw);
      // keep the bow in water
      const probe=Math.sign(SHIP.speed)||1;const bx=SHIP.x+fx*probe*(SHIP.L/2+2),bz=SHIP.z+fz*probe*(SHIP.L/2+2);
      const WMAX=SIZE*GRID;
      if(worldH(bx,bz)>SEA_Y-1.4||bx<20||bz<20||bx>WMAX-20||bz>WMAX-20){const v=Math.abs(SHIP.speed);const w=v>2&&shipBars().hull>0?shipWear((v-2)*4,0):null;if(w&&w.hull)showMsg(`Aground — she strikes the shallows. Hull −${w.hull}.`,'#ff8060');else if(v>.5)showMsg('Aground — shallows ahead.','#c8b880');SHIP.speed=0;}
      SHIP.x+=fx*SHIP.speed*dt;SHIP.z+=fz*SHIP.speed*dt;
      tickSeaWear(dt,fwd);
      // the player stands at the wheel
      px=SHIP.helm.x;pz=SHIP.helm.z;jumpY=DECK_Y;onGround=true;velY=0;
      Object.assign(worldState.ship,{x:SHIP.x,z:SHIP.z,yaw:SHIP.yaw,name:SHIP.name});
    }
    shipUpdatePlacement();
  }
  // Swimming: the water surface is the ground wherever the bed is deep.
  const SWIM_Y=SEA_Y-.35;
  function groundY(x,z){const h=worldH(x,z);if(h<SWIM_Y&&typeof fxOn==='function'&&fxOn('waterwalk'))return SEA_Y+.06;return h<SWIM_Y?SWIM_Y:h;}
  function isSwimming(){if(typeof fxOn==='function'&&fxOn('waterwalk'))return false;return activeZoneId==='world'&&!SHIP.sailing&&worldH(px,pz)<SWIM_Y-.05&&jumpY<SWIM_Y+.3&&!onAnyPlatform();}
  function onAnyPlatform(){for(const p of ZONES.world.platforms){if(px>p.x0&&px<p.x1&&pz>p.z0&&pz<p.z1&&(!p.inside||p.inside(px,pz))&&Math.abs(jumpY-p.y)<1.2)return true;}return false;}

  // ═══ UNDER THE WATER (Session D) ═════════════════════════════════════
  // Diving: while swimming, look down and hold W to dive, look up (or Space)
  // to rise; let go and you drift up slowly. Breath lasts ~40 s underwater,
  // then you take damage. The camera below the surface gets blue fog.
  const DIVE={depth:null,breath:1,under:false,ui:null,hurtT:0};
  const BREATH_S=40;
  function diveTick(dt,surfaceY){
    // called from the engine's terrain follow with the ground/surface y; returns the y to hold, or null
    const bed=worldH(px,pz);
    // standing on something above the water (quay, deck, another ship): not swimming
    if(surfaceY>SWIM_Y+.2){DIVE.depth=null;DIVE.under=false;DIVE.breath=Math.min(1,DIVE.breath+dt/6);breathUI();return null;}
    if(!(bed<SWIM_Y-.3)||SHIP.sailing){DIVE.depth=null;if(DIVE.under){DIVE.under=false;}DIVE.breath=Math.min(1,DIVE.breath+dt/6);breathUI();return null;}
    if(DIVE.depth==null)DIVE.depth=SWIM_Y;
    const fwd=HELD_KEYS.KeyW,down=pitch<-.35,up=pitch>.35||HELD_KEYS.Space;
    let vy=0;
    if(fwd&&down)vy=-2.2;else if((fwd&&up)||HELD_KEYS.Space)vy=2.4;else if(!fwd)vy=.6; // buoyancy
    DIVE.depth=Math.max(bed+.55,Math.min(SWIM_Y,DIVE.depth+vy*dt));
    const under=DIVE.depth<SWIM_Y-.15;
    if(under!==DIVE.under){DIVE.under=under;if(under)splash(false);}
    if(under){if(!(typeof fxOn==='function'&&fxOn('waterbreath')))DIVE.breath=Math.max(0,DIVE.breath-dt/BREATH_S);if(DIVE.breath<=0){DIVE.hurtT-=dt;if(DIVE.hurtT<=0){DIVE.hurtT=1;PHP=Math.max(0,PHP-6);updateHUD();if(PHP<=0&&typeof playerDead==='function')playerDead();}}}
    else DIVE.breath=Math.min(1,DIVE.breath+dt/4);
    breathUI();return DIVE.depth;
  }
  function breathUI(){
    if(typeof document==='undefined'||!document.body)return;
    let el=DIVE.ui;if(!el){el=document.createElement('div');if(!el.style)return;el.id='breath';el.style.cssText='position:fixed;left:50%;bottom:120px;transform:translateX(-50%);width:220px;height:10px;background:rgba(10,20,40,.7);border:1px solid #8ab;border-radius:5px;display:none;z-index:50';el.innerHTML='<div id="breath-fill" style="height:100%;width:100%;background:#7ac8ff;border-radius:4px"></div>';document.body.appendChild(el);DIVE.ui=el;}
    const show=DIVE.under||DIVE.breath<1;el.style.display=show?'block':'none';const f=el.firstChild;f.style.width=(DIVE.breath*100)+'%';f.style.background=DIVE.breath<.25?'#ff6060':'#7ac8ff';
  }
  function cameraUnderwater(){return activeZoneId==='world'&&(jumpY+.92)<SEA_Y+.05&&worldH(px,pz)<SWIM_Y;}

  // ── sea-floor herbs ──
  function ensureSeaHerbs(){
    if(typeof HERB_DEF==='undefined'||HERB_DEF.kelp)return;
    const base=HERB_DEF.firemoss||Object.values(HERB_DEF)[0];if(!base)return;
    const mk=(k,name,col,stem,shape,desc,known,item)=>{HERB_DEF[k]=Object.assign({},base,{name,ico:'🌿',zone:'sea',col,glowCol:col,glowInt:.35,glowRad:1.6,stemCol:stem,shape,respawn:240,desc,knownDesc:known,item:Object.assign({},base.item||{},item)});};
    mk('kelp','Kelp',0x2a6a4a,0x1e4a34,'clump','Long green fronds that lean with the current.','Restores 20 stamina',{name:'Kelp',type:'herb',effect:{stam:20},weight:.3,sellMult:.3,buyPrice:6});
    mk('sealily','Sea Lily',0xd8d0f0,0x6a6a8a,'single','A pale flower that opens on the sea bed.','Restores 15 mana',{name:'Sea Lily',type:'herb',effect:{mana:15},weight:.2,sellMult:.5,buyPrice:14});
    mk('pearlweed','Pearlweed',0xc0e0e8,0x4a6a6a,'clump','Beaded weed that shines faintly in the dark.','Restores 25 HP',{name:'Pearlweed',type:'herb',effect:{heal:25},weight:.2,sellMult:.6,buyPrice:18});
  }
  function spawnSeaHerbs(ch){
    if(typeof mkHerbMesh!=='function')return;ensureSeaHerbs();if(!HERB_DEF.kelp)return;
    const n=Math.floor(hash01(ch.cx,ch.cz,140)*3.2);
    for(let i=0;i<n;i++){
      const hx=ch.cx*CHUNK+4+hash01(ch.cx+i,ch.cz,141)*(CHUNK-8),hz=ch.cz*CHUNK+4+hash01(ch.cz,ch.cx+i,142)*(CHUNK-8);
      const bed=worldH(hx,hz);if(bed>-1.2||bed<-9)continue; // shallows and reefs, not the abyss
      const type=['kelp','kelp','sealily','pearlweed'][Math.floor(hash01(ch.cx,ch.cz,143+i)*4)];const def=HERB_DEF[type];
      const {g,gl}=mkHerbMesh(hx,hz,def,sc);if(gl&&gl.parent)gl.parent.remove(gl);g.position.y=bed;
      const h={id:ch.cx+','+ch.cz+':seabed:'+i,x:hx,z:hz,type,def,g,gl,harvested:false,respawnT:0,ph:Math.random()*Math.PI*2,bed:true}; // S514 — its id
      ZONES.world.herbs.push(h);ch.herbs.push(h);
    }
  }
  // ── wrecks: a broken hull on the bed with a chest ──
  // S259 — a wreck on the sea floor: a hull broken in two, each half an open run of bent ribs on a keel with its planking
  // rotted through in places, half sunk in the sand and heeled over, a stem post, the snapped mast across it and loose
  // planks; weed darkening the wood towards the sand. y 0 at the sea floor, the hull along z, about the old 4 by 12.
  function wreckGeo(rr){const P=[];const add=(geo,col,x,y,z,rx,ry,rz,j)=>P.push({geo,color:new THREE.Color(col),x,y,z,rx,ry,rz,jitter:j==null?.08:j});
    const wood=0x3a2a18,weed=0x2a3a24,L=11,DEP=1.7,wOf=t=>2.05*Math.pow(Math.max(0,Math.sin(Math.PI*Math.min(1,Math.max(0,t)))),.55)+.05;
    const tone=y=>new THREE.Color(wood).lerp(new THREE.Color(weed),Math.max(0,Math.min(1,.7-y*.35))).multiplyScalar(.85+rr()*.3).getHex();
    const _m=new THREE.Matrix4(),_up=new THREE.Vector3(0,1,0);
    const board=(a,b,wd,th,col,M)=>{const d=new THREE.Vector3().subVectors(b,a),len=d.length();if(len<.05)return;const g=new THREE.BoxGeometry(wd,th,len);
      _m.lookAt(new THREE.Vector3(),d,_up);g.applyMatrix4(new THREE.Matrix4().extractRotation(_m));g.translate((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);if(M)g.applyMatrix4(M);add(g,col,0,0,0,0,0,0,.08);};
    const half=(t0,t1,M,brokenSide,rot)=>{const n=Math.max(3,Math.round((t1-t0)*L/.95));
      const at=(t,th)=>{const w=wOf(t);return new THREE.Vector3(Math.cos(th)*w,DEP-Math.sin(th)*DEP,(t-.5)*L);};
      for(let i=0;i<=n;i++){const t=t0+(t1-t0)*i/n,w=wOf(t);if(w<.2)continue;const full=rr()<.78,g=SK.torus(w,.08,4,10,full?Math.PI:Math.PI*(.45+rr()*.3));g.rotateZ(Math.PI+(full||rr()<.5?0:Math.PI*.5));g.scale(1,DEP/w,1);g.translate(0,DEP,(t-.5)*L);g.applyMatrix4(M);add(g,tone(.3),0,0,0,0,0,0,.1);}
      board(new THREE.Vector3(0,-.12,(t0-.5)*L),new THREE.Vector3(0,-.12,(t1-.5)*L),.26,.3,0x2a2014,M);
      const K=7;for(let k=0;k<K;k++)for(const s of [1,-1]){const th=(k+.5)/K*Math.PI/2,c=Math.cos(th),hi=1-Math.sin(th);if(s===brokenSide&&hi>.45)continue;
        for(let i=0;i<n;i++){if(rr()<rot+hi*.2)continue;const a=at(t0+(t1-t0)*i/n,th),b=at(t0+(t1-t0)*(i+1)/n,th);a.x*=s;b.x*=s;board(a,b,.36,.06,tone(a.y),M);}}};
    const Mh=(x,y,z,rx,rz)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,rz)),new THREE.Vector3(1,1,1));
    const Ms=Mh(0,-.2,-.4,.04,.32),Mb=Mh(.35,-.15,1.1,.14,-.42);
    half(.02,.54,Ms,1,.08);half(.6,.98,Mb,-1,.15);
    {const g=SK.torus(1.1,.12,4,8,Math.PI*.5);g.rotateY(Math.PI/2);g.translate(0,DEP-1.1+.2,(.99-.5)*L-1.1);g.applyMatrix4(Mb);add(g,0x2a2014,0,0,0,0,0,0,.08);}
    add(SK.cyl(.13,.17,7.2,7),0x2e2214,.4,1.0,.6,1.25,0,.28,.08);add(SK.cyl(.1,.13,1.4,6),0x2e2214,-.9,.25,-3.2,.2,.5,1.4,.08);
    for(let k=0;k<5;k++){const a=rr()*Math.PI*2,d=2.4+rr()*1.2;add(new THREE.BoxGeometry(.32,.06,1.2+rr()*1.4),tone(.1),Math.cos(a)*d,.04,Math.sin(a)*d*1.3,rr()*.2,rr()*3,rr()*.2,.1);}
    return mergeParts(P);}
  function spawnWreck(ch){
    if(hash01(ch.cx,ch.cz,150)>.06)return; // ~1 in 16 candidate chunks
    let x=null,z=null;for(let k=0;k<9&&x===null;k++){const tx=ch.cx*CHUNK+8+hash01(ch.cx+k,ch.cz,151)*(CHUNK-16),tz=ch.cz*CHUNK+8+hash01(ch.cz,ch.cx+k,152)*(CHUNK-16);const b=worldH(tx,tz);if(b<-2.5&&b>-8){x=tx;z=tz;}}
    if(x===null)return;const y=worldH(x,z),ry=hash01(ch.cx,ch.cz,153)*Math.PI*2;
    const c=k=>new THREE.Color(k);
    const m=new THREE.Mesh(wreckGeo(pRng(pHash('wreck|'+ch.cx+'|'+ch.cz))),VC_MAT);m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;ch.group.add(m); // S259 — a broken hull on the kit
    // S259 — the sea chest on the kit (S198's chest, the old box's size), its lid on the hinge
    const chest=new THREE.Group();chest.position.set(x+Math.cos(ry)*2.2,worldH(x+Math.cos(ry)*2.2,z+Math.sin(ry)*2.2),z+Math.sin(ry)*2.2);chest.rotation.set(.08,ry+2.2,-.06);const {lid}=buildChestShell(chest,1.8,0x5a3a1c);ch.group.add(chest);
    let items=(typeof rollContainerLoot==='function'?rollContainerLoot('chest',1.4,null,1,'wreck:'+chunkKey(ch.cx,ch.cz)+':'+lootDay()):[])||[];
    if(!items.length)items.push({name:'Sea-worn Coins',ico:'🪙',type:'misc',weight:.4,sellMult:1,buyPrice:60});
    items.forEach(it=>{if(it.qty==null)it.qty=1;});
    const cobj={id:'wreck:'+chunkKey(ch.cx,ch.cz),x:chest.position.x,z:chest.position.z,y:chest.position.y+.3,name:'Sea Chest',displayName:'Sea Chest',items,zone:'world',kind:'chest',g:chest,lid,opened:false,_chunk:chunkKey(ch.cx,ch.cz)};
    if(typeof ZONE_CORPSES!=='undefined')ZONE_CORPSES.push(cobj);ch.loot=ch.loot||[];ch.loot.push(cobj);
    ch.sol.push({cx:x,cz:z,rx:2.2,rz:3.6});
  }

  // ═══ THE LIVING SEA (Session D part 2) ═══════════════════════════════
  // Cabin: a door entry that follows the ship; interior type 'cabin'.
  const CABIN={house:{id:'g_ship_cabin',type:'cabin',name:'',keeper:'',doorX:0,doorZ:0,doorFace:'S',exitX:0,exitZ:0,exitYaw:0,w:6,d:7,two:false,reg:'irish',style:'irish',dlg:null,tagline:''}};
  function cabinUpdate(){
    if(!SHIP.mesh)return;const h=CABIN.house;h.name=`The ${SHIP.name} — cabin`;
    const fwd=[-Math.sin(SHIP.yaw),-Math.cos(SHIP.yaw)];
    h.doorX=SHIP.x+fwd[0]*(SHIP.L/2-3.2);h.doorZ=SHIP.z+fwd[1]*(SHIP.L/2-3.2); // forward hatch, clear of the wheel
    h.exitX=SHIP.x+fwd[0]*(SHIP.L/2-4.4);h.exitZ=SHIP.z+fwd[1]*(SHIP.L/2-4.4);h.exitYaw=SHIP.yaw+Math.PI;
    if(!ZONES.world.houses.includes(h))ZONES.world.houses.push(h);
  }
  function cabinPrompt(){if(!SHIP.mesh||SHIP.sailing)return null;const h=CABIN.house;return (Math.hypot(px-h.doorX,pz-h.doorZ)<1.1&&Math.abs(jumpY-DECK_Y)<1)?"Press 'E' to go below":null;}

  // ── whitecaps: foam by crest height + streak noise (used by the water material) ──
  function waterShader(sh){
    sh.uniforms.uTime={value:0};
    sh.vertexShader='uniform float uTime;\nvarying float vFoam;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vec4 wpw=modelMatrix*vec4(position,1.0);\n float w1=sin(wpw.x*0.11+uTime*1.1), w2=sin(wpw.z*0.08-uTime*0.8), w3=sin((wpw.x+wpw.z)*0.05+uTime*0.5), w4=sin(wpw.x*0.31-wpw.z*0.23+uTime*1.9);\n float hgt=w1*0.13+w2*0.11+w3*0.08+w4*0.04;\n transformed.z+=hgt;\n float streak=sin(wpw.x*0.9+wpw.z*0.4+uTime*0.6)*sin(wpw.z*0.7-uTime*0.35);\n vFoam=smoothstep(0.16,0.30,hgt+streak*0.05)*0.85;');
    sh.fragmentShader='varying float vFoam;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.92,0.96,1.0),vFoam);\n diffuseColor.a=mix(diffuseColor.a,1.0,vFoam*0.6);');
  }

  // ── wildlife ──
  const LIFE={fish:[],gulls:[],dolphins:[],sharksT:0};
  function spawnFishSchool(ch){
    // find shallow water somewhere in the chunk (the shore band is narrower than a chunk)
    let cxw=null,czw=null,bed=0;for(let k=0;k<9&&cxw===null;k++){const x=ch.cx*CHUNK+8+hash01(ch.cx+k,ch.cz,167)*(CHUNK-16),z=ch.cz*CHUNK+8+hash01(ch.cz,ch.cx+k,168)*(CHUNK-16);const b=worldH(x,z);if(b<-1.2&&b>-7){cxw=x;czw=z;bed=b;}}
    if(cxw===null||hash01(ch.cx,ch.cz,160)>.45)return;
    const n=10+Math.floor(hash01(ch.cx,ch.cz,161)*8);
    const geo=new THREE.ConeGeometry(.08,.42,4);geo.rotateX(Math.PI/2);
    const im=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({color:0x9ab8c0}),n);
    const school={im,cx:cxw,cz:czw,y:bed+1.2+hash01(ch.cx,ch.cz,164)*1.5,r:3+hash01(ch.cx,ch.cz,165)*3,ph:hash01(ch.cx,ch.cz,166)*Math.PI*2,n,chunk:chunkKey(ch.cx,ch.cz)};
    ch.group.add(im);LIFE.fish.push(school);ch.fish=school;
  }
  const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s1=new THREE.Vector3(1,1,1);
  function tickFish(dt,now){
    for(const s of LIFE.fish){const t=now*.0006+s.ph;for(let i=0;i<s.n;i++){const a=t+i*(Math.PI*2/s.n)*1.3,r=s.r*(.7+.3*Math.sin(i*1.7+t*2));_v.set(s.cx+Math.cos(a)*r,s.y+Math.sin(t*3+i)*.25,s.cz+Math.sin(a)*r);_e.set(0,-a+Math.PI/2,0);_q.setFromEuler(_e);_m4.compose(_v,_q,_s1);s.im.setMatrixAt(i,_m4);}s.im.instanceMatrix.needsUpdate=true;}
  }
  function spawnGulls(S,site){
    const q=site.quayStart||{x:site.x,z:site.z};const n=4;const g=new THREE.Group();
    for(let i=0;i<n;i++){const b=mergeParts([{geo:new THREE.ConeGeometry(.08,.5,4),color:new THREE.Color(0xf0f0f0),rx:Math.PI/2},{geo:new THREE.BoxGeometry(1.1,.02,.18),color:new THREE.Color(0xf0f0f0),y:.02}]);const m=new THREE.Mesh(b,VC_MAT);g.add(m);}
    g.position.set(q.x,0,q.z);S.group.add(g);S.gulls={g,ph:Math.random()*10};LIFE.gulls.push(S.gulls);
  }
  function tickGulls(dt,now){
    for(let i=LIFE.gulls.length-1;i>=0;i--){const gl=LIFE.gulls[i];if(!gl.g.parent){LIFE.gulls.splice(i,1);continue;}
      gl.g.children.forEach((m,k)=>{const t=now*.0004+gl.ph+k*1.6;const r=8+k*3;m.position.set(Math.cos(t)*r,11+Math.sin(t*2.3+k)*1.5,Math.sin(t)*r);m.rotation.y=-t+Math.PI;m.rotation.z=Math.sin(t*3)*.2;});}
  }
  function tickDolphins(dt,now){
    if(!SHIP.mesh||!SHIP.sailing||Math.abs(SHIP.speed)<3){LIFE.dolphins.forEach(d=>{d.m.visible=false;});return;}
    if(!LIFE.dolphins.length){for(let k=0;k<2;k++){const m=new THREE.Mesh(mergeParts([{geo:new THREE.CylinderGeometry(.16,.06,1.5,6),color:new THREE.Color(0x6a7a8a),rx:Math.PI/2,jitter:.05},{geo:new THREE.ConeGeometry(.12,.35,3),color:new THREE.Color(0x5a6a7a),y:.18,z:.1,rx:-.6}]),VC_MAT);sc.add(m);LIFE.dolphins.push({m,ph:k*2.1,side:k?1:-1});}}
    const fwd=[-Math.sin(SHIP.yaw),-Math.cos(SHIP.yaw)];
    LIFE.dolphins.forEach(d=>{const t=now*.0015+d.ph;const along=3+Math.sin(t*.7)*2,out=SHIP.W/2+2.5;const x=SHIP.x+fwd[0]*along+(-fwd[1])*d.side*out,z=SHIP.z+fwd[1]*along+fwd[0]*d.side*out;const leap=Math.max(-.6,Math.sin(t*2)*1.4);d.m.visible=true;d.m.position.set(x,SEA_Y+leap,z);d.m.rotation.y=SHIP.yaw+Math.PI;d.m.rotation.x=-Math.cos(t*2)*.8;});
  }
  // sharks: sea encounters; kept to the water; only interested in swimmers
  // ═══ ENEMY BEHAVIOUR (Session W) ═════════════════════════════════════
  // Layered over the engine's chase-and-hit: archers kite and shoot, cowards
  // run to fetch friends, packs circle to the flanks, bosses have a second
  // phase with a telegraphed heavy. World zone only. The engine has no
  // 'locked' — kiters and cowards are taken out of its alert state and driven here.
  const RANGED=new Set(['Bandit Archer','Goblin Slinger','Cultist']);const COWARD=new Set(['Kobold','Goblin']);const PACK=new Set(['Wolf','Dire Wolf','Snow Wolf','Ash Hound']);
  function _setPos(e,x,z){e.x=x;e.z=z;if(e.mesh){e.mesh.position.x=x;e.mesh.position.z=z;}}
  let _bhT=0;
  function tickBehaviours(dt){
    if(dt==null){const t=performance.now();dt=Math.min(.1,(t-_bhT)/1000||.016);_bhT=t;}
    const inWorld=activeZoneId==='world';const now=performance.now();const E=inWorld?ZONES.world.enemies:(typeof ENEMIES!=='undefined'?ENEMIES:[]);
    const SC=inWorld?sc:(typeof scene!=='undefined'?scene:sc);const groundAt=(x,z)=>inWorld?worldH(x,z):(typeof activeTerrainH==='function'?activeTerrainH(x,z):0);const blocked=(x,z)=>inWorld?(solidAt(x,z)||worldH(x,z)<=0):(typeof dSolid==='function'?dSolid(x,z):false);
    const packs=[];for(const e of E){if(e.dead||!e.alert)continue;if(PACK.has(e.name))packs.push(e);}
    if(!inWorld)tickArrows(dt);
    for(const e of E){if(e.dead)continue;const d=Math.hypot(e.x-px,e.z-pz);
      if(RANGED.has(e.name)&&(e.alert||e._agg)){if(e.alert){e._agg=true;e.alert=false;}if(d>40){e._agg=false;continue;}const spd=(e.spd||1.2)*2.2;let mx=0,mz=0;const ux=(px-e.x)/(d||1),uz=(pz-e.z)/(d||1);
        if(d<8){mx=-ux;mz=-uz;}else if(d>14){mx=ux;mz=uz;}else{mx=-uz*.6;mz=ux*.6;}
        const nx=e.x+mx*spd*dt,nz=e.z+mz*spd*dt;if(!blocked(nx,nz))_setPos(e,nx,nz);if(e.mesh)e.mesh.rotation.y=Math.atan2(px-e.x,pz-e.z);
        e._shotT=(e._shotT||0)-dt;if(d<26&&e._shotT<=0){e._shotT=2.4+Math.random()*.8;const m=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.9),new THREE.MeshLambertMaterial({color:0x3a2a18}));m.position.set(e.x,groundAt(e.x,e.z)+1.2,e.z);SC.add(m);ARROWS.push({m,scene:SC,sx:e.x,sz:e.z,sy:groundAt(e.x,e.z)+1.2,tx:px+(Math.random()-.5)*1.6,tz:pz+(Math.random()-.5)*1.6,ty:jumpY+.6,t:0,dur:Math.max(.35,d/40),k:.4});if(typeof sfxNoise==='function')sfxNoise(.12,0,0,.06,1600);}
        continue;}
      if(COWARD.has(e.name)&&(e.alert||e._flee)&&!e._fetched&&e.hp<e.maxHp*.4){let f=null,fd=1e9;for(const o of E){if(o===e||o.dead||o.alert)continue;const dd=Math.hypot(o.x-e.x,o.z-e.z);if(dd<70&&dd<fd){fd=dd;f=o;}}
        if(f){if(e.alert){e._flee=true;e.alert=false;}const ux=(f.x-e.x)/(fd||1),uz=(f.z-e.z)/(fd||1);const nx=e.x+ux*(e.spd||1.4)*3*dt,nz=e.z+uz*(e.spd||1.4)*3*dt;if(!blocked(nx,nz))_setPos(e,nx,nz);if(!e._cried){e._cried=true;showMsg(`The ${e.name.toLowerCase()} runs for help.`,'#c8b880');}
          if(fd<4){for(const o of E){if(!o.dead&&Math.hypot(o.x-e.x,o.z-e.z)<12)o.alert=true;}e._fetched=true;e._flee=false;e.alert=true;}continue;}}
      if(PACK.has(e.name)&&e.alert&&packs.length>=2&&d>2.4&&d<14){const i=packs.indexOf(e);const ang=(i/packs.length)*Math.PI*2+now*.0004;const tx=px+Math.cos(ang)*3.2,tz=pz+Math.sin(ang)*3.2;const dx=tx-e.x,dz=tz-e.z;const L=Math.hypot(dx,dz)||1;const nx=e.x+dx/L*(e.spd||1.6)*1.6*dt,nz=e.z+dz/L*(e.spd||1.6)*1.6*dt;if(!blocked(nx,nz))_setPos(e,nx,nz);}
      // every strike lunges the body toward you and swings the first limb
      if(e._lunge!=null&&e.mesh){e._lunge-=dt;const k=Math.max(0,e._lunge)/.3;const s=Math.sin(k*Math.PI);const ux=(px-e.x)/(d||1),uz=(pz-e.z)/(d||1);e.mesh.position.x=e.x+ux*s*.5;e.mesh.position.z=e.z+uz*s*.5;if(e._lunge<=0){e._lunge=null;e.mesh.position.x=e.x;e.mesh.position.z=e.z;}}
      else if(e._wind>0&&e.mesh){const ux=(px-e.x)/(d||1),uz=(pz-e.z)/(d||1);e.mesh.position.x=e.x-ux*e._wind*.2;e.mesh.position.z=e.z-uz*e._wind*.2;e._pulled=true;}
      else if(e._pulled&&e.mesh){e._pulled=false;e.mesh.position.x=e.x;e.mesh.position.z=e.z;}
      if(e.mesh&&(e._wind>0||e._lunge!=null||e._posed)){try{attackPose(e,false);}catch(err){}e._posed=(e._wind>0||e._lunge!=null);}
      // a dazed beast: the charge met a wall
      if(e._stun>0){e._stun-=dt;if(e.mesh)e.mesh.rotation.z=Math.sin(e._stun*14)*.12;if(e._stun<=0&&e.mesh)e.mesh.rotation.z=0;continue;}
      // a lair's beast charges: every 7 s from 5–16u it comes at you at four times its speed; contact hits for double and throws you
      if(e.lair&&e.alert&&!e.dead){e._chT=(e._chT==null?4:e._chT)-dt;if(e._chT<=0&&d>5&&d<16&&e._charge==null){e._chT=7;e._charge=1.1;e._cAng=Math.atan2(px-e.x,pz-e.z);showMsg(`${e.name} charges!`,'#ff8060');if(typeof sfxNoise==='function')sfxNoise(.4,0,0,.25,300);}
        if(e._charge!=null){e._charge-=dt;const sp=(e.spd||1.4)*4*dt;const nx=e.x+Math.sin(e._cAng)*sp,nz=e.z+Math.cos(e._cAng)*sp;if(!blocked(nx,nz))_setPos(e,nx,nz);else{e._charge=0;e._stun=2.4;showMsg(`${e.name} slams into the ground, dazed — now!`,'#e8d8a0');}if(e.mesh)e.mesh.rotation.y=e._cAng;
          if(Math.hypot(e.x-px,e.z-pz)<2.3&&!rollUntouchable(performance.now()/1000)){const dmg=_warded(Math.round((e.dmg||10)*2*(blocking?.5:1)),e);PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;updateHUD();const kx=(px-e.x)/(d||1),kz=(pz-e.z)/(d||1);for(let k=1;k<=3;k++){if(!blocked(px+kx*k,pz+kz*k)){px+=kx;pz+=kz;}}showMsg(`${e.name} bowls you over: ${dmg}.`,'#ff6060');if(typeof sfxNoise==='function')sfxNoise(.5,0,0,.3,250);e._charge=null;if(PHP<=0&&typeof playerDead==='function')playerDead();}
          if(e._charge!=null&&e._charge<=0)e._charge=null;}}
      if((e.boss||/Captain|Troll|Ogre|Wight|Hag|Bear/.test(e.name))&&e.alert){if(!e._phase2&&e.hp<e.maxHp*.5){e._phase2=true;e.spd=(e.spd||1)*1.3;showMsg(`${e.name} roars.`,'#ff8060');if(typeof sfxNoise==='function')sfxNoise(.8,0,0,.3,200);}
        if(e._phase2){e._heavyT=(e._heavyT||3)-dt;if(e._heavyT<=0&&d<7){e._heavyT=6;e._windup=1.0;showMsg(`${e.name} winds up.`,'#ffb060');}
          if(e._windup!=null){e._windup-=dt;if(e.mesh){const k=1+Math.sin(Math.max(0,e._windup)*Math.PI)*.18;if(e._baseScale==null)e._baseScale=e.mesh.scale.x;e.mesh.scale.setScalar(e._baseScale*k);}
            if(e._windup<=0){e._windup=null;if(e.mesh)e.mesh.scale.setScalar(e._baseScale||1);if(Math.hypot(e.x-px,e.z-pz)<3.2&&!rollUntouchable(performance.now()/1000)){const dmg=_warded(Math.round((e.dmg||10)*2.2*(blocking?.35:1)));PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;updateHUD();showMsg(`${e.name}'s heavy blow: ${dmg}.`,'#ff6060');if(typeof sfxNoise==='function')sfxNoise(.5,0,0,.18,300);if(PHP<=0&&typeof playerDead==='function')playerDead();}else showMsg('You step clear.','#c8e88a');}}}}
    }
  }
  function tickSharks(){
    for(const e of ZONES.world.enemies){if(e.dead||e.name!=='Shark')continue;
      if(e.mesh&&e.mesh._sharkTail){const t=performance.now()*.001;e.mesh._sharkTail.rotation.y=Math.sin(t*(e.alert?7:3.4)+(e.homeX||0))*(e.alert?.34:.22);} // S260 — the tail sweeps, faster when it hunts
      if(worldH(e.x,e.z)>-1.6){const dx=e.x-(e.homeX||e.x),dz=e.z-(e.homeZ||e.z),L=Math.hypot(dx,dz)||1;e.x-=dx/L*1.5;e.z-=dz/L*1.5;}
      if(!isSwimming())e.alert=false;
    }
  }

  // ── other ships: pirates and merchants ──
  const OTHER=[]; // {kind,mesh,x,z,yaw,speed,plat,crew:[],chest,boarded,volleyT,dead}
  // S508 — a ship met at sea is keyed (co-op rules): her id is where and when she came up, `sea:<chunk>:<minute>:<kind>`
  // (Oswy's Kestrel is `story:oswy`), and her heading, crew, volleys and chest roll on streams of that id.
  function spawnOtherShip(kind,x,z,id){
    // S168 — the black sail and the merchantman are looks of their own, not tints; S285 — the merchantman on the cog, broad and slow (Michael's A, #50)
    const cls=kind==='pirate'?SHIP_CLASSES.sloop:SHIP_CLASSES.cog;
    const m=buildShipMesh(cls.L,cls.W,kind==='pirate'?'pirate':'merchant');
    sc.add(m);
    if(id==null)id=`sea:${chunkKey(Math.floor(x/CHUNK),Math.floor(z/CHUNK))}:${Math.floor(worldState.gameTimeAbsMinutes||0)}:${kind}`;
    const rng=seededRng('ship',id);
    const o={id,rng,kind,mesh:m,x,z,yaw:rng()*Math.PI*2,speed:0,L:cls.L,W:cls.W,plat:{x0:0,x1:0,z0:0,z1:0,y:DECK_Y},crew:[],chest:null,boarded:false,volleyT:2,dead:false,wp:null,name:kind==='pirate'?'a black-sailed ship':'a merchantman'};
    ZONES.world.platforms.push(o.plat);OTHER.push(o);placeOther(o);
    if(kind==='pirate')crewUp(o,false);
    return o;
  }
  function despawnOtherShip(o){sc.remove(o.mesh);const i=ZONES.world.platforms.indexOf(o.plat);if(i>=0)ZONES.world.platforms.splice(i,1);o.crew.forEach(e=>{if(!e.dead){if(e.mesh&&e.mesh.parent)e.mesh.parent.remove(e.mesh);const k=ZONES.world.enemies.indexOf(e);if(k>=0)ZONES.world.enemies.splice(k,1);}});if(o.chest&&typeof ZONE_CORPSES!=='undefined'){const k=ZONE_CORPSES.indexOf(o.chest);if(k>=0)ZONE_CORPSES.splice(k,1);}const j=OTHER.indexOf(o);if(j>=0)OTHER.splice(j,1);}
  function placeOther(o){
    o.mesh.position.set(o.x,SEA_Y+Math.sin(performance.now()*.0011+o.x)*.05,o.z);o.mesh.rotation.y=o.yaw+Math.PI;
    shipPlatBox(o.plat,o.mesh,o.x,o.z,o.yaw,o.L,o.W);
  }
  function atSea(){return activeZoneId==='world'&&(SHIP.sailing||isSwimming()||onDeck())&&worldH(px,pz)<-3;}
  let _seaT=0;
  const PIRATE_RAM={range:30,top:6.5,wait:30,run:12};
  function tickOtherShips(dt,now){
    _seaT-=dt;
    if(_seaT<=0){_seaT=2;
      // keep one pirate and one merchant near a player at sea; drop them when far
      for(let i=OTHER.length-1;i>=0;i--){const o=OTHER[i];if(Math.hypot(o.x-px,o.z-pz)>700)despawnOtherShip(o);}
      if(atSea()){
        const pk=chunkKey(Math.floor(px/CHUNK),Math.floor(pz/CHUNK)),mn=Math.floor(worldState.gameTimeAbsMinutes||0);
        for(const kind of ['pirate','merchant']){if(OTHER.some(o=>o.kind===kind))continue;const sr=seededRng('sea',`${pk}:${mn}:${kind}`); /* S508 — the sea's roll is keyed by where you are and the minute */ if(sr()>(kind==='pirate'?((tutWantsPirate()||factionWantsPirate())?1:.5):.6))continue;
          for(let k=0;k<12;k++){const a=sr()*Math.PI*2,d=260+sr()*200;const x=px+Math.cos(a)*d,z=pz+Math.sin(a)*d;if(worldH(x,z)<-4&&!SITES.some(t=>Math.hypot(t.x-x,t.z-z)<t.pad+80)){spawnOtherShip(kind,x,z);if(kind==='pirate')showMsg('Black sails on the horizon.','#ffb060');break;}}}
      }
    }
    for(const o of OTHER){
      if(o.boarded){placeOther(o);pirateFled(o);continue;}
      const T=targetOf(o),dP=Math.hypot(T.x-o.x,T.z-o.z); /* S542 — co-op rule: whom a black sail hunts is targetOf's */
      let tx,tz;
      if(o.kind==='pirate'&&!o.sated&&atSea()&&dP<300){ // close to ~28u, then hold off and shoot
        // S418 — her ram (Michael's B on #100): within 30 units, faster than you and with her ram ready, she steers at your
        // hull; the first touch spends it (tickHullCollisions) and she goes back to her circle; 30 s before the next, 12 s to land it
        o.ramWait=(o.ramWait||0)-dt;const aboard=!!SHIP.mesh&&(SHIP.sailing||onDeck());
        if(o.ramming){o.ramming-=dt;if(o.ramming<=0||!aboard){o.ramming=0;o.ramWait=PIRATE_RAM.wait;}}
        else if(aboard&&dP<=PIRATE_RAM.range&&o.ramWait<=0&&(SHIP.speed||0)<PIRATE_RAM.top)o.ramming=PIRATE_RAM.run;
        const dx=T.x-o.x,dz=T.z-o.z;if(o.ramming){tx=SHIP.x;tz=SHIP.z;}else if(dP>30){tx=T.x;tz=T.z;}else{tx=o.x-dz*.5;tz=o.z+dx*.5;}
        o.volleyT-=dt;if(dP<70&&o.volleyT<=0){o.volleyT=2.2+(o.rng?o.rng():Math.random());volley(o);}
      } else if(o.sated){tx=o.x+(o.x-T.x);tz=o.z+(o.z-T.z);
      } else {
        if(!o.wp||Math.hypot(o.wp.x-o.x,o.wp.z-o.z)<20){for(let k=0;k<10;k++){const a=Math.random()*Math.PI*2,d=150+Math.random()*250;const x=o.x+Math.cos(a)*d,z=o.z+Math.sin(a)*d;if(worldH(x,z)<-4){o.wp={x,z};break;}}}
        if(o.wp){tx=o.wp.x;tz=o.wp.z;}
      }
      if(tx!=null){const want=Math.atan2(-(tx-o.x),-(tz-o.z));let d=want-o.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));o.yaw+=Math.max(-.5*dt,Math.min(.5*dt,d));o.speed+=((o.kind==='pirate'?6.5:4.5)-o.speed)*Math.min(1,dt*.6);}
      const fx=-Math.sin(o.yaw),fz=-Math.cos(o.yaw);const bx=o.x+fx*(o.L/2+3),bz=o.z+fz*(o.L/2+3);
      if(worldH(bx,bz)>-1.8){o.speed=0;o.wp=null;}
      o.x+=fx*o.speed*dt;o.z+=fz*o.speed*dt;placeOther(o);
    }
    tickArrows(dt);
  }
  // volleys: arrows that fly to where you are; a hit if you're still near when they land
  // S612 (Michael's sailing playtest, 6 Oct) — a ship looses nothing herself: each arrow is a living hand of her crew standing
  // on her deck, loosed from where he stands, and a hand within 8 units of whom she hunts has his blade out instead. No
  // archer, no volley: her crew killed, sent over your rail or all at close quarters, she is silent.
  const ARCHER_CLOSE=8;
  function shipArchers(o,T){const p=o.plat;return o.crew.filter(e=>!e.dead&&e._ship===o&&e.x>p.x0-.5&&e.x<p.x1+.5&&e.z>p.z0-.5&&e.z<p.z1+.5&&Math.hypot(T.x-e.x,T.z-e.z)>=ARCHER_CLOSE);}
  const ARROWS=[];
  function volley(o){
    const R=o.rng||Math.random,T=targetOf(o);const n=2+Math.floor(R()*2);const v={hit:false};
    const bows=shipArchers(o,T);if(!bows.length)return 0;const shots=Math.min(n,bows.length);
    for(let k=0;k<shots;k++){const e=bows[k];const m=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.9),new THREE.MeshLambertMaterial({color:0x3a2a18}));const sx=e.x,sz=e.z;m.position.set(sx,DECK_Y+1.2,sz);sc.add(m);
      const tx=T.x+(R()-.5)*4,tz=T.z+(R()-.5)*4,dist=Math.hypot(tx-sx,tz-sz);ARROWS.push({m,sx,sz,sy:DECK_Y+1.2,tx,tz,ty:T.y+.6,t:0,dur:Math.max(.6,dist/45),k:.3+Math.random()*.4,v,from:e});
      if(e.mesh)e.mesh.rotation.y=Math.atan2(T.x-e.x,T.z-e.z);}
    if(typeof sfxNoise==='function')sfxNoise(.18,0,0,.08,1800);showMsg(shots>1?'Arrows!':'An arrow!','#ff8060');
    return shots;
  }
  // S411 — a volley whose first arrow comes down on your own deck costs her 2 hull and 3 rig (once a volley)
  function volleyOnDeck(x,z,y){const p=SHIP.plat;return !!(SHIP.mesh&&worldState.ship&&p&&x>p.x0&&x<p.x1&&z>p.z0&&z<p.z1&&(!p.inside||p.inside(x,z))&&Math.abs(y-.6-p.y)<1.5);}
  function tickArrows(dt){
    for(let i=ARROWS.length-1;i>=0;i--){const a=ARROWS[i];a.t+=dt;const u=Math.min(1,a.t/a.dur);const arc=Math.sin(u*Math.PI)*a.dur*4;
      const x=a.sx+(a.tx-a.sx)*u,z=a.sz+(a.tz-a.sz)*u,y=a.sy+(a.ty-a.sy)*u+arc;a.m.position.set(x,y,z);a.m.lookAt(a.tx,a.ty,a.tz);
      if(u>=1){(a.scene||sc).remove(a.m);ARROWS.splice(i,1);if(a.v&&!a.v.hit&&volleyOnDeck(a.tx,a.tz,a.ty)){a.v.hit=true;shipWear(2,3);}if(Math.hypot(px-a.tx,pz-a.tz)<1.6&&Math.abs(jumpY+.6-a.ty)<1.5&&!rollUntouchable(performance.now()/1000)){const dmg=_warded(Math.round((6+level*.8)*(blocking?.4:1)));PHP=Math.max(0,PHP-dmg);lvAct.damageTaken+=dmg;updateHUD();showMsg(`An arrow strikes you for ${dmg}.`,'#ff6060');if(typeof sfxNoise==='function')sfxNoise(.12,0,0,.14,900);if(PHP<=0&&typeof playerDead==='function')playerDead();}}}
  }
  // boarding: E beside another ship (hulls close, or swimming up to her)
  function nearOther(){let best=null,bd=1e9;for(const o of OTHER){const p=o.plat;const d=Math.hypot(Math.max(p.x0-px,0,px-p.x1),Math.max(p.z0-pz,0,pz-p.z1));if(d>0&&d<3.5&&d<bd&&jumpY<4){bd=d;best=o;}}return best;}
  function crewUp(o,alert){
    if(o.crew.length)return;
    for(let k=0;k<3;k++){const fwd=[-Math.sin(o.yaw),-Math.cos(o.yaw)];const ex=o.x+fwd[0]*(-3+k*3)+(-fwd[1])*(k%2?1:-1)*1.2,ez=o.z+fwd[1]*(-3+k*3)+fwd[0]*(k%2?1:-1)*1.2;const fid=o.id?`${o.id}:crew:${k}`:null;const e=buildZoneEnemy(sc,STATIC_SOL,ex,ez,'Pirate',typeof pickVariant==='function'?pickVariant('Pirate',level,'normal',fid?seededRng('variant',fid):undefined):null);if(fid)keyFoe(e,fid);e.alert=!!alert;e.homeX=o.x;e.homeZ=o.z;e._ship=o;ZONES.world.enemies.push(e);o.crew.push(e);}
  }
  function boardOther(o){
    o.boarded=true;o.speed=0;o._fled=false;
    px=o.x;pz=o.z;jumpY=DECK_Y;onGround=true;velY=0;
    if(o.kind==='pirate'){crewUp(o,true);o.crew.forEach(e=>{if(!e.dead)e.alert=true;});showMsg('You board her. The crew turns.','#ff8060');} else if(o.kind==='merchant'){showMsg('A merchantman. Her crew keep their heads down.','#c8b880');}
    if(!o.chest){const fwd=[-Math.sin(o.yaw),-Math.cos(o.yaw)];const cx=o.x+fwd[0]*(-o.L/2+3.2),cz=o.z+fwd[1]*(-o.L/2+3.2);const g=new THREE.Mesh(new THREE.BoxGeometry(.9,.6,.6),new THREE.MeshLambertMaterial({color:0x4a3018}));g.position.set(cx,DECK_Y+.3,cz);sc.add(g);const lid=new THREE.Mesh(new THREE.BoxGeometry(.92,.12,.62),new THREE.MeshLambertMaterial({color:0x7a5a2a}));lid.position.set(cx,DECK_Y+.65,cz);sc.add(lid);
      let items=(typeof rollContainerLoot==='function'?rollContainerLoot('chest',o.kind==='pirate'?1.8:1.2,null,1,o.id?`${o.id}:chest`:undefined):[])||[];if(!items.length)items.push({name:'Pirate Gold',ico:'🪙',type:'misc',weight:.5,sellMult:1,buyPrice:120});
      if(o.kind==='pirate'){const cr=o.id?seededRng('loot',`${o.id}:cargo`):Math.random;const ks=Object.keys(CARGO_GOODS).filter(k=>!CARGO_GOODS[k].hold);items.push({...cargoItem(ks[Math.floor(cr()*ks.length)]),qty:1+(cr()<.5?1:0)});}
      if(o.loot){items.push(...o.loot);o.loot=null;}
      items.forEach(it=>{if(it.qty==null)it.qty=1;});
      o.chest={id:o.id?`${o.id}:chest`:null,x:cx,z:cz,y:DECK_Y+.3,name:o.kind==='pirate'?"Captain's Chest":'Cargo Chest',displayName:o.kind==='pirate'?"Captain's Chest":'Cargo Chest',items,zone:'world',kind:'chest',g,top:lid,opened:false};if(typeof ZONE_CORPSES!=='undefined')ZONE_CORPSES.push(o.chest);}
  }
  // S399 (Michael's B on #91, with C's chest) — a pirate's chest above carries one or two crates of one good taken off another
  // ship. Flee a deck while her crew still holds it, and they take half the crates in your hold (rounded up), the dearest
  // first: leave her deck with any of her crew standing and your ship within 140 units (they cross behind you), or leave
  // your own deck while her boarders stand on it (pirateBoardersHold, below). What they take goes into her chest (a horse
  // they keep in her hold, not the chest) and she sails off. Falling to them is a death and a reload, so fleeing is the
  // one way a boarding is lost.
  const PIRATE_REACH=140;
  function deckOff(p){return Math.hypot(Math.max(p.x0-px,0,px-p.x1),Math.max(p.z0-pz,0,pz-p.z1));}
  function pirateTake(){const h=holdOf();
    const crates=[];for(const k of Object.keys(h).filter(k=>CARGO_GOODS[k]&&h[k]>0).sort((a,b)=>CARGO_GOODS[b].v-CARGO_GOODS[a].v))for(let i=0;i<h[k];i++)crates.push(k);
    const took=crates.slice(0,Math.ceil(crates.length/2));for(const k of took){h[k]--;if(h[k]<=0)delete h[k];}return took;}
  function pirateStow(o,took){const n={};for(const k of took)n[k]=(n[k]||0)+1;
    for(const k in n){if(CARGO_GOODS[k].hold)continue;const dest=o.chest?o.chest.items:(o.loot||(o.loot=[]));const ex=dest.find(it=>it.type==='cargo'&&it.cargo===k);if(ex)ex.qty=(ex.qty||1)+n[k];else dest.push({...cargoItem(k),qty:n[k]});}
    o.boarded=false;o.sated=true;o.wp=null;
    const list=Object.keys(n).map(k=>n[k]>1?`${n[k]} × ${CARGO_GOODS[k].n.toLowerCase()}`:`a ${CARGO_GOODS[k].n.toLowerCase()}`);
    return list.length>1?list.slice(0,-1).join(', ')+' and '+list[list.length-1]:list[0];}
  function pirateFled(o){if(o.kind!=='pirate'||o._fled||PHP<=0||!o.crew.some(e=>!e.dead))return;if(deckOff(o.plat)<1.5&&!onDeck())return;
    o._fled=true;if(!worldState.ship||!SHIP.mesh||Math.hypot(SHIP.x-o.x,SHIP.z-o.z)>PIRATE_REACH)return;const took=pirateTake();if(!took.length)return;
    showMsg(`They come over your rail behind you and take ${pirateStow(o,took)} from the hold.`,'#ff8060');}
  function otherPrompt(){const o=nearOther();return o&&!o.boarded?`Press 'E' to board ${o.name}`:null;}
  function otherInteract(){const o=nearOther();if(o&&!o.boarded){boardOther(o);return true;}return false;}
  // keep crew on their deck
  function tickCrew(){for(const o of OTHER){if(o._lx!=null&&!o.boarded){const dx=o.x-o._lx,dz=o.z-o._lz;for(const e of o.crew){if(!e.dead){e.x+=dx;e.z+=dz;e.homeX=o.x;e.homeZ=o.z;}}}o._lx=o.x;o._lz=o.z;}for(const o of OTHER)for(const e of o.crew){if(e.dead)continue;const p=o.plat;if(e.x<p.x0+.5||e.x>p.x1-.5||e.z<p.z0+.5||e.z>p.z1-.5){e.x=Math.max(p.x0+.6,Math.min(p.x1-.6,e.x));e.z=Math.max(p.z0+.6,Math.min(p.z1-.6,e.z));}}}

  // ═══ WEATHER (Session F) ═════════════════════════════════════════════
  // Visual and sound. A weather state per stay: clear, overcast, fog,
  // rain, storm, snow — picked by the climate and biome under the player,
  // held for a few real minutes, then blended to the next. Rain and snow
  // are Points around the camera; storms flash and thunder; rain/snow/fog
  // thicken the fog (visibility), overcast dims the sun. Particles and the
  // loop stop indoors and in dungeons.
  const WX={type:'clear',next:'clear',k:0,intensity:0,timer:0,rain:null,snow:null,flashT:0,rainG:null,rainSrc:null,windT:0,cover:0,coverPainted:0,coverQ:null,sRain:1,sSnow:1,sFog:1,cold:.4};
  const WX_COL={overcast:0x8a8f96,fog:0xb8bcc0,rain:0x6a717a,storm:0x4a4e56,snow:0xb8c0c8};
  function weatherWeights(){
    const [i,j]=cellOf(px,pz);const cl=climateOfCell(i,j);const b=dominantRegion(px,pz).r.biome;
    let w={clear:.5,overcast:.2,fog:.08,rain:.15,storm:.05,snow:0};
    if(cl==='cold'){w={clear:.35,overcast:.22,fog:.08,rain:.05,storm:.02,snow:.28};}
    else if(cl==='warm'){w={clear:.6,overcast:.14,fog:.03,rain:.1,storm:.1,snow:0};}
    if(typeof seasonWx==='function')seasonWx(w,cl);
    if(b==='fen'||b==='swamp'){w.fog+=.2;w.rain+=.1;w.clear*=.5;}
    if(b==='coast'||b==='dunes'){w.overcast+=.08;w.storm+=.04;}
    if(b==='tundra'){w.snow+=.15;w.clear*=.7;}
    if(b==='wasteland'){w.overcast+=.2;w.clear*=.6;w.snow=0;}
    return w;
  }
  function pickWeather(){const w=weatherWeights();let s=0;for(const k in w)s+=w[k];let r=Math.random()*s;for(const k in w){r-=w[k];if(r<=0)return k;}return 'clear';}
  let _softTex=null;
  function softTex(){if(_softTex)return _softTex;const cv=document.createElement('canvas');cv.width=cv.height=64;const c=cv.getContext('2d');const gr=c.createRadialGradient&&c.createRadialGradient(32,32,0,32,32,32);if(gr&&gr.addColorStop){gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.5,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;}else c.fillStyle='#fff';c.fillRect(0,0,64,64);_softTex=new THREE.CanvasTexture(cv);return _softTex;}
  function mkPoints(n,size,col,op){
    const g=new THREE.BufferGeometry();const p=new Float32Array(n*3),v=new Float32Array(n);
    for(let i=0;i<n;i++){p[i*3]=(Math.random()-.5)*44;p[i*3+1]=Math.random()*24;p[i*3+2]=(Math.random()-.5)*44;v[i]=.6+Math.random()*.8;}
    g.setAttribute('position',new THREE.BufferAttribute(p,3));
    const m=new THREE.PointsMaterial({color:col,size,transparent:true,opacity:op,depthWrite:false,sizeAttenuation:true,fog:false,map:softTex(),alphaTest:.05});
    const pts=new THREE.Points(g,m);pts.frustumCulled=false;pts.userData.v=v;pts.visible=false;sc.add(pts);return pts;
  }
  function ensureWx(){if(!WX.rain){WX.rain=mkPoints(3200,.12,0xcfd9e6,.55);WX.snow=mkPoints(2600,.34,0xffffff,.85);}}
  // v80 S146 — the same storm is not the same everywhere. Each biome carries how hard rain and snow
  // fall on it, how it fogs, and how well it keeps snow on the ground; the value is blended across
  // the regions you stand between, so it changes as you walk rather than at a border.
  const WX_BIO={
    tundra:   {rain:.35,snow:1.75,fog:1.15,cold:1.00},
    moor:     {rain:1.05,snow:1.20,fog:1.40,cold:.62},
    forest:   {rain:1.35,snow:1.00,fog:1.25,cold:.50},
    autumn:   {rain:1.20,snow:.90,fog:1.30,cold:.48},
    fen:      {rain:1.20,snow:.75,fog:1.75,cold:.42},
    swamp:    {rain:1.35,snow:.45,fog:1.85,cold:.28},
    coast:    {rain:1.15,snow:.75,fog:1.35,cold:.38},
    plains:   {rain:1.00,snow:1.00,fog:1.00,cold:.42},
    dunes:    {rain:.30,snow:.05,fog:.45,cold:.04},
    wasteland:{rain:.55,snow:.45,fog:.80,cold:.26},
    wastes:   {rain:.55,snow:.45,fog:.80,cold:.26},
  };
  function wxLocal(k){
    const ws=regionWeights(px,pz);let v=0,w=0;
    for(const e of ws){if(e.w<=0)continue;const t=WX_BIO[e.r.biome]||WX_BIO.plains;v+=(t[k]!=null?t[k]:1)*e.w;w+=e.w;}
    let out=w>0?v/w:1;
    if(k!=='cold'&&worldH(px,pz)<SEA_Y+1.0)out*=1.25; // out on the water there is nothing to break it
    return out;
  }
  function rainLoop(on){
    if(typeof AX==='undefined'||!AX||!sfxGain)return;
    if(on&&!WX.rainSrc){const buf=AX.createBuffer(1,AX.sampleRate*2,AX.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1);const src=AX.createBufferSource();src.buffer=buf;src.loop=true;const f=AX.createBiquadFilter();f.type='bandpass';f.frequency.value=2600;f.Q.value=.5;const g=AX.createGain();g.gain.value=0;src.connect(f);f.connect(g);g.connect(sfxGain);src.start();WX.rainSrc=src;WX.rainG=g;WX.rainF=f;}
  }
  function thunder(delay){setTimeout(()=>{if(typeof sfxNoise==='function'){sfxNoise(1.6,0,0,.28,180);sfxNoise(.9,0,0,.16,90);}},delay*1000);}
  // v80 S146 — repainting the ground for snow: the chunk colour pass already exists for rivers; this
  // queues every loaded chunk and works through a handful a frame so a snowfall doesn't hitch.
  function snowRepaint(){WX.coverPainted=WX.cover;WX.coverQ=[...chunks.values()];snowPaintRibbons();}
  // v80 S147 — roads and footpaths are their own ribbons on a shared material, so they can't be tinted
  // by the material; each keeps a copy of its own colours and is lerped toward snow instead.
  const SNOW_RIBBON=new THREE.Color(0xdfe4e8);const _ribbons=[];
  function snowWatch(geo){if(!geo||!geo.attributes.color)return;geo.userData.baseCol=geo.attributes.color.array.slice();_ribbons.push(geo);if(WX.cover>0)snowPaintRibbon(geo);}
  function snowPaintRibbon(geo){
    const base=geo.userData.baseCol,col=geo.attributes.color;if(!base)return;
    const a=Math.min(.62,WX.cover*.55); // trodden: never as white as the fields
    for(let i=0;i<base.length;i+=3){
      col.array[i]=base[i]+(SNOW_RIBBON.r-base[i])*a;
      col.array[i+1]=base[i+1]+(SNOW_RIBBON.g-base[i+1])*a;
      col.array[i+2]=base[i+2]+(SNOW_RIBBON.b-base[i+2])*a;}
    col.needsUpdate=true;
  }
  function snowPaintRibbons(){for(let i=_ribbons.length-1;i>=0;i--){const g=_ribbons[i];if(!g.attributes||!g.attributes.color){_ribbons.splice(i,1);continue;}snowPaintRibbon(g);}}
